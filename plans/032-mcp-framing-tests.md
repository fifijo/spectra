# Plan 032: The MCP stdio loop is tested at its edges

> **Executor instructions**: Follow this plan step by step. This plan adds
> tests only; it changes no production code. If a new test exposes a real bug,
> stop and report it before changing `src/mcp/server.ts` (see STOP conditions).
>
> **Planned at**: commit `98a6d24`, 2026-11-12. Drift check (run first):
> `git diff --stat 98a6d24..HEAD -- src/mcp/server.ts src/mcp/__tests__/server.test.ts`

## Why this matters

Native mode (`spectra --mcp`) is one of the two ways a user drives the
Spectrum, and it speaks newline-delimited JSON-RPC on stdin/stdout. The host
model's requests are framed by the host, not by us: a JSON line can arrive in
two chunks, two requests can arrive in one chunk, and a host can close stdin
with the last request still missing its newline. `serveMcp`
(`src/mcp/server.ts:248-270`) handles all three, but only the simplest case is
tested (`src/mcp/__tests__/server.test.ts:291-307` writes one complete line and
asserts one response).

Measured coverage at `98a6d24`: `src/mcp/server.ts` is 79.74% statements and
65.38% branches, the lowest module in the repository; the uncovered lines are
267-268 (the end-of-input flush) and 277-284 (the parse-error reply). A framing
regression there breaks every MCP host, and a silent one is hard to notice
because the server simply stops replying.

## Current state

`src/mcp/server.ts:248-289`:

```ts
export function serveMcp(
  state: McpState,
  input: NodeJS.ReadableStream,
  output: NodeJS.WritableStream,
): void {
  let buffer = '';

  input.setEncoding('utf-8');
  input.on('data', (chunk: string) => {
    buffer += chunk;
    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) writeResponse(output, line, state);
      newline = buffer.indexOf('\n');
    }
  });
  input.on('end', () => {
    const line = buffer.trim();
    if (line) writeResponse(output, line, state);
  });
}

function writeResponse(output: NodeJS.WritableStream, line: string, state: McpState): void {
  let request: McpRequest;
  try {
    request = JSON.parse(line) as McpRequest;
  } catch {
    output.write(
      `${JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      })}\n`,
    );
    return;
  }

  const response = handleMcpRequest(request, state);
  if (response) output.write(`${JSON.stringify(response)}\n`);
}
```

The existing stdio test (`server.test.ts:291-307`), which the new tests should
follow:

```ts
  it('answers requests that arrive over stdio', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    const input = new PassThrough();
    const output = new PassThrough();
    const written: string[] = [];
    output.on('data', (chunk: Buffer) => written.push(chunk.toString('utf-8')));

    serveMcp(state, input, output);
    input.write(`${JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'tools/list' })}\n`);

    expect(written).toHaveLength(1);
    const response = JSON.parse(written[0]) as { result: { tools: unknown[] } };
    expect(response.result.tools).toHaveLength(3);
  });
```

