# Plan 018: The Healer template obeys the CI/Healer policy it ships with

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 660399d..HEAD -- templates/agents/healer/AGENT.md specs/CI-HEALER-POLICY.md specs/PILOT.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `660399d`, 2026-11-10

## Why this matters

The Healer template tells the agent it may "fix broken locators **or test
logic**", and its repair menu includes "Text changed: Update expected text"
and "Flow changed: Update test steps". The policy that ships next to it
says the opposite: "**No assertion weakening** - The Healer must never
reduce assertion strength to make a test pass" and "**Locator fixes only** -
Automatic fixes are limited to locator updates and timing adjustments. Logic
changes require human review."

The template is the only document the Healer agent actually reads, so it
wins. A real product regression — the price slider is broken, the cart
total is wrong — is a logic bug, and the template tells the Healer to
rewrite the expectation until the test passes. That is exactly the failure
`specs/PILOT.md` exists to catch ("does **not** weaken or remove any
assertions"), and the run still reports success.

## Current state

- `templates/agents/healer/AGENT.md:1-12` — the responsibilities:
  ```markdown
  1. Analyze test failures
  2. Use Playwright MCP to inspect current UI state
  3. Fix broken locators or test logic
  4. Re-run until tests pass
  ```
- `templates/agents/healer/AGENT.md:54-60` — the repair menu:
  ```markdown
  - **Locator changed**: Update selector in Page Object
  - **Timing issue**: Add proper wait
  - **Element moved**: Update locator strategy
  - **Text changed**: Update expected text
  - **Flow changed**: Update test steps
  ```
- `templates/agents/healer/AGENT.md:114-129` — the attempt budget:
  `MAX_ATTEMPTS = 3 per test`, and the completion signal is written "When
  all tests pass **or max attempts reached**".
- `specs/CI-HEALER-POLICY.md:46-51` — the rules the template contradicts:
  ```markdown
  1. **No assertion weakening** - The Healer must never reduce assertion
     strength to make a test pass (e.g., removing an `expect` or changing
     `toEqual` to `toBeTruthy` without review).
  2. **Locator fixes only** - Automatic fixes are limited to locator
     updates and timing adjustments. Logic changes require human review.
  3. **Report every fix** - Every change is logged in
     `.spectra/output/reports/healing-report.md` with before/after diff.
  ```
- `specs/CI-HEALER-POLICY.md:53-80` — the failure triage: the categories
  `bug`, `locator`, `flake`, `env`, and the `@blocked` / `@flaky` tags.
- `specs/PILOT.md:56` and `:82` — the pilot's exit criteria: the Healer
  "does **not** weaken or remove any assertions" and "does **not** change
  the expected value in the test".

**Repo conventions to match**: the template is Markdown with fenced
```typescript blocks; the Planner and Generator templates have the same
shape. The domain vocabulary is fixed by `CONTEXT.md`: a *Healing Report* is
the Markdown record of what the Healer diagnosed and changed; a *Page
Object* is a TypeScript class under `pages/`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Unit tests | `pnpm test:unit` | 12 files, 129 tests pass |
| Catalogue test | `pnpm vitest run src/agents/__tests__/catalogue.test.ts` | all pass |
| Lint + format + assists | `pnpm check` | exit 0, 56 files |

## Scope

**In scope** (the only files you should modify):
- `templates/agents/healer/AGENT.md`

**Out of scope** (do NOT touch, even though they look related):
- `specs/CI-HEALER-POLICY.md` — the policy is the source of truth this
  plan makes the template conform to. Its artifact table and attempt-budget
  rows are another plan's business.
- `specs/PILOT.md` — it already states the expected behaviour.
- `templates/agents/generator/AGENT.md`, `templates/agents/planner/AGENT.md`
  — not the Healer's contract.
- `src/**` — no code change: the Healer is an agent, not a function.

## Git workflow

- Branch: `advisor/018-healer-policy-conformance`
- Commit style: conventional commits — e.g. `docs: make the Healer template
  follow the CI/Healer policy`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Narrow the Healer's responsibilities

In `templates/agents/healer/AGENT.md`, replace responsibility 3 and add a
fifth one:

```markdown
1. Analyze test failures
2. Use Playwright MCP to inspect current UI state
3. Fix broken locators and timing issues only
4. Re-run the failed tests
5. Report anything that is not a locator or timing problem for human review
```

**Verify**: `grep -n "test logic" templates/agents/healer/AGENT.md` → no
output.

### Step 2: Rewrite the repair menu

Replace the repair list (currently "Locator changed / Timing issue / Element
moved / Text changed / Flow changed") with one that matches the policy:

```markdown
Allowed repairs:

- **Locator changed**: update the selector in the Page Object
- **Element moved**: update the locator strategy
- **Timing issue**: add a proper wait (never a fixed timeout)

Not allowed without human review:

- changing an expected value, a message or a test step
- removing or weakening an `expect()`
- changing what the test asserts
```

If a failure needs one of the not-allowed repairs, the Healer must classify
it and stop (Step 3).

**Verify**: `grep -n "Not allowed without human review" templates/agents/healer/AGENT.md`
→ one hit.

### Step 3: Give the Healer the policy's triage categories

The template must be able to distinguish a broken feature from a broken
locator. Add a short section (after the repair menu) that mirrors
`specs/CI-HEALER-POLICY.md:53-80`:

```markdown
## Failure triage

Classify every failure before you touch it:

| Category | Meaning | What you do |
|----------|---------|-------------|
| `locator` | The page changed, the test's selector is stale | Fix the locator, then re-run |
| `flake` | The test is timing-dependent | Add a proper wait, then re-run |
| `env` | The environment is not ready (server down, missing data) | Report it; do not change the test |
| `bug` | The application behaves wrongly | Do not change the test. Report it with the `@blocked` tag and the evidence |

A `bug` is a product defect, not a test defect. Changing the expectation to
match a broken product is the one thing this Agent must never do.
```

**Verify**: `grep -n "@blocked" templates/agents/healer/AGENT.md` → at least
one hit.

### Step 4: Say what happens when the attempts run out

The template currently writes the completion signal "When all tests pass
**or max attempts reached**", which is right, but it never says what the
Healer must do with a test that stayed red. Add one line to the section
that defines `MAX_ATTEMPTS`:

```markdown
When a test still fails after its attempts, it stays failing: report it
with its category, its error and the last change you made. Never leave a
test weakened to make it pass.
```

**Verify**: `grep -n "still fails after its attempts" templates/agents/healer/AGENT.md`
→ one hit.

### Step 5: Run the checks

**Verify**: `pnpm check && pnpm typecheck && pnpm test:unit` → all exit 0;
12 files and 129 tests pass.

**Verify**: `pnpm vitest run src/agents/__tests__/catalogue.test.ts` → all
pass (this plan changes no path, so the catalogue check must stay green).

## Test plan

No new unit test: this plan changes a Markdown template. The acceptance
check is mechanical — the template must no longer contain the phrase "or
test logic", must contain the policy's rules, and must classify failures
into the policy's four categories.

The existing `src/agents/__tests__/catalogue.test.ts` is the regression
guard: it fails if the shipped `AGENT.md` disagrees with
`src/agents/catalogue.ts` about paths and completion signals. This plan
changes no path, so it must keep passing.

## Done criteria

- [ ] `grep -n "test logic" templates/agents/healer/AGENT.md` returns
      nothing
- [ ] The template contains the "Not allowed without human review" list
- [ ] The template classifies failures into `locator`, `flake`, `env` and
      `bug`, and says a `bug` is never fixed by changing the test
- [ ] The template says what happens when the attempts run out
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test:unit` exits 0; 129 tests pass
- [ ] `pnpm vitest run src/agents/__tests__/catalogue.test.ts` passes
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 018 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `specs/CI-HEALER-POLICY.md` no longer contains the "Locator fixes only"
  or "No assertion weakening" rules — someone changed the policy; re-check
  the drift and follow the live file.
- The Healer's `MAX_ATTEMPTS` value is not 3 — quote the live value in the
  new sentence instead of the number this plan assumed.
- The policy's triage categories are not the four named above — use the
  live categories.

## Maintenance notes

- This template and `specs/CI-HEALER-POLICY.md` are two copies of one
  policy, and the template is the one the agent reads. If the policy
  changes, this template must change with it.
- The `@blocked` tag is the signal that a failure is a product defect. It is
  also the tag a CI triage step can filter on, so do not rename it.
- Reviewers should look for the sentence "Changing the expectation to match
  a broken product is the one thing this Agent must never do" — it is the
  line that makes the rest of the template coherent.
