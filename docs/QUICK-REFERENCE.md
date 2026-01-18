# Spectra Quick Reference

```
   ◐ ◑ ◒
  SPECTRA
  Full-spectrum test automation
```

---

## Installation

```bash
chmod +x setup-spectra.sh
./setup-spectra.sh
```

---

## Usage

```bash
# Full spectrum scan
./spectra --url http://localhost:5173

# Single page
./spectra -u http://localhost:5173 -p /login

# Feature scope
./spectra -u http://localhost:5173 -p /checkout -s "payment form"

# Scope file
./spectra -u http://localhost:5173 -f SCOPE.md

# Manual mode
./spectra -u http://localhost:5173 -m

# Batch mode - multiple scopes
./spectra -u http://localhost:5173 --files SCOPE-login.md SCOPE-payment.md
./spectra -u http://localhost:5173 --scopes-dir scopes/
./spectra --batch scopes-batch.json

# Debug mode
./spectra -u http://localhost:5173 --debug
```

---

## CLI Options

### Single Scope (`spectra`)

| Option | Short | Description |
|--------|-------|-------------|
| `--url` | `-u` | Target URL (required) |
| `--page` | `-p` | Specific page |
| `--scope` | `-s` | Feature focus |
| `--file` | `-f` | Scope file |
| `--manual` | `-m` | Manual mode |
| `--debug` | | Enable debug output |
| `--help` | `-h` | Show help |

### Batch Mode Options

| Option | Description |
|--------|-------------|
| `--files FILE1 ...` | Multiple scope files |
| `--scopes-dir DIR` | Directory with SCOPE-*.md files |
| `--batch FILE` | JSON config file |

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
spectra                 # Main CLI (single + batch mode)
.spectra/
  agents/               # Agent definitions
  lib/common.sh         # Shared utilities
  output/               # Generated outputs
    plans/test-plan.md  # Test plan
    reports/            # Results & reports
      status.json       # Machine-readable status
    test-results/       # Playwright test results
pages/                  # Page Objects
tests/                  # Test files
fixtures/pages.ts       # Reusable test fixtures
docs/                   # Documentation
  SCOPE-template.md     # Scoping template
scopes-batch.json       # Batch config example
playwright.config.ts    # Playwright config
tsconfig.json           # TypeScript config
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
| Browser not opening | `pnpm exec playwright install` |
| Tests failing | Check healing report |
| No CLI | Use `--manual` mode |
| Batch `--batch` needs jq | `brew install jq` (macOS) or `apt install jq` (Linux) |
| Scope files not found | Check file paths in JSON or directory |
| Invalid URL | Ensure URL starts with `http://` or `https://` |

---

<div align="center">

◐ ◑ ◒

[GitHub](https://github.com/yourusername/spectra) • [Docs](https://spectra.dev)

</div>
