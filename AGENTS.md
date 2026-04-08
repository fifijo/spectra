# Agents

## Cursor Cloud specific instructions

### Project overview
Spectra is a TypeScript CLI tool and library for AI-driven Playwright test automation. It uses a multi-agent pipeline (Planner, Generator, Healer) to explore web apps and generate self-healing Playwright tests. See `README.md` for full details.

### Services
| Service | Purpose | Start command | URL |
|---------|---------|---------------|-----|
| **dummy-test-app** | React + Vite sample app used as target for E2E tests | `cd dummy-test-app && pnpm dev` | `http://localhost:5173` |

No databases, Docker, or external APIs are needed.

### Key commands
Refer to `package.json` `scripts` for the full list. Highlights:
- **Build:** `pnpm run build` (compiles `src/` to `dist/`)
- **Lint:** `pnpm lint` (Biome)
- **Unit tests:** `pnpm test:unit` (Vitest, 79 tests across 8 files)
- **E2E seed test:** `pnpm test:seed` (requires dummy-test-app running on `:5173`)
- **All Playwright tests:** `pnpm test` (requires dummy-test-app running)
- **Type check:** `pnpm typecheck`

### Gotchas
- The `dummy-test-app` uses pnpm in its own directory. Its `package.json` needs `pnpm.onlyBuiltDependencies: ["esbuild"]` so that `esbuild` postinstall scripts run. Without this, `vite` will fail at runtime.
- Playwright browsers must be installed with `pnpm exec playwright install --with-deps chromium` from the root workspace.
- The dummy-test-app **must** be running before executing E2E tests (`pnpm test:seed` or `pnpm test`).
- Biome lint scope is limited to `src/**` and config files (see `biome.json` `files.includes`).
- There are no git hooks or pre-commit checks in this repo.
