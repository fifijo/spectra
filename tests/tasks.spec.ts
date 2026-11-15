import { expect, test } from '../fixtures/pages.js';

test.describe('Tasks dialog', { tag: ['@e2e', '@interaction'] }, () => {
  test('add task dialog opens and closes', async ({ tasksPage }) => {
    await tasksPage.goto();
    await tasksPage.openAddTaskDialog();
    await expect(tasksPage.dialog).toBeVisible();
    await tasksPage.cancelButton.click();
    await expect(tasksPage.dialog).toBeHidden();
  });
});

test.describe('Tasks form validation', { tag: ['@validation'] }, () => {
  test('empty title submit keeps dialog open', async ({ tasksPage }) => {
    await tasksPage.goto();
    await tasksPage.openAddTaskDialog();
    await tasksPage.createTaskButton.click();
    await expect(tasksPage.dialog).toBeVisible();
  });
});

test.describe('Tasks interaction', { tag: ['@interaction'] }, () => {
  test('task checkbox can be toggled', async ({ tasksPage }) => {
    await tasksPage.goto();
    const checkbox = tasksPage.page.getByRole('checkbox').first();
    const wasChecked = await checkbox.isChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked({ checked: !wasChecked });
  });
});
