import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROJECT_DIRS } from '../../utils/layout.js';
import { initAgents, scaffold } from '../init.js';

// We need to mock TEMPLATE_DIR to point to our test fixtures
vi.mock('../../utils/constants.js', () => ({
  TEMPLATE_DIR: '/tmp/spectra-test-templates',
  PACKAGE_ROOT: '/tmp/spectra-test-package',
}));

vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    plain: vi.fn(),
    cyan: vi.fn(),
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
  const configDir = path.join(templateRoot, 'config');
  const cursorDir = path.join(templateRoot, 'cursor');

  for (const d of [
    plannerDir,
    generatorDir,
    healerDir,
    sharedDir,
    docsDir,
    fixturesDir,
    configDir,
    cursorDir,
  ]) {
    fs.mkdirSync(d, { recursive: true });
  }

  fs.writeFileSync(path.join(plannerDir, 'AGENT.md'), '# Planner Agent', 'utf-8');
  fs.writeFileSync(path.join(generatorDir, 'AGENT.md'), '# Generator Agent', 'utf-8');
  fs.writeFileSync(path.join(healerDir, 'AGENT.md'), '# Healer Agent', 'utf-8');
  fs.writeFileSync(path.join(sharedDir, 'config.md'), '# Shared Config', 'utf-8');
  fs.writeFileSync(path.join(docsDir, 'SCOPE-template.md'), '# Scope Template', 'utf-8');
  fs.writeFileSync(path.join(fixturesDir, 'pages.ts'), 'export const pages = {};', 'utf-8');
  fs.writeFileSync(path.join(configDir, 'playwright.config.ts'), '// config', 'utf-8');
  fs.writeFileSync(path.join(cursorDir, 'mcp.json'), '{}', 'utf-8');
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

  it('keeps a template file the user changed', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    initAgents(projectRoot);

    const installed = path.join(projectRoot, '.spectra', 'agents', 'planner', 'AGENT.md');
    fs.writeFileSync(installed, '# My Planner Agent', 'utf-8');

    initAgents(projectRoot);

    expect(fs.readFileSync(installed, 'utf-8')).toBe('# My Planner Agent');
  });

  it('refreshes a template file the user did not change', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    initAgents(projectRoot);

    fs.writeFileSync(
      path.join(templateDir, 'agents', 'planner', 'AGENT.md'),
      '# New Planner',
      'utf-8',
    );
    initAgents(projectRoot);

    const installed = path.join(projectRoot, '.spectra', 'agents', 'planner', 'AGENT.md');
    expect(fs.readFileSync(installed, 'utf-8')).toBe('# New Planner');
  });

  it('removes an installed file whose template is gone', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    initAgents(projectRoot);

    fs.rmSync(path.join(templateDir, 'agents', 'shared', 'config.md'));
    initAgents(projectRoot);

    const installed = path.join(projectRoot, '.spectra', 'agents', 'shared', 'config.md');
    expect(fs.existsSync(installed)).toBe(false);
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

    for (const dir of PROJECT_DIRS) {
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

  it('copies the gate documentation into specs/', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    const packageRoot = '/tmp/spectra-test-package';
    const specsSource = path.join(packageRoot, 'specs');
    fs.mkdirSync(specsSource, { recursive: true });
    fs.writeFileSync(path.join(specsSource, 'PLANNER-GATE.md'), '# Planner Gate', 'utf-8');

    scaffold(projectRoot);

    expect(fs.existsSync(path.join(projectRoot, 'specs', 'PLANNER-GATE.md'))).toBe(true);

    fs.rmSync(packageRoot, { recursive: true, force: true });
  });

  it('copies a playwright config when the project has none', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    scaffold(projectRoot);

    expect(fs.existsSync(path.join(projectRoot, 'playwright.config.ts'))).toBe(true);
  });

  it('does not overwrite an existing playwright config', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);
    fs.writeFileSync(path.join(projectRoot, 'playwright.config.ts'), 'mine', 'utf-8');

    scaffold(projectRoot);

    expect(fs.readFileSync(path.join(projectRoot, 'playwright.config.ts'), 'utf-8')).toBe('mine');
  });

  it('copies the mcp config', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    scaffold(projectRoot);

    expect(fs.existsSync(path.join(projectRoot, '.cursor', 'mcp.json'))).toBe(true);
  });
});
