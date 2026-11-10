import { expect, test } from '@playwright/test';

test.describe('Seed: environment readiness', { tag: ['@smoke'] }, () => {
  test('target URL is reachable', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
  });

  test('the page has a title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
  });
});
