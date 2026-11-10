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
