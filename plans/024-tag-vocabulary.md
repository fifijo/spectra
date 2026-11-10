# Plan 024: One tag vocabulary, in every document that lists tags

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 660399d..HEAD -- README.md docs/QUICK-REFERENCE.md .agents/skills/e2e-testing/SKILL.md templates/agents/generator/AGENT.md specs/GENERATOR-GATE.md specs/CI-HEALER-POLICY.md`
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

Four documents list "the available tags", and they do not agree. The
Generator template and `specs/GENERATOR-GATE.md` list eight: `@smoke`,
`@critical`, `@e2e`, `@slow`, `@validation`, `@empty`, `@a11y`,
`@interaction`. The README, `docs/QUICK-REFERENCE.md` and
`.agents/skills/e2e-testing/SKILL.md` list five — and four of theirs
(`@validation`, `@empty`, `@a11y`, `@interaction`) are missing while
`@flaky` is advertised, a tag the Generator never emits.

The README teaches `--grep @smoke` as the way to filter. A user who wants
the validation tests the generator actually writes has to guess the tag
name, because no document outside the gate tells them. And a user who
writes `@flaky` from the README learns nothing: no generated test ever
carries it.

## Current state

- `templates/agents/generator/AGENT.md:329-348` — the eight tags, in the
  "## Test Tags (REQUIRED)" section:
  `@smoke`, `@critical`, `@e2e`, `@slow`, `@validation`, `@empty`, `@a11y`,
  `@interaction`.
- `specs/GENERATOR-GATE.md:26-35` — the same eight tags, in the gate's
  "## Tagging rules" section.
- `README.md:652-665` — the "### Test Tags" table: five tags, including
  `@flaky` ("Known flaky tests"), missing the other four.
- `docs/QUICK-REFERENCE.md:174-180` — the same five-tag table.
- `.agents/skills/e2e-testing/SKILL.md:67-74` — the same five-tag table.
- `specs/CI-HEALER-POLICY.md:59` and `:73-74` — the triage tags: a failing
  test is tagged `@blocked`, a flaky one `@flaky`. Neither appears in any
  tag vocabulary.
- `playwright.config.ts:37-54` — `SPECTRA_TAGS` builds a `grep` regex from a
  comma-separated list, so every tag in the vocabulary is usable as a
  `--grep` filter.

**The rule this plan applies**: the Generator's eight tags are the
vocabulary, and they live in `templates/agents/generator/AGENT.md` and
`specs/GENERATOR-GATE.md`. The two triage tags (`@blocked`, `@flaky`) are
added by the Healer during triage, not by the Generator — every document
that lists tags says so explicitly, and lists both groups.

**Repo conventions to match**: Markdown tables with a header row and
`|---|---|` separators. The three consumer-facing tables are the same table
— keep their wording identical so they can be diffed. The vocabulary is
fixed by `CONTEXT.md`: avoid "test plan"/"spec" for the *Plan*; tags are
tag names, not vocabulary terms.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Unit tests | `pnpm test:unit` | 12 files, 129 tests pass |
| Lint + format + assists | `pnpm check` | exit 0, 56 files |

## Scope

**In scope** (the only files you should modify):
- `README.md`
- `docs/QUICK-REFERENCE.md`
- `.agents/skills/e2e-testing/SKILL.md`
- `specs/GENERATOR-GATE.md`
- `specs/CI-HEALER-POLICY.md`

**Out of scope** (do NOT touch, even though they look related):
- `templates/agents/generator/AGENT.md` — it owns the vocabulary; this plan
  copies it elsewhere.
- `playwright.config.ts` — `SPECTRA_TAGS` already filters on any tag.
- `tests/**` — the repo's own specs use their own tags (`@smoke`, `@e2e`,
  `@critical`); they are examples, not the vocabulary.

## Git workflow

- Branch: `advisor/024-tag-vocabulary`
- Commit style: conventional commits — e.g. `docs: use one tag vocabulary
  everywhere`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Write the canonical table once

The table to copy, taken from
`templates/agents/generator/AGENT.md:337-348`:

```markdown
| Tag | When to apply |
|-----|---------------|
| `@smoke` | Core happy-path scenarios that run on every deploy |
| `@critical` | Business-critical flows (payments, auth, data integrity) |
| `@e2e` | Full end-to-end multi-step journeys |
| `@slow` | Tests expected to take more than 10 seconds |
| `@validation` | Tests that verify form validation errors |
| `@empty` | Tests that verify empty state behavior |
| `@a11y` | Tests that verify keyboard navigation and accessibility |
| `@interaction` | Tests that verify toggle/checkbox/tab interactions |
```

### Step 2: Replace the three consumer-facing tables

In `README.md:652-665`, `docs/QUICK-REFERENCE.md:174-180` and
`.agents/skills/e2e-testing/SKILL.md:67-74`, replace the five-tag table
with the eight-tag table from Step 1, and add this paragraph under it:

```markdown
Two more tags exist for triage, added by the Healer when it cannot make a
test pass: `@blocked` (the application is broken) and `@flaky` (the test
is timing-dependent). The Generator never emits them.
```

**Verify**: `grep -c "@validation" README.md docs/QUICK-REFERENCE.md .agents/skills/e2e-testing/SKILL.md`
→ one hit in each file; `grep -n "@flaky" README.md` → one hit (the triage
sentence).

### Step 3: Name the triage tags in the gate documents

In `specs/GENERATOR-GATE.md`, after the eight-tag table, add the same
sentence about the triage tags.

In `specs/CI-HEALER-POLICY.md:59` and `:73-74`, make the sentences say
explicitly that these two tags are added by triage, not by the Generator —
for example "tag the test `@blocked` (a tag the Generator never emits, and
one the gate's vocabulary does not include)".

**Verify**: `grep -n "@blocked" specs/GENERATOR-GATE.md specs/CI-HEALER-POLICY.md`
→ at least one hit in each file.

### Step 4: Say where the vocabulary lives, once

In `specs/GENERATOR-GATE.md`, under "## Tagging rules", add one line:

```markdown
This table is the vocabulary. `templates/agents/generator/AGENT.md` carries
the same table for the Generator, which has to work for a user who never
sees this file.
```

**Verify**: `grep -n "templates/agents/generator/AGENT.md" specs/GENERATOR-GATE.md`
→ one hit.

### Step 5: Run the checks

**Verify**: `pnpm check && pnpm typecheck && pnpm test:unit` → all exit 0;
12 files and 129 tests pass.

## Test plan

No new unit test: this plan changes five Markdown files. The acceptance
check is mechanical — the three consumer-facing tables carry the same eight
tags as the Generator template and the gate, and each names the two triage
tags as triage-only.

A cheap diff check: extract the tag names from the four places and compare
them.

```bash
for f in templates/agents/generator/AGENT.md specs/GENERATOR-GATE.md README.md docs/QUICK-REFERENCE.md .agents/skills/e2e-testing/SKILL.md; do
  printf '%s: ' "$f"; grep -o '@[a-z]*' "$f" | sort -u | tr '\n' ' '; echo
done
```

The first five files must show the same eight tags in their vocabulary
table (the triage sentence adds `@blocked` and `@flaky` to the last three).

## Done criteria

- [ ] README, QUICK-REFERENCE and the e2e skill list the same eight tags as
      the Generator template
- [ ] Each of those three documents names `@blocked` and `@flaky` as
      triage-only tags
- [ ] `specs/GENERATOR-GATE.md` lists the eight tags and names the two
      triage tags
- [ ] `specs/CI-HEALER-POLICY.md` says the two triage tags are added by
      triage, not by the Generator
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test:unit` exits 0; 129 tests pass
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 024 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `templates/agents/generator/AGENT.md` no longer carries the eight-tag
  table — it is the source of truth for this plan; re-check the drift and
  copy the live table.
- `specs/CI-HEALER-POLICY.md` no longer uses `@blocked` or `@flaky` — the
  triage tags may have been renamed; use the live names.
- A tag appears in only one document and is not covered by this plan —
  report it rather than adding it to the vocabulary by guesswork.

## Maintenance notes

- The vocabulary is duplicated on purpose (ADR 0001 records that the
  catalogue and the templates duplicate paths for the same reason): the
  Generator template has to work for a user who never sees `specs/`.
- When a tag is added, it goes into the Generator template and the gate in
  the same change — and then into the three consumer-facing tables. Five
  places, one vocabulary.
- Reviewers should check that the tables are word-for-word identical: they
  are the same table copied, and a difference is the start of the next
  drift.
