// -----------------------------------------------------------------------------
// The integration runs on its own clock (Gladys never polls the calendar
// device), and its logs stay quiet: nothing at info on a normal tick, a
// repeated failure logged once, its end logged once.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createStore } from '../src/store.js';
import { createWorld, fakeEducationApi } from './helpers/world.js';

const FR = { country: 'FR', language: 'fr' };

/** Captures the lines of the SDK logger (console.log / console.error). */
function captureLogs(t) {
  const previous = process.env.LOG_LEVEL;
  delete process.env.LOG_LEVEL; // the default level: info
  t.after(() => {
    if (previous !== undefined) {
      process.env.LOG_LEVEL = previous;
    }
  });
  const lines = [];
  const keep = (prefix, ...args) => lines.push([prefix, ...args].map(String).join(' '));
  t.mock.method(console, 'log', keep);
  t.mock.method(console, 'error', keep);
  return {
    lines,
    at: (level) => lines.filter((line) => line.includes(`[${level}]`)),
    clear: () => lines.splice(0),
  };
}

const flush = async () => {
  for (let i = 0; i < 20; i += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
};

test('the calendar is never polled: its own timer publishes at local midnight', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.parse('2026-05-24T21:58:10Z') });
  const world = await createWorld({ config: FR, timers: true });
  t.after(() => world.app.stop());
  const [device] = world.gladys.fake.discoveredDevices;
  assert.equal(device.should_poll, false, 'Gladys 5.2.0 polls only should_poll devices');
  assert.equal(device.poll_frequency, undefined);
  assert.equal(world.state('holiday_today'), 0);
  // Three minutes of timers, without any call from Gladys: Whit Monday begins.
  for (let minute = 0; minute < 3; minute += 1) {
    t.mock.timers.tick(60_000);
    await flush();
  }
  assert.equal(world.state('holiday_today'), 1);
  assert.equal(world.state('today'), 'Lundi de Pentecôte');
  assert.ok(world.gladys.fake.sceneEvents.some((event) => event.key === 'public_holiday'));
});

test('a normal day writes nothing at info: ticks, midnight, triggers, school refresh', async (t) => {
  const logs = captureLogs(t);
  const world = await createWorld({
    config: { ...FR, school_zone: 'zone_b', extra_days: '2026-10-14' },
    at: '2026-10-13T20:00:00Z',
  });
  t.after(() => world.app.stop());
  assert.equal(logs.at('INFO').length, 1, 'the first read of the school calendar');
  logs.clear();
  // A day and a half: every minute, a midnight, scene triggers each hour of
  // the day off, and the daily read of the school calendar.
  await world.runUntil('2026-10-15T08:00:00Z');
  assert.ok(world.api.calls.length >= 2, 'the school calendar was read again');
  assert.ok(world.gladys.fake.sceneEvents.length > 0);
  assert.deepEqual(logs.lines, []);
});

test('repeated failures are logged once, their end once', async (t) => {
  const logs = captureLogs(t);
  const world = await createWorld({
    config: { ...FR, school_zone: 'zone_a', extra_days: '2026-10-12, 2026-10-13' },
    api: fakeEducationApi({ fail: true }),
  });
  t.after(() => world.app.stop());
  assert.equal(logs.at('WARN').length, 1);
  assert.match(logs.at('WARN')[0], /Could not read the school calendar of Zone A/);

  // Gladys refuses states, statuses and scene events for hours.
  const down = async () => {
    throw new Error('Gladys is restarting');
  };
  const mocks = ['publishChangedStates', 'setConnectionStatus', 'publishSceneEvent'].map((name) =>
    t.mock.method(world.gladys, name, down),
  );
  for (let round = 0; round < 3; round += 1) {
    world.clock.advance(6 * 3600_000); // a new school read is due each time
    await world.service.tick();
    await world.service.publishDay({ force: true });
  }
  const warnings = logs.at('WARN');
  assert.equal(warnings.length, 4, warnings.join('\n'));
  for (const pattern of [
    /Could not read the school calendar/,
    /Could not publish the states/,
    /Could not report the status/,
    /Could not fire public_holiday/,
  ]) {
    assert.equal(warnings.filter((line) => pattern.test(line)).length, 1, String(pattern));
  }
  assert.deepEqual(logs.at('INFO'), []);

  // Everything is back: one line per recovery, then silence.
  for (const mock of mocks) {
    mock.mock.restore();
  }
  world.api.fail = false;
  logs.clear();
  world.clock.advance(6 * 3600_000); // 10:00 on 13 October, a day off
  await world.service.tick();
  const recoveries = logs.at('INFO');
  assert.equal(recoveries.length, 4, recoveries.join('\n'));
  for (const pattern of [
    /School calendar read again/,
    /States published again/,
    /Status reported again/,
    /Scene triggers fired again/,
  ]) {
    assert.equal(recoveries.filter((line) => pattern.test(line)).length, 1, String(pattern));
  }
  assert.equal(world.gladys.fake.connectionStatus.connected, true);
  logs.clear();
  await world.runUntil('2026-10-13T12:30:00Z');
  await world.service.publishDay({ force: true });
  assert.deepEqual(logs.lines, []);
});

test('an unwritable /data warns once, not every hour', (t) => {
  const logs = captureLogs(t);
  const dir = mkdtempSync(path.join(tmpdir(), 'holidays-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  // A file where the folder should be: every write fails.
  const blocked = createStore(path.join(dir, 'blocked'));
  createStore(dir).save('blocked', {});
  for (let hour = 0; hour < 5; hour += 1) {
    blocked.save('scheduler.json', { slot: hour });
  }
  assert.equal(logs.at('WARN').length, 1);
  assert.match(logs.at('WARN')[0], /Could not write scheduler\.json/);
  rmSync(path.join(dir, 'blocked'));
  blocked.save('scheduler.json', { slot: 5 });
  assert.equal(logs.at('INFO').length, 1);
  assert.deepEqual(blocked.load('scheduler.json'), { slot: 5 });
});
