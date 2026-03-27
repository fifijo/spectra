#!/usr/bin/env node

import { parseArgs } from 'node:util';

import { run, type SpectraOptions } from './cli.js';
import { logger } from './utils/logger.js';

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
      url: { type: 'string', short: 'u' },
      page: { type: 'string', short: 'p' },
      scope: { type: 'string', short: 's' },
      file: { type: 'string', short: 'f' },
      batch: { type: 'string', short: 'b' },
      manual: { type: 'boolean', short: 'm', default: false },
      init: { type: 'boolean', default: false },
      debug: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
  });

  if (values.help) {
    printUsage();
    process.exit(0);
  }

  return {
    url: values.url,
    page: values.page,
    scope: values.scope,
    file: values.file,
    batch: values.batch,
    manual: values.manual,
    init: values.init,
    debug: values.debug,
  };
}

const opts = parseCliArgs();
run(opts);
