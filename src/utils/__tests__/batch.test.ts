import { describe, expect, it } from 'vitest';

import { parseBatchConfig } from '../batch.js';

function parse(text: string) {
  return parseBatchConfig(text);
}

describe('parseBatchConfig', () => {
  it('reads the url and the scopes of a valid config', () => {
    const result = parse(
      JSON.stringify({
        url: 'http://localhost:5173',
        scopes: [{ name: 'Login Form', page: '/login', scope: 'validation' }],
      }),
    );

    expect(result).toEqual({
      ok: true,
      batch: {
        url: 'http://localhost:5173',
        scopes: [
          {
            name: 'Login Form',
            file: undefined,
            page: '/login',
            scope: 'validation',
            description: undefined,
          },
        ],
      },
    });
  });

  it('accepts a config without a url', () => {
    const result = parse(JSON.stringify({ scopes: [{ file: 'SCOPE.md' }] }));

    expect(result.ok).toBe(true);
  });

  it('rejects a file that is not valid JSON', () => {
    const result = parse('not json');

    expect(result).toEqual({ ok: false, error: 'not valid JSON' });
  });

  it('rejects a config that is not an object', () => {
    expect(parse('[]')).toEqual({ ok: false, error: 'must be a JSON object' });
    expect(parse('"hello"')).toEqual({ ok: false, error: 'must be a JSON object' });
  });

  it('rejects a config without scopes', () => {
    const result = parse(JSON.stringify({ url: 'http://localhost:5173' }));

    expect(result).toEqual({ ok: false, error: 'must have a "scopes" array' });
  });

  it('rejects a config with an empty scopes array', () => {
    const result = parse(JSON.stringify({ url: 'http://localhost:5173', scopes: [] }));

    expect(result).toEqual({ ok: false, error: 'must have a non-empty "scopes" array' });
  });

  it('rejects a url that is not a string', () => {
    const result = parse(JSON.stringify({ url: 42, scopes: [{}] }));

    expect(result).toEqual({ ok: false, error: '"url" must be a string' });
  });

  it('rejects an unknown key in the config', () => {
    const result = parse(JSON.stringify({ url: 'http://localhost:5173', scopes: [{}], pages: [] }));

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toContain('pages');
  });

  it('rejects a scope that is not an object', () => {
    const result = parse(JSON.stringify({ scopes: ['login'] }));

    expect(result).toEqual({ ok: false, error: 'scope 1 must be an object' });
  });

  it('rejects a scope field that is not a string', () => {
    const result = parse(JSON.stringify({ scopes: [{ page: 42 }] }));

    expect(result).toEqual({ ok: false, error: 'scope 1 "page" must be a string' });
  });

  it('rejects a misspelled scope key instead of dropping it', () => {
    const result = parse(JSON.stringify({ scopes: [{ scop: 'payment form' }] }));

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toContain('scop');
    expect(result.ok === false && result.error).toContain('scope 1');
  });

  it('names the known keys when it rejects one', () => {
    const result = parse(JSON.stringify({ scopes: [{ page: '/login', targe: 'x' }] }));

    expect(result.ok === false && result.error).toContain('name, file, page, scope, description');
  });
});
