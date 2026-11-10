# Plan 011: The lockfile carries the fixed dependencies, and the coverage script runs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 2106580..HEAD -- package.json pnpm-lock.yaml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `2106580`, 2026-11-10

## Why this matters

Two small problems in the dependency layer.

The lockfile pins `vitest@4.1.5`, which is covered by two advisories (a
path traversal through `@vitest/mocker`, and code injection through manual
mock registration), and `js-yaml` 3.x, reached through `@changesets/cli`,
which carries three denial-of-service advisories. The declared ranges
(`vitest: ^4.1.5`, `@changesets/cli: ^2.31.0`) already allow the fixed
releases — only the lockfile is stale. CI installs with `--frozen-lockfile`,
so CI and the release always run the vulnerable versions.

And `pnpm test:unit:coverage` is a script in `package.json` that cannot run:
`@vitest/coverage-v8` is not installed. It fails with
`MISSING DEPENDENCY Cannot find dependency '@vitest/coverage-v8'`.

## Current state

- `package.json:38` — `"test:unit:coverage": "vitest run --coverage"`.
- `package.json:77-83` — the devDependencies.
- `vitest.config.ts:6-10` — the coverage configuration, `provider: 'v8'`.
- `pnpm-lock.yaml` — the resolved versions.
- `.github/workflows/ci.yml:30` and `.github/workflows/release.yml:33` —
  `pnpm install --frozen-lockfile`.

`vitest.config.ts` (verbatim, whole file):

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**'],
    },
  },
});
```

**The advisories** (from `pnpm audit` on this package's own lockfile):

- `vitest` < 4.1.11 — GHSA-82fw-gwwq-j7x9: path traversal / arbitrary file
  read through a mocked redirect.
- `@vitest/mocker` < 4.1.12 — GHSA-qxg6-89mg-rqv8: code injection through
  unauthenticated manual mock registration.
- `js-yaml` 3.x / 4.x — GHSA-52cp-r559-cp3m, GHSA-5p4m-2wfm-xmqj,
  GHSA-2883-xcg3-v3hh: denial of service, reached through
  `@changesets/cli > @changesets/parse` and `> read-yaml-file`.

`pnpm audit --prod` is clean — the package ships with **zero** runtime
dependencies, so none of this reaches a consumer. It is a developer-machine
and CI risk only.

**The broken script, reproduced**:

```
$ pnpm test:unit:coverage
 MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'
 ELIFECYCLE  Command failed with exit code 1.
