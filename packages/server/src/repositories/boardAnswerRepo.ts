import { randomUUID } from 'node:crypto';
import { withTransaction, type Database } from '../db/connection';

export type NewBoardAnswer = Readonly<{
  rank: number;
  text: string;
  points: number;
  responseCount: number;
  sourceKeys: readonly string[];
}>;

export type BoardAnswerRow = Readonly<NewBoardAnswer & { id: string; questionId: string }>;

type RawRow = Record<string, unknown>;

function parseKeys(value: unknown): readonly string[] {
  try {
    const parsed: unknown = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function toRow(raw: RawRow): BoardAnswerRow {
  return {
    id: String(raw['id']),
    questionId: String(raw['question_id']),
    rank: Number(raw['rank']),
    text: String(raw['text']),
    points: Number(raw['points']),
    responseCount: Number(raw['response_count']),
    sourceKeys: parseKeys(raw['source_keys']),
  };
}

export function createBoardAnswerRepo(db: Database) {
  const deleteStmt = db.prepare('DELETE FROM board_answers WHERE question_id = ?');
  const insertStmt = db.prepare(
    'INSERT INTO board_answers (id, question_id, rank, text, points, response_count, source_keys) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  const getStmt = db.prepare('SELECT * FROM board_answers WHERE question_id = ? ORDER BY rank');

  return {
    /** Atomically swaps the finalized board for a question. */
    replaceForQuestion(questionId: string, answers: readonly NewBoardAnswer[]): void {
      withTransaction(db, () => {
        deleteStmt.run(questionId);
        for (const a of answers) {
          insertStmt.run(randomUUID(), questionId, a.rank, a.text, a.points, a.responseCount, JSON.stringify(a.sourceKeys));
        }
      });
    },
    getBoard: (questionId: string): BoardAnswerRow[] => (getStmt.all(questionId) as RawRow[]).map(toRow),
    clearForQuestion: (questionId: string): void => {
      deleteStmt.run(questionId);
    },
  };
}

export type BoardAnswerRepo = ReturnType<typeof createBoardAnswerRepo>;
