import type { Locator, Page } from '@playwright/test';

/** Sidebar and shared shell; base URL from Playwright config. */
export class AppShellPage {
  readonly page: Page;
  readonly mainNavigation: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainNavigation = page.getByTestId('main-navigation');
  }

  async clickNav(testId: string): Promise<void> {
    await this.page.getByTestId(testId).click();
  }

  async expectMainHeading(name: string | RegExp): Promise<void> {
    await this.page.getByRole('heading', { level: 1, name }).waitFor({ state: 'visible' });
  }
}
