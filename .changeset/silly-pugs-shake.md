---
'spectra-test-automation': patch
---

Fix the runs that claimed success on work that never happened.

- A Scope of a Batch that writes nothing now fails, instead of quietly reusing
  the Plan of the Scope before it
- The MCP server now refuses to finish the Generator that wrote no test, and
  refuses a Plan left over from an earlier run
- The CLI now checks that the Generator wrote a test, and not only the files
  that land in the output folder
- `spectra_done` only finishes the Agent that is running
- The rule "which files must exist" now lives in one place, so the CLI and the
  MCP server can no longer disagree about it
- A scope file that does not exist now warns instead of being ignored in
  silence
- The agent CLI is looked up and the templates are installed once per run, not
  once per Scope
- `npx spectra` did not run Spectra: the docs and the MCP config now use the
  package name `spectra-test-automation`
