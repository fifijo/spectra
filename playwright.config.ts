import { defineConfig, devices, type Project } from '@playwright/test';

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

/** SPECTRA_BROWSERS: comma separated list of chromium, firefox, webkit, mobile or all */
function buildProjects(): Project[] {
  const requested = (process.env.SPECTRA_BROWSERS || 'chromium')
    .split(',')
    .map((b) => b.trim().toLowerCase())
    .filter(Boolean);
  const names = requested.includes('all') ? ['chromium', 'firefox', 'webkit', 'mobile'] : requested;

  const projects: Project[] = [];
  for (const name of names) {
    if (name === 'chromium') projects.push({ name, use: { ...devices['Desktop Chrome'] } });
    else if (name === 'firefox') projects.push({ name, use: { ...devices['Desktop Firefox'] } });
    else if (name === 'webkit') projects.push({ name, use: { ...devices['Desktop Safari'] } });
    else if (name === 'mobile') projects.push({ name, use: { ...devices['Pixel 5'] } });
    else
      console.warn(
        `Unknown browser "${name}", ignored. Use chromium, firefox, webkit, mobile or all.`,
      );
  }
  return projects;
}

/** SPECTRA_TAGS: comma separated list of tags, e.g. @smoke,@critical */
const tagFilter = process.env.SPECTRA_TAGS;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  grep: tagFilter
    ? new RegExp(
        tagFilter
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .join('|'),
      )
    : undefined,
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

  projects: buildProjects(),

  outputDir: '.spectra/output/test-results',
});
