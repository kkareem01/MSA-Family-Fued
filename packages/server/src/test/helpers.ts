import { openDatabase, type Database } from '../db/connection';
import { runMigrations } from '../db/migrations';

export function createTestDb(): Database {
  const db = openDatabase(':memory:');
  runMigrations(db);
  return db;
}
