# Generator Gate

Review rules applied to Generator output **before** tests are merged.

## Inputs

| Input | Source | Required |
|-------|--------|----------|
| Approved plan | `specs/<ISSUE>-<slug>.md` | Yes |
| Seed spec | `tests/e2e/seed.spec.ts` | Yes |
| Existing page objects | `pages/` | If any |
| Existing fixtures | `fixtures/pages.ts` | If any |

## Assertion rules

1. **Minimum assertions** - Every `test()` block must contain at least one `expect()` call that validates a **business-visible** outcome (not just "element exists").
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

## Code structure rules

- Page Objects go in `pages/<Name>Page.ts`.
- Tests go in `tests/<feature>.spec.ts`.
- Fixtures are updated in `fixtures/pages.ts`.
- Imports use the fixtures pattern (`import { test, expect } from '../fixtures/pages'`) when available.

## PR process

1. Generator creates files in a feature branch.
2. Open PR with:
   - Link to the approved plan (`specs/<ISSUE>-<slug>.md`).
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
4. Merge after approval; CI runs the full suite.

## Decision

| Outcome | Action |
|---------|--------|
| Approved | Merge PR, proceed to CI / Healer (Phase 5) |
| Rejected - weak assertions | Generator re-runs with stricter oracle rules |
| Rejected - missing locators | Dev adds `data-testid` attributes; Generator retries |
| Rejected - duplicates | Merge or delete overlapping scenarios |
