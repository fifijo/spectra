# Plan 004: A run fails when an Agent does not produce what the catalogue says

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 2106580..HEAD -- src/cli.ts src/agents/catalogue.ts src/agents/runner.ts src/__tests__/cli.test.ts`
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

The Agent catalogue says each Agent writes specific files. The CLI never
checks. It only checks the *completion signal* — the file an Agent writes to
say "I am done" — and even that only produces a warning. So an Agent that
writes its completion signal and no Plan is treated as a success: the
Generator runs with nothing to read, invents a plan of its own, and the
Healer then "heals" tests that were never grounded in the application. The
run prints `SPECTRUM COMPLETE` and exits 0. The README promises the
opposite: *"Each agent finishes before the next one starts, so the Generator
always reads a finished test plan."*

## Current state

- `src/agents/catalogue.ts` — the single description of the three Agents.
  Each entry declares `inputs`, `outputs` and `completionSignal`.
- `src/cli.ts:223-243` — the agent loop. It never looks at `agent.outputs`.
- `src/agents/runner.ts:180-182` — the only check that exists, and it only
  warns.

`src/agents/catalogue.ts:22-50` (verbatim):

```typescript
export const AGENTS: Agent[] = [
  {
    name: 'planner',
    color: 'blue',
    emoji: '🔵',
    inputs: [],
    outputs: ['plans/test-plan.md'],
    projectOutputs: [],
    completionSignal: 'plans/.complete',
  },
  {
    name: 'generator',
    color: 'green',
    emoji: '🟢',
    inputs: ['plans/test-plan.md'],
    outputs: [],
    projectOutputs: ['pages/', 'tests/', 'fixtures/pages.ts'],
    completionSignal: 'tests/.complete',
  },
  {
    name: 'healer',
    color: 'magenta',
    emoji: '🟣',
    inputs: ['reports/results.json'],
    outputs: ['reports/healing-report.md', 'reports/status.json'],
    projectOutputs: ['pages/', 'tests/'],
    completionSignal: 'reports/.complete',
  },
];
```

`src/cli.ts:223-243` (verbatim):

```typescript
  // Run agents, one after another
  let ok = true;
  for (const agent of AGENTS) {
    logger.debug('cli', `Starting ${agent.name} agent...`);
    try {
      await runAgent(agent, {
        mode,
        outputDir,
        agentsDir,
        debug: options.debug ?? false,
      });
    } catch (err) {
      logger.error(
        `Agent ${agent.name} failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      ok = false;
      break;
    }
    if (scopeDir) preserve(agent, outputDir, scopeDir);
    logger.debug('cli', `${agent.name} complete`);
  }
```

`src/agents/runner.ts:180-182` (verbatim):

```typescript
  if (!fs.existsSync(completionFile)) {
    logger.warn(`Agent ${agent.name} did not write ${projectPath(completionFile)}`);
  }
```

**The bug, reproduced.** A fake `cursor-agent` on `PATH` that writes only
the completion signals, and nothing else, produces this run:

```
✨ SPECTRUM COMPLETE
exit=0
```

with `.spectra/output/plans/` empty — the Generator was pointed at a Plan
that does not exist, and the run claimed success.

**Repo conventions to match**: the CLI uses `logger.error` for a failure and
`logger.warn` for something suspicious; the run summary prints
`✨ SPECTRUM COMPLETE` or `❌ SPECTRUM FAILED` (`src/cli.ts:246`). Errors are
logged with `logger.error`, and the process exit code is the return value of
`run()` (`src/bin.ts:6-7`). Tests for the CLI live in `src/__tests__/cli.test.ts`
and mock `../agents/runner.js`, `../agents/init.js`, `../utils/scope.js`,
`../utils/detect-mode.js` and `../utils/logger.js`.

**Vocabulary (from `CONTEXT.md`)**: an *Agent* is one of Planner / Generator /
Healer; the *Agent catalogue* is the one description of every Agent; a
*completion signal* is the file an Agent writes to declare it has finished its
work. Use these words in messages and comments.

**ADR constraint (from `docs/adr/0001-agent-catalogue.md`)**: every path the
CLI hands an Agent comes from the catalogue. This plan reads `agent.outputs`
from the catalogue — it must not hard-code a path.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0 |
| Unit tests | `pnpm test:unit` | all pass |
| Lint | `pnpm lint` | exit 0 |
| Format check | `pnpm format:check` | exit 0 |
| One CLI test file | `pnpm vitest run src/__tests__/cli.test.ts` | all pass |

## Scope

**In scope** (the only files you should modify):
- `src/cli.ts`
- `src/__tests__/cli.test.ts`

**Out of scope** (do NOT touch, even though they look related):
- `src/agents/catalogue.ts` — the catalogue is correct; it already declares
  the outputs. Do not add a field to it.
- `src/agents/runner.ts` — the completion-signal warning stays where it is.
- `src/agents/init.ts`, `src/utils/**` — unrelated.
- `templates/agents/**` — the agent definitions are not the problem; the
  missing check is in the CLI.

## Git workflow

- Branch: `advisor/004-verify-agent-outputs`
- Commit style: conventional commits — e.g. `fix: fail a run when an agent
  produces no output`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a check for the outputs an Agent declared

In `src/cli.ts`, inside the agent loop, right after the `try`/`catch` block
and **before** `preserve(agent, outputDir, scopeDir)`, check that every file
in `agent.outputs` exists in the run's output dir.

The catalogue's `outputs` are relative to the output dir, so the absolute
path is `path.join(outputDir, file)`. `path` and `fs` are already imported
in `src/cli.ts`.

Write it as a small helper next to the existing `clean` / `preserve`
helpers in the same file:

```typescript
/** The output files an Agent was supposed to write, and that are missing. */
function missingOutputs(agent: Agent, outputDir: string): string[] {
  return agent.outputs.filter((file) => !fs.existsSync(path.join(outputDir, file)));
}
```

`Agent` is already imported in `src/cli.ts` (line 6: `type Agent`).

### Step 2: Fail the run when an output is missing

When `missingOutputs` is not empty:

- log an error naming the Agent and the missing files,
- set `ok = false`,
- `break` out of the loop, so the next Agent does not run on a missing input.

The error message must name the file, so the user can see what went wrong:

```typescript
    const missing = missingOutputs(agent, outputDir);
    if (missing.length > 0) {
      logger.error(
        `Agent ${agent.name} did not write ${missing.join(', ')} (relative to ${projectPath(outputDir)})`,
      );
      ok = false;
      break;
    }
```

Use `path.relative(process.cwd(), ...)` for the directory in the message so
the user sees a path they can open, not an absolute one. `src/cli.ts` has no
`projectPath` helper — `src/agents/runner.ts` has one, but it is not
exported. Write the one-line `path.relative(process.cwd(), outputDir)` call
inline; do not export `projectPath` from the runner just for this.

Note that the Generator declares `outputs: []` — it writes into the project
(`pages/`, `tests/`), not the output dir — so it is never missing anything.
That is correct: its work is checked by the file counts in the summary.

### Step 3: Keep the completion-signal warning where it is

`src/agents/runner.ts:180-182` warns when the completion signal is absent.
Leave it. The new check is about the *outputs*, the warning is about the
*signal*; both are useful and they catch different failures.

### Step 4: Write the test

Add to `src/__tests__/cli.test.ts`, in the `describe('agent pipeline')`
block. The file already mocks `runAgent`, so the test can make a mocked
Agent write nothing and assert the run reports failure.

Model it on the existing "stops the pipeline when an agent fails" case:

```typescript
    it('stops the pipeline when an agent writes no output', async () => {
      vi.mocked(runAgent).mockImplementation(async () => {});

      const ok = await run({ url: 'http://localhost:5173' });

      expect(ok).toBe(false);
      expect(runAgent).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('test-plan.md'));
    });
```

`runAgent` writes nothing in that test, so the Planner's declared output
`plans/test-plan.md` is missing and the pipeline must stop after the first
Agent.

Add a second case: an Agent that writes its output but a later one does not
must also stop the pipeline. Make the mocked `runAgent` write the Planner's
file only:

```typescript
    it('stops the pipeline when a later agent writes no output', async () => {
      vi.mocked(runAgent).mockImplementation(async (options) => {
        if (options.name === 'planner') {
          const output = path.join(process.cwd(), '.spectra', 'output');
          fs.mkdirSync(path.join(output, 'plans'), { recursive: true });
          fs.writeFileSync(path.join(output, 'plans', 'test-plan.md'), 'plan', 'utf-8');
        }
      });

      const ok = await run({ url: 'http://localhost:5173' });

      expect(ok).toBe(false);
      expect(runAgent).toHaveBeenCalledTimes(2);
    });
```

The Healer declares two outputs (`reports/healing-report.md`,
`reports/status.json`), so with only the Planner's file written the pipeline
must stop after the Generator.

### Step 5: Make sure the existing tests still pass

The existing CLI tests mock `runAgent` with `vi.fn(async () => {})` — the
mock writes nothing. With this change, most of them will now fail the run.
Look at `src/__tests__/cli.test.ts:120-182`: the "runs all three agents in
order", "waits for each agent before starting the next one" and "passes
correct colors and emojis to agents" cases expect three agents to run.

Make the default mock write what each Agent declares, so the pipeline
proceeds. Add a helper at the top of the test file:

```typescript
/** Make a mocked Agent write the files the catalogue says it writes. */
function writeDeclaredOutputs(agentName: string): void {
  const output = path.join(process.cwd(), '.spectra', 'output');
  const agent = AGENTS.find((a) => a.name === agentName);
  if (!agent) return;
  for (const file of agent.outputs) {
    const full = path.join(output, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, 'x', 'utf-8');
  }
}
```

and use it in the shared mock:

```typescript
    vi.mocked(runAgent).mockImplementation(async (options) => {
      writeDeclaredOutputs(options.name);
    });
```

`AGENTS` is exported from `src/agents/catalogue.js` — import it at the top
of the test file.

**Do not** weaken the new check to make the old tests pass. If a test
genuinely needs an Agent that writes nothing, say so in its name.

### Step 6: Run everything

**Verify**: `pnpm typecheck` → exit 0
**Verify**: `pnpm test:unit` → all pass, with at least 2 new tests
**Verify**: `pnpm lint` → exit 0
**Verify**: `pnpm format:check` → exit 0

## Test plan

- New tests in `src/__tests__/cli.test.ts`:
  1. the pipeline stops after the Planner when it writes no output,
  2. the pipeline stops after the Generator when the Healer writes no output,
  3. (existing, keep) the pipeline still runs all three Agents when each one
     writes what the catalogue says.
- Structural pattern: the existing `describe('agent pipeline')` block in
  `src/__tests__/cli.test.ts`, which already mocks `runAgent` and asserts on
  `runAgent` call counts and `logger.error`.
- Verification: `pnpm vitest run src/__tests__/cli.test.ts` → all pass.

## Done criteria

- [x] `src/cli.ts` contains a check that every file in `agent.outputs` exists
- [x] A run whose Agent writes no output returns `false` from `run()`
- [x] The error message names the Agent and the missing file
- [x] The pipeline stops at the Agent that produced nothing
- [x] `pnpm test:unit` exits 0; at least 2 new tests in `src/__tests__/cli.test.ts`
- [x] `pnpm typecheck` exits 0
- [x] `pnpm lint` and `pnpm format:check` exit 0
- [x] `grep -rn "test-plan.md" src/cli.ts` matches only inside the catalogue
      import path or the test — no hard-coded path in `src/cli.ts`
- [x] No files outside the in-scope list are modified (`git status`)
- [x] `plans/README.md` status row for 004 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `agent.outputs` in `src/agents/catalogue.ts` does not list the files this
  plan expects (`plans/test-plan.md` for the Planner, the two `reports/`
  files for the Healer) — the catalogue is the source of truth and it may
  have changed.
- Making the existing CLI tests pass requires changing the check itself
  rather than the test mocks. Report which test and why.
- The Healer legitimately writes its outputs somewhere else in a batch run
  (the `preserve` copy) — read `preserve` in `src/cli.ts` and report what you
  find; do not move the check after `preserve`.

## Maintenance notes

- This check is the reason the catalogue's `outputs` field matters. A new
  Agent added to `src/agents/catalogue.ts` is verified for free.
- ADR 0001 says the catalogue is the one description of the Agents. If
  someone later removes `outputs` from the catalogue because "the templates
  already say it", this check silently stops working — a reviewer should ask
  for a test that proves the check still fires.
- A batch run copies each Agent's outputs into the Scope's folder
  (`preserve`). The check must stay **before** `preserve`, because
  `preserve` only copies what exists.

## Progress

- **2026-11-10 10:52 CET — Phase start (Batch mode).** Drift check
  `git diff --stat 2106580..HEAD -- src/cli.ts src/agents/catalogue.ts
  src/agents/runner.ts src/__tests__/cli.test.ts` → no output. Branch
  `advisor/004-verify-agent-outputs` created from `main`.
- **2026-11-10 10:54 CET — Steps 1-3 done.** `missingOutputs(agent,
  outputDir)` added to `src/cli.ts`; the agent loop now checks the declared
  outputs right after the `try/catch` and **before** `preserve(...)`, logs an
  error naming the Agent and the missing files, sets `ok = false` and breaks.
  `src/agents/runner.ts` untouched (the completion-signal warning stays).
- **2026-11-10 10:54 CET — Step 4 done.** Two new tests in
  `src/__tests__/cli.test.ts`: the pipeline stops after the Planner when it
  writes nothing, and it fails when the Healer writes nothing.
- **2026-11-10 10:55 CET — Step 5 done.** The shared mock now writes what
  the catalogue declares (`writeDeclaredOutputs`), and four existing tests
  that relied on Agents writing nothing were adjusted (mock-only changes).
- **2026-11-10 10:55 CET — Step 6 done.** `pnpm typecheck` exit 0;
  `pnpm vitest run src/__tests__/cli.test.ts` → 27 tests pass;
  `pnpm test:unit` → 12 files, 114 tests pass; `pnpm lint` and
  `pnpm format:check` exit 0. `grep -rn "test-plan.md" src/cli.ts` → no
  output (no hard-coded path).

## Surprises & Discoveries

- **The plan's Step 4 expectation of 2 `runAgent` calls is unreachable.** The
  check runs *after* an Agent finishes, so the Healer (the third Agent) has
  to run before the CLI can see that it wrote nothing. The test therefore
  asserts 3 calls plus an error naming `healing-report.md`; the run still
  returns `false`. "The pipeline stops at the Agent that produced nothing"
  is proven by the first new test (the Planner → 1 call, the Generator never
  runs).
- Two existing tests needed their mocks changed, not their assertions:
  "keeps the plan and healing report of every scope" (the Healer must also
  write `reports/status.json`) and "counts only the files created by this
  run". One test was renamed to say it relies on an Agent writing nothing
  ("removes the status file of a previous run when no agent writes one"),
  which is what the plan's Step 5 asks for.

## Decision Log

- **Batch mode.** LOW risk, explicit criteria, one source file and one test
  file.
- **The plan's `projectPath(outputDir)` in the error message was replaced by
  `path.relative(cwd, outputDir)`** — the plan itself says `src/cli.ts` has
  no `projectPath` helper and that the runner's copy must not be exported.
- **The plan file stays in `plans/`** — the dependency notes and plan 005
  reference these files by path, and the repo has no archive convention.

## Outcomes & Retrospective

- **Result: completed.** A run whose Agent produces none of its declared
  outputs now fails with an error naming the Agent and the missing file,
  instead of printing `SPECTRUM COMPLETE` and exiting 0.
- **Verification summary:** `pnpm typecheck` 0, cli tests 27 pass,
  `pnpm test:unit` 12 files / 114 tests, lint 0, format 0, and
  `grep -rn "test-plan.md" src/cli.ts` → no output.
- **Approved deviations:** the second new test asserts 3 `runAgent` calls
  (the plan's 2 is impossible); the error message uses the local `cwd`
  variable, which is `process.cwd()`.
- **Follow-ups:** none. The real flow is unaffected — the Healer template
  writes both of its declared outputs.
