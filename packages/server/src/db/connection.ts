import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type Database = DatabaseSync;
export const MEMORY_DB = ':memory:';

export function openDatabase(path: string): Database {
  if (path !== MEMORY_DB) mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL');
  // FULL: every commit is on disk before we answer the phone. A few ms per write is cheap insurance.
  db.exec('PRAGMA synchronous = FULL');
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

/** Runs `fn` inside BEGIN/COMMIT, rolling back and rethrowing on any error. */
export function withTransaction<T>(db: Database, fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
