# Project Architecture

## Overview
Spectra is a TypeScript CLI tool and library that orchestrates three AI agents (Planner, Generator, Healer) to automate Playwright test creation and maintenance.

## Entry Points

### `src/bin.ts` - CLI Entry Point
- Calls `run()` from `cli.ts` with the options parsed by `parseCliArgs()`
- Exits with code 1 when the run reports a failure
- Compiled to `dist/bin.js` (referenced in `package.json` `bin` field)

### `src/args.ts` - Argument Parsing
- `parseCliArgs()` - parses `process.argv` with `node:util` `parseArgs`
- `printUsage()` - the `--help` text
- Lives in its own module so it can be tested without running the CLI

### `src/cli.ts` - Library Module
- Exports `run(options: SpectraOptions)` and the `SpectraOptions` type
- Pure library module with **no side effects** on import
- Handles: `--init` scaffolding, `--batch` mode, single-run agent pipeline
- `run()` is async and resolves to `true` when every agent succeeded
- A batch keeps the plan and healing report of every scope; only the completion
  signals are cleared between scopes

### `src/index.ts` - Public API
- Re-exports from `cli.ts` and utility modules
- Importing this module must **never** trigger CLI behavior
- This invariant is tested (see `testing-spectra-cli` skill)

### Critical Invariant
`src/index.ts` only imports from `cli.ts`, never from `bin.ts`. If this is broken, library consumers will get `ERR_PARSE_ARGS_UNKNOWN_OPTION` errors when importing the package.

## Agent Pipeline

The `run()` function in `cli.ts` executes three agents one after another, waiting for
each one to finish before starting the next:

```
Planner (blue) -> Generator (green) -> Healer (magenta)
```

Each agent:
1. Gets a prompt built by `buildPrompt()` (includes scope, AGENT.md path, completion signal)
2. Is dispatched by `runAgent()` based on detected mode:
   - `cursor-agent`: `spawn('cursor-agent', ['--print', '--force', prompt])`
   - `claude-code`: `spawn('claude', ['-p', prompt, '--permission-mode', 'bypassPermissions'])`
   - `codex`: `spawn('codex', ['exec', '--skip-git-repo-check', '--full-auto', prompt])`
   - `opencode`: `spawn('opencode', ['run', '--auto', prompt])`
   - `gemini`: `spawn('gemini', ['--approval-mode=yolo', '-p', prompt])`
   - `manual`: writes the prompt to a file and waits for the completion signal (30 minutes, then it gives up)
3. The agent's stdout and stderr are always drained and written to `.spectra/output/<name>.log`.
   An unread pipe fills up and blocks the agent forever. A failing agent rejects with the log path.

### Agent Communication
Agents communicate through files:
- Planner -> Generator: `.spectra/output/plans/test-plan.md`
- Generator -> Healer: `pages/*.ts`, `tests/*.spec.ts`
- Healer -> Reports: `.spectra/output/reports/healing-report.md`, `status.json`

### Completion Signals
Each agent creates a `.complete` file when done:
- Planner: `.spectra/output/plans/.complete`
- Generator: `.spectra/output/tests/.complete`
- Healer: `.spectra/output/reports/.complete`

## Key Source Modules

### `src/agents/catalogue.ts`
- The one description of every Agent: name, colour, emoji, inputs, outputs,
  project outputs, the folders it has to write into (`writes`) and its
  completion signal
- Every path the CLI hands an Agent comes from here
- `src/agents/__tests__/catalogue.test.ts` fails when a shipped `AGENT.md`
  or `shared/context.md` disagrees with it - run it after any change under
  `templates/agents/**` or to the catalogue

### `src/agents/init.ts`
- `initAgents(projectRoot)` - copies templates from `templates/agents/` to `.spectra/agents/`
- `scaffold(projectRoot)` - full project setup: creates dirs, copies agents, docs, fixtures
- A template file the user changed is kept, not overwritten. `.templates.json` in the target
  folder records the hash of every installed template, so an edit is told from an old template.

