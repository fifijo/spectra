# Spectra Walkthrough

Step-by-step guide to full-spectrum test automation.

---

## Quick Start (TL;DR)

```bash
# 1. Setup
chmod +x setup-spectra.sh
./setup-spectra.sh

# 2. Start your app (separate terminal)
cd /your/app && pnpm dev

# 3. Run Spectra
./spectra --url http://localhost:5173

# Done! Tests are in tests/
```

---

## The Spectrum

```
◐ PLANNER   → Explores app, creates test plan
◑ GENERATOR → Reads plan, creates tests
◒ HEALER    → Runs tests, fixes failures
```

---

## Detailed Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR INPUT                              │
│  ./spectra --url http://localhost:5173 --scope "login form"    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  🔵 PLANNER                                                     │
│                                                                 │
│  1. Reads scope: "Focus on login form"                         │
│  2. Uses Playwright MCP:                                        │
│     → browser_navigate("http://localhost:5173")                │
│     → browser_snapshot() - sees accessibility tree              │
│  3. Finds login form elements                                   │
│  4. Writes: .spectra/output/plans/test-plan.md                 │
│                                                                 │
│  Output:                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ # Test Plan                                              │   │
│  │ ## Login Form                                            │   │
│  │ - Email input (getByLabel('Email'))                      │   │
│  │ - Password input (getByLabel('Password'))                │   │
│  │ - Submit button (getByRole('button', {name: 'Log in'})) │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  🟢 GENERATOR                                                   │
│                                                                 │
│  1. Reads: .spectra/output/plans/test-plan.md                  │
│  2. Creates Page Object:                                        │
│                                                                 │
│  pages/LoginPage.ts:                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ export class LoginPage {                                 │   │
│  │   readonly emailInput: Locator;                          │   │
│  │   readonly passwordInput: Locator;                       │   │
│  │   readonly submitButton: Locator;                        │   │
│  │                                                          │   │
│  │   constructor(page: Page) {                              │   │
│  │     this.emailInput = page.getByLabel('Email');          │   │
│  │     this.passwordInput = page.getByLabel('Password');    │   │
│  │     this.submitButton = page.getByRole('button',         │   │
│  │       { name: 'Log in' });                               │   │
│  │   }                                                      │   │
│  │ }                                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  3. Creates test file:                                          │
│                                                                 │
│  tests/login.spec.ts:                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ test('valid login', async ({ page }) => {                │   │
│  │   const loginPage = new LoginPage(page);                 │   │
│  │   await loginPage.emailInput.fill('user@test.com');      │   │
│  │   await loginPage.passwordInput.fill('password');        │   │
│  │   await loginPage.submitButton.click();                  │   │
│  │   await expect(page).toHaveURL('/dashboard');            │   │
│  │ });                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  🟣 HEALER                                                      │
│                                                                 │
│  1. Runs: pnpm exec playwright test                            │
│                                                                 │
│  2. Sees failure:                                               │
│     "Can't find element: getByRole('button', {name: 'Log in'})│
│                                                                 │
│  3. Uses Playwright MCP to investigate:                         │
│     → browser_navigate("/login")                               │
│     → browser_snapshot()                                        │
│     → Sees: button is actually "Sign In" not "Log in"          │
│                                                                 │
│  4. Fixes pages/LoginPage.ts:                                  │
│     - this.submitButton = page.getByRole('button',              │
│     -   { name: 'Log in' });                                    │
│     + this.submitButton = page.getByRole('button',              │
│     +   { name: 'Sign In' });                                   │
│                                                                 │
│  5. Re-runs tests: ✅ All pass                                  │
│                                                                 │
│  6. Writes: .spectra/output/reports/healing-report.md          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ✨ SPECTRUM COMPLETE                                           │
│                                                                 │
│  pages/LoginPage.ts     ← Page Object (fixed)                  │
│  tests/login.spec.ts    ← Working tests                         │
│                                                                 │
│  $ pnpm test                                                    │
│  ✓ login.spec.ts (3 tests)                                     │
│  3 passed                                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Setup

```bash
# Create project folder
mkdir my-tests
cd my-tests

# Run setup
chmod +x setup-spectra.sh
./setup-spectra.sh
```

Creates:
- ✅ Playwright + Chromium
- ✅ 3 agents (Planner, Generator, Healer)
- ✅ MCP configuration
- ✅ `spectra` CLI

---

## Step 2: Start Your App

In a separate terminal:

```bash
cd /path/to/your/app
pnpm dev
```

---

## Step 3: Run Spectra

### Full Spectrum (entire app)

```bash
./spectra --url http://localhost:5173
```

### Single Page

```bash
./spectra --url http://localhost:5173 --page /login
```

### Specific Feature

```bash
./spectra --url http://localhost:5173 --page /checkout --scope "payment form"
```

### With Scope File

```bash
cp docs/SCOPE-template.md SCOPE.md
# Edit SCOPE.md
./spectra --url http://localhost:5173 --file SCOPE.md
```

### Multiple Scopes (Batch Mode)

Run multiple scopes sequentially:

