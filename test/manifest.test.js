// -----------------------------------------------------------------------------
// Consistency checks between `gladys-assistant-integration.json` and the code.
// The manifest is validated by the store indexer, but nothing there can know
// which handlers the code actually registers — these tests keep both in sync.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CHECK_ACTION } from '../src/app.js';
import { DEFAULT_CONFIG, HOLIDAY_TYPES, LANGUAGES, SCHOOL_ZONES, WEEKDAYS } from '../src/config.js';
import { COUNTRY_CODES } from '../src/holidays.js';
import { SCENE_ACTIONS } from '../src/scenes.js';
import { TRIGGERS, WIDGET_KEY } from '../src/service.js';
import { DEFAULT_ITEMS, MAX_ITEMS, WIDGETS } from '../src/widgets.js';
import { createWorld } from './helpers/world.js';

const manifest = JSON.parse(
  await readFile(new URL('../gladys-assistant-integration.json', import.meta.url), 'utf8'),
);
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

// Every list of form fields the manifest can declare (same field grammar).
const allFields = [
  ...(manifest.config_schema ?? []),
  ...[
    ...(manifest.actions ?? []),
    ...(manifest.scene_triggers ?? []),
    ...(manifest.scene_actions ?? []),
  ].flatMap((item) => item.fields ?? []),
  ...(manifest.widgets ?? []).flatMap((widget) => widget.settings ?? []),
];

// The handlers the integration actually registers on the SDK.
const registered = await createWorld({ connect: false });
const handlerKeys = (prefix) =>
  Object.keys(registered.gladys.handlers)
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length));

const keysOf = (list) => (list ?? []).map((entry) => entry.key);
const field = (key) => manifest.config_schema.find((entry) => entry.key === key);
const optionValues = (key) => field(key).options.map((option) => option.value);

function minGladysVersion() {
  const match = manifest.gladys_version.match(/>=\s*(\d+)\.(\d+)\.(\d+)/);
  assert.ok(match, 'gladys_version must declare a minimum version');
  return match.slice(1).map(Number);
}

function isAtLeast(version, required) {
  for (let i = 0; i < required.length; i += 1) {
    if (version[i] !== required[i]) {
      return version[i] > required[i];
    }
  }
  return true;
}

test('identity: name, image, cover, transports, category', () => {
  assert.equal(manifest.name, 'Holidays & Workdays');
  assert.equal(manifest.type, 'device');
  assert.match(manifest.docker_image, /^ghcr\.io\/guim31\/gladys-holidays:/);
  assert.equal(
    manifest.cover_image,
    'https://raw.githubusercontent.com/guim31/gladys-holidays/main/cover.png',
  );
  // Holidays are computed locally; the French school holidays come from a cloud API.
  assert.deepEqual(manifest.transports, ['local', 'cloud']);
  assert.deepEqual(manifest.categories, ['services']);
});

test('scene triggers, scene actions and widgets require Gladys >= 5.1.0', () => {
  assert.ok(isAtLeast(minGladysVersion(), [5, 1, 0]), manifest.gladys_version);
});

test('the manifest stays well under the 100 KB the store indexer reads', async () => {
  const bytes = (await readFile(new URL('../gladys-assistant-integration.json', import.meta.url)))
    .length;
  assert.ok(bytes < 80 * 1024, `${bytes} bytes`);
});

test('every manifest action has a registered handler, and vice versa', () => {
  assert.deepEqual(keysOf(manifest.actions), [CHECK_ACTION]);
  assert.deepEqual(handlerKeys('action:'), [CHECK_ACTION]);
});

test('every scene action has a handler, and returns the declared outputs', async (t) => {
  assert.deepEqual(keysOf(manifest.scene_actions), Object.keys(SCENE_ACTIONS));
  assert.deepEqual(handlerKeys('sceneAction:'), Object.keys(SCENE_ACTIONS));
  const world = await createWorld({ config: { school_zone: 'zone_b' } });
  t.after(() => world.app.stop());
  for (const action of manifest.scene_actions) {
    const ack = await world.gladys.fake.sceneAction(action.key, { days_ahead: 1 });
    assert.equal(ack.success, true);
    assert.deepEqual(Object.keys(ack.data.outputs).sort(), keysOf(action.outputs).sort());
    for (const output of action.outputs) {
      assert.equal(typeof ack.data.outputs[output.key], output.type, output.key);
    }
  }
});

