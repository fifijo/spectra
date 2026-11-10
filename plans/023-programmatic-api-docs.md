# Plan 023: The published programmatic API is documented

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 660399d..HEAD -- src/index.ts src/cli.ts README.md docs/QUICK-REFERENCE.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `660399d`, 2026-11-10

## Why this matters

`src/index.ts` is the package's only programmatic entry point — `main`,
`types` and `exports` all point at it — and it exports five things. The
README documents none of them. A consumer who wants to drive Spectra from
Node (in a CI script, in their own CLI, next to another tool) has no way to
learn that `run()` exists, what `SpectraOptions` contains, that it returns
`false` instead of exiting the process, or that `TEMPLATE_DIR` tells them
where the shipped agent templates live. They read the CLI documentation,
assume there is no library, and shell out.

## Current state

- `src/index.ts` — the whole file:
  ```typescript
  export { run, type SpectraOptions } from './cli.js';
  export { DEFAULT_OUTPUT_DIR, TEMPLATE_DIR } from './utils/constants.js';
  export { type CliMode, detectMode } from './utils/detect-mode.js';
  export { createScopeContext } from './utils/scope.js';
  ```
- `src/cli.ts` — `export async function run(options: SpectraOptions = {}): Promise<boolean>`
  and the `SpectraOptions` type (the same fields the CLI flags set:
  `url`, `page`, `scope`, `file`, `batch`, `manual`, `init`, `debug`).
  `run()` returns `false` on a failed run and **never** calls
  `process.exit` — the process edge does that (`src/bin.ts:5-6`).
- `src/utils/constants.ts` — `DEFAULT_OUTPUT_DIR` (`.spectra/output`) and
  `TEMPLATE_DIR` (the installed package's `templates/` directory).
- `src/utils/detect-mode.ts` — `detectMode(forceManual?: boolean): CliMode`
  with `CliMode = 'cursor-agent' | 'claude-code' | 'manual'`.
- `src/utils/scope.ts` — `createScopeContext(outputPath: string, scope:
  Scope): void`, writing the scope context an Agent reads.
- `package.json:6-12` — `main`, `types` and `exports` all point at
  `dist/index.js` / `dist/index.d.ts`.
- `README.md` — no section mentions `run`, `SpectraOptions`, `detectMode`,
  `createScopeContext`, `DEFAULT_OUTPUT_DIR` or `TEMPLATE_DIR`; the page
  documents only the `spectra` binary.

**Repo conventions to match**: the README uses emoji section headings and
fenced code blocks with a language; a new section goes near the end,
before "## 📦 Publishing to npm". `docs/QUICK-REFERENCE.md` is the
one-page reference — the API belongs there too, in a short block.

**Vocabulary (from `CONTEXT.md`)**: a *Scope* is what a run is pointed at;
the *Agent catalogue* is the one description of every Agent; a *Plan* is
the document the Planner writes. Do not describe `run()` as "running the
pipeline".

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Unit tests | `pnpm test:unit` | 12 files, 129 tests pass |
| Lint + format + assists | `pnpm check` | exit 0, 56 files |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `README.md`
- `docs/QUICK-REFERENCE.md`

**Out of scope** (do NOT touch, even though they look related):
- `src/index.ts` — the export list is correct; this plan documents it.
- `src/cli.ts`, `src/utils/**` — no behaviour change.
- `package.json` — the `exports` map already publishes the entry point.

## Git workflow

- Branch: `advisor/023-programmatic-api-docs`
- Commit style: conventional commits — e.g. `docs: document the programmatic
  API`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add the API section to the README

Insert a new section before "## 📦 Publishing to npm":

````markdown
## 🧩 Programmatic API

The package also ships a library. Everything the CLI does is available
from `spectra-test-automation`:

```typescript
import { run, type SpectraOptions } from 'spectra-test-automation';

const options: SpectraOptions = {
  url: 'http://localhost:5173',
  page: '/checkout',
  scope: 'payment form',
};

const ok = await run(options);
if (!ok) {
  // the run failed - `run()` never exits the process
  process.exitCode = 1;
}
```

| Export | What it is |
|--------|------------|
| `run(options)` | Runs the Spectrum. Returns `Promise<boolean>` — `false` when the run failed. It never calls `process.exit`, so a caller stays in control. |
| `SpectraOptions` | The options object: `url`, `page`, `scope`, `file`, `batch`, `manual`, `init`, `debug` — the same fields the CLI flags set. |
| `detectMode(forceManual?)` | Which CLI tool is available: `cursor-agent`, `claude-code` or `manual`. |
| `createScopeContext(path, scope)` | Writes the scope context file an Agent reads. Useful when you build your own Agent prompt. |
| `DEFAULT_OUTPUT_DIR` | `.spectra/output` — where a run writes its results. |
| `TEMPLATE_DIR` | The installed package's `templates/` directory: the agent templates, the Playwright config and the MCP config. |
````

**Verify**: `grep -n "Programmatic API" README.md` → one hit; `grep -n
"detectMode\|createScopeContext\|TEMPLATE_DIR" README.md` → at least three
hits.

### Step 2: Add the same to the quick reference

In `docs/QUICK-REFERENCE.md`, add a short "## Programmatic API" block at
the end with the import line, the `run(options)` signature, the note that
it returns a boolean and never exits, and the list of the other four
exports. Keep it to a dozen lines — that file is a reference, not a guide.

**Verify**: `grep -n "Programmatic API" docs/QUICK-REFERENCE.md` → one hit.

### Step 3: Check the example against the real types

Read `src/cli.ts` and confirm that every field the section names exists on
`SpectraOptions`, and that `run()` takes one optional argument and returns
a promise of a boolean. If a field does not exist, remove it from the
documentation — do not add it to the type.

**Verify**: `grep -n "export interface SpectraOptions\|export type SpectraOptions" src/cli.ts`
→ one hit; the fields listed in the README are exactly the fields in that
type.

### Step 4: Run the checks

**Verify**: `pnpm check && pnpm typecheck && pnpm test:unit && pnpm build`
→ all exit 0; 12 files and 129 tests pass.

## Test plan

No new unit test: this plan adds documentation for exports that already
exist. The acceptance check is mechanical — the section names exactly the
exports of `src/index.ts`, and its field list matches `SpectraOptions`.

A useful manual check: the example in the README must type-check. Copy it
into a scratch file under `src/` (so it sees the same tsconfig), run
`pnpm typecheck`, then delete the scratch file. Do not commit it.

## Done criteria

- [ ] The README has a "Programmatic API" section naming all six exports
- [ ] The section shows a working `run(options)` example and states that
      `run()` returns a boolean and never exits the process
- [ ] `docs/QUICK-REFERENCE.md` has a short Programmatic API block
- [ ] Every option named in the docs exists in `SpectraOptions`
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test:unit` exits 0; 129 tests pass
- [ ] `pnpm build` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 023 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `src/index.ts` exports something this plan does not list — document it
  too, or report why not.
- `run()` no longer returns `Promise<boolean>` or has started calling
  `process.exit` — that would be a regression in the library contract (plan
  008 fixed it); report it.
- `SpectraOptions` has no `url` field or has fields this plan does not
  mention — copy the live type.

## Maintenance notes

- The README documents the CLI; this section documents the library. Keep
  them consistent: a new CLI flag normally means a new `SpectraOptions`
  field, and both places should say so.
- `run()` never exits the process — that is deliberate (plan 008): the
  caller decides what a failed run means. Do not document it as exiting.
- Reviewers should check the example against the type rather than trusting
  the prose; the example is the part people copy.
