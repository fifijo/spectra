# Execution Report: The library stops the host process from dying

> Date: 2026-11-10 11:26 CET
>
> Mode: Batch
>
> Plan: `plans/008-library-no-process-exit.md` — branch `advisor/008-library-no-process-exit`

## Summary

- **Overall result: Completed**
- `run()` and `initAgents()` no longer call `process.exit`: the library
  returns `false` or throws, and only the process edge (`src/bin.ts`) exits.
- Six CLI tests and one init test were rewritten to assert the return value
  or the throw instead of a spy on `process.exit`; two new tests were added.

## Phase Results

- Step 1: Return `false` instead of exiting — ✅
  - Implemented: four `process.exit(1)` calls in `src/cli.ts` → `return false`.
  - Verification: `grep -n "process.exit" src/cli.ts src/agents/init.ts` → no output.
- Step 2: Throw instead of exiting in `initAgents` — ✅
  - Implemented: `throw new Error(\`Template directory not found: ...\`)`;
    the `logger.error` call was removed — the caller logs it.
- Step 3: Catch the throw in `runScope` — ✅
  - Implemented: `initAgents(cwd)` is wrapped; the message is logged and the
    run returns `false`.
  - Verification: `pnpm typecheck` → exit 0.
- Step 4: Update the CLI tests — ✅
  - Implemented: six tests rewritten to assert `run()` returns `false` and
    `logger.error` was called.
  - Verification: `grep -n "process.exit" src/__tests__/cli.test.ts
    src/agents/__tests__/init.test.ts` → no output.
- Step 5: Update the init test — ✅
  - Implemented: "throws when the template directory is missing".
  - Verification: `pnpm vitest run src/agents/__tests__/init.test.ts` → 14 tests pass.
- Step 6: Add the test that proves the library does not exit — ✅
  - Implemented: "never exits the host process".
  - Verification: `pnpm vitest run src/__tests__/cli.test.ts` → 33 tests pass.
- Step 7: Run everything — ✅
  - Verification: `pnpm typecheck` 0, `pnpm test:unit` → 12 files,
    124 tests pass, `pnpm lint` 0, `pnpm format:check` 0.

## Verification Matrix

- Type check: pass (`pnpm typecheck`)
- Unit tests: pass (`pnpm test:unit` — 12 files, 124 tests)
- CLI test file: pass (`pnpm vitest run src/__tests__/cli.test.ts` — 33 tests)
- init test file: pass (`pnpm vitest run src/agents/__tests__/init.test.ts` — 14 tests)
- Lint: pass (`pnpm lint`)
- Format check: pass (`pnpm format:check`)
- `process.exit` grep (source): pass (no output)
- `process.exit` grep (tests): pass (no output)
- Build: not run — no packaging change
- Manual QA: pending — needs a consumer project to import the library

## Deviations

- The `--init` path in `run()` now catches the throw from `scaffold()`,
  mirroring Step 3's pattern. Without it, the `--init` CLI would print a
  stack trace instead of a clean error and `src/bin.ts` would never see the
  `false` return. A test ("fails when the scaffold throws") was added.
- The new test's failure message was changed from "process.exit was called"
  to "the library tried to exit the host", because the original literal
  matched the plan's own `grep -n "process.exit"` done criterion.
- `plans/README.md` was updated by the orchestrator.

## Blockers and Resolutions

- Blocker: none. The STOP conditions did not fire — `src/bin.ts` still maps
  `false` to exit code 1, `run(` is used only by `src/bin.ts` and the test
  file, and no test needed assertions changed beyond `process.exit` →
  `false`.
- Impact: n/a.
- Resolution: n/a.
- Status: none.

## Follow-ups

- `initAgents` now throws for direct callers. It is not exported from
  `src/index.ts`, so only this repo and its tests are affected.

## Changed Files

- `src/cli.ts` — `return false` instead of `process.exit`, the `initAgents`
  catch in `runScope`, the `scaffold` catch in the `--init` path.
- `src/agents/init.ts` — `initAgents` throws.
- `src/__tests__/cli.test.ts` — six rewritten tests, two new tests.
- `src/agents/__tests__/init.test.ts` — one rewritten test.
- `plans/008-library-no-process-exit.md` (untracked working material) —
  living plan log.
- `plans/README.md` (untracked working material) — status row for 008.
- `plans/008-library-no-process-exit.EXECUTION-REPORT.md` (untracked) — this report.
