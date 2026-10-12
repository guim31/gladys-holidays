// -----------------------------------------------------------------------------
// The "Check a date" scene action: today, tomorrow or a day of the coming
// year. Yes/no answers are numbers (1, 0, -1 unknown), the only values the
// "Only continue if" condition of Gladys can compare with what a user types.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from './helpers/world.js';

const check = async (world, fields) => {
  const ack = await world.gladys.fake.sceneAction('check_date', fields);
  assert.equal(ack.success, true, ack.error);
  return ack.data.outputs;
};

test('today, tomorrow, in N days', async (t) => {
  const world = await createWorld({
    config: { country: 'FR', subdivision: '67', school_zone: 'zone_b', language: 'fr' },
    at: '2026-12-24T07:00:00Z',
  });
  t.after(() => world.app.stop());
  assert.deepEqual(await check(world, { days_ahead: 0 }), {
    date: '2026-12-24',
    is_workday: 1,
    is_holiday: 0,
    holiday_name: '',
    is_school_holiday: 1,
    school_holiday_name: 'Vacances de Noël',
  });
  assert.deepEqual(await check(world, { days_ahead: 2 }), {
    date: '2026-12-26',
    is_workday: 0,
    is_holiday: 1,
    holiday_name: 'Lendemain de Noël', // Alsace-Moselle
    is_school_holiday: 1,
    school_holiday_name: 'Vacances de Noël',
  });
  const back = await check(world, { days_ahead: 11 });
  assert.equal(back.date, '2027-01-04');
  assert.equal(back.is_school_holiday, 0);
});

test('beyond the published school calendar, or without a zone: -1, unknown', async (t) => {
  const world = await createWorld({ config: { country: 'FR', school_zone: 'corse' } });
  t.after(() => world.app.stop());
  // The Corsican calendar is published until May 2027.
  assert.equal((await check(world, { days_ahead: 300 })).is_school_holiday, -1);
  const noZone = await createWorld({ config: { country: 'FR' } });
  t.after(() => noZone.app.stop());
  assert.equal((await check(noZone, { days_ahead: 0 })).is_school_holiday, -1);
});

test('the offset is bounded to the coming year and defaults to today', async (t) => {
  const world = await createWorld({ config: { country: 'FR' }, at: '2026-10-12T10:00:00Z' });
  t.after(() => world.app.stop());
  assert.equal((await check(world, {})).date, '2026-10-12');
  assert.equal((await check(world, { days_ahead: 5000 })).date, '2027-10-13');
  assert.equal((await check(world, { days_ahead: -3 })).date, '2026-10-12');
  assert.equal((await check(world, { days_ahead: 'x' })).date, '2026-10-12');
});
