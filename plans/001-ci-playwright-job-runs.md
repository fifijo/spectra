# Plan 001: The Playwright CI job starts and runs the whole suite

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 2106580..HEAD -- .github/workflows/test.yml playwright.config.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `2106580`, 2026-11-10

## Why this matters

`.github/workflows/test.yml` is the only workflow that runs the Playwright
suite. It starts the app itself and then asks Playwright to start it again.
With `CI=true` the config refuses to reuse an already-running server, so
Playwright aborts before the first test with *"http://localhost:5173 is
already used"*. The repo's entire e2e gate — 18 specs, 10 Page Objects — has
never executed in CI. Every other e2e fix in this plan set is unverifiable
until this lands.

## Current state

- `.github/workflows/test.yml` — the Playwright workflow. Lines 44-60 start the
  app by hand; lines 62-66 run the tests with `CI: true`.
- `playwright.config.ts` — the shared config. Lines 61-70 declare a `webServer`
  whose `reuseExistingServer` is `!process.env.CI`.

`.github/workflows/test.yml:44-66` (verbatim):

```yaml
      # ============================================
      # UPDATE THIS SECTION FOR YOUR APPLICATION
      # ============================================
      - name: Install dummy-test-app dependencies
        working-directory: dummy-test-app
        run: pnpm install

      - name: Start application
        working-directory: dummy-test-app
        run: pnpm dev &

      - name: Wait for application
        run: |
          echo "Waiting for app to start..."
          timeout 30 bash -c 'until curl -s http://localhost:5173 > /dev/null; do sleep 1; done'
          echo "App is ready!"
      # ============================================

      - name: Run Playwright tests
        run: pnpm test
        env:
          CI: true
          SPECTRA_URL: http://localhost:5173
```

`playwright.config.ts:1-13` and `:61-70` (verbatim):

```typescript
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
```

```typescript
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
```

**Why this breaks.** The workflow starts the app with `pnpm dev &` and waits
until `http://localhost:5173` answers. Playwright's `webServer` then probes the
same URL. With `CI=true`, `reuseExistingServer` is `false`, and Playwright
throws *"is already used, make sure that nothing is running on the port/url"*
before it collects a single test. Reproduced locally with Playwright 1.59.1.

**Repo conventions to match**: YAML with two-space indentation; step names in
sentence case; workflow files end with a newline.

**Vocabulary (from `CONTEXT.md`)**: the *Spectrum* is the three-stage pipeline;
an *Agent* is one of Planner / Generator / Healer. This plan changes no
product vocabulary.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Unit tests | `pnpm test:unit` | 12 files, 111 tests pass |
| Lint | `pnpm lint` | exit 0 |
| Format check | `pnpm format:check` | exit 0 |
| List e2e tests | `pnpm exec playwright test --list` | `Total: 18 tests in 12 files` |

## Scope

**In scope** (the only files you should modify):
- `.github/workflows/test.yml`

**Out of scope** (do NOT touch, even though they look related):
- `playwright.config.ts` — the `reuseExistingServer` line is correct for local
  use; the bug is that the workflow starts the server itself. Changing the
  config would break the local developer flow.
- `dummy-test-app/**` — the app is fine; the workflow just should not start it
  by hand.
- `.github/workflows/ci.yml` — a different workflow (quality gate only).
- `package.json` scripts.

## Git workflow

- Branch: `advisor/001-ci-playwright-job-runs`
- Commit style: conventional commits, as in `git log` — e.g. `fix: let the
  Playwright CI job run the suite`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Remove the hand-rolled app startup from the workflow

In `.github/workflows/test.yml`, delete the `Start application` step and the
`Wait for application` step. Keep the `Install dummy-test-app dependencies`
step — it is needed and it is not duplicated by Playwright.

The result should read:

```yaml
      # ============================================
      # UPDATE THIS SECTION FOR YOUR APPLICATION
      # ============================================
      - name: Install dummy-test-app dependencies
        working-directory: dummy-test-app
        run: pnpm install
      # ============================================

      - name: Run Playwright tests
        run: pnpm test
        env:
          CI: true
          SPECTRA_URL: http://localhost:5173
```

The `# UPDATE THIS SECTION` comment markers must stay: the README tells users
to edit this file when they copy it into their own project.

**Verify**: `grep -n "Start application\|Wait for application" .github/workflows/test.yml`
→ no output.

### Step 2: Let Playwright own the server lifecycle

