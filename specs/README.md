# specs/

This directory holds **human-readable Markdown plans** and **gate documentation** for the Spectra pipeline.

## Contents

| File | Purpose |
|------|---------|
| `PLANNER-GATE.md` | Review checklist for Planner output before promotion to Generator |
| `GENERATOR-GATE.md` | Review rules for Generator output (assertions, tags, isolation, PR process) |
| `CI-HEALER-POLICY.md` | CI trace/report config, Healer retry limits, failure triage categories |
| `PILOT.md` | Verification pilot: one full story + two controlled failure scenarios |

## Where the Plan lives

A Spectrum run writes its Plan to `.spectra/output/plans/test-plan.md`. That
is the file the Generator reads.

To keep an approved Plan next to the project's other documents, copy it into
`specs/` and name it:

```
specs/<ISSUE-KEY>-<slug>.md
```

Examples:
- `specs/PROJ-123-checkout-flow.md`
- `specs/PROJ-456-user-registration.md`

The copy is a human artefact; a run always reads the Plan from
`.spectra/output/plans/test-plan.md`.

## Workflow

```
Story with AC
  → Planner produces .spectra/output/plans/test-plan.md
  → Review against PLANNER-GATE.md
  → Generator produces tests
  → Review against GENERATOR-GATE.md
  → CI runs tests (see CI-HEALER-POLICY.md)
  → Close story
```
