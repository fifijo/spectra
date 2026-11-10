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

  it('package.json has a typecheck:test script pointing at tsconfig.test.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts['typecheck:test']).toContain('tsconfig.test.json');
  });

  it('package.json has a test:unit:coverage script and @vitest/coverage-v8 devDependency', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts['test:unit:coverage']).toBeDefined();
    expect(pkg.devDependencies['@vitest/coverage-v8']).toBeDefined();
  });
});
