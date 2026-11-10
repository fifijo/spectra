# Plan 026: The Generator's own samples pass the gate they are reviewed against

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 660399d..HEAD -- templates/agents/generator/AGENT.md specs/GENERATOR-GATE.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/017-generator-semantic-locators.md
- **Category**: docs
- **Planned at**: commit `660399d`, 2026-11-10

## Why this matters

The Generator template defines twelve mandatory test patterns (A–L). The
review gate that judges the Generator's output checks six of them, and
three of the samples the template gives would fail the gate's own
assertion rule.

The gate's first rule: "**Minimum assertions** - Every `test()` block must
contain at least one `expect()` call that validates a **business-visible**
outcome (not just 'element exists')" and "A test that only navigates
without asserting is rejected". The template's pattern A computes an
`emptyLocator` and never asserts on it — its only assertion is
`expect(page).toHaveURL(...)`, i.e. "the page loaded". The keyboard
pattern asserts `expect(focusedEl).toBeVisible()` and the password
pattern asserts `expect(strength).toBeVisible()` — "the element exists",
which the rule explicitly rejects.

The reviewer checklist then checks for validation, empty state, date/time
picker, autocomplete, keyboard navigation and toast tests. It says nothing
about loading/async (D), destructive actions (E), file upload (G),
infinite scroll (I) and password strength (L) — five of the twelve patterns
the Generator was told to produce. A reviewer working from the checklist
cannot see them missing.

So the template teaches a pattern the gate rejects, and the gate does not
cover half the patterns the template mandates. Both sides need to move.

## Current state

- `templates/agents/generator/AGENT.md` — the twelve patterns:
  `:114` A. Empty State Test (Required), `:128` B. Form Validation Tests,
  `:152` C. Toggle/Interaction Tests, `:165` D. Loading/Async State Tests,
  `:178` E. Confirmation/Destructive Action Tests, `:196` F. Date/Time
  Picker Tests, `:214` G. File Upload Tests, `:230` H. Autocomplete Tests,
  `:248` I. Infinite Scroll Tests, `:268` J. Toast Notification Tests,
  `:284` K. Keyboard Navigation Tests, `:302` L. Password Strength Tests.
- `templates/agents/generator/AGENT.md:117-124` — pattern A:
  ```typescript
  test.describe('[Feature] empty state', { tag: ['@empty'] }, () => {
    test('shows empty state when no data', async ({ page }) => {
      await page.goto('[page-url]');
      // Look for any empty state message (use text patterns from the plan)
      const emptyPatterns = ['no items', 'no results', 'empty', 'nothing here', 'no data'];
      const emptyLocator = page.locator(emptyPatterns.map(p => `text="${p}"`).join(', '));
      // At minimum, check the page loads without crashing
      await expect(page).toHaveURL(/[page-url]/);
    });
  });
  ```
  `emptyLocator` is computed and never used.
- `templates/agents/generator/AGENT.md:286-298` (keyboard navigation) and
  `:304-317` (password strength) — the assertions are
  `expect(focusedEl).toBeVisible()` and `expect(strength).toBeVisible()`.
- `specs/GENERATOR-GATE.md:16-18` — the rules the samples break:
  ```markdown
  1. **Minimum assertions** - Every `test()` block must contain at least one
     `expect()` call that validates a **business-visible** outcome (not just
     "element exists").
  2. **No empty tests** - A test that only navigates without asserting is
     rejected.
  ```
- `specs/GENERATOR-GATE.md:53-65` — the reviewer checklist: assertions,
  tags, data isolation, no duplicates, locator priority, fixtures updated,
  validation test per form, empty-state test per page with
  list/grid/filter, date/time picker, autocomplete, keyboard navigation,
  toast/notification. Five patterns (D, E, G, I, L) are not covered.

