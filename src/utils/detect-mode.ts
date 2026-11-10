import { execSync } from 'node:child_process';

export type CliMode = 'cursor-agent' | 'claude-code' | 'codex' | 'opencode' | 'gemini' | 'manual';

/** Every Mode a run can use. */
export const CLI_MODES: CliMode[] = [
  'cursor-agent',
  'claude-code',
  'codex',
  'opencode',
  'gemini',
  'manual',
];

/** The command each Mode runs. */
const AGENT_BIN: Record<CliMode, string> = {
  'cursor-agent': 'cursor-agent',
  'claude-code': 'claude',
  codex: 'codex',
  opencode: 'opencode',
  gemini: 'gemini',
  manual: '',
};

function commandExists(cmd: string): boolean {
  try {
    execSync(process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`, {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect available CLI mode based on installed tools.
 * Priority: cursor-agent > claude-code > codex > opencode > gemini > manual
 *
 * A Mode asked for by name wins over the priority, so a machine with several
 * CLIs installed can still pick the one the user wants.
 */
export function detectMode(forceManual = false, requested?: string): CliMode {
  if (forceManual) return 'manual';

  if (requested) {
    if (!CLI_MODES.includes(requested as CliMode)) {
      throw new Error(`Unknown mode "${requested}". Use one of: ${CLI_MODES.join(', ')}.`);
    }
    const mode = requested as CliMode;
    if (mode === 'manual') return 'manual';
    if (!commandExists(AGENT_BIN[mode])) {
      throw new Error(`The ${mode} CLI is not installed (looked for "${AGENT_BIN[mode]}").`);
    }
    return mode;
  }

  if (commandExists('cursor-agent')) return 'cursor-agent';
  if (commandExists('claude')) return 'claude-code';
  if (commandExists('codex')) return 'codex';
  if (commandExists('opencode')) return 'opencode';
  if (commandExists('gemini')) return 'gemini';
  return 'manual';
}
