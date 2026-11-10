import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AGENTS } from '../../agents/catalogue.js';
import { handleMcpRequest, type McpState, serveMcp } from '../server.js';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spectra-mcp-'));
}

/** A project with the agent templates and the output dir in place. */
function makeProject(): { cwd: string; state: McpState } {
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

  return { cwd, state: { outputDir, agentsDir, agents: AGENTS, index: 0 } };
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

  it('says nothing for a notification', () => {
    const { state } = makeProject();
    tmpDirs.push(state.outputDir);

    const response = handleMcpRequest(
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      state,
    );

    expect(response).toBeNull();
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
});
