# Plan 014: `--init` scaffolds a seed spec, so the first documented command works

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 660399d..HEAD -- src/agents/init.ts src/agents/__tests__/init.test.ts templates/ README.md specs/ docs/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `660399d`, 2026-11-10

## Why this matters

Every consumer-facing document tells the user to run
`npx playwright test tests/seed.spec.ts` as the first check after
`spectra --init` — the README quickstart, `docs/QUICK-REFERENCE.md`,
`docs/WALKTHROUGH.md`, and three gate docs (`specs/PLANNER-GATE.md`,
`specs/GENERATOR-GATE.md`, `specs/PILOT.md`) list the seed spec as
**Required**. But `--init` creates an empty `tests/` directory and nothing
ever writes a spec into it, and the package does not ship `tests/`. So the
very first command a new user runs fails with "No tests found", and the
Planner Gate's pre-flight check ("Seed passes") can never pass. The
failure happens before the user has written a line of code, which is the
moment they are most lost.

## Current state

- `src/agents/init.ts:57-103` — `scaffold()` creates the folders from
  `PROJECT_DIRS` and copies exactly these into a project: the agent
  templates (`templates/agents/`), the scope doc template
  (`templates/docs/`), the gate docs (`PACKAGE_ROOT/specs`), the fixtures
  file (`templates/fixtures/pages.ts`), the Playwright config
  (`templates/config/playwright.config.ts`) and the MCP config
  (`templates/cursor/mcp.json`). **No spec file.**
- `templates/` contains exactly eight files (agents × 4, config, cursor,
  docs, fixtures) — there is no `templates/tests/`.
- `package.json:17-25` — `"files": ["dist", "!dist/**/__tests__",
  "templates", "specs", "docs", "LICENSE", "README.md"]`. `tests/` is not
  published, so the repo's own `tests/seed.spec.ts` never reaches a user.
- `README.md:186-200` — the Quick Start:
  ```bash
  # Start your web application (in another terminal)
  cd /path/to/your/app && pnpm dev

  # Run the seed spec to verify environment
  npx playwright test tests/seed.spec.ts

  # Run Spectra
  npx spectra --url http://localhost:5173
  ```
- `specs/PLANNER-GATE.md:9-20` — the gate table row "Seed reference |
  `tests/seed.spec.ts` | Required | Yes" and the pre-flight check "**Seed
  passes** - `npx playwright test tests/seed.spec.ts` is green".
- `specs/GENERATOR-GATE.md:8-12` — the same "Seed spec |
  `tests/seed.spec.ts` | Required | Yes" row.
- `specs/PILOT.md:10-16` — "**Run seed**:
  `npx playwright test tests/seed.spec.ts` — must pass."
- `docs/QUICK-REFERENCE.md:95-99` and `docs/WALKTHROUGH.md:236-241` — the
  same command in the command lists.
- The repo's own `tests/seed.spec.ts` is app-specific and must **not** be
  shipped as the generic one: it asserts the title matches
  `/dummy-test-app/i` and uses an `appShellPage` fixture that only exists
  in this repo (`tests/seed.spec.ts:26-29`).

**Repo conventions to match**: TypeScript in this repo uses 2-space indent,
single quotes, a 100-column line width and trailing commas (Biome). Tests
live next to the code they test (`src/agents/__tests__/init.test.ts` for
`src/agents/init.ts`) and use `vitest`. Markdown uses ATX headings, tables
with a header row and `|---|---|` separators, and fenced code blocks with a
language.

**Vocabulary (from `CONTEXT.md`)**: a *Scope* is what a run is pointed at; a
*Scope file* is the file passed with `--file`; the *Plan* is the Markdown
document the Planner writes. Do not call the seed spec a "test plan".

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `pnpm install` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Typecheck (generated code) | `pnpm typecheck:test` | exit 0 |
| Unit tests | `pnpm test:unit` | 12 files, 129 tests pass |
| One test file | `pnpm vitest run src/agents/__tests__/init.test.ts` | all pass |
| Lint + format + assists | `pnpm check` | exit 0, 56 files |
| Build | `pnpm build` | exit 0 |
| E2E collection | `pnpm exec playwright test --list` | `Total: 18 tests in 12 files` |