`makeProject()` (`server.test.ts:16-53`) builds the temp project and the
`McpState`; `tmpDirs` is cleared in `afterEach`. `vi` is not imported in that
file today — add it if you use `vi.waitFor` (Step 1's third test needs it).

**Repo conventions**: Vitest, tests colocated under `src/**/__tests__/`; every
test gets its own `makeTmpDir()`-backed project; no real process, no real
sleep. Assertions read the parsed response, not the string.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Lint, format, assists | `pnpm check` | exit 0 |
| Typecheck tests | `pnpm typecheck:test` | exit 0 |
| Unit tests | `pnpm test:unit` | 14 files, 180 tests (plus new) pass |
| Coverage (optional check) | `pnpm test:unit:coverage` | exit 0 |

## Scope

**In scope**:
- `src/mcp/__tests__/server.test.ts` — new tests in the existing
  `describe('the MCP server', ...)` block.

**Out of scope**:
- `src/mcp/server.ts` — production code stays as it is unless a new test fails
  (see STOP conditions).
- `src/mcp/__tests__/server.test.ts`'s existing tests — do not rewrite them;
  add after `answers requests that arrive over stdio`.
- `src/__tests__/cli.test.ts` — the CLI's `--mcp` wiring is already covered
  there.

## Git workflow

- Branch: `advisor/032-mcp-framing-tests`
- Commit style: `test: cover the MCP stdio framing edges`
- Do not push or open a PR unless the operator asked for it.

## Steps

### Step 1: Add the four framing tests

In `src/mcp/__tests__/server.test.ts`, after the existing
`answers requests that arrive over stdio` test, add:

```ts
  it('answers a request that arrives in two chunks', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    const input = new PassThrough();
    const output = new PassThrough();
    const written: string[] = [];
    output.on('data', (chunk: Buffer) => written.push(chunk.toString('utf-8')));

    serveMcp(state, input, output);
    const line = JSON.stringify({ jsonrpc: '2.0', id: 12, method: 'tools/list' });
    input.write(line.slice(0, 10));
    expect(written).toHaveLength(0);

    input.write(`${line.slice(10)}\n`);

    expect(written).toHaveLength(1);
    expect((JSON.parse(written[0]) as { id: number }).id).toBe(12);
  });

  it('answers two requests that arrive in one chunk', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    const input = new PassThrough();
    const output = new PassThrough();
    const written: string[] = [];
    output.on('data', (chunk: Buffer) => written.push(chunk.toString('utf-8')));

    serveMcp(state, input, output);
    input.write(
      `${JSON.stringify({ jsonrpc: '2.0', id: 13, method: 'tools/list' })}\n` +
        `${JSON.stringify({ jsonrpc: '2.0', id: 14, method: 'tools/list' })}\n`,
    );

    const ids = written.map((line) => (JSON.parse(line) as { id: number }).id);
    expect(ids).toEqual([13, 14]);
  });

  it('answers a request that ends without a newline when the host closes stdin', async () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    const input = new PassThrough();
    const output = new PassThrough();
    const written: string[] = [];
    output.on('data', (chunk: Buffer) => written.push(chunk.toString('utf-8')));

    serveMcp(state, input, output);
    input.end(JSON.stringify({ jsonrpc: '2.0', id: 15, method: 'tools/list' }));

    await vi.waitFor(() => expect(written).toHaveLength(1));
    expect((JSON.parse(written[0]) as { id: number }).id).toBe(15);
  });

  it('answers a line that is not JSON with a parse error', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    const input = new PassThrough();
    const output = new PassThrough();
    const written: string[] = [];
    output.on('data', (chunk: Buffer) => written.push(chunk.toString('utf-8')));

    serveMcp(state, input, output);
    input.write('{not json}\n');

    const response = JSON.parse(written[0]) as {
      id: null;
      error: { code: number; message: string };
    };
    expect(response.id).toBeNull();
    expect(response.error).toEqual({ code: -32700, message: 'Parse error' });
  });

  it('writes nothing for a notification that arrives over stdio', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    const input = new PassThrough();
    const output = new PassThrough();
    const written: string[] = [];
    output.on('data', (chunk: Buffer) => written.push(chunk.toString('utf-8')));

    serveMcp(state, input, output);
    input.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);

    expect(written).toHaveLength(0);
  });
```

If `vi` is not imported at the top of the file, change
`import { afterEach, beforeEach, describe, expect, it } from 'vitest';` to
include `vi`.

**Verify**: `pnpm test:unit -- src/mcp/__tests__/server.test.ts` → all tests
pass.

### Step 2: Confirm the edges are now covered

**Verify**: `pnpm test:unit:coverage` → exit 0, and the report for
`src/mcp/server.ts` no longer lists 267-268 or 277-284 as uncovered. (Other
lines may remain uncovered; that is fine.)

### Step 3: Run the full gate

**Verify**: `pnpm check && pnpm typecheck && pnpm typecheck:test &&
pnpm test:unit` → all exit 0.

## Test plan

The five tests are the test plan, one per behaviour:
- a line split across chunks must not be answered early (asserts zero
  responses after the first half — this is the assertion that would have caught
  a naive `JSON.parse` per chunk);
- two lines in one chunk must produce two responses, in order;
- the final unterminated line must be answered when stdin ends;
- a malformed line gets the `-32700` reply with `id: null`;
- a notification gets no reply at all.

## Done criteria

- Five new tests pass; none of the existing tests changed.
- `pnpm check && pnpm typecheck && pnpm typecheck:test && pnpm test:unit` pass.
- Only `src/mcp/__tests__/server.test.ts` changed.

## STOP conditions

- If a new test fails, do not "fix" the test to match the code: the framing
  behaviour is the contract. Report the failing test and the observed output,
  and stop.
- If `serveMcp` or `writeResponse` no longer match the excerpt (for example
  someone moved to a different framing), stop and re-plan against the current
  code.
- If `PassThrough` end-of-stream proves flaky in this test runner, use an
  explicit `Readable` stub that emits `data` then `end`; report the change in
  the commit body. Do not add a timer-based sleep.

## Maintenance note

These tests pin the host-facing framing contract. If the server ever moves to
Content-Length framing (MCP's streamable HTTP transport) or gains JSON-RPC
batch arrays, the last two tests are the ones to revisit: `id: null` and
"nothing for a notification" are the shapes a host depends on.
