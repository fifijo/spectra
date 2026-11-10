import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies before importing cli
vi.mock('../agents/runner.js', () => ({
  buildPrompt: vi.fn(() => 'mocked prompt'),
  runAgent: vi.fn(async () => {}),
}));

vi.mock('../agents/init.js', () => ({
  initAgents: vi.fn(),
  scaffold: vi.fn(),
}));

vi.mock('../utils/scope.js', () => ({
  createScopeContext: vi.fn(),
}));

vi.mock('../utils/detect-mode.js', () => ({
  detectMode: vi.fn(() => 'manual' as const),
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    plain: vi.fn(),
    cyan: vi.fn(),
    banner: vi.fn(),
    separator: vi.fn(),
    debug: vi.fn(),
    prompt: vi.fn(),
  },
}));

import { initAgents, scaffold } from '../agents/init.js';
import { runAgent } from '../agents/runner.js';
import { run } from '../cli.js';
import { logger } from '../utils/logger.js';
import { createScopeContext } from '../utils/scope.js';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spectra-cli-'));
}

describe('run', () => {
  let originalCwd: string;
  let tmpDir: string;
  const tmpDirs: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    originalCwd = process.cwd();
    tmpDir = makeTmpDir();
    tmpDirs.push(tmpDir);
    process.chdir(tmpDir);

    // Create .spectra/agents so initAgents is not called
    fs.mkdirSync(path.join(tmpDir, '.spectra', 'agents'), { recursive: true });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    for (const d of tmpDirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
    delete process.env.SPECTRA_URL;
  });

  describe('--init mode', () => {
    it('calls scaffold and returns without running agents', async () => {
      await run({ init: true });

      expect(scaffold).toHaveBeenCalledWith(tmpDir);
      expect(runAgent).not.toHaveBeenCalled();
      expect(logger.banner).toHaveBeenCalled();
      expect(logger.success).toHaveBeenCalled();
    });
  });

  describe('URL validation', () => {
    it('exits when no URL is provided', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit');
      }) as never);

      await expect(run({})).rejects.toThrow('process.exit');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(logger.error).toHaveBeenCalled();

      exitSpy.mockRestore();
    });

    it('uses SPECTRA_URL env var when --url is not provided', async () => {
      process.env.SPECTRA_URL = 'http://env-url:3000';

      await run({ url: undefined });

      expect(createScopeContext).toHaveBeenCalled();
      expect(runAgent).toHaveBeenCalledTimes(3);
    });

    it('prefers --url over SPECTRA_URL env var', async () => {
      process.env.SPECTRA_URL = 'http://env-url:3000';

      await run({ url: 'http://cli-url:4000' });

      const scopeCall = vi.mocked(createScopeContext).mock.calls[0];
      expect(scopeCall[1].url).toBe('http://cli-url:4000');
    });
  });

  describe('agent pipeline', () => {
    it('runs all three agents in order', async () => {
      await run({ url: 'http://localhost:5173' });

      expect(runAgent).toHaveBeenCalledTimes(3);
      const calls = vi.mocked(runAgent).mock.calls;
      expect(calls[0][0].name).toBe('planner');
      expect(calls[1][0].name).toBe('generator');
      expect(calls[2][0].name).toBe('healer');
    });

    it('waits for each agent before starting the next one', async () => {
      const order: string[] = [];
      vi.mocked(runAgent).mockImplementation(async (options) => {
        order.push(`start:${options.name}`);
        await new Promise((resolve) => setTimeout(resolve, 5));
        order.push(`end:${options.name}`);
      });

      await run({ url: 'http://localhost:5173' });

      expect(order).toEqual([
        'start:planner',
        'end:planner',
        'start:generator',
        'end:generator',
        'start:healer',
        'end:healer',
      ]);
    });

    it('stops the pipeline when an agent fails', async () => {
      vi.mocked(runAgent).mockRejectedValueOnce(new Error('boom'));

      const ok = await run({ url: 'http://localhost:5173' });

      expect(ok).toBe(false);
      expect(runAgent).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalled();
    });

    it('passes correct colors and emojis to agents', async () => {
      await run({ url: 'http://localhost:5173' });

      const calls = vi.mocked(runAgent).mock.calls;
      expect(calls[0][0]).toMatchObject({ color: 'blue', emoji: '🔵' });
      expect(calls[1][0]).toMatchObject({ color: 'green', emoji: '🟢' });
      expect(calls[2][0]).toMatchObject({ color: 'magenta', emoji: '🟣' });
    });

    it('passes the completion signal of every agent', async () => {
      await run({ url: 'http://localhost:5173' });

      const calls = vi.mocked(runAgent).mock.calls;
      expect(calls[0][0].completionSignal).toBe('plans/.complete');
      expect(calls[1][0].completionSignal).toBe('tests/.complete');
      expect(calls[2][0].completionSignal).toBe('reports/.complete');
    });

    it('creates scope context before running agents', async () => {
      await run({ url: 'http://localhost:5173', page: '/login', scope: 'auth form' });

      expect(createScopeContext).toHaveBeenCalledBefore(vi.mocked(runAgent));
    });
  });

  describe('output directories', () => {
    it('creates output directories', async () => {
      await run({ url: 'http://localhost:5173' });

      for (const dir of ['plans', 'tests', 'reports', 'test-results']) {
        expect(fs.existsSync(path.join(tmpDir, '.spectra', 'output', dir))).toBe(true);
      }
    });
  });

  describe('--batch mode', () => {
    it('exits when batch file does not exist', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit');
      }) as never);

      await expect(run({ batch: 'nonexistent.json' })).rejects.toThrow('process.exit');
      expect(logger.error).toHaveBeenCalled();

      exitSpy.mockRestore();
    });

    it('exits when batch file has invalid JSON', async () => {
      const batchPath = path.join(tmpDir, 'bad.json');
      fs.writeFileSync(batchPath, 'not json', 'utf-8');

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit');
      }) as never);

      await expect(run({ batch: 'bad.json' })).rejects.toThrow('process.exit');

      exitSpy.mockRestore();
    });

    it('exits when batch has no URL and none provided', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(batchPath, JSON.stringify({ scopes: [{ file: 'SCOPE.md' }] }), 'utf-8');

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit');
      }) as never);

      await expect(run({ batch: 'batch.json' })).rejects.toThrow('process.exit');

      exitSpy.mockRestore();
    });

    it('exits when batch has empty scopes array', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({ url: 'http://localhost:5173', scopes: [] }),
        'utf-8',
      );

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit');
      }) as never);

      await expect(run({ batch: 'batch.json' })).rejects.toThrow('process.exit');

      exitSpy.mockRestore();
    });

    it('exits when a scope has a misspelled key', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({
          url: 'http://localhost:5173',
          scopes: [{ name: 'A', scop: 'payment form' }],
        }),
        'utf-8',
      );

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit');
      }) as never);

      await expect(run({ batch: 'batch.json' })).rejects.toThrow('process.exit');
      expect(runAgent).not.toHaveBeenCalled();

      exitSpy.mockRestore();
    });

    it('passes page and scope of every batch scope to the run', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({
          url: 'http://localhost:5173',
          scopes: [
            { name: 'Dashboard', page: '/', scope: 'stats grid' },
            { name: 'Tasks', page: '/tasks', scope: 'task management' },
          ],
        }),
        'utf-8',
      );

      await run({ batch: 'batch.json' });

      const scopeCalls = vi.mocked(createScopeContext).mock.calls;
      expect(scopeCalls[0][1]).toMatchObject({ page: '/', scope: 'stats grid' });
      expect(scopeCalls[1][1]).toMatchObject({ page: '/tasks', scope: 'task management' });
    });

    it('reports how many scopes failed', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({
          url: 'http://localhost:5173',
          scopes: [{ name: 'A' }, { name: 'B' }],
        }),
        'utf-8',
      );
      vi.mocked(runAgent).mockRejectedValueOnce(new Error('boom'));

      const ok = await run({ batch: 'batch.json' });

      expect(ok).toBe(false);
      expect(logger.plain).toHaveBeenCalledWith(expect.stringContaining('1 failed'));
    });

    it('keeps the plan and healing report of every scope', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({
          url: 'http://localhost:5173',
          scopes: [{ name: 'A' }, { name: 'B' }],
        }),
        'utf-8',
      );

      // The agents write to the same file for every scope, like the real ones do.
      let scope = 0;
      vi.mocked(runAgent).mockImplementation(async (options) => {
        const output = path.join(process.cwd(), '.spectra', 'output');
        if (options.name === 'planner') {
          scope += 1;
          fs.writeFileSync(path.join(output, 'plans', 'test-plan.md'), `plan ${scope}`, 'utf-8');
        }
        if (options.name === 'healer') {
          fs.writeFileSync(
            path.join(output, 'reports', 'healing-report.md'),
            `report ${scope}`,
            'utf-8',
          );
        }
      });

      await run({ batch: 'batch.json' });

      const output = path.join(tmpDir, '.spectra', 'output');
      expect(
        fs.readFileSync(path.join(output, 'scopes', '1-a', 'plans', 'test-plan.md'), 'utf-8'),
      ).toBe('plan 1');
      expect(
        fs.readFileSync(path.join(output, 'scopes', '2-b', 'plans', 'test-plan.md'), 'utf-8'),
      ).toBe('plan 2');
      expect(
        fs.readFileSync(
          path.join(output, 'scopes', '1-a', 'reports', 'healing-report.md'),
          'utf-8',
        ),
      ).toBe('report 1');
      expect(
        fs.readFileSync(
          path.join(output, 'scopes', '2-b', 'reports', 'healing-report.md'),
          'utf-8',
        ),
      ).toBe('report 2');
    });

    it('lists where the results of every scope are kept', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({
          url: 'http://localhost:5173',
          scopes: [{ name: 'Login Form' }],
        }),
        'utf-8',
      );

      await run({ batch: 'batch.json' });

      expect(logger.plain).toHaveBeenCalledWith(
        expect.stringContaining(`.spectra/output${path.sep}scopes${path.sep}1-login-form`),
      );
    });
  });

  describe('summary', () => {
    it('prints summary after running agents', async () => {
      await run({ url: 'http://localhost:5173' });

      expect(logger.separator).toHaveBeenCalledWith(
        'blue',
        expect.stringContaining('SPECTRUM COMPLETE'),
      );
      expect(logger.plain).toHaveBeenCalledWith(expect.stringContaining('Page Objects'));
      expect(logger.plain).toHaveBeenCalledWith(expect.stringContaining('Test files'));
    });

    it('reports a failure instead of a completed run', async () => {
      vi.mocked(runAgent).mockRejectedValueOnce(new Error('boom'));

      await run({ url: 'http://localhost:5173' });

      expect(logger.separator).toHaveBeenCalledWith('blue', '❌ SPECTRUM FAILED');
    });

    it('removes the status file of a previous run', async () => {
      const statusPath = path.join(tmpDir, '.spectra', 'output', 'reports', 'status.json');
      fs.mkdirSync(path.dirname(statusPath), { recursive: true });
      fs.writeFileSync(statusPath, '{}', 'utf-8');

      await run({ url: 'http://localhost:5173' });

      expect(fs.existsSync(statusPath)).toBe(false);
    });

    it('counts only the files created by this run', async () => {
      fs.mkdirSync(path.join(tmpDir, 'pages'), { recursive: true });
      fs.mkdirSync(path.join(tmpDir, 'tests'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'pages', 'OldPage.ts'), 'old');
      fs.writeFileSync(path.join(tmpDir, 'tests', 'old.spec.ts'), 'old');

      vi.mocked(runAgent).mockImplementation(async (options) => {
        if (options.name === 'generator') {
          fs.writeFileSync(path.join(tmpDir, 'pages', 'NewPage.ts'), 'new');
          fs.writeFileSync(path.join(tmpDir, 'tests', 'new.spec.ts'), 'new');
        }
      });

      await run({ url: 'http://localhost:5173' });

      expect(logger.plain).toHaveBeenCalledWith('  Page Objects: 1');
      expect(logger.plain).toHaveBeenCalledWith('  Test files: 1');
    });
  });

  describe('auto-init agents', () => {
    it('always refreshes the agent templates', async () => {
      await run({ url: 'http://localhost:5173' });

      expect(initAgents).toHaveBeenCalledWith(tmpDir);
    });
  });
});
