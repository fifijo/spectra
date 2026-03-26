#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { buildPrompt, runAgent } from './agents/runner.js';
import { initAgents, scaffold } from './agents/init.js';
import { createScopeContext } from './utils/scope.js';
import { detectMode } from './utils/detect-mode.js';
import { DEFAULTS } from './utils/constants.js';
import { logger } from './utils/logger.js';

export interface SpectraOptions {
  url?: string;
  page?: string;
  scope?: string;
  file?: string;
  batch?: string;
  manual?: boolean;
  init?: boolean;
  debug?: boolean;
}

function printUsage(): void {
  logger.banner();
  logger.plain('Usage: spectra [options]');
  logger.plain('');
  logger.plain('Commands:');
  logger.plain('  --init              Scaffold project structure and agent templates');
  logger.plain('');
  logger.plain('Options:');
  logger.plain('  -u, --url URL       Target URL (required, or set SPECTRA_URL)');
  logger.plain('  -p, --page PAGE     Specific page to test (e.g., /checkout)');
  logger.plain('  -s, --scope TEXT    Feature to focus on (e.g., "payment form")');
  logger.plain('  -f, --file FILE     Scope file with detailed requirements');
  logger.plain('  -b, --batch FILE    JSON file with scope definitions');
  logger.plain('  -m, --manual        Force manual mode (use IDE prompts)');
  logger.plain('      --debug         Enable debug output');
  logger.plain('  -h, --help          Show this help');
  logger.plain('');
  logger.plain('Examples:');
  logger.plain('  spectra --init');
  logger.plain('  spectra --url http://localhost:5173');
  logger.plain('  spectra -u http://localhost:5173 -p /checkout -s "payment form"');
  logger.plain('  spectra -u http://localhost:5173 -f SCOPE.md');
  logger.plain('  spectra --batch scopes-batch.json');
  logger.plain('');
}

function parseCliArgs(): SpectraOptions {
  const { values } = parseArgs({
    options: {
      url:    { type: 'string', short: 'u' },
      page:   { type: 'string', short: 'p' },
      scope:  { type: 'string', short: 's' },
      file:   { type: 'string', short: 'f' },
      batch:  { type: 'string', short: 'b' },
      manual: { type: 'boolean', short: 'm', default: false },
      init:   { type: 'boolean', default: false },
      debug:  { type: 'boolean', default: false },
      help:   { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
  });

  if (values.help) {
    printUsage();
    process.exit(0);
  }

  return {
    url:    values.url,
    page:   values.page,
    scope:  values.scope,
    file:   values.file,
    batch:  values.batch,
    manual: values.manual,
    init:   values.init,
    debug:  values.debug,
  };
}

function clean(cwd: string): void {
  const outputDir = path.join(cwd, '.spectra', 'output');
  const files = [
    'plans/.complete',
    'tests/.complete',
    'reports/.complete',
    'plans/test-plan.md',
    'reports/healing-report.md',
  ];
  for (const f of files) {
    const fp = path.join(outputDir, f);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
}

export function run(options: SpectraOptions = {}): void {
  const cwd = process.cwd();

  // --init: scaffold project
  if (options.init) {
    logger.banner();
    logger.info('Scaffolding Spectra project...');
    scaffold(cwd);
    logger.plain('');
    logger.success('Spectra project initialized!');
    logger.plain('');
    logger.plain('Next steps:');
    logger.plain('  1. Start your web application');
    logger.plain('  2. Run: spectra --url http://localhost:5173');
    logger.plain('');
    return;
  }

  const url = options.url ?? process.env['SPECTRA_URL'] ?? '';
  if (!url) {
    logger.error('Error: URL required. Use --url or set SPECTRA_URL');
    printUsage();
    process.exit(1);
  }

  const mode = detectMode(options.manual);
  const agentsDir = path.join(cwd, '.spectra', 'agents');
  const outputDir = path.join(cwd, '.spectra', 'output');

  // Ensure output dirs exist
  fs.mkdirSync(path.join(outputDir, 'plans'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'reports'), { recursive: true });
  fs.mkdirSync(path.join(outputDir, 'test-results'), { recursive: true });

  // If agents dir doesn't exist, initialize it
  if (!fs.existsSync(agentsDir)) {
    logger.info('Agent templates not found. Initializing...');
    initAgents(cwd);
  }

  logger.banner();
  logger.cyan(`Mode: ${mode}`);
  logger.cyan(`Target: ${url}`);
  if (options.page) logger.cyan(`Page: ${options.page}`);
  if (options.scope) logger.cyan(`Scope: ${options.scope}`);
  logger.plain('');

  // Create scope context
  createScopeContext(path.join(agentsDir, 'shared', 'current-scope.md'), {
    url,
    page: options.page,
    scope: options.scope,
    scopeFile: options.file,
  });

  // Clean previous outputs
  clean(cwd);

  // Run agents
  runAgent(
    {
      name: 'planner',
      color: 'blue',
      emoji: '🔵',
      prompt: buildPrompt(
        'planner',
        'Explore the app with Playwright MCP. Write test plan to .spectra/output/plans/test-plan.md',
        '.spectra/output/plans/.complete',
        agentsDir,
      ),
      mode,
      outputDir,
    },
    agentsDir,
  );

  runAgent(
    {
      name: 'generator',
      color: 'green',
      emoji: '🟢',
      prompt: buildPrompt(
        'generator',
        'Read .spectra/output/plans/test-plan.md. Generate Page Objects in pages/ and tests in tests/',
        '.spectra/output/tests/.complete',
        agentsDir,
      ),
      mode,
      outputDir,
    },
    agentsDir,
  );

  runAgent(
    {
      name: 'healer',
      color: 'magenta',
      emoji: '🟣',
      prompt: buildPrompt(
        'healer',
        'Run pnpm test. Fix failures using Playwright MCP. Write report to .spectra/output/reports/healing-report.md',
        '.spectra/output/reports/.complete',
        agentsDir,
      ),
      mode,
      outputDir,
    },
    agentsDir,
  );

  // Summary
  logger.separator('blue', '✨ SPECTRUM COMPLETE');

  const pagesDir = path.join(cwd, 'pages');
  const testsDir = path.join(cwd, 'tests');

  let pageCount = 0;
  let testCount = 0;
  try {
    pageCount = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.ts')).length;
  } catch { /* empty */ }
  try {
    testCount = fs.readdirSync(testsDir).filter((f) => f.endsWith('.spec.ts')).length;
  } catch { /* empty */ }

  logger.plain('Generated:');
  logger.plain(`  Page Objects: ${pageCount}`);
  logger.plain(`  Test files: ${testCount}`);
  logger.plain('');
  logger.plain('Commands:');
  logger.plain('  pnpm test          Run all tests');
  logger.plain('  pnpm test:ui       Run with UI');
  logger.plain('  pnpm report        View report');
  logger.plain('');
}

// Direct execution (bin entry point)
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith('/spectra') ||
    process.argv[1].endsWith('/cli.js') ||
    process.argv[1].endsWith('/src/cli.ts'));

if (isDirectRun) {
  const opts = parseCliArgs();
  run(opts);
}
