import { test, expect } from '../fixtures/pages';

test.describe('Kanban', { tag: ['@e2e', '@slow'] }, () => {
  test('drags a card between columns, adds a task, deletes via menu', async ({ kanbanPage }) => {
    await kanbanPage.goto();
    await expect(kanbanPage.heading).toBeVisible();

    const card = kanbanPage.taskCard('1');
    const target = kanbanPage.column('todo');
    await card.dragTo(target);
    await expect(kanbanPage.column('todo').getByTestId('task-card-1')).toBeVisible();

    await kanbanPage.addTaskForColumn('done').click();
    await expect(kanbanPage.column('done').getByText('New Task')).toBeVisible();

    await kanbanPage.openTaskCardMenu('7');
    await expect(kanbanPage.page.getByTestId('delete-task-7')).toBeVisible({ timeout: 5000 });
    await kanbanPage.page.getByTestId('delete-task-7').click();
    await expect(kanbanPage.taskCard('7')).toHaveCount(0);
  });
});
