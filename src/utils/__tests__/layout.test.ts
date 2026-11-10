import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { TEMPLATE_DIR } from '../constants.js';
import { OUTPUT_DIRS, PROJECT_DIRS } from '../layout.js';

describe('project layout', () => {
  it('gives every output folder a home under the output dir', () => {
    for (const dir of OUTPUT_DIRS) {
      expect(PROJECT_DIRS).toContain(`.spectra/output/${dir}`);
    }
  });

  it('lists every output folder in the shared context the agents read', () => {
    const context = fs.readFileSync(
      path.join(TEMPLATE_DIR, 'agents', 'shared', 'context.md'),
      'utf-8',
    );
    const output = context.slice(
      context.indexOf('output/'),
      context.indexOf('playwright.config.ts'),
    );

    for (const dir of OUTPUT_DIRS) {
      expect(output).toContain(dir);
    }
  });
});
