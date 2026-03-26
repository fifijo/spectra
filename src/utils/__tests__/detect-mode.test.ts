import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execSync } from 'node:child_process';

import { detectMode } from '../detect-mode.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

const mockedExecSync = vi.mocked(execSync);

describe('detectMode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns "manual" when forceManual is true', () => {
    expect(detectMode(true)).toBe('manual');
    expect(mockedExecSync).not.toHaveBeenCalled();
  });

  it('returns "cursor-agent" when cursor-agent command exists', () => {
    mockedExecSync.mockReturnValue(Buffer.from('/usr/bin/cursor-agent'));

    expect(detectMode()).toBe('cursor-agent');
    expect(mockedExecSync).toHaveBeenCalledTimes(1);
  });

  it('returns "claude-code" when cursor-agent is missing but claude exists', () => {
    mockedExecSync
      .mockImplementationOnce(() => { throw new Error('not found'); })
      .mockReturnValueOnce(Buffer.from('/usr/bin/claude'));

    expect(detectMode()).toBe('claude-code');
    expect(mockedExecSync).toHaveBeenCalledTimes(2);
  });

  it('returns "manual" when no CLI tools are available', () => {
    mockedExecSync.mockImplementation(() => { throw new Error('not found'); });

    expect(detectMode()).toBe('manual');
  });

  it('returns "manual" when forceManual is false and no tools available', () => {
    mockedExecSync.mockImplementation(() => { throw new Error('not found'); });

    expect(detectMode(false)).toBe('manual');
  });
});
