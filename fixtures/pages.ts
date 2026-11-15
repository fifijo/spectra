/**
 * Spectra Test Fixtures
 *
 * This file provides reusable page object fixtures for tests.
 * Import from this file instead of '@playwright/test' for automatic
 * page object instantiation.
 */

import { test as base } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { KanbanPage } from '../pages/KanbanPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import { NotFoundPage } from '../pages/NotFoundPage.js';
import { NotificationsPage } from '../pages/NotificationsPage.js';
import { ProductsPage } from '../pages/ProductsPage.js';
import { SettingsPage } from '../pages/SettingsPage.js';
import { TasksPage } from '../pages/TasksPage.js';
import { UsersPage } from '../pages/UsersPage.js';

type PageFixtures = {
  dashboardPage: DashboardPage;
  loginPage: LoginPage;
  tasksPage: TasksPage;
  productsPage: ProductsPage;
  checkoutPage: CheckoutPage;
  kanbanPage: KanbanPage;
  usersPage: UsersPage;
  notificationsPage: NotificationsPage;
  settingsPage: SettingsPage;
  notFoundPage: NotFoundPage;
};

export const test = base.extend<PageFixtures>({
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
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
  notFoundPage: async ({ page }, use) => {
    await use(new NotFoundPage(page));
  },
});

export { expect } from '@playwright/test';
