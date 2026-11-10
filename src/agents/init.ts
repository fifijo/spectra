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
    const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * The path of an installed file, or null when the key points outside the
 * destination. A manifest is a file in the project; it must not be able to
 * name a file outside it.
 */
function insideDest(dest: string, key: string): string | null {
  const root = path.resolve(dest);
  const file = path.resolve(root, key);
  return file.startsWith(root + path.sep) ? file : null;
}

/**
 * Copy template files from the package's templates/ directory
 * into the consuming project's .spectra/ directory.
 */
export function initAgents(projectRoot: string): void {
  const agentsSource = path.join(TEMPLATE_DIR, 'agents');
  const agentsDest = path.join(projectRoot, '.spectra', 'agents');

  if (!fs.existsSync(agentsSource)) {
    throw new Error(`Template directory not found: ${agentsSource}`);
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

  // The fixture, the Playwright config, both MCP configs, the seed spec and the
  // CI workflow: the project keeps its own version of each one.
  copyIfMissing(
    path.join(TEMPLATE_DIR, 'fixtures', 'pages.ts'),
    path.join(projectRoot, 'fixtures', 'pages.ts'),
  );
  // The Healer runs the tests with the Playwright config.
  copyIfMissing(
    path.join(TEMPLATE_DIR, 'config', 'playwright.config.ts'),
    path.join(projectRoot, 'playwright.config.ts'),
  );
  // The Agents explore with Playwright MCP.
  copyIfMissing(
    path.join(TEMPLATE_DIR, 'cursor', 'mcp.json'),
    path.join(projectRoot, '.cursor', 'mcp.json'),
  );
  // The host MCP config lets the model in the user's own chat or CLI drive the
  // Spectrum, without an agent CLI.
  copyIfMissing(path.join(TEMPLATE_DIR, '.mcp.json'), path.join(projectRoot, '.mcp.json'));
  // The seed spec: the gate docs ask the user to run it.
  copyIfMissing(
    path.join(TEMPLATE_DIR, 'tests', 'seed.spec.ts'),
    path.join(projectRoot, 'tests', 'seed.spec.ts'),
  );
  // The CI workflow runs the generated suite in GitHub Actions.
  copyIfMissing(
    path.join(TEMPLATE_DIR, '.github', 'workflows', 'test.yml'),
    path.join(projectRoot, '.github', 'workflows', 'test.yml'),
  );

  logger.success('Project scaffolded successfully.');
}

/**
 * Copy a template into the project, but never over a file that is already there.
 */
function copyIfMissing(from: string, to: string): void {
  if (!fs.existsSync(from) || fs.existsSync(to)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
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
    const file = insideDest(dest, key);
    if (!file) {
      logger.warn(`Ignored a template path outside the project: ${key}`);
      continue;
    }
    if (!fs.existsSync(file)) continue;
    if (hash(fs.readFileSync(file)) !== installed[key]) {
      logger.warn(`Kept your edited ${key} (its template is gone)`);
      continue;
    }
    fs.unlinkSync(file);
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`, 'utf-8');
}
