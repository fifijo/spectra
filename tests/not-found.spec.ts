import { expect, test } from '../fixtures/pages.js';

test.describe('Unknown route handling', { tag: ['@critical', '@e2e'] }, () => {
  test('keeps app shell visible on unknown route', async ({ notFoundPage }) => {
    await notFoundPage.goto();
    await expect(notFoundPage.page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(notFoundPage.page.getByRole('link', { name: /settings/i })).toBeVisible();
  });
});
