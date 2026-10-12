// -----------------------------------------------------------------------------
// The calendars, computed offline, checked against the official lists of
// holidays (legal texts and government pages) for several countries and
// years: France with Easter, Whit Monday and Alsace-Moselle, Bavaria and
// Berlin, the United States with observed days, Quebec, Belgium, Switzerland.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig } from '../src/config.js';
import { HolidayCalendar, resolveSubdivision } from '../src/holidays.js';
import { addDays } from '../src/dates.js';

const calendar = (config) => new HolidayCalendar(normalizeConfig(config));

/** Every holiday date of a year, as 'MM-DD'. */
function holidayDates(cal, year) {
  const dates = [];
  for (let date = `${year}-01-01`; date.startsWith(String(year)); date = addDays(date, 1)) {
    if (cal.isHoliday(date)) {
      dates.push(date.slice(5));
    }
  }
  return dates;
}

const FRANCE_2026 = [
  '01-01',
  '04-06',
  '05-01',
  '05-08',
  '05-14',
  '05-25',
  '07-14',
  '08-15',
  '11-01',
  '11-11',
  '12-25',
];

test('France 2026: the eleven public holidays, Easter Monday and Whit Monday moving with Easter', () => {
  assert.deepEqual(holidayDates(calendar({ country: 'FR' }), 2026), FRANCE_2026);
});

test('France 2027: Easter on 28 March moves Easter Monday, Ascension and Whit Monday', () => {
  assert.deepEqual(holidayDates(calendar({ country: 'FR' }), 2027), [
    '01-01',
    '03-29',
    '05-01',
    '05-06',
    '05-08',
    '05-17',
    '07-14',
    '08-15',
    '11-01',
    '11-11',
    '12-25',
  ]);
});

test('Alsace-Moselle adds Good Friday and Saint Stephen in the three départements', () => {
  for (const subdivision of ['57', '67', '68']) {
    const cal = calendar({ country: 'FR', subdivision, language: 'fr' });
    assert.ok(cal.isHoliday('2026-04-03'), `${subdivision}: Good Friday 2026`);
    assert.ok(cal.isHoliday('2027-03-26'), `${subdivision}: Good Friday 2027`);
    assert.ok(cal.isHoliday('2026-12-26'), `${subdivision}: Saint Stephen`);
    assert.equal(cal.holidaysOn('2026-12-26')[0].name, 'Lendemain de Noël');
  }
  const paris = calendar({ country: 'FR' });
  assert.ok(!paris.isHoliday('2026-04-03') && !paris.isHoliday('2026-12-26'));
});

test('Bavaria: Epiphany and Corpus Christi; the Assumption only in Catholic municipalities', () => {
  const bavaria = calendar({ country: 'DE', subdivision: 'BY' });
  assert.deepEqual(holidayDates(bavaria, 2026), [
    '01-01',
    '01-06',
    '04-03',
    '04-06',
    '05-01',
    '05-14',
    '05-25',
    '06-04',
    '10-03',
    '11-01',
    '12-25',
    '12-26',
  ]);
  assert.ok(!bavaria.isHoliday('2026-08-15'));
  assert.ok(calendar({ country: 'DE', subdivision: 'BY-KATH' }).isHoliday('2026-08-15'));
  // Berlin has Women's Day, and neither Epiphany nor Corpus Christi.
  const berlin = calendar({ country: 'DE', subdivision: 'BE' });
  assert.ok(berlin.isHoliday('2026-03-08'));
  assert.ok(!berlin.isHoliday('2026-01-06') && !berlin.isHoliday('2026-06-04'));
  // Christmas Eve is a bank holiday from 14:00: only when bank holidays count.
  assert.ok(!bavaria.isHoliday('2026-12-24'));
  assert.ok(
    calendar({ country: 'DE', subdivision: 'BY', holiday_types: ['public', 'bank'] }).isHoliday(
      '2026-12-24',
    ),
  );
});

