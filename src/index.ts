/**
 * Spectra - Full-Spectrum Test Automation
 *
 * Uses AI agents to explore your app, generate Playwright tests,
 * and automatically fix failures.
 */

export { run, type SpectraOptions } from './cli.js';
export {
  DEFAULT_OUTPUT_DIR,
  SPECTRA_AGENTS,
  TEMPLATE_DIR,
} from './utils/constants.js';
export { type CliMode, detectMode } from './utils/detect-mode.js';
export { createScopeContext } from './utils/scope.js';
