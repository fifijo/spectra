# Plan 019: The gate documents review the Plan the Spectrum actually writes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 660399d..HEAD -- specs/ templates/agents/planner/AGENT.md src/agents/catalogue.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `660399d`, 2026-11-10

## Why this matters

Four documents tell a reviewer that the Plan lives at
`specs/<ISSUE>-<slug>.md`, and one of them makes that a **Required**
input. The Planner never writes such a file: the Agent catalogue declares
its output as `plans/test-plan.md` (which resolves to
`.spectra/output/plans/test-plan.md`), and the Planner template says "Write
your plan to: `.spectra/output/plans/test-plan.md`".

So the review checklist is applied to a file that does not exist, and the
file that does drive the run — the one the Generator reads — is never
checked against any gate. `specs/PLANNER-GATE.md` even asks the reviewer to
verify a naming convention (`specs/PROJ-123-checkout-flow.md`) that no
process produces. The gate docs are copied into every scaffolded project,
so every user inherits the contradiction.

## Current state

- `src/agents/catalogue.ts:22-30` — the Planner's declaration:
  ```typescript
  {
    name: 'planner',
    color: 'blue',
    emoji: '🔵',
    inputs: [],
    outputs: ['plans/test-plan.md'],
    projectOutputs: [],
    completionSignal: 'plans/.complete',
  },
  ```
- `templates/agents/planner/AGENT.md:18` — "Write your plan to:
  `.spectra/output/plans/test-plan.md`"; `:129` — "Create
  `.spectra/output/plans/test-plan.md` with this structure:".
- `templates/agents/generator/AGENT.md:7` — the Generator reads that same
  file.
- `specs/PLANNER-GATE.md:25` — "After the Planner produces
  `specs/<ISSUE>-<slug>.md`:"; `:33` — "**Naming convention** - File follows
  `specs/<ISSUE-KEY>-<slug>.md` (e.g., `specs/PROJ-123-checkout-flow.md`)".
- `specs/README.md:19` — "specs/<ISSUE-KEY>-<slug>.md"; `:30` — "→ Planner
  produces specs/<ISSUE>-<slug>.md".
- `specs/PILOT.md:15` — "Output: `specs/<ISSUE>-<slug>.md`".
- `specs/GENERATOR-GATE.md:9` — the gate table row "Approved plan |
  `specs/<ISSUE>-<slug>.md` | Yes"; `:50` — "Link to the approved plan
  (`specs/<ISSUE>-<slug>.md`)".
- `templates/agents/planner/AGENT.md` has **no** "Review Rules" section —
  the Generator template has one (`templates/agents/generator/AGENT.md:350-354`),
  the Planner template does not.

**The decision this plan makes**: the Plan that a run produces lives at
`.spectra/output/plans/test-plan.md`, and that is the file the gate
documents review. `specs/<ISSUE>-<slug>.md` stays a **human** artefact: if a
reviewer wants to keep an approved Plan next to the project's other specs,
they may copy it there, and the naming convention applies to that copy. No
code changes: the catalogue, the runner and the templates already agree on
the location, so only the documents are wrong.

**Repo conventions to match**: Markdown with ATX headings, tables with a
header row and `|---|---|` separators, and fenced code blocks with a
language. The vocabulary is fixed by `CONTEXT.md`: the artefact is the
*Plan* (avoid "test plan", "spec", "strategy"); `specs/` holds the gate
documentation ("gate" is the word for the human review checklists in
`specs/`).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Unit tests | `pnpm test:unit` | 12 files, 129 tests pass |
| Catalogue test | `pnpm vitest run src/agents/__tests__/catalogue.test.ts` | all pass |
| Lint + format + assists | `pnpm check` | exit 0, 56 files |

## Scope

**In scope** (the only files you should modify):
- `specs/PLANNER-GATE.md`
- `specs/README.md`
- `specs/PILOT.md`
- `specs/GENERATOR-GATE.md`
- `templates/agents/planner/AGENT.md` (the "Review Rules" section only)

**Out of scope** (do NOT touch, even though they look related):
- `src/agents/catalogue.ts` — the catalogue is correct: it is the one
  description of every Agent, and the templates already match it.
- `src/agents/runner.ts` — the prompt's paths come from the catalogue.
- `templates/agents/generator/AGENT.md` — its "Review Rules" section is
  already correct.
- `src/agents/__tests__/catalogue.test.ts` — the test that enforces the
  agreement; it must keep passing unchanged.

## Git workflow

- Branch: `advisor/019-plan-location`
- Commit style: conventional commits — e.g. `docs: point the gate documents
  at the Plan the Spectrum writes`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fix `specs/PLANNER-GATE.md`

Change the heading at `:25` to name the real file, and turn the naming
convention row into an optional human step:

```markdown
After the Planner produces `.spectra/output/plans/test-plan.md`:
```

