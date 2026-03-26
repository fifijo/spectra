import fs from 'node:fs';
import path from 'node:path';

import { buildPrompt, runAgent } from './agents/runner.js';
import { initAgents, scaffold } from './agents/init.js';
import { createScopeContext } from './utils/scope.js';
import { detectMode } from './utils/detect-mode.js';
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

  // --batch: read scopes from JSON file and run each sequentially
  if (options.batch) {
    const batchPath = path.resolve(cwd, options.batch);
    if (!fs.existsSync(batchPath)) {
      logger.error(`Batch file not found: ${batchPath}`);
      process.exit(1);
    }

    let batchConfig: { url?: string; scopes: Array<{ name?: string; file: string; description?: string }> };
    try {
      batchConfig = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
    } catch {
      logger.error(`Failed to parse batch file: ${batchPath}`);
      process.exit(1);
    }

    const batchUrl = options.url ?? batchConfig.url ?? process.env['SPECTRA_URL'] ?? '';
    if (!batchUrl) {
      logger.error('Error: URL required. Use --url, set SPECTRA_URL, or add "url" to batch config');
      process.exit(1);
    }

    if (!Array.isArray(batchConfig.scopes) || batchConfig.scopes.length === 0) {
      logger.error('Batch config must have a non-empty "scopes" array');
      process.exit(1);
    }

    logger.banner();
    logger.info(`Batch mode: ${batchConfig.scopes.length} scope(s)`);
    logger.plain('');

    for (const [i, scopeDef] of batchConfig.scopes.entries()) {
      const label = scopeDef.name ?? `Scope ${i + 1}`;
      logger.separator('blue', `📋 ${label}`);
      run({
        url: batchUrl,
        file: scopeDef.file,
        manual: options.manual,
        debug: options.debug,
      });
    }

    logger.separator('blue', '✨ BATCH COMPLETE');
    logger.plain(`  Scopes processed: ${batchConfig.scopes.length}`);
    logger.plain('');
    return;
  }

  const url = options.url ?? process.env['SPECTRA_URL'] ?? '';
  if (!url) {
    logger.error('Error: URL required. Use --url or set SPECTRA_URL');
    logger.plain('Run spectra --help for usage information.');
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
