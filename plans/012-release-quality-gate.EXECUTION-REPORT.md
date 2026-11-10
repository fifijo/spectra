# Execution Report: The publish runs the quality gate first

> Date: 2026-11-10 11:43 CET
>
> Mode: Batch
>
> Plan: `plans/012-release-quality-gate.md` — branch `advisor/012-release-quality-gate`

## Summary

- **Overall result: Completed**
- The `release` script now runs the same gate the CI job runs before
  `changeset publish` uploads anything.
- A failed publish now explains the recovery in the workflow log, because
  `changeset version` has already consumed the changeset by then.
- The gate was proven to fail on a real break and pass again after the
  revert.

## Phase Results

- Step 1: Put the quality gate in front of the publish — ✅
  - Implemented: `"release": "pnpm run check && pnpm run typecheck &&
    pnpm run typecheck:test && pnpm run test:unit && pnpm run build &&
    changeset publish"`.
  - Verification: `pnpm check && pnpm typecheck && pnpm typecheck:test &&
    pnpm test:unit && pnpm build` → all exit 0. `pnpm run release` was never
    executed.
- Step 2: Make the version pull request carry the same gate — ✅
  - Implemented: nothing; `ci.yml` already runs on `pull_request` to `main`.
  - Verification: `grep -n "pull_request" .github/workflows/ci.yml` → one match.
- Step 3: Say what happened when the publish fails — ✅
  - Implemented: the `Explain a failed publish` step after the publish step.
  - Verification: `grep -n "Explain a failed publish"
    .github/workflows/release.yml` → one match; the YAML parses.
- Step 4: Run everything — ✅
  - Verification: the gate chain exits 0; `pnpm test:unit` → 12 files,
    129 tests pass.
- Test plan: the gate's self-check — ✅
  - A temporary syntax error in `src/utils/constants.ts` made `pnpm run check`
    exit 1 and `pnpm run typecheck` exit 2; the break was reverted and the
    file is byte-identical to its original.

## Verification Matrix

- Biome check: pass (`pnpm check` — 56 files)
- Type check: pass (`pnpm typecheck`, `pnpm typecheck:test`)
- Unit tests: pass (`pnpm test:unit` — 12 files, 129 tests)
- Build: pass (`pnpm build`)
- CI pull_request gate: pass (`grep -n "pull_request" .github/workflows/ci.yml` → 1 match)
- Recovery step: pass (`grep -n "Explain a failed publish" .github/workflows/release.yml` → 1 match)
- Manual QA: pending — the real publish needs an npm token

## Deviations

- The `release` script mirrors the **current** CI gate (`pnpm check` →
  `pnpm typecheck` → `pnpm typecheck:test` → `pnpm test:unit` → build)
  instead of the plan's literal snippet, which was written against the old
  CI job. The plan's own instruction is "the same set in the same order",
  and plans 002 and 010 changed that set.
- `plans/README.md` was updated by the orchestrator.

## Blockers and Resolutions

- Blocker: none. The STOP conditions did not fire — the `release` script
  exists, `changesets/action` still calls `pnpm run release`, the script is
  only called from the workflow, and the added gate costs about 6 seconds
  against a 15-minute job timeout.
- Impact: n/a.
- Resolution: n/a.
- Status: none.

## Follow-ups

- The release builds three times (workflow step, `prepublishOnly`, the
  release script) — harmless, but a cleanup candidate.
- `.agents/skills/releasing/SKILL.md:37-41` still documents the old release
  script — a doc drift for plan 013.

## Changed Files

- `package.json` — the `release` script only.
- `.github/workflows/release.yml` — the `Explain a failed publish` step.
- `plans/012-release-quality-gate.md` (untracked working material) — living plan log.
- `plans/README.md` (untracked working material) — status row for 012.
- `plans/012-release-quality-gate.EXECUTION-REPORT.md` (untracked) — this report.
