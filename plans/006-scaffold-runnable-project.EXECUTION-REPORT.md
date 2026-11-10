# Execution Report: `--init` scaffolds a project the pipeline can finish

> Date: 2026-11-10 11:18 CET
>
> Mode: Batch
>
> Plan: `plans/006-scaffold-runnable-project.md` — branch `advisor/006-scaffold-runnable-project`

## Summary

- **Overall result: Completed**
- `spectra --init` now scaffolds a Playwright config, the Playwright MCP
  config, and the gate documentation in `specs/`, so the Healer can run the
  tests and find the JSON results it needs.
- The package no longer ships the repo's own `playwright.config.ts` (its
  `webServer` points at the unshipped `dummy-test-app`).
- Four new tests pin the behaviour.

## Phase Results

- Step 1: Add a Playwright config template — ✅
  - Implemented: `templates/config/playwright.config.ts` — the repo's config
    minus the `webServer` block (and minus the helper that only existed to
    gate that block).
  - Verification: `grep -n "dummy-test-app" templates/config/playwright.config.ts`
    → no output; the file typechecks on its own
    (`tsc --ignoreConfig --strict --types node` → exit 0).
- Step 2: Add the MCP configuration template — ✅
  - Implemented: `templates/cursor/mcp.json`.
  - Verification: `diff templates/cursor/mcp.json .cursor/mcp.json` → no output.
- Step 3: Copy both into the scaffolded project — ✅
  - Implemented: `scaffold()` copies both with the copy-if-not-exists style.
  - Verification: `pnpm typecheck` → exit 0.
- Step 4: Ship the gate documentation into `specs/` — ✅
  - Implemented: `installTemplates(PACKAGE_ROOT/specs → project/specs)`.
  - Verification: `pnpm typecheck` → exit 0; new test "copies the gate
    documentation into specs/".
- Step 5: Make sure the package ships the new templates — ✅
  - Implemented: `"playwright.config.ts"` removed from the `files` array.
  - Verification: `npm pack --dry-run` lists
    `package/templates/config/playwright.config.ts` and
    `package/templates/cursor/mcp.json`, and no `package/playwright.config.ts`.
- Step 6: Write the tests — ✅
  - Implemented: four new cases in `describe('scaffold')`.
  - Verification: `pnpm vitest run src/agents/__tests__/init.test.ts` → 14 tests pass.
- Step 7: Update the README's `--init` section — ✅
  - Implemented: the `--init` snippet and the project-structure block list
    the new files.
- Step 8: Run everything — ✅
  - Verification: `pnpm typecheck` 0, `pnpm test:unit` → 12 files,
    121 tests pass, `pnpm lint` 0, `pnpm format:check` 0, `pnpm build` 0.

## Verification Matrix

- Type check: pass (`pnpm typecheck`)
- Unit tests: pass (`pnpm test:unit` — 12 files, 121 tests)
- init test file: pass (`pnpm vitest run src/agents/__tests__/init.test.ts` — 14 tests)
- Lint: pass (`pnpm lint`)
- Format check: pass (`pnpm format:check`)
- Build: pass (`pnpm build`)
- Packaging: pass (`npm pack --dry-run` — templates present, root config absent)
- Template type check: pass (`tsc --ignoreConfig --strict --types node templates/config/playwright.config.ts`)
- Manual QA: pending — a real agent run needs live agent tooling

## Deviations

- The template's now-unused `shouldStartLocalWebServer()` helper was
  removed: copying the config without the `webServer` block would
  otherwise ship dead code into every scaffolded project.
- A fourth test (the gate-docs copy) was added: the plan's done criteria
  require that behaviour but its test list named only three cases.
- `plans/README.md` was updated by the orchestrator.

## Blockers and Resolutions

- Blocker: none. The STOP conditions did not fire — the repo config still
  writes the JSON reporter to `.spectra/output/reports/results.json`,
  `PACKAGE_ROOT` imports without a cycle, and the root config is gone from
  the tarball.
- Impact: n/a.
- Resolution: n/a.
- Status: none.

## Follow-ups

- The template assumes the user's project has `@types/node` and
  `@playwright/test` — the same assumption the repo's own config makes.

## Changed Files

- `templates/config/playwright.config.ts` (new) — the config a project gets.
- `templates/cursor/mcp.json` (new) — the Playwright MCP config.
- `src/agents/init.ts` — the three new copies in `scaffold()`.
- `src/agents/__tests__/init.test.ts` — mock/fixture updates, four new cases.
- `package.json` — `files` array no longer lists the repo's config.
- `README.md` — the `--init` section and the project-structure block.
- `plans/006-scaffold-runnable-project.md` (untracked working material) —
  living plan log.
- `plans/README.md` (untracked working material) — status row for 006.
- `plans/006-scaffold-runnable-project.EXECUTION-REPORT.md` (untracked) — this report.
