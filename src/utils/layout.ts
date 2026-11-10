import path from 'node:path';

import {
  AGENTS,
  COMPLETION_SIGNALS,
  OUTPUT_ARTEFACTS,
  SCOPE_CONTEXT,
} from '../agents/catalogue.js';

/** The folders the run writes into, relative to the output dir. */
export const OUTPUT_DIRS = [
  ...new Set([...COMPLETION_SIGNALS, ...OUTPUT_ARTEFACTS].map((file) => path.dirname(file))),
  'test-results',
];

/** The folders of a Spectra project, relative to the project root. */
export const PROJECT_DIRS = [
  'tests/e2e',
  'specs',
  'pages',
  'fixtures',
  ...AGENTS.map((agent) => `.spectra/agents/${agent.name}`),
  `.spectra/agents/${path.dirname(SCOPE_CONTEXT)}`,
  ...OUTPUT_DIRS.map((dir) => `.spectra/output/${dir}`),
];
