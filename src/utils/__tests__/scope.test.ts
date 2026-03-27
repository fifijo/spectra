import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createScopeContext } from '../scope.js';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spectra-scope-'));
}

describe('createScopeContext', () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const d of tmpDirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it('creates output file with URL-only options', () => {
    const tmp = makeTmpDir();
    tmpDirs.push(tmp);
    const outputPath = path.join(tmp, 'shared', 'current-scope.md');

    createScopeContext(outputPath, { url: 'http://localhost:3000' });

    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toContain('# Current Spectra Scope');
    expect(content).toContain('**URL**: http://localhost:3000');
    expect(content).not.toContain('**Page**');
    expect(content).not.toContain('Feature Focus');
    expect(content).toContain('## Instructions');
  });

  it('includes page and full URL when page is provided', () => {
    const tmp = makeTmpDir();
    tmpDirs.push(tmp);
    const outputPath = path.join(tmp, 'scope.md');

    createScopeContext(outputPath, {
      url: 'http://localhost:5173',
      page: '/checkout',
    });

    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toContain('**Page**: /checkout');
    expect(content).toContain('**Full URL**: http://localhost:5173/checkout');
  });

  it('includes feature focus section when scope is provided', () => {
    const tmp = makeTmpDir();
    tmpDirs.push(tmp);
    const outputPath = path.join(tmp, 'scope.md');

    createScopeContext(outputPath, {
      url: 'http://localhost:5173',
      scope: 'payment form',
    });

    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toContain('## Feature Focus');
    expect(content).toContain('Test ONLY: **payment form**');
    expect(content).toContain('Ignore other features on the page.');
  });

  it('includes scope file content when scopeFile exists', () => {
    const tmp = makeTmpDir();
    tmpDirs.push(tmp);
    const scopeFilePath = path.join(tmp, 'SCOPE.md');
    fs.writeFileSync(scopeFilePath, '# My Custom Scope\n- Test login\n- Test logout', 'utf-8');

    const outputPath = path.join(tmp, 'output', 'scope.md');

    createScopeContext(outputPath, {
      url: 'http://localhost:5173',
      scopeFile: scopeFilePath,
    });

    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toContain('## Detailed Requirements');
    expect(content).toContain('# My Custom Scope');
    expect(content).toContain('- Test login');
  });

  it('skips scope file section when scopeFile does not exist', () => {
    const tmp = makeTmpDir();
    tmpDirs.push(tmp);
    const outputPath = path.join(tmp, 'scope.md');

    createScopeContext(outputPath, {
      url: 'http://localhost:5173',
      scopeFile: '/nonexistent/path/SCOPE.md',
    });

    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).not.toContain('## Detailed Requirements');
  });

  it('creates nested directories for output path', () => {
    const tmp = makeTmpDir();
    tmpDirs.push(tmp);
    const outputPath = path.join(tmp, 'a', 'b', 'c', 'scope.md');

    createScopeContext(outputPath, { url: 'http://localhost:5173' });

    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('includes all sections when all options are provided', () => {
    const tmp = makeTmpDir();
    tmpDirs.push(tmp);
    const scopeFilePath = path.join(tmp, 'SCOPE.md');
    fs.writeFileSync(scopeFilePath, 'Custom requirements here', 'utf-8');
    const outputPath = path.join(tmp, 'scope.md');

    createScopeContext(outputPath, {
      url: 'http://localhost:5173',
      page: '/settings',
      scope: 'profile editor',
      scopeFile: scopeFilePath,
    });

    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toContain('**URL**: http://localhost:5173');
    expect(content).toContain('**Page**: /settings');
    expect(content).toContain('**Full URL**: http://localhost:5173/settings');
    expect(content).toContain('Test ONLY: **profile editor**');
    expect(content).toContain('## Detailed Requirements');
    expect(content).toContain('Custom requirements here');
    expect(content).toContain('## Instructions');
  });
});
