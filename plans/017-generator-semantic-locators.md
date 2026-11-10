# Plan 017: The Generator template uses only the locators its own gate allows

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

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `660399d`, 2026-11-10

## Why this matters

The Generator template tells the agent exactly how to write twelve kinds of
test, and it gives code samples for each. Six of those samples reach for
elements with CSS selectors — `page.locator('[aria-invalid="true"], .error,
.field-error, …')`, `page.locator('input[type="file"]')`,
`page.locator('.toast, [role="alert"], .notification')` and more. The
template's own "Locator Priority" block says "NEVER use: CSS selectors,
XPath, or brittle locators", and the review gate it points at
(`specs/GENERATOR-GATE.md`) rejects them outright: "Only `getByRole`,
`getByLabel`, `getByTestId`, `getByText` are allowed. CSS selectors and
XPath are rejected."

So the template teaches the Generator to produce tests that fail the
review checklist the template itself names. The rework loop is guaranteed:
the generator writes the sample, the reviewer rejects it, the generator
writes it again.

## Current state

- `templates/agents/generator/AGENT.md:320-328` — the rule the samples
  break:
  ```markdown
  ## Locator Priority (IMPORTANT)
  1. `page.getByRole()` - Best for accessibility
  2. `page.getByLabel()` - Great for form fields
  3. `page.getByTestId()` - For custom test IDs
  4. `page.getByText()` - For unique text content

  NEVER use: CSS selectors, XPath, or brittle locators
  ```
- `templates/agents/generator/AGENT.md:350-354` — the "Review Rules" section
  that names `specs/GENERATOR-GATE.md` and repeats "semantic locators only".
- `specs/GENERATOR-GATE.md:14-22` — the assertion rules, rule 3 being
  "**Semantic locators** - Only `getByRole`, `getByLabel`, `getByTestId`,
  `getByText` are allowed. CSS selectors and XPath are rejected."
- The CSS samples in the mandatory patterns (line numbers are from
  `templates/agents/generator/AGENT.md`):
  - `:121` — `page.locator(emptyPatterns.map(p => \`text="${p}"\`).join(', '))`
  - `:137` — `page.locator('[aria-invalid="true"], .error, .field-error, text=/error|required|invalid/i')`
  - `:147` — `page.locator('text=/valid email|invalid email|email format|not valid/i')`
  - `:183`, `:190` — `page.locator('[data-testid*="item"]')`
  - `:201` — `page.locator('input[type="date"], [aria-label*="date" i]')`
  - `:204` — `page.locator('.calendar, [role="dialog"], [aria-label*="calendar" i]')`
  - `:206` — `page.locator('button:not([disabled])')`
  - `:219` — `page.locator('input[type="file"]')`
  - `:224` — `page.locator('text=/invalid|type.*not supported|not allowed/i')`
  - `:238` — `page.locator('[role="option"], [role="listbox"] li, .suggestions li')`
  - `:254`, `:262` — `page.locator('[data-testid*="item"], .item, li')`
  - `:275` — `page.locator('.toast, [role="alert"], .notification')`
  - `:290` — `page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')`
  - `:296` — `page.locator(':focus')`
  - `:307` — `page.locator('input[type="password"]')`
  - `:310` — `page.locator('[class*="strength"], .password-strength, [aria-label*="strength" i]')`

