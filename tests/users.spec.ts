import { expect, test } from '../fixtures/pages.js';

test.describe('Users keyboard navigation', { tag: ['@a11y', '@e2e'] }, () => {
  test('search and pagination controls are reachable by keyboard', async ({ usersPage }) => {
    await usersPage.goto();
    await usersPage.searchInput.focus();
    await expect(usersPage.searchInput).toBeFocused();
    await usersPage.page.keyboard.press('Tab');
    await expect(usersPage.pageInfo).toBeVisible();
    await expect(usersPage.nextPageButton).toBeVisible();
  });
});

test.describe('Users table', { tag: ['@smoke'] }, () => {
  test('shows users table and pagination info', async ({ usersPage }) => {
    await usersPage.goto();
    await expect(usersPage.heading).toBeVisible();
    await expect(usersPage.table).toBeVisible();
    await expect(usersPage.page.getByText('Showing 1 to 5 of 12 users')).toBeVisible();
  });
});
