import { expect, test } from '../fixtures/pages.js';

test.describe('Settings tabs interaction', { tag: ['@interaction', '@e2e'] }, () => {
  test('switches between settings tabs', async ({ settingsPage }) => {
    await settingsPage.goto();
    await expect(settingsPage.profileTab).toHaveAttribute('aria-selected', 'true');

    await settingsPage.notificationsTab.click();
    await expect(settingsPage.notificationsTab).toHaveAttribute('aria-selected', 'true');
    await expect(settingsPage.page.getByText('Notification Preferences')).toBeVisible();

    await settingsPage.appearanceTab.click();
    await expect(settingsPage.appearanceTab).toHaveAttribute('aria-selected', 'true');
    await expect(settingsPage.page.getByText('Appearance Settings')).toBeVisible();

    await settingsPage.securityTab.click();
    await expect(settingsPage.securityTab).toHaveAttribute('aria-selected', 'true');
    await expect(settingsPage.page.getByText('Security Settings')).toBeVisible();
  });
});
