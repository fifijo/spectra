# Spectra Quick Reference

```
   ◐ ◑ ◒
  SPECTRA
  Full-spectrum test automation
```

---

## Installation

### Option A: Install as npm package

```bash
pnpm add -D spectra-test-automation @playwright/test
npx spectra --init
pnpm exec playwright install chromium
```

### Option B: Install from Git

```bash
pnpm add -D "git+https://github.com/fifijo/spectra.git" @playwright/test
```

### Option C: Clone and develop locally

```bash
git clone https://github.com/fifijo/spectra.git
cd spectra
pnpm install
pnpm run build
```

---

## Usage

```bash
# Full spectrum scan
npx spectra --url http://localhost:5173

# Single page
npx spectra -u http://localhost:5173 -p /login

# Feature scope
npx spectra -u http://localhost:5173 -p /checkout -s "payment form"

# Scope file
npx spectra -u http://localhost:5173 -f SCOPE.md

# Manual mode
npx spectra -u http://localhost:5173 -m

# Batch mode - multiple scopes from JSON config
npx spectra -b scopes-batch.json

# Debug mode
npx spectra -u http://localhost:5173 --debug
```

---

## CLI Options

| Option | Short | Description |
|--------|-------|-------------|
| `--url` | `-u` | Target URL (required) |
| `--page` | `-p` | Specific page |
| `--scope` | `-s` | Feature focus |
| `--file` | `-f` | Scope file |
| `--batch` | `-b` | JSON config file |
| `--manual` | `-m` | Manual mode |
| `--init` | | Scaffold project structure |
| `--debug` | | Enable debug output |
| `--help` | `-h` | Show help |

---

## The Agents

| Agent | Role | Output |
|-------|------|--------|
| 🔵 Planner | Explores app | `test-plan.md` |
| 🟢 Generator | Creates tests | `pages/`, `tests/` |
| 🟣 Healer | Fixes failures | `healing-report.md`, `status.json` |

---

## Test Commands

```bash
pnpm test                        # Run all tests (chromium)
pnpm test:headed                 # With browser visible
pnpm test:ui                     # Playwright UI
pnpm test:seed                   # Run seed spec only
pnpm report                      # HTML report

# Cross-browser testing
SPECTRA_BROWSERS=firefox pnpm test
SPECTRA_BROWSERS=chromium,firefox pnpm test
SPECTRA_BROWSERS=all pnpm test   # All browsers + mobile

# Filter by tags
pnpm test --grep @smoke          # Only @smoke tests
pnpm test --grep @critical       # Only @critical tests
pnpm test --grep-invert @slow    # Skip @slow tests
pnpm test --grep "@auth|@login"  # Multiple tags (OR)
SPECTRA_TAGS=@smoke pnpm test    # Via env var
```

---

## Key Files

```
src/                        # TypeScript source (CLI & library)
  bin.ts                    # CLI entry point
  cli.ts                    # Public API (library module)
  agents/                   # Agent runner & scaffolding
  utils/                    # Shared utilities
dist/                       # Compiled output (npm package)
templates/                  # Shipped with the package
  agents/                   # Agent definitions (Planner, Generator, Healer)
  docs/                     # Scope template
  fixtures/                 # Test fixture template
specs/                      # Pipeline gate docs & Markdown plans
tests/e2e/                  # End-to-end seed & integration tests
.spectra/                   # Spectra configuration (generated via --init)
  agents/                   # Agent definitions
  output/                   # Generated outputs
    plans/test-plan.md      # Test plan
    reports/                # Results & reports
      status.json           # Machine-readable status
    test-results/           # Playwright test results
pages/                      # Generated Page Objects
tests/                      # Generated test files
fixtures/pages.ts           # Reusable test fixtures
docs/                       # Documentation
  SCOPE-template.md         # Scoping template
scopes-batch.json           # Batch config example
playwright.config.ts        # Playwright config
tsconfig.json               # TypeScript build config
tsconfig.test.json          # TypeScript config for Playwright tests
package.json                # npm package definition
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPECTRA_URL` | Base URL for tests | `http://localhost:5173` |
| `SPECTRA_BROWSERS` | Browsers to test | `chromium` |
| `SPECTRA_TAGS` | Filter by tags | (all tests) |
| `SPECTRA_DEBUG` | Enable debug output | (unset) |

```bash
# Example
export SPECTRA_URL=http://localhost:5173
export SPECTRA_BROWSERS=chromium,firefox
export SPECTRA_TAGS=@smoke,@critical
```

---

## Test Tags

Use tags to organize and filter tests:

| Tag | Use For |
|-----|---------|
| `@smoke` | Quick sanity tests |
| `@critical` | Business-critical paths |
| `@e2e` | Full end-to-end flows |
| `@slow` | Long-running tests |
| `@flaky` | Known flaky tests |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| MCP not connecting | Restart Cursor |
| Browser not opening | `pnpm exec playwright install chromium` |
| Tests failing | Check healing report |
| No CLI | Use `--manual` mode |
| Scope files not found | Check file paths in batch JSON config |
| Invalid URL | Ensure URL starts with `http://` or `https://` |

---

<div align="center">

◐ ◑ ◒

[GitHub](https://github.com/fifijo/spectra)

</div>
