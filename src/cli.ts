import fs from 'node:fs';
import path from 'node:path';
import {
  AGENTS,
  type Agent,
  COMPLETION_SIGNALS,
  OUTPUT_ARTEFACTS,
  SCOPE_CONTEXT,
} from './agents/catalogue.js';
import { initAgents, scaffold } from './agents/init.js';
import { runAgent } from './agents/runner.js';
import { parseBatchConfig } from './utils/batch.js';
import { DEFAULT_OUTPUT_DIR } from './utils/constants.js';
import { detectMode } from './utils/detect-mode.js';
import { OUTPUT_DIRS } from './utils/layout.js';
import { logger } from './utils/logger.js';
import { createScopeContext, type Scope } from './utils/scope.js';

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

/** Delete files under the run's output dir. */
function clean(outputDir: string, files: string[]): void {
  for (const f of files) {
    const fp = path.join(outputDir, f);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
}

/**
 * Copy what an Agent produced into the Scope's own folder, so the next Scope cannot overwrite it.
 */
function preserve(agent: Agent, outputDir: string, scopeDir: string): void {
  for (const artefact of agent.outputs) {
    const from = path.join(outputDir, artefact);
    if (!fs.existsSync(from)) continue;
    const to = path.join(scopeDir, artefact);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}

/** The output files an Agent was supposed to write, and that are missing. */
function missingOutputs(agent: Agent, outputDir: string): string[] {
  return agent.outputs.filter((file) => !fs.existsSync(path.join(outputDir, file)));
}

/** The CLI flags that apply to every Scope of a batch. */
function sharedFlags(options: SpectraOptions): string[] {
  return [
    options.page ? `page ${options.page}` : '',
    options.scope ? `feature "${options.scope}"` : '',
    options.file ? `file ${options.file}` : '',
  ].filter(Boolean);
}

/** A folder name for a Scope: readable, and unique because it carries the Scope's number. */
function slugify(label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'scope';
}

/** List files with the given extension, recursively. */
function listFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

export async function run(options: SpectraOptions = {}): Promise<boolean> {
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
    logger.plain('  1. Install Playwright: pnpm add -D @playwright/test');
    logger.plain('  2. Install the browser: pnpm exec playwright install chromium');
    logger.plain('  3. Start your web application');
    logger.plain('  4. Run: spectra --url http://localhost:5173');
    logger.plain('');
    return true;
  }

  // --batch: read scopes from JSON file and run each sequentially
  if (options.batch) {
    const batchPath = path.resolve(cwd, options.batch);
    if (!fs.existsSync(batchPath)) {
      logger.error(`Batch file not found: ${batchPath}`);
      process.exit(1);
    }

    const parsed = parseBatchConfig(fs.readFileSync(batchPath, 'utf-8'));
    if (!parsed.ok) {
      logger.error(`Invalid batch file ${batchPath}: ${parsed.error}`);
      process.exit(1);
    }
    const batchConfig = parsed.batch;

    const batchUrl = options.url ?? batchConfig.url ?? process.env.SPECTRA_URL ?? '';
    if (!batchUrl) {
      logger.error('Error: URL required. Use --url, set SPECTRA_URL, or add "url" to batch config');
      process.exit(1);
    }

    logger.banner();
    logger.info(`Batch mode: ${batchConfig.scopes.length} scope(s)`);
    logger.plain('');

    // The batch starts with empty results; every scope keeps its own, so a scope cannot delete the ones before it.
    clean(path.join(cwd, DEFAULT_OUTPUT_DIR), OUTPUT_ARTEFACTS);
    // The scope folders of an earlier batch are copies, so this run starts without them.
    fs.rmSync(path.join(cwd, DEFAULT_OUTPUT_DIR, 'scopes'), { recursive: true, force: true });

    const shared = sharedFlags(options);
    if (shared.length > 0) {
      logger.info(`Applied to every scope: ${shared.join(', ')}`);
    }

    let failed = 0;
    const results: string[] = [];
    for (const [i, scopeDef] of batchConfig.scopes.entries()) {
      const label = scopeDef.name ?? `Scope ${i + 1}`;
      logger.separator('blue', `📋 ${label}`);
      const folder = `${i + 1}-${slugify(label)}`;
      const ok = await runScope(
        {
          url: batchUrl,
          page: options.page ?? scopeDef.page,
          scope: options.scope ?? scopeDef.scope,
          file: options.file ?? scopeDef.file,
          manual: options.manual,
          debug: options.debug,
        },
        false,
        folder,
      );
      results.push(path.join(DEFAULT_OUTPUT_DIR, 'scopes', folder));
      if (!ok) {
        failed += 1;
        logger.error(`Scope "${label}" failed`);
      }
    }

    logger.separator('blue', failed === 0 ? '✨ BATCH COMPLETE' : '❌ BATCH FINISHED WITH ERRORS');
    logger.plain(`  Scopes: ${batchConfig.scopes.length} total, ${failed} failed`);
    logger.plain('  Results:');
    for (const result of results) {
      logger.plain(`    ${result}`);
    }
    logger.plain('');
    return failed === 0;
  }

  return runScope(options, true);
}

/**
 * Run the Agents for one Scope.
 * `freshOutputs` deletes the results of an earlier run; in a batch they are kept.
 * `resultsFolder` names the folder that keeps this Scope's results in a batch.
 */
async function runScope(
  options: SpectraOptions,
  freshOutputs: boolean,
  resultsFolder?: string,
): Promise<boolean> {
  const cwd = process.cwd();

  const url = options.url ?? process.env.SPECTRA_URL ?? '';
  if (!url) {
    logger.error('Error: URL required. Use --url or set SPECTRA_URL');
    logger.plain('Run spectra --help for usage information.');
    process.exit(1);
  }

  const mode = detectMode(options.manual);
  const agentsDir = path.join(cwd, '.spectra', 'agents');
  const outputDir = path.join(cwd, DEFAULT_OUTPUT_DIR);

  // Ensure output dirs exist
  for (const dir of OUTPUT_DIRS) {
    fs.mkdirSync(path.join(outputDir, dir), { recursive: true });
  }

  logger.debug('cli', 'Ensured output directories exist');

  // Always refresh the agent templates so an upgraded package ships new instructions
  logger.debug('cli', 'Refreshing agent templates...');
  initAgents(cwd);

  logger.banner();
  logger.cyan(`Mode: ${mode}`);
  logger.cyan(`Target: ${url}`);
  if (options.page) logger.cyan(`Page: ${options.page}`);
  if (options.scope) logger.cyan(`Scope: ${options.scope}`);
  logger.plain('');

  // Create scope context
  logger.debug('cli', 'Creating scope context...');
  const scope: Scope = {
    url,
    page: options.page,
    scope: options.scope,
    file: options.file,
  };
  createScopeContext(path.join(agentsDir, SCOPE_CONTEXT), scope);
  logger.debug('cli', 'Scope context created');

  // Clean previous outputs
  logger.debug('cli', 'Cleaning previous outputs...');
  clean(outputDir, COMPLETION_SIGNALS);
  if (freshOutputs) clean(outputDir, OUTPUT_ARTEFACTS);
  logger.debug('cli', 'Previous outputs cleaned');

  // The Scope keeps its own results, so the next Scope cannot overwrite them.
  const scopeDir = resultsFolder ? path.join(outputDir, 'scopes', resultsFolder) : undefined;
  if (scopeDir) fs.rmSync(scopeDir, { recursive: true, force: true });

  const pagesDir = path.join(cwd, 'pages');
  const testsDir = path.join(cwd, 'tests');
  const pagesBefore = new Set(listFiles(pagesDir, '.ts'));
  const testsBefore = new Set(listFiles(testsDir, '.spec.ts'));

  // Run agents, one after another
  let ok = true;
  for (const agent of AGENTS) {
    logger.debug('cli', `Starting ${agent.name} agent...`);
    try {
      await runAgent(agent, {
        mode,
        outputDir,
        agentsDir,
        debug: options.debug ?? false,
      });
    } catch (err) {
      logger.error(
        `Agent ${agent.name} failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      ok = false;
      break;
    }
    const missing = missingOutputs(agent, outputDir);
    if (missing.length > 0) {
      const dir = path.relative(cwd, outputDir);
      logger.error(`Agent ${agent.name} did not write ${missing.join(', ')} (relative to ${dir})`);
      ok = false;
      break;
    }
    if (scopeDir) preserve(agent, outputDir, scopeDir);
    logger.debug('cli', `${agent.name} complete`);
  }

  // Summary
  logger.separator('blue', ok ? '✨ SPECTRUM COMPLETE' : '❌ SPECTRUM FAILED');

  const pageCount = listFiles(pagesDir, '.ts').filter((f) => !pagesBefore.has(f)).length;
  const testCount = listFiles(testsDir, '.spec.ts').filter((f) => !testsBefore.has(f)).length;

  logger.plain('Generated:');
  logger.plain(`  Page Objects: ${pageCount}`);
  logger.plain(`  Test files: ${testCount}`);
  logger.plain('');
  logger.plain('Commands:');
  logger.plain('  npx playwright test                                  Run all tests');
  logger.plain('  npx playwright test --ui                             Run with UI');
  logger.plain('  npx playwright show-report .spectra/output/reports   View report');
  logger.plain('');

  return ok;
}
