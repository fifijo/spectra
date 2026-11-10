# Execution Report: Batch mode uses the CLI flags, and a batch clears its own Scope folders

> Date: 2026-11-10 11:14 CET
>
> Mode: Batch
>
> Plan: `plans/005-batch-cli-flags-and-scope-folders.md` — branch `advisor/005-batch-cli-flags-and-scope-folders`

## Summary

- **Overall result: Completed**
- `--page`, `--scope` and `--file` now reach every Scope of a batch (the CLI
  flag wins over the batch file), and the user sees one log line saying so.
- A batch run starts with no Scope folders from an earlier batch.
- Three new tests pin both behaviours.

## Phase Results

- Step 1: Merge the CLI flags into every Scope — ✅
  - Implemented: `page: options.page ?? scopeDef.page` (same for `scope`
    and `file`) in the batch branch of `src/cli.ts`.
  - Verification: the new test "lets the CLI flag win over the batch file"
    asserts the flag value reaches `createScopeContext`.
- Step 2: Log that the flags were applied — ✅
  - Implemented: `sharedFlags()` helper + one `logger.info` before the loop.
  - Verification: covered by the same tests; the log fires once, not per
    Scope.
- Step 3: Clear the Scope folders of a previous batch — ✅
  - Implemented: `fs.rmSync(path.join(cwd, DEFAULT_OUTPUT_DIR, 'scopes'),
    { recursive: true, force: true })` right after the existing `clean(...)`.
  - Verification: the new test "removes the scope folders of an earlier
    batch"; the ADR 0002 guarantee test ("keeps the plan and healing report
    of every scope") still passes.
- Step 4: Document the precedence — ✅
  - Implemented: `docs/BATCH-CONFIG.md` Usage section gained the
    `--page`/`--scope` example and the precedence paragraph.
  - Verification: `grep -n "the flag wins" docs/BATCH-CONFIG.md` → one match.
- Step 5: Write the tests — ✅
  - Implemented: three new tests in `describe('--batch mode')`; no existing
    test changed.
  - Verification: `pnpm vitest run src/__tests__/cli.test.ts` → 30 tests pass.
- Step 6: Run everything — ✅
  - Verification: `pnpm typecheck` 0, `pnpm test:unit` → 12 files,
    117 tests pass, `pnpm lint` 0, `pnpm format:check` 0.

## Verification Matrix

- Type check: pass (`pnpm typecheck`)
- Unit tests: pass (`pnpm test:unit` — 12 files, 117 tests)
- CLI test file: pass (`pnpm vitest run src/__tests__/cli.test.ts` — 30 tests)
- Lint: pass (`pnpm lint`)
- Format check: pass (`pnpm format:check`)
- Documentation: pass (`grep -n "the flag wins" docs/BATCH-CONFIG.md` → 1 match)
- Build: not run — no packaging change
- Manual QA: pending — a real batch run needs live agent tooling

## Deviations

- The flag list lives in a `sharedFlags()` helper at the top of
  `src/cli.ts`, as the plan's own conventions note asks; the plan's snippet
  was inline in the branch.
- The three new test fixtures got `"url": "http://localhost:5173"`; without
  a URL `run()` calls `process.exit(1)` and kills the vitest worker.
- Only the prose line "the flag wins" was kept in the doc, so the plan's
  own grep (one match) holds.
- `plans/README.md` was updated by the orchestrator.

## Blockers and Resolutions

- Blocker: none. The STOP conditions did not fire: the README and
  `docs/BATCH-CONFIG.md` agree that `--url` overrides the JSON `url`, and
  ADR 0002 confirms the per-Scope folders are copies.
- Impact: n/a.
- Resolution: n/a.
- Status: none.

## Follow-ups

- A batch now deletes `.spectra/output/scopes/` wholesale at the start of
  the run, so hand-made notes in those folders are gone. The canonical
  `plans/` and `reports/` are untouched.

## Changed Files

- `src/cli.ts` — `sharedFlags()`, the flag merge, the log line, the
  `fs.rmSync` of the scopes folder.
- `src/__tests__/cli.test.ts` — three new batch tests.
- `docs/BATCH-CONFIG.md` — flag precedence documented.
- `plans/005-batch-cli-flags-and-scope-folders.md` (untracked working
  material) — living plan log.
- `plans/README.md` (untracked working material) — status row for 005.
- `plans/005-batch-cli-flags-and-scope-folders.EXECUTION-REPORT.md`
  (untracked) — this report.
