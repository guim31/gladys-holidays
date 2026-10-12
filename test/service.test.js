// -----------------------------------------------------------------------------
// The clock: states flip at local midnight (in the time zone of Gladys, around
// the changes of time too), every state is republished once a day, the scene
// triggers fire once at the hour the scene chose, and a restart neither loses
// nor repeats an hour.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore, createWorld, fakeEducationApi } from './helpers/world.js';

const FR = { country: 'FR', language: 'fr' };

test('the states of a day, and a holiday flipping at local midnight (Paris, summer time)', async (t) => {
  // Whit Monday 2026 is 25 May; Paris is UTC+2.
  const world = await createWorld({ config: FR, at: '2026-05-24T21:58:00Z' });
  t.after(() => world.app.stop());
  assert.equal(world.state('holiday_today'), 0);
  assert.equal(world.state('holiday_tomorrow'), 1);
  assert.equal(world.state('workday_today'), 0); // a Sunday
  assert.equal(world.state('workday_tomorrow'), 0);
  assert.equal(world.state('days_until_holiday'), 1);
  assert.equal(world.state('days_until_workday'), 2);
  assert.equal(world.state('next_holiday'), 'Lundi de Pentecôte');
  assert.equal(world.state('today'), 'Jour de repos');

  await world.runUntil('2026-05-24T21:59:59Z');
  assert.equal(world.state('holiday_today'), 0, 'still Sunday at 23:59 in Paris');
  await world.runUntil('2026-05-24T22:00:30Z');
  assert.equal(world.state('holiday_today'), 1, 'Monday at 00:00 in Paris');
  assert.equal(world.state('holiday_tomorrow'), 0);
  assert.equal(world.state('workday_tomorrow'), 1);
  assert.equal(world.state('days_until_holiday'), 0);
  assert.equal(world.state('today'), 'Lundi de Pentecôte');
});

test('the day follows the time zone of Gladys, not UTC', async (t) => {
  // 4 July 2026 is a Saturday, observed on Friday 3 July. At 02:00 UTC on
  // 3 July, it is still 2 July in New York.
  const world = await createWorld({
    config: { country: 'US' },
    at: '2026-07-03T02:00:00Z',
    timeZone: 'America/New_York',
  });
  t.after(() => world.app.stop());
  assert.equal(world.state('holiday_today'), 0);
  assert.equal(world.state('holiday_tomorrow'), 1);
  await world.runUntil('2026-07-03T04:00:30Z'); // 00:00 in New York (UTC-4)
  assert.equal(world.state('holiday_today'), 1);
  assert.equal(world.state('next_holiday'), 'Independence Day (substitute day)');
});

test('midnight around the changes of time (spring forward and fall back)', async (t) => {
  // Spring: on 29 March 2026 Paris goes from UTC+1 to UTC+2 at 02:00.
  const spring = await createWorld({ config: FR, at: '2026-03-28T22:58:00Z' });
  t.after(() => spring.app.stop());
  const daysSeen = () =>
    spring.gladys.fake.states.filter((s) => s.device_feature_external_id.endsWith(':today')).length;
  const before = daysSeen();
  await spring.runUntil('2026-03-28T23:00:30Z'); // 00:00 CET, 29 March
  assert.equal(daysSeen(), before + 1, 'a new day at local midnight');
  await spring.runUntil('2026-03-29T21:59:00Z'); // 23:59 CEST, still 29 March
  assert.equal(daysSeen(), before + 1, 'no new day before the next local midnight');
  await spring.runUntil('2026-03-29T22:00:30Z'); // 00:00 CEST, 30 March
  assert.equal(daysSeen(), before + 2);
  assert.equal(spring.state('workday_today'), 1);

  // Fall: on 25 October 2026 Paris goes back to UTC+1 at 03:00. Toussaint
  // (1 November) is a Sunday: the eve fires on Saturday 31 October.
  const fall = await createWorld({ config: FR, at: '2026-10-24T21:58:00Z' });
  t.after(() => fall.app.stop());
  await fall.runUntil('2026-10-25T22:58:00Z'); // 23:58 CET, 25 October
  assert.equal(fall.state('days_until_holiday'), 7);
  await fall.runUntil('2026-10-25T23:00:30Z'); // 00:00 CET, 26 October
  assert.equal(fall.state('days_until_holiday'), 6);
});

