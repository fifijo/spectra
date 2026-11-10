import type { Locator, Page } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly statsGrid: Locator;
  readonly overviewCard: Locator;
  readonly recentSalesCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Dashboard' });
    this.statsGrid = page.getByTestId('stats-grid');
    this.overviewCard = page.getByTestId('overview-card');
    this.recentSalesCard = page.getByTestId('recent-sales-card');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }
}
