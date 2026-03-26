/**
 * Spectra Seed Spec
 *
 * Single contract for login / data / flags so that Planner and
 * generated tests match reality. Run this before any agent pipeline:
 *
 *   npx playwright test tests/e2e/seed.spec.ts
 *
 * Fail-fast: if required env vars are missing or the target URL is
 * unreachable, the suite aborts immediately with a clear message.
 */

import { test, expect } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Environment validation — fail fast on missing config               */
/* ------------------------------------------------------------------ */

const SPECTRA_URL = process.env['SPECTRA_URL'] ?? 'http://localhost:5173';

// Add any additional required env vars here.
// Example: const AUTH_USER = requireEnv('SPECTRA_AUTH_USER');
//          const AUTH_PASS = requireEnv('SPECTRA_AUTH_PASS');

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        'Set it before running the seed spec.',
    );
  }
  return value;
}

/* ------------------------------------------------------------------ */
/*  Seed tests                                                         */
/* ------------------------------------------------------------------ */

test.describe('Seed: environment readiness', () => {
  test('target URL is reachable', async ({ page }) => {
    const response = await page.goto(SPECTRA_URL);
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
  });

  test('page has a document title', async ({ page }) => {
    await page.goto(SPECTRA_URL);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

/**
 * Uncomment and customise the sections below once your application
 * has authentication, test data, or feature flags.
 */

// test.describe('Seed: authentication', () => {
//   test('can log in and obtain storageState', async ({ page }) => {
//     const user = requireEnv('SPECTRA_AUTH_USER');
//     const pass = requireEnv('SPECTRA_AUTH_PASS');
//
//     await page.goto(`${SPECTRA_URL}/login`);
//     await page.getByLabel('Email').fill(user);
//     await page.getByLabel('Password').fill(pass);
//     await page.getByRole('button', { name: /log in|sign in/i }).click();
//
//     // Wait for redirect to authenticated area
//     await page.waitForURL('**/dashboard');
//
//     // Persist storageState for downstream tests
//     await page.context().storageState({ path: '.auth/user.json' });
//   });
// });

// test.describe('Seed: test data', () => {
//   test('required test records exist', async ({ request }) => {
//     // Example: verify API returns expected seed data
//     const response = await request.get(`${SPECTRA_URL}/api/health`);
//     expect(response.ok()).toBeTruthy();
//   });
// });

// test.describe('Seed: feature flags', () => {
//   test('required flags are enabled', async ({ page }) => {
//     await page.goto(SPECTRA_URL);
//
//     // Example: check that the feature under test is visible
//     // await expect(page.getByTestId('new-checkout')).toBeVisible();
//   });
// });
