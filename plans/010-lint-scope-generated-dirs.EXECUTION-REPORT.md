# Execution Report: The lint gate covers the code the Agents write

> Date: 2026-11-10 11:31 CET
>
> Mode: Batch
>
> Plan: `plans/010-lint-scope-generated-dirs.md` — branch `advisor/010-lint-scope-generated-dirs`

## Summary

- **Overall result: Completed**
- Biome now checks `tests/`, `pages/`, `fixtures/` and `templates/` — the
  four directories the pipeline writes into — and CI runs `pnpm check`, which
  includes the assists (import order) that `lint` and `format` skip.
- 14 errors and 1 warning were found by the widened scope and fixed; the
  gate is clean over 56 files.

## Phase Results

- Step 1: Widen the Biome scope — ✅
  - Implemented: `tests/**`, `pages/**`, `fixtures/**`, `templates/**` added
    to `files.includes`.
  - Verification: `pnpm check` → 14 errors + 1 warning (the plan predicted
    13 + 1; the extra error is `templates/cursor/mcp.json`, added by plan
    006 after this plan was written).
- Step 2: Let Biome fix what it can — ✅
  - Implemented: `pnpm check:fix` fixed 13 files (import order in the
    specs, one line-wrap in `tests/settings.spec.ts`, the JSON formatting).
  - Verification: the diff was read — import order and whitespace only;
    `pnpm check` → exit 0.
- Step 3: Fix the banned type in the fixtures template — ✅
  - Implemented: `// biome-ignore lint/complexity/noBannedTypes: the
    Generator adds the fixtures` above `type PageFixtures`.
  - Verification: `pnpm check` → exit 0, no warning.
- Step 4: Make CI run the assists too — ✅
  - Implemented: the `Lint (Biome)` and `Format check (Biome)` steps became
    one `Lint, format and assists (Biome)` step running `pnpm check`.
- Step 5: Run everything — ✅
  - Verification: `pnpm check` 0 (56 files), `pnpm lint` 0,
    `pnpm format:check` 0, `pnpm typecheck` 0, `pnpm test:unit` → 12 files,
    128 tests pass, `pnpm exec playwright test --list` → `Total: 18 tests in
    12 files`.
- Test plan: one regression guard — ✅
  - Implemented: "keeps the lint scope covering every folder the agents write
    into" in `src/utils/__tests__/layout.test.ts`.
  - Verification: `pnpm test:unit` → 128 tests pass; the guard was mutation
    checked (removing `templates/**` makes it fail).

## Verification Matrix

- Biome check: pass (`pnpm check` — 56 files, no errors, no warnings)
- Lint: pass (`pnpm lint`)
- Format check: pass (`pnpm format:check`)
- Type check: pass (`pnpm typecheck`)
- Unit tests: pass (`pnpm test:unit` — 12 files, 128 tests)
- E2E collection: pass (`pnpm exec playwright test --list` — 18 tests in 12 files)
- Template/root MCP config parity: pass (`diff templates/cursor/mcp.json .cursor/mcp.json` → no output)
- Build: not run — no packaging change
- Manual QA: pending — the GitHub Actions quality job runs on the next push

## Deviations

- `.cursor/mcp.json` was reformatted to the same whitespace Biome applied to
  `templates/cursor/mcp.json`. The root file is outside the Biome scope, but
  plan 006's done criterion — the template and the repo's MCP config are
  identical — would otherwise be broken by the template's reformat.
- `src/utils/__tests__/layout.test.ts` was treated as in scope: the plan's
  scope list says `src/**` is out of scope, but its Test plan and done
  criteria require one new test in exactly that file.
- `plans/README.md` was updated by the orchestrator.

## Blockers and Resolutions

- Blocker: none. The STOP conditions did not fire: no `src/**` violations
  appeared, `check:fix` changed only import order and whitespace, and
  `templates/` is not excluded by `.gitignore`.
- Impact: n/a.
- Resolution: n/a.
- Status: none.

## Follow-ups

- Every future edit under `templates/**` must be Biome-clean or CI fails —
  that includes the JSON templates.

## Changed Files

- `biome.json` — the widened `files.includes`.
- `.github/workflows/ci.yml` — one `pnpm check` step.
- `templates/fixtures/pages.ts` — the `biome-ignore` comment.
- `templates/cursor/mcp.json`, `.cursor/mcp.json` — JSON formatting.
- `tests/*.spec.ts` (12 files) — import order and one line-wrap.
- `src/utils/__tests__/layout.test.ts` — the scope regression guard.
- `plans/010-lint-scope-generated-dirs.md` (untracked working material) —
  living plan log.
- `plans/README.md` (untracked working material) — status row for 010.
- `plans/010-lint-scope-generated-dirs.EXECUTION-REPORT.md` (untracked) — this report.
