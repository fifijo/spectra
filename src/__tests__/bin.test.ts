import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseArgs } from 'node:util';

// We test the argument parsing logic by re-implementing parseCliArgs
// since it's not exported from bin.ts. This validates the parseArgs config.

describe('CLI argument parsing', () => {
  const parseCliArgs = (args: string[]) => {
    const { values } = parseArgs({
      args,
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

    return {
      url:    values.url,
      page:   values.page,
      scope:  values.scope,
      file:   values.file,
      batch:  values.batch,
      manual: values.manual,
      init:   values.init,
      debug:  values.debug,
      help:   values.help,
    };
  };

  it('parses --url flag', () => {
    const result = parseCliArgs(['--url', 'http://localhost:3000']);
    expect(result.url).toBe('http://localhost:3000');
  });

  it('parses -u short flag', () => {
    const result = parseCliArgs(['-u', 'http://localhost:3000']);
    expect(result.url).toBe('http://localhost:3000');
  });

  it('parses --page flag', () => {
    const result = parseCliArgs(['--page', '/checkout']);
    expect(result.page).toBe('/checkout');
  });

  it('parses -p short flag', () => {
    const result = parseCliArgs(['-p', '/checkout']);
    expect(result.page).toBe('/checkout');
  });

  it('parses --scope flag', () => {
    const result = parseCliArgs(['--scope', 'payment form']);
    expect(result.scope).toBe('payment form');
  });

  it('parses -s short flag', () => {
    const result = parseCliArgs(['-s', 'payment form']);
    expect(result.scope).toBe('payment form');
  });

  it('parses --file flag', () => {
    const result = parseCliArgs(['--file', 'SCOPE.md']);
    expect(result.file).toBe('SCOPE.md');
  });

  it('parses -f short flag', () => {
    const result = parseCliArgs(['-f', 'SCOPE.md']);
    expect(result.file).toBe('SCOPE.md');
  });

  it('parses --batch flag', () => {
    const result = parseCliArgs(['--batch', 'scopes.json']);
    expect(result.batch).toBe('scopes.json');
  });

  it('parses -b short flag', () => {
    const result = parseCliArgs(['-b', 'scopes.json']);
    expect(result.batch).toBe('scopes.json');
  });

  it('parses --manual flag', () => {
    const result = parseCliArgs(['--manual']);
    expect(result.manual).toBe(true);
  });

  it('parses -m short flag', () => {
    const result = parseCliArgs(['-m']);
    expect(result.manual).toBe(true);
  });

  it('defaults manual to false', () => {
    const result = parseCliArgs([]);
    expect(result.manual).toBe(false);
  });

  it('parses --init flag', () => {
    const result = parseCliArgs(['--init']);
    expect(result.init).toBe(true);
  });

  it('defaults init to false', () => {
    const result = parseCliArgs([]);
    expect(result.init).toBe(false);
  });

  it('parses --debug flag', () => {
    const result = parseCliArgs(['--debug']);
    expect(result.debug).toBe(true);
  });

  it('defaults debug to false', () => {
    const result = parseCliArgs([]);
    expect(result.debug).toBe(false);
  });

  it('parses --help flag', () => {
    const result = parseCliArgs(['--help']);
    expect(result.help).toBe(true);
  });

  it('parses -h short flag', () => {
    const result = parseCliArgs(['-h']);
    expect(result.help).toBe(true);
  });

  it('parses multiple flags together', () => {
    const result = parseCliArgs([
      '-u', 'http://localhost:5173',
      '-p', '/checkout',
      '-s', 'payment',
      '--debug',
    ]);
    expect(result.url).toBe('http://localhost:5173');
    expect(result.page).toBe('/checkout');
    expect(result.scope).toBe('payment');
    expect(result.debug).toBe(true);
  });

  it('throws on unknown flags in strict mode', () => {
    expect(() => parseCliArgs(['--unknown'])).toThrow();
  });
});
