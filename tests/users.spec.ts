import { test, expect } from '../fixtures/pages';

test.describe('Users table', { tag: ['@e2e'] }, () => {
  test('search, filters, sort, pagination, selection, row menu', async ({ usersPage }) => {
    await usersPage.goto();
    await expect(usersPage.heading).toBeVisible();

    await usersPage.searchInput.fill('Alice');
    await expect(usersPage.userRow(1)).toBeVisible();
    await expect(usersPage.pagination).toHaveCount(0);

    await usersPage.searchInput.clear();
    await expect(usersPage.pageInfo).toContainText('Page 1 of 3');

    await usersPage.selectRoleFilter('Admin');
    await expect(usersPage.page.getByTestId('users-table-card')).toContainText('Alice Johnson');
    await usersPage.roleFilterSelect.click();
    await usersPage.page.getByRole('option', { name: 'All Roles', exact: true }).click();

    await usersPage.selectStatusFilter('Active');
    await usersPage.statusFilterSelect.click();
    await usersPage.page.getByRole('option', { name: 'All Statuses', exact: true }).click();

    await usersPage.nextPage.click();
    await expect(usersPage.pageInfo).toContainText('Page 2 of 3');
    await usersPage.prevPage.click();
    await expect(usersPage.pageInfo).toContainText('Page 1 of 3');

    await usersPage.sortByName();
    await usersPage.sortByName();
    await usersPage.sortByRole();
    await usersPage.sortByStatus();

    await usersPage.userMenuButton(1).click();
    await expect(usersPage.page.getByTestId('edit-user-1')).toBeVisible();
    await usersPage.page.keyboard.press('Escape');

    await usersPage.selectAllCheckbox.click();
    await expect(usersPage.page.getByTestId('bulk-actions')).toBeVisible();
  });
});
