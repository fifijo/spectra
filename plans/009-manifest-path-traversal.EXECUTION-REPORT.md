# Execution Report: A crafted template manifest cannot delete files outside the project

> Date: 2026-11-10 11:28 CET
>
> Mode: Batch
>
> Plan: `plans/009-manifest-path-traversal.md` — branch `advisor/009-manifest-path-traversal`

## Summary

- **Overall result: Completed**
- Manifest keys are resolved and checked against the destination before any
  file is removed, so a crafted manifest cannot delete a file outside the
  project.
- A manifest that is not a plain object is treated as empty instead of
  crashing the CLI.
- Three new tests cover the traversal, the corrupt manifest and the
  destination-folder key.

## Phase Results

- Step 1: Resolve manifest keys and keep them inside the destination — ✅
  - Implemented: `insideDest(dest, key)` next to `readManifest`, using
    `path.resolve` and a `path.sep` comparison.
- Step 2: Use it in the removal loop — ✅
  - Implemented: the loop resolves the key through `insideDest` and warns
    `Ignored a template path outside the project: <key>`.
  - Verification: `grep -n "path.join(dest, key)" src/agents/init.ts` → no output.
- Step 3: Refuse a manifest that is not an object — ✅
  - Implemented: `readManifest` parses into `unknown` and returns `{}` for
    `null`, arrays and non-objects.
- Step 4: Write the tests — ✅
  - Implemented: "does not delete a file outside the project" and "ignores a
    manifest that is not an object", plus "ignores a manifest key that names
    the destination folder itself".
  - Verification: `pnpm vitest run src/agents/__tests__/init.test.ts` → 17 tests pass.
- Step 5: Run everything — ✅
  - Verification: `pnpm typecheck` 0, `pnpm test:unit` → 12 files,
    127 tests pass, `pnpm lint` 0, `pnpm format:check` 0.

## Verification Matrix

- Type check: pass (`pnpm typecheck`)
- Unit tests: pass (`pnpm test:unit` — 12 files, 127 tests)
- init test file: pass (`pnpm vitest run src/agents/__tests__/init.test.ts` — 17 tests)
- Lint: pass (`pnpm lint`)
- Format check: pass (`pnpm format:check`)
- Unsafe join: pass (`grep -n "path.join(dest, key)"` → no output)
- Existing removal behaviour: pass ("removes an installed file whose template is gone" still green)
- Build: not run — no packaging change
- Manual QA: pending — the exploit is covered by unit tests

## Deviations

- `insideDest` rejects the destination root itself. The plan's version
  allowed `file === root`, so a manifest key of `"."` would resolve to the
  destination folder and the removal loop would then read it as a file
  (`EISDIR`). The tightened check (`file.startsWith(root + path.sep)`)
  affects no legitimate key and a test was added for it.
- `plans/README.md` was updated by the orchestrator.

## Blockers and Resolutions

- Blocker: none. The STOP conditions did not fire: the manifest format is
  unchanged (relative paths), the legitimate removal test still passes, and
  the separator is `path.sep`.
- Impact: n/a.
- Resolution: n/a.
- Status: none.

## Follow-ups

- The `path.sep` comparison is only exercised on Linux in this run.

## Changed Files

- `src/agents/init.ts` — `insideDest()`, the removal loop, `readManifest`.
- `src/agents/__tests__/init.test.ts` — three new tests.
- `plans/009-manifest-path-traversal.md` (untracked working material) —
  living plan log.
- `plans/README.md` (untracked working material) — status row for 009.
- `plans/009-manifest-path-traversal.EXECUTION-REPORT.md` (untracked) — this report.
