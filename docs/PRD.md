# Product Requirements Document (PRD)

## Spectra — Full-Spectrum Test Automation

**Version:** 1.0  
**Last Updated:** February 2025  
**Status:** Based on codebase analysis

---

## 1. Executive Summary

**Spectra** is an AI-powered end-to-end test automation tool that generates, runs, and self-heals Playwright tests with minimal developer intervention. It uses a three-agent pipeline (Planner → Generator → Healer) orchestrated via a CLI, leveraging Playwright MCP for browser automation and AI agents (Cursor Agent or Claude Code) for intelligent test generation and failure remediation.

**Tagline:** *One command. Complete coverage.*

---

## 2. Product Vision & Goals

### Vision
Enable developers to achieve comprehensive E2E test coverage without manual test authoring. Spectra explores applications, generates maintainable Playwright tests with Page Object Model patterns, and automatically fixes failures when the UI changes.

### Goals
- **Reduce test authoring time** — From hours to minutes via AI-generated tests
- **Improve test maintainability** — Semantic locators (getByRole, getByLabel) over brittle selectors
- **Self-healing** — Automatic locator updates when UI changes
- **Targeted coverage** — Feature-scoped testing instead of full-page bloat
- **CI-ready** — Generated tests run in standard Playwright pipelines

---

## 3. Target Users

| Persona | Use Case | Primary Need |
|---------|----------|--------------|
| **Frontend Developer** | Add E2E tests to new feature | Quick test generation without learning Playwright deeply |
| **QA Engineer** | Expand regression coverage | Systematic exploration and test generation |
| **DevOps / CI Engineer** | Integrate tests into pipeline | Standard Playwright output, HTML reports, JSON results |
| **Tech Lead** | Establish testing standards | Page Object Model, semantic locators, fixtures pattern |

---

## 4. Core Features

### 4.1 Multi-Agent Pipeline

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| **🔵 Planner** | Explores app via browser | URL, scope constraints | `test-plan.md` |
| **🟢 Generator** | Creates Page Objects & tests | Test plan | `pages/*.ts`, `tests/*.spec.ts`, `fixtures/pages.ts` |
| **🟣 Healer** | Runs tests, fixes failures | Test files, failures | Passing tests, `healing-report.md` |

**Flow:** Planner → Generator → Healer (sequential, completion signals via `.complete` files)

### 4.2 Scoping Modes

| Mode | CLI | Description |
|------|-----|-------------|
| **Full spectrum** | `--url URL` | Explore entire app, all pages |
| **Single page** | `--page PATH` | Focus on one route (e.g., `/checkout`) |
| **Feature scope** | `--scope TEXT` | Test only specified feature on page (e.g., "payment form") |
| **Scope file** | `--file SCOPE.md` | Detailed requirements from markdown template |

### 4.3 Execution Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Automated** | `cursor-agent` or `claude` CLI installed | Agents run without user intervention |
| **Manual** | `--manual` or no CLI | User runs each agent in Cursor via prompts |

### 4.4 Batch Mode (Documented)

*Note: Batch options are documented in README and QUICK-REFERENCE but may require implementation in the main `spectra` script.*

- `--files FILE1 FILE2` — Multiple scope files
- `--scopes-dir DIR` — Directory of `SCOPE-*.md` files
- `--batch FILE.json` — JSON config with scope definitions

**Batch JSON schema** (from `docs/BATCH-CONFIG.md`):
```json
{
  "url": "string (optional)",
  "scopes": [
    {
      "name": "string (optional)",
      "file": "string (required)",
      "description": "string (optional)"
    }
  ]
}
```

### 4.5 Page Object Model & Fixtures

- **Page Objects** — Generated in `pages/` with semantic locators
- **Fixtures** — `fixtures/pages.ts` provides reusable page fixtures for tests
- **Locator priority** — `getByRole` > `getByLabel` > `getByTestId` > `getByText` (no CSS/XPath)

