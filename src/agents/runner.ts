import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import type { CliMode } from '../utils/detect-mode.js';
import { logger } from '../utils/logger.js';

export interface AgentRunOptions {
  name: string;
  color: 'blue' | 'green' | 'magenta';
  emoji: string;
  prompt: string;
  mode: CliMode;
  outputDir: string;
}

function runCursorAgent(name: string, prompt: string, outputDir: string, debug: boolean) {
  if (debug) {
    logger.debug(name, 'Starting cursor-agent...');
  }
  try {
    const child = spawn('cursor-agent', ['--print', '--force', prompt], {
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    if (debug) {
      child.stdout.on('data', (data) => {
        process.stdout.write(`${data}`);
      });
      child.stderr.on('data', (data) => {
        process.stderr.write(`${data}`);
      });
    }

    child.on('close', (code) => {
      if (code !== 0) {
        const logPath = path.join(outputDir, `${name}.log`);
        fs.writeFileSync(logPath, `cursor-agent exited with code ${code}`, 'utf-8');
      }
    });
  } catch (err) {
    const logPath = path.join(outputDir, `${name}.log`);
    fs.writeFileSync(logPath, String(err), 'utf-8');
    throw err;
  }
}

function runClaudeCode(name: string, prompt: string, outputDir: string, debug: boolean) {
  if (debug) {
    logger.debug(name, 'Starting Claude Code...');
  }
  try {
    const child = spawn('claude', ['--mcp'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    child.stdin.write(prompt);
    child.stdin.end();

    if (debug) {
      child.stdout.on('data', (data) => {
        process.stdout.write(`${data}`);
      });
      child.stderr.on('data', (data) => {
        process.stderr.write(`${data}`);
      });
    }

    child.on('close', (code) => {
      if (code !== 0) {
        const logPath = path.join(outputDir, `${name}.log`);
        fs.writeFileSync(logPath, `claude exited with code ${code}`, 'utf-8');
      }
    });
  } catch (err) {
    const logPath = path.join(outputDir, `${name}.log`);
    fs.writeFileSync(logPath, String(err), 'utf-8');
    throw err;
  }
}

function runManual(name: string, prompt: string, agentsDir: string, debug: boolean) {
  const promptPath = path.join(agentsDir, name, 'current-prompt.md');
  fs.mkdirSync(path.dirname(promptPath), { recursive: true });
  fs.writeFileSync(promptPath, prompt, 'utf-8');

  logger.plain('');
  logger.info('Open your IDE and use the agent prompt:');
  logger.cyan(`  ${promptPath}`);
  logger.plain('');
  logger.info(`Press Ctrl+C when ${name} is complete, or run with a supported CLI.`);
  logger.plain('');
}

export function buildPrompt(
  agent: string,
  instruction: string,
  completionPath: string,
  agentsDir: string,
): string {
  return `SCOPE: First check ${agentsDir}/shared/current-scope.md for constraints.
INSTRUCTIONS: Read ${agentsDir}/${agent}/AGENT.md for full details.

${instruction}

When complete, create: ${completionPath}`;
}

export function runAgent(options: AgentRunOptions, agentsDir: string, debug = false): void {
  const { name, color, emoji, prompt, mode, outputDir } = options;

  logger.separator(color, `${emoji} ${name.toUpperCase()}`);

  if (debug) {
    logger.prompt(name, prompt);
  }

  switch (mode) {
    case 'cursor-agent':
      runCursorAgent(name, prompt, outputDir, debug);
      break;
    case 'claude-code':
      runClaudeCode(name, prompt, outputDir, debug);
      break;
    case 'manual':
      runManual(name, prompt, agentsDir, debug);
      break;
  }
}