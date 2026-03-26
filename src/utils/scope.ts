import fs from 'node:fs';
import path from 'node:path';

export interface ScopeOptions {
  url: string;
  page?: string;
  scope?: string;
  scopeFile?: string;
}

/**
 * Create the runtime scope context file that agents read
 * to understand the current testing constraints.
 */
export function createScopeContext(
  outputPath: string,
  options: ScopeOptions,
): void {
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });

  const lines: string[] = [
    '# Current Spectra Scope',
    '',
    '## Target',
    `- **URL**: ${options.url}`,
  ];

  if (options.page) {
    lines.push(`- **Page**: ${options.page}`);
    lines.push(`- **Full URL**: ${options.url}${options.page}`);
  }

  lines.push('');

  if (options.scope) {
    lines.push('## Feature Focus');
    lines.push(`Test ONLY: **${options.scope}**`);
    lines.push('Ignore other features on the page.');
    lines.push('');
  }

  if (options.scopeFile && fs.existsSync(options.scopeFile)) {
    const content = fs.readFileSync(options.scopeFile, 'utf-8');
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
