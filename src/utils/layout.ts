import path from 'node:path';

import {
  AGENTS,
  COMPLETION_SIGNALS,
  OUTPUT_ARTEFACTS,
  SCOPE_CONTEXT,
} from '../agents/catalogue.js';

/** The folder Playwright writes the artifacts of a run into. */
export const TEST_ARTIFACTS = 'test-results';

/** The folder the Agents keep the screenshots and videos they took in. */
const EVIDENCE = 'evidence';

/** The folders the run writes into, relative to the output dir. */
export const OUTPUT_DIRS = [
  ...new Set([...COMPLETION_SIGNALS, ...OUTPUT_ARTEFACTS].map((file) => path.dirname(file))),
  TEST_ARTIFACTS,
  EVIDENCE,
];

/** The folders of a Spectra project, relative to the project root. */
export const PROJECT_DIRS = [
  'tests',
  'specs',
  'pages',
  'fixtures',
  ...AGENTS.map((agent) => `.spectra/agents/${agent.name}`),
  `.spectra/agents/${path.dirname(SCOPE_CONTEXT)}`,
  ...OUTPUT_DIRS.map((dir) => `.spectra/output/${dir}`),
];

/**
 * Paths a scaffolded project must not commit: the agent logs and run
 * artefacts, the installed templates (reinstalled on every run), and the two
 * manifests that remember which template each copied file came from.
 */
export const PROJECT_IGNORES = [
  '.spectra/output/',
  '.spectra/agents/',
  'test-results/',
  'playwright-report/',
  'docs/.templates.json',
  'specs/.templates.json',
];
