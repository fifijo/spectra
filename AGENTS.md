# AGENTS.md

## Cursor Cloud specific instructions

### Overview
Spectra is a TypeScript CLI tool for AI-driven Playwright test automation. Single-product repo (not a monorepo). The `dummy-test-app/` directory is a Vite+React app used only as the System Under Test for E2E testing.

### Running services
- **dummy-test-app** (Vite dev server): `cd dummy-test-app && pnpm dev` — runs on `http://localhost:5173`. Required for E2E/seed tests.
- No databases, Docker, or external services needed.

### Key commands
See `package.json` scripts. Quick reference:
| Task | Command |
|------|---------|
| Install deps | `pnpm install` (root) and `cd dummy-test-app && pnpm install` |
| Build | `pnpm run build` |
| Lint | `pnpm run lint` (Biome, not ESLint) |
| Format check | `pnpm run format:check` |
| Type check | `pnpm run typecheck` |
| Unit tests | `pnpm run test:unit` |
| E2E seed test | `pnpm run test:seed` (needs dummy-test-app running on :5173) |
| CLI | `node dist/bin.js --help` |

### Gotchas
- The `dummy-test-app` uses pnpm but has a separate `node_modules`. Its `esbuild` dependency requires build scripts to run. If you see `esbuild` not found, run: `node node_modules/.pnpm/esbuild@*/node_modules/esbuild/install.js` inside `dummy-test-app/`.
- Playwright browsers must be installed: `pnpm exec playwright install --with-deps chromium`.
- Biome (not ESLint/Prettier) handles linting and formatting for the root project. The dummy-test-app uses ESLint separately.
- Pre-commit checklist: `pnpm run check && pnpm run typecheck`.
