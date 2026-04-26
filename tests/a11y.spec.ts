import { test, expect } from '../fixtures/pages';

test.describe('Accessibility spot checks', { tag: ['@e2e'] }, () => {
  test('landmarks on dashboard and forms on login and checkout', async ({
    page,
    dashboardPage,
    loginPage,
    checkoutPage,
  }) => {
    await dashboardPage.goto();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByTestId('main-navigation')).toBeVisible();

    await loginPage.goto();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();

    await checkoutPage.goto();
    await expect(page.getByLabel('First Name')).toBeVisible();
    await expect(page.getByLabel('Last Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});
