# Execution Report: The CI/Healer policy matches the workflow it describes

> Date: 2026-11-10
>
> Plan: `plans/025-ci-healer-policy.md`

## Summary

- **Overall result: Completed**
- The artifact table says what the workflow does: the report and the JSON
  results go up on every run, the traces and the screenshots only when the
  run failed.
- The retry limits name the numbers the code uses: three attempts per test,
  the Playwright default timeout of 30 seconds, and the two CI retries from
  `playwright.config.ts`. The row that bounded nothing is gone.

## Phase Results

- Step 1: Fix the artifact table — ✅
  - Implemented: the table has a "When" column and says which run uploads
    what, and it names the workflow that does it.
- Step 2: Fix the retry limits — ✅
  - Implemented: "Max total Healer cycles | 5" and "Timeout per attempt |
    60 seconds" are gone. The table carries the three numbers the code
    holds.
- Step 3: Say which tags the triage adds — ✅
  - Implemented: the triage section says `@blocked` and `@flaky` are added
    by the triage and are not part of the Generator's vocabulary.

## Verification Matrix

- Type check: pass (`pnpm typecheck`, `pnpm typecheck:test`)
- Unit tests: pass (`pnpm test:unit`)
- Biome check: pass (`pnpm check`)
- Build: pass (`pnpm build`)

## Deviations

- None.

## Changed Files

- `specs/CI-HEALER-POLICY.md` — the artifact table, the retry limits, the triage tags.
