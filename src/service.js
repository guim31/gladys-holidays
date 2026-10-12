// -----------------------------------------------------------------------------
// The heart of the integration: the calendar of the configured country, the
// French school holidays when followed, and the clock that turns them into
// device states and scene events.
//
// The clock ticks every minute and works in the time zone of Gladys:
// - a new local day republishes EVERY state, unchanged ones included. Gladys
//   flags a value older than 48 hours as "no recent value", and "holiday
//   today: Off" stays the same for weeks;
// - a new local hour fires the scene triggers of that hour (their `hour`
//   filter is an equality: the event carries the hour). On the spring-forward
//   night the skipped hour never fires; on the fall-back night the repeated
//   hour fires once.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { addDays, formatDate, localSlot, processTimeZone } from './dates.js';
import { buildDevice, buildStates } from './device.js';
import { HolidayCalendar } from './holidays.js';
import { DAY_TEXT, PROBLEM_TEXT, inEveryLanguage } from './i18n.js';
import { SchoolHolidays } from './school.js';

const logger = createLogger({ name: 'holidays' });

export const WIDGET_KEY = 'upcoming';

// Trigger keys are forever: scenes store them.
export const TRIGGERS = {
  HOLIDAY: 'public_holiday',
  HOLIDAY_EVE: 'holiday_eve',
  SCHOOL_START: 'school_holidays_start',
  SCHOOL_END: 'school_holidays_end',
};

// After a restart, the hour just begun is still fired when the container is
// back within these minutes and that hour was not fired before the restart.
const CATCH_UP_MINUTES = 10;
const SCHEDULER_FILE = 'scheduler.json';

export class HolidayService {
  /**
   * @param {object} options
   * @param {object} options.gladys the SDK client
   * @param {object} options.store JSON files in /data (src/store.js)
   * @param {Function} [options.fetch] for the school calendar (tests)
   * @param {Function} [options.now] the clock (tests)
   * @param {string} [options.timeZone] Gladys' time zone (default: TZ)
   * @param {boolean} [options.timers] false in the tests: they call tick()
   */
  constructor({ gladys, store, fetch, now = Date.now, timeZone, timers = true }) {
    this.gladys = gladys;
    this.store = store;
    this.now = now;
    this.timeZone = timeZone ?? processTimeZone();
    this.timers = timers;
    this.school = new SchoolHolidays({ store, fetch, now });
    this.config = null;
    this.calendar = null;
    this.currentDate = null;
    this.lastSlot = null;
    this.timer = null;
    this.queue = Promise.resolve();
  }

  // One operation at a time: a tick never interleaves with a reconfiguration.
  serial(fn) {
    const run = this.queue.then(fn);
    this.queue = run.catch(() => {});
    return run;
  }

  /** Today in Gladys' time zone. */
  today() {
    return localSlot(this.now(), this.timeZone).date;
  }

  start(config) {
    return this.serial(async () => {
      this.applyConfig(config);
      const slot = localSlot(this.now(), this.timeZone);
      this.currentDate = slot.date;
      const key = slotKey(slot);
      const fired = this.store.load(SCHEDULER_FILE)?.slot ?? null;
      await this.school.refresh();
      await this.publishDevice();
      await this.publishDay({ force: true });
      await this.updateStatus();
      this.refreshWidget();
      if (fired !== key && slot.minute < CATCH_UP_MINUTES) {
        await this.fireSlot(slot);
      } else {
        this.lastSlot = key;
      }
      this.schedule();
    });
  }

  /** The configuration changed: new calendar, maybe a new device. */
  reconfigure(config) {
    return this.serial(async () => {
      this.applyConfig(config);
      await this.school.refresh();
      await this.publishDevice();
      await this.publishDay({ force: true });
      await this.updateStatus();
      this.refreshWidget();
    });
  }

  /** Gladys came back (restart): it may have lost what was sent meanwhile. */
  resync(config) {
    return this.serial(async () => {
      this.applyConfig(config);
      await this.publishDevice();
      await this.publishDay({ force: true });
      await this.updateStatus();
      this.refreshWidget();
    });
  }

