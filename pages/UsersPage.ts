import type { Locator, Page } from '@playwright/test';

export class UsersPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly usersToolbar: Locator;
  readonly searchInput: Locator;
  readonly roleFilterSelect: Locator;
  readonly statusFilterSelect: Locator;
  readonly selectAllCheckbox: Locator;
  readonly pagination: Locator;
  readonly pageInfo: Locator;
  readonly nextPage: Locator;
  readonly prevPage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Users' });
    this.usersToolbar = page.getByTestId('users-toolbar');
    this.searchInput = page.getByTestId('search-users-input');
    this.roleFilterSelect = page.getByTestId('role-filter-select');
    this.statusFilterSelect = page.getByTestId('status-filter-select');
    this.selectAllCheckbox = page.getByTestId('select-all-checkbox');
    this.pagination = page.getByTestId('pagination');
    this.pageInfo = page.getByTestId('page-info');
    this.nextPage = page.getByTestId('next-page');
    this.prevPage = page.getByTestId('prev-page');
  }

  async goto(): Promise<void> {
    await this.page.goto('/users');
  }

  userRow(userId: number): Locator {
    return this.page.getByTestId(`user-row-${userId}`);
  }

  selectUserCheckbox(userId: number): Locator {
    return this.page.getByTestId(`select-user-${userId}`);
  }

  userMenuButton(userId: number): Locator {
    return this.page.getByTestId(`user-menu-${userId}`);
  }

  async sortByName(): Promise<void> {
    await this.page.getByTestId('sort-by-name').click();
  }

  async sortByRole(): Promise<void> {
    await this.page.getByTestId('sort-by-role').click();
  }

  async sortByStatus(): Promise<void> {
    await this.page.getByTestId('sort-by-status').click();
  }

  async selectRoleFilter(optionLabel: string): Promise<void> {
    await this.roleFilterSelect.click();
    await this.page.getByRole('option', { name: optionLabel, exact: true }).click();
  }

  async selectStatusFilter(optionLabel: string): Promise<void> {
    await this.statusFilterSelect.click();
    await this.page.getByRole('option', { name: optionLabel, exact: true }).click();
  }
}
