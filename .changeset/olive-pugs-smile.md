---
'spectra-test-automation': minor
---

Run the Spectrum from your own chat or CLI, and with the agent CLI you already
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
