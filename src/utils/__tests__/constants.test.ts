import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { DEFAULT_OUTPUT_DIR, PACKAGE_ROOT, TEMPLATE_DIR } from '../constants.js';

describe('constants', () => {
  it('PACKAGE_ROOT resolves to a directory that exists', () => {
    expect(fs.existsSync(PACKAGE_ROOT)).toBe(true);
  });

  it('TEMPLATE_DIR is inside PACKAGE_ROOT', () => {
    expect(TEMPLATE_DIR).toBe(path.join(PACKAGE_ROOT, 'templates'));
  });

  it('DEFAULT_OUTPUT_DIR is the expected relative path', () => {
    expect(DEFAULT_OUTPUT_DIR).toBe('.spectra/output');
  });
});