### 4.6 Test Tags

Generated tests support filtering via tags:
- `@smoke` — Quick sanity
- `@critical` — Business-critical paths
- `@e2e` — Full flows
- `@slow` — Long-running
- `@flaky` — Known flaky

---

## 5. Technical Architecture

### 5.1 Stack

| Component | Technology |
|-----------|------------|
| Test framework | Playwright |
| Language | TypeScript |
| Package manager | pnpm |
| Browser automation (agents) | Playwright MCP |
| AI execution | cursor-agent, Claude Code CLI |
| IDE integration | Cursor + MCP |

### 5.2 Project Structure

```
spectra/
├── spectra                 # Main CLI (bash)
├── setup-spectra.sh        # Setup script
├── package.json            # Playwright, TypeScript
├── playwright.config.ts
├── tsconfig.json
├── .cursor/mcp.json        # Playwright MCP config
├── .spectra/
│   ├── agents/
│   │   ├── planner/        # AGENT.md, prompt.md
│   │   ├── generator/     # AGENT.md, prompt.md
│   │   ├── healer/        # AGENT.md, prompt.md
│   │   └── shared/        # context.md, current-scope.md (runtime)
│   ├── lib/common.sh
│   └── output/
│       ├── plans/          # test-plan.md, .complete
│       ├── reports/        # results.json, healing-report.md, status.json
│       └── test-results/
├── pages/                  # Generated Page Objects
├── tests/                  # Generated test files
├── fixtures/pages.ts       # Reusable fixtures
├── docs/
│   ├── BATCH-CONFIG.md
│   ├── QUICK-REFERENCE.md
│   ├── SCOPE-template.md
│   └── WALKTHROUGH.md
├── scopes-batch.json       # Example batch config
├── dummy-test-app/         # Reference React app for testing
└── .github/workflows/test.yml
```

### 5.3 Agent Communication

- **Planner → Generator:** `.spectra/output/plans/test-plan.md`
- **Generator → Healer:** `pages/`, `tests/`, `fixtures/pages.ts`
- **Healer → Reports:** `.spectra/output/reports/healing-report.md`, `results.json`
- **Completion signals:** `.spectra/output/plans/.complete`, `tests/.complete`, `reports/.complete`

### 5.4 MCP Integration

Playwright MCP (`@playwright/mcp`) provides:
- `browser_navigate` — Navigate to URL
- `browser_snapshot` — Accessibility tree / DOM state
- Additional browser automation for exploration and healing

Config: `.cursor/mcp.json` → `npx @playwright/mcp@latest --browser chromium`

---

## 6. CLI Specification

### 6.1 Single-Scope Options

| Option | Short | Required | Description |
|--------|-------|----------|-------------|
| `--url` | `-u` | Yes* | Target URL (*or `SPECTRA_URL`) |
| `--page` | `-p` | No | Specific page path |
| `--scope` | `-s` | No | Feature to focus on |
| `--file` | `-f` | No | Scope file path |
| `--manual` | `-m` | No | Force manual Cursor mode |
| `--help` | `-h` | No | Show help |

### 6.2 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPECTRA_URL` | Base URL for tests | `http://localhost:5173` |
| `SPECTRA_BROWSERS` | Browsers (chromium, firefox, webkit, mobile, all) | `chromium` |
| `SPECTRA_TAGS` | Filter tests by tags | (all) |
| `SPECTRA_DEBUG` | Enable debug output | (unset) |

### 6.3 NPM Scripts

| Script | Command |
|--------|---------|
| `pnpm test` | Run Playwright tests |
| `pnpm test:ui` | Playwright UI mode |
| `pnpm test:headed` | Visible browser |
| `pnpm report` | View HTML report |
| `pnpm spectra` | Run Spectra CLI |

---

## 7. Scope Definition Template

The `docs/SCOPE-template.md` provides structure for detailed scoping:

