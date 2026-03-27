# Release & Versioning

## Overview
Spectra uses **Changesets** (`@changesets/cli`) for version management and npm publishing. Configuration is in `.changeset/config.json`.

## Changeset Configuration
- Changelog generator: `@changesets/changelog-github` (links to GitHub repo `fifijo/spectra`)
- Access: public
- Base branch: `main`
- Auto-commit: disabled (`"commit": false`)

## Workflow

### 1. Create a Changeset
When making a change that should be released:
```bash
pnpm run changeset
```
This interactive command:
- Asks which packages are affected
- Asks for the semver bump type (patch/minor/major)
- Creates a markdown file in `.changeset/` describing the change

### 2. Version Packages
When ready to release (typically done by maintainers):
```bash
pnpm run version-packages
```
This runs `changeset version`, which:
- Reads all pending changeset files
- Bumps the version in `package.json`
- Updates `CHANGELOG.md`
- Removes consumed changeset files

### 3. Publish Release
```bash
pnpm run release
```
This runs `pnpm run build && changeset publish`, which:
- Builds the project (`tsc`)
- Publishes to npm registry

## Semver Rules
| Bump | When |
|------|------|
| Patch (`0.1.1`) | Bug fixes, documentation updates |
| Minor (`0.2.0`) | New features, new agent templates |
| Major (`1.0.0`) | Breaking CLI changes, peer `@playwright/test` range changes |

## Package Details
- Package name: `spectra-test-automation`
- Current version: `0.1.0`
- Published files (from `package.json` `files` field):
  - `dist/` (compiled output)
  - `templates/` (agent definitions, docs, fixtures)
  - `specs/` (pipeline gate documentation)
  - `docs/` (user documentation)
  - `playwright.config.ts`
  - `LICENSE`
  - `README.md`
- `prepublishOnly` hook automatically runs `pnpm run build`

## Verify Package Contents
```bash
npm pack --dry-run
```
Check that:
- `dist/bin.js` is included (CLI entry point)
- No `src/` files are included
- No `.env` or secret files are included

## Devin Secrets Needed
- `NPM_TOKEN` is needed for publishing to npm (not required for development)
