import type { Locator, Page } from '@playwright/test';

export class NotificationsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly markAllReadButton: Locator;
  readonly emailSwitch: Locator;
  readonly pushSwitch: Locator;
  readonly orderUpdatesSwitch: Locator;
  readonly marketingSwitch: Locator;
  readonly enableSoundButton: Locator;
  readonly durationButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Notifications', level: 1 });
    this.markAllReadButton = page.getByRole('button', { name: /mark all as read/i });
    const settingsCard = page
      .getByRole('heading', { name: 'Notification Settings' })
      .locator('..')
      .locator('..');
    this.emailSwitch = settingsCard.getByRole('switch').nth(0);
    this.pushSwitch = settingsCard.getByRole('switch').nth(1);
    this.orderUpdatesSwitch = settingsCard.getByRole('switch').nth(2);
    this.marketingSwitch = settingsCard.getByRole('switch').nth(3);
    this.enableSoundButton = page.getByRole('button', { name: /enable sound/i });
    this.durationButton = page.getByRole('button', { name: /duration/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/notifications');
  }
}
