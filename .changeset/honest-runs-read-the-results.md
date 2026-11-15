---
'spectra-test-automation': minor
---

A run fails when the tests fail.

- The CLI reads the JSON report Playwright writes and exits non-zero when a
  test is still failing, or when the Healer never ran the suite.
  `SPECTRUM COMPLETE` now means the suite is green.
- A suite where every test was skipped is not green either: nothing was
  proved, so the run fails with `NO TESTS PASSED`.
- A spec the Generator wrote has to assert something. The catalogue states the
  rule and the run checks it, so a test that asserts nothing cannot pass the
  Spectrum.
- Native mode (`--mcp`) exits with the same code when the host closes the
  connection, and its last payload carries the counts.
- A run is green only when nothing failed and something passed: a suite where
  every test was skipped has proved nothing.
- The run checks the Generator's work: a spec file without an assertion fails
  the run, in every mode.
- The HTML report has a folder of its own (`.spectra/output/reports/html`).
  The reporter wipes its output folder when a run starts, so the Healing Report
  and `status.json` next to it survived every run before.
- The Generator runs the project's formatter and linter over the files it
  wrote, so the suite passes the same checks as the rest of the project.
- The Agents are told how the browser tools are reached in their host, so a
  missing MCP server is a gap in the Plan rather than a guess.
- The **Page URL** of a scope file is metadata the run already read: it is
  dropped from the requirements, so it cannot contradict a `--page` flag.
- The documents are checked against the code: `pnpm test:unit` holds the
  static claims, `pnpm verify:docs` runs them.
- Every Agent is pointed at the shared context, so the project layout it
  describes is read by the Agents that write the code.
- The Healer produces the JSON report the run reads, so a project with its own
  Playwright config can write it:
  `npx playwright test --reporter=json > .spectra/output/reports/results.json`.
- The Healer produces that report, so a run that never ran the tests cannot
  finish.
- The Healer runs only the specs this run wrote: in a Batch, a Scope no
  longer repairs the tests of another Scope.
- A failing test keeps its video next to its screenshot and its trace, and
  the Agents keep the screenshots they took in `.spectra/output/evidence/`.
- The Healer template runs `npx playwright test`, so a project that does not
  use pnpm can still be healed.
- The Planner keeps a copy of the Plan in `specs/test-plan.md`, and the
  Generator runs the specs it wrote before it finishes.
