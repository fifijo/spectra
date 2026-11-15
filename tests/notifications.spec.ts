import { expect, test } from '../fixtures/pages.js';

test.describe('Notifications interaction', { tag: ['@interaction', '@e2e'] }, () => {
  test('notification preference switches toggle', async ({ notificationsPage }) => {
    await notificationsPage.goto();
    const toggle = notificationsPage.marketingSwitch;
    const wasChecked = await toggle.isChecked();
    await toggle.click();
    await expect(toggle).toBeChecked({ checked: !wasChecked });
  });
});

test.describe('Notifications actions', { tag: ['@smoke', '@e2e'] }, () => {
  test('mark all as read button is visible when unread exist', async ({ notificationsPage }) => {
    await notificationsPage.goto();
    await expect(notificationsPage.markAllReadButton).toBeVisible();
  });
});