**Repo conventions to match**: the template is Markdown with fenced
```typescript blocks. The other agent templates use the same shape. The
domain vocabulary lives in `CONTEXT.md` — a *Page Object* is a TypeScript
class under `pages/`; do not introduce new words for locators.

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
- `specs/GENERATOR-GATE.md` (rule 3 only)

**Out of scope** (do NOT touch, even though they look related):
- `templates/agents/planner/AGENT.md`, `templates/agents/healer/AGENT.md`,
  `templates/agents/shared/context.md` — they have no locator samples.
- `templates/fixtures/pages.ts` — the fixtures file template, not the
  pattern samples.
- `tests/**`, `pages/**` — the repo's own suite is not what this plan
  changes.
- The other gate rules in `specs/GENERATOR-GATE.md` (assertion rules, tag
  rules, the reviewer checklist) — another plan owns them.

## Git workflow

- Branch: `advisor/017-generator-semantic-locators`
- Commit style: conventional commits — e.g. `docs: make the Generator
  template use only semantic locators`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Rewrite every CSS sample with a semantic locator

Go through the twelve mandatory patterns in
`templates/agents/generator/AGENT.md` (the sections "A. Empty State Test"
through "L. Password Strength Test") and replace every CSS-based
`page.locator(...)` with one of the four sanctioned APIs. The samples are
placeholders, so the replacement must keep the same intent — the element
the pattern is about — while using a role, label, test id or text.

Worked examples of the intended transformation:

| Current sample | Semantic replacement |
|---|---|
| `page.locator('[aria-invalid="true"], .error, .field-error, text=/error\|required\|invalid/i')` | `page.getByText(/error\|required\|invalid/i).or(page.getByRole('alert'))` |
| `page.locator('text=/valid email\|invalid email\|email format\|not valid/i')` | `page.getByText(/valid email\|invalid email\|email format\|not valid/i)` |
| `page.locator('[data-testid*="item"]')` | `page.getByTestId(/item/)` |
| `page.locator('input[type="date"], [aria-label*="date" i]')` | `page.getByLabel(/date/i)` (and `page.getByRole('textbox')` as a fallback) |
| `page.locator('.calendar, [role="dialog"], [aria-label*="calendar" i]')` | `page.getByRole('dialog')` |
| `page.locator('[role="option"], [role="listbox"] li, .suggestions li')` | `page.getByRole('option')` |
| `page.locator('.toast, [role="alert"], .notification')` | `page.getByRole('alert')` |
| `page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])')` | `page.getByRole('button').or(page.getByRole('link')).or(page.getByRole('textbox'))` |

Two patterns have no semantic locator and need the documented exception
instead — see Step 2:

- **File upload** (`input[type="file"]`) — a file input has no accessible
  role. Target it with the documented exception.
- **Keyboard navigation** (`:focus`) — Playwright has no "focused element"
  locator. Read the focused element with `page.evaluate` instead of a CSS
  locator, e.g.
  `const focusedTestId = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));`
  and assert on that value.

**Verify**: `grep -n "page.locator(" templates/agents/generator/AGENT.md`
→ only the two documented exceptions, each with a comment naming the rule
it follows.

### Step 2: State the two exceptions once, in the Locator Priority block

In the "Locator Priority (IMPORTANT)" block of
`templates/agents/generator/AGENT.md`, after the "NEVER use" line, add:

```markdown
Two cases have no semantic locator and are allowed explicitly:

- A file input (`<input type="file">`) has no accessible role — target it
  with `page.locator('input[type="file"]')`.
- The focused element has no locator — read it with `page.evaluate()` and
  assert on the value it returns.
```

Then change rule 3 of `specs/GENERATOR-GATE.md` so the gate says the same
thing — a reviewer must not reject what the template tells the Generator to
write:

```markdown
3. **Semantic locators** - Use `getByRole`, `getByLabel`, `getByTestId` or
   `getByText`. CSS selectors and XPath are rejected, except a file input
   (`input[type="file"]`), which has no accessible role.
```

**Verify**: `grep -n "input\[type=\"file\"\]" templates/agents/generator/AGENT.md specs/GENERATOR-GATE.md`
→ two hits (one per file).

### Step 3: Make the samples and the rule impossible to drift apart again

In `templates/agents/generator/AGENT.md`, extend the "Review Rules" section
with one line:

```markdown
The samples in the patterns above are the canonical way to write each kind
of test — a sample that breaks a rule above is a bug in this file.
```

**Verify**: `grep -n "canonical way to write" templates/agents/generator/AGENT.md`
→ one hit.

### Step 4: Run the checks

**Verify**: `pnpm check` → exit 0 (Biome does not lint Markdown, so this
only proves nothing else broke).

**Verify**: `pnpm typecheck && pnpm test:unit` → exit 0; 12 files and 129
tests pass.

**Verify**: `pnpm vitest run src/agents/__tests__/catalogue.test.ts` → all
pass (this test checks the template against the Agent catalogue — this plan
must not move any path).

## Test plan

No new unit test: this plan changes a Markdown template and one rule in a
gate document. The acceptance check is mechanical — after the plan, the
template contains no CSS locator except the two documented exceptions, and
the gate document says the same thing.

The existing `src/agents/__tests__/catalogue.test.ts` is the regression
guard: it fails if a shipped `AGENT.md` disagrees with
`src/agents/catalogue.ts`. This plan changes no path, so it must keep
passing.

## Done criteria

- [ ] `grep -n "page.locator(" templates/agents/generator/AGENT.md` matches
      only the two documented exceptions
- [ ] `specs/GENERATOR-GATE.md` rule 3 allows the file-input exception
- [ ] The "Locator Priority" block names both exceptions
- [ ] The "Review Rules" section says the samples are canonical
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test:unit` exits 0; 129 tests pass
- [ ] `pnpm vitest run src/agents/__tests__/catalogue.test.ts` passes
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 017 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `specs/GENERATOR-GATE.md` rule 3 no longer bans CSS selectors — someone
  changed the rule; re-check the drift and follow the live file.
- The template's patterns no longer exist in the shape the "Current state"
  excerpt shows (the file has twelve patterns A-L) — the samples may have
  been rewritten; re-read before editing.
- A mandatory pattern genuinely cannot be expressed with a semantic locator
  and is not one of the two documented exceptions — report the pattern
  instead of inventing a third exception silently.

## Maintenance notes

- The two exceptions are deliberate and narrow. If Playwright gains a
  first-class API for either case, remove the exception rather than leaving
  the sample as the only place it is written.
- The gate rule and the template are two copies of one policy. The
  "canonical way to write" line in "Review Rules" is what tells a future
  editor which one to change when they disagree.
- Reviewers should check that no new `page.locator('<css>')` sample creeps
  back into the template — the gate rejects it, so the Generator's output
  would fail review.
