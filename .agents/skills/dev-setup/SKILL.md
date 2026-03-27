# Development Setup & Build

## Overview
Spectra is a TypeScript CLI tool and library for AI-driven Playwright test automation. This skill covers getting the project built and ready for development.

## Prerequisites
- Node.js >= 20.0.0 (LTS v22.x recommended)
- pnpm (exact version specified in `package.json` `packageManager` field, currently `pnpm@10.18.3`)
- Git

## Initial Setup
```bash
pnpm install
```

## Build
```bash
pnpm run build
```
This runs `tsc` and outputs compiled JavaScript to `dist/`.

### Verify Build
After building, confirm these files exist:
- `dist/bin.js` (CLI entry point)
- `dist/cli.js` (library module)
- `dist/index.js` (public API exports)

## Clean Build
```bash
pnpm run clean    # removes dist/
pnpm run build
```

## TypeScript Configuration
- `tsconfig.json` is the build config:
  - Target: ES2022
  - Module: NodeNext
  - Strict mode enabled
  - Source maps and declaration maps enabled
  - `rootDir`: `src/`, `outDir`: `dist/`
  - Excludes: `node_modules`, `dist`, `dummy-test-app`, `.spectra/output`, `tests`, `pages`, `fixtures`, `templates`
- `tsconfig.test.json` is used for Playwright test files (separate config)

## Environment Variables
No environment variables are required for development or building. Runtime variables:
- `SPECTRA_URL` - target app URL (default: `http://localhost:5173`)
- `SPECTRA_BROWSERS` - browsers to test (default: `chromium`)
- `SPECTRA_TAGS` - test tag filter
- `SPECTRA_DEBUG` - enable debug output

## Key Directories
- `src/` - TypeScript source code
- `dist/` - compiled output (gitignored)
- `templates/` - agent templates shipped with npm package
- `specs/` - pipeline gate documentation
- `docs/` - user-facing documentation
- `dummy-test-app/` - Vite app used as SUT in CI/E2E tests

## No Pre-commit Hooks
This project does not use `.husky/` or `.pre-commit-config.yaml`. There are no git hooks to install.

## Devin Secrets Needed
None required for development or building.
