/* eslint-disable no-console */

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';

export const logger = {
  info(msg: string) {
    console.log(`${BLUE}${msg}${RESET}`);
  },
  success(msg: string) {
    console.log(`${GREEN}${msg}${RESET}`);
  },
  warn(msg: string) {
    console.log(`${YELLOW}${msg}${RESET}`);
  },
  error(msg: string) {
    console.error(`${RED}${msg}${RESET}`);
  },
  cyan(msg: string) {
    console.log(`${CYAN}${msg}${RESET}`);
  },
  magenta(msg: string) {
    console.log(`${MAGENTA}${msg}${RESET}`);
  },
  plain(msg: string) {
    console.log(msg);
  },
  banner() {
    console.log('');
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
};
