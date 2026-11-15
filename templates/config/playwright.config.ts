import { defineConfig, devices, type Project } from '@playwright/test';

const baseURL = process.env.SPECTRA_URL || 'http://localhost:5173';

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
    // The HTML report has a folder of its own: the reporter wipes it when the
    // run starts, and the Healing Report lives next to it.
    ['html', { outputFolder: '.spectra/output/reports/html' }],
    ['json', { outputFile: '.spectra/output/reports/results.json' }],
    ['list'],
  ],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // A failing test leaves a video next to its screenshot and its trace.
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
  },

  projects: buildProjects(),

  outputDir: '.spectra/output/test-results',
});