## Scope

**In scope** (the only files you should modify):
- `templates/tests/seed.spec.ts` (create)
- `src/agents/init.ts`
- `src/agents/__tests__/init.test.ts`
- `README.md`
- `specs/PLANNER-GATE.md`, `specs/GENERATOR-GATE.md`, `specs/PILOT.md`
- `docs/QUICK-REFERENCE.md`, `docs/WALKTHROUGH.md`

**Out of scope** (do NOT touch, even though they look related):
- `tests/seed.spec.ts` — the repo's own fixture-app seed spec. It stays
  exactly as it is; the generic one is a new file under `templates/`.
- `src/utils/scope.ts`, `src/agents/catalogue.ts` — the catalogue does not
  declare the seed spec.
- `templates/fixtures/pages.ts` — the generic seed spec must not depend on
  a fixture that does not exist yet.
- `package.json` — `templates` is already published as a whole directory,
  so `templates/tests/seed.spec.ts` ships without a `files` change.

## Git workflow

- Branch: `advisor/014-seed-spec-template`
- Commit style: conventional commits — e.g. `feat: scaffold a seed spec so the
  first documented command works`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Write a generic seed spec template

Create `templates/tests/seed.spec.ts`. It must work in a **freshly
scaffolded project**, where no Page Objects exist yet, so it may only use
`@playwright/test` directly — not the project's fixtures.

Two tests, in the shape of the repo's own seed spec but without any
app-specific assertion:

```typescript
import { expect, test } from '@playwright/test';

test.describe('Seed: environment readiness', { tag: ['@smoke'] }, () => {
  test('target URL is reachable', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
  });

  test('the page has a title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
  });
});
```

No `.js` extension is needed here: the import is a bare package specifier,
not a relative path.

**Verify**: `grep -c "test(" templates/tests/seed.spec.ts` → 2.

### Step 2: Copy it into the scaffolded project

In `src/agents/init.ts`, inside `scaffold()`, after the fixtures copy and
next to the config/MCP copies, add a copy-if-not-exists block (the same
style as the two blocks already there — a user's own seed spec must never be
replaced):

```typescript
  // Copy the seed spec if not present: the gate docs ask the user to run it.
  const seedSource = path.join(TEMPLATE_DIR, 'tests', 'seed.spec.ts');
  const seedDest = path.join(projectRoot, 'tests', 'seed.spec.ts');
  if (fs.existsSync(seedSource) && !fs.existsSync(seedDest)) {
    fs.mkdirSync(path.dirname(seedDest), { recursive: true });
    fs.copyFileSync(seedSource, seedDest);
  }
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Say what the scaffolded seed spec checks

In `README.md:186-200`, keep the command but make clear the file is
scaffolded:

```bash
# Start your web application (in another terminal)
cd /path/to/your/app && pnpm dev

# Run the seed spec to verify the environment (scaffolded by --init)
npx playwright test tests/seed.spec.ts

# Run Spectra
npx spectra --url http://localhost:5173
```

In `specs/PLANNER-GATE.md`, `specs/GENERATOR-GATE.md` and
`specs/PILOT.md`, add one line under the seed row saying the spec is
created by `spectra --init` and checks that the target URL answers and that
the page has a title. In `docs/QUICK-REFERENCE.md` and
`docs/WALKTHROUGH.md`, say the same in one sentence next to the command.

Do not change the commands themselves.

**Verify**: `grep -rn "tests/seed.spec.ts" README.md specs/ docs/` → every
hit mentions that `--init` creates it.

### Step 4: Test the two new behaviours

In `src/agents/__tests__/init.test.ts`, inside `describe('scaffold')`, add
two cases. Model them on the existing Playwright-config cases (the file
already has "copies a playwright config when the project has none" and
"does not overwrite an existing playwright config"):

1. `copies a seed spec when the project has none` — after `scaffold(...)`,
   `expect(fs.existsSync(path.join(projectRoot, 'tests', 'seed.spec.ts'))).toBe(true)`.
2. `does not overwrite an existing seed spec` — write
   `tests/seed.spec.ts` with the content `mine` first, then assert the file
   still reads `mine`.

The test file mocks `../../utils/constants.js` with a fake
`TEMPLATE_DIR: '/tmp/spectra-test-templates'` and builds that tree in
`setupTemplates()` — extend `setupTemplates()` to create
`templates/tests/seed.spec.ts` (e.g. `// seed`), otherwise the copy finds
no source file and the first new case fails.

