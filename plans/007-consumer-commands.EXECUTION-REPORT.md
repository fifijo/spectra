# Execution Report: The instructions a consumer gets point at commands they have

> Date: 2026-11-10 11:22 CET
>
> Mode: Batch
>
> Plan: `plans/007-consumer-commands.md` — branch `advisor/007-consumer-commands`

## Summary

- **Overall result: Completed**
- The CLI and the three consumer-facing documents now name only commands a
  consumer project has: `npx playwright …` (the `@playwright/test` peer
  dependency is already installed).
- This repo's own `pnpm test` scripts stay in `package.json` — they are for
  contributors.
- One new test pins the printed commands.

## Phase Results

- Step 1: Print the commands a consumer can run — ✅
  - Implemented: the `Commands:` block now lists `npx playwright test`,
    `npx playwright test --ui` and
    `npx playwright show-report .spectra/output/reports`.
  - Verification: the new test asserts the printed text contains
    `npx playwright test` and no `pnpm test`.
- Step 2: Make the `--init` next steps complete — ✅
  - Implemented: four steps now (install Playwright, install the browser,
    start the app, run spectra).
- Step 3: Fix the README quickstart — ✅
  - Implemented: `pnpm test:seed` → `npx playwright test tests/seed.spec.ts`.
  - Verification: `grep -n "pnpm test:seed" README.md` → no output.
- Step 4: Fix the README "Running Tests" section — ✅
  - Implemented: all `pnpm test*` / `pnpm report` commands replaced; the
    `SPECTRA_BROWSERS` / `SPECTRA_TAGS` prefixes are unchanged.
- Step 5: Fix the same commands in the docs — ✅
  - Implemented: `docs/QUICK-REFERENCE.md` "Test Commands" and
    `docs/WALKTHROUGH.md` (the ASCII box, the "Check Results" block and the
    command table).
  - Verification: `grep -rn "pnpm test\|pnpm report" README.md
    docs/QUICK-REFERENCE.md docs/WALKTHROUGH.md` → no output.
- Step 6: Write the test — ✅
  - Implemented: "prints commands the consumer project actually has" in
    `describe('summary')`.
  - Verification: `pnpm vitest run src/__tests__/cli.test.ts` → 31 tests pass.
- Step 7: Run everything — ✅
  - Verification: `pnpm typecheck` 0, `pnpm test:unit` → 12 files,
    122 tests pass, `pnpm lint` 0, `pnpm format:check` 0.

## Verification Matrix

- Type check: pass (`pnpm typecheck`)
- Unit tests: pass (`pnpm test:unit` — 12 files, 122 tests)
- CLI test file: pass (`pnpm vitest run src/__tests__/cli.test.ts` — 31 tests)
- Lint: pass (`pnpm lint`)
- Format check: pass (`pnpm format:check`)
- Docs grep: pass (no `pnpm test` / `pnpm report` in the three documents)
- Build: not run — no source packaging change
- Manual QA: pending — a real consumer install needs a clean project

## Deviations

- The plan's one-line test snippet is 104 characters (biome's limit is 100),
  so it was written in biome's multi-line form with the same assertions.
- `plans/README.md` was updated by the orchestrator.

## Blockers and Resolutions

- Blocker: none. The STOP conditions did not fire: the report path is still
  `.spectra/output/reports`, `@playwright/test` is still a non-optional peer
  dependency, and every `pnpm test` reference in the three documents was
  consumer-facing.
- Impact: n/a.
- Resolution: n/a.
- Status: none.

## Follow-ups

- `.spectra/output/reports` is hard-coded in the printed command and in the
  docs; a consumer who changes `outputFolder` in their own Playwright config
  gets a stale path.

## Changed Files

- `src/cli.ts` — the printed commands and the `--init` next steps.
- `src/__tests__/cli.test.ts` — one new summary test.
- `README.md` — quickstart and "Running Tests".
- `docs/QUICK-REFERENCE.md` — "Test Commands".
- `docs/WALKTHROUGH.md` — ASCII box, "Check Results", command table.
- `plans/007-consumer-commands.md` (untracked working material) — living plan log.
- `plans/README.md` (untracked working material) — status row for 007.
- `plans/007-consumer-commands.EXECUTION-REPORT.md` (untracked) — this report.
