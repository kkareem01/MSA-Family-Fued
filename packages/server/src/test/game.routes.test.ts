import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { buildTestApp, seedFinalizedQuestion, testConfig, type TestApp } from './helpers';

describe('game routes', () => {
  let t: TestApp;
  const act = (action: unknown) => t.app.inject({ method: 'POST', url: '/api/game/action', headers: t.hostHeaders, payload: { action } });
  const state = async () => (await t.app.inject({ method: 'GET', url: '/api/game/state', headers: t.hostHeaders })).json().data;

  beforeEach(async () => {
    t = await buildTestApp();
  });
  afterEach(async () => {
    await t.app.close();
  });

  it('starts idle with seq 0 and no undo', async () => {
    expect(await state()).toMatchObject({ seq: 0, canUndo: false, state: { phase: 'idle' } });
  });

  it('applies actions, reports no-ops and rejects invalid ones', async () => {
    const changed = await act({ type: 'SET_TEAM_NAME', team: 'A', name: 'Lions' });
    expect(changed.statusCode).toBe(200);
    expect(changed.json().data).toMatchObject({ seq: 1, changed: true });
    const noop = await act({ type: 'START_FACEOFF' });
    expect(noop.json().data).toMatchObject({ seq: 1, changed: false });
    const invalid = await act({ type: 'REVEAL_ANSWER', rank: 99 });
    expect(invalid.statusCode).toBe(400);
    expect((await state()).state.teams.A.name).toBe('Lions');
  });

  it('marks questions played on load and restores them on undo', async () => {
    const qid = await seedFinalizedQuestion(t);
    const board = (await t.app.inject({ method: 'GET', url: `/api/questions/${qid}/board`, headers: t.hostHeaders })).json().data;
    await act({ type: 'LOAD_QUESTION', board });
    const status = async () => (await t.app.inject({ method: 'GET', url: '/api/questions', headers: t.hostHeaders })).json().data[0].status;
    expect(await status()).toBe('played');
    expect((await state()).canUndo).toBe(true);
    await act({ type: 'UNDO' });
    expect(await status()).toBe('finalized');
    expect((await state()).state.phase).toBe('idle');
  });

  it('lists candidate questions that are finalized and unplayed', async () => {
    const qid = await seedFinalizedQuestion(t);
    const res = await t.app.inject({ method: 'GET', url: '/api/game/candidates', headers: t.hostHeaders });
    expect(res.json().data.map((q: { id: string }) => q.id)).toEqual([qid]);
  });

  it('survives a restart with the same database', async () => {
    await act({ type: 'ADJUST_SCORE', team: 'B', delta: 40 });
    await act({ type: 'ADJUST_SCORE', team: 'B', delta: 5 });
    await t.app.close();
    const rebuilt = await buildApp({ config: testConfig(), db: t.db });
    await rebuilt.app.ready();
    const res = await rebuilt.app.inject({ method: 'GET', url: '/api/game/state', headers: t.hostHeaders });
    expect(res.json().data).toMatchObject({ seq: 2, canUndo: true, state: { teams: { B: { score: 45 } } } });
    await rebuilt.app.close();
  });
});
