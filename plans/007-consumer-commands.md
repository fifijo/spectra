# Plan 007: The instructions a consumer gets point at commands they have

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 2106580..HEAD -- src/cli.ts README.md docs/QUICK-REFERENCE.md docs/WALKTHROUGH.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `2106580`, 2026-11-10

## Why this matters

The CLI prints its own instructions at the end of every run, and the README
repeats them. Both tell the user to run `pnpm test`, `pnpm test:seed`,
`pnpm test:ui` and `pnpm report`. Those scripts live in **spectra's**
`package.json`, not in the consumer's project. A user who followed the
documented quickstart — `pnpm add -D spectra-test-automation @playwright/test`
then `npx spectra --init` — gets `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command
"test:seed" not found` at the first command. The instructions fail at exactly
the moment the user is most lost.

## Current state

- `src/cli.ts:255-259` — the commands the CLI prints after a run.
- `src/cli.ts:83-86` — the "Next steps" the `--init` path prints.
- `README.md:187-196` — the quickstart's first command.
- `README.md:619-646` — the "Running Tests" section.
- `package.json:30-34` — where those scripts actually live.

`src/cli.ts:251-259` (verbatim):

```typescript
  logger.plain('Generated:');
  logger.plain(`  Page Objects: ${pageCount}`);
  logger.plain(`  Test files: ${testCount}`);
  logger.plain('');
  logger.plain('Commands:');
  logger.plain('  pnpm test          Run all tests');
  logger.plain('  pnpm test:ui       Run with UI');
  logger.plain('  pnpm report        View report');
```

`src/cli.ts:83-86` (verbatim):

```typescript
    logger.plain('Next steps:');
    logger.plain('  1. Start your web application');
    logger.plain('  2. Run: spectra --url http://localhost:5173');
    logger.plain('');
```

`README.md:187-196` (verbatim):

```bash
# Start your web application (in another terminal)
cd /path/to/your/app && pnpm dev

# Run the seed spec to verify environment
pnpm test:seed

# Run Spectra
npx spectra --url http://localhost:5173
```

`README.md:619-646` (verbatim):

```bash
# Run all tests
pnpm test

# Run with visible browser
pnpm test:headed

# Run with Playwright UI
pnpm test:ui

# Run specific test file
pnpm exec playwright test tests/auth.spec.ts

# View HTML report
pnpm report

# Cross-browser testing
SPECTRA_BROWSERS=firefox pnpm test
SPECTRA_BROWSERS=chromium,firefox pnpm test
SPECTRA_BROWSERS=all pnpm test   # All browsers + mobile

# Filter by tags
pnpm test --grep @smoke          # Only smoke tests
pnpm test --grep @critical       # Only critical tests
pnpm test --grep-invert @slow    # Skip slow tests
pnpm test --grep "@auth|@login"  # Multiple tags (OR)
```

**The bug, reproduced.** Packing the package and installing it into a clean
project:

```
$ pnpm test:seed
 ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "test:seed" not found
```

`@playwright/test` *is* a non-optional peer dependency, so npm installs it for
the consumer and `node_modules/.bin/playwright` exists — `npx playwright test`
works; `pnpm test` does not.

**Repo conventions to match**: the README uses emoji section headings and
fenced bash blocks; the CLI prints plain lines with two-space indentation
under a label. The report path in this repo is
`.spectra/output/reports` (`package.json:34`), which is the same path the
consumer's config uses after plan 006.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0 |
| Unit tests | `pnpm test:unit` | all pass |
| One test file | `pnpm vitest run src/__tests__/cli.test.ts` | all pass |
| Lint | `pnpm lint` | exit 0 |
| Format check | `pnpm format:check` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `src/cli.ts`
- `src/__tests__/cli.test.ts`
- `README.md`
- `docs/QUICK-REFERENCE.md`
- `docs/WALKTHROUGH.md`

**Out of scope** (do NOT touch, even though they look related):
- `package.json` — the scripts stay; they are useful *in this repo*. The
  problem is that they are advertised to people who do not have them.
- `playwright.config.ts` — the report path it uses stays.
- `templates/agents/**` — the agent templates do not mention these commands.

## Git workflow

- Branch: `advisor/007-consumer-commands`
- Commit style: conventional commits — e.g. `docs: point consumers at the
  commands they have`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Print the commands a consumer can actually run

In `src/cli.ts`, replace the three printed command lines:

