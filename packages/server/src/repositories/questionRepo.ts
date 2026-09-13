import { randomUUID } from 'node:crypto';
import type { QuestionRow, QuestionStatus, QuestionSummary } from '@feud/shared';
import type { Database } from '../db/connection';

export type { QuestionRow, QuestionSummary };

type RawRow = Record<string, unknown>;

const SUMMARY_SQL = `
  SELECT q.*,
    (SELECT COUNT(*) FROM survey_responses r WHERE r.question_id = q.id) AS response_count,
    EXISTS (SELECT 1 FROM board_answers b WHERE b.question_id = q.id) AS has_board
  FROM questions q`;

const STATUS_TIMESTAMP_COLUMN: Readonly<Record<QuestionStatus, string | null>> = {
  draft: null,
  open: 'opened_at',
  closed: 'closed_at',
  finalized: 'finalized_at',
  played: 'played_at',
};

function toRow(raw: RawRow): QuestionRow {
  return {
    id: String(raw['id']),
    prompt: String(raw['prompt']),
    status: raw['status'] as QuestionStatus,
    sortOrder: Number(raw['sort_order']),
    createdAt: Number(raw['created_at']),
    updatedAt: Number(raw['updated_at']),
    openedAt: raw['opened_at'] === null ? null : Number(raw['opened_at']),
    closedAt: raw['closed_at'] === null ? null : Number(raw['closed_at']),
    finalizedAt: raw['finalized_at'] === null ? null : Number(raw['finalized_at']),
    playedAt: raw['played_at'] === null ? null : Number(raw['played_at']),
  };
}

function toSummary(raw: RawRow): QuestionSummary {
  return { ...toRow(raw), responseCount: Number(raw['response_count']), hasBoard: Number(raw['has_board']) === 1 };
}

export type QuestionPatch = Readonly<{ prompt?: string; sortOrder?: number }>;

export function createQuestionRepo(db: Database) {
  const listStmt = db.prepare(`${SUMMARY_SQL} ORDER BY q.sort_order, q.created_at`);
  const listByStatusStmt = db.prepare(`${SUMMARY_SQL} WHERE q.status = ? ORDER BY q.sort_order, q.created_at`);
  const getStmt = db.prepare('SELECT * FROM questions WHERE id = ?');
  const getSummaryStmt = db.prepare(`${SUMMARY_SQL} WHERE q.id = ?`);
  const nextOrderStmt = db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM questions');
  const insertStmt = db.prepare(
    'INSERT INTO questions (id, prompt, status, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const deleteStmt = db.prepare('DELETE FROM questions WHERE id = ?');

  const get = (id: string): QuestionRow | null => {
    const raw = getStmt.get(id) as RawRow | undefined;
    return raw ? toRow(raw) : null;
  };

  return {
    list: (): QuestionSummary[] => (listStmt.all() as RawRow[]).map(toSummary),
    listByStatus: (status: QuestionStatus): QuestionSummary[] => (listByStatusStmt.all(status) as RawRow[]).map(toSummary),
    get,
    getSummary(id: string): QuestionSummary | null {
      const raw = getSummaryStmt.get(id) as RawRow | undefined;
      return raw ? toSummary(raw) : null;
    },
    insert(input: Readonly<{ prompt: string }>, now: number = Date.now()): QuestionRow {
      const id = randomUUID();
      const { next } = nextOrderStmt.get() as { next: number };
      insertStmt.run(id, input.prompt, 'draft', next, now, now);
      return toRow(getStmt.get(id) as RawRow);
    },
    /** Recreates a question from a backup with its original id and status. */
    insertExisting(input: Readonly<{ id: string; prompt: string; status: QuestionStatus; sortOrder?: number }>, now: number = Date.now()): QuestionRow {
      const { next } = nextOrderStmt.get() as { next: number };
      insertStmt.run(input.id, input.prompt, input.status, input.sortOrder ?? next, now, now);
      return toRow(getStmt.get(input.id) as RawRow);
    },
    update(id: string, patch: QuestionPatch, now: number = Date.now()): QuestionRow | null {
      const current = get(id);
      if (!current) return null;
      db.prepare('UPDATE questions SET prompt = ?, sort_order = ?, updated_at = ? WHERE id = ?').run(
        patch.prompt ?? current.prompt,
        patch.sortOrder ?? current.sortOrder,
        now,
        id,
      );
      return get(id);
    },
    setStatus(id: string, status: QuestionStatus, now: number = Date.now()): QuestionRow | null {
      if (!get(id)) return null;
      const column = STATUS_TIMESTAMP_COLUMN[status];
      const stampSql = column ? `, ${column} = ?` : '';
      const params = column ? [status, now, now, id] : [status, now, id];
      db.prepare(`UPDATE questions SET status = ?, updated_at = ?${stampSql} WHERE id = ?`).run(...params);
      return get(id);
    },
    remove: (id: string): boolean => deleteStmt.run(id).changes > 0,
  };
}

export type QuestionRepo = ReturnType<typeof createQuestionRepo>;
