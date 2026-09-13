import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, seedQuestion, seedResponses, type TestApp } from './helpers';

/** Pulls a backup the way scripts/pullBackup.ts does: the question list plus each tally. */
async function pull(t: TestApp) {
  const questions = (await t.app.inject({ method: 'GET', url: '/api/questions', headers: t.hostHeaders })).json().data as { id: string }[];
  const entries = [];
  for (const question of questions) {
    const tally = (await t.app.inject({ method: 'GET', url: `/api/questions/${question.id}/tally`, headers: t.hostHeaders })).json().data;
    entries.push({ question, tally });
  }
  return { questions: entries };
}

describe('restore route', () => {
  let source: TestApp;
  let target: TestApp;
  beforeEach(async () => {
    source = await buildTestApp();
    target = await buildTestApp();
  });
  afterEach(async () => {
    await source.app.close();
    await target.app.close();
  });

  it('rebuilds questions, answers, merges, drops and renames on a fresh server', async () => {
    const q1 = await seedQuestion(source, 'Name a fruit', 'open');
    await seedResponses(source, q1, ['Mango', 'mango', 'Mango juice', 'Apple', 'zzz junk']);
    await source.app.inject({ method: 'POST', url: `/api/questions/${q1}/tally/merge`, headers: source.hostHeaders, payload: { sourceKey: 'mango juice', targetKey: 'mango' } });
    await source.app.inject({ method: 'POST', url: `/api/questions/${q1}/tally/drop`, headers: source.hostHeaders, payload: { key: 'zzz junk', dropped: true } });
    await source.app.inject({ method: 'POST', url: `/api/questions/${q1}/tally/rename`, headers: source.hostHeaders, payload: { key: 'apple', displayText: 'Apples' } });
    const q2 = await seedQuestion(source, 'Name a city');
    const backup = await pull(source);
    const before = (await source.app.inject({ method: 'GET', url: `/api/questions/${q1}/tally`, headers: source.hostHeaders })).json().data;

    const res = await target.app.inject({ method: 'POST', url: '/api/restore', headers: target.hostHeaders, payload: backup });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.restored).toEqual([
      { id: q1, prompt: 'Name a fruit', answers: 5, decisions: 3, note: null },
      { id: q2, prompt: 'Name a city', answers: 0, decisions: 0, note: null },
    ]);
    const after = (await target.app.inject({ method: 'GET', url: `/api/questions/${q1}/tally`, headers: target.hostHeaders })).json().data;
    const shape = (view: typeof before) => ({
      total: view.totalResponses,
      kept: view.keptResponses,
      groups: view.groups.map((g: { key: string; count: number; displayText: string; points: number; mergedKeys: string[] }) => [g.key, g.count, g.displayText, g.points, g.mergedKeys]),
      hidden: view.hidden.map((g: { key: string; mergedInto: string | null; dropped: boolean }) => [g.key, g.mergedInto, g.dropped]),
    });
    expect(shape(after)).toEqual(shape(before));
    expect((await target.app.inject({ method: 'GET', url: '/api/questions', headers: target.hostHeaders })).json().data).toHaveLength(2);

    const again = await target.app.inject({ method: 'POST', url: '/api/restore', headers: target.hostHeaders, payload: backup });
    expect(again.json().data.restored).toEqual([]);
    expect(again.json().data.skipped).toHaveLength(2);
  });

  it('brings finalized questions back as closed with a note, and rejects junk and strangers', async () => {
    const q = await seedQuestion(source, 'Name a fruit', 'open');
    await seedResponses(source, q, ['Mango', 'Apple']);
    await source.app.inject({ method: 'POST', url: `/api/questions/${q}/finalize`, headers: source.hostHeaders, payload: { topN: 2 } });
    const res = await target.app.inject({ method: 'POST', url: '/api/restore', headers: target.hostHeaders, payload: await pull(source) });
    expect(res.json().data.restored[0]).toMatchObject({ answers: 2, note: expect.stringMatching(/was finalized/u) });
    expect((await target.app.inject({ method: 'GET', url: `/api/questions/${q}/tally`, headers: target.hostHeaders })).json().data.status).toBe('closed');
    expect((await target.app.inject({ method: 'POST', url: '/api/restore', headers: target.hostHeaders, payload: { questions: 'nope' } })).statusCode).toBe(400);
    expect((await target.app.inject({ method: 'POST', url: '/api/restore', payload: { questions: [] } })).statusCode).toBe(401);
  });
});