  /** The user added the calendar: its states were dropped until now. */
  deviceCreated() {
    return this.serial(async () => {
      // The SDK already forgot the states of a created device.
      await this.publishDay();
      this.refreshWidget();
    });
  }

  applyConfig(config) {
    this.config = config;
    this.calendar = new HolidayCalendar(config);
    this.school.setZone(config.school_zone);
  }

  stop() {
    clearTimeout(this.timer);
    this.timer = null;
    return this.queue;
  }

  schedule() {
    if (!this.timers) {
      return;
    }
    clearTimeout(this.timer);
    // Just after the next minute, so a new hour is seen within a second.
    const delay = 60_000 - (this.now() % 60_000) + 500;
    this.timer = setTimeout(() => {
      this.tick()
        .catch((err) => logger.error('Clock tick failed', err))
        .finally(() => this.schedule());
    }, delay);
    this.timer.unref?.();
  }

  /** One step of the clock: a new day, a new hour, a school calendar due. */
  tick() {
    return this.serial(async () => {
      const slot = localSlot(this.now(), this.timeZone);
      let changed = false;
      if (slot.date !== this.currentDate) {
        this.currentDate = slot.date;
        changed = true;
      }
      if (this.school.isDue()) {
        changed = (await this.school.refresh()) || changed;
        await this.updateStatus();
      }
      if (changed) {
        await this.publishDay({ force: true });
        this.refreshWidget();
      }
      if (slotKey(slot) !== this.lastSlot) {
        await this.fireSlot(slot);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // What a day is
  // ---------------------------------------------------------------------------

  /**
   * @param {string} date 'YYYY-MM-DD'
   * @param {string} [language] holiday names in this language when known
   * @returns {{ date, holidays, holiday: boolean, workday: boolean,
   *   school: boolean|undefined, period: object|null|undefined }}
   */
  day(date, language = this.config.language) {
    const holidays = this.calendar.holidaysOn(date, language, DAY_TEXT[language].extraDay);
    const period = this.school.periodOn(date);
    return {
      date,
      holidays,
      holiday: holidays.length > 0,
      workday: this.calendar.isWorkday(date),
      school: period === undefined ? undefined : period !== null,
      period,
    };
  }

  /** Today and tomorrow, the next holiday, and the "Today" text. */
  snapshot(language = this.config.language) {
    const date = this.today();
    const today = this.day(date, language);
    const tomorrow = this.day(addDays(date, 1), language);
    const next = this.calendar.nextHoliday(date, language, DAY_TEXT[language].extraDay);
    const text = DAY_TEXT[language];
    let summary = today.holiday
      ? holidayName(today.holidays)
      : today.workday
        ? text.workday
        : text.dayOff;
    if (today.school === true) {
      summary = `${summary} · ${text.school}`;
    }
    return {
      today,
      tomorrow,
      next: next ? { date: next.date, days: next.days, name: holidayName(next.holidays) } : null,
      daysUntilWorkday: this.calendar.daysUntilWorkday(date),
      summary,
    };
  }

  /** Configuration problems: { key, value } entries (texts in PROBLEM_TEXT). */
  problems() {
    const found = [...this.config.problems];
    if (!this.calendar.subdivisionValid) {
      found.push({ key: 'unknownSubdivision', value: this.config.subdivision });
    }
    if (this.school.enabled && !this.school.data) {
      found.push({ key: 'schoolUnavailable' });
    }
    return found;
  }

  // ---------------------------------------------------------------------------
  // Gladys side
  // ---------------------------------------------------------------------------

  async publishDevice() {
    const subdivision = this.calendar.subdivisionValid ? this.config.subdivision : '';
    await this.gladys.publishDiscoveredDevices([
      buildDevice(this.gladys, this.config, { subdivision }),
    ]);
  }

  /**
   * Publishes the states of the day: the changed ones, or all of them once a
   * day (`force`). A failure is logged: the next publication sends again
   * what Gladys did not accept.
   */
  async publishDay({ force = false } = {}) {
    if (force) {
      this.gladys.forgetPublishedStates();
    }
    const states = buildStates(this.gladys, this.config, this.snapshot());
    try {
      await this.gladys.publishChangedStates(states);
    } catch (err) {
      logger.warn(`Could not publish the states: ${err.message}`);
    }
  }

  async updateStatus() {
    const problems = this.problems();
    const message =
      problems.length === 0
        ? undefined
        : inEveryLanguage(PROBLEM_TEXT, (text) =>
            problems.map(({ key, value }) => text[key](value)).join(' '),
          );
    try {
      await this.gladys.setConnectionStatus(problems.length === 0, message);
    } catch (err) {
      logger.warn(`Could not report the status: ${err.message}`);
    }
  }

  refreshWidget() {
    try {
      // Fire-and-forget, rate-limited by the core: never awaited.
      Promise.resolve(this.gladys.requestWidgetRefresh(WIDGET_KEY)).catch(() => {});
    } catch {
      // Disconnected: the widget refetches on its own TTL.
    }
  }

  /** Fires the scene triggers of an hour, then remembers it was done. */
  async fireSlot(slot) {
    this.lastSlot = slotKey(slot);
    this.store.save(SCHEDULER_FILE, { slot: this.lastSlot });
    for (const event of this.events(slot)) {
      try {
        await this.gladys.publishSceneEvent(event.key, event.data);
      } catch (err) {
        logger.warn(`Could not fire ${event.key}: ${err.message}`);
      }
    }
  }

  /**
   * The scene events of an hour. Each carries the hour, the filter the scene
   * author picked: a scene runs at the hour it chose, once.
   */
  events({ date, hour }) {
    const language = this.config.language;
    const long = (day) => formatDate(day, language, 'long');
    const yesterday = this.day(addDays(date, -1));
    const today = this.day(date);
    const tomorrow = this.day(addDays(date, 1));
    const base = { hour };
    const events = [];
    if (today.holiday) {
      events.push({
        key: TRIGGERS.HOLIDAY,
        data: { ...base, holiday_name: holidayName(today.holidays), date: long(date) },
      });
    }
    if (tomorrow.holiday) {
      events.push({
        key: TRIGGERS.HOLIDAY_EVE,
        data: {
          ...base,
          holiday_name: holidayName(tomorrow.holidays),
          date: long(tomorrow.date),
          // Days off in a row from tomorrow on: 3 for a long weekend.
          days_off: this.calendar.daysUntilWorkday(tomorrow.date) ?? 0,
        },
      });
    }
    // A school day before and a day off now: the holidays start. Unknown days
    // (data not published that far) never fire.
    if (today.school === true && yesterday.school === false) {
      events.push({ key: TRIGGERS.SCHOOL_START, data: { ...base, ...this.periodData(today) } });
    }
    if (today.school === true && tomorrow.school === false) {
      events.push({ key: TRIGGERS.SCHOOL_END, data: { ...base, ...this.periodData(today) } });
    }
    return events;
  }

  periodData(day) {
    const language = this.config.language;
    const resume = this.resumeDate(day.date);
    return {
      holiday_name: day.period.name,
      last_day: formatDate(addDays(resume, -1), language, 'long'),
      return_date: formatDate(resume, language, 'long'),
    };
  }

  /** The first school day after a day off (periods may follow each other). */
  resumeDate(date) {
    let day = date;
    for (let guard = 0; guard < 120 && this.school.periodOn(day); guard += 1) {
      day = addDays(day, 1);
    }
    return day;
  }
}

/** The name of a day with several holidays: "Easter Monday / Bank holiday". */
export function holidayName(holidays) {
  return [...new Set(holidays.map((holiday) => holiday.name))].join(' / ');
}

function slotKey({ date, hour }) {
  return `${date}T${String(hour).padStart(2, '0')}`;
}
