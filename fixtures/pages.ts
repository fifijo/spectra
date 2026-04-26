/**
 * Spectra page object fixtures. Prefer `import { test, expect } from '../fixtures/pages'`.
 */

import { test as base } from '@playwright/test';
import { AppShellPage } from '../pages/AppShellPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { DashboardPage } from '../pages/DashboardPage';
import { KanbanPage } from '../pages/KanbanPage';
import { LoginPage } from '../pages/LoginPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ProductsPage } from '../pages/ProductsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { TasksPage } from '../pages/TasksPage';
import { UsersPage } from '../pages/UsersPage';

type PageFixtures = {
  appShellPage: AppShellPage;
  dashboardPage: DashboardPage;
  tasksPage: TasksPage;
  productsPage: ProductsPage;
  checkoutPage: CheckoutPage;
  kanbanPage: KanbanPage;
  usersPage: UsersPage;
  notificationsPage: NotificationsPage;
  settingsPage: SettingsPage;
  loginPage: LoginPage;
};

export const test = base.extend<PageFixtures>({
  appShellPage: async ({ page }, use) => {
    await use(new AppShellPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  tasksPage: async ({ page }, use) => {
    await use(new TasksPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  kanbanPage: async ({ page }, use) => {
    await use(new KanbanPage(page));
  },
  usersPage: async ({ page }, use) => {
    await use(new UsersPage(page));
  },
  notificationsPage: async ({ page }, use) => {
    await use(new NotificationsPage(page));
  },
  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from '@playwright/test';
