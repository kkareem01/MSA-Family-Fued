import type { Database } from '../db/connection';

export function createSettingsRepo(db: Database) {
  const getStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const setStmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`);
  const allStmt = db.prepare('SELECT key, value FROM settings');
  const removeStmt = db.prepare('DELETE FROM settings WHERE key = ?');

  return {
    get(key: string): string | null {
      const raw = getStmt.get(key) as { value: string } | undefined;
      return raw ? String(raw.value) : null;
    },
    set(key: string, value: string, now: number = Date.now()): void {
      setStmt.run(key, value, now);
    },
    getAll: (): Readonly<Record<string, string>> =>
      Object.fromEntries((allStmt.all() as { key: string; value: string }[]).map((r) => [r.key, r.value])),
    remove(key: string): void {
      removeStmt.run(key);
    },
  };
}

export type SettingsRepo = ReturnType<typeof createSettingsRepo>;
