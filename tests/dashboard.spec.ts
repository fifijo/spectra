import { test, expect } from '../fixtures/pages';

test.describe('Dashboard', { tag: ['@smoke', '@e2e'] }, () => {
  test('shows stats grid, overview, and recent sales', async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.heading).toBeVisible();
    await expect(dashboardPage.statsGrid).toBeVisible();
    await expect(dashboardPage.statsGrid.getByTestId('stat-card-0')).toBeVisible();
    await expect(dashboardPage.overviewCard).toBeVisible();
    await expect(dashboardPage.recentSalesCard).toBeVisible();
    await expect(dashboardPage.recentSalesCard.getByTestId('sale-item-0')).toBeVisible();
  });
});
