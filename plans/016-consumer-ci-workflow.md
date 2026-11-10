# Plan 016: `--init` scaffolds a CI workflow a consumer can actually run

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 660399d..HEAD -- templates/ src/agents/init.ts src/agents/__tests__/init.test.ts README.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `660399d`, 2026-11-10

## Why this matters

The README's CI section tells the consumer that "the workflow file is at
`.github/workflows/test.yml`" and to edit it for their application. A
consumer who installed the package has no such file: `.github` is not in the
package's `files` list and `--init` does not create one. Worse, if they
copy this repository's workflow, it fails immediately — it runs
`pnpm test:unit` and `pnpm test`, scripts that exist only in *this* repo,
and it installs the `dummy-test-app` dependencies. The section also claims
"Playwright starts your app from `playwright.config.ts`", which is false
for a scaffolded project: the config template ships **without** a
`webServer` block, because that block points at this repo's dummy app.

So the one section that promises "run your tests in CI" hands the user a
file they do not have, and a file they do have would fail.

## Current state

- `README.md:703-742` — the CI section: "### Enable CI — The workflow file
  is at `.github/workflows/test.yml`. It will: 1. Install dependencies and
  Playwright browsers 2. Install your application's dependencies 3. Run all
  Playwright tests (Playwright starts your app from `playwright.config.ts`)
  4. Upload test reports as artifacts" plus a "### Configuration" block that
  shows the `# UPDATE THIS SECTION` step.
- `package.json:17-25` — `"files": ["dist", "!dist/**/__tests__",
  "templates", "specs", "docs", "LICENSE", "README.md"]`. `.github` is not
  published.
- `src/agents/init.ts:57-103` — `scaffold()` copies the agent templates,
  the scope doc template, the gate docs, the fixtures file, the Playwright
  config and the MCP config. **No workflow.**
- `templates/config/playwright.config.ts` — the config `--init` copies. It
  has no `webServer` block (this repo's own `playwright.config.ts:61-70`
  has one, pointing at `./dummy-test-app`, which is not shipped).
- `.github/workflows/test.yml` — this repo's own workflow: `pnpm install`,
  `pnpm test:unit`, `pnpm exec playwright install --with-deps chromium`,
  `pnpm install` in `dummy-test-app`, then `pnpm test` with `CI: true` and
  `SPECTRA_URL: http://localhost:5173`, then two artifact uploads.
  **This is the repo's own CI and must not be edited by this plan.**

**Repo conventions to match**: YAML with two-space indentation, sentence-case
step names, and a file that ends with a newline. The `# UPDATE THIS SECTION`
comment markers are the convention this repo uses to mark the part a
consumer edits (`.github/workflows/test.yml:44-50`). Markdown in the README
uses fenced ```bash blocks.

**Vocabulary (from `CONTEXT.md`)**: the pipeline is the *Spectrum*; the app
under test is the user's application. Do not call the workflow step "the
pipeline".

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `pnpm install` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Unit tests | `pnpm test:unit` | 12 files, 129 tests pass |
| One test file | `pnpm vitest run src/agents/__tests__/init.test.ts` | all pass |
| Lint + format + assists | `pnpm check` | exit 0, 56 files |
| Build | `pnpm build` | exit 0 |
| E2E collection | `pnpm exec playwright test --list` | `Total: 18 tests in 12 files` |

## Scope

**In scope** (the only files you should modify):
- `templates/.github/workflows/test.yml` (create)
- `src/agents/init.ts`
- `src/agents/__tests__/init.test.ts`
- `README.md` (the CI/CD section only)

**Out of scope** (do NOT touch, even though they look related):
- `.github/workflows/test.yml` — the repo's own workflow. It runs this
  repo's tests against `dummy-test-app` and must keep doing exactly that.
- `.github/workflows/ci.yml`, `.github/workflows/release.yml` — not this
  plan's business.
- `templates/config/playwright.config.ts` — the config template stays as it
  is (no `webServer`); the workflow template documents what to put there.
- `package.json` — `templates` is published as a whole directory, so the new
  file ships without a `files` change. Verify this with `npm pack
  --dry-run`.

## Git workflow

- Branch: `advisor/016-consumer-ci-workflow`
- Commit style: conventional commits — e.g. `feat: scaffold a CI workflow for
  the consumer`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Write the consumer workflow template

Create `templates/.github/workflows/test.yml`. It is the same shape as this
repo's workflow, with everything repo-specific removed:

```yaml
# Playwright Tests
#
# Runs the generated Playwright suite on every push and pull request.
# Edit the block marked below to match your application.