```bash
# Option 1: Multiple files
./spectra \
  --url http://localhost:5173 \
  --files SCOPE-login.md SCOPE-payment.md SCOPE-shipping.md

# Option 2: Directory of scopes
mkdir scopes
cp docs/SCOPE-template.md scopes/SCOPE-login.md
cp docs/SCOPE-template.md scopes/SCOPE-payment.md
./spectra --url http://localhost:5173 --scopes-dir scopes/

# Option 3: Batch JSON config
./spectra --batch scopes-batch.json
```

---

## Step 4: Check Results

```bash
# Run tests
pnpm test

# View report
pnpm report

# Check generated files
ls pages/    # Page Objects
ls tests/    # Test files

# Cross-browser testing
SPECTRA_BROWSERS=firefox pnpm test
SPECTRA_BROWSERS=all pnpm test    # All browsers + mobile

# Filter by tags
pnpm test --grep @smoke           # Only smoke tests
pnpm test --grep-invert @slow     # Skip slow tests
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `./spectra -u URL` | Full spectrum scan |
| `./spectra -u URL -p /page` | Single page focus |
| `./spectra -u URL -s "feature"` | Feature scope |
| `./spectra -u URL -f SCOPE.md` | Detailed scope file |
| `./spectra -u URL -m` | Manual Cursor mode |
| `./spectra -u URL --debug` | Enable debug output |
| `./spectra -u URL --files FILE1 FILE2` | Run multiple scope files |
| `./spectra -u URL --scopes-dir DIR` | Run all scopes in directory |
| `./spectra --batch FILE.json` | Run scopes from JSON config |
| `pnpm test` | Run all tests |
| `pnpm test:headed` | Run with visible browser |
| `pnpm test:ui` | Run with Playwright UI |
| `pnpm test --grep @tag` | Filter by tag |
| `pnpm report` | View HTML report |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPECTRA_URL` | Base URL for tests | `http://localhost:5173` |
| `SPECTRA_BROWSERS` | Browsers to test | `chromium` |
| `SPECTRA_TAGS` | Filter tests by tags | (all tests) |
| `SPECTRA_DEBUG` | Enable debug output | (unset) |

---

## Examples

### E-commerce Checkout

```bash
# Test only payment, not shipping/cart
./spectra \
  --url http://localhost:5173 \
  --page /checkout \
  --scope "credit card payment form"
```

### User Settings

```bash
# Test only password change
./spectra \
  --url http://localhost:5173 \
  --page /settings \
  --scope "change password"
```

### Dashboard Widget

```bash
# Test only analytics chart
./spectra \
  --url http://localhost:5173 \
  --page /dashboard \
  --scope "revenue chart"
```

### Multiple Scopes (Batch Mode)

```bash
# Test multiple features sequentially
./spectra \
  --url http://localhost:5173 \
  --files SCOPE-login.md SCOPE-payment.md SCOPE-shipping.md

# Or use a directory
./spectra \
  --url http://localhost:5173 \
  --scopes-dir scopes/

# Or use batch JSON config
./spectra --batch scopes-batch.json
```

---

## Troubleshooting

### MCP not working

1. Close Cursor completely
2. Check `.cursor/mcp.json` exists
3. Reopen Cursor
4. Test: "Use playwright mcp to navigate to google.com"

### Tests keep failing

1. Verify app is running
2. Check SPECTRA_URL is correct
3. Review `.spectra/output/reports/healing-report.md`
4. Try more specific scope

### No CLI available

Use manual mode:

```bash
./spectra --url http://localhost:5173 --manual
```

### Batch mode needs jq

If using `--batch` option, install jq:

```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq  # Debian/Ubuntu
sudo yum install jq      # RHEL/CentOS
```

### Scope files not found in batch mode

1. Check file paths in JSON config or directory
2. Verify files exist: `ls -la SCOPE-*.md`
3. Use absolute paths if relative paths don't work
4. Check JSON syntax: `jq . scopes-batch.json`

---

## Files

```
my-tests/
├── spectra                     # ⭐ Main CLI (single + batch mode)
├── docs/                       # Documentation
│   └── SCOPE-template.md       # Scoping template
├── scopes-batch.json           # Batch config example
├── playwright.config.ts        # Playwright configuration
├── tsconfig.json               # TypeScript configuration
├── .cursor/mcp.json
├── .spectra/
│   ├── agents/
│   │   ├── planner/AGENT.md    # 🔵 Planner
│   │   ├── generator/AGENT.md  # 🟢 Generator
│   │   ├── healer/AGENT.md     # 🟣 Healer
│   │   └── shared/
│   │       ├── context.md       # Static context
│   │       └── current-scope.md # Runtime scope (created by CLI)
│   ├── lib/
│   │   └── common.sh            # Shared CLI utilities
│   └── output/
│       ├── plans/test-plan.md
│       ├── reports/
│       │   ├── healing-report.md
│       │   └── status.json      # Machine-readable status
│       └── test-results/        # Playwright test results
├── fixtures/
│   └── pages.ts                 # Reusable test fixtures
├── pages/                       # Generated Page Objects
└── tests/                       # Generated tests
```

---

<div align="center">

◐ ◑ ◒

**Spectra** — Full-spectrum test automation

</div>
