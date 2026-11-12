# Plan 028: The shipped CI policy and Generator Gate say what the code does

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. If a
> STOP condition occurs, stop and report instead of improvising. This plan
> changes two Markdown files and one repository index.
>
> **Planned at**: commit `98a6d24`, 2026-11-12. Drift check (run first):
> `git diff --stat 98a6d24..HEAD -- specs/CI-HEALER-POLICY.md specs/GENERATOR-GATE.md`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live text before proceeding.

## Why this matters

`plans/README.md:40-42` marks plans 024, 025 and 026 DONE. Their gate and
policy edits are in **no commit**: `git log --all -S "unbounded" --
specs/CI-HEALER-POLICY.md` returns nothing, and `-S "Loading state" --
specs/GENERATOR-GATE.md` returns nothing. The execution reports (dated
2026-11-10) describe changes that never entered `main`.

These two files ship inside the npm package (`package.json` `files` contains
`specs`) and `spectra --init` copies them into the user's `specs/` folder
(`src/agents/init.ts:72-77`). A user's team reads them as the rules for their
own CI and for reviewing Generator output. Both currently contradict what the
repository itself does:

- the policy promises a 5-cycle cap and a 60-second per-attempt timeout that
  `templates/agents/healer/AGENT.md:125` does not implement, and says the JSON
  results are uploaded on every run for 30 days while
  `.github/workflows/test.yml:51-67` uploads them on failure for 7 days;
- the gate's reviewer checklist names 8 of the 13 patterns its own Generator
  template makes mandatory, and it never says where the tag vocabulary lives.

The index is not updated by this plan's author; the last step tells you how to
record the correction.

## Current state

`specs/CI-HEALER-POLICY.md:9-43` (verbatim):

```markdown
```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { outputFolder: '.spectra/output/reports' }],
    ['json', { outputFile: '.spectra/output/reports/results.json' }],
    ['list'],
  ],
  use: {
    trace: 'on-first-retry',        // capture trace on first retry
    screenshot: 'only-on-failure',   // screenshot on failure
    video: 'retain-on-failure',      // optional: video on failure
  },
});
```

### Artifact upload

CI must upload the following artifacts on every run (pass or fail):

| Artifact | Path | Retention |
|----------|------|-----------|
| HTML report | `.spectra/output/reports/` | 30 days |
| JSON results | `.spectra/output/reports/results.json` | 30 days |
| Traces | `.spectra/output/test-results/` | 7 days |
| Screenshots | `.spectra/output/test-results/` | 7 days |

## Healer retry limits

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Max attempts per test | 3 | Prevents infinite loops |
| Max total Healer cycles | 5 | Bounds wall-clock time |
| Timeout per attempt | 60 seconds | Matches Playwright default |
```

What the code does:

- `.github/workflows/test.yml:51-67` — HTML report on every run, 30 days;
  `test-results/` and `reports/results.json` on failure only, 7 days.
- `templates/agents/healer/AGENT.md:116-125` — `MAX_ATTEMPTS = 3` per test,
  no total-cycle cap, no per-attempt timeout.
- `templates/config/playwright.config.ts:30-61` and the repo's
  `playwright.config.ts:50-94` — no `video` setting; Playwright's default test
  timeout is 30 seconds.

`specs/GENERATOR-GATE.md:29-40` — the eight-tag table, then
`Every generated test must have at least one tag.` with no mention of the two
triage tags and no pointer to the vocabulary. `:56-68` — the reviewer
checklist. `templates/agents/generator/AGENT.md:119-289` requires twelve
patterns, A–L: empty state, form validation, toggle/interaction,
loading/async, confirmation/destructive, date/time picker, file upload,
autocomplete, infinite scroll, toast, keyboard navigation, password strength.

**Repo conventions**: Markdown with ATX headings and tables that have a header
row and `|---|---|`. 100-column wrap is not enforced on Markdown. Comments and
prose explain why, not what.

