import type { Locator, Page } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly settingsTabs: Locator;
  readonly profileTab: Locator;
  readonly notificationsTab: Locator;
  readonly appearanceTab: Locator;
  readonly securityTab: Locator;
  readonly saveProfileButton: Locator;
  readonly profileCard: Locator;
  readonly notificationsCard: Locator;
  readonly appearanceCard: Locator;
  readonly securityCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Settings' });
    this.settingsTabs = page.getByTestId('settings-tabs');
    this.profileTab = page.getByTestId('profile-tab');
    this.notificationsTab = page.getByTestId('notifications-tab');
    this.appearanceTab = page.getByTestId('appearance-tab');
    this.securityTab = page.getByTestId('security-tab');
    this.saveProfileButton = page.getByTestId('save-profile-button');
    this.profileCard = page.getByTestId('profile-card');
    this.notificationsCard = page.getByTestId('notifications-card');
    this.appearanceCard = page.getByTestId('appearance-card');
    this.securityCard = page.getByTestId('security-card');
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings');
  }

  async openProfileTab(): Promise<void> {
    await this.profileTab.click();
  }

  async openNotificationsTab(): Promise<void> {
    await this.notificationsTab.click();
  }

  async openAppearanceTab(): Promise<void> {
    await this.appearanceTab.click();
  }

  async openSecurityTab(): Promise<void> {
    await this.securityTab.click();
  }
}