**Repo conventions to match**: the template's patterns are Markdown
sections with a `#### X. …` heading, a fenced ```typescript block and a
short lead-in sentence. The gate's checklist uses `- [ ]` items under
"3. Reviewer checks:". The vocabulary is fixed by `CONTEXT.md`: a *Plan*
is the document the Planner writes; the *Gate* is the human review checklist
in `specs/`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Unit tests | `pnpm test:unit` | 12 files, 129 tests pass |
| Catalogue test | `pnpm vitest run src/agents/__tests__/catalogue.test.ts` | all pass |
| Lint + format + assists | `pnpm check` | exit 0, 56 files |

## Scope

**In scope** (the only files you should modify):
- `templates/agents/generator/AGENT.md`
- `specs/GENERATOR-GATE.md`

**Out of scope** (do NOT touch, even though they look related):
- `specs/CI-HEALER-POLICY.md` — the Healer's rules are another plan's
  business.
- `templates/agents/planner/AGENT.md`, `templates/agents/healer/AGENT.md`
  — not the Generator's contract.
- `tests/**`, `pages/**` — the repository's own suite is not what changes.

## Git workflow

- Branch: `advisor/026-generator-assertions-and-gate`
- Commit style: conventional commits — e.g. `docs: make the Generator's
  samples pass the gate they are reviewed against`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Give pattern A a business-visible assertion

In `templates/agents/generator/AGENT.md`, pattern A (`:117-124`) must
assert the outcome, not the URL alone. The Plan records the empty-state
message the Planner saw, so the sample should assert that message:

```typescript
test.describe('[Feature] empty state', { tag: ['@empty'] }, () => {
  test('shows empty state when no data', async ({ page }) => {
    await page.goto('[page-url]');
    // The Plan records the empty-state message this page shows
    await expect(page.getByText(/no items|no results|nothing here/i)).toBeVisible();
  });
});
```

The unused `emptyLocator` disappears with it.

**Verify**: `grep -n "emptyLocator" templates/agents/generator/AGENT.md` →
no output.

### Step 2: Make the keyboard and password patterns assert an outcome

Pattern K (`:286-298`) asserts that *some* element is visible — say what
changed instead:

```typescript
    // Focus moved to the next control in the form
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).not.toBe('BODY');
```

Pattern L (`:304-317`) asserts that the strength element exists — assert
that the strength changed:

```typescript
    // The strength indicator changes with the input
    await expect(page.getByText(/weak|medium|strong/i)).toBeVisible();
```

Keep the semantic-locator style that plan 017 established in the same
file; if plan 017 has not run yet, write these with `getByText` /
`getByRole` rather than CSS.

**Verify**: `grep -n "toBeVisible()" templates/agents/generator/AGENT.md`
→ the hits that remain are about an element that is genuinely the outcome
(a toast appearing, a validation message showing); a reviewer should be
able to say why each one is a business-visible outcome.

### Step 3: Add the five missing patterns to the reviewer checklist

In `specs/GENERATOR-GATE.md`, add these items to the "3. Reviewer checks:"
list, next to the ones that already exist:

```markdown
    - [ ] Loading/async state tests exist when the component is present.
    - [ ] Confirmation/destructive-action tests exist when the action exists.
    - [ ] File upload tests exist when an upload control is present.
    - [ ] Infinite scroll tests exist when the list scrolls.
    - [ ] Password strength tests exist when a password field has one.
```

**Verify**: `grep -c "^-    - \[ \]" specs/GENERATOR-GATE.md` → 17 (six
existing pattern rows + the five new ones + the other six checklist rows).

### Step 4: Say that the samples are the reference for the assertions

In `specs/GENERATOR-GATE.md`, under the assertion rules, add one line:

```markdown
The samples in `templates/agents/generator/AGENT.md` show what a
business-visible assertion looks like — an `expect()` on the outcome the
user would see, not on the presence of an element.
```

**Verify**: `grep -n "business-visible assertion looks like" specs/GENERATOR-GATE.md`
→ one hit.

### Step 5: Run the checks

**Verify**: `pnpm check && pnpm typecheck && pnpm test:unit` → all exit 0;
12 files and 129 tests pass.

**Verify**: `pnpm vitest run src/agents/__tests__/catalogue.test.ts` → all
pass (this plan changes no path).

## Test plan

No new unit test: this plan changes a template and a gate document. The
acceptance check is mechanical — the unused locator is gone, the three weak
samples assert outcomes, and the gate checklist covers all twelve patterns.

A useful manual check: read each of the twelve samples and ask "does this
assert something a user would see?" If one does not, the gate rejects the
Generator's own output.

## Done criteria

- [ ] Pattern A asserts the empty-state message and no longer computes an
      unused locator
- [ ] The keyboard-navigation and password-strength patterns assert an
      outcome rather than the presence of an element
- [ ] The gate's reviewer checklist covers all twelve patterns
- [ ] The gate points at the template's samples as the reference for a
      business-visible assertion
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test:unit` exits 0; 129 tests pass
- [ ] `pnpm vitest run src/agents/__tests__/catalogue.test.ts` passes
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 026 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `templates/agents/generator/AGENT.md` no longer has the twelve patterns
  A–L — the plan's checklist depends on that list; re-read the live file and
  report the actual patterns.
- The gate's assertion rules have been reworded so that "element exists"
  is acceptable — then the samples are fine as they are; report the live
  rule.
- Plan 017 has not run and the samples still use CSS locators — do not
  rewrite the locators here; implement the assertion changes only, and
  report that 017 is still pending.

## Maintenance notes

- The two documents are one contract: the template produces, the gate
  judges. When a rule changes, both change in the same commit — and the
  "Review Rules" section in the template already says the output is
  reviewed against `specs/GENERATOR-GATE.md`.
- The twelve patterns are the Generator's scope. Adding a pattern means
  adding it to the template **and** to the reviewer checklist, or the
  reviewer will not know to look for it.
- Reviewers should read the samples, not only the rules: the samples are
  what the Generator copies.
