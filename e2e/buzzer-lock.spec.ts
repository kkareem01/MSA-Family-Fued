import { expect, test } from '@playwright/test';
import { act, api, openDisplay, resetGame, seedFinalizedQuestion } from './fixtures';

test('the first phone to tap locks the buzzer for its team', async ({ browser, request }) => {
  await resetGame(request);
  await act(request, { type: 'SET_TEAM_NAME', team: 'A', name: 'Falcons' });
  await act(request, { type: 'SET_TEAM_NAME', team: 'B', name: 'Owls' });
  const { board } = await seedFinalizedQuestion(request, 'Name a bird', ['Falcon', 'Owl']);
  const settings = await api<{ buzzerCodes: { A: string; B: string } }>(request, 'get', '/api/settings');

  const display = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await openDisplay(display);

  const phoneA = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const phoneB = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await phoneA.goto(`/buzzer?team=A&code=${settings.buzzerCodes.A}`);
  await phoneB.goto(`/buzzer?team=B&code=${settings.buzzerCodes.B}`);
  await expect(phoneA.locator('.buzz-button.status-closed')).toBeVisible();
  await expect(phoneB.locator('.buzz-button.status-closed')).toBeVisible();

  await act(request, { type: 'LOAD_QUESTION', board });
  await act(request, { type: 'START_FACEOFF' });
  await expect(phoneA.locator('.buzz-button.status-open')).toBeVisible();
  await expect(phoneB.locator('.buzz-button.status-open')).toBeVisible();

  await phoneA.locator('.buzz-button').dispatchEvent('pointerdown');
  await expect(phoneA.locator('.buzz-button.status-you')).toBeVisible();
  await expect(phoneB.locator('.buzz-button.status-other')).toBeVisible();
  await expect(display.locator('.phase-banner .phase-title')).toHaveText('Falcons');

  const state = await api<{ state: { round: { faceoff: { lockedTeam: string; lockedBy: string } } } }>(request, 'get', '/api/game/state');
  expect(state.state.round.faceoff).toMatchObject({ lockedTeam: 'A', lockedBy: 'buzzer' });
});
