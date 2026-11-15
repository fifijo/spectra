/**
 * The documents describe what Spectra does. This test keeps that true.
 *
 * Every claim a reader can check from the docs — a flag, an environment
 * variable, an exported function, a path, a tag, a gate rule — is checked
 * against the code that has to honour it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { AGENTS } from '../agents/catalogue.js';
import { parseBatchConfig } from '../utils/batch.js';
import { PACKAGE_ROOT, TEMPLATE_DIR } from '../utils/constants.js';

const repo = PACKAGE_ROOT;

function read(relative: string): string {
  return fs.readFileSync(path.join(repo, relative), 'utf-8');
}

function template(...parts: string[]): string {
  return fs.readFileSync(path.join(TEMPLATE_DIR, ...parts), 'utf-8');
}

const README = read('README.md');
const QUICK_REFERENCE = read('docs/QUICK-REFERENCE.md');
const WALKTHROUGH = read('docs/WALKTHROUGH.md');
const BATCH_DOC = read('docs/BATCH-CONFIG.md');
const SCOPE_TEMPLATE = read('docs/SCOPE-template.md');
const CI_CD = read('docs/CI-CD.md');
const GENERATOR_GATE = read('specs/GENERATOR-GATE.md');
const PLANNER_GATE = read('specs/PLANNER-GATE.md');
const HEALER_POLICY = read('specs/CI-HEALER-POLICY.md');
const USAGE = read('src/args.ts');
const INDEX = read('src/index.ts');
const SCOPE_SOURCE = read('src/utils/scope.ts');
const BATCH_SOURCE = read('src/utils/batch.ts');
const INIT_SOURCE = read('src/agents/init.ts');
const CONFIG_TEMPLATE = template('config', 'playwright.config.ts');

describe('the command line the documents promise', () => {
  const flags = [
    '--url',
    '--page',
    '--scope',
    '--file',
    '--batch',
    '--manual',
    '--mode',
    '--mcp',
    '--init',
    '--debug',
    '--help',
  ];

  for (const flag of flags) {
    it(`the usage names ${flag}`, () => expect(USAGE).toContain(flag));
    it(`the README documents ${flag}`, () => expect(README).toContain(`\`${flag}\``));
  }

  for (const mode of ['cursor-agent', 'claude-code', 'codex', 'opencode', 'gemini', 'manual']) {
    it(`the usage names the ${mode} mode`, () => expect(USAGE).toContain(mode));
    it(`the README names the ${mode} mode`, () => expect(README).toContain(mode));
  }

  it('every flag of the README table is a flag of the CLI', () => {
    const rows = README.split('\n').filter((line) => line.startsWith('| `--'));
    expect(rows.length).toBeGreaterThan(8);
    for (const row of rows) {
      const flag = row.split('|')[1].trim();
      expect(USAGE).toContain(flag.replace(/`/g, ''));
    }
  });

  it('the short flags of the README are the short flags of the CLI', () => {
    for (const short of ['u', 'p', 's', 'f', 'b', 'm']) {
      expect(USAGE).toContain(`short: '${short}'`);
    }
  });
});

describe('the environment variables the documents promise', () => {
  const variables = [
    'SPECTRA_URL',
    'SPECTRA_MODE',
    'SPECTRA_BROWSERS',
    'SPECTRA_TAGS',
    'SPECTRA_DEBUG',
  ];

  for (const variable of variables) {
    it(`the README documents ${variable}`, () => expect(README).toContain(variable));
    it(`the quick reference documents ${variable}`, () =>
      expect(QUICK_REFERENCE).toContain(variable));
  }

  it('the config reads the variables it is documented to read', () => {
    for (const variable of ['SPECTRA_URL', 'SPECTRA_BROWSERS', 'SPECTRA_TAGS']) {
      expect(CONFIG_TEMPLATE).toContain(variable);
    }
  });

  it('the CLI reads the URL and the mode from the environment', () => {
    expect(read('src/args.ts')).toContain('SPECTRA_URL');
    expect(read('src/args.ts')).toContain('SPECTRA_MODE');
  });

  it('the browsers the config offers are the ones the README lists', () => {
    for (const browser of ['chromium', 'firefox', 'webkit', 'mobile', 'all']) {
      expect(CONFIG_TEMPLATE).toContain(browser);
      expect(README).toContain(browser);
    }
  });
});

describe('the library the README documents', () => {
  const exports = [
    'run',
    'SpectraOptions',
    'detectMode',
    'CliMode',
    'createScopeContext',
    'DEFAULT_OUTPUT_DIR',
    'TEMPLATE_DIR',
  ];

  for (const name of exports) {
    it(`the package exports ${name}`, () => expect(INDEX).toContain(name));
    it(`the README documents ${name}`, () => expect(README).toContain(name));
  }

  it('the library never exits the process', () => {
    expect(read('src/cli.ts')).not.toContain('process.exit');
  });
});

describe('the paths the documents promise', () => {
  const paths = [
    '.spectra/output/plans/test-plan.md',
    '.spectra/output/reports/healing-report.md',
    '.spectra/output/reports/status.json',
    '.spectra/output/reports/results.json',
  ];

  for (const target of paths) {
    it(`the quick reference lists ${target}`, () => expect(QUICK_REFERENCE).toContain(target));
  }

  const folders = ['test-results/', 'evidence/', 'scopes/', 'agents/'];

  for (const folder of folders) {
    it(`the quick reference lists the ${folder} folder`, () =>
      expect(QUICK_REFERENCE).toContain(folder));
  }

  it('the catalogue writes the paths the documents promise', () => {
    const planner = AGENTS.find((agent) => agent.name === 'planner');
    const healer = AGENTS.find((agent) => agent.name === 'healer');
    expect(planner?.outputs).toContain('plans/test-plan.md');
    expect(healer?.outputs).toContain('reports/healing-report.md');
    expect(healer?.outputs).toContain('reports/status.json');
    expect(healer?.outputs).toContain('reports/results.json');
  });

  it('the HTML report has a folder of its own, so the Healer report survives', () => {
    expect(CONFIG_TEMPLATE).toContain('.spectra/output/reports/html');
    expect(QUICK_REFERENCE).toContain('show-report .spectra/output/reports/html');
    expect(README).toContain('show-report .spectra/output/reports/html');
  });
});

describe('the files --init writes', () => {
  const files: [string, string][] = [
    ['playwright.config.ts', 'config/playwright.config.ts'],
    ['tests/seed.spec.ts', 'tests/seed.spec.ts'],
    ['fixtures/pages.ts', 'fixtures/pages.ts'],
    ['.cursor/mcp.json', 'cursor/mcp.json'],
    ['.mcp.json', '.mcp.json'],
    ['.github/workflows/test.yml', '.github/workflows/test.yml'],
    ['scopes-batch.json', 'scopes-batch.json'],
    ['docs/SCOPE-template.md', 'docs/SCOPE-template.md'],
  ];

  for (const [file, source] of files) {
    it(`--init copies ${file}`, () =>
      expect(fs.existsSync(path.join(TEMPLATE_DIR, source))).toBe(true));
  }

  it('the guides --init copies are the guides the package ships', () => {
    for (const guide of ['BATCH-CONFIG.md', 'CI-CD.md', 'QUICK-REFERENCE.md', 'WALKTHROUGH.md']) {
      expect(INIT_SOURCE).toContain(guide);
      expect(fs.existsSync(path.join(repo, 'docs', guide))).toBe(true);
    }
  });

  it('the seed spec checks the URL and the title', () => {
    const seed = template('tests', 'seed.spec.ts');
    expect(seed).toContain('toBeLessThan(400)');
    expect(seed).toContain('toHaveTitle');
  });

  it('the example batch file is valid', () => {
    const example = JSON.parse(template('scopes-batch.json'));
    const parsed = parseBatchConfig(JSON.stringify(example));
    expect(parsed.ok).toBe(true);
  });
});

describe('the scope file the documents promise', () => {
  it('the template has the sections the run reads', () => {
    expect(SCOPE_TEMPLATE).toContain('**Page URL**');
    expect(SCOPE_TEMPLATE).toContain('## Out of Scope');
    expect(SCOPE_SOURCE).toContain('**Page URL**');
    expect(SCOPE_SOURCE).toContain('Out of Scope');
  });

  it('the quick reference explains what the sections become', () => {
    expect(README).toContain('Out of Scope');
    expect(README).toContain('Elements to Ignore');
  });
});

describe('the batch file the documents promise', () => {
  it('the schema in the document is the schema the runner reads', () => {
    for (const key of ['url', 'scopes', 'name', 'file', 'page', 'scope', 'description']) {
      expect(BATCH_DOC).toContain(`"${key}"`);
    }
    expect(BATCH_SOURCE).toContain("'name'");
    expect(BATCH_SOURCE).toContain("'file'");
    expect(BATCH_SOURCE).toContain("'page'");
    expect(BATCH_SOURCE).toContain("'scope'");
    expect(BATCH_SOURCE).toContain("'description'");
  });

  it('the document says the runner refuses an unknown key, and it does', () => {
    expect(BATCH_DOC).toContain('unknown key');
    const parsed = parseBatchConfig(JSON.stringify({ scopes: [{ scpoe: 'typo' }] }));
    expect(parsed.ok).toBe(false);
  });

  it('the document says an empty scopes array is refused, and it is', () => {
    expect(BATCH_DOC).toContain('not empty');
    expect(parseBatchConfig(JSON.stringify({ scopes: [] })).ok).toBe(false);
  });
});

describe('the test tags the documents promise', () => {
  const tags = [
    '@smoke',
    '@critical',
    '@e2e',
    '@slow',
    '@validation',
    '@empty',
    '@a11y',
    '@interaction',
  ];

  for (const tag of tags) {
    it(`${tag} is in the README, the quick reference and the gate`, () => {
      expect(README).toContain(tag);
      expect(QUICK_REFERENCE).toContain(tag);
      expect(GENERATOR_GATE).toContain(tag);
      expect(template('agents', 'generator', 'AGENT.md')).toContain(tag);
    });
  }

  it('@blocked and @flaky are the Healer triage tags', () => {
    expect(README).toContain('@blocked');
    expect(README).toContain('@flaky');
    expect(template('agents', 'healer', 'AGENT.md')).toContain('@blocked');
    expect(template('agents', 'generator', 'AGENT.md')).not.toContain('@blocked');
  });
});

describe('the gates agree with the Agent templates', () => {
  const patterns = [
    'Empty state',
    'Form validation',
    'Toggle',
    'Loading',
    'destructive',
    'Date/time picker',
    'File upload',
    'Autocomplete',
    'Infinite scroll',
    'Toast notification',
    'Keyboard navigation',
    'Password strength',
  ];

  for (const pattern of patterns) {
    it(`the template and the gate both name "${pattern}"`, () => {
      expect(template('agents', 'generator', 'AGENT.md').toLowerCase()).toContain(
        pattern.toLowerCase(),
      );
      expect(GENERATOR_GATE.toLowerCase()).toContain(pattern.toLowerCase());
    });
  }

  it('the locators the gate allows are the ones the template uses', () => {
    for (const locator of ['getByRole', 'getByLabel', 'getByTestId', 'getByText']) {
      expect(GENERATOR_GATE).toContain(locator);
      expect(template('agents', 'generator', 'AGENT.md')).toContain(locator);
    }
  });

  it('the plan the Planner writes has the sections the gate reviews', () => {
    for (const section of ['Application Overview', 'Test Scenarios']) {
      expect(template('agents', 'planner', 'AGENT.md')).toContain(section);
      expect(PLANNER_GATE).toContain(section);
    }
  });

  it('the Healer policy and the Healer template agree', () => {
    expect(template('agents', 'healer', 'AGENT.md')).toContain('MAX_ATTEMPTS = 3');
    expect(HEALER_POLICY).toContain('Max attempts per test | 3');
    expect(template('agents', 'healer', 'AGENT.md')).toContain('Not allowed without human review');
    expect(HEALER_POLICY).toContain('No assertion weakening');
    for (const category of ['bug', 'locator', 'flake', 'env']) {
      expect(HEALER_POLICY.toLowerCase()).toContain(category);
      expect(template('agents', 'healer', 'AGENT.md').toLowerCase()).toContain(category);
    }
  });
});

describe('the CI documents agree with the workflow', () => {
  it('the workflow runs the suite and keeps the artifacts', () => {
    const workflow = template('.github', 'workflows', 'test.yml');
    expect(workflow).toContain('npx playwright test');
    expect(workflow).toContain('.spectra/output/reports/');
    expect(workflow).toContain('.spectra/output/reports/results.json');
    expect(workflow).toContain('.spectra/output/test-results/');
  });

  it('the CI document names the same artifact paths', () => {
    expect(CI_CD).toContain('.spectra/output/reports/');
    expect(CI_CD).toContain('.spectra/output/test-results/');
    expect(HEALER_POLICY).toContain('.spectra/output/reports/results.json');
  });

  it('the policy quotes the config the package ships', () => {
    expect(HEALER_POLICY).toContain('.spectra/output/reports/html');
    expect(HEALER_POLICY).toContain("video: 'retain-on-failure'");
    expect(CONFIG_TEMPLATE).toContain("video: 'retain-on-failure'");
  });
});

describe('the walkthrough and the quick reference agree with the code', () => {
  it('both name the commands the CLI prints', () => {
    for (const doc of [WALKTHROUGH, QUICK_REFERENCE]) {
      expect(doc).toContain('npx playwright test');
      expect(doc).toContain('npx playwright show-report');
    }
  });

  it('the walkthrough names the modes and the artefacts', () => {
    expect(WALKTHROUGH).toContain('--manual');
    expect(WALKTHROUGH).toContain('--batch');
    expect(WALKTHROUGH).toContain('.spectra/output/plans/test-plan.md');
  });
});
