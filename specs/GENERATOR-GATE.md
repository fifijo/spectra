# Generator Gate

Review rules applied to Generator output **before** tests are merged.

## Inputs

| Input | Source | Required |
|-------|--------|----------|
| Approved plan | `.spectra/output/plans/test-plan.md` | Yes |
| Seed spec | `tests/seed.spec.ts` (from `spectra --init`) | Yes |
| Existing page objects | `pages/` | If any |
| Existing fixtures | `fixtures/pages.ts` | If any |

The seed spec is created by `spectra --init` and checks that the target URL
answers and that the page has a title.

## Assertion rules

1. **Minimum assertions** - Every `test()` block must contain at least one `expect()` call that validates a **business-visible** outcome (not just "element exists"). The run checks the first half of this: a spec file the Generator wrote has to contain an assertion, and the run fails when it does not.
2. **No empty tests** - A test that only navigates without asserting is rejected.
3. **Semantic locators** - Only `getByRole`, `getByLabel`, `getByTestId`, `getByText` are allowed. CSS selectors and XPath are rejected.
4. **No hard-coded waits** - `page.waitForTimeout()` is not allowed; use Playwright auto-waiting or explicit `waitFor` conditions.
5. **Data isolation** - Tests must not depend on state left by other tests. Each test sets up its own data or uses the seed.
6. **Validation tests required** - For each form, at least one test must verify validation errors appear on invalid input.
7. **Empty state tests required** - For each page with list/grid/filter, at least one test must verify empty state behavior.

## Tagging rules

| Tag | When to apply |
|-----|---------------|
| `@smoke` | Core happy-path scenarios that should run on every deploy |
| `@critical` | Business-critical flows (payments, auth, data integrity) |
| `@e2e` | Full end-to-end multi-step journeys |
| `@slow` | Tests expected to take > 10 seconds |
| `@validation` | Tests that verify form validation errors |
| `@empty` | Tests that verify empty state behavior |
| `@a11y` | Tests that verify keyboard navigation and accessibility |
| `@interaction` | Tests that verify toggle/checkbox/tab interactions |

Every generated test must have at least one tag.

Two more tags exist for triage, added by the Healer when it cannot make a test
pass: `@blocked` (the application is broken) and `@flaky` (the test is
timing-dependent). The Generator never emits them.

This table is the vocabulary. `templates/agents/generator/AGENT.md` carries the
same table for the Generator, which has to work for a user who never sees this
file.

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

## Code structure rules

- Page Objects go in `pages/<Name>Page.ts`.
- Tests go in `tests/<feature>.spec.ts`.
- Fixtures are updated in `fixtures/pages.ts`.
- Imports use the fixtures pattern (`import { test, expect } from '../fixtures/pages.js'`) when available.
- The files have to pass the project's own formatter and linter, like the rest
  of the project does.

## PR process

1. Generator creates files in a feature branch.
2. Open PR with:
   - Link to the approved plan (`.spectra/output/plans/test-plan.md`).
   - List of generated files.
   - Screenshot or log showing Planner's live-UI verification (if available).
3. Reviewer checks:
    - [ ] Assertions meet minimum rules above.
    - [ ] Tags are applied correctly.
    - [ ] Data isolation is maintained.
    - [ ] No duplicate scenarios with existing tests.
    - [ ] Locators follow the priority list.
    - [ ] Fixtures file is updated if new page objects were added.
    - [ ] At least one validation test per form exists.
    - [ ] At least one empty state test per page with list/grid/filter exists.
    - [ ] Date/time picker tests exist when component is present.
    - [ ] Autocomplete tests exist when component is present.
    - [ ] Keyboard navigation tests exist for forms.
    - [ ] Toast/notification tests exist when component is present.
    - [ ] Loading state tests exist when an async operation exists.
    - [ ] Destructive action tests cover confirm and cancel when delete actions exist.
    - [ ] File upload tests exist when an upload control is present.
    - [ ] Infinite scroll tests exist when the list loads more on scroll.
    - [ ] Password strength tests exist when a strength meter is present.
4. Merge after approval; CI runs the full suite.

## Decision

| Outcome | Action |
|---------|--------|
| Approved | Merge PR, proceed to CI / Healer (Phase 5) |
| Rejected - weak assertions | Generator re-runs with stricter oracle rules |
| Rejected - missing locators | Dev adds `data-testid` attributes; Generator retries |
| Rejected - duplicates | Merge or delete overlapping scenarios |
