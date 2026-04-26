import type { Locator, Page } from '@playwright/test';

export class NotificationsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly notificationsList: Locator;
  readonly markAllReadButton: Locator;
  readonly notificationSettings: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Notifications' });
    this.notificationsList = page.getByTestId('notifications-list');
    this.markAllReadButton = page.getByTestId('mark-all-read-button');
    this.notificationSettings = page.getByTestId('notification-settings');
  }

  async goto(): Promise<void> {
    await this.page.goto('/notifications');
  }

  notificationCard(id: number): Locator {
    return this.page.getByTestId(`notification-${id}`);
  }

  markReadButton(id: number): Locator {
    return this.page.getByTestId(`mark-read-${id}`);
  }

  dismissButton(id: number): Locator {
    return this.page.getByTestId(`dismiss-${id}`);
  }
}
