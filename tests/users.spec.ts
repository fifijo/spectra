import { expect, test } from '../fixtures/pages.js';

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
    await expect(usersPage.usersTableCard).toContainText('Alice Johnson');
    await expect(usersPage.usersTableCard).not.toContainText('Bob Smith');
    await expect(usersPage.tableRows()).toHaveCount(3);
    await usersPage.selectRoleFilter('All Roles');
    await expect(usersPage.tableRows()).toHaveCount(5);

    await usersPage.selectStatusFilter('Active');
    await expect(usersPage.usersTableCard).not.toContainText('Carol White');
    await usersPage.selectStatusFilter('All Statuses');
    await expect(usersPage.usersTableCard).toContainText('Carol White');

    await usersPage.nextPage.click();
    await expect(usersPage.pageInfo).toContainText('Page 2 of 3');
    await usersPage.prevPage.click();
    await expect(usersPage.pageInfo).toContainText('Page 1 of 3');

    await expect(usersPage.tableRow(1)).toContainText('Alice Johnson');
    await usersPage.sortByName();
    await expect(usersPage.tableRow(1)).toContainText('Leo Garcia');
    await usersPage.sortByName();
    await expect(usersPage.tableRow(1)).toContainText('Alice Johnson');
    await usersPage.sortByRole();
    await expect(usersPage.tableRow(2)).toContainText('Frank Miller');
    await usersPage.sortByStatus();
    await expect(usersPage.tableRow(3)).toContainText('David Brown');

    await usersPage.userMenuButton(1).click();
    await expect(usersPage.page.getByTestId('edit-user-1')).toBeVisible();
    await usersPage.page.keyboard.press('Escape');

    await usersPage.selectAllCheckbox.click();
    await expect(usersPage.page.getByTestId('bulk-actions')).toBeVisible();
  });
});