test('United States: a holiday on a weekend is observed on the closest weekday', () => {
  const us = calendar({ country: 'US', language: 'en' });
  // 4 July 2026 is a Saturday: observed on Friday 3 July.
  assert.equal(us.holidaysOn('2026-07-03')[0].name, 'Independence Day (substitute day)');
  assert.ok(!us.isWorkday('2026-07-03'));
  // 4 July 2027 is a Sunday: observed on Monday 5 July.
  assert.ok(us.isHoliday('2027-07-05'));
  // Thanksgiving, fourth Thursday of November.
  assert.ok(us.isHoliday('2026-11-26') && us.isHoliday('2027-11-25'));
  // New Year's Day 2028 is a Saturday: observed on Friday 31 December 2027.
  assert.ok(us.isHoliday('2027-12-31'));
});

test('Quebec: Fête nationale and Journée nationale des patriotes, Good Friday, no Easter Monday', () => {
  const quebec = calendar({ country: 'CA', subdivision: 'QC', language: 'fr' });
  assert.equal(quebec.holidaysOn('2026-06-24')[0].name, 'Fête nationale du Québec');
  assert.equal(quebec.holidaysOn('2026-05-18')[0].name, 'Journée nationale des patriotes');
  assert.ok(quebec.isHoliday('2026-04-03'));
  assert.ok(!quebec.isHoliday('2026-04-06'));
  assert.ok(quebec.isHoliday('2026-07-01'));
});

test('Belgium: national day on 21 July, Armistice, Whit Monday', () => {
  const belgium = calendar({ country: 'BE', language: 'fr' });
  assert.deepEqual(holidayDates(belgium, 2026), [
    '01-01',
    '04-06',
    '05-01',
    '05-14',
    '05-25',
    '07-21',
    '08-15',
    '11-01',
    '11-11',
    '12-25',
  ]);
});

test('Switzerland: cantons differ (Berchtold Day and Federal Fast Monday in Vaud, Saint Stephen in Zurich)', () => {
  const vaud = calendar({ country: 'CH', subdivision: 'VD', language: 'fr' });
  assert.ok(vaud.isHoliday('2026-01-02'));
  assert.equal(vaud.holidaysOn('2026-09-21')[0].name, 'Lundi du Jeûne Fédéral');
  assert.ok(vaud.isHoliday('2026-08-01'));
  const zurich = calendar({ country: 'CH', subdivision: 'ZH' });
  assert.ok(zurich.isHoliday('2026-12-26') && !zurich.isHoliday('2026-09-21'));
});

test('a multi-day holiday covers each of its days', () => {
  // Eid al-Fitr lasts three days in the United Arab Emirates.
  const emirates = calendar({ country: 'AE' });
  const eid = ['2026-03-20', '2026-03-21', '2026-03-22'];
  for (const date of eid) {
    assert.ok(emirates.isHoliday(date), date);
  }
  assert.ok(!emirates.isHoliday('2026-03-23'));
});

test('holiday names follow the language, with the official one when the library lacks it', () => {
  const germany = calendar({ country: 'DE', subdivision: 'BY' });
  assert.equal(germany.holidaysOn('2026-12-25', 'de')[0].name, '1. Weihnachtstag');
  assert.equal(calendar({ country: 'FR' }).holidaysOn('2026-12-25', 'es')[0].name, 'Navidad');
  assert.equal(
    calendar({ country: 'FR' }).holidaysOn('2026-07-14', 'fr')[0].name,
    'Fête Nationale de la France',
  );
});

test('workdays follow the chosen days of the week and skip holidays', () => {
  const office = calendar({ country: 'FR' });
  assert.ok(office.isWorkday('2026-10-12')); // Monday
  assert.ok(!office.isWorkday('2026-10-17')); // Saturday
  assert.ok(!office.isWorkday('2026-11-11')); // Armistice, a Wednesday
  const shop = calendar({ country: 'FR', workdays: ['tue', 'wed', 'thu', 'fri', 'sat'] });
  assert.ok(!shop.isWorkday('2026-10-12') && shop.isWorkday('2026-10-17'));
  const none = calendar({ country: 'FR', workdays: [] });
  assert.equal(none.daysUntilWorkday('2026-10-12'), null);
});

