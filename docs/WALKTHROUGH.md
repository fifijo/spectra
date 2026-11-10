# Spectra Walkthrough

Step-by-step guide to full-spectrum test automation.

---

## Quick Start (TL;DR)

```bash
# 1. Install
pnpm add -D spectra-test-automation @playwright/test
npx spectra --init
pnpm exec playwright install chromium

# 2. Start your app (separate terminal)
cd /your/app && pnpm dev

# 3. Run Spectra
npx spectra --url http://localhost:5173

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
│  npx spectra --url http://localhost:5173 --scope "login form"  │
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
│  5. Re-runs tests: All pass                                     │
│                                                                 │
│  6. Writes: .spectra/output/reports/healing-report.md          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SPECTRUM COMPLETE                                              │
│                                                                 │
│  pages/LoginPage.ts     ← Page Object (fixed)                  │
│  tests/login.spec.ts    ← Working tests                         │
│                                                                 │
│  $ npx playwright test                                          │
│  ✓ login.spec.ts (3 tests)                                     │
│  3 passed                                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Install

### Option A: Install as npm package

```bash
# In your project directory
pnpm add -D spectra-test-automation @playwright/test

# Scaffold project structure
npx spectra --init

# Install Playwright browsers
pnpm exec playwright install chromium
```

Creates:
- Playwright + Chromium
- 3 agents (Planner, Generator, Healer)
- MCP configuration
- `spectra` CLI (via `npx spectra`)

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
npx spectra --url http://localhost:5173
```

### Single Page

```bash
npx spectra --url http://localhost:5173 --page /login
```

### Specific Feature

```bash
npx spectra --url http://localhost:5173 --page /checkout --scope "payment form"
```

### With Scope File

```bash
cp docs/SCOPE-template.md SCOPE.md
# Edit SCOPE.md
npx spectra --url http://localhost:5173 --file SCOPE.md
```

### Multiple Scopes (Batch Mode)

Run multiple scopes sequentially using a batch JSON config:

```bash
npx spectra --batch scopes-batch.json
```

> See [BATCH-CONFIG.md](BATCH-CONFIG.md) for complete JSON schema documentation.

---

## Step 4: Check Results

```bash
# Run tests
npx playwright test

# Run seed spec to verify environment
npx playwright test tests/seed.spec.ts

# View report
npx playwright show-report .spectra/output/reports

# Check generated files
ls pages/    # Page Objects
ls tests/    # Test files

# Cross-browser testing
SPECTRA_BROWSERS=firefox npx playwright test
SPECTRA_BROWSERS=all npx playwright test    # All browsers + mobile

# Filter by tags
npx playwright test --grep @smoke         # Only smoke tests
npx playwright test --grep-invert @slow   # Skip slow tests
```

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `npx spectra --init` | Scaffold project structure |
| `npx spectra -u URL` | Full spectrum scan |
| `npx spectra -u URL -p /page` | Single page focus |
| `npx spectra -u URL -s "feature"` | Feature scope |
| `npx spectra -u URL -f SCOPE.md` | Detailed scope file |
| `npx spectra -u URL -m` | Manual Cursor mode |
| `npx spectra -u URL --debug` | Enable debug output |
| `npx spectra -b FILE.json` | Run scopes from JSON config |
| `npx playwright test` | Run all tests |
| `npx playwright test tests/seed.spec.ts` | Run seed spec only |
| `npx playwright test --headed` | Run with visible browser |
| `npx playwright test --ui` | Run with Playwright UI |
| `npx playwright test --grep @tag` | Filter by tag |
| `npx playwright show-report .spectra/output/reports` | View HTML report |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPECTRA_URL` | Base URL for tests | (none — required) |
| `SPECTRA_BROWSERS` | Browsers to test | `chromium` |
| `SPECTRA_TAGS` | Filter tests by tags | (all tests) |
| `SPECTRA_DEBUG` | Enable debug output | (unset) |

---

## Examples

### E-commerce Checkout

```bash
# Test only payment, not shipping/cart
npx spectra \
  --url http://localhost:5173 \
  --page /checkout \
  --scope "credit card payment form"
```

### User Settings

```bash
# Test only password change
npx spectra \
  --url http://localhost:5173 \
  --page /settings \
  --scope "change password"
```

### Dashboard Widget

```bash
# Test only analytics chart
npx spectra \
  --url http://localhost:5173 \
  --page /dashboard \
  --scope "revenue chart"
```

### Multiple Scopes (Batch Mode)

```bash
# Use batch JSON config
npx spectra --batch scopes-batch.json
```

> See [BATCH-CONFIG.md](BATCH-CONFIG.md) for the JSON schema and examples.

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
npx spectra --url http://localhost:5173 --manual
```

Spectra writes the prompt of each agent to `.spectra/agents/<agent>/current-prompt.md`
and waits until that agent writes its completion signal
(`.spectra/output/plans/.complete`, `.spectra/output/tests/.complete`,
`.spectra/output/reports/.complete`) before starting the next one.
If the signal does not arrive within 30 minutes, the run stops with an error.

### Scope files not found in batch mode

1. Check file paths in batch JSON config
2. Verify files exist: `ls -la SCOPE-*.md`
3. Use absolute paths if relative paths don't work

---

## Files

```
spectra/
├── src/                        # TypeScript source (CLI & library)
│   ├── bin.ts                  # CLI entry point
│   ├── args.ts                 # Command line parsing
│   ├── cli.ts                  # Public API (library module)
│   ├── agents/                 # Agent runner & scaffolding
│   └── utils/                  # Shared utilities
├── dist/                       # Compiled output (npm package)
├── templates/                  # Shipped with the package
│   ├── agents/                 # Agent definitions (Planner, Generator, Healer)
│   ├── docs/                   # Scope template
│   └── fixtures/               # Test fixture template
├── specs/                      # Pipeline gate docs & Markdown plans
├── tests/e2e/                  # End-to-end seed & integration tests
│   └── seed.spec.ts            # Environment readiness contract
├── docs/                       # Documentation
│   └── SCOPE-template.md       # Scoping template
├── scopes-batch.json           # Batch config example
├── playwright.config.ts        # Playwright configuration
├── tsconfig.json               # TypeScript build config
├── tsconfig.test.json          # TypeScript config for Playwright tests
├── package.json                # npm package definition
├── .spectra/                   # Generated via --init
│   ├── agents/
│   │   ├── planner/AGENT.md    # 🔵 Planner
│   │   ├── generator/AGENT.md  # 🟢 Generator
│   │   ├── healer/AGENT.md     # 🟣 Healer
│   │   └── shared/
│   │       ├── context.md       # Static context
│   │       └── current-scope.md # Runtime scope (created by CLI)
│   └── output/
│       ├── plans/test-plan.md
│       ├── tests/               # The Generator's completion signal
│       ├── reports/
│       │   ├── healing-report.md
│       │   └── status.json      # Machine-readable status
│       ├── scopes/              # One folder per scope in a batch
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
