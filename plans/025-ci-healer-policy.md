# Plan 025: The CI/Healer policy matches the workflow it describes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 660399d..HEAD -- specs/CI-HEALER-POLICY.md .github/workflows/test.yml templates/agents/healer/AGENT.md templates/config/playwright.config.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `660399d`, 2026-11-10

## Why this matters

`specs/CI-HEALER-POLICY.md` is the reference a reviewer trusts when they
ask "what does CI keep, and how long does the Healer try?". Three of its
numbers are not what the code does:

- the artifact table says the JSON results are uploaded on **every** run
  (pass or fail) for 30 days — the workflow uploads them only **on
  failure**, for 7 days, together with the traces;
- "Max total Healer cycles | 5" bounds nothing: the Healer template
  defines only `MAX_ATTEMPTS = 3` per test;
- "Timeout per attempt | 60 seconds | Matches Playwright default" — the
  Playwright default test timeout is 30 seconds, and the Healer template
  sets no timeout at all.

The policy is copied into every scaffolded project, so it is the document a
user's team reads while writing their own CI. A policy that describes a
different workflow is worse than no policy: it produces a false sense that
the right artifacts are being kept.

## Current state

- `specs/CI-HEALER-POLICY.md:26-35` — the artifact table:
  ```markdown
  ### Artifact upload

  CI must upload the following artifacts on every run (pass or fail):

  | Artifact | Path | Retention |
  |----------|------|-----------|
  | HTML report | `.spectra/output/reports/` | 30 days |
  | JSON results | `.spectra/output/reports/results.json` | 30 days |
  | Traces | `.spectra/output/test-results/` | 7 days |
  | Screenshots | `.spectra/output/test-results/` | 7 days |
  ```
- `.github/workflows/test.yml:58-74` — what the workflow does:
  ```yaml
        - name: Upload test results
          uses: actions/upload-artifact@v4
          if: ${{ !cancelled() }}
          with:
            name: playwright-report
            path: .spectra/output/reports/
            retention-days: 30

        - name: Upload test artifacts
          uses: actions/upload-artifact@v4
          if: failure()
          with:
            name: test-artifacts
            path: |
              .spectra/output/test-results/
              .spectra/output/reports/results.json
            retention-days: 7
  ```
  So: the HTML report on every run (30 days); the traces, the screenshots
  and the JSON results together, on failure only (7 days).
- `specs/CI-HEALER-POLICY.md:40-43` — the attempt budget table:
  ```markdown
  | Max attempts per test | 3 | Prevents infinite loops |
  | Max total Healer cycles | 5 | Bounds wall-clock time |
  | Timeout per attempt | 60 seconds | Matches Playwright default |
  ```
- `templates/agents/healer/AGENT.md:114-125` — the only budget the Healer
  defines: `MAX_ATTEMPTS = 3 per test`. No total-cycle cap, no per-attempt
  timeout.
- `specs/CI-HEALER-POLICY.md:21` — the policy's `playwright.config.ts`
  snippet contains `video: 'retain-on-failure'`, which neither this repo's
  `playwright.config.ts:72-77` nor the shipped template
  (`templates/config/playwright.config.ts:61-67`) sets.

**Repo conventions to match**: Markdown with ATX headings and tables with a
header row and `|---|---|`. This file is shipped to users and copied into
their projects by `src/agents/init.ts:73-77`, so it must describe a
workflow a user can copy and run.

**Vocabulary (from `CONTEXT.md`)**: the *Healing Report* is the Markdown
record of what the Healer diagnosed and changed; a *Scope* is what a run is
pointed at.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Unit tests | `pnpm test:unit` | 12 files, 129 tests pass |
| Lint + format + assists | `pnpm check` | exit 0, 56 files |

## Scope

**In scope** (the only file you should modify):
- `specs/CI-HEALER-POLICY.md`

**Out of scope** (do NOT touch, even though they look related):
- `.github/workflows/test.yml` — this plan describes the workflow; it does
  not change it. (If the policy should drive the workflow instead, that is
  a different decision — see the maintenance notes.)
- `templates/agents/healer/AGENT.md` — the Healer's attempt budget is
  another plan's business.