**Vocabulary**: from `CONTEXT.md` — the *Healer* is one Agent of the Spectrum;
the *Generator Gate* is the human review checklist in `specs/`; *triage tags*
are `@blocked` and `@flaky`, added by the Healer and never emitted by the
Generator.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Lint, format, assists | `pnpm check` | exit 0, 62 files |
| Typecheck | `pnpm typecheck` | exit 0 |
| Unit tests | `pnpm test:unit` | 14 files, 180 tests pass |

## Scope

**In scope** (the only files you may modify):
- `specs/CI-HEALER-POLICY.md`
- `specs/GENERATOR-GATE.md`
- `plans/README.md` (index note only, Step 6)

**Out of scope** (do NOT touch, even though they look related):
- `.github/workflows/**` — the policy must describe the workflow, not change it.
- `templates/agents/healer/AGENT.md` — the attempt budget is the Healer's.
- `templates/config/playwright.config.ts`, `playwright.config.ts` — `video` is
  a config choice, not a documentation fix.
- `templates/agents/generator/AGENT.md` — the twelve patterns are already
  there; the gate is what is missing.

## Git workflow

- Branch: `advisor/028-policy-and-gate-truth`
- Commit style: conventional commits, e.g.
  `docs: make the CI policy and the Generator gate match the code`
- Do not push or open a PR unless the operator asked for it.

## Steps

### Step 1: Correct the policy's config snippet and artifact table

In `specs/CI-HEALER-POLICY.md`, delete the `video: 'retain-on-failure',` line
from the snippet (`:21`). Then replace `:26-35` (the `### Artifact upload`
heading through the table) with:

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

The JSON results are what the Healer reads, so a failing run must keep them.
Upload them on every run if your team wants the results of green runs too.

> Add `video: 'retain-on-failure'` to `use` if your CI should keep videos; it
> is not on by default.
```

**Verify**:
`grep -n "on failure" specs/CI-HEALER-POLICY.md` → at least two hits;
`grep -c "video: 'retain-on-failure'," specs/CI-HEALER-POLICY.md` → `0`.

### Step 2: Correct the retry limits

Replace the table at `specs/CI-HEALER-POLICY.md:39-43` (heading row and the
three parameter rows) with:

```markdown
| Limit | Value | Where it comes from |
|-------|-------|---------------------|
| Max attempts per test | 3 | `templates/agents/healer/AGENT.md` (`MAX_ATTEMPTS`) |
| Total Healer cycles | unbounded | The Healer stops when every test passes or has used its attempts |
| Per-attempt timeout | the Playwright test timeout (30 seconds by default) | `playwright.config.ts` |
```

**Verify**: `grep -n "Max total Healer cycles" specs/CI-HEALER-POLICY.md` →
no output; `grep -n "unbounded" specs/CI-HEALER-POLICY.md` → one hit.

### Step 3: Name the triage tags and the vocabulary in the gate

In `specs/GENERATOR-GATE.md`, after `:40`
(`Every generated test must have at least one tag.`), insert:

```markdown
Two more tags exist for triage, added by the Healer when it cannot make a test
pass: `@blocked` (the application is broken) and `@flaky` (the test is
timing-dependent). The Generator never emits them.

This table is the vocabulary. `templates/agents/generator/AGENT.md` carries the
same table for the Generator, which has to work for a user who never sees this
file.
```

**Verify**: `grep -c "@blocked" specs/GENERATOR-GATE.md` → `1`;
`grep -c "templates/agents/generator/AGENT.md" specs/GENERATOR-GATE.md` → `1`.

### Step 4: Give the gate the twelve patterns its template requires

In `specs/GENERATOR-GATE.md`, insert a new section between the end of the
"Tagging rules" section and `## Code structure rules`:

