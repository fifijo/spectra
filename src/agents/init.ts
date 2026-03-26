import fs from 'node:fs';
import path from 'node:path';

import { TEMPLATE_DIR } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

/**
 * Copy template files from the package's templates/ directory
 * into the consuming project's .spectra/ directory.
 */
export function initAgents(projectRoot: string): void {
  const agentsSource = path.join(TEMPLATE_DIR, 'agents');
  const agentsDest = path.join(projectRoot, '.spectra', 'agents');

  if (!fs.existsSync(agentsSource)) {
    logger.error(`Template directory not found: ${agentsSource}`);
    process.exit(1);
  }

  copyDirRecursive(agentsSource, agentsDest);
  logger.success('Agent templates initialized in .spectra/agents/');
}

/**
 * Scaffold the standard project structure for a new Spectra project.
 */
export function scaffold(projectRoot: string): void {
  const dirs = [
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

  for (const dir of dirs) {
    const full = path.join(projectRoot, dir);
    fs.mkdirSync(full, { recursive: true });
  }

  initAgents(projectRoot);

  // Copy doc templates
  const docsSource = path.join(TEMPLATE_DIR, 'docs');
  const docsDest = path.join(projectRoot, 'docs');
  if (fs.existsSync(docsSource)) {
    copyDirRecursive(docsSource, docsDest);
  }

  // Copy fixture template if not present
  const fixtureSource = path.join(TEMPLATE_DIR, 'fixtures', 'pages.ts');
  const fixtureDest = path.join(projectRoot, 'fixtures', 'pages.ts');
  if (fs.existsSync(fixtureSource) && !fs.existsSync(fixtureDest)) {
    fs.mkdirSync(path.dirname(fixtureDest), { recursive: true });
    fs.copyFileSync(fixtureSource, fixtureDest);
  }

  logger.success('Project scaffolded successfully.');
}

function copyDirRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
