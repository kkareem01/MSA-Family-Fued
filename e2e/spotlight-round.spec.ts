import { expect, test } from '@playwright/test';
import { act, api, openDisplay, resetGame, seedFinalizedQuestion } from './fixtures';

test('a round always shows the board, even with the survey spotlight left on', async ({ browser, request }) => {
  await resetGame(request);
  await api(request, 'put', '/api/settings/public-url', { url: 'https://e2e.example.com' });
  await api(request, 'put', '/api/settings/spotlight', { spotlight: 'survey' });
  try {
    const display = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await openDisplay(display);
    await expect(display.locator('.survey-spotlight')).toBeVisible();

    // The host never touched the toggle; they just load a question and start the round.
    const { board } = await seedFinalizedQuestion(request, 'Name a fruit', ['Mango', 'Mango', 'Apple']);
    await act(request, { type: 'LOAD_QUESTION', board });
    await expect(display.locator('.survey-spotlight')).toHaveCount(0);
    await expect(display.locator('.question-text')).toHaveText('Name a fruit');
    await expect(display.locator('.tile').first()).toBeVisible();

    await act(request, { type: 'START_FACEOFF' });
    await expect(display.locator('.survey-spotlight')).toHaveCount(0);
    await expect(display.locator('.tile').first()).toBeVisible();

    // Round done, back to idle: the spotlight returns by itself for the break.
    await act(request, { type: 'SET_CONTROL', team: 'A' });
    await act(request, { type: 'END_ROUND', awardTo: 'A' });
    await act(request, { type: 'NEXT_ROUND' });
    await expect(display.locator('.survey-spotlight')).toBeVisible();
  } finally {
    await api(request, 'put', '/api/settings/spotlight', { spotlight: null });
    await api(request, 'put', '/api/settings/public-url', { url: null });
    await resetGame(request);
  }
});
