import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { buildPrompt, runAgent } from '../runner.js';

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
  execSync: vi.fn(),
}));

vi.mock('../runner.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../runner.js')>();
  return {
    ...mod,
  };
});

describe('buildPrompt', () => {
  it('includes scope check instruction', () => {
    const result = buildPrompt('planner', 'Do something', '.complete', '/agents');
    expect(result).toContain('/agents/shared/current-scope.md');
  });

  it('includes agent-specific AGENT.md path', () => {
    const result = buildPrompt('planner', 'Do something', '.complete', '/agents');
    expect(result).toContain('/agents/planner/AGENT.md');
  });

  it('includes the instruction text', () => {
    const result = buildPrompt('generator', 'Generate tests', '.complete', '/agents');
    expect(result).toContain('Generate tests');
  });

  it('includes completion path', () => {
    const result = buildPrompt('healer', 'Fix tests', '.spectra/output/.complete', '/agents');
    expect(result).toContain('.spectra/output/.complete');
  });

  it('works with different agent names', () => {
    for (const agent of ['planner', 'generator', 'healer']) {
      const result = buildPrompt(agent, 'task', '.done', '/a');
      expect(result).toContain(`/a/${agent}/AGENT.md`);
    }
  });
});

describe('runAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('calls logger.separator with agent name and emoji', async () => {
    const { logger } = await import('../../utils/logger.js');
    const separatorSpy = vi.spyOn(logger, 'separator').mockImplementation(() => {});
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'plain').mockImplementation(() => {});
    vi.spyOn(logger, 'cyan').mockImplementation(() => {});

    runAgent(
      {
        name: 'planner',
        color: 'blue',
        emoji: '🔵',
        prompt: 'test prompt',
        mode: 'manual',
        outputDir: '/tmp/test-output',
      },
      '/tmp/agents',
    );

    expect(separatorSpy).toHaveBeenCalledWith('blue', '🔵 PLANNER');
  });

  it('writes prompt file in manual mode', async () => {
    const { logger } = await import('../../utils/logger.js');
    vi.spyOn(logger, 'separator').mockImplementation(() => {});
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'plain').mockImplementation(() => {});
    vi.spyOn(logger, 'cyan').mockImplementation(() => {});

    const mkdirSpy = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);
    const writeSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

    runAgent(
      {
        name: 'generator',
        color: 'green',
        emoji: '🟢',
        prompt: 'generate tests',
        mode: 'manual',
        outputDir: '/tmp/output',
      },
      '/tmp/agents',
    );

    expect(mkdirSpy).toHaveBeenCalled();
    expect(writeSpy).toHaveBeenCalledWith(
      path.join('/tmp/agents', 'generator', 'current-prompt.md'),
      'generate tests',
      'utf-8',
    );
  });
});
