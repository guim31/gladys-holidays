// -----------------------------------------------------------------------------
// The calendar device: one per country, read in the dashboard and, above all,
// in scene conditions ("only continue if today is a workday"). Booleans are
// `input/binary` (On/Off in the dashboard and in the scene editor: the only
// binary category without an alarm color or a missing label). Every feature
// shares its type with another one: Gladys shows the generic label of the
// type instead of the feature name when a feature is alone of its type.
// -----------------------------------------------------------------------------

import { NAMES } from './i18n.js';
import { SEARCH_DAYS } from './holidays.js';

const BINARY = { category: 'input', type: 'binary', min: 0, max: 1 };
const DAYS = { category: 'duration', type: 'integer', unit: 'days', min: 0, max: SEARCH_DAYS };
const TEXT = { category: 'text', type: 'text', min: 0, max: 0 };

// Feature keys are forever (Gladys keys history and scenes on them).
export const FEATURES = [
  { key: 'holiday_today', ...BINARY },
  { key: 'holiday_tomorrow', ...BINARY },
  { key: 'workday_today', ...BINARY },
  { key: 'workday_tomorrow', ...BINARY },
  { key: 'school_holiday_today', ...BINARY, school: true },
  { key: 'school_holiday_tomorrow', ...BINARY, school: true },
  { key: 'days_until_holiday', ...DAYS },
  { key: 'days_until_workday', ...DAYS },
  { key: 'next_holiday', ...TEXT },
  { key: 'today', ...TEXT },
];

const regionNames = new Map();

/** The name of a country in a language ("Allemagne"), its code when unknown. */
export function countryName(code, language) {
  let names = regionNames.get(language);
  if (!names) {
    names = new Intl.DisplayNames([language], { type: 'region' });
    regionNames.set(language, names);
  }
  try {
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

/** The ids of the calendar of a country: one device per country. */
export function deviceIds(gladys, country) {
  return gladys.externalIds('calendar', country.toLowerCase());
}

/**
 * @param {object} gladys the SDK client
 * @param {object} config a normalized configuration
 * @param {object} [extra] { subdivision } the resolved subdivision, for params
 */
export function buildDevice(gladys, config, { subdivision = '' } = {}) {
  const ids = deviceIds(gladys, config.country);
  const names = NAMES[config.language];
  const school = config.school_zone !== 'none';
  return {
    name: names.device(countryName(config.country, config.language)),
    external_id: ids.device,
    should_poll: false,
    params: [
      { name: 'country', value: config.country },
      { name: 'subdivision', value: subdivision || '-' },
    ],
    features: FEATURES.filter((feature) => school || !feature.school).map(
      ({ key, category, type, unit, min, max }) => ({
        name: names[key],
        external_id: ids.feature(key),
        category,
        type,
        ...(unit ? { unit } : {}),
        min,
        max,
        read_only: true,
        has_feedback: false,
      }),
    ),
  };
}

/**
 * The states of the device for a day.
 * @param {object} gladys the SDK client
 * @param {object} config a normalized configuration
 * @param {object} day the day summary of the service (src/service.js)
 * @returns {object[]} publishStates entries; a value the integration does not
 *   know (school data beyond what is published) is left out, never guessed
 */
export function buildStates(gladys, config, day) {
  const ids = deviceIds(gladys, config.country);
  const states = [];
  const number = (key, value) => {
    if (value !== null && value !== undefined) {
      states.push({ device_feature_external_id: ids.feature(key), state: Number(value) });
    }
  };
  const text = (key, value) => {
    if (value) {
      states.push({ device_feature_external_id: ids.feature(key), text: value });
    }
  };
  number('holiday_today', day.today.holiday);
  number('holiday_tomorrow', day.tomorrow.holiday);
  number('workday_today', day.today.workday);
  number('workday_tomorrow', day.tomorrow.workday);
  if (config.school_zone !== 'none') {
    number('school_holiday_today', day.today.school);
    number('school_holiday_tomorrow', day.tomorrow.school);
  }
  number('days_until_holiday', day.next?.days);
  number('days_until_workday', day.daysUntilWorkday);
  text('next_holiday', day.next?.name);
  text('today', day.summary);
  return states;
}
