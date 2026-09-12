import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, seedQuestion, seedFinalizedQuestion, type TestApp } from './helpers';

describe('question routes', () => {
  let t: TestApp;
  beforeEach(async () => {
    t = await buildTestApp();
  });
  afterEach(async () => {
    await t.app.close();
  });

  it('requires the host PIN', async () => {
    const noPin = await t.app.inject({ method: 'GET', url: '/api/questions' });
    expect(noPin.statusCode).toBe(401);
    expect(noPin.json()).toMatchObject({ ok: false, error: { code: 'unauthorized' } });
    const wrong = await t.app.inject({ method: 'GET', url: '/api/questions', headers: { 'x-host-pin': 'nope' } });
    expect(wrong.statusCode).toBe(401);
  });

  it('creates, lists, updates and deletes', async () => {
    const created = await t.app.inject({ method: 'POST', url: '/api/questions', headers: t.hostHeaders, payload: { prompt: '  Name a fruit ' } });
    expect(created.statusCode).toBe(201);
    const { data } = created.json();
    expect(data).toMatchObject({ prompt: 'Name a fruit', status: 'draft', responseCount: 0, hasBoard: false });

    const list = await t.app.inject({ method: 'GET', url: '/api/questions', headers: t.hostHeaders });
    expect(list.json().data).toHaveLength(1);

    const updated = await t.app.inject({ method: 'PATCH', url: `/api/questions/${data.id}`, headers: t.hostHeaders, payload: { prompt: 'Name a veg' } });
    expect(updated.json().data.prompt).toBe('Name a veg');

    const removed = await t.app.inject({ method: 'DELETE', url: `/api/questions/${data.id}`, headers: t.hostHeaders });
    expect(removed.statusCode).toBe(204);
    const missing = await t.app.inject({ method: 'DELETE', url: `/api/questions/${data.id}`, headers: t.hostHeaders });
    expect(missing.statusCode).toBe(404);
  });

  it('validates the body', async () => {
    const res = await t.app.inject({ method: 'POST', url: '/api/questions', headers: t.hostHeaders, payload: { prompt: '' } });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(res.json().error.issues.length).toBeGreaterThan(0);
  });

  it('walks the status edges and rejects illegal ones', async () => {
    const id = await seedQuestion(t);
    const setStatus = (status: string) =>
      t.app.inject({ method: 'POST', url: `/api/questions/${id}/status`, headers: t.hostHeaders, payload: { status } });
    expect((await setStatus('closed')).statusCode).toBe(409);
    expect((await setStatus('open')).json().data.status).toBe('open');
    expect((await setStatus('finalized')).statusCode).toBe(409);
    expect((await setStatus('closed')).json().data.status).toBe('closed');
    expect((await setStatus('open')).json().data.status).toBe('open');
    expect((await setStatus('bogus')).statusCode).toBe(400);
  });

  it('unfinalizing clears the board and played questions cannot be deleted', async () => {
    const id = await seedFinalizedQuestion(t);
    const board = await t.app.inject({ method: 'GET', url: `/api/questions/${id}/board`, headers: t.hostHeaders });
    expect(board.statusCode).toBe(200);
    expect(board.json().data.answers[0]).toMatchObject({ rank: 1, text: 'Pizza', points: 50 });

    await t.app.inject({ method: 'POST', url: `/api/questions/${id}/status`, headers: t.hostHeaders, payload: { status: 'closed' } });
    const gone = await t.app.inject({ method: 'GET', url: `/api/questions/${id}/board`, headers: t.hostHeaders });
    expect(gone.statusCode).toBe(404);

    await t.app.inject({ method: 'POST', url: `/api/questions/${id}/finalize`, headers: t.hostHeaders, payload: { topN: 2 } });
    const loaded = await t.app.inject({
      method: 'POST',
      url: '/api/game/action',
      headers: t.hostHeaders,
      payload: { action: { type: 'LOAD_QUESTION', board: (await t.app.inject({ method: 'GET', url: `/api/questions/${id}/board`, headers: t.hostHeaders })).json().data } },
    });
    expect(loaded.statusCode).toBe(200);
    const list = await t.app.inject({ method: 'GET', url: '/api/questions', headers: t.hostHeaders });
    expect(list.json().data[0].status).toBe('played');
    const del = await t.app.inject({ method: 'DELETE', url: `/api/questions/${id}`, headers: t.hostHeaders });
    expect(del.statusCode).toBe(409);
  });
});
