# Spectra Shared Context

## The Spectrum
```
◐ PLANNER   → Explores app, creates the Plan
◑ GENERATOR → Reads plan, creates tests
◒ HEALER    → Runs tests, fixes failures
```

## Project Structure
```
├── tests/                    # Test files (*.spec.ts)
├── pages/                    # Page Objects (*Page.ts)
├── fixtures/                 # Test fixtures
├── specs/                    # Markdown plans and gate documentation
├── .spectra/
│   ├── agents/
│   │   ├── planner/          # Planner Agent
│   │   ├── generator/        # Generator Agent
│   │   ├── healer/           # Healer Agent
│   │   └── shared/           # Shared context
│   └── output/
│       ├── plans/            # The Plan
│       ├── tests/            # The Generator's completion signal
│       ├── reports/          # Results & healing reports
│       ├── evidence/         # Screenshots and videos the Agents took
│       └── test-results/     # Playwright artifacts
└── playwright.config.ts
```

## Agent Communication
Agents communicate via files:
- Planner → Generator: `.spectra/output/plans/test-plan.md`
- Generator → Healer: `tests/`, `pages/`
- Healer → Reports: `.spectra/output/reports/`

## The browser

The Agents explore the application in a browser. The tools come from the
Playwright MCP server: `browser_navigate`, `browser_snapshot`,
`browser_take_screenshot` and the rest.

- If your host lists MCP tools directly, call them by name.
- If your host exposes MCP tools through a code-mode executor, call them from
  there: `tools.playwright.browser_navigate({ url: "..." })`.
- If the tools are really not there, write the gap into your output. Never
  invent what the application looks like.

## Completion Signals
- Planner done: `.spectra/output/plans/.complete`
- Generator done: `.spectra/output/tests/.complete`
- Healer done: `.spectra/output/reports/.complete`
