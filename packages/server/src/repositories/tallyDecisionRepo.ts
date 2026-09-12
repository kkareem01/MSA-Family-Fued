import type { TallyDecision } from '@feud/shared';
import type { Database } from '../db/connection';

type RawRow = Record<string, unknown>;
type Column = 'display_text' | 'merged_into_key' | 'dropped' | 'points_override';

function toDecision(raw: RawRow): TallyDecision {
  return {
    key: String(raw['key']),
    displayText: raw['display_text'] === null ? null : String(raw['display_text']),
    mergedIntoKey: raw['merged_into_key'] === null ? null : String(raw['merged_into_key']),
    dropped: Number(raw['dropped']) === 1,
    pointsOverride: raw['points_override'] === null ? null : Number(raw['points_override']),
  };
}

export function createTallyDecisionRepo(db: Database) {
  const listStmt = db.prepare('SELECT * FROM tally_decisions WHERE question_id = ? ORDER BY key');
  const getStmt = db.prepare('SELECT * FROM tally_decisions WHERE question_id = ? AND key = ?');
  const repointStmt = db.prepare(
    'UPDATE tally_decisions SET merged_into_key = ?, updated_at = ? WHERE question_id = ? AND merged_into_key = ?',
  );

  /** Inserts a blank row if needed, then sets exactly one column. Column names come from a fixed whitelist. */
  const upsertColumn = (column: Column, questionId: string, key: string, value: string | number | null, now: number) => {
    db.prepare(`
      INSERT INTO tally_decisions (question_id, key, ${column}, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT (question_id, key) DO UPDATE SET ${column} = excluded.${column}, updated_at = excluded.updated_at`).run(
      questionId,
      key,
      value,
      now,
    );
  };

  return {
    listByQuestion: (questionId: string): TallyDecision[] => (listStmt.all(questionId) as RawRow[]).map(toDecision),
    get(questionId: string, key: string): TallyDecision | null {
      const raw = getStmt.get(questionId, key) as RawRow | undefined;
      return raw ? toDecision(raw) : null;
    },
    setDisplayText: (questionId: string, key: string, text: string | null, now: number = Date.now()) =>
      upsertColumn('display_text', questionId, key, text, now),
    setMergedInto: (questionId: string, key: string, target: string | null, now: number = Date.now()) =>
      upsertColumn('merged_into_key', questionId, key, target, now),
    setDropped: (questionId: string, key: string, dropped: boolean, now: number = Date.now()) =>
      upsertColumn('dropped', questionId, key, dropped ? 1 : 0, now),
    setPointsOverride: (questionId: string, key: string, points: number | null, now: number = Date.now()) =>
      upsertColumn('points_override', questionId, key, points, now),
    /** Everything that pointed at `from` now points at `to` (keeps merge chains flat). */
    repointMerges(questionId: string, from: string, to: string | null, now: number = Date.now()): number {
      return Number(repointStmt.run(to, now, questionId, from).changes);
    },
  };
}

export type TallyDecisionRepo = ReturnType<typeof createTallyDecisionRepo>;