name: Playwright Tests

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  workflow_dispatch:

jobs:
  test:
    timeout-minutes: 30
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      # ============================================
      # UPDATE THIS SECTION FOR YOUR APPLICATION
      # ============================================
      - name: Install your application dependencies
        working-directory: your-app-directory
        run: pnpm install
      # ============================================

      - name: Run Playwright tests
        run: npx playwright test
        env:
          CI: true
          SPECTRA_URL: http://localhost:5173

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: .spectra/output/reports/
          retention-days: 30

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-artifacts
          path: |
            .spectra/output/test-results/
            .spectra/output/reports/results.json
          retention-days: 7
```

Three rules this file must obey, and why:

1. **No `pnpm test:unit` and no `pnpm test`** — those scripts live in this
   repo, not in the consumer's. `npx playwright test` works everywhere
   because `@playwright/test` is a peer dependency the consumer installs.
2. **No `dummy-test-app`** — it is not shipped.
3. **No app start step** — the consumer starts their app through a
   `webServer` block in their own `playwright.config.ts` (the template
   config deliberately has none, because this repo's block points at
   `dummy-test-app`). The README must say so in Step 3.

**Verify**: `grep -n "dummy-test-app\|pnpm test\b\|pnpm test:unit" templates/.github/workflows/test.yml` → no output.

### Step 2: Scaffold it

In `src/agents/init.ts`, inside `scaffold()`, next to the other copies, add
a copy-if-not-exists block for the workflow:

```typescript
  // Copy the CI workflow if not present: it runs the generated suite in GitHub Actions.
  const workflowSource = path.join(TEMPLATE_DIR, '.github', 'workflows', 'test.yml');
  const workflowDest = path.join(projectRoot, '.github', 'workflows', 'test.yml');
  if (fs.existsSync(workflowSource) && !fs.existsSync(workflowDest)) {
    fs.mkdirSync(path.dirname(workflowDest), { recursive: true });
    fs.copyFileSync(workflowSource, workflowDest);
  }
```

The user's own workflow must never be replaced, so the copy is
if-not-exists, like the other two.

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Rewrite the README's CI section

Replace the body of `README.md:703-742` so it describes what now exists:

- `--init` creates `.github/workflows/test.yml`; edit the block marked
  `# UPDATE THIS SECTION FOR YOUR APPLICATION` to point at your application
  and install its dependencies.
- The workflow runs `npx playwright test` with `CI: true` and
  `SPECTRA_URL` — it does not run `pnpm test`, because that script belongs
  to the Spectra repository, not to your project.
- **Your application must be started by Playwright**: add a `webServer`
  block to your `playwright.config.ts` (the scaffolded config has none),
  for example:

  ```typescript
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  ```

  `reuseExistingServer: !process.env.CI` is the rule this repository uses:
  locally Playwright reuses a server you already started, in CI it starts
  one and fails the job if the port is taken.
- Keep the environment-variable table for CI, but label the column "Value in
  the workflow" (it lists the values the workflow sets, not defaults).

**Verify**: `grep -n "Start application" README.md` → no output.

### Step 4: Test the new copy and the non-overwrite rule

In `src/agents/__tests__/init.test.ts`, inside `describe('scaffold')`, add
two cases, modelled on the Playwright-config cases already in that file:

