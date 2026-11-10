import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseCliArgs } from '../args.js';

const originalArgv = process.argv;

function withArgs(args: string[]): void {
  process.argv = ['node', 'spectra', ...args];
}

describe('parseCliArgs', () => {
  afterEach(() => {
    process.argv = originalArgv;
    delete process.env.DEBUG;
    vi.restoreAllMocks();
  });

  it('parses --url flag', () => {
    withArgs(['--url', 'http://localhost:3000']);
    expect(parseCliArgs().url).toBe('http://localhost:3000');
  });

  it('parses -u short flag', () => {
    withArgs(['-u', 'http://localhost:3000']);
    expect(parseCliArgs().url).toBe('http://localhost:3000');
  });

  it('parses --page flag', () => {
    withArgs(['--page', '/checkout']);
    expect(parseCliArgs().page).toBe('/checkout');
  });

  it('parses -p short flag', () => {
    withArgs(['-p', '/checkout']);
    expect(parseCliArgs().page).toBe('/checkout');
  });

  it('parses --scope flag', () => {
    withArgs(['--scope', 'payment form']);
    expect(parseCliArgs().scope).toBe('payment form');
  });

  it('parses -s short flag', () => {
    withArgs(['-s', 'payment form']);
    expect(parseCliArgs().scope).toBe('payment form');
  });

  it('parses --file flag', () => {
    withArgs(['--file', 'SCOPE.md']);
    expect(parseCliArgs().file).toBe('SCOPE.md');
  });

  it('parses -f short flag', () => {
    withArgs(['-f', 'SCOPE.md']);
    expect(parseCliArgs().file).toBe('SCOPE.md');
  });

  it('parses --batch flag', () => {
    withArgs(['--batch', 'scopes.json']);
    expect(parseCliArgs().batch).toBe('scopes.json');
  });

  it('parses -b short flag', () => {
    withArgs(['-b', 'scopes.json']);
    expect(parseCliArgs().batch).toBe('scopes.json');
  });

  it('parses --manual flag', () => {
    withArgs(['--manual']);
    expect(parseCliArgs().manual).toBe(true);
  });

  it('parses -m short flag', () => {
    withArgs(['-m']);
    expect(parseCliArgs().manual).toBe(true);
  });

  it('defaults manual to false', () => {
    withArgs([]);
    expect(parseCliArgs().manual).toBe(false);
  });

  it('parses --init flag', () => {
    withArgs(['--init']);
    expect(parseCliArgs().init).toBe(true);
  });

  it('defaults init to false', () => {
    withArgs([]);
    expect(parseCliArgs().init).toBe(false);
  });

  it('parses --debug flag and turns on debug output', () => {
    withArgs(['--debug']);
    expect(parseCliArgs().debug).toBe(true);
    expect(process.env.DEBUG).toBe('1');
  });

  it('defaults debug to false', () => {
    withArgs([]);
    expect(parseCliArgs().debug).toBe(false);
  });

  it('parses --help flag and exits', () => {
    withArgs(['--help']);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as never);

    expect(() => parseCliArgs()).toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('parses -h short flag', () => {
    withArgs(['-h']);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as never);

    expect(() => parseCliArgs()).toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('parses multiple flags together', () => {
    withArgs(['-u', 'http://localhost:5173', '-p', '/checkout', '-s', 'payment', '--debug']);
    const result = parseCliArgs();
    expect(result.url).toBe('http://localhost:5173');
    expect(result.page).toBe('/checkout');
    expect(result.scope).toBe('payment');
    expect(result.debug).toBe(true);
  });

  it('throws on unknown flags in strict mode', () => {
    withArgs(['--unknown']);
    expect(() => parseCliArgs()).toThrow();
  });
});
