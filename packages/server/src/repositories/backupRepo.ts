import type { Database } from '../db/connection';

type Row = Readonly<Record<string, unknown>>;

/** Everything in the database as plain rows: the file a host downloads so no answer is ever lost. */
export type BackupDump = Readonly<{
  exportedAt: number;
  questions: readonly Row[];
  surveyResponses: readonly Row[];
  tallyDecisions: readonly Row[];
  boardAnswers: readonly Row[];
  gameState: readonly Row[];
  settings: readonly Row[];
}>;

const TABLES = {
  questions: 'SELECT * FROM questions ORDER BY sort_order, created_at',
  surveyResponses: 'SELECT * FROM survey_responses ORDER BY created_at',
  tallyDecisions: 'SELECT * FROM tally_decisions ORDER BY question_id, key',
  boardAnswers: 'SELECT * FROM board_answers ORDER BY question_id, rank',
  gameState: 'SELECT * FROM game_state',
  settings: 'SELECT * FROM settings ORDER BY key',
} as const;

export function createBackupRepo(db: Database) {
  const statements = Object.fromEntries(Object.entries(TABLES).map(([name, sql]) => [name, db.prepare(sql)])) as Record<keyof typeof TABLES, ReturnType<Database['prepare']>>;
  const rows = (name: keyof typeof TABLES): readonly Row[] => statements[name].all() as Row[];
  return {
    dumpAll(now: number = Date.now()): BackupDump {
      return {
        exportedAt: now,
        questions: rows('questions'),
        surveyResponses: rows('surveyResponses'),
        tallyDecisions: rows('tallyDecisions'),
        boardAnswers: rows('boardAnswers'),
        gameState: rows('gameState'),
        settings: rows('settings'),
      };
    },
  };
}

export type BackupRepo = ReturnType<typeof createBackupRepo>;
