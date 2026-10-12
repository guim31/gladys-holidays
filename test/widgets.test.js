// -----------------------------------------------------------------------------
// The "Upcoming holidays" widget: content within the core vocabulary and
// budget (validateWidgetContent of the SDK), localized by the language of the
// viewer, school holidays mixed in by date.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWidgetContent } from '@gladysassistant/integration-sdk';
import { createWorld, fakeEducationApi } from './helpers/world.js';

async function content(world, request) {
  const ack = await world.gladys.fake.widgetGet('upcoming', request);
  assert.equal(ack.success, true, ack.error);
  return ack.data.content;
}

test('today, tomorrow and the next holidays, within the core budget, in four languages', async (t) => {
  const world = await createWorld({ config: { country: 'FR' }, at: '2026-12-24T10:00:00Z' });
  t.after(() => world.app.stop());
  for (const language of ['en', 'fr', 'de', 'es']) {
    const widget = await content(world, { settings: {}, language, units: 'metric' });
    assert.deepEqual(validateWidgetContent(widget), [], language);
  }
  const fr = await content(world, { settings: {}, language: 'fr' });
  const [today, tomorrow, list] = fr.components;
  assert.deepEqual([today.label, today.value], ["Aujourd'hui", 'Jour ouvré']);
  assert.deepEqual([tomorrow.label, tomorrow.value], ['Demain', 'Férié']);
  assert.deepEqual(
    list.items.map((item) => [item.title, item.date, item.badge.text]),
    [
      ['Noël', '2026-12-25', 'Demain'],
      ['Nouvel An', '2027-01-01', 'Dans 8 jours'],
      ['Lundi de Pâques', '2027-03-29', 'Dans 95 jours'],
      ['Fête du travail', '2027-05-01', 'Dans 128 jours'],
      ['Ascension', '2027-05-06', 'Dans 133 jours'],
    ],
  );
  const es = await content(world, { settings: { count: 2 }, language: 'es' });
  assert.deepEqual(
    es.components.at(-1).items.map((item) => item.title),
    ['Navidad', 'Año Nuevo'],
  );
});

test('school holidays are mixed in by date, with a detail panel', async (t) => {
  const world = await createWorld({
    config: { country: 'FR', school_zone: 'zone_c' },
    at: '2026-10-20T10:00:00Z',
  });
  t.after(() => world.app.stop());
  const widget = await content(world, { settings: { count: 3 }, language: 'en' });
  assert.deepEqual(validateWidgetContent(widget), []);
  const school = widget.components.find((component) => component.label === 'School');
  assert.equal(school.value, 'Holidays');
  const list = widget.components.find((component) => component.type === 'card-list');
  assert.deepEqual(
    list.items.map((item) => [item.title, item.badge.text]),
    [
      ['Vacances de la Toussaint', 'Ongoing'],
      ["All Saints' Day", 'In 12 days'],
      ['Armistice Day', 'In 22 days'],
    ],
  );
  assert.equal(
    list.items[0].description,
    'From Saturday, October 17, 2026 to Sunday, November 1, 2026. Back to school on Monday, November 2, 2026.',
  );
  // The setting hides them.
  const hidden = await content(world, { settings: { show_school: false }, language: 'en' });
  assert.ok(!hidden.components.some((component) => component.label === 'School'));
});

test('a school zone not read yet says so instead of guessing', async (t) => {
  const world = await createWorld({
    config: { country: 'FR', school_zone: 'zone_a' },
    api: fakeEducationApi({ fail: true }),
  });
  t.after(() => world.app.stop());
  const widget = await content(world, { settings: {}, language: 'de' });
  assert.deepEqual(validateWidgetContent(widget), []);
  assert.equal(widget.components.find((c) => c.label === 'Schule').value, '?');
  assert.match(widget.components.at(-1).text, /Schulferien noch nicht gelesen/);
});

test('a calendar without holidays ahead shows a sentence, not an empty list', async (t) => {
  const world = await createWorld({ config: { country: 'FR', holiday_types: [] } });
  t.after(() => world.app.stop());
  const widget = await content(world, { settings: {}, language: 'fr' });
  assert.deepEqual(validateWidgetContent(widget), []);
  assert.equal(widget.components.at(-1).text, "Aucun jour férié dans l'année qui vient.");
});

test('the widget is refreshed at midnight', async (t) => {
  const world = await createWorld({ config: { country: 'FR' }, at: '2026-10-12T21:59:00Z' });
  t.after(() => world.app.stop());
  const before = world.gladys.fake.widgetRefreshes.length;
  await world.runUntil('2026-10-12T22:00:30Z');
  assert.equal(world.gladys.fake.widgetRefreshes.length, before + 1);
});
