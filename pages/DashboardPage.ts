import type { Locator, Page } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly totalRevenueCard: Locator;
  readonly subscriptionsCard: Locator;
  readonly salesCard: Locator;
  readonly activeNowCard: Locator;
  readonly recentSalesSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Dashboard', level: 1 });
    this.subtitle = page.getByText("Welcome back! Here's an overview of your business.");
    this.totalRevenueCard = page.getByText('Total Revenue').locator('..');
    this.subscriptionsCard = page.getByText('Subscriptions').locator('..');
    this.salesCard = page.getByText('Sales').locator('..');
    this.activeNowCard = page.getByText('Active Now').locator('..');
    this.recentSalesSection = page.getByText('Recent Sales').locator('..');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }
}
