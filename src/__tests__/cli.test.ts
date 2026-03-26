import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Mock dependencies before importing cli
vi.mock('../agents/runner.js', () => ({
  buildPrompt: vi.fn(() => 'mocked prompt'),
  runAgent: vi.fn(),
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
    magenta: vi.fn(),
    banner: vi.fn(),
    separator: vi.fn(),
  },
}));

import { run } from '../cli.js';
import { runAgent, buildPrompt } from '../agents/runner.js';
import { scaffold, initAgents } from '../agents/init.js';
import { createScopeContext } from '../utils/scope.js';
import { logger } from '../utils/logger.js';

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
    delete process.env['SPECTRA_URL'];
  });

  describe('--init mode', () => {
    it('calls scaffold and returns without running agents', () => {
      run({ init: true });

      expect(scaffold).toHaveBeenCalledWith(tmpDir);
      expect(runAgent).not.toHaveBeenCalled();
      expect(logger.banner).toHaveBeenCalled();
      expect(logger.success).toHaveBeenCalled();
    });
  });

  describe('URL validation', () => {
    it('exits when no URL is provided', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit');
      }) as never);

      expect(() => run({})).toThrow('process.exit');
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(logger.error).toHaveBeenCalled();

      exitSpy.mockRestore();
    });

    it('uses SPECTRA_URL env var when --url is not provided', () => {
      process.env['SPECTRA_URL'] = 'http://env-url:3000';

      run({ url: undefined });

      expect(createScopeContext).toHaveBeenCalled();
      expect(runAgent).toHaveBeenCalledTimes(3);
    });

    it('prefers --url over SPECTRA_URL env var', () => {
      process.env['SPECTRA_URL'] = 'http://env-url:3000';

      run({ url: 'http://cli-url:4000' });

      const scopeCall = vi.mocked(createScopeContext).mock.calls[0];
      expect(scopeCall[1].url).toBe('http://cli-url:4000');
    });
  });

  describe('agent pipeline', () => {
    it('runs all three agents in order', () => {
      run({ url: 'http://localhost:5173' });

      expect(runAgent).toHaveBeenCalledTimes(3);
      const calls = vi.mocked(runAgent).mock.calls;
      expect(calls[0][0].name).toBe('planner');
      expect(calls[1][0].name).toBe('generator');
      expect(calls[2][0].name).toBe('healer');
    });

    it('passes correct colors and emojis to agents', () => {
      run({ url: 'http://localhost:5173' });

      const calls = vi.mocked(runAgent).mock.calls;
      expect(calls[0][0]).toMatchObject({ color: 'blue', emoji: '🔵' });
      expect(calls[1][0]).toMatchObject({ color: 'green', emoji: '🟢' });
      expect(calls[2][0]).toMatchObject({ color: 'magenta', emoji: '🟣' });
    });

    it('creates scope context before running agents', () => {
      run({ url: 'http://localhost:5173', page: '/login', scope: 'auth form' });

      expect(createScopeContext).toHaveBeenCalledBefore(vi.mocked(runAgent));
    });
  });

  describe('output directories', () => {
    it('creates output directories', () => {
      run({ url: 'http://localhost:5173' });

      expect(fs.existsSync(path.join(tmpDir, '.spectra', 'output', 'plans'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, '.spectra', 'output', 'reports'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, '.spectra', 'output', 'test-results'))).toBe(true);
    });
  });

  describe('--batch mode', () => {
    it('exits when batch file does not exist', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit');
      }) as never);

      expect(() => run({ batch: 'nonexistent.json' })).toThrow('process.exit');
      expect(logger.error).toHaveBeenCalled();

      exitSpy.mockRestore();
    });

    it('exits when batch file has invalid JSON', () => {
      const batchPath = path.join(tmpDir, 'bad.json');
      fs.writeFileSync(batchPath, 'not json', 'utf-8');

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit');
      }) as never);

      expect(() => run({ batch: 'bad.json' })).toThrow('process.exit');

      exitSpy.mockRestore();
    });

    it('exits when batch has no URL and none provided', () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(batchPath, JSON.stringify({ scopes: [{ file: 'SCOPE.md' }] }), 'utf-8');

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit');
      }) as never);

      expect(() => run({ batch: 'batch.json' })).toThrow('process.exit');

      exitSpy.mockRestore();
    });

    it('exits when batch has empty scopes array', () => {
      const batchPath = path.join(tmpDir, 'batch.json');
      fs.writeFileSync(
        batchPath,
        JSON.stringify({ url: 'http://localhost:5173', scopes: [] }),
        'utf-8',
      );

      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
        throw new Error('process.exit');
      }) as never);

      expect(() => run({ batch: 'batch.json' })).toThrow('process.exit');

      exitSpy.mockRestore();
    });
  });

  describe('summary', () => {
    it('prints summary after running agents', () => {
      run({ url: 'http://localhost:5173' });

      expect(logger.separator).toHaveBeenCalledWith('blue', expect.stringContaining('SPECTRUM COMPLETE'));
      expect(logger.plain).toHaveBeenCalledWith(expect.stringContaining('Page Objects'));
      expect(logger.plain).toHaveBeenCalledWith(expect.stringContaining('Test files'));
    });
  });

  describe('auto-init agents', () => {
    it('calls initAgents when .spectra/agents does not exist', () => {
      // Remove the agents dir we created in beforeEach
      fs.rmSync(path.join(tmpDir, '.spectra', 'agents'), { recursive: true });

      run({ url: 'http://localhost:5173' });

      expect(initAgents).toHaveBeenCalledWith(tmpDir);
    });
  });
});
