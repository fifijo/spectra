/**
 * The Spectrum as an MCP server.
 *
 * The user starts this inside a chat or a CLI that already has a model. That
 * model plays the Agent: it asks for the next brief, does the work, and says
 * it is done. Spectra keeps the bookkeeping — the Agent catalogue decides
 * what each Agent reads and writes, and the completion signal says the step
 * is finished.
 *
 * Nothing here calls a model. The host's model does the work, so the same
 * server works with Cursor, Claude Code, opencode, or any other MCP host,
 * and with whatever model the user has active.
 */

import fs from 'node:fs';
import path from 'node:path';

import type { Agent } from '../agents/catalogue.js';
import { buildPrompt, type RunContext } from '../agents/runner.js';
import { PACKAGE_ROOT } from '../utils/constants.js';

const PROTOCOL_VERSION = '2024-11-05';

export interface McpState {
  /** Absolute path of the run's output dir. */
  outputDir: string;
  /** Absolute path of the installed agents dir. */
  agentsDir: string;
  /** The Agents of the Spectrum, in order. */
  agents: Agent[];
  /** Index of the Agent that is running. */
  index: number;
}

export interface McpRequest {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: unknown;
}

export interface McpResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string };
}

const TOOLS = [
  {
    name: 'spectra_next',
    description:
      'Get the brief of the next Spectrum Agent (Planner, Generator or Healer). ' +
      'Read its instructions, do the work it describes, then call spectra_done.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'spectra_done',
    description:
      'Say the current Spectrum Agent is finished. Spectra checks that the Agent wrote ' +
      'everything the catalogue says it writes, writes the completion signal and returns ' +
      'the next brief.',
    inputSchema: {
      type: 'object',
      properties: { agent: { type: 'string', description: 'The Agent that is done.' } },
      required: ['agent'],
      additionalProperties: false,
    },
  },
  {
    name: 'spectra_status',
    description: 'Which Spectrum Agent is running, and which ones are finished.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

/** The path of an installed file, as the Agent sees it: relative to the project root. */
function projectPath(target: string): string {
  return path.relative(process.cwd(), target);
}

/** The files an Agent must have written, as paths relative to the project root. */
function expectedFiles(agent: Agent, state: McpState): string[] {
  return [
    ...agent.outputs.map((file) => projectPath(path.join(state.outputDir, file))),
    ...agent.projectOutputs,
  ];
}

/** The brief of the Agent that is running: what to read, what to write, how to finish. */
function brief(agent: Agent, state: McpState): Record<string, unknown> {
  const ctx: RunContext = {
    mode: 'manual',
    outputDir: state.outputDir,
    agentsDir: state.agentsDir,
    debug: false,
  };

  const instructionsPath = path.join(state.agentsDir, agent.name, 'AGENT.md');
  const scopePath = path.join(state.agentsDir, 'shared', 'current-scope.md');

  return {
    agent: agent.name,
    instructions: fs.existsSync(instructionsPath) ? fs.readFileSync(instructionsPath, 'utf-8') : '',
    scope: fs.existsSync(scopePath) ? fs.readFileSync(scopePath, 'utf-8') : '',
    prompt: buildPrompt(agent, ctx),
    read: agent.inputs.map((file) => projectPath(path.join(state.outputDir, file))),
    write: expectedFiles(agent, state),
    completionSignal: projectPath(path.join(state.outputDir, agent.completionSignal)),
  };
}

/** The Agent that is running, or null when the Spectrum is finished. */
function currentAgent(state: McpState): Agent | null {
  return state.agents[state.index] ?? null;
}

/** What the Agent still has to write: the files the catalogue says it writes. */
function missingOutputs(agent: Agent, state: McpState): string[] {
  return expectedFiles(agent, state).filter((file) => !fs.existsSync(path.resolve(file)));
}

function textResult(payload: unknown, isError = false): McpResponse['result'] {
  return {
    content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

/** Handle one JSON-RPC request. Returns null for a notification (no id). */
export function handleMcpRequest(request: McpRequest, state: McpState): McpResponse | null {
  const isNotification = request.id === undefined;
  const id = request.id ?? null;

  const reply = (result: unknown): McpResponse => ({ jsonrpc: '2.0', id, result });
  const fail = (code: number, message: string): McpResponse => ({
    jsonrpc: '2.0',
    id,
    error: { code, message },
  });

  switch (request.method) {
    case 'initialize':
      return reply({
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: 'spectra', version: serverVersion() },
      });

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null;

    case 'ping':
      return reply({});

    case 'tools/list':
      return reply({ tools: TOOLS });

    case 'tools/call': {
      const params = (request.params ?? {}) as {
        name?: string;
        arguments?: Record<string, unknown>;
      };
      const tool = params.name;
      const args = params.arguments ?? {};

      if (tool === 'spectra_next') {
        const agent = currentAgent(state);
        if (!agent) {
          return reply(textResult({ done: true, message: 'The Spectrum is complete.' }));
        }
        return reply(textResult(brief(agent, state)));
      }

      if (tool === 'spectra_status') {
        return reply(
          textResult({
            current: currentAgent(state)?.name ?? null,
            done: state.agents.slice(0, state.index).map((a) => a.name),
            outputDir: projectPath(state.outputDir),
          }),
        );
      }

      if (tool === 'spectra_done') {
        const name = typeof args.agent === 'string' ? args.agent : currentAgent(state)?.name;
        const agent = state.agents.find((a) => a.name === name);

        if (!agent) {
          return reply(textResult({ error: `Unknown Agent: ${String(name)}` }, true));
        }

        const missing = missingOutputs(agent, state);
        if (missing.length > 0) {
          return reply(
            textResult(
              {
                error: `The ${agent.name} did not write everything the catalogue declares.`,
                missing,
              },
              true,
            ),
          );
        }

        // The Agent is finished: write its completion signal and move on.
        const signal = path.join(state.outputDir, agent.completionSignal);
        fs.mkdirSync(path.dirname(signal), { recursive: true });
        fs.writeFileSync(signal, `${new Date().toISOString()}\n`, 'utf-8');

        state.index = state.agents.indexOf(agent) + 1;
        const next = currentAgent(state);
        return reply(
          textResult(
            next
              ? { done: false, ...brief(next, state) }
              : { done: true, message: 'The Spectrum is complete.' },
          ),
        );
      }

      return reply(textResult({ error: `Unknown tool: ${String(tool)}` }, true));
    }

    default:
      if (isNotification) return null;
      return fail(-32601, `Method not found: ${request.method}`);
  }
}

/** The version the server reports, taken from the package manifest. */
function serverVersion(): string {
  try {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf-8'),
    ) as { version?: string };
    return manifest.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Serve MCP over stdio: newline-delimited JSON-RPC on stdin and stdout.
 * The streams are parameters so the loop can be tested without a process.
 */
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
