import { describe, expect, it } from 'vitest';
import { createHistory, createInitialState, gameReducer } from '@feud/shared';
import { createGameStateRepo } from './gameStateRepo';
import { createTestDb } from '../test/helpers';

describe('gameStateRepo', () => {
  it('returns null before anything is saved', () => {
    expect(createGameStateRepo(createTestDb()).load()).toBeNull();
  });

  it('round-trips a history snapshot with its sequence number', () => {
    const db = createTestDb();
    const repo = createGameStateRepo(db);
    const present = gameReducer(createInitialState(), { type: 'SET_TEAM_NAME', team: 'A', name: 'Lions' });
    const history = { present, past: [createInitialState()] };
    repo.save(history, 7, 123);
    expect(repo.load()).toEqual({ seq: 7, history, updatedAt: 123 });
    repo.save(createHistory(present), 8, 124);
    expect(repo.load()?.seq).toBe(8);
  });

  it('treats a corrupt snapshot as absent', () => {
    const db = createTestDb();
    db.prepare('INSERT INTO game_state (id, seq, snapshot_json, updated_at) VALUES (1, 3, ?, 1)').run('{not json');
    expect(createGameStateRepo(db).load()).toBeNull();
    db.prepare('UPDATE game_state SET snapshot_json = ? WHERE id = 1').run(JSON.stringify({ present: { phase: 'nope' }, past: [] }));
    expect(createGameStateRepo(db).load()).toBeNull();
  });
});
