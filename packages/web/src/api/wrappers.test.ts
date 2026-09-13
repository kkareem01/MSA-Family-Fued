import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({ apiRequest: vi.fn(() => Promise.resolve('ok')), ApiError: class ApiError extends Error {} }));
const { apiRequest } = await import('./client');
const questions = await import('./questions');
const survey = await import('./survey');
const tally = await import('./tally');
const settings = await import('./settings');
const game = await import('./game');

describe('API wrappers', () => {
  beforeEach(() => vi.mocked(apiRequest).mockClear());

  it('build the right question requests', async () => {
    await questions.listQuestions('p');
    await questions.createQuestion('p', 'Q');
    await questions.updateQuestion('p', 'id', { prompt: 'Q2' });
    await questions.deleteQuestion('p', 'id');
    await questions.setQuestionStatus('p', 'id', 'open');
    await questions.getBoard('p', 'id');
    expect(vi.mocked(apiRequest).mock.calls).toEqual([
      ['/api/questions', { pin: 'p' }],
      ['/api/questions', { method: 'POST', body: { prompt: 'Q' }, pin: 'p' }],
      ['/api/questions/id', { method: 'PATCH', body: { prompt: 'Q2' }, pin: 'p' }],
      ['/api/questions/id', { method: 'DELETE', pin: 'p' }],
      ['/api/questions/id/status', { method: 'POST', body: { status: 'open' }, pin: 'p' }],
      ['/api/questions/id/board', { pin: 'p' }],
    ]);
  });

  it('build survey, tally, settings and game requests', async () => {
    await survey.getOpenQuestions();
    await survey.submitSurvey({ token: 't', answers: [] });
    await tally.getTally('p', 'id');
    await tally.mergeTally('p', 'id', 'a', 'b');
    await tally.unmergeTally('p', 'id', 'a');
    await tally.renameTally('p', 'id', 'a', 'A');
    await tally.dropTally('p', 'id', 'a', true);
    await tally.setTallyPoints('p', 'id', 'a', 5);
    await tally.finalizeTally('p', 'id', 6);
    await settings.getSettings('p');
    await settings.setPublicUrl('p', null);
    await settings.rotateBuzzerCodes('p');
    await game.getGameState('p');
    await game.sendGameAction('p', { type: 'STRIKE' });
    await game.getCandidates('p');
    const paths = vi.mocked(apiRequest).mock.calls.map(([path, options]) => `${(options as { method?: string } | undefined)?.method ?? 'GET'} ${path}`);
    expect(paths).toEqual([
      'GET /api/survey/questions',
      'POST /api/survey/responses',
      'GET /api/questions/id/tally',
      'POST /api/questions/id/tally/merge',
      'POST /api/questions/id/tally/unmerge',
      'POST /api/questions/id/tally/rename',
      'POST /api/questions/id/tally/drop',
      'POST /api/questions/id/tally/points',
      'POST /api/questions/id/finalize',
      'GET /api/settings',
      'PUT /api/settings/public-url',
      'POST /api/settings/buzzer-codes/rotate',
      'GET /api/game/state',
      'POST /api/game/action',
      'GET /api/game/candidates',
    ]);
  });
});
