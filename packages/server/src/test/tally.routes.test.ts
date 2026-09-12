import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, seedQuestion, seedResponses, type TestApp } from './helpers';

describe('tally routes', () => {
  let t: TestApp;
  let qid: string;
  const post = (path: string, payload: Record<string, unknown>) => t.app.inject({ method: 'POST', url: `/api/questions/${qid}/${path}`, headers: t.hostHeaders, payload });
  const tally = async () => (await t.app.inject({ method: 'GET', url: `/api/questions/${qid}/tally`, headers: t.hostHeaders })).json().data;

  beforeEach(async () => {
    t = await buildTestApp();
    qid = await seedQuestion(t, 'Name a food', 'open');
    await seedResponses(t, qid, ['Pizza', 'pizza', 'Burgers', 'burger', 'Shawarma', 'Tacos']);
  });
  afterEach(async () => {
    await t.app.close();
  });

  it('returns the grouped view', async () => {
    const view = await tally();
    expect(view.totalResponses).toBe(6);
    expect(view.groups.map((g: { key: string; count: number }) => [g.key, g.count])).toEqual([
      ['burger', 2],
      ['pizza', 2],
      ['shawarma', 1],
      ['taco', 1],
    ]);
  });

  it('merges, flattens chains, unmerges, renames, drops and overrides points persistently', async () => {
    expect((await post('tally/merge', { sourceKey: 'shawarma', targetKey: 'taco' })).statusCode).toBe(200);
    expect((await post('tally/merge', { sourceKey: 'taco', targetKey: 'burger' })).statusCode).toBe(200);
    let view = await tally();
    const burger = view.groups.find((g: { key: string }) => g.key === 'burger');
    expect(burger.count).toBe(4);
    expect([...burger.mergedKeys].sort()).toEqual(['shawarma', 'taco']);
    expect(view.hidden.map((g: { key: string; mergedInto: string }) => [g.key, g.mergedInto])).toEqual(
      expect.arrayContaining([
        ['shawarma', 'burger'],
        ['taco', 'burger'],
      ]),
    );

    expect((await post('tally/merge', { sourceKey: 'burger', targetKey: 'shawarma' })).statusCode).toBe(400);
    expect((await post('tally/merge', { sourceKey: 'burger', targetKey: 'burger' })).statusCode).toBe(400);

    await post('tally/unmerge', { key: 'shawarma' });
    await post('tally/rename', { key: 'pizza', displayText: 'Pizza (any)' });
    await post('tally/drop', { key: 'shawarma', dropped: true });
    await post('tally/points', { key: 'burger', points: 55 });
    view = await tally();
    expect(view.groups.map((g: { key: string }) => g.key)).toEqual(['burger', 'pizza']);
    expect(view.groups[0]).toMatchObject({ key: 'burger', count: 3, points: 55, pointsOverride: 55 });
    expect(view.groups[1]).toMatchObject({ key: 'pizza', displayText: 'Pizza (any)', points: 40 });
    expect(view.keptResponses).toBe(5);
    expect(view.hidden.find((g: { key: string }) => g.key === 'shawarma')).toMatchObject({ dropped: true, mergedInto: null });
  });

  it('finalizes the top N into a board and closes the survey', async () => {
    const res = await post('finalize', { topN: 2 });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.answers).toEqual([
      expect.objectContaining({ rank: 1, text: 'Burgers', points: 33 }),
      expect.objectContaining({ rank: 2, text: 'Pizza', points: 33 }),
    ]);
    const question = (await t.app.inject({ method: 'GET', url: '/api/questions', headers: t.hostHeaders })).json().data[0];
    expect(question).toMatchObject({ status: 'finalized', hasBoard: true });
    const survey = await t.app.inject({ method: 'GET', url: '/api/survey/questions' });
    expect(survey.json().data).toEqual([]);
    expect((await post('finalize', { topN: 3 })).json().data.answers).toHaveLength(3);
  });

  it('refuses to finalize a draft or an empty tally', async () => {
    const draft = await seedQuestion(t, 'Draft');
    const res = await t.app.inject({ method: 'POST', url: `/api/questions/${draft}/finalize`, headers: t.hostHeaders, payload: { topN: 5 } });
    expect(res.statusCode).toBe(409);
    const empty = await seedQuestion(t, 'Empty', 'open');
    const res2 = await t.app.inject({ method: 'POST', url: `/api/questions/${empty}/finalize`, headers: t.hostHeaders, payload: { topN: 5 } });
    expect(res2.statusCode).toBe(409);
    const unknown = await t.app.inject({ method: 'GET', url: '/api/questions/nope/tally', headers: t.hostHeaders });
    expect(unknown.statusCode).toBe(404);
  });
});
