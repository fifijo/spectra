import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import type { CliMode } from '../utils/detect-mode.js';
import { logger } from '../utils/logger.js';
import { type Agent, SCOPE_CONTEXT } from './catalogue.js';
import { projectPath } from './verify.js';

export interface RunContext {
  mode: CliMode;
  /** Absolute path of the run's output dir. */
  outputDir: string;
  /** Absolute path of the installed agents dir. */
  agentsDir: string;
  debug: boolean;
}

const POLL_INTERVAL_MS = 500;
/** How long manual mode waits for the completion signal before it gives up. */
const MANUAL_TIMEOUT_MS = 30 * 60 * 1000;

/** The file name of the log of an Agent's CLI run. */
export function agentLogName(name: string): string {
  return `${name}.log`;
}

/**
 * Run an agent CLI and resolve when it exits.
 * The output pipes are always drained: an unread pipe fills up and blocks the agent forever.
 */
function runAgentCli(
  bin: string,
  args: string[],
  name: string,
  outputDir: string,
  debug: boolean,
): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(outputDir, { recursive: true });
    const logPath = path.join(outputDir, agentLogName(name));
    const logFd = fs.openSync(logPath, 'w');
    let logClosed = false;
    const closeLog = (): void => {
      if (logClosed) return;
      logClosed = true;
      fs.closeSync(logFd);
    };

    const child = spawn(bin, args, { stdio: ['inherit', 'pipe', 'pipe'] });

    child.stdout.on('data', (data: Buffer) => {
      fs.writeSync(logFd, data);
      if (debug) process.stdout.write(data);
    });
    child.stderr.on('data', (data: Buffer) => {
      fs.writeSync(logFd, data);
      if (debug) process.stderr.write(data);
    });

    child.on('error', (err) => {
      closeLog();
      reject(err);
    });

    // 'close' always fires after 'error', so the log is closed only once.
    child.on('close', (code) => {
      closeLog();
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${bin} exited with code ${code} (log: ${logPath})`));
      }
    });
  });
}

/** Wait until the Agent writes its completion signal. Rejects when it never comes. */
function waitForCompletion(completionPath: string, timeoutMs = MANUAL_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    let timer: NodeJS.Timeout | undefined;

    const check = (): void => {
      if (fs.existsSync(completionPath)) {
        if (timer) clearTimeout(timer);
        resolve();
        return;
      }
      if (Date.now() >= deadline) {
        if (timer) clearTimeout(timer);
        reject(
          new Error(
            `Timed out after ${Math.round(timeoutMs / 60000)} minutes waiting for ${completionPath}. ` +
              `Create the file to continue, or restart the run.`,
          ),
        );
        return;
      }
      timer = setTimeout(check, POLL_INTERVAL_MS);
    };

    check();
  });
}

/**
 * Build the task prompt of an Agent from its catalogue entry.
 * Every path in it comes from the catalogue, so the Agents never disagree about a file.
 */
export function buildPrompt(agent: Agent, ctx: RunContext): string {
  const inOutputDir = (files: string[]): string[] =>
    files.map((file) => projectPath(path.join(ctx.outputDir, file)));

  const lines = [
    `SCOPE: First check ${projectPath(path.join(ctx.agentsDir, SCOPE_CONTEXT))} for constraints.`,
    `INSTRUCTIONS: Read ${projectPath(path.join(ctx.agentsDir, agent.name, 'AGENT.md'))} for full details.`,
  ];

  const reads = inOutputDir(agent.inputs);
  if (reads.length > 0) lines.push(`READ: ${reads.join(', ')}`);

  const writes = [...inOutputDir(agent.outputs), ...agent.projectOutputs];
  if (writes.length > 0) lines.push(`WRITE TO: ${writes.join(', ')}`);

  lines.push(`When complete, create: ${inOutputDir([agent.completionSignal])[0]}`);

  return lines.join('\n');
}

/**
 * Run one Agent and resolve when it is done.
 * Rejects when the agent CLI fails.
 */
export async function runAgent(agent: Agent, ctx: RunContext): Promise<void> {
  const { mode, outputDir, agentsDir, debug } = ctx;
  const prompt = buildPrompt(agent, ctx);
  const completionFile = path.join(outputDir, agent.completionSignal);

  logger.separator(agent.color, `${agent.emoji} ${agent.name.toUpperCase()}`);

  if (debug) {
    logger.prompt(agent.name, prompt);
  }

  // shortcut: the agent CLI runs with full permission on this machine, so a
  // scope file from outside the project can steer it. Give the agent CLI an
  // allow-list of tools when yours supports one, and run Spectra only in a
  // project you trust.
  switch (mode) {
    case 'cursor-agent':
      await runAgentCli(
        'cursor-agent',
        ['--print', '--force', prompt],
        agent.name,
        outputDir,
        debug,
      );
      break;
    case 'claude-code':
      await runAgentCli(
        'claude',
        ['-p', prompt, '--permission-mode', 'bypassPermissions'],
        agent.name,
        outputDir,
        debug,
      );
      break;
    case 'codex':
      await runAgentCli(
        'codex',
        ['exec', '--skip-git-repo-check', '--full-auto', prompt],
        agent.name,
        outputDir,
        debug,
      );
      break;
    case 'opencode':
      await runAgentCli('opencode', ['run', '--auto', prompt], agent.name, outputDir, debug);
      break;
    case 'gemini':
      await runAgentCli(
        'gemini',
        ['--approval-mode=yolo', '-p', prompt],
        agent.name,
        outputDir,
        debug,
      );
      break;
    case 'manual': {
      const promptPath = path.join(agentsDir, agent.name, 'current-prompt.md');
      fs.mkdirSync(path.dirname(promptPath), { recursive: true });
      fs.writeFileSync(promptPath, prompt, 'utf-8');

      logger.plain('');
      logger.info('Open your IDE and use the agent prompt:');
      logger.cyan(`  ${promptPath}`);
      logger.plain('');
      logger.info(`Waiting for the agent to write ${projectPath(completionFile)} ...`);
      logger.plain('');
      await waitForCompletion(completionFile);
      break;
    }
  }

  if (!fs.existsSync(completionFile)) {
    logger.warn(`Agent ${agent.name} did not write ${projectPath(completionFile)}`);
  }
}
