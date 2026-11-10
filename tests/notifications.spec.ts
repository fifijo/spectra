import { test, expect } from '../fixtures/pages.js';

test.describe('Notifications', { tag: ['@e2e'] }, () => {
  test('mark read, mark all read, dismiss to empty, toggle settings', async ({
    notificationsPage,
  }) => {
    await notificationsPage.goto();
    await expect(notificationsPage.heading).toBeVisible();

    await expect(notificationsPage.markAllReadButton).toBeVisible();
    await notificationsPage.markReadButton(1).click();
    await expect(notificationsPage.markReadButton(1)).toHaveCount(0);

    await notificationsPage.markAllReadButton.click();
    await expect(notificationsPage.markAllReadButton).toHaveCount(0);

    const list = notificationsPage.notificationsList;
    while ((await list.getByRole('button', { name: 'Dismiss' }).count()) > 0) {
      await list.getByRole('button', { name: 'Dismiss' }).first().click();
    }

    await expect(notificationsPage.page.getByText('No notifications')).toBeVisible();

    const emailToggle = notificationsPage.settingsToggle('email');
    const pushToggle = notificationsPage.settingsToggle('push');
    const ordersToggle = notificationsPage.settingsToggle('orders');
    const marketingToggle = notificationsPage.settingsToggle('marketing');

    await expect(emailToggle).toBeChecked();
    await emailToggle.click();
    await expect(emailToggle).not.toBeChecked();

    await expect(pushToggle).toBeChecked();
    await pushToggle.click();
    await expect(pushToggle).not.toBeChecked();

    await expect(ordersToggle).toBeChecked();
    await ordersToggle.click();
    await expect(ordersToggle).not.toBeChecked();

    await expect(marketingToggle).not.toBeChecked();
    await marketingToggle.click();
    await expect(marketingToggle).toBeChecked();
  });
});
