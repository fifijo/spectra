import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AGENTS } from '../../agents/catalogue.js';
import { takeSnapshot } from '../../agents/verify.js';
import { handleMcpRequest, type McpState, serveMcp } from '../server.js';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spectra-mcp-'));
}

/** A project with the agent templates and the output dir in place. */
function makeProject(existing: Record<string, string> = {}): { cwd: string; state: McpState } {
  const cwd = makeTmpDir();
  const agentsDir = path.join(cwd, '.spectra', 'agents');
  const outputDir = path.join(cwd, '.spectra', 'output');

  fs.mkdirSync(path.join(agentsDir, 'planner'), { recursive: true });
  fs.mkdirSync(path.join(agentsDir, 'shared'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'plans'), { recursive: true });
  fs.writeFileSync(
    path.join(agentsDir, 'planner', 'AGENT.md'),
    '# Planner\n\nExplore it.',
    'utf-8',
  );
  fs.writeFileSync(
    path.join(agentsDir, 'shared', 'current-scope.md'),
    '# Current Spectra Scope',
    'utf-8',
  );

  // Files that were already there when the run started.
  for (const [relative, content] of Object.entries(existing)) {
    const full = path.join(outputDir, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }

  return {
    cwd,
    state: {
      outputDir,
      agentsDir,
      projectRoot: cwd,
      agents: AGENTS,
      index: 0,
      snapshot: takeSnapshot(AGENTS, outputDir, cwd),
    },
  };
}

/** The tool result as the host model sees it: the JSON text of the payload. */
function toolPayload(result: unknown): Record<string, unknown> {
  const content = (result as { content: { type: string; text: string }[] }).content;
  return JSON.parse(content[0].text) as Record<string, unknown>;
}

describe('the MCP server', () => {
  const tmpDirs: string[] = [];
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it('answers the initialize handshake', () => {
    const { state } = makeProject();
    tmpDirs.push(state.outputDir);

    const response = handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' }, state);

    expect(response?.result).toMatchObject({ protocolVersion: '2024-11-05' });
    expect((response?.result as { serverInfo: { name: string } }).serverInfo.name).toBe('spectra');
  });

  it('lists the tools the host model can call', () => {
    const { state } = makeProject();
    tmpDirs.push(state.outputDir);

    const response = handleMcpRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, state);
    const tools = (response?.result as { tools: { name: string }[] }).tools;

    expect(tools.map((t) => t.name)).toEqual(['spectra_next', 'spectra_done', 'spectra_status']);
  });

  it('gives the host model the brief of the next Agent', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    const response = handleMcpRequest(
      { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'spectra_next' } },
      state,
    );
    const payload = toolPayload(response?.result);

    expect(payload.agent).toBe('planner');
    expect(String(payload.instructions)).toContain('Explore it.');
    expect(String(payload.scope)).toContain('Current Spectra Scope');
    expect(payload.write).toContain(path.join('.spectra', 'output', 'plans', 'test-plan.md'));
  });

  it('refuses to finish an Agent that wrote nothing', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    const response = handleMcpRequest(
      {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'spectra_done', arguments: { agent: 'planner' } },
      },
      state,
    );
    const payload = toolPayload(response?.result);

    expect((response?.result as { isError?: boolean }).isError).toBe(true);
    expect(payload.missing).toContain(path.join('.spectra', 'output', 'plans', 'test-plan.md'));
    expect(fs.existsSync(path.join(state.outputDir, 'plans', '.complete'))).toBe(false);
  });

  it('writes the completion signal and hands over the next Agent', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    fs.mkdirSync(path.join(state.outputDir, 'plans'), { recursive: true });
    fs.writeFileSync(path.join(state.outputDir, 'plans', 'test-plan.md'), '# Plan', 'utf-8');

    const response = handleMcpRequest(
      {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'spectra_done', arguments: { agent: 'planner' } },
      },
      state,
    );
    const payload = toolPayload(response?.result);

    expect(fs.existsSync(path.join(state.outputDir, 'plans', '.complete'))).toBe(true);
    expect(payload.agent).toBe('generator');
    expect(payload.done).toBe(false);
  });

  it('ends the Spectrum after the last Agent', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    state.index = AGENTS.length - 1;
    const healer = AGENTS[AGENTS.length - 1];

    fs.mkdirSync(path.join(state.outputDir, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(state.outputDir, 'reports', 'healing-report.md'),
      '# Report',
      'utf-8',
    );
    fs.writeFileSync(path.join(state.outputDir, 'reports', 'status.json'), '{}', 'utf-8');
    // The Healer causes Playwright to write the results: the run reads them.
    fs.writeFileSync(
      path.join(state.outputDir, 'reports', 'results.json'),
      JSON.stringify({ stats: { expected: 2, unexpected: 0, flaky: 0, skipped: 0 } }),
      'utf-8',
    );
    fs.mkdirSync(path.join(cwd, 'pages'), { recursive: true });
    fs.mkdirSync(path.join(cwd, 'tests'), { recursive: true });

    const response = handleMcpRequest(
      {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'spectra_done', arguments: { agent: healer.name } },
      },
      state,
    );
    const payload = toolPayload(response?.result);

    expect(payload.done).toBe(true);
    expect(fs.existsSync(path.join(state.outputDir, 'reports', '.complete'))).toBe(true);
  });

  it('refuses to finish the Generator that wrote no test', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    // A scaffolded project already has these folders, but they are empty.
    fs.mkdirSync(path.join(cwd, 'pages'), { recursive: true });
    fs.mkdirSync(path.join(cwd, 'tests'), { recursive: true });

    state.index = 1; // the Generator is running
    const response = handleMcpRequest(
      {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: { name: 'spectra_done', arguments: { agent: 'generator' } },
      },
      state,
    );

    expect((response?.result as { isError?: boolean }).isError).toBe(true);
    expect(state.index).toBe(1);
    expect(fs.existsSync(path.join(state.outputDir, 'tests', '.complete'))).toBe(false);
  });

  it('finishes the Generator that wrote a test', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    fs.mkdirSync(path.join(cwd, 'tests'), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, 'tests', 'login.spec.ts'),
      "test('logs in', async ({ page }) => { await expect(page).toBeVisible(); })",
      'utf-8',
    );

    state.index = 1; // the Generator is running
    const response = handleMcpRequest(
      {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: { name: 'spectra_done', arguments: { agent: 'generator' } },
      },
      state,
    );

    expect((response?.result as { isError?: boolean }).isError).toBeUndefined();
    expect(state.index).toBe(2);
  });

  it('refuses to finish the Generator that wrote a test with no assertion', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    fs.mkdirSync(path.join(cwd, 'tests'), { recursive: true });
    fs.writeFileSync(path.join(cwd, 'tests', 'login.spec.ts'), 'test("x", async () => {});');

    state.index = 1; // the Generator is running
    const response = handleMcpRequest(
      {
        jsonrpc: '2.0',
        id: 16,
        method: 'tools/call',
        params: { name: 'spectra_done', arguments: { agent: 'generator' } },
      },
      state,
    );
    const payload = toolPayload(response?.result);

    expect((response?.result as { isError?: boolean }).isError).toBe(true);
    expect(String(payload.error)).toContain('break the rules');
    expect(state.index).toBe(1);
  });

  it('refuses a plan that was already there when the run started', () => {
    const { cwd, state } = makeProject({ 'plans/test-plan.md': 'OLD PLAN' });
    tmpDirs.push(cwd);
    process.chdir(cwd);

    const response = handleMcpRequest(
      {
        jsonrpc: '2.0',
        id: 10,
        method: 'tools/call',
        params: { name: 'spectra_done', arguments: { agent: 'planner' } },
      },
      state,
    );

    expect((response?.result as { isError?: boolean }).isError).toBe(true);
    expect(state.index).toBe(0);
  });

  it('refuses to finish an Agent that is not the running one', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    // The Planner is running, the host says the Generator is done.
    const response = handleMcpRequest(
      {
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: { name: 'spectra_done', arguments: { agent: 'generator' } },
      },
      state,
    );

    expect((response?.result as { isError?: boolean }).isError).toBe(true);
    expect(state.index).toBe(0);
  });

  it('says what the Playwright config has to write when there are no results', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    fs.mkdirSync(path.join(state.outputDir, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(state.outputDir, 'reports', 'healing-report.md'),
      '# Report',
      'utf-8',
    );
    fs.writeFileSync(path.join(state.outputDir, 'reports', 'status.json'), '{}', 'utf-8');
    state.index = AGENTS.length - 1;

    const response = handleMcpRequest(
      {
        jsonrpc: '2.0',
        id: 15,
        method: 'tools/call',
        params: { name: 'spectra_done', arguments: { agent: 'healer' } },
      },
      state,
    );
    const payload = toolPayload(response?.result);

    expect(payload.error).toContain('did not write everything');
    expect(String(payload.hint)).toContain('has to write the JSON report');
  });

  it('says nothing for a notification', () => {
    const { state } = makeProject();
    tmpDirs.push(state.outputDir);

    const response = handleMcpRequest(
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      state,
    );

    expect(response).toBeNull();
  });

  it('tells the Healer which specs to run', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    fs.mkdirSync(path.join(cwd, 'tests'), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, 'tests', 'login.spec.ts'),
      "test('x', async ({ page }) => { await expect(page).toBeVisible(); });",
      'utf-8',
    );
    state.index = AGENTS.length - 1; // the Healer is running

    const response = handleMcpRequest(
      { jsonrpc: '2.0', id: 13, method: 'tools/call', params: { name: 'spectra_next' } },
      state,
    );
    const payload = toolPayload(response?.result);

    expect(String(payload.prompt)).toContain('RUN ONLY:');
    expect(String(payload.prompt)).toContain('login.spec.ts');
  });

  it('says what the tests did when the Spectrum ends', () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    fs.mkdirSync(path.join(state.outputDir, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(state.outputDir, 'reports', 'results.json'),
      JSON.stringify({ stats: { expected: 4, unexpected: 1, flaky: 0, skipped: 0 } }),
      'utf-8',
    );
    state.index = AGENTS.length; // the Spectrum is over

    const response = handleMcpRequest(
      { jsonrpc: '2.0', id: 14, method: 'tools/call', params: { name: 'spectra_next' } },
      state,
    );
    const payload = toolPayload(response?.result);

    expect(payload.done).toBe(true);
    expect(payload.results).toBe('4 passed, 1 failed, 0 flaky, 0 skipped');
  });

  it('resolves with the state of the suite when the host disconnects', async () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    fs.mkdirSync(path.join(state.outputDir, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(state.outputDir, 'reports', 'results.json'),
      JSON.stringify({ stats: { expected: 2, unexpected: 1, flaky: 0, skipped: 0 } }),
      'utf-8',
    );

    const input = new PassThrough();
    const output = new PassThrough();
    const served = serveMcp(state, input, output);
    input.end();

    await expect(served).resolves.toBe(false);
  });

  it('resolves green when every test passed', async () => {
    const { cwd, state } = makeProject();
    tmpDirs.push(cwd);
    process.chdir(cwd);

    fs.mkdirSync(path.join(state.outputDir, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(state.outputDir, 'reports', 'results.json'),
      JSON.stringify({ stats: { expected: 2, unexpected: 0, flaky: 0, skipped: 0 } }),
      'utf-8',
    );

    const input = new PassThrough();
    const output = new PassThrough();
    const served = serveMcp(state, input, output);
    input.end();

    await expect(served).resolves.toBe(true);
  });

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
});
