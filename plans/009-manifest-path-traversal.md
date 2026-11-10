# Plan 009: A crafted template manifest cannot delete files outside the project

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 2106580..HEAD -- src/agents/init.ts src/agents/__tests__/init.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `2106580`, 2026-11-10

## Why this matters

`.spectra/agents/.templates.json` records which template each installed file
came from. The CLI reads that file and deletes any installed file whose
template is gone. The keys in that file are used to build a path, and nothing
checks that the path stays inside the project. A manifest with the key
`../../../victim/secret.txt` and the matching hash makes `spectra --init` —
and every later run, because `initAgents` runs on every run — delete a file
outside the project, with the user's own privileges.

## Current state

- `src/agents/init.ts:16-23` — `readManifest`, which parses the JSON.
- `src/agents/init.ts:76-113` — `installTemplates`, which writes the manifest
  and installs the templates.
- `src/agents/init.ts:115-127` — the removal loop, which trusts the keys.
- `src/agents/__tests__/init.test.ts` — the existing tests for this file.

`src/agents/init.ts:16-23` (verbatim):

```typescript
function readManifest(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return {};
  }
}
```

`src/agents/init.ts:115-129` (verbatim):

```typescript
  walk(src, dest, '');

  // Templates that no longer exist are removed, unless the user changed them.
  for (const key of Object.keys(installed)) {
    if (next[key]) continue;
    const file = path.join(dest, key);
    if (!fs.existsSync(file)) continue;
    if (hash(fs.readFileSync(file)) !== installed[key]) {
      logger.warn(`Kept your edited ${key} (its template is gone)`);
      continue;
    }
    fs.unlinkSync(file);
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`, 'utf-8');
}
```

`path.join(dest, '../../../victim/secret.txt')` normalises to a path outside
`dest`, and `fs.unlinkSync` deletes it.

**The bug, reproduced.** With a project that contains only this manifest:

```json
{
  "../../../victim/secret.txt": "<sha256 of that file>"
}
```

running the CLI's template installation deletes the file:

```
$ ls -l /tmp/opencode/spectra-traversal/victim/secret.txt
ls: cannot access '.../victim/secret.txt': No such file or directory
```

A second, smaller problem is in the same function: `JSON.parse('null')`
succeeds and returns `null`, so `readManifest` returns `null`, and
`Object.keys(null)` throws a `TypeError` — a corrupted manifest crashes the
CLI with a stack trace.

**Repo conventions to match**: `src/agents/init.ts` uses `logger.warn` for
something suspicious that was kept, and `logger.error` for a failure. The
manifest is written with
`fs.writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`, 'utf-8')`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0 |
| Unit tests | `pnpm test:unit` | all pass |
| One test file | `pnpm vitest run src/agents/__tests__/init.test.ts` | all pass |
| Lint | `pnpm lint` | exit 0 |
| Format check | `pnpm format:check` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `src/agents/init.ts`
- `src/agents/__tests__/init.test.ts`

**Out of scope** (do NOT touch, even though they look related):
- `src/cli.ts`, `src/utils/**` — unrelated.
- `templates/**` — the templates are the trusted side of this boundary and
  stay as they are.
- `src/agents/catalogue.ts` — unrelated.

## Git workflow

- Branch: `advisor/009-manifest-path-traversal`
- Commit style: conventional commits — e.g. `fix: keep template paths inside
  the project`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Resolve manifest keys and keep them inside the destination

In `src/agents/init.ts`, add a helper next to `readManifest`:

```typescript
/**
 * The path of an installed file, or null when the key points outside the
 * destination. A manifest is a file in the project; it must not be able to
 * name a file outside it.
 */
function insideDest(dest: string, key: string): string | null {
  const root = path.resolve(dest);
  const file = path.resolve(root, key);
  return file === root || file.startsWith(root + path.sep) ? file : null;
}
```

`path.resolve` normalises `..` segments, and the `startsWith(root + path.sep)`
check rejects anything that is not strictly inside the destination.

### Step 2: Use it in the removal loop

Replace the removal loop:

```typescript
  // Templates that no longer exist are removed, unless the user changed them.
  for (const key of Object.keys(installed)) {
    if (next[key]) continue;
    const file = insideDest(dest, key);
    if (!file) {
      logger.warn(`Ignored a template path outside the project: ${key}`);
      continue;
    }
    if (!fs.existsSync(file)) continue;
    if (hash(fs.readFileSync(file)) !== installed[key]) {
      logger.warn(`Kept your edited ${key} (its template is gone)`);
      continue;
    }
    fs.unlinkSync(file);
  }
```

Note that `insideDest` returns the **resolved** path, so `file` is already
absolute and normalised — do not wrap it in `path.join` again.

### Step 3: Refuse a manifest that is not an object

`readManifest` can return `null` today (`JSON.parse('null')`). Make it
return an empty object instead:

```typescript
function readManifest(file: string): Record<string, string> {
  if (!fs.existsSync(file)) return {};
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}
```

A manifest is written by this program, so anything else is corrupt — treat it
as empty and let the templates be reinstalled.

### Step 4: Write the tests

Add to `src/agents/__tests__/init.test.ts`, in the `describe('initAgents')`
block. The file's `setupTemplates()` helper builds a fake template tree in
`/tmp/spectra-test-templates`.

(a) A manifest key that points outside the project must not delete the file:

