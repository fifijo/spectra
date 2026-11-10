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
    console.log(withTimestamp(msg, BLUE));
  },
  success(msg: string) {
    console.log(withTimestamp(msg, GREEN));
  },
  warn(msg: string) {
    console.log(withTimestamp(msg, YELLOW));
  },
  error(msg: string) {
    console.error(withTimestamp(msg, RED));
  },
  cyan(msg: string) {
    console.log(withTimestamp(msg, CYAN));
  },
  plain(msg: string) {
    console.log(isDebug() ? `${timestamp()} ${msg}` : msg);
  },
  banner() {
    if (isDebug()) console.log('');
    console.log(`${CYAN}   ◐ ◑ ◒${RESET}`);
    console.log(`${CYAN}  SPECTRA${RESET}`);
    console.log(`  ${MAGENTA}Full-spectrum test automation${RESET}`);
    console.log('  ─────────────────────────────────');
    console.log('');
  },
  separator(color: string, label: string) {
    const c = color === 'blue' ? BLUE : color === 'green' ? GREEN : MAGENTA;
    console.log('');
    console.log(`${c}═══════════════════════════════════════════════════════${RESET}`);
    console.log(`${c}  ${label}${RESET}`);
    console.log(`${c}═══════════════════════════════════════════════════════${RESET}`);
    console.log('');
  },
  debug(label: string, msg: string) {
    if (!isDebug()) return;
    console.log(`${timestamp()} ${GREEN}[DEBUG]${RESET} ${MAGENTA}[${label}]${RESET} ${msg}`);
  },
  prompt(label: string, content: string) {
    if (!isDebug()) return;
    console.log(`${timestamp()} ${MAGENTA}[PROMPT]${RESET} ${CYAN}${label}${RESET}`);
    console.log('```');
    console.log(content);
    console.log('```');
    console.log('');
  },
};
