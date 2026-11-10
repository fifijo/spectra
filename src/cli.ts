import fs from 'node:fs';
import path from 'node:path';
import {
  AGENTS,
  type Agent,
  COMPLETION_SIGNALS,
  OUTPUT_ARTEFACTS,
  SCOPE_CONTEXT,
  TEST_RESULTS,
} from './agents/catalogue.js';
import { initAgents, scaffold } from './agents/init.js';
import { agentLogName, runAgent } from './agents/runner.js';
import { countChanged, missingOutputs, takeSnapshot } from './agents/verify.js';
import { serveMcp } from './mcp/server.js';
import { parseBatchConfig, type ScopeDefinition } from './utils/batch.js';
import { DEFAULT_OUTPUT_DIR } from './utils/constants.js';
import { type CliMode, detectMode } from './utils/detect-mode.js';
import { OUTPUT_DIRS } from './utils/layout.js';
import { logger, setLogTarget } from './utils/logger.js';
import { createScopeContext, type Scope } from './utils/scope.js';

export interface SpectraOptions {
  url?: string;
  page?: string;
  scope?: string;
  file?: string;
  batch?: string;
  manual?: boolean;
  /** The Mode to run the Agents with, by name. */
  mode?: string;
  init?: boolean;
  mcp?: boolean;
  debug?: boolean;
}

/** Delete files under the run's output dir. */
function clean(outputDir: string, files: string[]): void {
  for (const f of files) {
    fs.rmSync(path.join(outputDir, f), { force: true, recursive: true });
  }
}

/**
 * The files a run starts without: the artefacts and the logs of the last run,
 * so nothing left over can pass for work this run did.
 */
