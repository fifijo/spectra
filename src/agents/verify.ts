/**
 * The one rule that decides whether an Agent did its job.
 *
 * Both the CLI and the MCP server ask this module, so the two modes can never
 * disagree about what an Agent owes the run.
 */

import fs from 'node:fs';
import path from 'node:path';

import type { Agent } from './catalogue.js';

/** What the files the Agents write looked like when the run started. */
export type Snapshot = Map<string, number>;

/** The path as the Agent sees it: relative to the project root it runs in. */
export function projectPath(target: string): string {
  return path.relative(process.cwd(), target);
}

/** Every file under a folder, with its full path. */
export function listFiles(dir: string): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(full));
    else files.push(full);
  }
  return files;
}

/** When a file was last written, or -1 when there is no such file. */
function mtimeOf(file: string): number {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return -1;
  }
}

/**
 * What the files the Agents write look like right now.
 *
 * A file that is not in the snapshot is a file this run created. A file that is
 * in it must have changed to count, so a file left over from an earlier run
 * never passes for work this run did.
 */
export function takeSnapshot(agents: Agent[], outputDir: string, projectRoot: string): Snapshot {
  const snapshot: Snapshot = new Map();

  for (const agent of agents) {
    for (const file of agent.outputs) {
      const full = path.join(outputDir, file);
      snapshot.set(full, mtimeOf(full));
    }
    for (const dir of foldersOf(agent)) {
      for (const file of listFiles(path.join(projectRoot, dir))) {
        snapshot.set(file, mtimeOf(file));
      }
    }
  }

  return snapshot;
}

/** The project folders an Agent writes into. */
function foldersOf(agent: Agent): string[] {
  return [...new Set([...agent.writes, ...agent.projectOutputs])].filter((dir) =>
    dir.endsWith('/'),
  );
}

/**
 * A file that is there now and is not the one the snapshot remembers.
 *
 * shortcut: the file's timestamp says it changed, so a rewrite with the same
 * bytes inside one filesystem tick is not seen. Compare content hashes when a
 * run can write the same bytes twice within a tick.
 */
function changedSince(file: string, snapshot: Snapshot): boolean {
  const now = mtimeOf(file);
  if (now < 0) return false;
  const before = snapshot.get(file);
  return before === undefined || before !== now;
}

/**
 * What the Agent still has to write, as paths relative to the project root.
 *
 * The snapshot is what the run found when it started: a file left over from an
 * earlier run is not new, so a run can never pass on work it did not do.
 */
export function missingOutputs(
  agent: Agent,
  outputDir: string,
  projectRoot: string,
  snapshot: Snapshot,
): string[] {
  const missing: string[] = [];

  for (const file of agent.outputs) {
    const full = path.join(outputDir, file);
    if (!changedSince(full, snapshot)) missing.push(projectPath(full));
  }

  for (const dir of agent.writes) {
    const folder = path.join(projectRoot, dir);
    const wrote = listFiles(folder).some((file) => changedSince(file, snapshot));
    if (!wrote) missing.push(projectPath(folder));
  }

  return missing;
}

/**
 * How many files under a folder the run created or changed.
 * A declaration file is not a page object, so it does not count.
 */
export function countChanged(dir: string, snapshot: Snapshot, ext: string): number {
  return listFiles(dir).filter(
    (file) => file.endsWith(ext) && !file.endsWith('.d.ts') && changedSince(file, snapshot),
  ).length;
}
