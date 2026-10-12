// -----------------------------------------------------------------------------
// Small JSON files in /data, the only writable place of the container: the
// school calendar read from the ministry, and the last scene-trigger hour
// fired. Best effort: a read or write failure is logged, never thrown.
//
// Locally, HOLIDAYS_DATA_DIR points the store at any folder (the `.gitignore`
// keeps a root `data/` folder out of the repository).
// -----------------------------------------------------------------------------

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createLogger } from '@gladysassistant/integration-sdk';

const logger = createLogger({ name: 'store' });

export function defaultDataDir() {
  return process.env.HOLIDAYS_DATA_DIR || '/data';
}

export function createStore(dir = defaultDataDir()) {
  return {
    dir,
    load(name) {
      try {
        return JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
      } catch (err) {
        if (err.code !== 'ENOENT') {
          logger.warn(`Could not read ${name}: ${err.message}`);
        }
        return null;
      }
    },
    save(name, value) {
      try {
        mkdirSync(dir, { recursive: true });
        // Write then rename: a crash mid-write never leaves half a file.
        const file = path.join(dir, name);
        writeFileSync(`${file}.tmp`, JSON.stringify(value));
        renameSync(`${file}.tmp`, file);
      } catch (err) {
        logger.warn(`Could not write ${name}: ${err.message}`);
      }
    },
  };
}
