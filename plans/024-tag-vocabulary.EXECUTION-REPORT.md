# Execution Report: One tag vocabulary, in every document that lists tags

> Date: 2026-11-10
>
> Plan: `plans/024-tag-vocabulary.md`

## Summary

- **Overall result: Completed**
- The README, the quick reference, the e2e skill and the gate carry the same
  eight tags as the Generator template, and each names `@blocked` and
  `@flaky` as triage tags the Generator never emits.
- The grep examples that used `@auth` and `@login` — tags that were in no
  vocabulary — now use `@smoke` and `@critical`.

## Phase Results

- Step 1: Write the canonical table once — ✅
  - The table in `templates/agents/generator/AGENT.md` is the source; the
    other four carry it word for word.
- Step 2: Replace the consumer-facing tables — ✅
  - Implemented: README, `docs/QUICK-REFERENCE.md` and
    `.agents/skills/e2e-testing/SKILL.md` carry the eight-tag table and the
    triage sentence.
  - Verification: `grep -c "@validation" README.md docs/QUICK-REFERENCE.md .agents/skills/e2e-testing/SKILL.md`
    → one hit in each file.
- Step 3: Name the triage tags in the gate documents — ✅
  - Implemented: `specs/GENERATOR-GATE.md` carries the triage sentence and
    the line that says where the vocabulary lives; `specs/CI-HEALER-POLICY.md`
    says the two tags are added by triage and are not part of the vocabulary.
  - Verification: `grep -n "@blocked" specs/GENERATOR-GATE.md specs/CI-HEALER-POLICY.md`
    → one hit in each file.
- Step 4: Say where the vocabulary lives, once — ✅
  - Implemented: `specs/GENERATOR-GATE.md` points at the Generator template,
    which has to work for a user who never sees the gate.
- Step 5: Run the checks — ✅
  - Verification: `pnpm check`, `pnpm typecheck`, `pnpm test:unit` → all
    exit 0.

## Verification Matrix

- Grep checks: the five files carry the same eight tags; the triage sentence
  adds `@blocked` and `@flaky` to the last three
- Type check: pass (`pnpm typecheck`, `pnpm typecheck:test`)
- Unit tests: pass (`pnpm test:unit`)
- Biome check: pass (`pnpm check`)

## Deviations

- The README had no tag table when this plan was written (it was rewritten
  after the plan), so the table was added to the README's configuration
  section instead of replacing one.

## Changed Files

- `README.md` — the tag table, the triage sentence, the grep example.
- `docs/QUICK-REFERENCE.md` — the tag table, the triage sentence, the grep example.
- `.agents/skills/e2e-testing/SKILL.md` — the tag table, the triage sentence, the grep example.
- `specs/GENERATOR-GATE.md` — the triage sentence, the vocabulary line.
- `specs/CI-HEALER-POLICY.md` — the triage tags.
