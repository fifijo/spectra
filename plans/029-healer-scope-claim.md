# Plan 029: The README stops claiming the Healer is scoped

> **Executor instructions**: Follow this plan step by step and run the
> verification commands. This plan changes one paragraph of `README.md`. If the
> STOP condition occurs, stop and report.
>
> **Planned at**: commit `98a6d24`, 2026-11-12. Drift check (run first):
> `git diff --stat 98a6d24..HEAD -- README.md`

## Why this matters

`README.md:257-270` ("Feature Scoping") tells the user that `--scope` narrows
the whole Spectrum. Two thirds of that is true: the scope context
(`src/utils/scope.ts:33-82`) reaches all three Agents as prompt text, so the
Planner explores only the named feature and the Generator writes tests for it.

The Healer is not scoped in any way that matters. Its instructions are
`pnpm exec playwright test` (`templates/agents/healer/AGENT.md:26-33`) — the
whole suite — and the catalogue lets it edit every file under `pages/` and
`tests/` (`src/agents/catalogue.ts:55-63`, `projectOutputs:
['pages/', 'tests/']`). In a Batch, `cleanRun` clears only the run's artefacts,
not the previous Scope's tests (`src/cli.ts:47-57, 360-368`), so Scope 2's
Healer runs and may repair Scope 1's tests, while Scope 2's preserved Healing
Report (`src/cli.ts:62-70`) then describes code that Scope did not write.

The README is the page a user trusts before spending agent money. Saying "the
Healer fixes only payment tests" is the one sentence that decides whether they
run a Batch over five scopes and get one shared, half-rewritten suite. Fix the
sentence; scoping the Healer is a product decision, not this plan.

## Current state

`README.md:257-270` (verbatim):

```markdown
### Feature Scoping

When a page has multiple features but you only want to test one:

```bash
npx spectra-test-automation \
  --url http://localhost:5173 \
  --page /checkout \
  --scope "credit card payment form"
```

The Planner focuses only on the payment form, the Generator creates
`PaymentFormPage.ts` and `payment.spec.ts`, and the Healer runs and fixes only
payment-related tests. Everything else on the page is ignored.
```

No other document makes this claim: `grep -rn "Healer" README.md docs/*.md |
grep -i "only\|just\|related"` matches only `README.md:269`.

**Repo conventions**: the README is prose with short paragraphs and no
hard-wrapped lines beyond ~80 columns in this section; edit in place, keep the
heading and the `bash` block as they are.

**Vocabulary**: from `CONTEXT.md` — *Feature focus* is the single feature a run
should test (`--scope`); the *Healer* is the third Agent; a *Batch* is a JSON
file of Scope definitions run one after another.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Lint, format, assists | `pnpm check` | exit 0 |
| Unit tests | `pnpm test:unit` | 14 files, 180 tests pass |

## Scope

**In scope**:
- `README.md` only: the paragraph at `:268-270`.

**Out of scope**:
- `templates/agents/healer/AGENT.md` — do not add a filter or a test-selection
  rule here.
- `src/cli.ts`, `src/agents/runner.ts` — do not pass `--grep` or a Scope name
  to the Healer.
- `docs/WALKTHROUGH.md`, `docs/QUICK-REFERENCE.md` — they do not make the
  claim; leave them.

## Git workflow

- Branch: `advisor/029-healer-scope-claim`
- Commit style: `docs: say the Healer runs the whole suite`
- Do not push or open a PR unless the operator asked for it.

## Steps

### Step 1: Replace the claim with what happens

Replace `README.md:268-270` with:

```markdown
The Planner explores only the payment form and the Generator writes tests only
for it. The Healer is not scoped: it runs the whole suite with
`playwright test`, and may repair any Page Object or test it finds broken —
including tests an earlier run generated. The rest of the page is ignored while
exploring.
```

**Verify**: `grep -n "fixes only" README.md` → no output;
`grep -n "The Healer is not scoped" README.md` → one hit.

### Step 2: Run the checks

**Verify**: `pnpm check && pnpm test:unit` → both exit 0; 14 files and 180
tests pass.

### Step 3: Report the product question

Do not change code, but leave the maintainer one line in the commit body:

```text
Scoping the Healer (a --grep from the current Scope, or a manifest of the files
this run generated) is a product decision, not a docs fix.
```

## Test plan

No new test: the plan changes prose. The proof that the wording is now right is
the code path: `templates/agents/healer/AGENT.md:28` runs `pnpm exec
playwright test` with no filter; nothing in `src/agents/runner.ts:111-129`
(`buildPrompt`) can narrow it beyond the scope-context text.

## Done criteria

- `grep -n "fixes only" README.md` prints nothing.
- The new paragraph names the Healer as unscoped and says it may touch tests
  from an earlier run.
- `pnpm check && pnpm test:unit` pass.
- Only `README.md` changed.

## STOP conditions

- If `README.md:257-270` does not match the excerpt above, stop and report.
- If the maintainer says the Healer *should* be scoped, stop: this plan then
  becomes the wrong fix, and the work is a product plan (filter or manifest),
  not a README edit.

## Maintenance note

If the Healer ever gains a filter (a `--grep` derived from the Scope, or a
generated-files manifest), this paragraph becomes wrong again. Whoever adds
that behaviour must update this section in the same change.
