// -----------------------------------------------------------------------------
// Registers every SDK handler on a GladysIntegration (or the SDK's fake Gladys
// in the tests) and returns the service, so index.js stays a few lines and the
// tests drive the very same wiring.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { SCHOOL_ZONES, WEEKDAYS, normalizeConfig } from './config.js';
import { formatDate } from './dates.js';
import { countryName } from './device.js';
import { COUNTRY_CODES, subdivisionsOf } from './holidays.js';
import { CHECK_TEXT, INIT_FAILED, PROBLEM_TEXT, TYPE_TEXT } from './i18n.js';
import { SCENE_ACTIONS } from './scenes.js';
import { HolidayService } from './service.js';
import { createStore } from './store.js';
import { WIDGETS } from './widgets.js';

const logger = createLogger({ name: 'holidays-app' });

export const CHECK_ACTION = 'check_configuration';

/** The configuration Gladys sent, made complete and valid. */
export function readConfig(raw) {
  return normalizeConfig(raw, COUNTRY_CODES);
}

/**
 * @param {object} gladys GladysIntegration instance
 * @param {object} [options] test seams: store, fetch, now, timeZone, timers
 */
export function registerHandlers(gladys, options = {}) {
  const service = new HolidayService({
    gladys,
    store: options.store ?? createStore(),
    fetch: options.fetch,
    now: options.now,
    timeZone: options.timeZone,
    timers: options.timers ?? true,
  });

  // Resolved once the service has started; every handler waits for it.
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });
  let started = false;
  const whenReady =
    (fn) =>
    async (...args) => {
      await ready;
      return fn(...args);
    };

  gladys.on('connected', async () => {
    try {
      const config = readConfig(await gladys.getConfig());
      if (started) {
        await service.resync(config);
        return;
      }
      started = true;
      await service.start(config);
    } catch (err) {
      logger.error('Initialization failed', err);
      await gladys.setConnectionStatus(false, INIT_FAILED).catch(() => {});
    } finally {
      resolveReady();
    }
  });

  gladys.onScanRequest(whenReady(() => service.publishDevice()));

  gladys.onDeviceCreated(whenReady(() => service.deviceCreated()));

  gladys.onConfigUpdated(whenReady((config) => service.reconfigure(readConfig(config))));

  gladys.onAction(
    CHECK_ACTION,
    whenReady(async () => {
      await service.school.refresh({ force: true });
      await service.updateStatus();
      return checkMessage(service);
    }),
  );

  for (const [key, handler] of Object.entries(SCENE_ACTIONS)) {
    gladys.onSceneAction(
      key,
      whenReady((fields) => handler(service, { fields })),
    );
  }

  for (const [key, widget] of Object.entries(WIDGETS)) {
    gladys.onWidgetGet(
      key,
      whenReady((request) => widget.get(service, request)),
    );
  }

  return { service, ready, stop: () => service.stop() };
}

/** The report of "Check the configuration", one text per language. */
export function checkMessage(service) {
  return Object.fromEntries(
    Object.keys(CHECK_TEXT).map((language) => [language, checkReport(service, language)]),
  );
}

function checkReport(service, language) {
  const text = CHECK_TEXT[language];
  const { config, calendar, school } = service;
  const country = countryName(config.country, language);
  const subdivisions = subdivisionsOf(config.country);
  const lines = [];

  const subdivision =
    calendar.subdivisionValid && calendar.state
      ? `${config.subdivision} (${subdivisions[calendar.state]})`
      : '';
  lines.push(text.calendar(country, subdivision));
  lines.push(text.types(config.holiday_types.map((type) => TYPE_TEXT[language][type]).join(', ')));
  const dayNames = Object.keys(WEEKDAYS)
    .filter((day) => config.workdays.includes(day))
    .map((day) => weekdayName(WEEKDAYS[day], language));
  lines.push(text.workdays(dayNames.join(', ')));

  const snapshot = service.snapshot(language);
  lines.push(
    snapshot.next
      ? text.next(
          snapshot.next.name,
          formatDate(snapshot.next.date, language, 'long'),
          snapshot.next.days,
        )
      : text.noHoliday,
  );

  if (school.enabled && school.data) {
    const zone = SCHOOL_ZONES[config.school_zone];
    lines.push(
      text.school(
        zone,
        formatDate(school.data.covered_until, language, 'long'),
        formatDate(school.data.fetched_at.slice(0, 10), language, 'long'),
      ),
    );
    const [next] = school.upcoming(service.today());
    if (next) {
      lines.push(
        text.schoolNext(
          next.name,
          formatDate(next.first, language, 'long'),
          formatDate(next.last, language, 'long'),
        ),
      );
    }
  } else if (!school.enabled) {
    lines.push(text.schoolOff);
  }

  const problems = service.problems();
  if (problems.length > 0) {
    lines.push('', text.problems);
    for (const { key, value } of problems) {
      lines.push(`- ${PROBLEM_TEXT[language][key](value)}`);
    }
  } else {
    lines.push('', text.ok);
  }

  // The codes, when the subdivision is wrong or still empty and the country has some.
  if (!calendar.subdivisionValid || !config.subdivision) {
    const codes = Object.entries(subdivisions);
    lines.push(
      '',
      codes.length > 0
        ? text.codes(country, codes.map(([code, name]) => `${code} ${name}`).join(', '))
        : text.noCodes(country),
    );
  }
  return lines.join('\n');
}

function weekdayName(dayNumber, language) {
  // 2023-01-01 was a Sunday (day 0).
  const date = new Date(Date.UTC(2023, 0, 1 + dayNumber));
  return new Intl.DateTimeFormat(language, { weekday: 'long', timeZone: 'UTC' }).format(date);
}
