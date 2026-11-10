# CI/CD Integration (Optional)

Spectra includes an optional GitHub Actions workflow for running tests in CI.

## Enable CI

`spectra --init` creates `.github/workflows/test.yml` in your project. It will:

1. Install dependencies and Playwright browsers
2. Install your application's dependencies
3. Run all Playwright tests with `npx playwright test`
4. Upload test reports as artifacts

The workflow runs `npx playwright test` with `CI: true` and `SPECTRA_URL` — it
does not run `pnpm test`, because that script belongs to the Spectra
repository, not to your project.

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

## Manual Trigger

You can manually trigger the workflow from the GitHub Actions tab using `workflow_dispatch`.
