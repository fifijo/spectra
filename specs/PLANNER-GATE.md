# Planner Gate

Review checklist applied **before** a Planner-generated plan is promoted to the Generator.

## Inputs

| Input | Source | Required |
|-------|--------|----------|
| Issue / story text | Work tracker (Linear, Jira, etc.) | Yes |
| Acceptance Criteria (AC) | Story description or linked doc | Yes |
| Seed reference | `tests/e2e/seed.spec.ts` | Yes |
| Preview / staging URL | CI deploy or local dev server | Yes |
| Feature flags | Seed or env config | If applicable |

## Pre-flight checks

1. **AC clarity** - Every acceptance criterion is measurable (expected text, state, URL, role).
2. **URL reachable** - The `baseURL` responds with HTTP 200 (or expected redirect).
3. **Seed passes** - `npx playwright test tests/e2e/seed.spec.ts` is green.
4. **Flags enabled** - Any feature flags required by the story are active in the E2E environment.
5. **Test identity available** - If the story requires a new role or user type, the identity exists in the seed.

## Plan review checklist

After the Planner produces `specs/<ISSUE>-<slug>.md`:

- [ ] **Coverage** - Every AC bullet has at least one matching test scenario.
- [ ] **Measurable outcomes** - Each scenario has an explicit expected result (not just "verify it works").
- [ ] **No PII** - Plan does not contain real user data or production credentials.
- [ ] **Matches live UI** - Steps reference elements that exist on the current preview (validated by Planner snapshot).
- [ ] **Discrepancies documented** - If the UI differs from the ticket, the plan notes the discrepancy and links to the product issue.
- [ ] **Gaps flagged** - Unreachable scenarios (e.g., missing role, disabled flag) are listed as blocked with a reason.
- [ ] **Naming convention** - File follows `specs/<ISSUE-KEY>-<slug>.md` (e.g., `specs/PROJ-123-checkout-flow.md`).

## Decision

| Outcome | Action |
|---------|--------|
| Approved | Proceed to Generator (Phase 4) |
| Rejected - AC gap | Return to PM/author to clarify AC |
| Rejected - plan quality | Return to Planner with notes |
| Blocked - env issue | Open infra ticket; do not proceed |