1. `copies the CI workflow when the project has none` — after
   `scaffold(...)`, assert
   `fs.existsSync(path.join(projectRoot, '.github', 'workflows', 'test.yml'))`
   is `true`.
2. `does not overwrite an existing CI workflow` — write
   `.github/workflows/test.yml` with the content `mine` first, then assert
   the file still reads `mine`.

`setupTemplates()` in that test file builds the fake template tree — extend
it to create `templates/.github/workflows/test.yml` (for example with the
content `name: test`), otherwise the copy finds no source.

**Verify**: `pnpm vitest run src/agents/__tests__/init.test.ts` → all pass.

### Step 5: Run everything

**Verify**: `pnpm check && pnpm typecheck && pnpm test:unit && pnpm build`
→ all exit 0; unit tests report 12 files and 131 tests (129 + 2 new).

**Verify**: `npm pack --dry-run` lists
`package/templates/.github/workflows/test.yml`.

**Verify**: `pnpm exec playwright test --list` → `Total: 18 tests in 12
files` (this repo's own suite is untouched).

## Test plan

- New tests in `src/agents/__tests__/init.test.ts`, in `describe('scaffold')`:
  1. a CI workflow is copied when the project has none,
  2. an existing CI workflow is not overwritten.
- Structural pattern: the existing Playwright-config and MCP-config cases
  in the same block.
- Verification: `pnpm vitest run src/agents/__tests__/init.test.ts` → all
  pass.

## Done criteria

- [ ] `templates/.github/workflows/test.yml` exists and mentions neither
      `dummy-test-app` nor `pnpm test`
- [ ] `spectra --init` writes `.github/workflows/test.yml` into a new
      project
- [ ] An existing `.github/workflows/test.yml` is not overwritten
- [ ] The README's CI section says the workflow is scaffolded, runs
      `npx playwright test`, and that the app is started through a
      `webServer` block
- [ ] `pnpm test:unit` exits 0; 131 tests pass
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm build` exits 0
- [ ] `npm pack --dry-run` lists `package/templates/.github/workflows/test.yml`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 016 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `templates/config/playwright.config.ts` now contains a `webServer` block
  — then the workflow template must not tell the consumer to add one; re-read
  the live file and report.
- The package's `files` array no longer publishes `templates` as a whole
  directory — the new template would not ship; report the array.
- `src/agents/init.ts` no longer copies the Playwright config and the MCP
  config — follow the live file's copy style.

## Maintenance notes

- The workflow template starts the app through the consumer's Playwright
  config, not through a workflow step. A consumer whose app cannot be
  started by Playwright has to start it another way — say so in the README
  if a user reports it.
- If this repo's own workflow ever needs the same shape, copy the template
  rather than editing the template to match the repo: the repo's workflow
  runs this repo's unit tests too.
- Reviewers should check that the template never gains a repo-only script
  name (`pnpm test`, `pnpm test:unit`, `pnpm report`).

## Progress

- **2026-11-10 13:02 CET — Executed (Batch mode).** Drift check clean.
  `templates/.github/workflows/test.yml` created (no `dummy-test-app`, no
  `pnpm test`); `scaffold()` copies it copy-if-not-exists; the README's CI
  section now describes the scaffolded workflow, `npx playwright test`, and
  the `webServer` block the consumer must add; two new cases in
  `src/agents/__tests__/init.test.ts`. `pnpm check` 0 (57 files),
  typechecks 0, `pnpm test:unit` → 133 tests, `pnpm build` 0,
  `playwright test --list` → 18 tests in 12 files.

## Outcomes & Retrospective

- **Result: completed.** A scaffolded project gets a CI workflow it can run
  as-is, with the app-start part marked for the consumer to fill in.
- **Not verified:** the workflow was parsed but never executed by GitHub
  Actions — the consumer's app has to be startable through a `webServer`
  block for it to run as written.
