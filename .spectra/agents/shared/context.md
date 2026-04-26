# Spectra Shared Context

## The Spectrum
```
◐ PLANNER   → Explores app, creates test plan
◑ GENERATOR → Reads plan, creates tests
◒ HEALER    → Runs tests, fixes failures
```

## Project Structure
```
├── tests/                    # Test files (*.spec.ts)
├── tests/e2e/                # End-to-end seed and integration tests
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
│       ├── plans/            # Test plans
│       └── reports/          # Results & healing reports
└── playwright.config.ts
```

## Agent Communication
Agents communicate via files:
- Planner → Generator: `.spectra/output/plans/test-plan.md`
- Generator → Healer: `tests/`, `pages/`
- Healer → Reports: `.spectra/output/reports/`

## Completion Signals
- Planner done: `.spectra/output/plans/.complete`
- Generator done: `.spectra/output/tests/.complete`
- Healer done: `.spectra/output/reports/.complete`
