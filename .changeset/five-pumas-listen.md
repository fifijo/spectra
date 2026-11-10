---
'spectra-test-automation': minor
---

Fix the agent pipeline and clean up dead code.

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
- Batch scopes now pass `page` and `scope` through to the run
- `--batch` reports how many scopes failed
- The summary counts only the files created by the current run
- `SPECTRA_BROWSERS` and `SPECTRA_TAGS` are now implemented in the Playwright config, and `SPECTRA_TAGS` takes a comma separated list
- The Healer reads the results file the Playwright config actually writes, and writes `status.json`
- `run()` is now async and resolves to `true` when every agent succeeded
- Removed the unused `DEFAULTS` and `SPECTRA_AGENTS` constants and the two bash CLIs