function cleanRun(outputDir: string): void {
  clean(outputDir, COMPLETION_SIGNALS);
  clean(outputDir, OUTPUT_ARTEFACTS);
  // The test results of an earlier run: the Healer must not read them.
  clean(outputDir, [TEST_RESULTS]);
  // The log of the last run of each Agent.
  clean(
    outputDir,
    AGENTS.map((agent) => agentLogName(agent.name)),
  );
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

/**
 * The Agent reads the scope file and does what it says. A file from outside
 * the project crosses the trust boundary, so say so before the run starts.
 */
function warnOnUntrustedFile(cwd: string, file: string | undefined): void {
  if (!file) return;
  const resolved = path.resolve(cwd, file);
  if (resolved.startsWith(path.resolve(cwd) + path.sep)) return;
  logger.warn(`The scope file ${file} is outside the project.`);
  logger.warn('Its text goes to an agent that can run commands on this machine.');
  logger.warn('Only use a file you trust.');
}

/** Every scope file the run will read, once each. */
function scopeFiles(options: SpectraOptions, scopes: ScopeDefinition[]): string[] {
  const files = new Set<string>();
  if (options.file) files.add(options.file);
  for (const scope of scopes) {
    if (scope.file) files.add(scope.file);
  }
  return [...files];
}

/**
 * Serve the Spectrum over MCP, so the model the user is already talking to
 * (in a chat or a CLI) does the Agent work. No agent CLI is started and the
 * host's model is the one that writes the files.
 */
function runAsMcpServer(cwd: string, options: SpectraOptions): boolean {
  // stdout speaks JSON-RPC from here on: the log lines go to stderr.
  setLogTarget('stderr');

  const url = options.url ?? process.env.SPECTRA_URL ?? '';
  if (!url) {
    logger.error('Error: URL required. Use --url or set SPECTRA_URL');
    logger.plain('Run spectra --help for usage information.');
    return false;
  }

  const agentsDir = path.join(cwd, '.spectra', 'agents');
  const outputDir = path.join(cwd, DEFAULT_OUTPUT_DIR);

  for (const dir of OUTPUT_DIRS) {
    fs.mkdirSync(path.join(outputDir, dir), { recursive: true });
  }

  try {
    // The Healer runs the tests with the Playwright config, and the Generator
    // fills the fixtures: a project that has none cannot finish a Spectrum.
    scaffold(cwd);
  } catch (err) {
    logger.error(err instanceof Error ? err.message : String(err));
    return false;
  }

  // The run starts with empty results: a file left over from an earlier run
  // must never pass for work this run did.
  cleanRun(outputDir);

  const scope: Scope = {
    url,
    page: options.page,
    scope: options.scope,
    file: options.file,
  };
  createScopeContext(path.join(agentsDir, SCOPE_CONTEXT), scope);
  warnOnUntrustedFile(cwd, options.file);

  logger.banner();
  logger.cyan('Mode: mcp');
  logger.cyan(`Target: ${url}`);
  logger.plain('The model in your chat or CLI plays the Agent. Call spectra_next,');
  logger.plain('do the work it describes, then call spectra_done.');
  logger.plain('');

  serveMcp(
    {
      outputDir,
      agentsDir,
      projectRoot: cwd,
      agents: AGENTS,
      index: 0,
      snapshot: takeSnapshot(AGENTS, outputDir, cwd),
    },
    process.stdin,
    process.stdout,
  );
  return true;
}

export async function run(options: SpectraOptions = {}): Promise<boolean> {
  const cwd = process.cwd();

  // --mcp: serve the Spectrum over MCP, so the model the user is already
  // talking to (in a chat or a CLI) does the Agent work.
  if (options.mcp) {
    return runAsMcpServer(cwd, options);
  }

  // --init: scaffold project
  if (options.init) {
    logger.banner();
    logger.info('Scaffolding Spectra project...');
    try {
      scaffold(cwd);
    } catch (err) {
      logger.error(err instanceof Error ? err.message : String(err));
      return false;
    }
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
      return false;
    }

    const parsed = parseBatchConfig(fs.readFileSync(batchPath, 'utf-8'));
    if (!parsed.ok) {
      logger.error(`Invalid batch file ${batchPath}: ${parsed.error}`);
      return false;
    }
    const batchConfig = parsed.batch;

    const batchUrl = options.url ?? batchConfig.url ?? process.env.SPECTRA_URL ?? '';
    if (!batchUrl) {
      logger.error('Error: URL required. Use --url, set SPECTRA_URL, or add "url" to batch config');
      return false;
    }

    logger.banner();
    logger.info(`Batch mode: ${batchConfig.scopes.length} scope(s)`);
    logger.plain('');

    // The scope folders of an earlier batch are copies, so this run starts without them.
    fs.rmSync(path.join(cwd, DEFAULT_OUTPUT_DIR, 'scopes'), { recursive: true, force: true });

    const mode = prepare(cwd, options.manual, options.mode);
    if (!mode) return false;

    const shared = sharedFlags(options);
    if (shared.length > 0) {
      logger.info(`Applied to every scope: ${shared.join(', ')}`);
    }

    for (const file of scopeFiles(options, batchConfig.scopes)) {
      warnOnUntrustedFile(cwd, file);
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
        mode,
        folder,
      );
      if (!ok) {
        failed += 1;
        logger.error(`Scope "${label}" failed`);
      } else {
        results.push(path.join(DEFAULT_OUTPUT_DIR, 'scopes', folder));
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

  const mode = prepare(cwd, options.manual, options.mode);
  if (!mode) return false;
  warnOnUntrustedFile(cwd, options.file);
  return runScope(options, mode);
}

/**
 * Pick the Mode and refresh the agent templates, once for the whole run.
 * Returns null when the templates cannot be installed.
 */
function prepare(cwd: string, manual: boolean | undefined, mode?: string): CliMode | null {
  let detected: CliMode;
  try {
    detected = detectMode(manual ?? false, mode);
  } catch (err) {
    logger.error(err instanceof Error ? err.message : String(err));
    return null;
  }
  try {
    initAgents(cwd);
  } catch (err) {
    logger.error(err instanceof Error ? err.message : String(err));
    return null;
  }
  return detected;
}

/**
 * Run the Agents for one Scope.
 * `resultsFolder` names the folder that keeps this Scope's results in a batch.
 */
async function runScope(
  options: SpectraOptions,
  mode: CliMode,
  resultsFolder?: string,
): Promise<boolean> {
  const cwd = process.cwd();

  const url = options.url ?? process.env.SPECTRA_URL ?? '';
  if (!url) {
    logger.error('Error: URL required. Use --url or set SPECTRA_URL');
    logger.plain('Run spectra --help for usage information.');
    return false;
  }

  const agentsDir = path.join(cwd, '.spectra', 'agents');
  const outputDir = path.join(cwd, DEFAULT_OUTPUT_DIR);

  // Ensure output dirs exist
  for (const dir of OUTPUT_DIRS) {
    fs.mkdirSync(path.join(outputDir, dir), { recursive: true });
  }

  logger.debug('cli', 'Ensured output directories exist');

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

  // Every Scope starts with empty results, so a file left over from the Scope
  // before it can never pass for work this Scope did.
  logger.debug('cli', 'Cleaning previous outputs...');
  cleanRun(outputDir);
  logger.debug('cli', 'Previous outputs cleaned');

  // The Scope keeps its own results, so the next Scope cannot overwrite them.
  const scopeDir = resultsFolder ? path.join(outputDir, 'scopes', resultsFolder) : undefined;
  if (scopeDir) fs.rmSync(scopeDir, { recursive: true, force: true });

  // What the files the Agents write look like now: a file that is not new or
  // not changed is work this run did not do.
  const snapshot = takeSnapshot(AGENTS, outputDir, cwd);
  const pagesDir = path.join(cwd, 'pages');
  const testsDir = path.join(cwd, 'tests');

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
    const missing = missingOutputs(agent, outputDir, cwd, snapshot);
    if (missing.length > 0) {
      logger.error(`Agent ${agent.name} did not write ${missing.join(', ')}`);
      ok = false;
      break;
    }
    if (scopeDir) preserve(agent, outputDir, scopeDir);
    logger.debug('cli', `${agent.name} complete`);
  }

  // Summary
  logger.separator('blue', ok ? '✨ SPECTRUM COMPLETE' : '❌ SPECTRUM FAILED');

  const pageCount = countChanged(pagesDir, snapshot, '.ts');
  const testCount = countChanged(testsDir, snapshot, '.spec.ts');

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
