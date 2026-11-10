import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { PACKAGE_ROOT, TEMPLATE_DIR } from '../utils/constants.js';
import { PROJECT_DIRS } from '../utils/layout.js';
import { logger } from '../utils/logger.js';

/** Remembers which template version each installed file came from. */
const MANIFEST = '.templates.json';

function hash(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function readManifest(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return {};
  }
}

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

  installTemplates(agentsSource, agentsDest);
  logger.success('Agent templates initialized in .spectra/agents/');
}

/**
 * Scaffold the standard project structure for a new Spectra project.
 */
export function scaffold(projectRoot: string): void {
  for (const dir of PROJECT_DIRS) {
    const full = path.join(projectRoot, dir);
    fs.mkdirSync(full, { recursive: true });
  }

  initAgents(projectRoot);

  // Copy doc templates
  const docsSource = path.join(TEMPLATE_DIR, 'docs');
  const docsDest = path.join(projectRoot, 'docs');
  if (fs.existsSync(docsSource)) {
    installTemplates(docsSource, docsDest);
  }

  // Copy the gate documentation into specs/
  const specsSource = path.join(PACKAGE_ROOT, 'specs');
  const specsDest = path.join(projectRoot, 'specs');
  if (fs.existsSync(specsSource)) {
    installTemplates(specsSource, specsDest);
  }

  // Copy fixture template if not present
  const fixtureSource = path.join(TEMPLATE_DIR, 'fixtures', 'pages.ts');
  const fixtureDest = path.join(projectRoot, 'fixtures', 'pages.ts');
  if (fs.existsSync(fixtureSource) && !fs.existsSync(fixtureDest)) {
    fs.mkdirSync(path.dirname(fixtureDest), { recursive: true });
    fs.copyFileSync(fixtureSource, fixtureDest);
  }

  // Copy the Playwright config if not present: the Healer runs the tests with it.
  const configSource = path.join(TEMPLATE_DIR, 'config', 'playwright.config.ts');
  const configDest = path.join(projectRoot, 'playwright.config.ts');
  if (fs.existsSync(configSource) && !fs.existsSync(configDest)) {
    fs.copyFileSync(configSource, configDest);
  }

  // Copy the MCP config if not present: the Agents explore with Playwright MCP.
  const mcpSource = path.join(TEMPLATE_DIR, 'cursor', 'mcp.json');
  const mcpDest = path.join(projectRoot, '.cursor', 'mcp.json');
  if (fs.existsSync(mcpSource) && !fs.existsSync(mcpDest)) {
    fs.mkdirSync(path.dirname(mcpDest), { recursive: true });
    fs.copyFileSync(mcpSource, mcpDest);
  }

  logger.success('Project scaffolded successfully.');
}

/**
 * Install the templates of `src` into `dest`.
 * A file the user changed is kept; the path of the new template is printed instead.
 * A file whose template is gone is removed, unless the user changed it.
 */
function installTemplates(src: string, dest: string): void {
  const manifestPath = path.join(dest, MANIFEST);
  const installed = readManifest(manifestPath);
  const next: Record<string, string> = {};

  const walk = (from: string, to: string, rel: string): void => {
    fs.mkdirSync(to, { recursive: true });

    for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
      const fromPath = path.join(from, entry.name);
      const toPath = path.join(to, entry.name);
      const key = rel ? path.join(rel, entry.name) : entry.name;

      if (entry.isDirectory()) {
        walk(fromPath, toPath, key);
        continue;
      }

      const template = fs.readFileSync(fromPath);
      const templateHash = hash(template);

      if (fs.existsSync(toPath)) {
        const current = fs.readFileSync(toPath);
        // The user changed the file when its hash is not the one we installed.
        const changed = installed[key]
          ? hash(current) !== installed[key]
          : !current.equals(template);
        if (changed) {
          logger.warn(`Kept your edited ${key} (new template: ${fromPath})`);
          next[key] = templateHash;
          continue;
        }
      }

      fs.copyFileSync(fromPath, toPath);
      next[key] = templateHash;
    }
  };

  walk(src, dest, '');

  // Templates that no longer exist are removed, unless the user changed them.
  for (const key of Object.keys(installed)) {
    if (next[key]) continue;
    const file = path.join(dest, key);
    if (!fs.existsSync(file)) continue;
    if (hash(fs.readFileSync(file)) !== installed[key]) {
      logger.warn(`Kept your edited ${key} (its template is gone)`);
      continue;
    }
    fs.unlinkSync(file);
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`, 'utf-8');
}
