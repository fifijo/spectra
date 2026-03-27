# Linting & Formatting

## Overview
Spectra uses **Biome** (not ESLint/Prettier) for linting and formatting. Version: `@biomejs/biome` v2.4.9. Configuration is in `biome.json`.

## Commands

### Lint
```bash
pnpm run lint          # check for lint errors
pnpm run lint:fix      # auto-fix lint errors
```

### Format
```bash
pnpm run format:check  # check formatting
pnpm run format        # auto-fix formatting
```

### Combined (Lint + Format)
```bash
pnpm run check         # check both lint and format
pnpm run check:fix     # auto-fix both
```

### Type Check
```bash
pnpm run typecheck     # runs tsc --noEmit
```

## Pre-commit Checklist
Run before every commit:
```bash
pnpm run check && pnpm run typecheck
```

## Biome Configuration (`biome.json`)

### File Scope
Biome only scans these files:
- `src/**`
- `biome.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `tsconfig.json`
- `tsconfig.test.json`

Files outside these patterns (e.g., `templates/`, `docs/`, `tests/`) are **not** linted or formatted by Biome.

### Formatter Settings
- Indent: 2 spaces
- Line width: 100 characters
- Quote style: single quotes
- Trailing commas: all

### Key Lint Rules
| Rule | Level | Notes |
|------|-------|-------|
| `recommended` | enabled | Base ruleset |
| `noUnusedImports` | warn | Flag unused imports |
| `noExplicitAny` | warn | Discourage `any` type |
| `noNonNullAssertion` | off | Non-null assertions (`!`) allowed |

### Assist
- `organizeImports` is enabled (auto-sorts imports)

## Devin Secrets Needed
None.
