# CI/CD Workflow

## Overview
Spectra uses **GitHub Actions** for CI. The workflow file is `.github/workflows/test.yml`.

## Trigger Conditions
- Push to `main` or `master`
- Pull requests targeting `main` or `master`
- Manual trigger via `workflow_dispatch`

## Pipeline Steps

| Step | Command | Notes |
|------|---------|-------|
| 1. Checkout | `actions/checkout@v4` | |
| 2. pnpm setup | `pnpm/action-setup@v4` | Version from `packageManager` field |
| 3. Node.js setup | `actions/setup-node@v4` | Node 22, pnpm cache |
| 4. Install deps | `pnpm install` | |
| 5. Unit tests | `pnpm test:unit` | Vitest |
| 6. Install browsers | `pnpm exec playwright install --with-deps chromium` | |
| 7. Install dummy-test-app deps | `pnpm install` (in `dummy-test-app/`) | |
| 8. Start app | `pnpm dev &` (in `dummy-test-app/`) | Background process |
| 9. Wait for app | `curl` health check, 30s timeout | Polls `http://localhost:5173` |
| 10. Run E2E tests | `pnpm test` | Playwright |
| 11. Upload report | `actions/upload-artifact@v4` | Always (pass or fail) |
| 12. Upload traces | `actions/upload-artifact@v4` | On failure only |

## CI Environment Variables
| Variable | Value |
|----------|-------|
| `CI` | `true` (set automatically) |
| `SPECTRA_URL` | `http://localhost:5173` |

## Artifacts

| Artifact | Path | Retention | Upload Condition |
|----------|------|-----------|-----------------|
| `playwright-report` | `.spectra/output/reports/` | 30 days | Always |
| `test-artifacts` | `.spectra/output/test-results/`, `.spectra/output/reports/results.json` | 7 days | On failure |

## Timeout
- Job timeout: 30 minutes

## Modifying CI
When updating the workflow:
- The "Start application" section is the main area to customize for different target apps
- Unit tests run **before** browser installation to fail fast on code issues
- The dummy-test-app must be kept working for CI to pass
- The app health check uses `curl -s http://localhost:5173` with a 30-second timeout

## Running CI Checks Locally
To replicate what CI does:
```bash
pnpm install
pnpm test:unit
pnpm exec playwright install --with-deps chromium
cd dummy-test-app && pnpm install && pnpm dev &
# Wait for app to be ready
pnpm test
```

## Devin Secrets Needed
None required. CI runs without any secrets or tokens for testing.