test('every state is republished once a day, even unchanged', async (t) => {
  const world = await createWorld({ config: FR, at: '2026-10-13T21:30:00Z' });
  t.after(() => world.app.stop());
  const count = () => world.gladys.fake.states.length;
  const afterStart = count();
  assert.equal(afterStart, 8, 'every feature at start (no school zone)');
  await world.runUntil('2026-10-13T21:59:00Z');
  assert.equal(count(), afterStart, 'nothing between two midnights');
  // Wednesday 14 to Thursday 15 October: nothing changes but the countdown...
  await world.runUntil('2026-10-13T22:00:30Z');
  assert.equal(count(), afterStart * 2, '...and every state is sent again');
});

test('the holiday trigger fires once, at each hour, with the hour as filter', async (t) => {
  const world = await createWorld({ config: FR, at: '2026-10-31T22:30:00Z' }); // 23:30 CET
  t.after(() => world.app.stop());
  await world.runUntil('2026-11-01T22:59:00Z'); // 23:59, end of Toussaint
  const events = world.gladys.fake.sceneEvents.filter((e) => e.key === 'public_holiday');
  assert.equal(events.length, 24);
  assert.deepEqual(
    events.map((e) => e.data.hour),
    Array.from({ length: 24 }, (_, hour) => hour),
  );
  assert.deepEqual(events[0].data, {
    hour: 0,
    holiday_name: 'Toussaint',
    date: 'dimanche 1 novembre 2026',
  });
});

test('the eve trigger carries the holiday and the days off in a row', async (t) => {
  const world = await createWorld({
    config: { ...FR, extra_days: '2026-05-15=Pont' },
    at: '2026-05-13T15:30:00Z',
  });
  t.after(() => world.app.stop());
  await world.runUntil('2026-05-13T16:00:30Z'); // 18:00 in Paris, eve of Ascension
  const eve = world.gladys.fake.sceneEvents.filter((e) => e.key === 'holiday_eve');
  assert.deepEqual(eve.at(-1).data, {
    hour: 18,
    holiday_name: 'Ascension',
    date: 'jeudi 14 mai 2026',
    days_off: 4, // Thursday, the bridge, Saturday, Sunday
  });
});

test('the skipped hour of spring never fires, the repeated hour of fall fires once', async (t) => {
  // Easter Monday is not involved: use a configuration where 29 March and
  // 25 October are days off, to get an event every hour.
  const config = { ...FR, extra_days: '2026-03-29, 2026-10-25' };
  const spring = await createWorld({ config, at: '2026-03-28T22:30:00Z' });
  t.after(() => spring.app.stop());
  await spring.runUntil('2026-03-29T21:59:00Z');
  const springHours = spring.gladys.fake.sceneEvents
    .filter((e) => e.key === 'public_holiday')
    .map((e) => e.data.hour);
  assert.equal(springHours.length, 23);
  assert.ok(!springHours.includes(2));

  const fall = await createWorld({ config, at: '2026-10-24T21:30:00Z' });
  t.after(() => fall.app.stop());
  await fall.runUntil('2026-10-25T22:59:00Z');
  const fallHours = fall.gladys.fake.sceneEvents
    .filter((e) => e.key === 'public_holiday')
    .map((e) => e.data.hour);
  assert.equal(fallHours.length, 24);
  assert.equal(fallHours.filter((hour) => hour === 2).length, 1);
});

test('school triggers: first and last day of the holidays, with the return date', async (t) => {
  const world = await createWorld({
    config: { ...FR, school_zone: 'zone_b' },
    at: '2026-10-16T21:30:00Z', // Friday 16 October, 23:30
  });
  t.after(() => world.app.stop());
  assert.equal(world.state('school_holiday_today'), 0);
  assert.equal(world.state('school_holiday_tomorrow'), 1);
  await world.runUntil('2026-10-17T06:30:00Z'); // Saturday 17, 08:30
  assert.equal(world.state('school_holiday_today'), 1);
  assert.equal(world.state('today'), 'Jour de repos · vacances scolaires');
  const start = world.gladys.fake.sceneEvents.filter((e) => e.key === 'school_holidays_start');
  assert.equal(start.length, 9, 'hours 0 to 8 of the first day');
  assert.deepEqual(start.at(-1).data, {
    hour: 8,
    holiday_name: 'Vacances de la Toussaint',
    last_day: 'dimanche 1 novembre 2026',
    return_date: 'lundi 2 novembre 2026',
  });
  // Nothing on the following days of the holidays.
  await world.runUntil('2026-10-31T22:59:00Z');
  assert.equal(
    world.gladys.fake.sceneEvents.filter((e) => e.key === 'school_holidays_start').length,
    24,
  );
  assert.equal(
    world.gladys.fake.sceneEvents.filter((e) => e.key === 'school_holidays_end').length,
    0,
  );
  // Sunday 1 November: the last day (and Toussaint).
  await world.runUntil('2026-11-01T18:30:00Z');
  const end = world.gladys.fake.sceneEvents.filter((e) => e.key === 'school_holidays_end');
  assert.equal(end.at(-1).data.hour, 19);
  assert.equal(end.at(-1).data.return_date, 'lundi 2 novembre 2026');
  assert.equal(world.state('school_holiday_tomorrow'), 0);
});

