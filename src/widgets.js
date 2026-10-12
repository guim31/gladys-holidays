// -----------------------------------------------------------------------------
// Dashboard widget "Upcoming holidays": today and tomorrow at a glance, then
// the next holidays (and school holidays when followed) with the days left.
// Produced from the calendar, not from the device: it works before the device
// is added. Localized from the language of the person looking at it, holiday
// names included when the library has them in that language.
// -----------------------------------------------------------------------------

import { WIDGET_COLORS } from '@gladysassistant/integration-sdk';
import { daysBetween, formatDate } from './dates.js';
import { LANGUAGES } from './config.js';
import { DAY_TEXT, WIDGET_TEXT } from './i18n.js';
import { WIDGET_KEY, holidayName } from './service.js';

export const DEFAULT_ITEMS = 5;
export const MAX_ITEMS = 8; // the core's cap for a card-list in `list` display

function dayTile(label, day, text) {
  const [value, color] = day.holiday
    ? [text.holiday, WIDGET_COLORS.SUCCESS]
    : day.workday
      ? [text.workday, WIDGET_COLORS.NEUTRAL]
      : [text.dayOff, WIDGET_COLORS.INFO];
  return { type: 'value', label, value, color, icon: day.holiday ? 'sun' : 'calendar' };
}

function badge(days, text) {
  if (days <= 0) {
    return { text: text.badgeToday, color: WIDGET_COLORS.SUCCESS };
  }
  if (days === 1) {
    return { text: text.badgeTomorrow, color: WIDGET_COLORS.INFO };
  }
  return { text: text.badgeDays(days), color: WIDGET_COLORS.NEUTRAL };
}

/**
 * The widget content.
 * @param {object} service the HolidayService
 * @param {{ settings?: object, language?: string }} request
 */
export function buildContent(service, { settings = {}, language } = {}) {
  const lang = LANGUAGES.includes(language) ? language : service.config.language;
  const text = WIDGET_TEXT[lang];
  const count = clampCount(settings.count);
  const withSchool = settings.show_school !== false && service.school.enabled;
  const today = service.today();
  const snapshot = service.snapshot(lang);

  const components = [
    dayTile(text.today, snapshot.today, text),
    dayTile(text.tomorrow, snapshot.tomorrow, text),
  ];
  if (withSchool) {
    const school = snapshot.today.school;
    components.push({
      type: 'value',
      label: text.school,
      value: school === undefined ? text.unknown : school ? text.schoolOff : text.schoolOn,
      color: school ? WIDGET_COLORS.INFO : WIDGET_COLORS.NEUTRAL,
      icon: 'book-open',
    });
  }

  const items = service.calendar
    .upcoming(today, count, lang, DAY_TEXT[lang].extraDay)
    .map(({ date, days, holidays }) => ({
      sort: date,
      item: { title: holidayName(holidays), date, badge: badge(days, text) },
    }));
  if (withSchool) {
    for (const period of service.school.upcoming(today)) {
      const resume = service.resumeDate(period.first > today ? period.first : today);
      const ongoing = period.first <= today;
      const long = (date) => formatDate(date, lang, 'long');
      items.push({
        sort: ongoing ? today : period.first,
        item: {
          title: period.name,
          date: period.first,
          badge: ongoing
            ? { text: text.badgeOngoing, color: WIDGET_COLORS.INFO }
            : badge(daysBetween(today, period.first), text),
          description: text.period(long(period.first), long(period.last), long(resume)),
        },
      });
    }
  }
  items.sort((a, b) => a.sort.localeCompare(b.sort));
  const list = items.slice(0, count).map((entry) => entry.item);
  if (list.length > 0) {
    components.push({ type: 'card-list', display: 'list', items: list });
  } else {
    components.push({ type: 'text', variant: 'body', text: text.noHoliday });
  }
  if (withSchool && !service.school.data) {
    components.push({ type: 'text', variant: 'caption', text: text.schoolPending });
  }
  // The clock asks for a refresh at midnight; the TTL is a safety net.
  return { ttl_seconds: 3600, components };
}

function clampCount(value) {
  const count = Math.trunc(Number(value ?? DEFAULT_ITEMS));
  return Number.isFinite(count) ? Math.min(Math.max(count, 1), MAX_ITEMS) : DEFAULT_ITEMS;
}

export const WIDGETS = {
  [WIDGET_KEY]: {
    get: (service, request) => buildContent(service, request),
  },
};
