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

### `src/agents/init.ts`
- `initAgents(projectRoot)` - copies templates from `templates/agents/` to `.spectra/agents/`
- `scaffold(projectRoot)` - full project setup: creates dirs, copies agents, docs, fixtures
- A template file the user changed is kept, not overwritten. `.templates.json` in the target
  folder records the hash of every installed template, so an edit is told from an old template.

### `src/agents/runner.ts`
- `buildPrompt(agent, instruction, completionPath, agentsDir)` - assembles the prompt string
- `runAgent(options, agentsDir, debug?)` - async; dispatches to the correct runner and resolves when the agent is done
- `AgentRunOptions` interface: `name`, `color`, `emoji`, `prompt`, `mode`, `outputDir`, `completionPath`

### `src/utils/constants.ts`
- `PACKAGE_ROOT` - resolved root of the installed package
- `TEMPLATE_DIR` - `PACKAGE_ROOT/templates`
- `DEFAULT_OUTPUT_DIR` - `.spectra/output`

### `src/utils/detect-mode.ts`
- `detectMode(forceManual?)` - checks for `cursor-agent`, `claude`, `codex`,
  `opencode` and `gemini` on the PATH, in that order
- Returns: `'cursor-agent' | 'claude-code' | 'codex' | 'opencode' | 'gemini' | 'manual'`
- Uses platform-aware command detection (`where` on Windows, `command -v` on Unix)

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

## Specs (`specs/`)

Pipeline gate documentation (review checklists):
- `PLANNER-GATE.md` - Pre-flight checks and plan review checklist
- `GENERATOR-GATE.md` - Assertion rules, tagging rules, code structure rules, PR process
- `CI-HEALER-POLICY.md` - CI config, healer retry limits (max 3 per test, 5 total cycles), failure triage (bug vs locator drift vs flake vs env issue)
- `PILOT.md` - Verification pilot with 3 scenarios (full story, wrong locator, real regression)

## Devin Secrets Needed
None.
