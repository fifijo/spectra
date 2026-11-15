import type { Locator, Page } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly profileTab: Locator;
  readonly notificationsTab: Locator;
  readonly appearanceTab: Locator;
  readonly securityTab: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly companyInput: Locator;
  readonly bioInput: Locator;
  readonly saveChangesButton: Locator;
  readonly themeCombobox: Locator;
  readonly languageCombobox: Locator;
  readonly timezoneCombobox: Locator;
  readonly deleteAccountButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Settings', level: 1 });
    this.profileTab = page.getByRole('tab', { name: /profile/i });
    this.notificationsTab = page.getByRole('tab', { name: /notifications/i });
    this.appearanceTab = page.getByRole('tab', { name: /appearance/i });
    this.securityTab = page.getByRole('tab', { name: /security/i });
    this.fullNameInput = page.getByLabel(/full name/i);
    this.emailInput = page.getByLabel(/email/i);
    this.companyInput = page.getByLabel(/company/i);
    this.bioInput = page.getByLabel(/bio/i);
    this.saveChangesButton = page.getByRole('button', { name: /save changes/i });
    this.themeCombobox = page
      .getByRole('combobox', { name: /theme/i })
      .or(page.getByLabel(/theme/i));
    this.languageCombobox = page
      .getByRole('combobox', { name: /language/i })
      .or(page.getByLabel(/language/i));
    this.timezoneCombobox = page
      .getByRole('combobox', { name: /timezone/i })
      .or(page.getByLabel(/timezone/i));
    this.deleteAccountButton = page.getByRole('button', { name: /delete account/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings');
  }
}