**Verify**: `pnpm vitest run src/agents/__tests__/init.test.ts` → all pass.

### Step 5: Run everything

**Verify**: `pnpm check && pnpm typecheck && pnpm typecheck:test &&
pnpm test:unit && pnpm build` → all exit 0; unit tests report 12 files and
131 tests (129 + the 2 new cases).

**Verify**: `pnpm exec playwright test --list` → `Total: 18 tests in 12
files` (the repo's own suite is unchanged — the new template is not part of
it).

## Test plan

- New tests in `src/agents/__tests__/init.test.ts`, in `describe('scaffold')`:
  1. a seed spec is copied when the project has none,
  2. an existing seed spec is not overwritten.
- Structural pattern: the existing Playwright-config cases in the same
  block.
- Verification: `pnpm vitest run src/agents/__tests__/init.test.ts` → all
  pass.

## Done criteria

- [ ] `templates/tests/seed.spec.ts` exists and contains two tests
- [ ] `spectra --init` writes `tests/seed.spec.ts` into a new project
- [ ] An existing `tests/seed.spec.ts` is not overwritten
- [ ] `README.md`, `specs/PLANNER-GATE.md`, `specs/GENERATOR-GATE.md`,
      `specs/PILOT.md`, `docs/QUICK-REFERENCE.md` and `docs/WALKTHROUGH.md`
      say that `--init` creates the seed spec
- [ ] `pnpm test:unit` exits 0; 131 tests pass
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` and `pnpm typecheck:test` exit 0
- [ ] `pnpm build` exits 0
- [ ] `pnpm exec playwright test --list` prints `Total: 18 tests in 12 files`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 014 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `src/agents/init.ts` no longer copies the Playwright config and the MCP
  config the way the "Current state" excerpt shows — the copy style may have
  changed; follow the live file.
- The scaffolded project turns out to have no `tests/` directory (the
  `PROJECT_DIRS` list in `src/utils/layout.ts` changed) — the copy would
  create it anyway, but report it.
- Writing a generic seed spec requires an application under test (for
  example a fixture that only exists in this repo's dummy app) — a seed spec
  must work against any target URL.

## Maintenance notes

- The seed spec is **copied, not updated**: a project that edits it keeps
  its version. If the template changes, existing projects do not get the
  change — that is the same trade-off ADR 0001 records for the agent
  templates.
- The generic spec deliberately asserts almost nothing: it proves the URL
  answers and the page has a title. A richer seed (auth state, feature
  flags) is the user's to write; `docs/SCOPE-template.md` is where they can
  put extra requirements.
- Reviewers should check that the template imports from `@playwright/test`
  and not from `../fixtures/pages` — a scaffolded project has a fixtures
  file, but no Page Objects yet.

## Progress

- **2026-11-10 13:00 CET — Executed (Batch mode).** Drift check clean.
  `templates/tests/seed.spec.ts` created (two generic tests, `@playwright/test`
  only); `scaffold()` copies it copy-if-not-exists; four documents say the
  seed spec comes from `--init`; two new cases in
  `src/agents/__tests__/init.test.ts`. `pnpm check` 0 (57 files),
  `pnpm typecheck` 0, `pnpm typecheck:test` 0, `pnpm test:unit` → 131 tests,
  `pnpm build` 0, `playwright test --list` → 18 tests in 12 files.

## Outcomes & Retrospective

- **Result: completed.** A scaffolded project now contains a seed spec, so
  the first command in the Quick Start and in three gate documents runs.
- **Deviation:** the Quick Start comment went on the command line
  ("# scaffolded by --init") rather than on its own line, because the plan's
  own verification requires every `tests/seed.spec.ts` hit to mention
  `--init`.
