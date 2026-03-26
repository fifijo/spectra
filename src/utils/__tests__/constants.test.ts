import { describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';

import {
  PACKAGE_ROOT,
  TEMPLATE_DIR,
  DEFAULT_OUTPUT_DIR,
  SPECTRA_AGENTS,
  DEFAULTS,
} from '../constants.js';

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

  it('SPECTRA_AGENTS contains the three expected agents', () => {
    expect(SPECTRA_AGENTS).toEqual(['planner', 'generator', 'healer']);
  });

  it('SPECTRA_AGENTS has exactly 3 entries', () => {
    expect(SPECTRA_AGENTS).toHaveLength(3);
  });

  it('DEFAULTS has expected shape and values', () => {
    expect(DEFAULTS).toEqual({
      url: 'http://localhost:5173',
      timeout: 300,
      maxHealerAttempts: 3,
      browsers: 'chromium',
    });
  });

  it('DEFAULTS contains all expected keys', () => {
    expect(Object.keys(DEFAULTS).sort()).toEqual(
      ['browsers', 'maxHealerAttempts', 'timeout', 'url'],
    );
  });
});
