import type { Locator, Page } from '@playwright/test';

export class TasksPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addTaskButton: Locator;
  readonly filterCombobox: Locator;
  readonly taskCount: Locator;
  readonly dialog: Locator;
  readonly dialogTitleInput: Locator;
  readonly dialogDescriptionInput: Locator;
  readonly dialogPriorityCombobox: Locator;
  readonly createTaskButton: Locator;
  readonly cancelButton: Locator;
  readonly taskCheckboxes: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Tasks', level: 1 });
    this.addTaskButton = page.getByRole('button', { name: /add task/i });
    this.filterCombobox = page
      .getByRole('combobox', { name: /all tasks|filter/i })
      .or(page.getByRole('combobox').first());
    this.taskCount = page.getByText(/\d+ tasks?/);
    this.dialog = page.getByRole('dialog');
    this.dialogTitleInput = this.dialog.getByLabel(/title/i);
    this.dialogDescriptionInput = this.dialog.getByLabel(/description/i);
    this.dialogPriorityCombobox = this.dialog.getByRole('combobox', { name: /priority/i });
    this.createTaskButton = this.dialog.getByRole('button', { name: /create task/i });
    this.cancelButton = this.dialog.getByRole('button', { name: /cancel/i });
    this.taskCheckboxes = page.getByRole('checkbox');
  }

  async goto(): Promise<void> {
    await this.page.goto('/tasks');
  }

  async openAddTaskDialog(): Promise<void> {
    await this.addTaskButton.click();
  }
}
