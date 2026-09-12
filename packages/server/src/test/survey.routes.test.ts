import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildTestApp, seedQuestion, type TestApp } from './helpers';

describe('survey routes', () => {
  let t: TestApp;
  beforeEach(async () => {
    t = await buildTestApp({ surveyRateLimitMax: 3 });
  });
  afterEach(async () => {
    await t.app.close();
  });

  it('lists only open questions, publicly', async () => {
    await seedQuestion(t, 'Draft one');
    const openId = await seedQuestion(t, 'Open one', 'open');
    await seedQuestion(t, 'Closed one', 'closed');
    const res = await t.app.inject({ method: 'GET', url: '/api/survey/questions' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual([{ id: openId, prompt: 'Open one' }]);
  });

  it('accepts, deduplicates and reports closed or invalid answers per question', async () => {
    const openId = await seedQuestion(t, 'Open', 'open');
    const closedId = await seedQuestion(t, 'Closed', 'closed');
    const submit = (token: string, answers: unknown[]) =>
      t.app.inject({ method: 'POST', url: '/api/survey/responses', payload: { token, answers } });

    const first = await submit('token-abc-123', [
      { questionId: openId, text: ' Pizza ' },
      { questionId: closedId, text: 'Late' },
      { questionId: 'missing', text: 'x' },
      { questionId: openId, text: '!!!' },
    ]);
    expect(first.statusCode).toBe(200);
    expect(first.json().data.results).toEqual([
      { questionId: openId, status: 'accepted' },
      { questionId: closedId, status: 'closed' },
      { questionId: 'missing', status: 'invalid' },
      { questionId: openId, status: 'invalid' },
    ]);
    const again = await submit('token-abc-123', [{ questionId: openId, text: 'Pizza again' }]);
    expect(again.json().data.results).toEqual([{ questionId: openId, status: 'duplicate' }]);
  });

  it('rejects malformed payloads', async () => {
    const short = await t.app.inject({ method: 'POST', url: '/api/survey/responses', payload: { token: 'abc', answers: [] } });
    expect(short.statusCode).toBe(400);
    const long = await t.app.inject({
      method: 'POST',
      url: '/api/survey/responses',
      payload: { token: 'token-abc-123', answers: [{ questionId: 'x', text: 'y'.repeat(81) }] },
    });
    expect(long.statusCode).toBe(400);
  });

  it('rate limits submissions per client', async () => {
    const openId = await seedQuestion(t, 'Open', 'open');
    const codes: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const res = await t.app.inject({
        method: 'POST',
        url: '/api/survey/responses',
        payload: { token: `token-limit-${i}`, answers: [{ questionId: openId, text: `a${i}` }] },
      });
      codes.push(res.statusCode);
    }
    expect(codes).toEqual([200, 200, 200, 429]);
  });
});
