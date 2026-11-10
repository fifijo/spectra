/**
 * The one rule that decides whether an Agent did its job.
 *
 * Both the CLI and the MCP server ask this module, so the two modes can never
 * disagree about what an Agent owes the run.
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import type { Agent } from './catalogue.js';

/** What a file looked like: when it changed and what it holds. */
export interface Fingerprint {
  mtime: number;
  hash: string;
}

/** What the files the Agents write looked like when the run started. */
export type Snapshot = Map<string, Fingerprint | undefined>;

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

/**
 * What a file looks like right now, or undefined when there is no such file.
 *
 * The content is part of the fingerprint: the clock of the file system is
 * coarse, so two writes in the same tick carry the same time.
 */
function fingerprintOf(file: string): Fingerprint | undefined {
  try {
    const hash = createHash('sha1').update(fs.readFileSync(file)).digest('hex');
    return { mtime: fs.statSync(file).mtimeMs, hash };
  } catch {
    return undefined;
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
      snapshot.set(full, fingerprintOf(full));
    }
    for (const dir of foldersOf(agent)) {
      for (const file of listFiles(path.join(projectRoot, dir))) {
        snapshot.set(file, fingerprintOf(file));
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
 * A file counts when its time or its content changed. The content is there
 * because the clock of the file system is coarse: a rewrite in the same tick
 * as the run start carries the same time, and the run would call it untouched.
 *
 * shortcut: a rewrite with the same bytes in the same tick is invisible, the
 * file system offers nothing else to see. Compare inode numbers when a run
 * has to tell two identical rewrites apart.
 */
function changedSince(file: string, snapshot: Snapshot): boolean {
  const now = fingerprintOf(file);
  if (!now) return false;
  if (!snapshot.has(file)) return true;
  const before = snapshot.get(file);
  if (!before) return true;
  return before.mtime !== now.mtime || before.hash !== now.hash;
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