Playwright's `webServer` block already runs `pnpm run dev` in
`./dummy-test-app` and waits for `http://localhost:5173` before the first
test. With the manual startup gone, `reuseExistingServer: false` is exactly
right: Playwright starts the app itself and fails the job if it cannot.

Do not add `SPECTRA_SKIP_WEBSERVER` here — that variable exists for
consumers whose app is started outside the repo, and using it in this
workflow would leave Playwright with no server at all.

**Verify**: `grep -n "SPECTRA_SKIP_WEBSERVER" .github/workflows/test.yml`
→ no output (the variable must not appear in this workflow).

### Step 3: Prove the workflow's steps run in the right order

Playwright's `webServer` waits for the URL to answer before running tests, so
no "wait for application" step is needed. Confirm the config still starts a
server in CI by checking that `shouldStartLocalWebServer` returns true for
`http://localhost:5173`:

**Verify**: `node -e "const u=new URL('http://localhost:5173');console.log(u.hostname==='localhost')"`
→ `true`

### Step 4: Verify the whole local gate still passes

**Verify**: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test:unit`
→ all exit 0, 111 tests pass.

### Step 5: Verify the e2e suite can actually be collected

The dummy app's dependencies are not installed by the root `pnpm install`
(there is no `pnpm-workspace.yaml`), so the suite cannot run in this
checkout. Install them once, in the dummy app only:

**Verify**: `pnpm --dir dummy-test-app install` → exit 0
**Verify**: `pnpm exec playwright test --list` → `Total: 18 tests in 12 files`

## Test plan

No unit test: this plan changes a CI workflow file, which no test reads.
The verification is the workflow itself running green on the next push.

If you want a machine check, confirm by hand that the only thing between the
workflow and a green run is the server: run `pnpm --dir dummy-test-app dev`
in one shell, and in another `SPECTRA_SKIP_WEBSERVER=1 pnpm exec playwright
test --list` → the 18 tests are listed, i.e. the suite is collectable once a
server exists.

## Done criteria

- [x] `grep -n "Start application" .github/workflows/test.yml` returns nothing
- [x] `grep -n "Wait for application" .github/workflows/test.yml` returns nothing
- [x] `grep -n "SPECTRA_SKIP_WEBSERVER" .github/workflows/test.yml` returns nothing
- [x] `grep -n "Install dummy-test-app dependencies" .github/workflows/test.yml` still matches
- [x] `pnpm typecheck` exits 0
- [x] `pnpm lint` exits 0
- [x] `pnpm format:check` exits 0
- [x] `pnpm test:unit` exits 0, 111 tests pass
- [x] `pnpm exec playwright test --list` prints `Total: 18 tests in 12 files`
- [x] No files outside `.github/workflows/test.yml` are modified (`git status`)
- [x] `plans/README.md` status row for 001 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `playwright.config.ts` no longer contains a `webServer` block — the fix then
  belongs in the config, not in the workflow, and the plan's reasoning no
  longer holds.
- `pnpm exec playwright test --list` reports a different number of tests than
  18 — something else changed the suite; report the new count.
- `pnpm --dir dummy-test-app install` fails — the e2e suite cannot be
  verified at all; report the install error and stop.

## Maintenance notes

- A consumer who copies `.github/workflows/test.yml` into their own project
  must point the `Install dummy-test-app dependencies` step (and the
  `webServer` block in their `playwright.config.ts`) at their own app. The
  `# UPDATE THIS SECTION` markers are the only hint they get.
- If the app ever needs a different port, change it in **one** place:
  `SPECTRA_URL` in the workflow and `baseURL` in `playwright.config.ts` must
  agree, because the config's `shouldStartLocalWebServer` only starts a server
  for `localhost` / `127.0.0.1`.
- Reviewers should check that no step outside the config starts the app.
  Two starters is exactly the bug this plan removes.

## Progress

- **2026-11-10 09:52 CET — Phase start (Batch mode).** Drift check
  `git diff --stat 2106580..HEAD -- .github/workflows/test.yml playwright.config.ts`
  returned no output; HEAD is `2106580`, so the live code is the code the plan
  was written against. `playwright.config.ts` still has the `webServer` block,
  so the first STOP condition does not apply. Branch
  `advisor/001-ci-playwright-job-runs` created.
- **2026-11-10 09:53 CET — Step 1 done.** Deleted the `Start application` and
  `Wait for application` steps from `.github/workflows/test.yml`; the
  `# UPDATE THIS SECTION` markers and the `Install dummy-test-app
  dependencies` step are untouched. `grep -n "Start application\|Wait for
  application" .github/workflows/test.yml` → no output. The workflow header
  comment was repointed at the marker block (see Surprises).
