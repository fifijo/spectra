import { execSync } from 'node:child_process';

export type CliMode = 'cursor-agent' | 'claude-code' | 'manual';

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
 * Priority: cursor-agent > claude-code > manual
 */
export function detectMode(forceManual = false): CliMode {
  if (forceManual) return 'manual';
  if (commandExists('cursor-agent')) return 'cursor-agent';
  if (commandExists('claude')) return 'claude-code';
  return 'manual';
}