```typescript
  it('does not delete a file outside the project', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    const outside = path.join(projectRoot, '..', 'outside-secret.txt');
    fs.writeFileSync(outside, 'secret', 'utf-8');
    const hash = createHash('sha256').update(fs.readFileSync(outside)).digest('hex');

    const manifestPath = path.join(projectRoot, '.spectra', 'agents', '.templates.json');
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ '../../../outside-secret.txt': hash }),
      'utf-8',
    );

    try {
      initAgents(projectRoot);

      expect(fs.existsSync(outside)).toBe(true);
    } finally {
      fs.rmSync(outside, { force: true });
    }
  });
```

`createHash` is imported from `node:crypto` at the top of the test file.

(b) A corrupt manifest must not crash the CLI:

```typescript
  it('ignores a manifest that is not an object', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    const manifestPath = path.join(projectRoot, '.spectra', 'agents', '.templates.json');
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, 'null', 'utf-8');

    expect(() => initAgents(projectRoot)).not.toThrow();
  });
```

**Verify**: `pnpm vitest run src/agents/__tests__/init.test.ts` → all pass.

### Step 5: Run everything

**Verify**: `pnpm typecheck && pnpm test:unit && pnpm lint && pnpm format:check`
→ all exit 0

## Test plan

- New tests in `src/agents/__tests__/init.test.ts`, in `describe('initAgents')`:
  1. a manifest key that points outside the project deletes nothing,
  2. a manifest that is not an object is ignored instead of crashing.
- Structural pattern: the existing case "removes an installed file whose
  template is gone", which is the behaviour the first new test must not
  break.
- Verification: `pnpm vitest run src/agents/__tests__/init.test.ts` → all pass.

## Done criteria

- [x] `grep -n "path.join(dest, key)" src/agents/init.ts` returns nothing
- [x] `src/agents/init.ts` resolves manifest keys and rejects paths outside the destination
- [x] A manifest of `null` does not crash `initAgents`
- [x] The existing test "removes an installed file whose template is gone" still passes
- [x] `pnpm test:unit` exits 0; at least 2 new tests in `src/agents/__tests__/init.test.ts`
- [x] `pnpm typecheck` exits 0
- [x] `pnpm lint` and `pnpm format:check` exit 0
- [x] No files outside the in-scope list are modified (`git status`)
- [x] `plans/README.md` status row for 009 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The manifest format changed — for example the keys are no longer relative
  paths. Re-read `installTemplates` and report what the keys look like now.
- The legitimate removal of an installed file stops working (the existing
  test "removes an installed file whose template is gone" fails). That test
  is the behaviour the removal loop exists for; report it instead of
  weakening the check.
- The path check rejects a legitimate key such as `planner/AGENT.md`. The
  separator in the comparison must be `path.sep`, not `/`, or the check
  breaks on Windows.

## Maintenance notes

- The manifest lives in the user's project, so it is untrusted input from the
  CLI's point of view — the same way a `.json` file in a cloned repository is.
- The check is cheap and belongs next to the code that uses the key, not in
  a shared helper file: the rule "a path built from project content stays in
  the project" should be visible where the path is built.
- If a future feature lets a user point the templates somewhere else
  (a different root), the same check has to follow the new root — do not
  hard-code `.spectra/agents`.

## Progress

- **2026-11-10 11:24 CET — Phase start (Batch mode).** Drift check showed
  earlier plans' changes in the two in-scope files; the plan's quoted
  `readManifest` and removal-loop excerpts still match the live code, and
  the manifest format is unchanged (relative paths built with
  `path.join(rel, entry.name)`).
- **2026-11-10 11:25 CET — Steps 1-3 done.** `insideDest(dest, key)` added;
  the removal loop resolves manifest keys through it and warns
  `Ignored a template path outside the project: <key>`;
  `readManifest` returns `{}` for anything that is not a plain object.
  `grep -n "path.join(dest, key)" src/agents/init.ts` → no output.
- **2026-11-10 11:25 CET — Steps 4-5 done.** Two new tests in
  `describe('initAgents')` (a traversal key deletes nothing; a `null`
  manifest is ignored) plus a third for the destination-folder key.
  `pnpm typecheck` 0, init tests 17 pass, `pnpm test:unit` → 12 files,
  127 tests pass, `pnpm lint` and `pnpm format:check` 0.

## Surprises & Discoveries

- The plan's helper accepts the destination itself (`file === root`), so a
  manifest key of `"."` or `""` resolves to the destination folder and the
  removal loop then reads it as a file (`EISDIR`). Since the manifest is
  untrusted input, the check was tightened to "strictly inside the
  destination" (`file.startsWith(root + path.sep)`), which no legitimate key
  (`planner/AGENT.md`) is affected by.

## Decision Log

- **Batch mode.** LOW risk, one source file, one test file.
- **`insideDest` rejects the destination root itself** — the plan's code
  allowed it; the tightened check removes a crash path for a corrupt
  manifest and a test was added for it.
- **The plan file stays in `plans/`** — later plans reference these files by
  path, and the repo has no archive convention.

## Outcomes & Retrospective

- **Result: completed.** A crafted manifest can no longer delete a file
  outside the project, and a corrupt manifest can no longer crash the CLI.
- **Verification summary:** `pnpm typecheck` 0, `pnpm test:unit` 12 files /
  127 tests, lint 0, format 0, `grep -n "path.join(dest, key)"` clean, and
  the existing "removes an installed file whose template is gone" test still
  passes.
- **Approved deviations:** the tightened `insideDest` and its extra test.
- **Follow-ups:** the `path.sep` comparison is only exercised on Linux here.
