---
'spectra-test-automation': minor
---

Let the user pick the CLI the agents run with, and give the MCP mode a
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
