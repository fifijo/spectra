import { test, expect } from '../fixtures/pages';

test.describe('Sidebar navigation', { tag: ['@smoke', '@e2e'] }, () => {
  test('covers all primary routes with expected headings', async ({
    page,
    dashboardPage,
    appShellPage,
  }) => {
    await dashboardPage.goto();
    await expect(dashboardPage.heading).toBeVisible();
    await expect(appShellPage.mainNavigation).toBeVisible();

    const cases: { nav: string; path: string; assert: () => Promise<void> }[] = [
      {
        nav: 'nav-tasks',
        path: '/tasks',
        assert: async () =>
          await expect(page.getByRole('heading', { level: 1, name: 'Tasks' })).toBeVisible(),
      },
      {
        nav: 'nav-products',
        path: '/products',
        assert: async () =>
          await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible(),
      },
      {
        nav: 'nav-checkout',
        path: '/checkout',
        assert: async () =>
          await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible(),
      },
      {
        nav: 'nav-kanban',
        path: '/kanban',
        assert: async () =>
          await expect(page.getByRole('heading', { name: 'Kanban Board' })).toBeVisible(),
      },
      {
        nav: 'nav-users',
        path: '/users',
        assert: async () =>
          await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible(),
      },
      {
        nav: 'nav-notifications',
        path: '/notifications',
        assert: async () =>
          await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible(),
      },
      {
        nav: 'nav-settings',
        path: '/settings',
        assert: async () =>
          await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible(),
      },
      {
        nav: 'nav-login',
        path: '/login',
        assert: async () => {
          await expect(page.getByTestId('login-card')).toBeVisible();
          await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
        },
      },
    ];

    for (const { nav, path, assert } of cases) {
      await appShellPage.clickNav(nav);
      expect(new URL(page.url()).pathname).toBe(path);
      await assert();
    }

    await appShellPage.clickNav('nav-dashboard');
    expect(new URL(page.url()).pathname).toBe('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});
