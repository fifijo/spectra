import { expect, test } from '../fixtures/pages.js';

test.describe('Dashboard', { tag: ['@smoke', '@e2e'] }, () => {
  test('loads with key metrics and recent sales', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.heading).toBeVisible();
    await expect(dashboardPage.page.getByText('Total Revenue')).toBeVisible();
    await expect(dashboardPage.page.getByText('Subscriptions')).toBeVisible();
    await expect(
      dashboardPage.page.getByRole('heading', { name: 'Sales', exact: true }),
    ).toBeVisible();
    await expect(dashboardPage.page.getByText('Active Now')).toBeVisible();
    await expect(dashboardPage.page.getByRole('heading', { name: 'Recent Sales' })).toBeVisible();
    await expect(dashboardPage.page.getByText('Olivia Martin')).toBeVisible();
  });
});
