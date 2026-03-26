/**
 * Spectra - Full-Spectrum Test Automation
 *
 * Uses AI agents to explore your app, generate Playwright tests,
 * and automatically fix failures.
 */

export { run, type SpectraOptions } from './cli.js';
export { createScopeContext } from './utils/scope.js';
export { detectMode, type CliMode } from './utils/detect-mode.js';
export {
  SPECTRA_AGENTS,
  TEMPLATE_DIR,
  DEFAULT_OUTPUT_DIR,
} from './utils/constants.js';
