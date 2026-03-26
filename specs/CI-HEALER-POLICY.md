# CI and Healer Policy

Configuration, retry limits, and triage rules for CI runs and the Healer agent.

## CI configuration

### Trace and report settings

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { outputFolder: '.spectra/output/reports' }],
    ['json', { outputFile: '.spectra/output/reports/results.json' }],
    ['list'],
  ],
  use: {
    trace: 'on-first-retry',        // capture trace on first retry
    screenshot: 'only-on-failure',   // screenshot on failure
    video: 'retain-on-failure',      // optional: video on failure
  },
});
```

### Artifact upload

CI must upload the following artifacts on every run (pass or fail):

| Artifact | Path | Retention |
|----------|------|-----------|
| HTML report | `.spectra/output/reports/` | 30 days |
| JSON results | `.spectra/output/reports/results.json` | 30 days |
| Traces | `.spectra/output/test-results/` | 7 days |
| Screenshots | `.spectra/output/test-results/` | 7 days |

## Healer retry limits

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Max attempts per test | 3 | Prevents infinite loops |
| Max total Healer cycles | 5 | Bounds wall-clock time |
| Timeout per attempt | 60 seconds | Matches Playwright default |

### Rules

1. **No assertion weakening** - The Healer must never reduce assertion strength to make a test pass (e.g., removing an `expect` or changing `toEqual` to `toBeTruthy` without review).
2. **Locator fixes only** - Automatic fixes are limited to locator updates and timing adjustments. Logic changes require human review.
3. **Report every fix** - Every change is logged in `.spectra/output/reports/healing-report.md` with before/after diff.

## Failure triage

When a test fails, classify it into one of four categories:

### 1. Real bug

- **Signal**: Assertion fails on business logic (e.g., wrong price, missing data, broken flow).
- **Action**: File a bug in the work tracker. Do **not** merge Healer patches that hide the bug.
- **Test status**: Keep test failing; tag with `@blocked` and link the bug.

### 2. Locator drift

- **Signal**: Element not found, but feature works manually.
- **Action**: Healer updates the locator in the Page Object. Bounded by retry limits above.
- **Test status**: Should pass after Healer fix.

### 3. Flake

- **Signal**: Test passes on retry without any code change; intermittent timing issues.
- **Action**:
  1. Review trace to identify the race condition.
  2. Fix the race in the app or the test (prefer app fix).
  3. If not immediately fixable, tag with `@flaky` and open a follow-up ticket.
- **Test status**: Quarantine with `@flaky` tag; exclude from blocking CI if quarantined.

### 4. Environment issue

- **Signal**: Network timeout, service unavailable, database down, preview URL 404.
- **Action**: Open an infra ticket. Re-run CI when environment is restored.
- **Test status**: Do not modify tests; mark run as env failure.

## Triage flowchart

```
Test failed
  ├── Assertion on business logic? → Real bug → file bug, do not patch
  ├── Element not found?
  │     ├── Feature works manually? → Locator drift → Healer fix (max 3 attempts)
  │     └── Feature broken? → Real bug
  ├── Passes on retry? → Flake → trace analysis, fix race or quarantine
  └── Network/service error? → Env issue → infra ticket
```

## Status file

After every Healer run, write `.spectra/output/reports/status.json`:

```json
{
  "timestamp": "ISO-8601",
  "total": 10,
  "passed": 9,
  "failed": 1,
  "healed": 2,
  "flaky": 0,
  "blocked": 1,
  "healerAttempts": 3,
  "failures": [
    {
      "test": "checkout.spec.ts > should calculate tax",
      "category": "bug",
      "error": "Expected 10.50, received 0",
      "trackerLink": "PROJ-456"
    }
  ]
}
```