- **2026-11-10 09:53 CET — Step 2 done.** `grep -n "SPECTRA_SKIP_WEBSERVER"
  .github/workflows/test.yml` → no output. `playwright.config.ts` untouched.
- **2026-11-10 09:53 CET — Step 3 done.** `node -e "const u=new
  URL('http://localhost:5173');console.log(u.hostname==='localhost')"` → `true`.
- **2026-11-10 09:54 CET — Step 4 done.** `pnpm typecheck && pnpm lint &&
  pnpm format:check && pnpm test:unit` → all exit 0; lint and format checked
  30 files; vitest: 12 files, 111 tests passed.
- **2026-11-10 09:56 CET — Step 5 done.** `pnpm --dir dummy-test-app install`
  → exit 0. `pnpm exec playwright test --list` → `Total: 18 tests in 12 files`
  (the expected 18; no STOP condition).
- **2026-11-10 10:04 CET — Extra check beyond the plan.** Ran the CI path
  for real: `CI=true SPECTRA_URL=http://localhost:5173 pnpm exec playwright
  test tests/seed.spec.ts` → 2 passed. Playwright started the dummy app
  itself through the config's `webServer` block (with `CI=true`,
  `reuseExistingServer` is false) and the environment-readiness specs went
  green — the exact sequence the workflow now performs.

## Surprises & Discoveries

- The workflow header comment (`# - Update the "Start application" step for
  your app`) also matches the `grep -n "Start application"` done criterion, so
  it had to change with the steps it pointed at. It now points at the
  `# UPDATE THIS SECTION` block, which is the part a consumer still edits.
- `README.md:706-722` and `.agents/skills/ci-workflow/SKILL.md:46` still
  describe the old "Start application" step. Both are outside this plan's
  scope (the README is explicitly off-limits; the skill doc is docs drift for
  plan 013), so they are left for that plan.
- **Local install quirk (not a repo defect).** This machine has a
  `/home/chris/pnpm-workspace.yaml`, so pnpm treats `/home/chris` as a
  workspace root and `pnpm --dir dummy-test-app install` puts the dummy
  app's packages in the wrong tree — the app ends up with no `vite`, and
  Playwright's `webServer` fails with `sh: 1: vite: not found`.
  `pnpm --dir dummy-test-app install --ignore-workspace` installs them into
  the dummy app and the suite runs. On GitHub Actions the checkout has no
  parent workspace, so the workflow's plain `pnpm install` is correct there.
- The cached Playwright browser build (1217) was missing locally; `pnpm exec
  playwright install chromium` fetched it. The workflow already does the
  equivalent (`playwright install --with-deps chromium`).

## Decision Log

- **Batch mode.** The plan is LOW risk, its acceptance criteria are explicit,
  and it touches one workflow file; the skill's interactive-mode triggers do
  not apply.
- **Only `.github/workflows/test.yml` is committed.** `plans/` is untracked
  working material in this checkout (it was untracked before execution), so
  the plan's own log and report stay out of the commit and the diff stays
  one file.
- **The report lives beside the plan** (`plans/001-ci-playwright-job-runs.EXECUTION-REPORT.md`)
  instead of `docs/.plans/...`: the repo keeps plans in `plans/`, has no
  `docs/.plans/` tree, and the plan's scope forbids new tracked files outside
  the workflow.

- **The plan file stays in `plans/`.** The generic "archive the plan folder"
  step does not apply here: this repo has no archive convention, and plans
  002 and 003 reference `plans/001-ci-playwright-job-runs.md` by path and
  depend on it. The plan is marked DONE in `plans/README.md` instead.

## Outcomes & Retrospective

- **Result: completed.** The Playwright CI job no longer starts the app by
  hand; Playwright owns the server lifecycle through the existing
  `webServer` block, and the suite was proved to run on that path locally.
- **Verification summary:** steps 1-3 greps clean, `node` hostname check
  `true`, typecheck/lint/format:check/unit gate green (111 tests),
  `playwright test --list` → 18 tests in 12 files, and
  `CI=true ... playwright test tests/seed.spec.ts` → 2 passed with Playwright
  starting the app itself.
- **Approved deviations:** none to the plan's scope; the only additions were
  the header-comment fix (required by the plan's own grep criterion) and the
  local-only `--ignore-workspace` install (environment workaround, no repo
  change).
- **Follow-ups:** plan 013 should refresh `README.md:706-722` and
  `.agents/skills/ci-workflow/SKILL.md:46`, which still describe the removed
  "Start application" step.
