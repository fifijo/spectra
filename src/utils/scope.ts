import fs from 'node:fs';
import path from 'node:path';

/** What a Spectrum run is pointed at. */
export interface Scope {
  url: string;
  page?: string;
  /** The single feature to test. */
  scope?: string;
  /** Path of a file with detailed requirements. */
  file?: string;
}

/** Join a base URL and a page path without producing a double or missing slash. */
function fullUrl(url: string, page: string): string {
  if (/^https?:\/\//i.test(page)) return page;
  const base = url.replace(/\/+$/, '');
  const path = page.startsWith('/') ? page : `/${page}`;
  return `${base}${path}`;
}

/**
 * Create the runtime scope context file that agents read
 * to understand the current testing constraints.
 */
export function createScopeContext(outputPath: string, scope: Scope): void {
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });

  const lines: string[] = ['# Current Spectra Scope', '', '## Target', `- **URL**: ${scope.url}`];

  if (scope.page) {
    lines.push(`- **Page**: ${scope.page}`);
    lines.push(`- **Full URL**: ${fullUrl(scope.url, scope.page)}`);
  }

  lines.push('');

  if (scope.scope) {
    lines.push('## Feature Focus');
    lines.push(`Test ONLY: **${scope.scope}**`);
    lines.push('Ignore other features on the page.');
    lines.push('');
  }

  if (scope.file && fs.existsSync(scope.file)) {
    const content = fs.readFileSync(scope.file, 'utf-8');
    lines.push('## Detailed Requirements');
    lines.push(content);
    lines.push('');
  }

  lines.push('## Instructions');
  lines.push('- If a specific page is given, navigate there directly');
  lines.push('- If a feature scope is given, test ONLY that feature');
  lines.push('- Ignore unrelated elements on the same page');
  lines.push('');

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
}
