import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.SPECTRA_URL || 'http://localhost:5173';

function shouldStartLocalWebServer(url: string): boolean {
  if (process.env.SPECTRA_SKIP_WEBSERVER) return false;
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: '.spectra/output/reports' }],
    ['json', { outputFile: '.spectra/output/reports/results.json' }],
    ['list'],
  ],

  ...(shouldStartLocalWebServer(baseURL)
    ? {
        webServer: {
          command: 'pnpm run dev',
          cwd: './dummy-test-app',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
        },
      }
    : {}),

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    testIdAttribute: 'data-testid',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  outputDir: '.spectra/output/test-results',
});