test('the scene triggers fired are the declared ones, with their filters and variables', async (t) => {
  assert.deepEqual(keysOf(manifest.scene_triggers).sort(), Object.values(TRIGGERS).sort());
  // Zone B: 17 October 2026 starts the Toussaint holidays (added as a day
  // off here, for the holiday trigger), 31 October is the eve of Toussaint,
  // 1 November is Toussaint and the last day of the school holidays.
  const world = await createWorld({
    config: { school_zone: 'zone_b', extra_days: '2026-10-17' },
    at: '2026-10-16T21:30:00Z',
  });
  t.after(() => world.app.stop());
  await world.runUntil('2026-10-17T00:30:00Z');
  world.clock.set('2026-10-31T22:30:00Z');
  await world.runUntil('2026-11-01T00:30:00Z');
  const fired = new Map(world.gladys.fake.sceneEvents.map((event) => [event.key, event.data]));
  assert.deepEqual([...fired.keys()].sort(), Object.values(TRIGGERS).sort());
  for (const trigger of manifest.scene_triggers) {
    const data = fired.get(trigger.key);
    // Filters match keys of `data`, variables read keys of `data`.
    for (const key of [...keysOf(trigger.fields), ...keysOf(trigger.variables)]) {
      assert.ok(key in data, `${trigger.key}: "${key}" is in the event data`);
    }
    for (const variable of trigger.variables) {
      assert.equal(typeof data[variable.key], variable.type, `${trigger.key}.${variable.key}`);
    }
    // The hour filter: a number the scene author must set (an empty filter
    // would match the 24 events of the day).
    const [hour] = trigger.fields;
    assert.equal(hour.key, 'hour');
    assert.equal(hour.type, 'number');
    assert.equal(hour.required, true);
    assert.equal(typeof data.hour, 'number');
  }
});

test('every widget has a handler, and its settings match the code', () => {
  assert.deepEqual(keysOf(manifest.widgets), [WIDGET_KEY]);
  assert.deepEqual(Object.keys(WIDGETS), [WIDGET_KEY]);
  assert.deepEqual(handlerKeys('widget:'), [WIDGET_KEY]);
  const count = manifest.widgets[0].settings.find((setting) => setting.key === 'count');
  assert.equal(count.default, DEFAULT_ITEMS);
  assert.equal(count.max, MAX_ITEMS);
});

test('config_schema defaults and options stay consistent with the code', () => {
  for (const entry of manifest.config_schema) {
    if (entry.default !== undefined) {
      assert.deepEqual(DEFAULT_CONFIG[entry.key], entry.default, `DEFAULT_CONFIG.${entry.key}`);
    }
  }
  assert.deepEqual(
    Object.keys(DEFAULT_CONFIG).sort(),
    manifest.config_schema
      .filter((entry) => entry.type !== 'section')
      .map((entry) => entry.key)
      .sort(),
  );
  assert.deepEqual(optionValues('language'), LANGUAGES);
  assert.deepEqual(optionValues('holiday_types'), HOLIDAY_TYPES);
  assert.deepEqual(optionValues('workdays'), Object.keys(WEEKDAYS));
  assert.deepEqual(optionValues('school_zone'), Object.keys(SCHOOL_ZONES));
});

test('the country list is the one of date-holidays (scripts/countries.mjs)', () => {
  const countries = optionValues('country');
  assert.deepEqual([...countries].sort(), [...COUNTRY_CODES].sort());
  assert.equal(new Set(countries).size, countries.length);
  assert.equal(countries[0], 'FR');
});

test('section fields are purely presentational', () => {
  const sections = manifest.config_schema.filter((entry) => entry.type === 'section');
  assert.ok(sections.length > 0);
  for (const section of sections) {
    assert.equal(section.required, undefined);
    assert.equal(section.default, undefined);
    assert.ok(!(section.key in DEFAULT_CONFIG));
    for (const link of section.links ?? []) {
      assert.match(link.url, /^https:\/\//);
    }
  }
});

test('number fields have integer bounds and defaults (the form has no step)', () => {
  for (const entry of allFields.filter((f) => f.type === 'number')) {
    for (const key of ['min', 'max', 'default']) {
      if (entry[key] !== undefined) {
        assert.ok(Number.isInteger(entry[key]), `field "${entry.key}".${key}`);
      }
    }
  }
});

test('no secret field anywhere: nothing here is secret', () => {
  assert.ok(allFields.every((entry) => entry.type !== 'secret'));
});

test('the manifest version is the package version, and the image is tagged with it', () => {
  assert.equal(manifest.version, pkg.version);
  assert.ok(manifest.docker_image.endsWith(`:${manifest.version}`));
});

test('the catalog description holds 10 to 100 characters per language', () => {
  for (const [lang, text] of Object.entries(manifest.description)) {
    assert.ok(text.length >= 10 && text.length <= 100, `description.${lang}: ${text.length}`);
  }
});
