# E2E / Playwright Testing

## Overview
Spectra uses **Playwright** for end-to-end tests. E2E tests run against a live application (the `dummy-test-app` in development/CI).

## Prerequisites
- Project built: `pnpm run build`
- Playwright browsers installed: `pnpm exec playwright install chromium`
- A running target application (see "Starting the Test App" below)

## Starting the Test App
The repo includes `dummy-test-app/`, a Vite + TypeScript app used as the System Under Test:
```bash
cd dummy-test-app
pnpm install
pnpm dev
```
This starts a dev server on `http://localhost:5173`.

## Commands

### Seed Spec (Environment Readiness)
```bash
pnpm run test:seed
```
Runs `tests/seed.spec.ts` which validates:
- Target URL is reachable (HTTP status < 400)
- Page has a document title

Always run the seed spec first to verify the environment before running other tests.

### Run All E2E Tests
```bash
pnpm test
```
Runs all Playwright tests in the `tests/` directory.

### Other Test Commands
```bash
pnpm run test:headed    # run with visible browser window
pnpm run test:ui        # Playwright interactive UI mode
pnpm report             # open HTML test report
```

### Run Specific Test File
```bash
pnpm exec playwright test tests/seed.spec.ts
pnpm exec playwright test tests/login.spec.ts
```

## Cross-Browser Testing
```bash
SPECTRA_BROWSERS=firefox pnpm test
SPECTRA_BROWSERS=chromium,firefox pnpm test
SPECTRA_BROWSERS=all pnpm test          # all browsers + mobile
```

## Tag Filtering
```bash
pnpm test --grep @smoke                 # only @smoke tests
pnpm test --grep @critical              # only @critical tests
pnpm test --grep-invert @slow           # skip @slow tests
pnpm test --grep "@auth|@login"         # multiple tags (OR)
SPECTRA_TAGS=@smoke pnpm test           # via env var
```

### Available Tags
| Tag | Purpose |
|-----|---------|
| `@smoke` | Quick sanity tests |
| `@critical` | Business-critical paths |
| `@e2e` | Full end-to-end flows |
| `@slow` | Long-running tests |
| `@flaky` | Known flaky tests |

## Playwright Configuration (`playwright.config.ts`)
- `testDir`: `./tests`
- `baseURL`: `process.env.SPECTRA_URL || 'http://localhost:5173'`
- `testIdAttribute`: `data-testid`
- Reporters: HTML (`.spectra/output/reports/`), JSON (`.spectra/output/reports/results.json`), list
- Output dir: `.spectra/output/test-results/`
- Browser: Chromium (Desktop Chrome) by default
- Retries: 0 locally, 2 in CI
- Workers: unlimited locally, 1 in CI
- Traces: on first retry
- Screenshots: only on failure

## Test Output Locations
| Artifact | Path |
|----------|------|
| HTML report | `.spectra/output/reports/` |
| JSON results | `.spectra/output/reports/results.json` |
| Test results/traces | `.spectra/output/test-results/` |

All output paths are gitignored via `.spectra/output/`.

## Seed Spec Details (`tests/seed.spec.ts`)
The seed spec is the environment readiness contract. It runs two tests, both tagged `@smoke`:
- `target URL is reachable` - the base URL responds with a status below 400
- `document title and app shell match dummy-test-app` - the title matches `/dummy-test-app/i` and the app shell's main navigation is visible

The URL comes from `playwright.config.ts` (`SPECTRA_URL`, default `http://localhost:5173`); the spec reads no env var of its own.

## Devin Secrets Needed
None required for basic E2E testing against the dummy-test-app. If testing against an authenticated app, you may need `SPECTRA_AUTH_USER` and `SPECTRA_AUTH_PASS`.
