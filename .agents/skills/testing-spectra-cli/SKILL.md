# Testing Spectra CLI Package

## Overview
Spectra is a TypeScript CLI tool published as an npm package (`spectra-test-automation`). The CLI entry point is `dist/bin.js` (separate from the library module `dist/cli.js`).

## Prerequisites
- Node.js >= 20.0.0
- pnpm (version specified in `packageManager` field of package.json)
- No external services or credentials needed for CLI testing

## Build
```bash
pnpm install
pnpm run build
```
Verify `dist/bin.js`, `dist/cli.js`, and `dist/index.js` all exist after build.

## Key Testing Areas

### 1. CLI Entry Point (`dist/bin.js`)
- `node dist/bin.js --help` should exit 0 and show usage
- `node dist/bin.js --init` should scaffold `.spectra/agents/`, `tests/e2e/`, `specs/` in CWD
- `node dist/bin.js` with no args should exit 1 with "URL required" error
- Run `--init` in a temp directory to avoid polluting the repo

### 2. Library Import (No Side Effects)
The library (`dist/index.js`) must NOT trigger CLI arg parsing when imported. Test by:
```bash
mkdir -p /tmp/test-import
echo "import('/path/to/spectra/dist/index.js').then(m => console.log('EXPORTS:', Object.keys(m).join(',')));" > /tmp/test-import/cli.js
node /tmp/test-import/cli.js --some-unknown-flag
```
Should exit 0 and print exports. If it crashes with `ERR_PARSE_ARGS_UNKNOWN_OPTION`, the bin/cli separation is broken.

### 3. Batch Mode (`--batch`)
```bash
echo '{"url":"http://localhost:9999","scopes":[{"name":"Login","file":"login.md"},{"name":"Dashboard","file":"dash.md"}]}' > /tmp/batch.json
node dist/bin.js --batch /tmp/batch.json
```
- Should show "Batch mode: 2 scope(s)" and iterate both scopes
- Missing batch file should error with "Batch file not found"
- Invalid JSON should error with "Failed to parse batch file"

### 4. Compiled Output Inspection
For security-sensitive changes, inspect the compiled JS directly:
- `dist/agents/runner.js`: Should use `execFileSync` with array args (not template literal shell interpolation)
- `dist/utils/detect-mode.js`: Should contain `process.platform === 'win32'` check with `where` fallback

### 5. Package Contents
```bash
npm pack --dry-run
```
- `dist/bin.js` must be listed (it's the bin entry point)
- No `src/` files should be included
- No `.env` or secret files should be included

## Architecture Notes
- `src/bin.ts` is the CLI entry point (arg parsing + execution)
- `src/cli.ts` is a pure library module (exports `run()` and `SpectraOptions`)
- `src/index.ts` re-exports from `cli.ts` — importing this must NOT trigger CLI behavior
- `package.json` `bin` field points to `dist/bin.js`
- Agents run in "manual" mode when neither `cursor-agent` nor `claude` CLI is installed

## Devin Secrets Needed
None required for CLI testing.