```markdown
## Required patterns

The Generator template (`templates/agents/generator/AGENT.md`, "Step 6:
Required Test Patterns") defines twelve patterns. A review rejects output that
skips a required one.

| Pattern | Component it needs | Tag | Required when |
|---------|--------------------|-----|---------------|
| A. Empty state | list, grid or filter | `@empty` | every page with a list, grid or filter |
| B. Form validation | a form | `@validation` | every form |
| C. Toggle/interaction | checkbox, tab, accordion | `@interaction` | toggles exist |
| D. Loading/async state | an async submit | `@e2e` | async operations exist |
| E. Confirmation/destructive | delete or remove action | `@critical` | delete actions exist |
| F. Date/time picker | date or time input | `@e2e` | component exists |
| G. File upload | upload control | `@e2e` | component exists |
| H. Autocomplete | combobox with suggestions | `@e2e` | component exists |
| I. Infinite scroll | load-more or auto-load list | `@e2e` | component exists |
| J. Toast notification | toast or alert | `@e2e` | component exists |
| K. Keyboard navigation | forms and dialogs | `@a11y` | recommended on every page |
| L. Password strength | password input with a meter | `@e2e` | component exists |
```

Then add five items to the reviewer checklist (`:56-68`), keeping the existing
order and indentation, after the `Toast/notification tests exist ...` line:

```markdown
    - [ ] Loading state tests exist when an async operation exists.
    - [ ] Destructive action tests cover confirm and cancel when delete actions exist.
    - [ ] File upload tests exist when an upload control is present.
    - [ ] Infinite scroll tests exist when the list loads more on scroll.
    - [ ] Password strength tests exist when a strength meter is present.
```

**Verify**:
`grep -nc -E "Loading state|Destructive action|File upload|Infinite scroll|Password strength" specs/GENERATOR-GATE.md`
→ `5` (adjust to whatever your grep prints, but all five names must appear in
the checklist as well as the table).

Cross-check the table against the template, one pattern at a time:

```bash
grep -n "^#### [A-L]\." templates/agents/generator/AGENT.md
grep -n "| [A-L]\." specs/GENERATOR-GATE.md
```

Every letter A–L must appear in both.

### Step 5: Run the checks

**Verify**: `pnpm check && pnpm typecheck && pnpm test:unit` → all exit 0;
14 test files and 180 tests pass.

### Step 6: Record the correction in the index

In `plans/README.md`, add one paragraph directly under the status table
(after the `Status values:` line):

```markdown
Plans 024, 025 and 026 were marked DONE on 2026-11-10, but `git log --all -S`
shows their gate and policy edits never entered `main`. Plan 028 re-applies
the missing changes; the acceptance greps in 024/025/026 are the check.
```

Leave the three DONE rows alone — they describe the plans' intent, and the
paragraph says what happened. Do not renumber anything.

**Verify**: `grep -n "never entered" plans/README.md` → one hit.

## Test plan

No unit test: this plan changes Markdown. The acceptance checks are the greps
above; they are exactly the checks plans 024, 025 and 026 specified, which is
what makes this plan's result verifiable.

## Done criteria

- Both `pnpm check` and `pnpm test:unit` pass.
- Every Step 1–6 verify command prints what it says it should.
- The diff touches only the three in-scope files.

## STOP conditions

- If `specs/CI-HEALER-POLICY.md` or `specs/GENERATOR-GATE.md` no longer match
  the "Current state" excerpts, stop and report the drift.
- If `.github/workflows/test.yml` uploads the JSON results on every run (i.e.
  someone fixed the workflow instead), do not rewrite the policy to "on
  failure": report which side changed and stop.
- If a reviewer says the policy should drive the workflow rather than describe
  it, stop — that is a different decision.

## Maintenance note

`specs/*.md` is shipped and copied into every scaffolded project. Any future
change to `.github/workflows/test.yml` or to the Healer's attempt budget must
be mirrored here, or this file drifts again. Watch for it in review: the
policy's numbers must be traceable to a file in this repository.