```typescript
  logger.plain('Commands:');
  logger.plain('  pnpm test          Run all tests');
  logger.plain('  pnpm test:ui       Run with UI');
  logger.plain('  pnpm report        View report');
```

with:

```typescript
  logger.plain('Commands:');
  logger.plain('  npx playwright test                                  Run all tests');
  logger.plain('  npx playwright test --ui                             Run with UI');
  logger.plain('  npx playwright show-report .spectra/output/reports   View report');
```

`npx playwright` resolves the `@playwright/test` peer dependency the
consumer already has. Keep the alignment readable; do not add a trailing
space to pad a column.

### Step 2: Make the `--init` next steps complete

The printed next steps skip the step that breaks the flow — installing
Playwright. In `src/cli.ts:83-86`:

```typescript
    logger.plain('Next steps:');
    logger.plain('  1. Install Playwright: pnpm add -D @playwright/test');
    logger.plain('  2. Install the browser: pnpm exec playwright install chromium');
    logger.plain('  3. Start your web application');
    logger.plain('  4. Run: spectra --url http://localhost:5173');
    logger.plain('');
```

### Step 3: Fix the README quickstart

In `README.md:187-196`, the quickstart starts after the install step, which
already says `pnpm add -D spectra-test-automation @playwright/test`. Replace
the seed command:

```bash
# Start your web application (in another terminal)
cd /path/to/your/app && pnpm dev

# Run the seed spec to verify environment
npx playwright test tests/seed.spec.ts

# Run Spectra
npx spectra --url http://localhost:5173
```

**Verify**: `grep -n "pnpm test:seed" README.md` → no output.

### Step 4: Fix the README "Running Tests" section

In `README.md:619-646`, replace the `pnpm test*` commands with the
`npx playwright test` equivalents. The `--grep` forms become
`npx playwright test --grep @smoke` and so on; the browser selection stays
the same, because `SPECTRA_BROWSERS` is read by the Playwright config, not by
a package script:

```bash
# Run all tests
npx playwright test

# Run with visible browser
npx playwright test --headed

# Run with Playwright UI
npx playwright test --ui

# Run specific test file
npx playwright test tests/auth.spec.ts

# View HTML report
npx playwright show-report .spectra/output/reports

# Cross-browser testing
SPECTRA_BROWSERS=firefox npx playwright test
SPECTRA_BROWSERS=chromium,firefox npx playwright test
SPECTRA_BROWSERS=all npx playwright test   # All browsers + mobile

# Filter by tags
npx playwright test --grep @smoke          # Only smoke tests
npx playwright test --grep @critical       # Only critical tests
npx playwright test --grep-invert @slow    # Skip slow tests
npx playwright test --grep "@auth|@login"  # Multiple tags (OR)
```

`tests/auth.spec.ts` does not exist in this repo, but it is an example in a
consumer-facing document and the file name is plausible for a generated
project. Leave the name as it is.

**Verify**: `grep -n "pnpm test\b\|pnpm report\|pnpm test:" README.md`
→ no output.

### Step 5: Fix the same commands in the docs

`docs/QUICK-REFERENCE.md` has a "Test Commands" block (around line 88) and
`docs/WALKTHROUGH.md` has a "Check Results" block (around line 235). Both
list `pnpm test`, `pnpm test:headed`, `pnpm test:ui`, `pnpm test:seed` and
`pnpm report`. Apply the same replacement.

**Verify**: `grep -n "pnpm test\|pnpm report" docs/QUICK-REFERENCE.md docs/WALKTHROUGH.md`
→ no output.

### Step 6: Write the test

In `src/__tests__/cli.test.ts`, in the `describe('summary')` block, assert
that the printed commands are the ones a consumer can run:

```typescript
    it('prints commands the consumer project actually has', async () => {
      await run({ url: 'http://localhost:5173' });

      const printed = vi.mocked(logger.plain).mock.calls.map((call) => call[0]).join('\n');
      expect(printed).toContain('npx playwright test');
      expect(printed).not.toContain('pnpm test');
    });
```

`logger` is already mocked in that file; `logger.plain` is a `vi.fn()`.

**Verify**: `pnpm vitest run src/__tests__/cli.test.ts` → all pass.

### Step 7: Run everything

**Verify**: `pnpm typecheck && pnpm test:unit && pnpm lint && pnpm format:check`
→ all exit 0

## Test plan

