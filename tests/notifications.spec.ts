import { test, expect } from '../fixtures/pages';

test.describe('Notifications', { tag: ['@e2e'] }, () => {
  test('mark read, mark all read, dismiss to empty, toggle settings', async ({
    notificationsPage,
  }) => {
    await notificationsPage.goto();
    await expect(notificationsPage.heading).toBeVisible();

    await expect(notificationsPage.markAllReadButton).toBeVisible();
    await notificationsPage.markReadButton(1).click();
    await expect(notificationsPage.notificationCard(1)).toContainText('Order Shipped');

    await notificationsPage.markAllReadButton.click();
    await expect(notificationsPage.markAllReadButton).toHaveCount(0);

    const list = notificationsPage.notificationsList;
    while ((await list.getByRole('button', { name: 'Dismiss' }).count()) > 0) {
      await list.getByRole('button', { name: 'Dismiss' }).first().click();
    }

    await expect(notificationsPage.page.getByText('No notifications')).toBeVisible();

    await notificationsPage.page.getByTestId('email-notifications-toggle').click();
    await notificationsPage.page.getByTestId('push-notifications-toggle').click();
    await notificationsPage.page.getByTestId('orders-notifications-toggle').click();
    await notificationsPage.page.getByTestId('marketing-notifications-toggle').click();
  });
});