- `templates/config/playwright.config.ts`, `playwright.config.ts` — the
  `video` setting belongs to the config, not to this policy.

## Git workflow

- Branch: `advisor/025-ci-healer-policy`
- Commit style: conventional commits — e.g. `docs: make the CI/Healer policy
  match the workflow`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Correct the artifact table

Replace the artifact section in `specs/CI-HEALER-POLICY.md:26-35` with the
behaviour the workflow actually has:

```markdown
### Artifact upload

A CI run should upload the artifacts a failure needs. This repository's
workflow uploads:

| Artifact | Path | When | Retention |
|----------|------|------|------------|
| HTML report | `.spectra/output/reports/` | every run (pass or fail) | 30 days |
| JSON results | `.spectra/output/reports/results.json` | on failure | 7 days |
| Traces | `.spectra/output/test-results/` | on failure | 7 days |
| Screenshots | `.spectra/output/test-results/` | on failure | 7 days |

The JSON results are what the Healer reads
(`.spectra/output/reports/results.json`), so a failing run must keep them.
Upload them on every run if your team wants the results of green runs too.
```

**Verify**: `grep -n "on failure" specs/CI-HEALER-POLICY.md` → at least one
hit.

### Step 2: Correct the attempt budget

Replace the two rows that nothing implements (`Max total Healer cycles`,
`Timeout per attempt`) with the budget that does exist, and mark the other
two as the Healer's own limit:

```markdown
| Limit | Value | Where it comes from |
|-------|-------|---------------------|
| Max attempts per test | 3 | `templates/agents/healer/AGENT.md` (`MAX_ATTEMPTS`) |
| Total Healer cycles | unbounded | The Healer stops when every test passes or has used its attempts |
| Per-attempt timeout | the Playwright test timeout (30 seconds by default) | `playwright.config.ts` (`timeout`) |
```

**Verify**: `grep -n "Max total Healer cycles" specs/CI-HEALER-POLICY.md`
→ no output.

### Step 3: Remove the setting the configs do not have

Delete the `video: 'retain-on-failure'` line from the policy's
`playwright.config.ts` snippet, and add a sentence under it:

```markdown
> Add `video: 'retain-on-failure'` if your CI should keep videos; it is not
> on by default.
```

**Verify**: `grep -n "video:" specs/CI-HEALER-POLICY.md` → the sentence
only, no code line with `video:`.

### Step 4: Run the checks

**Verify**: `pnpm check && pnpm typecheck && pnpm test:unit` → all exit 0;
12 files and 129 tests pass.

## Test plan

No new unit test: this plan changes one Markdown file. The acceptance check
is mechanical — every number in the policy's tables must be traceable to
the workflow or to the Healer template.

The check to run by hand:

```bash
grep -n "retention-days\|if:" .github/workflows/test.yml
```

and compare with the artifact table in the policy: the conditions and
retentions must agree.

## Done criteria

- [ ] The artifact table matches `.github/workflows/test.yml` (conditions
      and retentions)
- [ ] The attempt budget names only limits that exist, and says where each
      comes from
- [ ] The policy's config snippet no longer sets `video:`
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test:unit` exits 0; 129 tests pass
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 025 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `.github/workflows/test.yml` no longer has the two artifact-upload steps
  quoted in the "Current state" section — re-check the drift and describe
  the live workflow instead.
- `templates/agents/healer/AGENT.md` defines a total-cycle cap or a
  per-attempt timeout that this plan does not know about — then the budget
  table should list those instead of saying "unbounded"; report the values.
- The policy is not copied into scaffolded projects any more
  (`src/agents/init.ts`) — then it is this repository's own reference only,
  and the wording may be less user-facing; report it.

## Maintenance notes

- The policy describes a workflow the user writes. When the user copies
  this repository's workflow into their project, the two should agree —
  that is why the policy now quotes the conditions and retentions rather
  than an ideal.
- If the team wants the policy to *drive* the workflow (the JSON results
  uploaded on every run), that is a change to `.github/workflows/test.yml`
  and to the template workflow — a separate decision, not a documentation
  fix.
- Reviewers should check that no number in the policy is unattributed: each
  one says where it comes from, so the next reader can check it.
