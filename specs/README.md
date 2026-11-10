# specs/

This directory holds **human-readable Markdown plans** and **gate documentation** for the Spectra pipeline.

## Contents

| File | Purpose |
|------|---------|
| `PLANNER-GATE.md` | Review checklist for Planner output before promotion to Generator |
| `GENERATOR-GATE.md` | Review rules for Generator output (assertions, tags, isolation, PR process) |
| `CI-HEALER-POLICY.md` | CI trace/report config, Healer retry limits, failure triage categories |
| `PILOT.md` | Verification pilot: one full story + two controlled failure scenarios |

## Naming convention for plans

When the Planner produces a plan for a specific story, save it as:

```
specs/<ISSUE-KEY>-<slug>.md
```

Examples:
- `specs/PROJ-123-checkout-flow.md`
- `specs/PROJ-456-user-registration.md`

## Workflow

```
Story with AC
  → Planner produces specs/<ISSUE>-<slug>.md
  → Review against PLANNER-GATE.md
  → Generator produces tests
  → Review against GENERATOR-GATE.md
  → CI runs tests (see CI-HEALER-POLICY.md)
  → Close story
```
