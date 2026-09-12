import type { Migration } from '../migrations';

export const initialMigration: Migration = {
  version: 1,
  name: 'initial',
  sql: `
    CREATE TABLE questions (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'closed', 'finalized', 'played')),
      sort_order INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      opened_at INTEGER,
      closed_at INTEGER,
      finalized_at INTEGER,
      played_at INTEGER
    );

    CREATE TABLE survey_responses (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      raw_text TEXT NOT NULL,
      normalized_text TEXT NOT NULL,
      submitter_token TEXT NOT NULL,
      ip_hash TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE (question_id, submitter_token)
    );
    CREATE INDEX idx_survey_responses_question_key ON survey_responses (question_id, normalized_text);

    CREATE TABLE tally_decisions (
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      display_text TEXT,
      merged_into_key TEXT,
      dropped INTEGER NOT NULL DEFAULT 0,
      points_override INTEGER,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (question_id, key)
    );

    CREATE TABLE board_answers (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      rank INTEGER NOT NULL,
      text TEXT NOT NULL,
      points INTEGER NOT NULL,
      response_count INTEGER NOT NULL,
      source_keys TEXT NOT NULL,
      UNIQUE (question_id, rank)
    );

    CREATE TABLE game_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      seq INTEGER NOT NULL,
      snapshot_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `,
};
