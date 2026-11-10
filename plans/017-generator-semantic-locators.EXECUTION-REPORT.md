# Execution Report: The Generator template uses only the locators its own gate allows

> Date: 2026-11-10
>
> Plan: `plans/017-generator-semantic-locators.md`

## Summary

- **Overall result: Completed**
- Every sample in the twelve mandatory patterns now reaches for an element
  with `getByRole`, `getByLabel`, `getByTestId` or `getByText`. No CSS
  selector and no XPath is left in the template.
- The rule that the samples broke now says it in one sentence: a
  `page.locator()` call that carries a CSS selector is a CSS selector.

## Phase Results

- Step 1: Rewrite every CSS sample with a semantic locator — ✅
  - Implemented: patterns A–L were rewritten. The empty state asserts the
    message from the plan, the validation tests assert the exact error
    message, the destructive test counts the items by test id, the
    autocomplete test asserts the value the field carries, the toast test
    waits for the toast to go away, and the keyboard test sends the form
    with the keyboard alone.
  - Verification: `grep -n "page.locator(\|waitForTimeout\|xpath" templates/agents/generator/AGENT.md`
    → no output.
- Step 2: Say it in the rule the samples broke — ✅
  - Implemented: `specs/GENERATOR-GATE.md` rule 3 now rejects a
    `page.locator()` call that carries a CSS selector.
  - Verification: `grep -n "page.locator()" specs/GENERATOR-GATE.md` → one hit.

## Verification Matrix

- Grep checks: clean (`page.locator(`, `waitForTimeout`, `xpath`)
- Type check: pass (`pnpm typecheck`, `pnpm typecheck:test`)
- Unit tests: pass (`pnpm test:unit`)
- Biome check: pass (`pnpm check`)
- Build: pass (`pnpm build`)
- Manual QA: the twelve samples are read against the dummy app by hand —
  a real agent run needs live agent tooling

## Deviations

- The patterns were rewritten together with plan 026: a sample that only
  asserted "the element exists" would have broken the gate's assertion
  rule, so the two plans were done in one change.

## Changed Files

- `templates/agents/generator/AGENT.md` — the twelve samples, the locator rule.
- `specs/GENERATOR-GATE.md` — rule 3.
