import { describe, expect, it } from 'vitest';

import * as api from '../index.js';

describe('public API', () => {
  it('exports the library surface without running the CLI', () => {
    expect(Object.keys(api).sort()).toEqual([
      'DEFAULT_OUTPUT_DIR',
      'TEMPLATE_DIR',
      'createScopeContext',
      'detectMode',
      'run',
    ]);
  });
});
