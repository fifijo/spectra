# CI/CD Integration (Optional)

Spectra includes an optional GitHub Actions workflow for running tests in CI.

## Enable CI

`spectra --init` creates `.github/workflows/test.yml` in your project. It runs
on every push and every pull request to `main` or `master`, and you can start
it by hand. It will:

1. Install dependencies and Playwright browsers
2. Install your application's dependencies
3. Run all Playwright tests with `npx playwright test`
4. Upload the HTML report of every run, and the test artifacts of a failed run

The workflow runs `npx playwright test` with `CI: true` and `SPECTRA_URL` — it
does not run `pnpm test`, because that script belongs to the Spectra
repository, not to your project.

## Artifacts

| Artifact | Path | When | Retention |
|----------|------|------|------------|
| `playwright-report` | `.spectra/output/reports/` | every run | 30 days |
| `test-artifacts` | `.spectra/output/test-results/`, `.spectra/output/reports/results.json` | on failure | 7 days |

The JSON results are what the Healer reads, so a failed run keeps them.
They also tell the Spectrum whether the run was green: the CLI exits non-zero
when a test is still failing. `specs/CI-HEALER-POLICY.md` has the whole policy.

## Configuration

Edit the block marked `# UPDATE THIS SECTION FOR YOUR APPLICATION` in
`.github/workflows/test.yml` to point at your application and install its
dependencies:

```yaml
# ============================================
# UPDATE THIS SECTION FOR YOUR APPLICATION
# ============================================
- name: Install your application dependencies
  working-directory: your-app-directory
  run: pnpm install
# ============================================
```

## Your Application Must Be Started by Playwright

The scaffolded `playwright.config.ts` has no `webServer` block, so add one that
points at your app:

```typescript
webServer: {
  command: 'pnpm run dev',
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
},
```

`reuseExistingServer: !process.env.CI` is the rule this repository uses:
locally Playwright reuses a server you already started, in CI it starts one and
fails the job if the port is taken.

Keep `SPECTRA_URL` in the workflow in step with the `baseURL` in your
Playwright config.

## Environment Variables in CI

| Variable | Description | Value in the workflow |
|----------|-------------|----------------------|
| `CI` | Set automatically by GitHub Actions | `true` |
| `SPECTRA_URL` | Base URL for tests | `http://localhost:5173` |

`CI` also changes the shipped Playwright config: a failed test is retried
twice, the run uses a single worker, and `test.only` is refused.

## Manual Trigger

You can manually trigger the workflow from the GitHub Actions tab using `workflow_dispatch`.