- New test in `src/__tests__/cli.test.ts`, in `describe('summary')`: the
  printed commands are `npx playwright …` and contain no `pnpm test`.
- Structural pattern: the existing `describe('summary')` block, which asserts
  on `vi.mocked(logger.plain)` and `vi.mocked(logger.separator)`.
- Verification: `pnpm vitest run src/__tests__/cli.test.ts` → all pass.

## Done criteria

- [x] `src/cli.ts` prints `npx playwright test` and `npx playwright show-report .spectra/output/reports`
- [x] `src/cli.ts` prints no `pnpm test` and no `pnpm report`
- [x] `grep -rn "pnpm test\|pnpm report" README.md docs/QUICK-REFERENCE.md docs/WALKTHROUGH.md` returns nothing
- [x] `pnpm test:unit` exits 0; at least 1 new test in `src/__tests__/cli.test.ts`
- [x] `pnpm typecheck` exits 0
- [x] `pnpm lint` and `pnpm format:check` exit 0
- [x] No files outside the in-scope list are modified (`git status`)
- [x] `plans/README.md` status row for 007 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The report path is no longer `.spectra/output/reports` — read
  `playwright.config.ts` and report the new path instead of guessing.
- The consumer's project does not get `@playwright/test` automatically. The
  package declares it as a non-optional peer dependency (`package.json:67-74`),
  so npm installs it; if that is no longer true, report it — the fix would
  then be a dependency change, not a docs change.
- A `pnpm test` reference in the docs turns out to be about *this* repo
  rather than a consumer project. Say so and report where; do not change a
  line that is meant for this repo's own contributors.

## Maintenance notes

- The rule to remember: a document aimed at a consumer may only name
  commands that exist in the consumer's project. `npx playwright …` always
  works because `@playwright/test` is a peer dependency; `pnpm test` only
  works inside this repo.
- This repo's own `pnpm test` scripts stay in `package.json` — the
  `.agents/skills/*` docs and the contributing guide use them.
- If the package ever gains a CLI command of its own (for example a
  `spectra test` wrapper), that becomes the right thing to print here.

## Progress

- **2026-11-10 11:17 CET — Phase start (Batch mode).** Drift check showed
  only plans 005/006's changes in `src/cli.ts` and `README.md`; the plan's
  quoted excerpts still match. Branch `advisor/007-consumer-commands`
  created from `main`.
- **2026-11-10 11:19 CET — Steps 1-2 done.** The CLI prints
  `npx playwright test`, `npx playwright test --ui` and
  `npx playwright show-report .spectra/output/reports`; the `--init` next
  steps now include installing Playwright and the browser.
- **2026-11-10 11:19 CET — Steps 3-5 done.** The README quickstart, the
  README "Running Tests" section, `docs/QUICK-REFERENCE.md` and
  `docs/WALKTHROUGH.md` (including its ASCII box and command table) now use
  the `npx playwright …` equivalents.
  `grep -rn "pnpm test\|pnpm report" README.md docs/QUICK-REFERENCE.md docs/WALKTHROUGH.md`
  → no output.
- **2026-11-10 11:20 CET — Steps 6-7 done.** One new test in
  `describe('summary')`. `pnpm typecheck` 0, cli tests 31 pass,
  `pnpm test:unit` → 12 files, 122 tests pass, `pnpm lint` and
  `pnpm format:check` 0.

## Surprises & Discoveries

- Every `pnpm test` reference in the three documents was consumer-facing, so
  none of the plan's STOP condition ("a reference meant for this repo's own
  contributors") applied. This repo's own scripts stay in `package.json`.
- The plan's one-line test snippet is 104 characters and trips biome's
  100-column limit; it was written in biome's multi-line form with the same
  assertions.

## Decision Log

- **Batch mode.** LOW risk, docs-only plus one test.
- **The plan file stays in `plans/`** — later plans reference these files by
  path, and the repo has no archive convention.

## Outcomes & Retrospective

- **Result: completed.** A consumer who follows the quickstart now gets
  commands they actually have.
- **Verification summary:** `pnpm typecheck` 0, `pnpm test:unit` 12 files /
  122 tests, lint 0, format 0, and the `pnpm test|pnpm report` grep over the
  three documents returns nothing.
- **Approved deviations:** the test snippet was re-wrapped for biome.
- **Follow-ups:** the report path `.spectra/output/reports` is hard-coded in
  the printed command and in the docs — a consumer who changes
  `outputFolder` in their own config gets a stale path.
