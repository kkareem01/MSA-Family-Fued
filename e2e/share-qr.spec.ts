import { expect, test } from '@playwright/test';
import { api, hostSignIn, openDisplay, resetGame } from './fixtures';

test('host shares the survey QR and puts it on the projector', async ({ browser, request }) => {
  await resetGame(request); // the spotlight only shows while nothing is on the board
  await api(request, 'put', '/api/settings/public-url', { url: 'https://e2e.example.com' });
  await api(request, 'put', '/api/settings/spotlight', { spotlight: null });
  try {
    const host = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await hostSignIn(host, '/host/share');
    await expect(host.getByAltText('QR code for https://e2e.example.com/survey')).toBeVisible();

    const display = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await openDisplay(display);
    await expect(display.locator('.survey-spotlight')).toHaveCount(0);

    await host.getByRole('button', { name: 'Show on projector' }).click();
    await expect(display.locator('.survey-spotlight')).toContainText('e2e.example.com/survey');
    await host.getByRole('button', { name: 'Hide from projector' }).click();
    await expect(display.locator('.survey-spotlight')).toHaveCount(0);
  } finally {
    await api(request, 'put', '/api/settings/spotlight', { spotlight: null });
    await api(request, 'put', '/api/settings/public-url', { url: null });
  }
});
