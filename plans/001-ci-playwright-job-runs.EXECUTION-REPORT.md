# Execution Report: The Playwright CI job starts and runs the whole suite

> Date: 2026-11-10 10:06 CET
>
> Mode: Batch
>
> Plan: `plans/001-ci-playwright-job-runs.md` — branch `advisor/001-ci-playwright-job-runs`

## Summary

- **Overall result: Completed**
- The workflow no longer starts the dummy app by hand; Playwright owns the
  server lifecycle through the existing `webServer` block in
  `playwright.config.ts`.
- Every plan verification command passed, including the e2e collection count
  (18 tests in 12 files).
- Extra proof beyond the plan: the CI path was run for real locally
  (`CI=true` + Playwright-started server) and the readiness specs passed.

## Phase Results

- Step 1: Remove the hand-rolled app startup — ✅
  - Implemented: deleted the `Start application` and `Wait for application`
    steps from `.github/workflows/test.yml`; kept the `# UPDATE THIS SECTION`
    markers and the `Install dummy-test-app dependencies` step. The header
    comment that pointed at the removed step now points at the marker block.
  - Verification: `grep -n "Start application\|Wait for application"
    .github/workflows/test.yml` → no output.
  - Notes: the header comment had to change because it also matched the
    plan's own "no `Start application`" grep criterion.
- Step 2: Let Playwright own the server lifecycle — ✅
  - Implemented: nothing to change; `SPECTRA_SKIP_WEBSERVER` was deliberately
    not added.
  - Verification: `grep -n "SPECTRA_SKIP_WEBSERVER" .github/workflows/test.yml`
    → no output; `playwright.config.ts` untouched (`git diff` shows one file).
  - Notes: `reuseExistingServer: !process.env.CI` is now correct — Playwright
    starts the app and fails the job if it cannot.
- Step 3: Prove the steps run in the right order — ✅
  - Implemented: n/a (verification only).
  - Verification: `node -e "const u=new URL('http://localhost:5173');console.log(u.hostname==='localhost')"`
    → `true`.
  - Notes: the config's `webServer` waits for the URL before the first test,
    so no wait step is needed.
- Step 4: Verify the whole local gate — ✅
  - Implemented: n/a (verification only).
  - Verification: `pnpm typecheck && pnpm lint && pnpm format:check &&
    pnpm test:unit` → all exit 0; lint/format checked 30 files; vitest: 12
    files, 111 tests passed.
  - Notes: none.
- Step 5: Verify the e2e suite can be collected — ✅
  - Implemented: n/a (verification only).
  - Verification: `pnpm --dir dummy-test-app install` → exit 0;
    `pnpm exec playwright test --list` → `Total: 18 tests in 12 files`.
  - Notes: on this machine the install needed
    `pnpm --dir dummy-test-app install --ignore-workspace` to actually place
    the dummy app's packages — the machine has a `/home/chris/pnpm-workspace.yaml`,
    so pnpm otherwise hoists the install to a parent workspace. This is a
    local environment quirk; the workflow's plain `pnpm install` is correct on
    a GitHub Actions checkout, which has no parent workspace.

## Verification Matrix

- Lint: pass (`pnpm lint` — 30 files, no fixes applied)
- Format check: pass (`pnpm format:check` — 30 files, no fixes applied)
- Type check: pass (`pnpm typecheck`)
- Unit tests: pass (`pnpm test:unit` — 12 files, 111 tests)
- E2E collection: pass (`pnpm exec playwright test --list` — 18 tests in 12 files)
- E2E run on the CI path (extra): pass
  (`CI=true SPECTRA_URL=http://localhost:5173 pnpm exec playwright test
  tests/seed.spec.ts` → 2 passed; Playwright started the app itself)
- Build: not run — no source code changed
- Manual QA: pending — the real GitHub Actions run happens on the next push

## Deviations

- The workflow header comment was repointed from the removed "Start
  application" step to the `# UPDATE THIS SECTION` block. Required by the
  plan's own done criterion (`grep -n "Start application"` must return
  nothing); still inside the single in-scope file.
- The execution report was written to `plans/` instead of
  `docs/.plans/YYMMDD-HHmm-<slug>/`: the repo keeps plans in `plans/` and
  has no `docs/.plans/` tree, and the plan forbids new tracked files outside
  the workflow.
- No scope change: only `.github/workflows/test.yml` is committed.

## Blockers and Resolutions

- Blocker: the dummy app had no `vite` after `pnpm --dir dummy-test-app
  install`, so Playwright's `webServer` failed with `sh: 1: vite: not found`.
- Impact: blocked the optional local end-to-end check only; the plan's own
  verification commands were unaffected.
- Resolution: installed the dummy app's dependencies with `--ignore-workspace`
  (local `node_modules` only, no tracked file changed) and downloaded the
  matching Playwright browser build.
- Status: resolved.

## Follow-ups

- `README.md:706-722` still tells consumers to edit a "Start application"
  step, and `.agents/skills/ci-workflow/SKILL.md:46` still calls that the
  section to customise. Both are out of scope for plan 001 — plan 013
  ("templates and docs stop contradicting the repo") should refresh them.
- A GitHub Actions run on this branch is the remaining proof that the job is
  green end to end.

## Changed Files

- `.github/workflows/test.yml` — removed the two manual app-start steps;
  repointed the header comment.
- `plans/001-ci-playwright-job-runs.md` (untracked working material) — living
  plan log.
- `plans/README.md` (untracked working material) — status row for 001 → DONE.
- `plans/001-ci-playwright-job-runs.EXECUTION-REPORT.md` (untracked working
  material) — this report.
