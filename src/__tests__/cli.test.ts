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

import { AGENTS } from '../agents/catalogue.js';
import { initAgents, scaffold } from '../agents/init.js';
import { runAgent } from '../agents/runner.js';
import { run } from '../cli.js';
import { logger } from '../utils/logger.js';
import { createScopeContext } from '../utils/scope.js';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spectra-cli-'));
}

/** Make a mocked Agent write the files the catalogue says it writes. */
function writeDeclaredOutputs(agentName: string): void {
  const output = path.join(process.cwd(), '.spectra', 'output');
  const agent = AGENTS.find((a) => a.name === agentName);
  if (!agent) return;
  for (const file of agent.outputs) {
    const full = path.join(output, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, 'x', 'utf-8');
  }
}

describe('run', () => {
  let originalCwd: string;
  let tmpDir: string;
  const tmpDirs: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    // By default every Agent writes what the catalogue says it writes.
    vi.mocked(runAgent).mockImplementation(async (agent) => {
      writeDeclaredOutputs(agent.name);
    });
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

    it('fails when the scaffold throws', async () => {
      vi.mocked(scaffold).mockImplementationOnce(() => {
        throw new Error('Template directory not found: /templates/agents');
      });

      const ok = await run({ init: true });

      expect(ok).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Template directory not found'),
      );
    });
  });

  describe('URL validation', () => {
    it('fails when no URL is provided', async () => {
      const ok = await run({});

      expect(ok).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('never exits the host process', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('the library tried to exit the host');
      }) as never);

      await run({});

      expect(exitSpy).not.toHaveBeenCalled();

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
      vi.mocked(runAgent).mockImplementation(async (agent) => {
        order.push(`start:${agent.name}`);
        await new Promise((resolve) => setTimeout(resolve, 5));
        order.push(`end:${agent.name}`);
        writeDeclaredOutputs(agent.name);
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

    it('stops the pipeline when an agent writes no output', async () => {
      vi.mocked(runAgent).mockImplementation(async () => {});

      const ok = await run({ url: 'http://localhost:5173' });

      expect(ok).toBe(false);
      expect(runAgent).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('test-plan.md'));
    });

    it('stops the pipeline when a later agent writes no output', async () => {
      vi.mocked(runAgent).mockImplementation(async (agent) => {
        if (agent.name === 'planner') {
          const output = path.join(process.cwd(), '.spectra', 'output');
          fs.mkdirSync(path.join(output, 'plans'), { recursive: true });
          fs.writeFileSync(path.join(output, 'plans', 'test-plan.md'), 'plan', 'utf-8');
        }
      });

      const ok = await run({ url: 'http://localhost:5173' });

      expect(ok).toBe(false);
      // The Healer runs before the CLI can see that it wrote nothing; it is the last Agent.
      expect(runAgent).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('healing-report.md'));
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
    it('fails when the batch file does not exist', async () => {
      const ok = await run({ batch: 'nonexistent.json' });

      expect(ok).toBe(false);
      expect(logger.error).toHaveBeenCalled();
      expect(runAgent).not.toHaveBeenCalled();
    });

    it('fails when the batch file has invalid JSON', async () => {
      const batchPath = path.join(tmpDir, 'bad.json');
      fs.writeFileSync(batchPath, 'not json', 'utf-8');

      const ok = await run({ batch: 'bad.json' });

      expect(ok).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('fails when the batch has no URL and none provided', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(batchPath, JSON.stringify({ scopes: [{ file: 'SCOPE.md' }] }), 'utf-8');

      const ok = await run({ batch: 'batch.json' });

      expect(ok).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('fails when the batch has an empty scopes array', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({ url: 'http://localhost:5173', scopes: [] }),
        'utf-8',
      );

      const ok = await run({ batch: 'batch.json' });

      expect(ok).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('fails when a scope has a misspelled key', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({
          url: 'http://localhost:5173',
          scopes: [{ name: 'A', scop: 'payment form' }],
        }),
        'utf-8',
      );

      const ok = await run({ batch: 'batch.json' });

      expect(ok).toBe(false);
      expect(logger.error).toHaveBeenCalled();
      expect(runAgent).not.toHaveBeenCalled();
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

    it('applies the CLI flags to every scope of the batch', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({
          url: 'http://localhost:5173',
          scopes: [{ name: 'A' }, { name: 'B' }],
        }),
        'utf-8',
      );

      await run({ batch: 'batch.json', page: '/checkout', scope: 'payment form' });

      const scopeCalls = vi.mocked(createScopeContext).mock.calls;
      expect(scopeCalls[0][1]).toMatchObject({ page: '/checkout', scope: 'payment form' });
      expect(scopeCalls[1][1]).toMatchObject({ page: '/checkout', scope: 'payment form' });
    });

    it('lets the CLI flag win over the batch file', async () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({
          url: 'http://localhost:5173',
          scopes: [{ name: 'A', page: '/login' }],
        }),
        'utf-8',
      );

      await run({ batch: 'batch.json', page: '/checkout' });

      const scopeCalls = vi.mocked(createScopeContext).mock.calls;
      expect(scopeCalls[0][1].page).toBe('/checkout');
    });

    it('removes the scope folders of an earlier batch', async () => {
      const stale = path.join(tmpDir, '.spectra', 'output', 'scopes', '9-old');
      fs.mkdirSync(stale, { recursive: true });
      fs.writeFileSync(path.join(stale, 'test-plan.md'), 'old plan', 'utf-8');

      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({
          url: 'http://localhost:5173',
          scopes: [{ name: 'A' }],
        }),
        'utf-8',
      );

      await run({ batch: 'batch.json' });

      expect(fs.existsSync(stale)).toBe(false);
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
      vi.mocked(runAgent).mockImplementation(async (agent) => {
        const output = path.join(process.cwd(), '.spectra', 'output');
        if (agent.name === 'planner') {
          scope += 1;
          writeDeclaredOutputs(agent.name);
          fs.writeFileSync(path.join(output, 'plans', 'test-plan.md'), `plan ${scope}`, 'utf-8');
        }
        if (agent.name === 'healer') {
          writeDeclaredOutputs(agent.name);
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

    it('removes the status file of a previous run when no agent writes one', async () => {
      const statusPath = path.join(tmpDir, '.spectra', 'output', 'reports', 'status.json');
      fs.mkdirSync(path.dirname(statusPath), { recursive: true });
      fs.writeFileSync(statusPath, '{}', 'utf-8');

      // No agent writes anything, so the stale file cannot be rewritten.
      vi.mocked(runAgent).mockImplementation(async () => {});

      await run({ url: 'http://localhost:5173' });

      expect(fs.existsSync(statusPath)).toBe(false);
    });

    it('counts only the files created by this run', async () => {
      fs.mkdirSync(path.join(tmpDir, 'pages'), { recursive: true });
      fs.mkdirSync(path.join(tmpDir, 'tests'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'pages', 'OldPage.ts'), 'old');
      fs.writeFileSync(path.join(tmpDir, 'tests', 'old.spec.ts'), 'old');

      vi.mocked(runAgent).mockImplementation(async (agent) => {
        writeDeclaredOutputs(agent.name);
        if (agent.name === 'generator') {
          fs.writeFileSync(path.join(tmpDir, 'pages', 'NewPage.ts'), 'new');
          fs.writeFileSync(path.join(tmpDir, 'tests', 'new.spec.ts'), 'new');
        }
      });

      await run({ url: 'http://localhost:5173' });

      expect(logger.plain).toHaveBeenCalledWith('  Page Objects: 1');
      expect(logger.plain).toHaveBeenCalledWith('  Test files: 1');
    });

    it('prints commands the consumer project actually has', async () => {
      await run({ url: 'http://localhost:5173' });

      const printed = vi
        .mocked(logger.plain)
        .mock.calls.map((call) => call[0])
        .join('\n');
      expect(printed).toContain('npx playwright test');
      expect(printed).not.toContain('pnpm test');
    });
  });

  describe('auto-init agents', () => {
    it('always refreshes the agent templates', async () => {
      await run({ url: 'http://localhost:5173' });

      expect(initAgents).toHaveBeenCalledWith(tmpDir);
    });
  });
});
