/**
 * What the last test run actually did.
 *
 * Playwright writes the JSON report, not the Agent: the numbers here cannot be
 * claimed by a run that never ran the tests.
 */
import fs from 'node:fs';

export interface TestSummary {
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  total: number;
}

/**
 * The counts of a Playwright JSON report, or null when there is no report to
 * read: the file is missing, or it holds something else.
 */
export function readResults(file: string): TestSummary | null {
  let stats: { expected?: number; unexpected?: number; flaky?: number; skipped?: number };
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const statsOf = (parsed as { stats?: unknown })?.stats;
    if (typeof statsOf !== 'object' || statsOf === null) return null;
    stats = statsOf as typeof stats;
  } catch {
    return null;
  }

  const passed = stats.expected ?? 0;
  const failed = stats.unexpected ?? 0;
  const flaky = stats.flaky ?? 0;
  const skipped = stats.skipped ?? 0;
  return { passed, failed, flaky, skipped, total: passed + failed + flaky + skipped };
}

/** One line: what a run did, for the summary and the exit status. */
export function describeResults(summary: TestSummary | null): string {
  if (!summary) return 'no results: the Healer did not run the suite';
  return `${summary.passed} passed, ${summary.failed} failed, ${summary.flaky} flaky, ${summary.skipped} skipped`;
}

/**
 * Whether the run is green: nothing failed, and something actually passed.
 * A suite where every test was skipped has not proved anything.
 */
export function isGreen(summary: TestSummary | null): boolean {
  return summary !== null && summary.failed === 0 && summary.passed + summary.flaky > 0;
}
