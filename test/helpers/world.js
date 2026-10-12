// -----------------------------------------------------------------------------
// A running integration against the SDK's fake Gladys, with a clock the test
// moves, the school calendar served from recorded answers of the ministry's
// API (test/fixtures/education) and /data kept in memory. No network.
// -----------------------------------------------------------------------------

import { readFileSync } from 'node:fs';
import { createFakeGladys } from '@gladysassistant/integration-sdk/testing';
import { registerHandlers } from '../../src/app.js';

const ZONE_FILES = {
  'Zone A': 'zone-a',
  'Zone B': 'zone-b',
  'Zone C': 'zone-c',
  Corse: 'corse',
  Réunion: 'reunion',
  Guadeloupe: 'guadeloupe',
};

/** The recorded answer of the API for a zone (recorded on 2026-10-12). */
export function educationFixture(zone) {
  return JSON.parse(
    readFileSync(
      new URL(`../fixtures/education/${ZONE_FILES[zone]}.json`, import.meta.url),
      'utf8',
    ),
  );
}

/** A fetch serving the recorded answers, counting the calls. */
export function fakeEducationApi({ fail = false } = {}) {
  const api = {
    calls: [],
    fail,
    fetch: async (url) => {
      api.calls.push(url);
      if (api.fail) {
        throw new Error('getaddrinfo ENOTFOUND data.education.gouv.fr');
      }
      const zone = /zones="([^"]+)"/.exec(new URL(url).searchParams.get('where'))[1];
      return { ok: true, status: 200, json: async () => educationFixture(zone) };
    },
  };
  return api;
}

export function createMemoryStore(files = {}) {
  const content = new Map(Object.entries(files));
  return {
    files: content,
    load: (name) => (content.has(name) ? structuredClone(content.get(name)) : null),
    save: (name, value) => content.set(name, structuredClone(value)),
  };
}

/** A clock the test sets and moves. */
export function createClock(iso) {
  const clock = {
    ms: Date.parse(iso),
    now: () => clock.ms,
    set: (value) => {
      clock.ms = Date.parse(value);
    },
    advance: (ms) => {
      clock.ms += ms;
    },
  };
  return clock;
}

/**
 * @param {object} [options]
 * @param {object} [options.config] the configuration saved in Gladys
 * @param {string} [options.at] the instant of the start (ISO)
 * @param {string} [options.timeZone] Gladys' time zone
 * @param {object} [options.api] fakeEducationApi()
 * @param {object} [options.store] createMemoryStore()
 * @param {boolean} [options.connect] false: handlers registered, not started
 */
export async function createWorld({
  config = {},
  at = '2026-10-12T10:00:00Z',
  timeZone = 'Europe/Paris',
  api = fakeEducationApi(),
  store = createMemoryStore(),
  devices = [],
  connect = true,
} = {}) {
  const clock = createClock(at);
  const gladys = createFakeGladys({ config, devices });
  const app = registerHandlers(gladys, {
    store,
    fetch: api.fetch,
    now: clock.now,
    timeZone,
    timers: false,
  });
  if (connect) {
    await gladys.connect();
  }
  const { service } = app;
  return {
    gladys,
    app,
    service,
    clock,
    api,
    store,
    /** The last value Gladys received for a feature key of the device. */
    state(key) {
      const device = gladys.fake.discoveredDevices[0];
      const value = gladys.fake.lastState(`${device.external_id}:${key}`);
      return value;
    },
    /** Moves the clock minute by minute up to an instant, ticking each minute. */
    async runUntil(iso) {
      const target = Date.parse(iso);
      while (clock.ms < target) {
        clock.advance(Math.min(60_000, target - clock.ms));
        await service.tick();
      }
    },
  };
}
