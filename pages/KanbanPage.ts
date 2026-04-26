import type { Locator, Page } from '@playwright/test';

export class KanbanPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly kanbanBoard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Kanban Board' });
    this.kanbanBoard = page.getByTestId('kanban-board');
  }

  async goto(): Promise<void> {
    await this.page.goto('/kanban');
  }

  column(columnId: string): Locator {
    return this.page.getByTestId(`column-${columnId}`);
  }

  taskCard(taskId: string): Locator {
    return this.page.getByTestId(`task-card-${taskId}`);
  }

  addTaskForColumn(columnId: string): Locator {
    return this.page.getByTestId(`add-task-${columnId}`);
  }

  deleteTaskMenuItem(taskId: string): Locator {
    return this.page.getByTestId(`delete-task-${taskId}`);
  }

  editTaskMenuItem(taskId: string): Locator {
    return this.page.getByTestId(`edit-task-${taskId}`);
  }

  async openTaskCardMenu(taskId: string): Promise<void> {
    const card = this.taskCard(taskId);
    await card.getByRole('button').click();
  }
}
