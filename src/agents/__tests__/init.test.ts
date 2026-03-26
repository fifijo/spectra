import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { initAgents, scaffold } from '../init.js';

// We need to mock TEMPLATE_DIR to point to our test fixtures
vi.mock('../../utils/constants.js', () => ({
  TEMPLATE_DIR: '/tmp/spectra-test-templates',
}));

vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    plain: vi.fn(),
    cyan: vi.fn(),
    magenta: vi.fn(),
    banner: vi.fn(),
    separator: vi.fn(),
  },
}));

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spectra-init-'));
}

function setupTemplates(templateRoot: string): void {
  const agentsDir = path.join(templateRoot, 'agents');
  const plannerDir = path.join(agentsDir, 'planner');
  const generatorDir = path.join(agentsDir, 'generator');
  const healerDir = path.join(agentsDir, 'healer');
  const sharedDir = path.join(agentsDir, 'shared');
  const docsDir = path.join(templateRoot, 'docs');
  const fixturesDir = path.join(templateRoot, 'fixtures');

  for (const d of [plannerDir, generatorDir, healerDir, sharedDir, docsDir, fixturesDir]) {
    fs.mkdirSync(d, { recursive: true });
  }

  fs.writeFileSync(path.join(plannerDir, 'AGENT.md'), '# Planner Agent', 'utf-8');
  fs.writeFileSync(path.join(generatorDir, 'AGENT.md'), '# Generator Agent', 'utf-8');
  fs.writeFileSync(path.join(healerDir, 'AGENT.md'), '# Healer Agent', 'utf-8');
  fs.writeFileSync(path.join(sharedDir, 'config.md'), '# Shared Config', 'utf-8');
  fs.writeFileSync(path.join(docsDir, 'SCOPE-template.md'), '# Scope Template', 'utf-8');
  fs.writeFileSync(path.join(fixturesDir, 'pages.ts'), 'export const pages = {};', 'utf-8');
}

describe('initAgents', () => {
  const tmpDirs: string[] = [];
  const templateDir = '/tmp/spectra-test-templates';

  beforeEach(() => {
    setupTemplates(templateDir);
  });

  afterEach(() => {
    for (const d of tmpDirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
    fs.rmSync(templateDir, { recursive: true, force: true });
  });

  it('copies agent templates to .spectra/agents/', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    initAgents(projectRoot);

    const agentsDest = path.join(projectRoot, '.spectra', 'agents');
    expect(fs.existsSync(path.join(agentsDest, 'planner', 'AGENT.md'))).toBe(true);
    expect(fs.existsSync(path.join(agentsDest, 'generator', 'AGENT.md'))).toBe(true);
    expect(fs.existsSync(path.join(agentsDest, 'healer', 'AGENT.md'))).toBe(true);
    expect(fs.existsSync(path.join(agentsDest, 'shared', 'config.md'))).toBe(true);
  });

  it('preserves file content during copy', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    initAgents(projectRoot);

    const content = fs.readFileSync(
      path.join(projectRoot, '.spectra', 'agents', 'planner', 'AGENT.md'),
      'utf-8',
    );
    expect(content).toBe('# Planner Agent');
  });

  it('exits with error when template directory is missing', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    // Remove templates so they don't exist
    fs.rmSync(templateDir, { recursive: true, force: true });

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);

    expect(() => initAgents(projectRoot)).toThrow('process.exit called');
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    // Recreate for cleanup
    fs.mkdirSync(templateDir, { recursive: true });
  });
});

describe('scaffold', () => {
  const tmpDirs: string[] = [];
  const templateDir = '/tmp/spectra-test-templates';

  beforeEach(() => {
    setupTemplates(templateDir);
  });

  afterEach(() => {
    for (const d of tmpDirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
    fs.rmSync(templateDir, { recursive: true, force: true });
  });

  it('creates all required directories', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    scaffold(projectRoot);

    const expectedDirs = [
      'tests/e2e',
      'specs',
      'pages',
      'fixtures',
      '.spectra/agents/planner',
      '.spectra/agents/generator',
      '.spectra/agents/healer',
      '.spectra/agents/shared',
      '.spectra/output/plans',
      '.spectra/output/reports',
      '.spectra/output/test-results',
    ];

    for (const dir of expectedDirs) {
      expect(fs.existsSync(path.join(projectRoot, dir))).toBe(true);
    }
  });

  it('copies doc templates', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    scaffold(projectRoot);

    expect(fs.existsSync(path.join(projectRoot, 'docs', 'SCOPE-template.md'))).toBe(true);
  });

  it('copies fixture template', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    scaffold(projectRoot);

    expect(fs.existsSync(path.join(projectRoot, 'fixtures', 'pages.ts'))).toBe(true);
    const content = fs.readFileSync(path.join(projectRoot, 'fixtures', 'pages.ts'), 'utf-8');
    expect(content).toBe('export const pages = {};');
  });

  it('does not overwrite existing fixture file', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    const fixtureDir = path.join(projectRoot, 'fixtures');
    fs.mkdirSync(fixtureDir, { recursive: true });
    fs.writeFileSync(path.join(fixtureDir, 'pages.ts'), 'existing content', 'utf-8');

    scaffold(projectRoot);

    const content = fs.readFileSync(path.join(fixtureDir, 'pages.ts'), 'utf-8');
    expect(content).toBe('existing content');
  });
});
