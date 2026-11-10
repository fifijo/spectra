/* eslint-disable no-console */

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';

/** Read lazily: the CLI sets DEBUG after this module is loaded. */
export function isDebug(): boolean {
  return process.env.DEBUG === '1' || process.env.SPECTRA_DEBUG === '1';
}

/**
 * Where the log lines go. An MCP server speaks JSON-RPC on stdout, so its
 * logs have to go to stderr instead.
 */
let out: (msg: string) => void = (msg) => console.log(msg);

/** Send the log lines to stdout (the default) or stderr (an MCP server). */
export function setLogTarget(target: 'stdout' | 'stderr'): void {
  out = target === 'stderr' ? (msg) => console.error(msg) : (msg) => console.log(msg);
}

function timestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `[${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}]`;
}

function withTimestamp(msg: string, color: string): string {
  return isDebug() ? `${timestamp()} ${color}${msg}${RESET}` : `${color}${msg}${RESET}`;
}

export const logger = {
  info(msg: string) {
    out(withTimestamp(msg, BLUE));
  },
  success(msg: string) {
    out(withTimestamp(msg, GREEN));
  },
  warn(msg: string) {
    out(withTimestamp(msg, YELLOW));
  },
  error(msg: string) {
    console.error(withTimestamp(msg, RED));
  },
  cyan(msg: string) {
    out(withTimestamp(msg, CYAN));
  },
  plain(msg: string) {
    out(isDebug() ? `${timestamp()} ${msg}` : msg);
  },
  banner() {
    if (isDebug()) out('');
    out(`${CYAN}   ◐ ◑ ◒${RESET}`);
    out(`${CYAN}  SPECTRA${RESET}`);
    out(`  ${MAGENTA}Full-spectrum test automation${RESET}`);
    out('  ─────────────────────────────────');
    out('');
  },
  separator(color: 'blue' | 'green' | 'magenta', label: string) {
    const c = color === 'blue' ? BLUE : color === 'green' ? GREEN : MAGENTA;
    out('');
    out(`${c}═══════════════════════════════════════════════════════${RESET}`);
    out(`${c}  ${label}${RESET}`);
    out(`${c}═══════════════════════════════════════════════════════${RESET}`);
    out('');
  },
  debug(label: string, msg: string) {
    if (!isDebug()) return;
    out(`${timestamp()} ${GREEN}[DEBUG]${RESET} ${MAGENTA}[${label}]${RESET} ${msg}`);
  },
  prompt(label: string, content: string) {
    if (!isDebug()) return;
    out(`${timestamp()} ${MAGENTA}[PROMPT]${RESET} ${CYAN}${label}${RESET}`);
    out('```');
    out(content);
    out('```');
    out('');
  },
};
