# Unit Testing

## Overview
Spectra uses **Vitest** (v4.x) for unit tests. Configuration is in `vitest.config.ts`.

## Commands
```bash
pnpm run test:unit           # run all unit tests once
pnpm run test:unit:watch     # run in watch mode
pnpm run test:unit:coverage  # run with V8 coverage
```

## Test File Locations
Test files follow the pattern `src/**/__tests__/**/*.test.ts`:

| Test File | What It Tests |
|-----------|--------------|
| `src/__tests__/bin.test.ts` | CLI argument parsing (re-implements `parseCliArgs` with `parseArgs`) |
| `src/__tests__/cli.test.ts` | `run()` function: init mode, URL validation, agent pipeline, batch mode, summary |
| `src/agents/__tests__/init.test.ts` | `initAgents()` template copying, `scaffold()` directory creation |
| `src/agents/__tests__/runner.test.ts` | `buildPrompt()` output, `runAgent()` mode dispatching |
| `src/utils/__tests__/constants.test.ts` | Constants values and types (`PACKAGE_ROOT`, `TEMPLATE_DIR`, `DEFAULTS`) |
| `src/utils/__tests__/detect-mode.test.ts` | `detectMode()` CLI tool detection logic |
| `src/utils/__tests__/logger.test.ts` | Logger ANSI color output for each method |
| `src/utils/__tests__/scope.test.ts` | `createScopeContext()` markdown generation |

## Coverage
```bash
pnpm run test:unit:coverage
```
- Provider: V8
- Includes: `src/**/*.ts`
- Excludes: `src/**/__tests__/**`

## Testing Conventions

### Mocking
- Use `vi.mock()` at the top of test files for module mocking
- Logger is always mocked to suppress console output in tests:
  ```typescript
  vi.mock('../utils/logger.js', () => ({
    logger: {
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      plain: vi.fn(),
      cyan: vi.fn(),
      magenta: vi.fn(),
      banner: vi.fn(),
      separator: vi.fn(),
    },
  }));
  ```
- `process.exit` is mocked via:
  ```typescript
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
    throw new Error('process.exit');
  }) as never);
  ```

### Temp Directories
Tests that write to the filesystem use temp directories:
```typescript
function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spectra-test-'));
}
```
Cleanup is done in `afterEach` with `fs.rmSync(d, { recursive: true, force: true })`.

### Import Style
Tests import from the `.js` extension (ESM resolution):
```typescript
import { run } from '../cli.js';
```

## Devin Secrets Needed
None required for unit testing.
