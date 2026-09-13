import { expect, test } from '@playwright/test';
import { api, hostSignIn } from './fixtures';

test('an audience answer shows up in the host tally', async ({ browser, request }) => {
  const question = await api<{ id: string }>(request, 'post', '/api/questions', { prompt: 'Name a late-night snack' });
  await api(request, 'post', `/api/questions/${question.id}/status`, { status: 'open' });

  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await phone.goto('/survey');
  const input = phone.locator('.survey-question', { hasText: 'Name a late-night snack' }).locator('input');
  await input.fill('Shawarma');
  await phone.click('.survey-submit');
  await expect(phone.locator('.survey-message')).toContainText('sent');

  const host = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await hostSignIn(host, `/host/tally/${question.id}`);
  await expect(host.locator('input[aria-label="Display text for shawarma"]')).toHaveValue('Shawarma');
  await expect(host.locator('.tally-row').first()).toContainText('1 said');
});
