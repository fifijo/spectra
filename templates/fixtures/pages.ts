/**
 * Spectra Test Fixtures
 *
 * This file provides reusable page object fixtures for tests.
 * Import from this file instead of '@playwright/test' for automatic
 * page object instantiation.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/pages';
 *
 *   test('example', async ({ dashboardPage }) => {
 *     await dashboardPage.goto();
 *     await expect(dashboardPage.someElement).toBeVisible();
 *   });
 *
 * The Generator Agent will automatically add new page objects here.
 */

import { test as base } from '@playwright/test';

// Import page objects as they are created
// import { DashboardPage } from '../pages/DashboardPage';

/**
 * Define the fixture types
 * Add new page types here as page objects are generated
 */
type PageFixtures = {
  // dashboardPage: DashboardPage;
};

/**
 * Extend the base test with page fixtures
 *
 * Each fixture:
 * - Creates a new page object instance
 * - Passes it to the test via `use()`
 * - Automatically handles cleanup
 */
export const test = base.extend<PageFixtures>({
  // Example fixture (uncomment and modify as needed):
  // dashboardPage: async ({ page }, use) => {
  //   const dashboard = new DashboardPage(page);
  //   await use(dashboard);
  // },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';
