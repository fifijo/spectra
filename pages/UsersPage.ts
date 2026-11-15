import type { Locator, Page } from '@playwright/test';

export class UsersPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly roleFilter: Locator;
  readonly statusFilter: Locator;
  readonly table: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;
  readonly pageInfo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Users', level: 1 });
    this.searchInput = page.getByPlaceholder('Search users...');
    this.roleFilter = page.getByRole('combobox').first();
    this.statusFilter = page.getByRole('combobox').nth(1);
    this.table = page.getByRole('table');
    const pagination = page.getByText(/Page 1 of 3/).locator('..');
    this.pageInfo = page.getByText(/Page 1 of 3/);
    this.nextPageButton = pagination.getByRole('button').last();
    this.prevPageButton = pagination.getByRole('button').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/users');
  }
}
