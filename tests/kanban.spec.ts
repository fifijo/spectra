import { expect, test } from '../fixtures/pages.js';

test.describe('Kanban board', { tag: ['@smoke', '@e2e'] }, () => {
  test('shows board columns and cards', async ({ kanbanPage }) => {
    await kanbanPage.goto();
    await expect(kanbanPage.heading).toBeVisible();
    await expect(kanbanPage.page.getByText('Backlog')).toBeVisible();
    await expect(kanbanPage.page.getByText('To Do')).toBeVisible();
    await expect(kanbanPage.page.getByText('In Progress')).toBeVisible();
    await expect(kanbanPage.page.getByText('Done')).toBeVisible();
    await expect(kanbanPage.page.getByText('User authentication flow')).toBeVisible();
  });
});
