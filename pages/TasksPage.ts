import type { Locator, Page } from '@playwright/test';

export class TasksPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addTaskButton: Locator;
  readonly addTaskDialog: Locator;
  readonly taskTitleInput: Locator;
  readonly taskDescriptionInput: Locator;
  readonly submitTaskButton: Locator;
  readonly taskPrioritySelect: Locator;
  readonly filterSelect: Locator;
  readonly taskList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { level: 1, name: 'Tasks' });
    this.addTaskButton = page.getByTestId('add-task-button');
    this.addTaskDialog = page.getByTestId('add-task-dialog');
    this.taskTitleInput = page.getByTestId('task-title-input');
    this.taskDescriptionInput = page.getByTestId('task-description-input');
    this.submitTaskButton = page.getByTestId('submit-task-button');
    this.taskPrioritySelect = page.getByTestId('task-priority-select');
    this.filterSelect = page.getByTestId('filter-select');
    this.taskList = page.getByTestId('task-list');
  }

  async goto(): Promise<void> {
    await this.page.goto('/tasks');
  }

  async openAddTaskDialog(): Promise<void> {
    await this.addTaskButton.click();
    await this.addTaskDialog.waitFor({ state: 'visible' });
  }

  taskItem(taskId: number | string): Locator {
    return this.page.getByTestId(`task-item-${taskId}`);
  }

  taskCheckbox(taskId: number | string): Locator {
    return this.page.getByTestId(`task-checkbox-${taskId}`);
  }

  deleteTaskButton(taskId: number | string): Locator {
    return this.page.getByTestId(`delete-task-${taskId}`);
  }

  async setFilter(label: string): Promise<void> {
    await this.filterSelect.click();
    await this.page.getByRole('option', { name: label }).click();
  }

  async setTaskPriority(label: string): Promise<void> {
    await this.taskPrioritySelect.click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }
}