- **Target Feature** — Name, description
- **Location** — Page URL, section
- **Elements to Test** — Checklist
- **User Flows** — Happy path, error cases
- **Out of Scope** — Explicit exclusions
- **Test Data** — Valid/invalid inputs

---

## 8. Dummy Test App (Reference)

The `dummy-test-app/` is a React + Vite application used for demos and CI:

| Page | Route | Features |
|------|-------|----------|
| Dashboard | `/` | Stats grid, overview chart, recent sales |
| Tasks | `/tasks` | Task CRUD, filter (all/pending/completed), priority |
| Products | `/products` | Product catalog |
| Settings | `/settings` | User settings |

**Stack:** React 19, React Router 7, Vite 7, Tailwind CSS 4, Radix UI, shadcn/ui, Lucide icons.

**Testability:** Uses `data-testid` attributes for key elements (e.g., `main-navigation`, `stats-grid`, `task-item-{id}`).

---

## 9. CI/CD Integration

### 9.1 GitHub Actions

Workflow: `.github/workflows/test.yml`

**Triggers:** Push/PR to `main`/`master`, `workflow_dispatch`

**Steps:**
1. Checkout, pnpm setup, Node 22
2. Install dependencies, Playwright Chromium
3. Install & start `dummy-test-app` (Vite dev server)
4. Wait for app (curl polling)
5. Run `pnpm test` with `SPECTRA_URL`, `CI=true`
6. Upload reports to artifacts (30 days)
7. On failure: upload test artifacts (7 days)

### 9.2 Playwright Config (CI)

- `forbidOnly: true` in CI
- `retries: 2` in CI
- `workers: 1` in CI
- Reporters: HTML, JSON, list
- Output: `.spectra/output/reports`, `.spectra/output/test-results`

---

## 10. Prerequisites & Setup

### 10.1 Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | LTS (v20+, v22 recommended) |
| pnpm | Latest |
| Git | Any |

### 10.2 Setup

```bash
chmod +x setup-spectra.sh
./setup-spectra.sh
```

**Creates:** Playwright + Chromium, agent definitions, MCP config, folder structure, fixtures, scope template.

### 10.3 Optional: CLI Tools for Automation

- **cursor-agent:** `curl https://cursor.com/install -fsS | bash`
- **Claude Code:** `npm install -g @anthropic-ai/claude-code`

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Time to first test | < 5 minutes (setup + run) |
| Test generation | Full pipeline in single command |
| Healing success | Auto-fix common locator failures |
| Locator quality | Semantic only (no CSS/XPath) |
| CI compatibility | Standard Playwright output |

---

## 12. Known Gaps & Future Work

| Area | Status | Notes |
|------|--------|-------|
| Batch mode | Documented, partial impl | `--files`, `--scopes-dir`, `--batch` in docs; main `spectra` script may need updates |
| Batch JSON schema | Inconsistent | `scopes-batch.json` uses `page`/`scope`; BATCH-CONFIG uses `file` |
| `--debug` | Documented | Not implemented in current spectra script |
| Cross-browser | Env var only | `SPECTRA_BROWSERS` — playwright.config uses single chromium project |
| .spectra/agents | Created by setup | Not in repo; generated by `setup-spectra.sh` |

---

## 13. Appendix

### A. Agent Instructions Summary

- **Planner:** Read scope → Navigate with MCP → Snapshot → Document elements/flows → Write test plan
- **Generator:** Read plan → Check fixtures → Generate Page Objects → Update fixtures → Generate tests (use fixtures when available)
- **Healer:** Run tests → Parse failures → Inspect UI with MCP → Fix locators → Re-run (max 3 attempts per test)

### B. Key Dependencies

- `@playwright/test` ^1.57.0
- `typescript` ^5.9.3
- `@types/node` ^25.0.9

### C. License

MIT (see LICENSE file)

---

*This PRD is derived from codebase analysis. For implementation details, refer to source files and agent definitions.*
