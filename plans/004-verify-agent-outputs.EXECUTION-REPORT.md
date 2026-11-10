# Execution Report: A run fails when an Agent does not produce what the catalogue says

> Date: 2026-11-10 10:57 CET
>
> Mode: Batch
>
> Plan: `plans/004-verify-agent-outputs.md` — branch `advisor/004-verify-agent-outputs`

## Summary

- **Overall result: Completed**
- The CLI now checks every file an Agent declares in the Agent catalogue and
  fails the run when one is missing, naming the Agent and the file.
- The check runs before `preserve`, so a Scope's copies still only contain
  what really exists.
- Two new tests pin the behaviour; four existing tests were fixed at the
  mock level, not by weakening the check.

## Phase Results

- Step 1: Add the missing-output check — ✅
  - Implemented: `missingOutputs(agent, outputDir)` helper in `src/cli.ts`.
  - Verification: `pnpm typecheck` → exit 0.
- Step 2: Fail the run when an output is missing — ✅
  - Implemented: the agent loop logs `Agent <name> did not <files> (relative
    to <dir>)` via `logger.error`, sets `ok = false` and breaks — before
    `preserve(...)`.
  - Verification: the two new tests assert `run()` returns `false` and that
    the error names the missing file; `grep -rn "test-plan.md" src/cli.ts` →
    no output, so no path is hard-coded.
- Step 3: Keep the completion-signal warning where it is — ✅
  - Implemented: nothing; `src/agents/runner.ts` untouched.
- Step 4: Write the tests — ✅
  - Implemented: "stops the pipeline when an agent writes no output" and
    "stops the pipeline when a later agent writes no output".
  - Verification: `pnpm vitest run src/__tests__/cli.test.ts` → 27 tests pass.
  - Notes: the second test asserts 3 `runAgent` calls, not the plan's 2 —
    see Deviations.
- Step 5: Make the existing tests still pass — ✅
  - Implemented: the shared mock writes what the catalogue declares
    (`writeDeclaredOutputs`); four tests that relied on Agents writing
    nothing were adjusted at the mock level.
  - Verification: `pnpm test:unit` → 12 files, 114 tests pass (112 + 2).
  - Notes: the check itself was not weakened.
- Step 6: Run everything — ✅
  - Verification: `pnpm typecheck` 0, `pnpm lint` 0, `pnpm format:check` 0.

## Verification Matrix

- Type check: pass (`pnpm typecheck`)
- Unit tests: pass (`pnpm test:unit` — 12 files, 114 tests)
- CLI test file: pass (`pnpm vitest run src/__tests__/cli.test.ts` — 27 tests)
- Lint: pass (`pnpm lint`)
- Format check: pass (`pnpm format:check`)
- Hard-coded path check: pass (`grep -rn "test-plan.md" src/cli.ts` → no output)
- Build: not run — no packaging change
- Manual QA: pending — a real run needs a live agent toolchain

## Deviations

- The second new test asserts `runAgent` was called **3** times, not the
  plan's 2. The check runs after an Agent finishes, so the Healer — the last
  Agent — must run before the CLI can see that it wrote nothing. The run
  still returns `false` and the error names `healing-report.md`.
- The error message uses the local `cwd` variable instead of a second
  `process.cwd()` call; `cwd` is `process.cwd()` in `runScope`.
- `plans/README.md` was updated by the orchestrator, not the executor.

## Blockers and Resolutions

- Blocker: none. The plan's STOP conditions did not fire; the catalogue
  still declares `plans/test-plan.md` for the Planner and the two `reports/`
  files for the Healer, and `preserve` copies `agent.outputs` from the
  output dir, so the check's position is correct.
- Impact: n/a.
- Resolution: n/a.
- Status: none.

## Follow-ups

- None. A run now fails loudly when an Agent skips a declared output — the
  intended behaviour change.

## Changed Files

- `src/cli.ts` — `missingOutputs()` and the check in the agent loop.
- `src/__tests__/cli.test.ts` — `writeDeclaredOutputs()` helper, the default
  mock, four adjusted mocks, two new tests.
- `plans/004-verify-agent-outputs.md` (untracked working material) —
  living plan log.
- `plans/README.md` (untracked working material) — status row for 004.
- `plans/004-verify-agent-outputs.EXECUTION-REPORT.md` (untracked) — this report.