test('days until the next workday count a long weekend', () => {
  const france = calendar({ country: 'FR' });
  // Ascension 2026 is Thursday 14 May; Friday 15 is a workday.
  assert.equal(france.daysUntilWorkday('2026-05-14'), 1);
  // With the bridge added, Thursday to Sunday are off: Monday is 4 days away.
  const bridge = calendar({ country: 'FR', extra_days: '2026-05-15=Pont' });
  assert.equal(bridge.daysUntilWorkday('2026-05-14'), 4);
  assert.deepEqual(bridge.holidaysOn('2026-05-15'), [{ name: 'Pont', type: 'extra', extra: true }]);
});

test('extra days: a date, a day of every year, with or without a name', () => {
  const cal = calendar({
    country: 'FR',
    extra_days: '2026-05-15=Pont de l’Ascension; 12-24, 2027-12-31',
  });
  assert.equal(cal.holidaysOn('2026-05-15')[0].name, 'Pont de l’Ascension');
  assert.equal(cal.holidaysOn('2026-12-24', 'fr', 'Jour chômé')[0].name, 'Jour chômé');
  assert.ok(cal.isHoliday('2030-12-24'));
  assert.ok(cal.isHoliday('2027-12-31') && !cal.isHoliday('2026-12-31'));
});

test('holidays worked: by name in any language, by date, or every year', () => {
  // The journée de solidarité: Whit Monday worked, whatever its date.
  for (const name of ['Lundi de Pentecôte', 'lundi de pentecote', 'Whit Monday', 'Pfingstmontag']) {
    const cal = calendar({ country: 'FR', ignored_holidays: name, language: 'fr' });
    assert.ok(!cal.isHoliday('2026-05-25'), `${name} 2026`);
    assert.ok(!cal.isHoliday('2027-05-17'), `${name} 2027`);
    assert.ok(cal.isWorkday('2026-05-25'), `${name}: a Monday worked`);
    assert.ok(cal.isHoliday('2026-05-14'), `${name}: Ascension stays`);
  }
  const byDate = calendar({ country: 'FR', ignored_holidays: '2026-11-11, 08-15' });
  assert.ok(!byDate.isHoliday('2026-11-11') && byDate.isHoliday('2027-11-11'));
  assert.ok(!byDate.isHoliday('2026-08-15') && !byDate.isHoliday('2027-08-15'));
});

test('the next holiday and the upcoming list', () => {
  const france = calendar({ country: 'FR', language: 'fr' });
  const next = france.nextHoliday('2026-10-12', 'fr');
  assert.deepEqual(
    { date: next.date, days: next.days, name: next.holidays[0].name },
    { date: '2026-11-01', days: 20, name: 'Toussaint' },
  );
  assert.equal(france.nextHoliday('2026-11-01', 'fr').days, 0);
  assert.deepEqual(
    france.upcoming('2026-12-20', 3, 'fr').map(({ date, days }) => [date, days]),
    [
      ['2026-12-25', 5],
      ['2027-01-01', 12],
      ['2027-03-29', 99],
    ],
  );
});

test('only public holidays count by default; other types are opt-in', () => {
  const france = calendar({ country: 'FR' });
  // Whit Sunday and Mother's Day are observances in the library.
  assert.ok(!france.isHoliday('2026-05-24') && !france.isHoliday('2026-05-31'));
  const all = calendar({ country: 'FR', holiday_types: ['public', 'observance'] });
  assert.ok(all.isHoliday('2026-05-24') && all.isHoliday('2026-05-31'));
});

test('subdivisions: codes are checked, a region may follow its state', () => {
  assert.deepEqual(resolveSubdivision('FR', '67'), { state: '67', region: null, valid: true });
  assert.deepEqual(resolveSubdivision('DE', 'by-kath'), {
    state: 'BY',
    region: 'KATH',
    valid: true,
  });
  assert.equal(resolveSubdivision('DE', 'BY.A').valid, true);
  assert.equal(resolveSubdivision('FR', 'XX').valid, false);
  assert.equal(resolveSubdivision('DE', 'BY-ZZ').valid, false);
  assert.equal(resolveSubdivision('FR', '').valid, true);
  // An unknown subdivision keeps the national holidays (and is reported).
  const typo = calendar({ country: 'FR', subdivision: '99' });
  assert.equal(typo.subdivisionValid, false);
  assert.deepEqual(holidayDates(typo, 2026), FRANCE_2026);
});
