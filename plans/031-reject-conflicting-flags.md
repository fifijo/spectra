# Plan 031: A conflicting flag stops the run instead of being ignored

> **Executor instructions**: Follow this plan step by step. This plan adds one
> pure function and one guard to `src/cli.ts`, plus tests. Run every
> verification command.
>
> **Planned at**: commit `98a6d24`, 2026-11-12. Drift check (run first):
> `git diff --stat 98a6d24..HEAD -- src/cli.ts src/__tests__/cli.test.ts`

## Why this matters

`run()` dispatches on `options.mcp` before it looks at anything else
(`src/cli.ts:183-187`). So `spectra --mcp --url http://localhost:5173 --batch
scopes.json` starts an MCP server on stdio and never reads the batch file. The
terminal shows the usual banner and "Mode: mcp"; the user sees no error, and
the batch they asked for does not run. `--mode` and `--manual` are ignored the
same way (`runAsMcpServer` at `:118-178` never reads them), and `--init
--batch` returns after scaffolding (`:190-209`).

Every flag combination is accepted, so a typo in a CI script silently becomes
a different run. One guard turns that into an error message.

## Current state

`src/cli.ts:180-190` (verbatim):

```ts
export async function run(options: SpectraOptions = {}): Promise<boolean> {
  const cwd = process.cwd();

  // --mcp: serve the Spectrum over MCP, so the model the user is already
  // talking to (in a chat or a CLI) does the Agent work.
  if (options.mcp) {
    return runAsMcpServer(cwd, options);
  }

  // --init: scaffold project
  if (options.init) {
    logger.banner();
```

`SpectraOptions` (`src/cli.ts:22-34`) carries `url`, `page`, `scope`, `file`,
`batch`, `manual`, `mode`, `init`, `mcp`, `debug` — all optional.

`src/__tests__/cli.test.ts:696-706` — the `--mcp mode` tests call
`run({ mcp: true, url: 'http://localhost:5173' })`; they do not pass a
conflicting flag, so the new guard must leave them alone.

**Repo conventions**: the library never calls `process.exit` (AGENTS.md
invariant) — a bad configuration returns `false` from `run()` and the caller
decides. `logger.error` prints the message; `logger.plain('Run spectra --help
for usage information.')` is the existing follow-up line
(`src/cli.ts:123-127, 326-330`). Pure helpers live above the exported `run`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Lint, format, assists | `pnpm check` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Typecheck tests | `pnpm typecheck:test` | exit 0 |
| Unit tests | `pnpm test:unit` | 14 files, 180 tests (plus new) pass |

## Scope

**In scope**:
- `src/cli.ts` — one function, one guard in `run()`.
- `src/__tests__/cli.test.ts` — new tests inside `describe('run')`.

**Out of scope**:
- `src/args.ts` — argument *parsing* stays permissive; `parseCliArgs` is a
  mapping layer and `parseArgs` already rejects unknown flags.
- `printUsage()` — no new option, so no new help line.
- `runAsMcpServer`, `runScope` — do not add checks there; one guard in `run()`
  covers every combination.

## Git workflow

- Branch: `advisor/031-reject-conflicting-flags`
- Commit style: `fix: refuse a run whose flags contradict each other`
- Do not push or open a PR unless the operator asked for it.

## Steps

### Step 1: Describe the conflict, purely

In `src/cli.ts`, above `runAsMcpServer` (after `warnOnUntrustedFile` is fine),
add:

```ts
/**
 * Flags that cannot be combined: the first branch of `run()` wins and the
 * rest are never read, so the run would silently do something else.
 */
function flagConflict(options: SpectraOptions): string | null {
  if (options.mcp) {
    const ignored = [
      options.batch && '--batch',
      options.init && '--init',
      options.mode && '--mode',
      options.manual && '--manual',
    ].filter((flag): flag is string => typeof flag === 'string');
    if (ignored.length > 0) return `--mcp does not use ${ignored.join(', ')}`;
  }
  if (options.init && options.batch) return '--init does not use --batch';
  return null;
}
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 2: Guard `run()`

At the top of `run()`, before `const cwd = process.cwd();` or immediately
after it and before the `options.mcp` branch, add:

```ts
  const conflict = flagConflict(options);
  if (conflict) {
    logger.error(`Error: ${conflict}.`);
    logger.plain('Run spectra --help for usage information.');
    return false;
  }
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Test the guard

In `src/__tests__/cli.test.ts`, inside `describe('run')` (the block that
starts at `:64`, after the `beforeEach` helper `writeDeclaredOutputs`), add:

```ts
  describe('flags that contradict each other', () => {
    it('refuses --mcp with --batch instead of ignoring the batch', async () => {
      const ok = await run({ mcp: true, url: 'http://localhost:5173', batch: 'scopes.json' });

      expect(ok).toBe(false);
      expect(serveMcp).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('--batch'));
    });

    it('refuses --mcp with --mode, --manual or --init', async () => {
      for (const extra of [{ mode: 'codex' }, { manual: true }, { init: true }]) {
        vi.clearAllMocks();
        const ok = await run({ mcp: true, url: 'http://localhost:5173', ...extra });
        expect(ok).toBe(false);
        expect(serveMcp).not.toHaveBeenCalled();
      }
    });

    it('refuses --init with --batch', async () => {
      const ok = await run({ init: true, batch: 'scopes.json' });

      expect(ok).toBe(false);
      expect(scaffold).not.toHaveBeenCalled();
    });

    it('still serves MCP when nothing conflicts', async () => {
      const ok = await run({ mcp: true, url: 'http://localhost:5173' });

      expect(ok).toBe(true);
      expect(serveMcp).toHaveBeenCalled();
    });
  });
```

`serveMcp`, `scaffold` and `logger` are already imported and mocked at the top
of that file (`:24-50`). If `logger.error` is not already a `vi.fn()` there,
it is (`:34-46`).

**Verify**: `pnpm test:unit -- src/__tests__/cli.test.ts` → all tests pass.

### Step 4: Run the full gate

**Verify**: `pnpm check && pnpm typecheck && pnpm typecheck:test &&
pnpm test:unit` → all exit 0.

## Test plan

The four tests cover: the reported combination (`--mcp --batch`), the three
other flags `--mcp` swallows, the `--init --batch` pair, and the happy path
that must keep working. They assert the run returns `false` and that the
branch that would have been taken (`serveMcp`, `scaffold`) was not called —
that is the actual bug, not just the message.

## Done criteria

- `run({ mcp: true, url, batch })` returns `false`, logs an error naming
  `--batch`, and does not call `serveMcp`.
- `run({ mcp: true, url })` still returns `true` and calls `serveMcp`.
- `pnpm check && pnpm typecheck && pnpm typecheck:test && pnpm test:unit` pass.
- `process.exit` appears nowhere in `src/` except the two allowed places
  (`src/bin.ts:7`, `src/args.ts:58`) — the guard returns `false` instead.

## STOP conditions

- If `run()` no longer dispatches on `options.mcp` first, stop: the premise of
  the guard changed.
- If an existing test passes `--mcp` together with `--mode`/`--manual`/
  `--init` and expects success, stop and report the test — changing it is a
  behaviour decision, not this plan's.
- If a reviewer wants a warning instead of a refusal, stop: a warning still
  runs the wrong thing.

## Maintenance note

If a new flag is added that only one mode reads (for example a `--wait` for
manual mode), add it to `flagConflict` and to the `--mcp` list. The function is
the one place that encodes which flags are mode-specific; keep it that way.
