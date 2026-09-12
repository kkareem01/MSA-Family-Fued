import { PHASES, type GameHistory } from '@feud/shared';
import type { Database } from '../db/connection';

export type GameStateSnapshot = Readonly<{ seq: number; history: GameHistory; updatedAt: number }>;

const PHASE_SET: ReadonlySet<string> = new Set(PHASES);

/** Cheap structural guard so a corrupt row degrades to "no snapshot" instead of crashing the server. */
function isGameHistory(value: unknown): value is GameHistory {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { present?: { phase?: unknown }; past?: unknown };
  return (
    typeof candidate.present === 'object' &&
    candidate.present !== null &&
    typeof candidate.present.phase === 'string' &&
    PHASE_SET.has(candidate.present.phase) &&
    Array.isArray(candidate.past)
  );
}

export function createGameStateRepo(db: Database) {
  const loadStmt = db.prepare('SELECT seq, snapshot_json, updated_at FROM game_state WHERE id = 1');
  const saveStmt = db.prepare(`
    INSERT INTO game_state (id, seq, snapshot_json, updated_at) VALUES (1, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE SET seq = excluded.seq, snapshot_json = excluded.snapshot_json, updated_at = excluded.updated_at`);

  return {
    load(): GameStateSnapshot | null {
      const raw = loadStmt.get() as { seq: number; snapshot_json: string; updated_at: number } | undefined;
      if (!raw) return null;
      try {
        const parsed: unknown = JSON.parse(raw.snapshot_json);
        return isGameHistory(parsed) ? { seq: Number(raw.seq), history: parsed, updatedAt: Number(raw.updated_at) } : null;
      } catch {
        return null;
      }
    },
    save(history: GameHistory, seq: number, now: number = Date.now()): void {
      saveStmt.run(seq, JSON.stringify(history), now);
    },
  };
}

export type GameStateRepo = ReturnType<typeof createGameStateRepo>;
