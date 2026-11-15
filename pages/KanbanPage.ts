import type { Locator, Page } from '@playwright/test';

export class KanbanPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly backlogColumn: Locator;
  readonly todoColumn: Locator;
  readonly inProgressColumn: Locator;
  readonly doneColumn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Kanban Board', level: 1 });
    this.backlogColumn = page.getByText('Backlog').locator('..');
    this.todoColumn = page.getByText('To Do').locator('..');
    this.inProgressColumn = page.getByText('In Progress').locator('..');
    this.doneColumn = page.getByText('Done').locator('..');
  }

  async goto(): Promise<void> {
    await this.page.goto('/kanban');
  }
}
