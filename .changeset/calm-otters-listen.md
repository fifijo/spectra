---
'spectra-test-automation': minor
---

Make the templates and the documents true of what the code does.

- The Healer template now obeys the shipped CI/Healer policy: it repairs
  locators and timing only, and hands expected values, messages and test
  steps to a human.
- `spectra --init` writes a `.gitignore`, an example `scopes-batch.json` and
  the four guides into the project.
- The gate documents review the Plan the Spectrum writes, at
  `.spectra/output/plans/test-plan.md`.
- The CLI refuses a run whose flags contradict each other: `--mcp` with
  `--batch`, `--init`, `--mode` or `--manual`, and `--init` with `--batch`.
- The programmatic API (`run()`, `detectMode()`, `createScopeContext()`) is
  documented in the README and the quick reference.
