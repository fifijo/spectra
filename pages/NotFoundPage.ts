import type { Page } from '@playwright/test';

export class NotFoundPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/this-route-does-not-exist');
  }
}
