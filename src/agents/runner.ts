import { execSync } from 'node:child_process';
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

function runCursorAgent(name: string, prompt: string, outputDir: string) {
  logger.info(`Running ${name} with cursor-agent...`);
  try {
    execSync(`cursor-agent --print --force "${prompt.replace(/"/g, '\\"')}"`, {
      stdio: ['inherit', 'pipe', 'pipe'],
    });
  } catch (err) {
    const logPath = path.join(outputDir, `${name}.log`);
    fs.writeFileSync(logPath, String(err), 'utf-8');
    throw err;
  }
}

function runClaudeCode(name: string, prompt: string, outputDir: string) {
  logger.info(`Running ${name} with Claude Code...`);
  try {
    execSync(`echo "${prompt.replace(/"/g, '\\"')}" | claude --mcp`, {
      stdio: ['inherit', 'pipe', 'pipe'],
    });
  } catch (err) {
    const logPath = path.join(outputDir, `${name}.log`);
    fs.writeFileSync(logPath, String(err), 'utf-8');
    throw err;
  }
}

function runManual(name: string, prompt: string, agentsDir: string) {
  const promptPath = path.join(agentsDir, name, 'current-prompt.md');
  fs.mkdirSync(path.dirname(promptPath), { recursive: true });
  fs.writeFileSync(promptPath, prompt, 'utf-8');

  logger.plain('Open your IDE and use the agent prompt:');
  logger.cyan(`  ${promptPath}`);
  logger.plain('');
  logger.plain(`Press Ctrl+C when ${name} is complete, or run with a supported CLI.`);
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

export function runAgent(options: AgentRunOptions, agentsDir: string): void {
  const { name, color, emoji, prompt, mode, outputDir } = options;

  logger.separator(color, `${emoji} ${name.toUpperCase()}`);

  switch (mode) {
    case 'cursor-agent':
      runCursorAgent(name, prompt, outputDir);
      break;
    case 'claude-code':
      runClaudeCode(name, prompt, outputDir);
      break;
    case 'manual':
      runManual(name, prompt, agentsDir);
      break;
  }
}
