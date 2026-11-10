/**
 * Spectra page object fixtures. Prefer `import { test, expect } from '../fixtures/pages.js'`.
 */

import { test as base } from '@playwright/test';
import { AppShellPage } from '../pages/AppShellPage.js';
import { CheckoutPage } from '../pages/CheckoutPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { KanbanPage } from '../pages/KanbanPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { NotificationsPage } from '../pages/NotificationsPage.js';
import { ProductsPage } from '../pages/ProductsPage.js';
import { SettingsPage } from '../pages/SettingsPage.js';
import { TasksPage } from '../pages/TasksPage.js';
import { UsersPage } from '../pages/UsersPage.js';

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
