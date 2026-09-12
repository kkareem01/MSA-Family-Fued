import { withTransaction, type Database } from './connection';
import { initialMigration } from './migrations/001-initial';

export type Migration = Readonly<{ version: number; name: string; sql: string }>;

export const MIGRATIONS: readonly Migration[] = [initialMigration];

/** Applies pending migrations in version order, each in its own transaction. Returns how many ran. */
export function runMigrations(db: Database, migrations: readonly Migration[] = MIGRATIONS, now: number = Date.now()): number {
  db.exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at INTEGER NOT NULL)',
  );
  const appliedRows = db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[];
  const applied = new Set(appliedRows.map((r) => r.version));
  const pending = [...migrations].filter((m) => !applied.has(m.version)).sort((a, b) => a.version - b.version);
  const record = db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)');
  for (const migration of pending) {
    withTransaction(db, () => {
      db.exec(migration.sql);
      record.run(migration.version, migration.name, now);
    });
  }
  return pending.length;
}