test('a restart neither repeats nor loses the hour just begun', async () => {
  const store = createMemoryStore();
  const config = { ...FR, extra_days: '2026-10-14' }; // a day off: an event every hour
  const hours = async (at) => {
    const world = await createWorld({ config, store, at });
    await world.app.stop();
    return world.gladys.fake.sceneEvents.map((event) => event.data.hour);
  };
  // Started at 00:05: hour 0 began 5 minutes ago and was never fired.
  assert.deepEqual(await hours('2026-10-13T22:05:00Z'), [0]);
  // Restarted at 00:08: hour 0 was fired before the restart.
  assert.deepEqual(await hours('2026-10-13T22:08:00Z'), []);
  // Back at 01:04: hour 1 was never fired, it is caught up.
  assert.deepEqual(await hours('2026-10-13T23:04:00Z'), [1]);
  // Back at 02:30: too late for hour 2, the scenes would run at the wrong time.
  assert.deepEqual(await hours('2026-10-14T00:30:00Z'), []);
});

test('the device created gets every state, and the widget is nudged', async (t) => {
  const world = await createWorld({ config: FR });
  t.after(() => world.app.stop());
  const device = world.gladys.fake.discoveredDevices[0];
  const before = world.gladys.fake.states.length;
  const refreshes = world.gladys.fake.widgetRefreshes.length;
  await world.gladys.fake.deviceCreated({ ...device, id: 'uuid-1' });
  assert.equal(world.gladys.fake.states.length, before * 2);
  assert.equal(world.gladys.fake.widgetRefreshes.length, refreshes + 1);
});

test('a configuration change publishes the new device and its states', async (t) => {
  const world = await createWorld({ config: FR });
  t.after(() => world.app.stop());
  await world.gladys.fake.configUpdated({
    ...FR,
    country: 'DE',
    subdivision: 'BY',
    language: 'de',
  });
  const [device] = world.gladys.fake.discoveredDevices;
  assert.equal(device.name, 'Kalender Deutschland');
  assert.match(device.external_id, /:calendar:de$/);
  assert.equal(world.state('next_holiday'), 'Allerheiligen');
});

test('the school features appear with a zone; the status says when data is missing', async (t) => {
  const world = await createWorld({
    config: { ...FR, school_zone: 'zone_a' },
    api: fakeEducationApi({ fail: true }),
  });
  t.after(() => world.app.stop());
  const keys = world.gladys.fake.discoveredDevices[0].features.map((f) =>
    f.external_id.split(':').at(-1),
  );
  assert.ok(keys.includes('school_holiday_today') && keys.includes('school_holiday_tomorrow'));
  assert.equal(world.state('school_holiday_today'), undefined, 'unknown: not published');
  const status = world.gladys.fake.connectionStatus;
  assert.equal(status.connected, false);
  assert.match(status.message.fr, /Vacances scolaires pas encore lues/);

  // Six hours later the network is back: data, states and status follow.
  world.api.fail = false;
  world.clock.advance(6 * 3600_000);
  await world.service.tick();
  assert.equal(world.state('school_holiday_today'), 0);
  assert.equal(world.gladys.fake.connectionStatus.connected, true);
});

test('a wrong subdivision or date is reported, the rest keeps working', async (t) => {
  const world = await createWorld({
    config: { ...FR, subdivision: 'ZZ', extra_days: '2026-13-01, 05-15' },
  });
  t.after(() => world.app.stop());
  const status = world.gladys.fake.connectionStatus;
  assert.equal(status.connected, false);
  assert.match(status.message.en, /Ignored in the added days: "2026-13-01"/);
  assert.match(status.message.en, /Unknown subdivision "ZZ"/);
  assert.equal(world.state('next_holiday'), 'Toussaint');
});
