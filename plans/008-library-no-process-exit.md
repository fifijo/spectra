# Plan 008: The library stops the host process from dying

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 2106580..HEAD -- src/cli.ts src/agents/init.ts src/bin.ts src/index.ts src/__tests__/cli.test.ts src/agents/__tests__/init.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `2106580`, 2026-11-10

## Why this matters

The package exports `run` as public API (`src/index.ts:8`). A program that
imports `spectra` and calls `run()` gets its process killed by
`process.exit(1)` when the batch file is missing, when the batch file is
invalid, when no URL is given, or when the templates are not installed. The
caller cannot catch it, cannot clean up, and cannot report anything nicer
than "the process vanished". The exit code is already handled correctly at
the edge — `src/bin.ts` turns a `false` return into exit code 1 — so the
`process.exit` calls inside the library are both redundant and harmful.

## Current state

- `src/cli.ts:95, 101, 108` — three `process.exit(1)` calls in the batch
  branch of `run()`.
- `src/cli.ts:172` — one `process.exit(1)` in `runScope()`.
- `src/agents/init.ts:35` — one `process.exit(1)` in `initAgents()`.
- `src/bin.ts:6-7` — the CLI edge, which already maps `false` to exit 1.
- `src/index.ts:8` — `run` is exported.

`src/bin.ts` (verbatim, whole file):

```typescript
#!/usr/bin/env node

import { parseCliArgs } from './args.js';
import { run } from './cli.js';

const ok = await run(parseCliArgs());
if (!ok) process.exit(1);
```

`src/cli.ts:90-110` (verbatim):

```typescript
  // --batch: read scopes from JSON file and run each sequentially
  if (options.batch) {
    const batchPath = path.resolve(cwd, options.batch);
    if (!fs.existsSync(batchPath)) {
      logger.error(`Batch file not found: ${batchPath}`);
      process.exit(1);
    }

    const parsed = parseBatchConfig(fs.readFileSync(batchPath, 'utf-8'));
    if (!parsed.ok) {
      logger.error(`Invalid batch file ${batchPath}: ${parsed.error}`);
      process.exit(1);
    }
    const batchConfig = parsed.batch;

    const batchUrl = options.url ?? batchConfig.url ?? process.env.SPECTRA_URL ?? '';
    if (!batchUrl) {
      logger.error('Error: URL required. Use --url, set SPECTRA_URL, or add "url" to batch config');
      process.exit(1);
    }
```

`src/cli.ts:166-173` (verbatim):

```typescript
  const cwd = process.cwd();

  const url = options.url ?? process.env.SPECTRA_URL ?? '';
  if (!url) {
    logger.error('Error: URL required. Use --url or set SPECTRA_URL');
    logger.plain('Run spectra --help for usage information.');
    process.exit(1);
  }
```

`src/agents/init.ts:29-40` (verbatim):

```typescript
export function initAgents(projectRoot: string): void {
  const agentsSource = path.join(TEMPLATE_DIR, 'agents');
  const agentsDest = path.join(projectRoot, '.spectra', 'agents');

  if (!fs.existsSync(agentsSource)) {
    logger.error(`Template directory not found: ${agentsSource}`);
    process.exit(1);
  }

  installTemplates(agentsSource, agentsDest);
  logger.success('Agent templates initialized in .spectra/agents/');
}
```

**Repo conventions to match**: `run()` already returns `Promise<boolean>`
and returns `false` when an Agent fails (`src/cli.ts:238`). The batch branch
returns `failed === 0` (`src/cli.ts:150`). Errors are reported with
`logger.error`.

**Vocabulary (from `CONTEXT.md`)**: a *Scope* is what a run is pointed at; a
*Batch* is a JSON file listing Scope definitions. Keep those words in the
messages.

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
- `src/agents/init.ts`
- `src/__tests__/cli.test.ts`
- `src/agents/__tests__/init.test.ts`

**Out of scope** (do NOT touch, even though they look related):
- `src/bin.ts` — the exit-code handling there is already correct.
- `src/args.ts:50` — `process.exit(0)` for `--help` lives in the argument
  parser, which is not part of the exported library surface. A `--help` exit
  is normal CLI behaviour; leave it.
- `src/agents/runner.ts` — it never calls `process.exit`.
- `src/index.ts` — the export list stays as it is.

## Git workflow

- Branch: `advisor/008-library-no-process-exit`
- Commit style: conventional commits — e.g. `fix: do not exit the host process
  from the library`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Return `false` instead of exiting in `src/cli.ts`

In the batch branch of `run()`, replace the three `process.exit(1)` calls
with `return false`:

```typescript
    const batchPath = path.resolve(cwd, options.batch);
    if (!fs.existsSync(batchPath)) {
      logger.error(`Batch file not found: ${batchPath}`);
      return false;
    }
```

