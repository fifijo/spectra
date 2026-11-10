import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AGENTS } from '../catalogue.js';
import { missingOutputs, takeSnapshot } from '../verify.js';

function agentNamed(name: string) {
  const agent = AGENTS.find((a) => a.name === name);
  if (!agent) throw new Error(`no agent named ${name}`);
  return agent;
}

describe('missingOutputs', () => {
  const tmpDirs: string[] = [];
  let originalCwd: string;
  let projectDir: string;
  let outputDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spectra-verify-'));
    tmpDirs.push(projectDir);
    process.chdir(projectDir);
    outputDir = path.join(projectDir, '.spectra', 'output');
    fs.mkdirSync(outputDir, { recursive: true });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  /** Write a file in the project. */
  function write(relative: string, content = 'x'): string {
    const full = path.join(projectDir, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
    return full;
  }

  /** Make a file look like it comes from an earlier run. */
  function makeOld(file: string): void {
    const anHourAgo = Date.now() / 1000 - 3600;
    fs.utimesSync(file, anHourAgo, anHourAgo);
  }

  it('counts a file the Agent wrote during the run as done', () => {
    const snapshot = takeSnapshot(AGENTS, outputDir, projectDir);
    write(path.join('.spectra', 'output', 'plans', 'test-plan.md'));

    expect(missingOutputs(agentNamed('planner'), outputDir, projectDir, snapshot)).toEqual([]);
  });

  it('counts a file that was already there when the run started as missing', () => {
    write(path.join('.spectra', 'output', 'plans', 'test-plan.md'));
    const snapshot = takeSnapshot(AGENTS, outputDir, projectDir);

    expect(missingOutputs(agentNamed('planner'), outputDir, projectDir, snapshot)).toEqual([
      path.join('.spectra', 'output', 'plans', 'test-plan.md'),
    ]);
  });

  it('counts a file the Agent changed during the run as done', () => {
    const plan = write(path.join('.spectra', 'output', 'plans', 'test-plan.md'), 'old');
    makeOld(plan);
    const snapshot = takeSnapshot(AGENTS, outputDir, projectDir);
    fs.writeFileSync(plan, 'new', 'utf-8');

    expect(missingOutputs(agentNamed('planner'), outputDir, projectDir, snapshot)).toEqual([]);
  });

  it('counts a folder without a new file as missing', () => {
    fs.mkdirSync(path.join(projectDir, 'tests'), { recursive: true });
    const snapshot = takeSnapshot(AGENTS, outputDir, projectDir);

    expect(missingOutputs(agentNamed('generator'), outputDir, projectDir, snapshot)).toEqual([
      'tests',
    ]);
  });

  it('counts a folder with a new file as done', () => {
    const snapshot = takeSnapshot(AGENTS, outputDir, projectDir);
    write(path.join('tests', 'login.spec.ts'));

    expect(missingOutputs(agentNamed('generator'), outputDir, projectDir, snapshot)).toEqual([]);
  });

  it('counts a folder with only old files as missing', () => {
    const test = write(path.join('tests', 'login.spec.ts'));
    makeOld(test);
    const snapshot = takeSnapshot(AGENTS, outputDir, projectDir);

    expect(missingOutputs(agentNamed('generator'), outputDir, projectDir, snapshot)).toEqual([
      'tests',
    ]);
  });

  it('counts a test the Agent changed during the run as done', () => {
    const test = write(path.join('tests', 'login.spec.ts'), 'old');
    makeOld(test);
    const snapshot = takeSnapshot(AGENTS, outputDir, projectDir);
    fs.writeFileSync(test, 'new', 'utf-8');

    expect(missingOutputs(agentNamed('generator'), outputDir, projectDir, snapshot)).toEqual([]);
  });
});