### `src/agents/runner.ts`
- `buildPrompt(agent, ctx)` - assembles the prompt string
- `runAgent(agent, ctx)` - async; dispatches to the mode's CLI and resolves
  when the agent is done
- `RunContext` interface: `mode`, `outputDir`, `agentsDir`, `debug`
- Every path in the prompt comes from the Agent catalogue entry - the
  prompt never names a path itself

### `src/agents/verify.ts`
- `missingOutputs(agent, outputDir, projectRoot, snapshot)` - the one rule that decides
  whether an Agent did its job: every file in `outputs` must exist and every folder in
  `writes` must hold a file the run created or changed
- `projectPath(target)` - the path as the Agent sees it, relative to the project root
- Both `cli.ts` and `mcp/server.ts` call it, so the two modes never disagree

### `src/mcp/server.ts`
- Serves the Spectrum over MCP (native mode, `--mcp`): `spectra_next` gives the host
  model the brief of the next Agent, `spectra_done` finishes it, `spectra_status` says
  where the run is
- Nothing here calls a model - the model of the user's chat or CLI plays the Agents

### `src/utils/batch.ts`
- Parses a Batch file into Scope definitions

### `src/utils/constants.ts`
- `PACKAGE_ROOT` - resolved root of the installed package
- `TEMPLATE_DIR` - `PACKAGE_ROOT/templates`
- `DEFAULT_OUTPUT_DIR` - `.spectra/output`

### `src/utils/detect-mode.ts`
- `detectMode(forceManual?)` - checks for `cursor-agent`, `claude`, `codex`,
  `opencode` and `gemini` on the PATH, in that order
- Returns: `'cursor-agent' | 'claude-code' | 'codex' | 'opencode' | 'gemini' | 'manual'`
- Uses platform-aware command detection (`where` on Windows, `command -v` on Unix)

### `src/utils/layout.ts`
- `PROJECT_DIRS` - the folders a scaffolded project gets
- `OUTPUT_DIRS` - the folders a run writes into

### `src/utils/logger.ts`
- Colored console logger using ANSI escape codes
- Methods: `info`, `success`, `warn`, `error`, `cyan`, `plain`, `banner`, `separator`, `debug`, `prompt`
- Debug output is on when `DEBUG=1` or `SPECTRA_DEBUG=1`; it is read lazily so `--debug` works

### `src/utils/scope.ts`
- `createScopeContext(outputPath, options)` - generates markdown scope file for agents
- Handles: URL, page, scope text, scope file content

## Templates (`templates/`)

Shipped with the npm package and copied to the user's project on every run
(`.spectra/agents/` is generated output, not source):
- `templates/agents/planner/AGENT.md` - Planner instructions
- `templates/agents/generator/AGENT.md` - Generator instructions
- `templates/agents/healer/AGENT.md` - Healer instructions
- `templates/agents/shared/context.md` - Shared project context
- `templates/docs/` - Scope template
- `templates/fixtures/pages.ts` - Playwright fixture boilerplate
- `templates/config/playwright.config.ts` - the Playwright config a scaffolded
  project gets (no `webServer` block: the user's app is started by the user)
- `templates/cursor/mcp.json` - the MCP config for Cursor: Playwright for the
  Agents, Spectra for the host
- `templates/.mcp.json` - the same MCP config for a host that is not Cursor
- `templates/tests/seed.spec.ts` - the environment readiness spec
- `templates/.github/workflows/test.yml` - the CI workflow a scaffolded project gets

## Specs (`specs/`)

Pipeline gate documentation (review checklists):
- `PLANNER-GATE.md` - Pre-flight checks and plan review checklist
- `GENERATOR-GATE.md` - Assertion rules, tagging rules, code structure rules, PR process
- `CI-HEALER-POLICY.md` - CI config, healer retry limits (max 3 per test, 5 total cycles), failure triage (bug vs locator drift vs flake vs env issue)
- `PILOT.md` - Verification pilot with 3 scenarios (full story, wrong locator, real regression)

## Devin Secrets Needed
None.
