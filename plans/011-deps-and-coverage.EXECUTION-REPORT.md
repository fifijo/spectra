# Execution Report: The lockfile carries the fixed dependencies, and the coverage script runs

> Date: 2026-11-10 11:40 CET
>
> Mode: Batch
>
> Plan: `plans/011-deps-and-coverage.md` — branch `advisor/011-deps-and-coverage`

## Summary

- **Overall result: Completed**
- The lockfile now resolves vitest 4.1.12, @vitest/mocker 4.1.12,
  @vitest/coverage-v8 4.1.12, vite 8.3.7, js-yaml 3.15.2 / 4.3.2 and
  source-map-js 1.2.2 — `pnpm audit` is clean.
- `pnpm test:unit:coverage` runs and prints a coverage table (93.03%
  statements).
- The refresh was kept targeted: a full `pnpm update` would pull Biome
  2.6.6, whose new Markdown rules break the gate plan 010 added.

## Phase Results

- Step 1: Add the coverage provider — ✅
  - Implemented: `@vitest/coverage-v8` in devDependencies.
  - Note: the install had to run in a clean copy of the repo — this machine
    has a `/home/chris/pnpm-workspace.yaml`, so pnpm inside this checkout
    resolves the outer workspace and installs into the wrong tree.
- Step 2: Refresh the lockfile to the fixed versions — ✅
  - Implemented: vitest 4.1.12, @vitest/mocker 4.1.12, @vitest/coverage-v8
    4.1.12, vite 8.3.7, js-yaml 3.15.2 and 4.3.2, source-map-js 1.2.2.
  - Verification: `pnpm audit` in a clean copy → "No known vulnerabilities
    found"; the resolved versions read from the lockfile.
- Step 3: Make the coverage script work — ✅
  - Verification: `pnpm test:unit:coverage` → exit 0 with the coverage table
    (`Statements 93.03% (454/488)`).
- Step 4: Run everything — ✅
  - Verification: `pnpm typecheck` 0, `pnpm typecheck:test` 0,
    `pnpm test:unit` → 12 files, 129 tests pass, `pnpm lint` /
    `pnpm format:check` / `pnpm check` 0, `pnpm install --frozen-lockfile` 0,
    `pnpm exec playwright test --list` → `Total: 18 tests in 12 files`.
- Test plan: one regression guard — ✅
  - Implemented: "package.json has a test:unit:coverage script and
    @vitest/coverage-v8 devDependency" in `src/utils/__tests__/constants.test.ts`.

## Verification Matrix

- Audit: pass (`pnpm audit` in a clean copy → "No known vulnerabilities found"; inside this checkout the command audits the outer `/home/chris` workspace, which the plan's maintenance notes describe)
- Coverage: pass (`pnpm test:unit:coverage` → table, 93.03% statements)
- Unit tests: pass (`pnpm test:unit` — 12 files, 129 tests)
- Type check: pass (`pnpm typecheck`, `pnpm typecheck:test`)
- Lint / format / check: pass (`pnpm lint`, `pnpm format:check`, `pnpm check` — 56 files)
- Frozen lockfile: pass (`pnpm install --frozen-lockfile`)
- E2E collection: pass (`pnpm exec playwright test --list` — 18 tests in 12 files)
- Build: not run — no source change
- Manual QA: pending — the CI job installs with `--frozen-lockfile`

## Deviations

- `pnpm.overrides` pins the two `js-yaml` copies (`read-yaml-file>js-yaml`
  → 3.15.2, `@changesets/parse>js-yaml` → 4.3.2) and `source-map-js`
  (→ ^1.2.2). Each stays inside the major its consumer expects, so no
  consumer's API changes; all three advisories have a fixed release, which
  is the case the plan allows an override for.
- `vite` was added to devDependencies: it is an auto-installed peer of
  vitest, and `pnpm update vite` cannot move an auto-installed peer (an
  override for it does not resolve the peer either).
- `vitest`'s range was raised to `^4.1.12` so it cannot resolve older than
  the coverage provider's peer requirement.
- The refresh was kept targeted instead of a full `pnpm update`: the full
  update pulls `@biomejs/biome` 2.6.6, whose new Markdown rules make
  `pnpm check` fail on this repo's files.
- `plans/README.md` was updated by the orchestrator.

## Blockers and Resolutions

- Blocker: the advisory database is ahead of the plan's snapshot, so the
  planned `pnpm update vitest @changesets/cli` alone left 18 advisories
  (vite, js-yaml, source-map-js).
- Impact: the plan's "audit is clean" criterion was not met by the planned
  command.
- Resolution: the vulnerable transitive copies were moved to their fixed
  releases within their existing major versions; every affected package's
  API was checked (`load`/`safeLoad` still present in both js-yaml copies).
- Status: resolved.

## Follow-ups

- The `pnpm.overrides` entries can be dropped once the parent packages
  require the fixed versions.
- `pnpm audit` inside this checkout audits the outer `/home/chris` workspace;
  use a clean copy (or a checkout without a parent workspace) to audit this
  repo.

## Changed Files

- `package.json` — `@vitest/coverage-v8` and `vite` in devDependencies,
  `vitest` floor raised, `pnpm.overrides` block.
- `pnpm-lock.yaml` — the resolved fixed versions.
- `src/utils/__tests__/constants.test.ts` — one regression guard.
- `plans/011-deps-and-coverage.md` (untracked working material) — living plan log.
- `plans/README.md` (untracked working material) — status row for 011.
- `plans/011-deps-and-coverage.EXECUTION-REPORT.md` (untracked) — this report.