```typescript
    const parsed = parseBatchConfig(fs.readFileSync(batchPath, 'utf-8'));
    if (!parsed.ok) {
      logger.error(`Invalid batch file ${batchPath}: ${parsed.error}`);
      return false;
    }
```

```typescript
    const batchUrl = options.url ?? batchConfig.url ?? process.env.SPECTRA_URL ?? '';
    if (!batchUrl) {
      logger.error('Error: URL required. Use --url, set SPECTRA_URL, or add "url" to batch config');
      return false;
    }
```

And in `runScope()`:

```typescript
  const url = options.url ?? process.env.SPECTRA_URL ?? '';
  if (!url) {
    logger.error('Error: URL required. Use --url or set SPECTRA_URL');
    logger.plain('Run spectra --help for usage information.');
    return false;
  }
```

**Verify**: `grep -n "process.exit" src/cli.ts` → no output.

### Step 2: Throw instead of exiting in `initAgents`

`initAgents` is called from `runScope` and from `scaffold`. Throwing is the
right shape for a library function: the caller decides what to do.

In `src/agents/init.ts`:

```typescript
  if (!fs.existsSync(agentsSource)) {
    throw new Error(`Template directory not found: ${agentsSource}`);
  }
```

Remove the `logger.error` call there — the caller logs it.

### Step 3: Catch the throw in `runScope`

`runScope` calls `initAgents(cwd)` (around `src/cli.ts:186-188`). Wrap it so
a broken installation is a failed run, not an unhandled exception:

```typescript
  // Always refresh the agent templates so an upgraded package ships new instructions
  logger.debug('cli', 'Refreshing agent templates...');
  try {
    initAgents(cwd);
  } catch (err) {
    logger.error(err instanceof Error ? err.message : String(err));
    return false;
  }
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 4: Update the CLI tests that assert on `process.exit`

`src/__tests__/cli.test.ts` has several cases that spy on `process.exit` and
expect it to be called with `1`:

- "exits when no URL is provided" (around line 87)
- "exits when batch file does not exist" (around line 195)
- "exits when batch file has invalid JSON" (around line 206)
- "exits when batch has no URL and none provided" (around line 219)
- "exits when batch has empty scopes array" (around line 232)
- "exits when a scope has a misspelled key" (around line 249)

Rewrite them to assert the return value instead. The pattern is the same for
all six:

```typescript
    it('fails when no URL is provided', async () => {
      const ok = await run({});

      expect(ok).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
```

```typescript
    it('fails when the batch file does not exist', async () => {
      const ok = await run({ batch: 'nonexistent.json' });

      expect(ok).toBe(false);
      expect(logger.error).toHaveBeenCalled();
      expect(runAgent).not.toHaveBeenCalled();
    });
```

Keep the `expect(runAgent).not.toHaveBeenCalled()` assertion in the batch
cases where it already exists — it is the real guarantee.

**Verify**: `pnpm vitest run src/__tests__/cli.test.ts` → all pass, and no
test spies on `process.exit` any more:

`grep -n "process.exit" src/__tests__/cli.test.ts` → no output.

### Step 5: Update the init test

`src/agents/__tests__/init.test.ts` has a case "exits with error when
template directory is missing" (at line 93) that expects
`process.exit(1)`. Rewrite it:

```typescript
  it('throws when the template directory is missing', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    // Remove templates so they don't exist
    fs.rmSync(templateDir, { recursive: true, force: true });

    expect(() => initAgents(projectRoot)).toThrow(/Template directory not found/);

    // Recreate for cleanup
    fs.mkdirSync(templateDir, { recursive: true });
  });
```

**Verify**: `pnpm vitest run src/agents/__tests__/init.test.ts` → all pass.

### Step 6: Add the test that proves the library does not exit

Add one case to `src/__tests__/cli.test.ts` that fails if `process.exit` is
called at all:

```typescript
    it('never exits the host process', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit was called');
      }) as never);

      await run({});

      expect(exitSpy).not.toHaveBeenCalled();

      exitSpy.mockRestore();
    });