and replace the "Naming convention" checklist row with:

```markdown
- [ ] **Approved Plan kept** (optional) - If you copy the approved Plan
      into the project, name it `specs/<ISSUE-KEY>-<slug>.md`
      (e.g. `specs/PROJ-123-checkout-flow.md`).
```

Add one checklist row for the structure the Planner template requires, so
the gate checks what the template produces:

```markdown
- [ ] **Structure** - The Plan has the sections the Planner template
      requires: Application Overview, the per-page sections (Route,
      Elements, Actions, Empty State, Validations), User Flows, and the
      numbered Test Scenarios with their Expected Result.
```

**Verify**: `grep -n "specs/<ISSUE>" specs/PLANNER-GATE.md` → at most one
hit, and it is the optional naming row.

### Step 2: Fix `specs/README.md`, `specs/PILOT.md` and `specs/GENERATOR-GATE.md`

- `specs/README.md:19,30` — say that the Plan a run produces is
  `.spectra/output/plans/test-plan.md`, and that `specs/<ISSUE-KEY>-<slug>.md`
  is where a reviewer may keep a copy.
- `specs/PILOT.md:15` — change "Output: `specs/<ISSUE>-<slug>.md`" to
  "Output: `.spectra/output/plans/test-plan.md`".
- `specs/GENERATOR-GATE.md:9` — the gate table row becomes "Approved plan |
  `.spectra/output/plans/test-plan.md` | Yes"; `:50` — link to that file.

**Verify**: `grep -rn "specs/<ISSUE>" specs/` → only the optional
naming-convention sentences.

### Step 3: Point the Planner template at its gate

Add a "Review Rules" section to `templates/agents/planner/AGENT.md`,
mirroring the one in the Generator template
(`templates/agents/generator/AGENT.md:350-354`):

```markdown
## Review Rules

The output of this Agent is reviewed against `specs/PLANNER-GATE.md`:
every user flow has a measurable outcome, the page inventory covers every
route you visited, the gaps are flagged, and each scenario has an expected
result.
```

**Verify**: `grep -n "specs/PLANNER-GATE.md" templates/agents/planner/AGENT.md`
→ one hit.

### Step 4: Run the checks

**Verify**: `pnpm check && pnpm typecheck && pnpm test:unit` → all exit 0;
12 files and 129 tests pass.

**Verify**: `pnpm vitest run src/agents/__tests__/catalogue.test.ts` → all
pass. This test compares the shipped templates with the catalogue; this
plan adds prose to a template and changes no path, so it must stay green.

## Test plan

No new unit test: this plan changes documents only. The acceptance check is
mechanical — after it, no gate document names `specs/<ISSUE>-<slug>.md` as
the Plan a run produces, and the Planner template names its gate.

The existing `src/agents/__tests__/catalogue.test.ts` is the regression
guard for the path question this plan settles: it fails if a shipped
`AGENT.md` disagrees with `src/agents/catalogue.ts` about the completion
signal or the paths.

## Done criteria

- [ ] `grep -rn "specs/<ISSUE>" specs/` matches only the optional
      naming-convention sentences
- [ ] `specs/PLANNER-GATE.md` reviews
      `.spectra/output/plans/test-plan.md` and lists the Planner template's
      required sections
- [ ] `specs/PILOT.md` names `.spectra/output/plans/test-plan.md` as the
      output
- [ ] `specs/GENERATOR-GATE.md` names the same file as the approved plan
- [ ] `templates/agents/planner/AGENT.md` has a "Review Rules" section
      naming `specs/PLANNER-GATE.md`
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test:unit` exits 0; 129 tests pass
- [ ] `pnpm vitest run src/agents/__tests__/catalogue.test.ts` passes
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 019 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `src/agents/catalogue.ts` no longer declares the Planner's output as
  `plans/test-plan.md` — the source of truth moved; re-check the drift and
  follow the live file.
- The Planner template no longer writes `.spectra/output/plans/test-plan.md`
  — report where it writes now instead of guessing.
- The project has decided that a human *moves* the Plan into `specs/` as
  part of the workflow — that would need a code change (the CLI would have
  to copy the file), which is out of scope here; report it.

## Maintenance notes

- The copy in `specs/` is a human artefact, not an input: the Generator
  always reads `.spectra/output/plans/test-plan.md`. If a future feature
  makes the CLI copy the Plan into `specs/`, the catalogue and the four
  documents must change together — and `src/agents/__tests__/catalogue.test.ts`
  is the test that catches a half-done change.
- ADR 0001 records that the catalogue and the templates duplicate paths on
  purpose, with a test enforcing the agreement. This plan removes a
  contradiction on the *document* side; it does not add a second place
  where a path is defined.
- Reviewers should check that no gate document tells a user to wait for a
  file that no process writes.
