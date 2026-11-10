# Execution Report: The templates and the docs stop contradicting the repo

> Date: 2026-11-10 11:47 CET
>
> Mode: Batch
>
> Plan: `plans/013-docs-drift.md` — branch `advisor/013-docs-drift`

## Summary

- **Overall result: Completed**
- The Generator template now obeys the gate it is reviewed against: no
  hard-coded waits, a tag on every example, and the tag vocabulary in the
  template itself.
- Every `tests/e2e/seed.spec.ts` reference points at the real
  `tests/seed.spec.ts`, the scaffold no longer creates an empty `tests/e2e/`,
  and the stale skill files, `.gitignore` entry and changeset bullet are
  fixed.

## Phase Results

- Step 1: Make the Generator template obey the Generator gate — ✅
  - Implemented: the two `page.waitForTimeout(1000)` calls became
    `expect.poll(...).toBeGreaterThan(itemsBefore)`; 14 example tests were
    wrapped in tagged `test.describe` blocks; the "Test Tags (REQUIRED)" and
    "Review Rules" sections were added.
  - Verification: `grep -n "waitForTimeout" templates/agents/generator/AGENT.md`
    → no output; `grep -c "tag:"` → 15.
- Step 2: Fix the Planner template's step numbering — ✅
  - Verification: `grep -n "^### Step" templates/agents/planner/AGENT.md` →
    1, 2, 3, 4, 5, 6.
- Step 3: Point every seed reference at the real file — ✅
  - Verification: the repo-wide `tests/e2e` grep (minus `plans/`, `dist/`,
    `node_modules/`) → no output.
- Step 4: Remove the `tests/e2e` directory from the scaffold — ✅
  - Implemented: `PROJECT_DIRS` now creates `tests`; the project-structure
    blocks in `templates/agents/shared/context.md` and `docs/WALKTHROUGH.md`
    follow.
  - Verification: `pnpm typecheck` 0, `pnpm test:unit` → 12 files,
    129 tests pass.
- Step 5: Fix the stale skill files — ✅
  - Implemented: `args.test.ts` instead of `bin.test.ts`, the real constant
    names, Biome "v2.4.13 (the version pinned in package.json)", the seed
    spec described as it really is, and `tests/` in the scaffold list.
  - Verification: `grep -rn "bin.test\|DEFAULTS\|2\.4\.9" .agents/` → no output.
- Step 6: Drop the `.auth/` entry from `.gitignore` — ✅
  - Verification: `grep -n "\.auth" .gitignore` → no output.
- Step 7: Split the changeset bullet — ✅
  - Verification: `grep -n "scope file-" .changeset/five-pumas-listen.md` → no output.
- Step 8: Run everything — ✅
  - Verification: `pnpm typecheck` 0, `pnpm typecheck:test` 0,
    `pnpm test:unit` → 12 files, 129 tests pass, `pnpm check` 0 (56 files),
    `pnpm exec playwright test --list` → `Total: 18 tests in 12 files`.
- Test plan: the catalogue test — ✅
  - Verification: `pnpm vitest run src/agents/__tests__/catalogue.test.ts` → 3 tests pass.

## Verification Matrix

- Type check: pass (`pnpm typecheck`, `pnpm typecheck:test`)
- Unit tests: pass (`pnpm test:unit` — 12 files, 129 tests)
- Biome check: pass (`pnpm check` — 56 files)
- Catalogue test: pass (`pnpm vitest run src/agents/__tests__/catalogue.test.ts` — 3 tests)
- E2E collection: pass (`pnpm exec playwright test --list` — 18 tests in 12 files)
- Grep checks: all clean (`waitForTimeout`, `tests/e2e`, `bin.test|DEFAULTS|2.4.9`, `.auth`, `scope file-`)
- Build: not run — no source change
- Manual QA: pending — a real agent run needs live agent tooling

## Deviations

- The fixture import examples were corrected to `'../fixtures/pages.js'` in
  `templates/agents/generator/AGENT.md` and `specs/GENERATOR-GATE.md` (both
  in scope), and in the doc comments of `templates/fixtures/pages.ts` and
  `fixtures/pages.ts` (outside the plan's scope list). Plan 002 made
  extension-less imports fail the repo's own `pnpm typecheck:test` gate, so
  the template was teaching code the repo rejects.
- `docs/WALKTHROUGH.md`'s tree line was renamed (`tests/e2e/` → `tests/`)
  rather than deleted, because a `seed.spec.ts` child hangs off it.
- `.agents/skills/e2e-testing/SKILL.md` pointed at a `tests/auth.spec.ts`
  that does not exist; it now names `tests/login.spec.ts`.
- `plans/README.md` was updated by the orchestrator.

## Blockers and Resolutions

- Blocker: none. The STOP conditions did not fire — `tests/seed.spec.ts`
  exists, no `tests/e2e/` directory has content, `requireEnv()` exists
  nowhere in the repo, and the catalogue test still passes.
- Impact: n/a.
- Resolution: n/a.
- Status: none.

## Follow-ups

- The README's CI section still describes the old "Start application" step,
  which plan 001 removed; `.agents/skills/ci-workflow/SKILL.md` names the
  same removed step.

## Changed Files

- `templates/agents/generator/AGENT.md` — waits, tags, tag vocabulary, review rules.
- `templates/agents/planner/AGENT.md` — step numbering.
- `templates/agents/shared/context.md`, `docs/WALKTHROUGH.md` — project structure.
- `specs/PILOT.md`, `specs/PLANNER-GATE.md`, `specs/GENERATOR-GATE.md` — seed path, import rule.
- `.agents/skills/e2e-testing/SKILL.md`, `.agents/skills/unit-testing/SKILL.md`,
  `.agents/skills/linting-formatting/SKILL.md`,
  `.agents/skills/testing-spectra-cli/SKILL.md` — stale references.
- `.changeset/five-pumas-listen.md` — the split bullet.
- `src/utils/layout.ts` — `PROJECT_DIRS` creates `tests`.
- `.gitignore` — the `.auth/` entry removed.
- `templates/fixtures/pages.ts`, `fixtures/pages.ts` — the `.js` import comment.
- `plans/013-docs-drift.md` (untracked working material) — living plan log.
- `plans/README.md` (untracked working material) — status row for 013.
- `plans/013-docs-drift.EXECUTION-REPORT.md` (untracked) — this report.
