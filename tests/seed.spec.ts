/**
 * Spectra Seed Spec
 *
 * Single contract for login / data / flags so that Planner and
 * generated tests match reality. Run this before any agent pipeline:
 *
 *   npx playwright test tests/seed.spec.ts
 *
 * Fail-fast: if required env vars are missing or the target URL is
 * unreachable, the suite aborts immediately with a clear message.
 */

import { test, expect } from '../fixtures/pages';

/* ------------------------------------------------------------------ */
/*  Seed tests (aligns with test plan: smoke + shell)                 */
/* ------------------------------------------------------------------ */

test.describe('Seed: environment readiness', { tag: ['@smoke'] }, () => {
  test('target URL is reachable', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
  });

  test('document title and app shell match dummy-test-app', async ({ page, appShellPage }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/dummy-test-app/i);
    await expect(appShellPage.mainNavigation).toBeVisible();
  });
});
