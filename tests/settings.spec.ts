import { test, expect } from '../fixtures/pages';

test.describe('Settings', { tag: ['@e2e'] }, () => {
  test('tabs, profile save feedback, appearance and security controls', async ({ settingsPage }) => {
    await settingsPage.goto();
    await expect(settingsPage.heading).toBeVisible();

    await settingsPage.openProfileTab();
    await expect(settingsPage.profileCard).toBeVisible();
    await settingsPage.page.getByTestId('name-input').fill('Jane Doe');
    await settingsPage.saveProfileButton.click();
    await expect(settingsPage.saveProfileButton).toContainText('Saved!');

    await settingsPage.openNotificationsTab();
    await expect(settingsPage.notificationsCard).toBeVisible();
    await settingsPage.page.getByTestId('email-notifications-switch').click();

    await settingsPage.openAppearanceTab();
    await expect(settingsPage.appearanceCard).toBeVisible();
    await settingsPage.page.getByTestId('theme-select').click();
    await settingsPage.page.getByRole('option', { name: 'Dark' }).click();

    await settingsPage.openSecurityTab();
    await expect(settingsPage.securityCard).toBeVisible();
    await expect(settingsPage.page.getByTestId('enable-2fa-button')).toBeVisible();
    await expect(settingsPage.page.getByTestId('manage-sessions-button')).toBeVisible();
    await expect(settingsPage.page.getByTestId('delete-account-button')).toBeVisible();
  });
});
