import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { describeResults, isGreen, readResults } from '../results.js';

describe('readResults', () => {
  const tmpDirs: string[] = [];

  beforeEach(() => {
    tmpDirs.push(fs.mkdtempSync(path.join(os.tmpdir(), 'spectra-results-')));
  });

  afterEach(() => {
    for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true });
    tmpDirs.length = 0;
  });

  function write(content: string): string {
    const file = path.join(tmpDirs[0], 'results.json');
    fs.writeFileSync(file, content, 'utf-8');
    return file;
  }

  it('reads the counts of a Playwright report', () => {
    const file = write(
      JSON.stringify({ stats: { expected: 7, unexpected: 2, flaky: 1, skipped: 3 } }),
    );

    expect(readResults(file)).toEqual({ passed: 7, failed: 2, flaky: 1, skipped: 3, total: 13 });
  });

  it('counts a missing count as zero', () => {
    const file = write(JSON.stringify({ stats: { expected: 1 } }));

    expect(readResults(file)).toEqual({ passed: 1, failed: 0, flaky: 0, skipped: 0, total: 1 });
  });

  it('returns null when there is no report', () => {
    expect(readResults(path.join(tmpDirs[0], 'nothing.json'))).toBeNull();
  });

  it('returns null when the report is not a report', () => {
    expect(readResults(write('not json at all'))).toBeNull();
    expect(readResults(write('{"suites":[]}'))).toBeNull();
  });
});

describe('describeResults', () => {
  it('says what the run did', () => {
    expect(describeResults({ passed: 3, failed: 1, flaky: 0, skipped: 0, total: 4 })).toBe(
      '3 passed, 1 failed, 0 flaky, 0 skipped',
    );
  });

  it('says when there was no run', () => {
    expect(describeResults(null)).toBe('no results: the Healer did not run the suite');
  });
});

describe('isGreen', () => {
  it('is green when the tests passed', () => {
    expect(isGreen({ passed: 3, failed: 0, flaky: 0, skipped: 1, total: 4 })).toBe(true);
  });

  it('is green when a test passed on a retry', () => {
    expect(isGreen({ passed: 0, failed: 0, flaky: 1, skipped: 0, total: 1 })).toBe(true);
  });

  it('is not green when a test failed', () => {
    expect(isGreen({ passed: 3, failed: 1, flaky: 0, skipped: 0, total: 4 })).toBe(false);
  });

  it('is not green when every test was skipped', () => {
    expect(isGreen({ passed: 0, failed: 0, flaky: 0, skipped: 1, total: 1 })).toBe(false);
  });

  it('is not green when there was no run', () => {
    expect(isGreen(null)).toBe(false);
  });
});
