import { randomUUID } from 'node:crypto';
import type { SurveyResponse } from '@feud/shared';
import type { Database } from '../db/connection';

export type NewSurveyResponse = Readonly<{
  questionId: string;
  rawText: string;
  normalizedText: string;
  submitterToken: string;
  ipHash: string | null;
}>;

export type InsertOutcome = 'inserted' | 'duplicate';

type RawRow = Record<string, unknown>;

function toResponse(raw: RawRow): SurveyResponse {
  return {
    id: String(raw['id']),
    questionId: String(raw['question_id']),
    rawText: String(raw['raw_text']),
    normalizedText: String(raw['normalized_text']),
    submitterToken: String(raw['submitter_token']),
    createdAt: Number(raw['created_at']),
  };
}

export function createSurveyRepo(db: Database) {
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO survey_responses (id, question_id, raw_text, normalized_text, submitter_token, ip_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const listStmt = db.prepare('SELECT * FROM survey_responses WHERE question_id = ? ORDER BY created_at, rowid');
  const countStmt = db.prepare('SELECT COUNT(*) AS count FROM survey_responses WHERE question_id = ?');
  const countAllStmt = db.prepare('SELECT COUNT(*) AS count FROM survey_responses');

  return {
    /** One answer per submitter token per question; a repeat is reported, not stored. */
    insert(input: NewSurveyResponse, now: number = Date.now()): InsertOutcome {
      const result = insertStmt.run(
        randomUUID(),
        input.questionId,
        input.rawText,
        input.normalizedText,
        input.submitterToken,
        input.ipHash,
        now,
      );
      return result.changes > 0 ? 'inserted' : 'duplicate';
    },
    listByQuestion: (questionId: string): SurveyResponse[] => (listStmt.all(questionId) as RawRow[]).map(toResponse),
    countByQuestion: (questionId: string): number => Number((countStmt.get(questionId) as { count: number }).count),
    countAll: (): number => Number((countAllStmt.get() as { count: number }).count),
  };
}

export type SurveyRepo = ReturnType<typeof createSurveyRepo>;
