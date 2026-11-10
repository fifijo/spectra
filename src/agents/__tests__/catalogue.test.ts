import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { DEFAULT_OUTPUT_DIR, TEMPLATE_DIR } from '../../utils/constants.js';
import { AGENTS, COMPLETION_SIGNALS } from '../catalogue.js';

/** The path a template must state for a file inside the run's output dir. */
function inOutputDir(file: string): string {
  return path.posix.join(DEFAULT_OUTPUT_DIR, file);
}

function template(...parts: string[]): string {
  return fs.readFileSync(path.join(TEMPLATE_DIR, ...parts), 'utf-8');
}

describe('agent catalogue', () => {
  it('gives every agent its own name and completion signal', () => {
    expect(new Set(AGENTS.map((agent) => agent.name)).size).toBe(AGENTS.length);
    expect(new Set(COMPLETION_SIGNALS).size).toBe(COMPLETION_SIGNALS.length);
  });

  it('is stated in the template of every agent', () => {
    for (const agent of AGENTS) {
      const definition = template('agents', agent.name, 'AGENT.md');
      expect(definition).toContain(inOutputDir(agent.completionSignal));
      for (const output of agent.outputs) {
        expect(definition).toContain(inOutputDir(output));
      }
    }
  });

  it('is stated in the shared context', () => {
    const context = template('agents', 'shared', 'context.md');
    for (const signal of COMPLETION_SIGNALS) {
      expect(context).toContain(inOutputDir(signal));
    }
  });
});
