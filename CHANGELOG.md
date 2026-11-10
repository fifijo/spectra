# spectra-test-automation

## 0.2.0

### Minor Changes

- [`557815c`](https://github.com/fifijo/spectra/commit/557815ccf46dfad061e827a9407be5975af1d3fc) - Fix the agent pipeline and clean up dead code.

  - Agents now run one after another: each one finishes before the next starts
  - Agent output is always drained, so a run no longer hangs when an agent prints more than 64KB
  - `claude-code` mode now uses `claude -p` instead of the invalid `claude --mcp`
  - `--debug` and `SPECTRA_DEBUG=1` now turn on debug output
  - Agent templates in `.spectra/agents/` are refreshed on every run, so upgrading the package ships new instructions
  - A template file you changed is kept, and the path of the new template is printed
  - Manual mode gives up after 30 minutes instead of waiting forever
  - A failed run prints `SPECTRUM FAILED` instead of `SPECTRUM COMPLETE`
  - A batch keeps the plan and healing report of every scope
  - A batch now really keeps them: each scope's results land in `.spectra/output/scopes/<number>-<name>/`, so a scope cannot overwrite the ones before it
  - The agents are described in one place, so the CLI and the agent templates can no longer disagree about a file
  - A batch file with a misspelled key is now rejected instead of silently widening the scope
  - The batch file is validated by a parser that never exits, so the rules can be tested on their own
  - The folders of a project are named in one place, and the shared context the agents read agrees with it
  - **Breaking**: `createScopeContext` takes `file` instead of `scopeFile` for the scope file
  - Batch scopes now pass `page` and `scope` through to the run
  - `--batch` reports how many scopes failed
  - The summary counts only the files created by the current run
  - `SPECTRA_BROWSERS` and `SPECTRA_TAGS` are now implemented in the Playwright config, and `SPECTRA_TAGS` takes a comma separated list
  - The Healer reads the results file the Playwright config actually writes, and writes `status.json`
  - `run()` is now async and resolves to `true` when every agent succeeded
  - Removed the unused `DEFAULTS` and `SPECTRA_AGENTS` constants and the two bash CLIs

  The rename of `createScopeContext`'s option is breaking, but the package is still on 0.x,
  where the API carries no stability promise, so it lands in this minor release rather than
  in 1.0.0. A major release is reserved for a deliberate decision about which functions are
  public: `createScopeContext` is exported, but it has never been documented as part of the
  API and its signature expects a path and a format only the agent templates understand.

- [`93c9273`](https://github.com/fifijo/spectra/commit/93c9273aa51060fdcafe27178dc3625003cd1fe6) - Run the Spectrum from your own chat or CLI, and with the agent CLI you already
  have.

  - `spectra --mcp` serves the Spectrum over MCP: the model in your chat or CLI
    plays the Agent, so no agent CLI is needed
  - `--init` writes an MCP config with the Spectra server in it, next to the
    Playwright MCP server
  - The automated mode now also uses `codex` (OpenAI Codex), `opencode` and
    `gemini` (Gemini CLI) when they are installed
  - The package no longer ships source maps, and a git install builds itself
  - `--init` scaffolds a seed spec and a CI workflow, so the first documented
    command works on a fresh project

- [`b938c32`](https://github.com/fifijo/spectra/commit/b938c328d7843b2e7396b3057736b4a9691f5381) - Let the user pick the CLI the agents run with, and give the MCP mode a
  project it can finish.

  - `--mode` (or `SPECTRA_MODE`) picks the Mode: `cursor-agent`, `claude-code`,
    `codex`, `opencode`, `gemini` or `manual`. Until now the first CLI found on
    the machine won, so a machine with several of them had no say.
  - `--mode` fails with a clear message when the CLI is not installed, instead
    of falling back to manual mode.
  - `spectra --mcp` now scaffolds the project like `--init` does. A project
    without a Playwright config could not finish a Spectrum: the Healer has
    nothing to run the tests with.
  - A run starts without the log of the last run, so the logs of the Agents do
    not pile up in `.spectra/output/`.

### Patch Changes

- [`09c1de3`](https://github.com/fifijo/spectra/commit/09c1de3eca4936809a857ceadf4cd29599ef3b8a) - Fix the runs that failed for the wrong reason.

  - The completion check compares the content of a file, not only its time. The
    clock of the file system is coarse, so an Agent that rewrote a file in the
    same tick as the start of the run was reported as writing nothing.
  - The CI workflow we ship runs on `ubuntu-24.04`: Playwright 1.59 has no
    browser build for `ubuntu-26.04`, so the job died before the first test.
  - The gate docs in `specs/` ship with the package again, so `--init` puts them
    in a new project.

- [`b938c32`](https://github.com/fifijo/spectra/commit/b938c328d7843b2e7396b3057736b4a9691f5381) - Make the agents' instructions and the docs agree with each other.

  - The Generator template now uses only `getByRole`, `getByLabel`,
    `getByTestId` and `getByText`. It taught CSS selectors in twelve samples
    and told the Generator never to use them, so the reviewer sent every one
    of them back.
  - The samples in the Generator template now assert what the user can see,
    and the gate lists the twelve patterns a reviewer has to check.
  - The Healer template says that the healing report and the status file are
    required, also when every test passed. A run that skipped them stopped at
    the Healer.
  - The README, the quick reference, the e2e skill and the gate carry the same
    eight tags, and name `@blocked` and `@flaky` as the two triage tags the
    Generator never emits.
  - The CI/Healer policy names the numbers the code uses: the artifacts the
    workflow uploads and when, three attempts per test, and the Playwright
    timeout of 30 seconds.
  - The README no longer calls the manual mode "manual Cursor mode".

- [`b938c32`](https://github.com/fifijo/spectra/commit/b938c328d7843b2e7396b3057736b4a9691f5381) - Close the gaps the "did the Agent do its job?" check left open.

  - The check no longer leans on a deadline: the run takes a snapshot of the files
    the Agents write and counts a file when it is new, or when its time or its
    content changed since then. A file written a moment before the run no longer
    passes for work this run did.
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

- [`b938c32`](https://github.com/fifijo/spectra/commit/b938c328d7843b2e7396b3057736b4a9691f5381) - Fix the runs that claimed success on work that never happened.

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
