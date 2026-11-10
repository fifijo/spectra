---
'spectra-test-automation': patch
---

Close the gaps the "did the Agent do its job?" check left open.

- The check no longer leans on a deadline: the run takes a snapshot of the files
  the Agents write and counts a file when it is new or changed since then. A
  file written a moment before the run no longer passes for work this run did.
- A file the Agent changed during the run counts as done, so a Generator that
  edits a test is no longer reported as writing nothing.
- The summary counts the files the run created or changed, so "Test files: 0"
  no longer appears next to a successful run.
- The test results of an earlier run are removed at the start of a run, so the
  Healer cannot read the results of the Scope before it.
- A scope file from outside the project now warns: its text goes to an agent
  that can run commands on the machine.
- The scope file is handed to the agent as data to test, not as orders to follow
- The Generator template no longer shows `getByRole('combobox, textbox')`, which
  is not a valid Playwright locator