```

**Verify**: `pnpm vitest run src/__tests__/cli.test.ts` → all pass.

### Step 7: Run everything

**Verify**: `pnpm typecheck && pnpm test:unit && pnpm lint && pnpm format:check`
→ all exit 0

## Test plan

- Rewritten tests in `src/__tests__/cli.test.ts`: the six cases listed in
  Step 4 now assert `false` from `run()` instead of a `process.exit` call.
- Rewritten test in `src/agents/__tests__/init.test.ts`: the missing
  template directory now throws instead of exiting.
- New test in `src/__tests__/cli.test.ts`: "never exits the host process".
- Structural pattern: the existing `describe('run')` block, which mocks the
  logger and the agents and asserts on `logger.error`.
- Verification: `pnpm vitest run src/__tests__/cli.test.ts` → all pass.

## Done criteria

- [x] `grep -n "process.exit" src/cli.ts src/agents/init.ts` returns nothing
- [x] `grep -n "process.exit" src/__tests__/cli.test.ts src/agents/__tests__/init.test.ts` returns nothing
- [x] `run()` returns `false` for: no URL, missing batch file, invalid batch file, no batch URL, empty scopes array, misspelled scope key
- [x] `initAgents()` throws when the template directory is missing
- [x] `pnpm test:unit` exits 0; at least 1 new test
- [x] `pnpm typecheck` exits 0
- [x] `pnpm lint` and `pnpm format:check` exit 0
- [x] No files outside the in-scope list are modified (`git status`)
- [x] `plans/README.md` status row for 008 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `src/bin.ts` no longer maps a `false` return to exit code 1 — the CLI
  would then exit 0 on a failed run. Report it; that file is out of scope
  here but it has to change too.
- `run()` is used somewhere else (a script, a workflow) that depends on the
  process being killed. Grep for `run(` in the repo and report what you find
  before changing the signature.
- Making the six CLI tests pass requires changing what they assert beyond
  `process.exit` → `false`. Report the test; do not weaken it.

## Maintenance notes

- The rule: a library function returns or throws; only the process edge
  (`src/bin.ts`) calls `process.exit`. Keep it that way when adding a new
  failure path.
- `initAgents` throwing is a behaviour change for anyone who called it
  directly — it is not exported from `src/index.ts`, so only this repo and
  its tests are affected.
- Reviewers should look for new `process.exit` calls in `src/`; the only one
  that should remain is in `src/args.ts` for `--help`.

## Progress

- **2026-11-10 11:21 CET — Phase start (Batch mode).** Drift check showed
  only earlier plans' changes in the four in-scope files; the plan's quoted
  excerpts still match. Branch `advisor/008-library-no-process-exit` created
  from `main`. `src/bin.ts` still maps `false` → exit code 1, so the first
  STOP condition does not apply; `run(` is used only by `src/bin.ts` and the
  test file.
- **2026-11-10 11:22 CET — Steps 1-3 done.** The four `process.exit(1)`
  calls in `src/cli.ts` became `return false`; `initAgents` now throws when
  the template directory is missing; `runScope` catches that throw, logs it
  and returns `false`. `grep -n "process.exit" src/cli.ts src/agents/init.ts`
  → no output.
- **2026-11-10 11:23 CET — Steps 4-6 done.** The six CLI tests that spied on
  `process.exit` now assert `run()` returns `false`; the init test now
  expects a throw; a new test asserts the library never calls
  `process.exit`. `grep -n "process.exit" src/__tests__/cli.test.ts
  src/agents/__tests__/init.test.ts` → no output.
- **2026-11-10 11:24 CET — Step 7 done.** `pnpm typecheck` 0, cli tests 33
  pass, init tests 14 pass, `pnpm test:unit` → 12 files, 124 tests pass,
  `pnpm lint` and `pnpm format:check` 0.

## Surprises & Discoveries

- `initAgents` is also called by `scaffold()`, which `run({ init: true })`
  calls unguarded — so Step 2 alone would have made the `--init` path throw
  out of the library (an uncaught exception and a stack trace) instead of
  exiting cleanly.
- The plan's Step 6 test message ("process.exit was called") would itself
  match the plan's own `grep -n "process.exit"` done criterion, because `.`
  is a regex wildcard. The message was changed to "the library tried to exit
  the host"; the behaviour is unchanged.

## Decision Log

- **Batch mode.** MED risk, but every step has a mechanical check and the
  change is a behaviour swap with no data risk.
- **The `--init` path in `run()` now catches the throw from `scaffold()`**
  (same pattern as the plan's Step 3 for `runScope`): without it the CLI
  would print a stack trace instead of a clean error, and `bin.ts` would not
  see a `false` return. A test was added for it.
- **The plan file stays in `plans/`** — later plans reference these files by
  path, and the repo has no archive convention.

## Outcomes & Retrospective

- **Result: completed.** The library no longer kills the host process: it
  returns `false` or throws, and only the process edge (`src/bin.ts`) exits.
- **Verification summary:** `pnpm typecheck` 0, `pnpm test:unit` 12 files /
  124 tests, lint 0, format 0, both `process.exit` greps clean, and
  `run()` returns `false` for no URL, missing batch file, invalid batch
  file, no batch URL, empty scopes and a misspelled scope key.
- **Approved deviations:** the `--init` try/catch and its test; the reworded
  "never exits the host process" message.
- **Follow-ups:** `initAgents` now throws for direct callers — it is not
  exported from `src/index.ts`, so only this repo and its tests are
  affected.
