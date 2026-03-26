import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Root of the installed package (two levels up from dist/utils/) */
export const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

/** Directory containing shipped templates */
export const TEMPLATE_DIR = path.join(PACKAGE_ROOT, 'templates');

/** Default output directory for Spectra artifacts */
export const DEFAULT_OUTPUT_DIR = '.spectra/output';

/** Agent names used throughout the pipeline */
export const SPECTRA_AGENTS = ['planner', 'generator', 'healer'] as const;

export type AgentName = (typeof SPECTRA_AGENTS)[number];

/** Default configuration values */
export const DEFAULTS = {
  url: 'http://localhost:5173',
  timeout: 300,
  maxHealerAttempts: 3,
  browsers: 'chromium',
} as const;
