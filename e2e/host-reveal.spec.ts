import { expect, test } from '@playwright/test';
import { act, hostSignIn, openDisplay, resetGame, seedFinalizedQuestion } from './fixtures';

test('host reveals an answer and the projector flips the tile', async ({ browser, request }) => {
  await resetGame(request);
  const { board } = await seedFinalizedQuestion(request, 'Name a fruit', ['Mango', 'Mango', 'Apple']);
  await act(request, { type: 'LOAD_QUESTION', board });
  await act(request, { type: 'START_FACEOFF' });
  await act(request, { type: 'SET_CONTROL', team: 'A' });

  const display = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await openDisplay(display);
  await expect(display.locator('.question-text')).toHaveText('Name a fruit');
  await expect(display.locator('.tile.revealed')).toHaveCount(0);

  const host = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await hostSignIn(host);
  await host.click('button[aria-label^="Reveal answer 1"]');

  const revealed = display.locator('.tile.revealed');
  await expect(revealed).toHaveCount(1);
  await expect(revealed.locator('.tile-text')).toHaveText('Mango');
  await expect(revealed.locator('.tile-points')).toHaveText('67');
  await expect(display.locator('.pot-value')).toHaveText('67');
  await expect(host.locator('button[aria-label^="Reveal answer 1"]')).toBeDisabled();
});
