import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AGENTS, type Agent } from '../catalogue.js';
import { buildPrompt, type RunContext, runAgent } from '../runner.js';

function agentNamed(name: string): Agent {
  const agent = AGENTS.find((a) => a.name === name);
  if (!agent) throw new Error(`no agent named ${name}`);
  return agent;
}

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spectra-runner-'));
}

describe('buildPrompt', () => {
  const tmpDirs: string[] = [];
  let originalCwd: string;

  beforeEach(() => {
    vi.clearAllMocks();
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    for (const d of tmpDirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  function context(workDir: string): RunContext {
    return {
      mode: 'manual',
      outputDir: path.join(workDir, 'output'),
      agentsDir: path.join(workDir, 'agents'),
      debug: false,
    };
  }

  it('points at the scope context of the run', () => {
    const workDir = makeTmpDir();
    tmpDirs.push(workDir);
    process.chdir(workDir);

    const prompt = buildPrompt(agentNamed('planner'), context(workDir));

    expect(prompt).toContain('agents/shared/current-scope.md');
  });

  it('points at the definition of the agent', () => {
    const workDir = makeTmpDir();
    tmpDirs.push(workDir);
    process.chdir(workDir);

    const prompt = buildPrompt(agentNamed('planner'), context(workDir));

    expect(prompt).toContain('agents/planner/AGENT.md');
  });

  it('names the files the agent reads and writes', () => {
    const workDir = makeTmpDir();
    tmpDirs.push(workDir);
    process.chdir(workDir);

    const prompt = buildPrompt(agentNamed('generator'), context(workDir));

    expect(prompt).toContain('output/plans/test-plan.md');
    expect(prompt).toContain('pages/');
    expect(prompt).toContain('tests/');
  });

  it('names the completion signal of the agent', () => {
    const workDir = makeTmpDir();
    tmpDirs.push(workDir);
    process.chdir(workDir);

    const prompt = buildPrompt(agentNamed('healer'), context(workDir));

    expect(prompt).toContain('output/reports/.complete');
  });
});

describe('runAgent', () => {
  const tmpDirs: string[] = [];
  let originalCwd: string;

  function makeTmpDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spectra-runner-'));
    tmpDirs.push(dir);
    return dir;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    for (const d of tmpDirs) {
      fs.rmSync(d, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it('calls logger.separator with agent name and emoji', async () => {
    const { logger } = await import('../../utils/logger.js');
    const separatorSpy = vi.spyOn(logger, 'separator').mockImplementation(() => {});

    const workDir = makeTmpDir();
    process.chdir(workDir);
    fs.mkdirSync(path.join(workDir, 'output', 'plans'), { recursive: true });
    fs.writeFileSync(path.join(workDir, 'output', 'plans', '.complete'), '', 'utf-8');

    await runAgent(agentNamed('planner'), {
      mode: 'manual',
      outputDir: path.join(workDir, 'output'),
      agentsDir: path.join(workDir, 'agents'),
      debug: false,
    });

    expect(separatorSpy).toHaveBeenCalledWith('blue', '🔵 PLANNER');
  });

  it('writes prompt file in manual mode and waits for the completion signal', async () => {
    const { logger } = await import('../../utils/logger.js');
    vi.spyOn(logger, 'separator').mockImplementation(() => {});
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'plain').mockImplementation(() => {});
    vi.spyOn(logger, 'cyan').mockImplementation(() => {});

    const workDir = makeTmpDir();
    const agentsDir = path.join(workDir, 'agents');
    process.chdir(workDir);

    const done = runAgent(agentNamed('generator'), {
      mode: 'manual',
      outputDir: path.join(workDir, 'output'),
      agentsDir,
      debug: false,
    });

    // The agent writes its completion signal
    await vi.waitFor(() => {
      expect(fs.existsSync(path.join(agentsDir, 'generator', 'current-prompt.md'))).toBe(true);
    });
    fs.mkdirSync(path.join(workDir, 'output', 'tests'), { recursive: true });
    fs.writeFileSync(path.join(workDir, 'output', 'tests', '.complete'), '', 'utf-8');

    await done;

    const prompt = fs.readFileSync(path.join(agentsDir, 'generator', 'current-prompt.md'), 'utf-8');
    expect(prompt).toContain('output/plans/test-plan.md');
    expect(prompt).toContain('output/tests/.complete');
  });

  it('gives up when the agent never writes the completion signal', async () => {
    vi.useFakeTimers();
    try {
      const workDir = makeTmpDir();
      process.chdir(workDir);

      const done = runAgent(agentNamed('planner'), {
        mode: 'manual',
        outputDir: path.join(workDir, 'output'),
        agentsDir: path.join(workDir, 'agents'),
        debug: false,
      });

      const failed = expect(done).rejects.toThrow(/Timed out/);
      await vi.advanceTimersByTimeAsync(31 * 60 * 1000);
      await failed;
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not hang when the agent writes more than the pipe buffer', async () => {
    const workDir = makeTmpDir();
    const binDir = path.join(workDir, 'bin');
    fs.mkdirSync(binDir, { recursive: true });
    const fakeAgent = path.join(binDir, 'cursor-agent');
    fs.writeFileSync(
      fakeAgent,
      '#!/usr/bin/env node\nprocess.stdout.write("x".repeat(200000));\n',
      'utf-8',
    );
    fs.chmodSync(fakeAgent, 0o755);

    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath}`;

    try {
      await expect(
        runAgent(agentNamed('planner'), {
          mode: 'cursor-agent',
          outputDir: path.join(workDir, 'output'),
          agentsDir: path.join(workDir, 'agents'),
          debug: false,
        }),
      ).resolves.toBeUndefined();
    } finally {
      process.env.PATH = originalPath;
    }

    const log = fs.readFileSync(path.join(workDir, 'output', 'planner.log'), 'utf-8');
    expect(log.length).toBeGreaterThanOrEqual(200000);
  }, 15000);

  it('rejects when the agent CLI is not installed', async () => {
    const workDir = makeTmpDir();
    const binDir = path.join(workDir, 'bin');
    fs.mkdirSync(binDir, { recursive: true });

    const originalPath = process.env.PATH;
    process.env.PATH = binDir;

    try {
      await expect(
        runAgent(agentNamed('planner'), {
          mode: 'cursor-agent',
          outputDir: path.join(workDir, 'output'),
          agentsDir: path.join(workDir, 'agents'),
          debug: false,
        }),
      ).rejects.toThrow(/ENOENT/);
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it('rejects when the agent CLI fails', async () => {
    const workDir = makeTmpDir();
    const binDir = path.join(workDir, 'bin');
    fs.mkdirSync(binDir, { recursive: true });
    const fakeAgent = path.join(binDir, 'cursor-agent');
    fs.writeFileSync(fakeAgent, '#!/usr/bin/env node\nprocess.exit(3);\n', 'utf-8');
    fs.chmodSync(fakeAgent, 0o755);

    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath}`;

    try {
      await expect(
        runAgent(agentNamed('planner'), {
          mode: 'cursor-agent',
          outputDir: path.join(workDir, 'output'),
          agentsDir: path.join(workDir, 'agents'),
          debug: false,
        }),
      ).rejects.toThrow('cursor-agent exited with code 3');
    } finally {
      process.env.PATH = originalPath;
    }
  });

  it.each([
    { mode: 'codex', bin: 'codex', flags: ['exec', '--skip-git-repo-check', '--full-auto'] },
    { mode: 'opencode', bin: 'opencode', flags: ['run', '--auto'] },
    { mode: 'gemini', bin: 'gemini', flags: ['--approval-mode=yolo', '-p'] },
  ])('runs $bin with its headless flags', async ({ mode, bin, flags }) => {
    const workDir = makeTmpDir();
    const binDir = path.join(workDir, 'bin');
    fs.mkdirSync(binDir, { recursive: true });

    const argvFile = path.join(workDir, 'argv.json');
    const fakeAgent = path.join(binDir, bin);
    fs.writeFileSync(
      fakeAgent,
      `#!/usr/bin/env node\nrequire('fs').writeFileSync(${JSON.stringify(argvFile)}, JSON.stringify(process.argv.slice(2)));\n`,
      'utf-8',
    );
    fs.chmodSync(fakeAgent, 0o755);

    const originalPath = process.env.PATH;
    process.env.PATH = `${binDir}:${originalPath}`;

    try {
      await expect(
        runAgent(agentNamed('planner'), {
          mode: mode as RunContext['mode'],
          outputDir: path.join(workDir, 'output'),
          agentsDir: path.join(workDir, 'agents'),
          debug: false,
        }),
      ).resolves.toBeUndefined();
    } finally {
      process.env.PATH = originalPath;
    }

    const argv = JSON.parse(fs.readFileSync(argvFile, 'utf-8')) as string[];
    expect(argv.slice(0, flags.length)).toEqual(flags);
    expect(argv[argv.length - 1]).toContain('INSTRUCTIONS:');
  });
});
