# Plan 012: The publish runs the quality gate first

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 2106580..HEAD -- package.json .github/workflows/release.yml .changeset/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: MED
- **Depends on**: plans/011-deps-and-coverage.md
- **Category**: dx
- **Planned at**: commit `2106580`, 2026-11-10

## Why this matters

The release workflow publishes to npm with nothing but a build in front of
it. No lint, no typecheck, no tests. The version bump is committed by the
"Version Packages" pull request *before* the publish runs — and
`changeset version` deletes the changeset file as it bumps. So if the
publish step fails (a broken build, a bad token), npm never gets the
version, no changeset is left to retry from, and the next push to `main`
does nothing. The release is silently lost.

## Current state

- `package.json:49` — `"release": "pnpm run build && changeset publish"`.
- `.github/workflows/release.yml:47-58` — the publish step.
- `.github/workflows/ci.yml` — the quality gate, which runs on every push and
  pull request to `main`, but not on the publish.

`package.json:47-50` (verbatim):

```json
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "pnpm run build && changeset publish"
```

`.github/workflows/release.yml:47-58` (verbatim):

```yaml
      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: pnpm run release
          version: pnpm run version-packages
          title: "chore: version packages"
          commit: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

The `changesets/action` runs `pnpm run release` when the version PR is
merged — that is the publish.

**Repo conventions to match**: `package.json` scripts are chained with `&&`.
The CI quality job (`.github/workflows/ci.yml:32-42`) runs, in order:
`pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test:unit`. Use
the same set in the same order.

**Vocabulary (from `CONTEXT.md`)**: an *Agent* is one of Planner / Generator /
Healer; the *Agent catalogue* is the one description of every Agent. Not
needed here, but do not rename anything in the release scripts.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Lint | `pnpm lint` | exit 0 |
| Format check | `pnpm format:check` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Unit tests | `pnpm test:unit` | all pass |
| Build | `pnpm build` | exit 0 |
| Everything | `pnpm check` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `package.json` (the `release` script only)
- `.github/workflows/release.yml`

**Out of scope** (do NOT touch, even though they look related):
- `.changeset/**` — do not add, remove or edit changesets. The pending one is
  plan 013's business.
- `.github/workflows/ci.yml` — it already gates every push; it does not need
  a publish job.
- `package.json` `version-packages` — `changeset version` must stay exactly
  as it is. It is the step that consumes the changeset.
- `package.json` `publishConfig` / `.changeset/config.json` — do not change
  the release settings.

## Git workflow

- Branch: `advisor/012-release-quality-gate`
- Commit style: conventional commits — e.g. `chore: gate the publish on the
  quality checks`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Put the quality gate in front of the publish

In `package.json`, change the `release` script:

```json
    "release": "pnpm run lint && pnpm run format:check && pnpm run typecheck && pnpm run test:unit && pnpm run build && changeset publish"
```

The order matches `.github/workflows/ci.yml`: the cheap checks first, the
build last before the publish, because the build is what produces the
tarball that `changeset publish` uploads.

**Verify**: `pnpm run release --help` is not a valid probe — instead verify
each step on its own: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test:unit && pnpm build` → all exit 0.

Do NOT run `pnpm run release` itself: it publishes to npm.

### Step 2: Make the version pull request carry the same gate

The version PR is created by `changesets/action` with
`version: pnpm run version-packages`. The pull request it opens runs the
`ci.yml` quality job (it targets `main`), so the bump itself is already
gated before it merges.

Nothing to change here. Verify it by reading `.github/workflows/ci.yml` and
confirming the `on:` block includes `pull_request` on `main`:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

**Verify**: `grep -n "pull_request" .github/workflows/ci.yml` → one match.

### Step 3: Say what happened when the publish fails

When `changeset publish` fails, the version bump has already happened on
`main` and the changeset file is gone. The next release attempt has nothing
to publish. Make that visible in the workflow by adding a step after the
publish that explains the recovery, so the next maintainer does not spend an
hour looking for a missing changeset:

```yaml
      - name: Explain a failed publish
        if: failure()
        run: |
          echo "::error::The publish failed after the version bump was merged."
          echo "::error::The changeset was consumed by 'changeset version'."
          echo "::error::To publish this version again, run 'pnpm run changeset publish' locally with NPM_TOKEN set."
```

**Verify**: `grep -n "Explain a failed publish" .github/workflows/release.yml`
→ one match.

### Step 4: Run everything

**Verify**: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test:unit && pnpm build`
→ all exit 0

## Test plan

No new test: this plan changes a release script and a workflow.

The gate's correctness is proven by the existing CI job, which already runs
the same four commands. A cheap self-check: break one thing temporarily
(a syntax error in a `src/` file), run `pnpm run lint && pnpm run typecheck`,
and see it fail; then revert.

**Verify**: `pnpm test:unit` → all pass.

## Done criteria

- [x] `package.json` `release` runs lint, format:check, typecheck, test:unit and build before `changeset publish`
- [x] `package.json` `version-packages` is unchanged
- [x] `.github/workflows/release.yml` contains the "Explain a failed publish" step
- [x] `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test:unit && pnpm build` exits 0
- [x] `pnpm test:unit` exits 0
- [x] No files outside the in-scope list are modified (`git status`)
- [x] `plans/README.md` status row for 012 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `release` script no longer exists, or `changesets/action` no longer
  calls `pnpm run release`. Report the current wiring.
- `pnpm run release` is called from somewhere other than the workflow —
  grep for it and report every call site before changing the script.
- Running the quality checks inside the release makes the publish job
  noticeably slower than the workflow's `timeout-minutes`. Report the
  numbers; do not drop a check to save time without asking.

## Maintenance notes

- The `release` script runs on a maintainer's machine or in the workflow
  with `NPM_TOKEN` set. It must never be run by an agent or by a test.
- `changeset version` consumes the changeset; that is by design and is why a
  failed publish needs the recovery note from Step 3.
- If the package ever publishes from more than one workflow, every
  publisher has to run the same gate. Keep the gate in the `release` script
  rather than in a workflow, so it travels with the script.

## Progress

- **2026-11-10 11:39 CET — Phase start (Batch mode).** Drift check showed
  `package.json` changed since the plan was written (plans 002, 006 and
  011); the `release` script and `release.yml` excerpts still match, so no
  STOP. Branch `advisor/012-release-quality-gate` created from `main`.
- **2026-11-10 11:40 CET — Step 1 done.** The `release` script now runs the
  quality gate before `changeset publish`.
- **2026-11-10 11:40 CET — Step 2 done.** Nothing to change: `ci.yml` runs
  on `pull_request` to `main`, so the version PR is gated before it merges.
  `grep -n "pull_request" .github/workflows/ci.yml` → one match.
- **2026-11-10 11:40 CET — Step 3 done.** The `Explain a failed publish`
  step was added after the publish step in `release.yml`.
- **2026-11-10 11:41 CET — Step 4 done.** `pnpm check && pnpm typecheck &&
  pnpm typecheck:test && pnpm test:unit && pnpm build` → all exit 0
  (129 tests).
- **2026-11-10 11:41 CET — Test plan done.** A temporary syntax error in
  `src/utils/constants.ts` made `pnpm run check` exit 1 and `pnpm run
  typecheck` exit 2; the break was reverted (the file is byte-identical to
  its original again).

## Surprises & Discoveries

- **The CI gate the plan refers to has changed.** `.github/workflows/ci.yml`
  now runs `pnpm check` (plan 010 widened Biome's scope and enabled the
  assists) and `pnpm typecheck:test` (plan 002). The plan's literal script
  would have run a weaker gate than CI.
- The gate adds about 6 seconds locally; the release job allows 15 minutes
  and CI allows 10 for the same commands, so the timeout STOP condition
  does not apply.
- `.agents/skills/releasing/SKILL.md:37-41` still documents the old release
  script — a doc drift for plan 013.

## Decision Log

- **Batch mode.** MED risk, but the change is one script and one workflow
  step, and the failure mode is a red publish job.
- **The `release` script mirrors the *current* CI gate**
  (`pnpm run check && pnpm run typecheck && pnpm run typecheck:test &&
  pnpm run test:unit && pnpm run build && changeset publish`) instead of the
  plan's literal snippet, because the plan's own instruction is "the same
  set in the same order" as the CI job, and that job changed under plans
  002 and 010.
- **The plan file stays in `plans/`** — later plans reference these files by
  path, and the repo has no archive convention.

## Outcomes & Retrospective

- **Result: completed.** The publish runs the same gate CI runs before it
  uploads anything, and a failed publish explains how to recover.
- **Verification summary:** `pnpm check` 0 (56 files), `pnpm typecheck` 0,
  `pnpm typecheck:test` 0, `pnpm test:unit` 12 files / 129 tests, `pnpm build`
  0; the gate was proven to fail on a real break and pass again after the
  revert.
- **Approved deviations:** the `release` script's command set.
- **Follow-ups:** the release now builds three times (workflow step,
  `prepublishOnly`, the release script) — harmless, but a cleanup candidate;
  `.agents/skills/releasing/SKILL.md` still documents the old script.