```

**Repo conventions to match**: `package.json` keeps devDependencies sorted
alphabetically; the dependency ranges use `^`. The lockfile is committed and
CI installs with `--frozen-lockfile`, so a lockfile change must be committed
together with the `package.json` change.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `pnpm install` | exit 0 |
| Unit tests | `pnpm test:unit` | all pass |
| Coverage | `pnpm test:unit:coverage` | runs, prints a coverage table |
| Typecheck | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Audit | `pnpm audit` | no known vulnerabilities |

## Scope

**In scope** (the only files you should modify):
- `package.json` (devDependencies only)
- `pnpm-lock.yaml`

**Out of scope** (do NOT touch, even though they look related):
- `package.json` `dependencies` — the package has none, and it must stay
  that way. Do not move anything into `dependencies`.
- `vitest.config.ts` — the coverage configuration is correct.
- `src/**` — do not change code to make the new versions pass. If a new
  vitest version breaks a test, report it.

## Git workflow

- Branch: `advisor/011-deps-and-coverage`
- Commit style: conventional commits — e.g. `chore: update the lockfile to
  the fixed dependencies`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the coverage provider

In `package.json`, add `@vitest/coverage-v8` to `devDependencies`, in
alphabetical order (it comes before `@vitest/...`? no — it sorts after
`@types/node` and before `typescript`):

```json
  "devDependencies": {
    "@biomejs/biome": "^2.4.13",
    "@changesets/changelog-github": "^0.6.0",
    "@changesets/cli": "^2.31.0",
    "@playwright/test": "^1.59.1",
    "@types/node": "^25.6.0",
    "@vitest/coverage-v8": "^4.1.12",
    "typescript": "^6.0.3",
    "vitest": "^4.1.5"
  }
```

Use the version that matches the `vitest` you end up with — `@vitest/coverage-v8`
and `vitest` must be the same minor, or Vitest warns about a version
mismatch.

**Verify**: `pnpm install` → exit 0.

### Step 2: Refresh the lockfile to the fixed versions

**Verify**: `pnpm update vitest @changesets/cli` → exit 0.

This updates `pnpm-lock.yaml` only. The `package.json` ranges do not change
(`^4.1.5` already allows `4.1.12+`), unless the update pulls a major, which
it must not: if it does, stop and report.

**Verify**: `pnpm audit` → no known vulnerabilities.

**Verify**: `pnpm list vitest @vitest/mocker js-yaml --depth 3` → the
resolved versions are at or above the fixed ones (vitest ≥ 4.1.12,
@vitest/mocker ≥ 4.1.12, js-yaml ≥ 4.1.1).

### Step 3: Make the coverage script work

**Verify**: `pnpm test:unit:coverage` → exit 0, with a coverage table for
the `src/**` files.

If it reports that the coverage provider version does not match the vitest
version, align the two in `package.json` and run `pnpm install` again.

### Step 4: Run everything

**Verify**: `pnpm typecheck && pnpm test:unit && pnpm lint && pnpm format:check`
→ all exit 0
**Verify**: `pnpm install --frozen-lockfile` → exit 0 (this is what CI does;
it fails when the lockfile does not match `package.json`)

## Test plan

No new test: this plan changes dependencies, not behaviour. The acceptance
check is that the existing suite still passes with the new versions.

Worth adding (one test): `src/utils/__tests__/constants.test.ts` already
asserts things about the package's own configuration. A case that reads
`package.json` and asserts the `test:unit:coverage` script exists and that
`@vitest/coverage-v8` is a devDependency would keep the script from rotting
again.

**Verify**: `pnpm test:unit` → all pass, 1 new test.

## Done criteria

- [x] `@vitest/coverage-v8` is in `devDependencies`
- [x] `pnpm test:unit:coverage` exits 0 and prints a coverage table
- [x] `pnpm audit` reports no known vulnerabilities
- [x] `pnpm install --frozen-lockfile` exits 0
- [x] `pnpm-lock.yaml` is committed together with the `package.json` change
- [x] `package.json` still has no `dependencies` entry
- [x] `pnpm test:unit` exits 0; 1 new test
- [x] `pnpm typecheck` exits 0
- [x] `pnpm lint` and `pnpm format:check` exit 0
- [x] No files outside the in-scope list are modified (`git status`)
- [x] `plans/README.md` status row for 011 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `pnpm update` pulls a major version of vitest or of the changesets
  packages. Report the version and the changelog summary; do not accept a
  major bump in this plan.
- The new vitest version breaks an existing test. Report the failing test
  and the error — a vitest major/minor behaviour change is its own task.
- `pnpm audit` reports a vulnerability in a package that has no fixed
  release. Report the package, the advisory and the version; do not add an
  `overrides` block to silence it without asking.

## Maintenance notes

- The package has **zero** runtime dependencies. That is deliberate: the CLI
  only imports `node:*` builtins. Keep it that way — a dependency added to
  `dependencies` reaches every consumer.
- `pnpm audit` in a checkout that sits inside another pnpm workspace audits
  the outer workspace instead. If the output names packages this repo does
  not depend on, run the audit in a clean copy of this repository.
- The lockfile is committed and CI installs with `--frozen-lockfile`, so a
  `package.json` change without a matching lockfile change breaks CI.

## Progress

- **2026-11-10 11:31 CET — Phase start (Batch mode).** Drift check showed
  `package.json` changed since the plan was written (plans 002 and 006 added
  a script and changed the `files` array); the plan's quoted excerpts still
  match. Branch `advisor/011-deps-and-coverage` created from `main`.
- **2026-11-10 11:33 CET — Step 1 done.** `@vitest/coverage-v8` added to
  devDependencies. The install needed a clean copy of the repo: this
  machine has a `/home/chris/pnpm-workspace.yaml`, so pnpm inside this
  checkout resolves the outer workspace and installs into the wrong tree.
- **2026-11-10 11:35 CET — Step 2 done.** The lockfile carries vitest
  4.1.12, @vitest/mocker 4.1.12, @vitest/coverage-v8 4.1.12, vite 8.3.7,
  js-yaml 3.15.2 and 4.3.2, source-map-js 1.2.2. `pnpm audit` in a clean
  copy → "No known vulnerabilities found".
- **2026-11-10 11:36 CET — Step 3 done.** `pnpm test:unit:coverage` runs and
  prints the coverage table (93.03% statements).
- **2026-11-10 11:37 CET — Step 4 done.** `pnpm typecheck` 0,
  `pnpm typecheck:test` 0, `pnpm test:unit` → 12 files, 129 tests pass,
  `pnpm lint` / `pnpm format:check` / `pnpm check` 0,
  `pnpm install --frozen-lockfile` 0, `playwright test --list` → 18 tests in
  12 files.

## Surprises & Discoveries

- **The advisory database has moved on since the plan was written.** The
  plan expected the lockfile refresh alone to clear the audit; today the
  fixed versions are vitest ≥ 4.1.12, vite ≥ 8.1.6, js-yaml ≥ 3.15.2 /
  ≥ 4.3.2 and source-map-js ≥ 1.2.2.
- **A full `pnpm update` is not safe here.** It pulls `@biomejs/biome`
  2.6.6, whose new Markdown rules make `pnpm check` fail on this repo's
  files — plan 010's gate would break. The refresh was therefore kept
  targeted: only vitest, the coverage provider and the vulnerable
  transitive copies move; biome, playwright and the types stay put.
- **`vite` is an auto-installed peer of vitest**, so `pnpm update vite` does
  nothing. It is now an explicit devDependency, which pins the peer to a
  fixed release.
- **`pnpm audit` inside this checkout audits the outer workspace**
  (`/home/chris`, `@openchamber/web`), not this repo — the plan's
  maintenance note says to audit a clean copy. The repo's own audit is clean.

## Decision Log

- **Batch mode.** LOW risk, a dependency-layer change with mechanical checks.
- **`pnpm.overrides` was used for the two js-yaml copies and
  source-map-js.** Each override stays inside the major version its
  consumer expects (`read-yaml-file` → js-yaml 3.15.2,
  `@changesets/parse` → js-yaml 4.3.2), so no consumer's API changes. The
  plan's STOP condition only forbids an override for a vulnerability without
  a fixed release; all three have one.
- **`vite` was added to devDependencies** so the peer resolves to a fixed
  version — the alternative (an override for a peer) does not work in pnpm.
- **`vitest`'s range was raised to `^4.1.12`** so it cannot resolve to a
  version older than the coverage provider's peer requirement.
- **The plan file stays in `plans/`** — later plans reference these files by
  path, and the repo has no archive convention.

## Outcomes & Retrospective

- **Result: completed.** The lockfile carries the fixed dependencies and
  `pnpm test:unit:coverage` runs.
- **Verification summary:** `pnpm audit` clean in a clean copy;
  `pnpm test:unit:coverage` prints a table (93.03% statements);
  `pnpm test:unit` 12 files / 129 tests; typecheck, typecheck:test, lint,
  format:check, check all 0; `pnpm install --frozen-lockfile` 0; e2e
  collection 18 tests in 12 files.
- **Approved deviations:** the `pnpm.overrides` block, the `vite`
  devDependency, and the `vitest` range floor.
- **Follow-ups:** the `pnpm.overrides` entries should be re-checked when
  the packages are next upgraded — they can be dropped once the parents
  require the fixed versions.
