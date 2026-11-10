# Plan 005: Batch mode uses the CLI flags, and a batch clears its own Scope folders

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 2106580..HEAD -- src/cli.ts src/__tests__/cli.test.ts`
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

Two silent wrong results in batch mode, the mode a user runs when they want
coverage of a whole application.

First: `--page`, `--scope` and `--file` are accepted on the command line
together with `--batch` and then thrown away. A user who narrows a batch run
with `--page /checkout` gets a full-site scan with no warning, and the run
reports success.

Second: a batch never clears `.spectra/output/scopes/`. Run a batch of two
scopes, then a batch of one: the old Scope folder is still on disk with a
Plan and a Healing Report in it, while the summary lists only the new one.
Later, nobody can tell which results belong to the current run.

## Current state

- `src/cli.ts:90-151` — the batch branch of `run()`.
- `src/cli.ts:161-262` — `runScope()`, which both branches use.
- `src/__tests__/cli.test.ts:194-377` — the existing batch tests.

`src/cli.ts:115-136` (verbatim):

```typescript
    // The batch starts with empty results; every scope keeps its own, so a scope cannot delete the ones before it.
    clean(path.join(cwd, DEFAULT_OUTPUT_DIR), OUTPUT_ARTEFACTS);

    let failed = 0;
    const results: string[] = [];
    for (const [i, scopeDef] of batchConfig.scopes.entries()) {
      const label = scopeDef.name ?? `Scope ${i + 1}`;
      logger.separator('blue', `📋 ${label}`);
      const folder = `${i + 1}-${slugify(label)}`;
      const ok = await runScope(
        {
          url: batchUrl,
          page: scopeDef.page,
          scope: scopeDef.scope,
          file: scopeDef.file,
          manual: options.manual,
          debug: options.debug,
        },
        false,
        folder,
      );
      results.push(path.join(DEFAULT_OUTPUT_DIR, 'scopes', folder));
```

Each Scope's options come **only** from the batch file's entry. `options.page`,
`options.scope` and `options.file` are never read in this branch.

`src/cli.ts:214-216` (verbatim) — the per-Scope folder is removed, but only
the folder of the Scope that is about to run:

```typescript
  // The Scope keeps its own results, so the next Scope cannot overwrite them.
  const scopeDir = resultsFolder ? path.join(outputDir, 'scopes', resultsFolder) : undefined;
  if (scopeDir) fs.rmSync(scopeDir, { recursive: true, force: true });
```

**Both bugs, reproduced.**

```
$ spectra --batch batch.json --page /checkout --scope "payment form" --file SCOPE.md
...
✨ SPECTRUM COMPLETE
```

and the scope context that was written for that Scope:

```markdown
# Current Spectra Scope

## Target
- **URL**: http://localhost:5173

## Instructions
```

No page, no feature focus, no requirements — and no warning.

After a batch of two (`1-alpha`, `2-beta`) and then a batch of one
(`1-gamma`), `.spectra/output/scopes/` holds `1-alpha`, `1-gamma` and
`2-beta`, while the summary lists only `.spectra/output/scopes/1-gamma`.

**Repo conventions to match**: `src/cli.ts` has small helpers at the top
(`clean`, `preserve`, `slugify`, `listFiles`); add new helpers there, not
inline in the branch. The batch branch returns `failed === 0`. Errors use
`logger.error`; the summary uses `logger.plain`.

**Vocabulary (from `CONTEXT.md`)**: a *Batch* is a JSON file listing Scope
definitions; a *Scope definition* is one entry of a Batch file; a *Scope* is
what a run is pointed at; *Scope results* are the Plan and Healing Report one
Scope produced, kept under `.spectra/output/scopes/<number>-<name>/`. A
*feature focus* is the single feature a run should test, set with `--scope`.

**ADR constraint (from `docs/adr/0002-scope-results-are-copies.md`)**: every
Scope writes its Plan and Healing Report to the same canonical paths, and
the fix copies what each Agent produced into `.spectra/output/scopes/<number>-<name>/`
right after that Agent finishes. The per-Scope folders are the *copies*. This
plan must not change that design — it only decides which folders survive a
run.

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
- `docs/BATCH-CONFIG.md` (document the flag precedence only)

**Out of scope** (do NOT touch, even though they look related):
- `src/utils/batch.ts` — the parser is correct and is not the problem. The
  flags are a CLI-level concern.
- `src/agents/catalogue.ts`, `src/agents/runner.ts`, `src/utils/**` — unrelated.
- `README.md` — it does not describe the flag precedence for a batch; leave
  it.

## Git workflow

- Branch: `advisor/005-batch-cli-flags-and-scope-folders`
- Commit style: conventional commits — e.g. `fix: honour the CLI flags in a
  batch run`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Merge the CLI flags into every Scope of a batch

In `src/cli.ts`, in the batch branch, build each Scope's options from the
batch entry **with the CLI flags as the fallback**:

```typescript
      const ok = await runScope(
        {
          url: batchUrl,
          page: options.page ?? scopeDef.page,
          scope: options.scope ?? scopeDef.scope,
          file: options.file ?? scopeDef.file,
          manual: options.manual,
          debug: options.debug,
        },
        false,
        folder,
      );
```

**The precedence rule is: the CLI flag wins.** That is the rule the code
already uses for `url` — `src/cli.ts:105` reads
`options.url ?? batchConfig.url ?? process.env.SPECTRA_URL` — and the rule
the docs state: *"The `url` field in JSON is overridden by `--url` flag if
provided"* (`docs/BATCH-CONFIG.md:143`). Apply it to all four fields, so a
user who writes `--page /checkout` and a batch file that says
`"page": "/login"` gets one answer, not two.

### Step 2: Say in the log that the flags were applied

When a flag is applied to every Scope of a batch, the user should see it.
Log it once, before the loop, not once per Scope:

```typescript
    const shared = [
      options.page ? `page ${options.page}` : '',
      options.scope ? `feature "${options.scope}"` : '',
      options.file ? `file ${options.file}` : '',
    ].filter(Boolean);
    if (shared.length > 0) {
      logger.info(`Applied to every scope: ${shared.join(', ')}`);
    }
```

### Step 3: Clear the Scope folders of a previous batch before the run

In the batch branch, where the code already does
`clean(path.join(cwd, DEFAULT_OUTPUT_DIR), OUTPUT_ARTEFACTS)`, also remove
the whole `scopes` directory:

```typescript
    // The batch starts with empty results; every scope keeps its own, so a scope cannot delete the ones before it.
    clean(path.join(cwd, DEFAULT_OUTPUT_DIR), OUTPUT_ARTEFACTS);
    fs.rmSync(path.join(cwd, DEFAULT_OUTPUT_DIR, 'scopes'), { recursive: true, force: true });
```

`fs.rmSync` with `recursive: true, force: true` is already the pattern used
at `src/cli.ts:216`, and it is a no-op when the directory does not exist.

This is safe because the Scope folders are *copies* made during the run
(ADR 0002), not the originals — the canonical files in `plans/` and
`reports/` are the originals and are untouched by this line.

### Step 4: Document the precedence in the batch guide

In `docs/BATCH-CONFIG.md`, in the "Usage" section (around line 117), add the
CLI flags that now apply to every Scope:

```markdown
## Usage

```bash
# Run with batch config (URL from JSON)
npx spectra --batch scopes-batch.json

# Run with batch config (override URL)
npx spectra --url http://localhost:8080 --batch scopes-batch.json

# Narrow every scope of the batch (the flag wins over the file)
npx spectra --batch scopes-batch.json --page /checkout --scope "payment form"
```

`--url`, `--page`, `--scope` and `--file` apply to every Scope in the batch.
When a Scope in the file sets the same field, the flag wins.
```

**Verify**: `grep -n "the flag wins" docs/BATCH-CONFIG.md` → one match.

### Step 5: Write the tests

Add to `src/__tests__/cli.test.ts`, in the `describe('--batch mode')` block.

(a) The flags reach every Scope. Model it on the existing case "passes page
and scope of every batch scope to the run" (`src/__tests__/cli.test.ts:270-289`):

```typescript
    it('applies the CLI flags to every scope of the batch', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({ scopes: [{ name: 'A' }, { name: 'B' }] }),
        'utf-8',
      );

      await run({ batch: 'batch.json', page: '/checkout', scope: 'payment form' });

      const scopeCalls = vi.mocked(createScopeContext).mock.calls;
      expect(scopeCalls[0][1]).toMatchObject({ page: '/checkout', scope: 'payment form' });
      expect(scopeCalls[1][1]).toMatchObject({ page: '/checkout', scope: 'payment form' });
    });
```

(b) The batch file wins over the flag — no wait, per Step 1 the **flag**
wins. Add the case that says so, so the rule is pinned:

```typescript
    it('lets the CLI flag win over the batch file', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({ scopes: [{ name: 'A', page: '/login' }] }),
        'utf-8',
      );

      await run({ batch: 'batch.json', page: '/checkout' });

      const scopeCalls = vi.mocked(createScopeContext).mock.calls;
      expect(scopeCalls[0][1].page).toBe('/checkout');
    });
```

(c) A stale Scope folder from an earlier batch is gone:

```typescript
    it('removes the scope folders of an earlier batch', async () => {
      const stale = path.join(tmpDir, '.spectra', 'output', 'scopes', '9-old');
      fs.mkdirSync(stale, { recursive: true });
      fs.writeFileSync(path.join(stale, 'test-plan.md'), 'old plan', 'utf-8');

      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(batchPath, JSON.stringify({ scopes: [{ name: 'A' }] }), 'utf-8');

      await run({ batch: 'batch.json' });

      expect(fs.existsSync(stale)).toBe(false);
    });
```

### Step 6: Run everything

**Verify**: `pnpm typecheck` → exit 0
**Verify**: `pnpm test:unit` → all pass
**Verify**: `pnpm lint` → exit 0
**Verify**: `pnpm format:check` → exit 0

## Test plan

- New tests in `src/__tests__/cli.test.ts`, in `describe('--batch mode')`:
  1. the CLI flags reach every Scope of a batch,
  2. the CLI flag wins over the batch file for the same field,
  3. a Scope folder left by an earlier batch is removed.
- Structural pattern: the existing `--batch mode` block, which writes a
  batch file into `tmpDir` and asserts on `vi.mocked(createScopeContext).mock.calls`.
- Verification: `pnpm vitest run src/__tests__/cli.test.ts` → all pass.

## Done criteria

- [x] `spectra --batch b.json --page /checkout` writes the page into every Scope's context
- [x] `grep -n "options.page" src/cli.ts` shows the flag is read in the batch branch
- [x] `fs.rmSync` removes `.spectra/output/scopes` at the start of a batch run
- [x] `pnpm test:unit` exits 0; at least 3 new tests in `src/__tests__/cli.test.ts`
- [x] `pnpm typecheck` exits 0
- [x] `pnpm lint` and `pnpm format:check` exit 0
- [x] No files outside the in-scope list are modified (`git status`)
- [x] `plans/README.md` status row for 005 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The rule for "flag vs batch file" cannot be settled — e.g. the README and
  `docs/BATCH-CONFIG.md` disagree about who wins for `url`. Report the two
  quotes and stop; do not pick a rule for `url` on your own.
- Removing `.spectra/output/scopes` at the start of a batch would delete
  something a user needs. Re-read ADR 0002 and report what it says about the
  per-Scope folders before deleting anything.
- The existing test "keeps the plan and healing report of every scope"
  (`src/__tests__/cli.test.ts:309-358`) fails after Step 3. That test is the
  guarantee ADR 0002 exists for — report it, do not adjust it.

## Maintenance notes

- The per-Scope folder name is `<number>-<slug>`, so two Scopes with the same
  name never collide. Do not change the numbering: the number is what makes
  the folder unique and the order obvious.
- If a future plan gives the CLI a `--dry-run` (see the audit's direction
  notes), the flag-merging in Step 1 is the code that decides what a dry run
  would show — keep it in one place.
- Reviewers should check that the precedence rule (flag over file) is applied
  to `page`, `scope` and `file` alike, and not to `url` alone.

## Progress

- **2026-11-10 11:05 CET — Phase start (Batch mode).** Drift check showed
  only plan 004's output-check changes in `src/cli.ts` /
  `src/__tests__/cli.test.ts`; the plan's quoted batch-branch excerpts still
  match the live code. Branch `advisor/005-batch-cli-flags-and-scope-folders`
  created from `main`.
- **2026-11-10 11:08 CET — Steps 1-3 done.** The batch branch now reads
  `options.page ?? scopeDef.page` (and the same for `scope` and `file`),
  logs `Applied to every scope: …` once before the loop, and removes
  `.spectra/output/scopes` at the start of the run.
- **2026-11-10 11:09 CET — Step 4 done.** `docs/BATCH-CONFIG.md` documents
  the flag precedence: `--url`, `--page`, `--scope` and `--file` apply to
  every Scope, and the flag wins over the file.
- **2026-11-10 11:10 CET — Steps 5-6 done.** Three new tests in
  `describe('--batch mode')`; no existing test changed.
  `pnpm typecheck` 0, cli tests 30 pass, `pnpm test:unit` → 12 files,
  117 tests pass, `pnpm lint` and `pnpm format:check` 0.
  `grep -n "the flag wins" docs/BATCH-CONFIG.md` → one match.

## Surprises & Discoveries

- The plan's test fixtures had no `url`, so `run()` would have called
  `process.exit(1)` and killed the vitest worker; `"url":
  "http://localhost:5173"` was added to each batch fixture.
- The plan's Step 4 markdown contains "the flag wins" twice (a bash comment
  and the prose) while its own verify step expects one match — only the prose
  line was kept.
- The flag list was put in a `sharedFlags()` helper at the top of
  `src/cli.ts`, which is what the plan's own "repo conventions" note asks
  for; the plan's snippet was inline in the branch.

## Decision Log

- **Batch mode.** LOW risk, explicit criteria, one source file, one test
  file, one doc.
- **The plan file stays in `plans/`** — later plans reference these files by
  path, and the repo has no archive convention.

## Outcomes & Retrospective

- **Result: completed.** `--page`, `--scope` and `--file` now reach every
  Scope of a batch (the flag wins), the user sees one log line saying so,
  and a batch starts without the Scope folders of an earlier batch.
- **Verification summary:** `pnpm typecheck` 0, cli tests 30 pass,
  `pnpm test:unit` 12 files / 117 tests, lint 0, format 0, doc grep 1 match,
  and the ADR 0002 guarantee test ("keeps the plan and healing report of
  every scope") still passes.
- **Approved deviations:** the `sharedFlags()` helper; `"url"` added to the
  three test fixtures.
- **Follow-ups:** a batch now deletes `.spectra/output/scopes/` wholesale at
  the start of the run — hand-made notes in those folders are lost. The
  canonical `plans/` and `reports/` are untouched.
