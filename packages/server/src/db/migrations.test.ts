import { describe, expect, it } from 'vitest';
import { openDatabase } from './connection';
import { runMigrations, MIGRATIONS } from './migrations';

function tableNames(db: ReturnType<typeof openDatabase>): string[] {
  const rows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[];
  return rows.map((r) => r.name);
}

describe('runMigrations', () => {
  it('creates every table and records the versions', () => {
    const db = openDatabase(':memory:');
    const applied = runMigrations(db);
    expect(applied).toBe(MIGRATIONS.length);
    expect(tableNames(db)).toEqual(
      expect.arrayContaining(['schema_migrations', 'questions', 'survey_responses', 'tally_decisions', 'board_answers', 'game_state', 'settings']),
    );
  });

  it('is idempotent', () => {
    const db = openDatabase(':memory:');
    runMigrations(db);
    expect(runMigrations(db)).toBe(0);
  });

  it('enforces foreign keys', () => {
    const db = openDatabase(':memory:');
    runMigrations(db);
    expect(() =>
      db
        .prepare('INSERT INTO survey_responses (id, question_id, raw_text, normalized_text, submitter_token, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run('r1', 'missing', 'x', 'x', 't', 1),
    ).toThrow(/FOREIGN KEY/);
  });
});
