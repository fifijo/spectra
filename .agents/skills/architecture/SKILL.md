# Project Architecture

## Overview
Spectra is a TypeScript CLI tool and library that orchestrates three AI agents (Planner, Generator, Healer) to automate Playwright test creation and maintenance.

## Entry Points

### `src/bin.ts` - CLI Entry Point
- Parses command-line arguments using `node:util` `parseArgs`
- Calls `run()` from `cli.ts` with parsed options
- Compiled to `dist/bin.js` (referenced in `package.json` `bin` field)
- This file triggers side effects (arg parsing, process exit)

### `src/cli.ts` - Library Module
- Exports `run(options: SpectraOptions)` and the `SpectraOptions` type
- Pure library module with **no side effects** on import
- Handles: `--init` scaffolding, `--batch` mode, single-run agent pipeline

### `src/index.ts` - Public API
- Re-exports from `cli.ts` and utility modules
- Importing this module must **never** trigger CLI behavior
- This invariant is tested (see `testing-spectra-cli` skill)

### Critical Invariant
`src/index.ts` only imports from `cli.ts`, never from `bin.ts`. If this is broken, library consumers will get `ERR_PARSE_ARGS_UNKNOWN_OPTION` errors when importing the package.

## Agent Pipeline

The `run()` function in `cli.ts` executes three agents sequentially:

```
Planner (blue) -> Generator (green) -> Healer (magenta)
```

Each agent:
1. Gets a prompt built by `buildPrompt()` (includes scope, AGENT.md path, completion signal)
2. Is dispatched by `runAgent()` based on detected mode:
   - `cursor-agent`: runs via `execFileSync('cursor-agent', ...)`
   - `claude-code`: runs via `execSync('claude --mcp', ...)`
   - `manual`: writes prompt to file for IDE-based execution

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

### `src/agents/runner.ts`
- `buildPrompt(agent, instruction, completionPath, agentsDir)` - assembles the prompt string
- `runAgent(options, agentsDir)` - dispatches to the correct runner based on CLI mode
- `AgentRunOptions` interface: `name`, `color`, `emoji`, `prompt`, `mode`, `outputDir`

### `src/utils/constants.ts`
- `PACKAGE_ROOT` - resolved root of the installed package
- `TEMPLATE_DIR` - `PACKAGE_ROOT/templates`
- `DEFAULT_OUTPUT_DIR` - `.spectra/output`
- `SPECTRA_AGENTS` - `['planner', 'generator', 'healer'] as const`
- `DEFAULTS` - default config values (url, timeout, maxHealerAttempts, browsers)

### `src/utils/detect-mode.ts`
- `detectMode(forceManual?)` - checks for `cursor-agent` then `claude` CLI
- Returns: `'cursor-agent' | 'claude-code' | 'manual'`
- Uses platform-aware command detection (`where` on Windows, `command -v` on Unix)

### `src/utils/logger.ts`
- Colored console logger using ANSI escape codes
- Methods: `info`, `success`, `warn`, `error`, `cyan`, `magenta`, `plain`, `banner`, `separator`

### `src/utils/scope.ts`
- `createScopeContext(outputPath, options)` - generates markdown scope file for agents
- Handles: URL, page, scope text, scope file content

## Templates (`templates/`)

Shipped with the npm package and copied to the user's project on `--init`:
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
