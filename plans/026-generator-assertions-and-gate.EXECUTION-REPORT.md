# Execution Report: The Generator's own samples pass the gate they are reviewed against

> Date: 2026-11-10
>
> Plan: `plans/026-generator-assertions-and-gate.md`

## Summary

- **Overall result: Completed**
- Every sample in the twelve mandatory patterns asserts something the user
  can see. The empty state test no longer computes a locator it never uses,
  and the keyboard and password samples no longer settle for "the element
  exists".
- The gate now lists the twelve patterns and says when each one is required,
  so a reviewer working from the checklist can see the five patterns it used
  to miss.

## Phase Results

- Step 1: Give every sample a business-visible assertion — ✅
  - Implemented: A asserts the empty state message, C asserts what the user
    sees change, D asserts the loading label and the result after it, F
    asserts the chosen date, G asserts the message the upload shows, H
    asserts the value the field carries, I polls the item count, J waits for
    the toast to go away, K sends the form with the keyboard, L asserts the
    strength label.
  - Verification: no sample asserts only `toBeVisible()` on an element.
- Step 2: Cover the patterns the checklist missed — ✅
  - Implemented: `specs/GENERATOR-GATE.md` carries a table of the twelve
    patterns, the component each one needs, and its tag. The reviewer
    checklist now names loading state, destructive action, file upload,
    infinite scroll and password strength.
- Step 3: Fix the sample that could not pass — ✅
  - Implemented: the loading state sample asserted `toBeDisabled()` right
    after a click, which fails on a form that does not validate. It now
    asserts the label the button carries while it waits.

## Verification Matrix

- Type check: pass (`pnpm typecheck`, `pnpm typecheck:test`)
- Unit tests: pass (`pnpm test:unit`)
- Biome check: pass (`pnpm check`)
- Build: pass (`pnpm build`)
- Manual QA: the samples are read against the dummy app by hand — a real
  agent run needs live agent tooling

## Deviations

- None.

## Changed Files

- `templates/agents/generator/AGENT.md` — the twelve samples.
- `specs/GENERATOR-GATE.md` — the pattern table, the reviewer checklist.
