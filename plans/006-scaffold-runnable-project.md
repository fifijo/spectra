# Plan 006: `--init` scaffolds a project the pipeline can finish

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 2106580..HEAD -- src/agents/init.ts templates/ package.json src/utils/constants.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `2106580`, 2026-11-10

## Why this matters

`spectra --init` is the first thing every user runs. It produces a project
with directories, agent templates and a fixtures file — and without the two
files the pipeline needs. There is no `playwright.config.ts`, so the Healer
(whose first step is `pnpm exec playwright test`) cannot run the tests, and
the JSON results the catalogue declares as the Healer's input
(`.spectra/output/reports/results.json`) are never written. There is no
`.cursor/mcp.json`, and all three agent templates are built around Playwright
MCP. The `specs/` directory is created empty, although the shared context
tells every Agent that `specs/` holds the gate documentation.

## Current state

- `src/agents/init.ts:42-69` — `scaffold()`, which creates the directories
  and copies the agent templates, the scope doc template and the fixtures
  template.
- `src/utils/layout.ts:17-25` — `PROJECT_DIRS`, the folders a project gets.
- `src/utils/constants.ts:8-11` — `PACKAGE_ROOT` and `TEMPLATE_DIR`.
- `templates/` — what the package ships: `templates/agents/`,
  `templates/docs/SCOPE-template.md`, `templates/fixtures/pages.ts`.
- `playwright.config.ts` — the repo's own config. Its `webServer` block
  points at `./dummy-test-app`, which is **not** shipped and **not** valid in
  a user's project.
- `.cursor/mcp.json` — the Playwright MCP configuration.

`src/agents/init.ts:42-69` (verbatim):

```typescript
/**
 * Scaffold the standard project structure for a new Spectra project.
 */
export function scaffold(projectRoot: string): void {
  for (const dir of PROJECT_DIRS) {
    const full = path.join(projectRoot, dir);
    fs.mkdirSync(full, { recursive: true });
  }

  initAgents(projectRoot);

  // Copy doc templates
  const docsSource = path.join(TEMPLATE_DIR, 'docs');
  const docsDest = path.join(projectRoot, 'docs');
  if (fs.existsSync(docsSource)) {
    installTemplates(docsSource, docsDest);
  }

  // Copy fixture template if not present
  const fixtureSource = path.join(TEMPLATE_DIR, 'fixtures', 'pages.ts');
  const fixtureDest = path.join(projectRoot, 'fixtures', 'pages.ts');
  if (fs.existsSync(fixtureSource) && !fs.existsSync(fixtureDest)) {
    fs.mkdirSync(path.dirname(fixtureDest), { recursive: true });
    fs.copyFileSync(fixtureSource, fixtureDest);
  }

  logger.success('Project scaffolded successfully.');
}
```

**The bug, reproduced.** `spectra --init` in an empty directory produces:

```
./.spectra/agents/{generator,healer,planner,shared}/…
./.spectra/output/{plans,reports,test-results,tests}
./docs/SCOPE-template.md
./fixtures/pages.ts
./pages
./specs
./tests
./tests/e2e
```

No `playwright.config.ts`, no `.cursor/`, no `specs/*.md`, no `package.json`.

**Repo conventions to match**: templates live under `templates/` and are
copied by `scaffold()`; the package `files` array (`package.json:17-26`)
lists `templates`, so a new template folder ships without a change there.
`init.ts` has two copy styles already — `installTemplates` (refreshes unless
the user edited the file) and a plain copy-if-not-exists (for the fixtures
file). Use the plain style for files the user owns and must never lose.

**Vocabulary (from `CONTEXT.md`)**: the *Agent catalogue* is the one
description of every Agent; an *Agent* is one of Planner / Generator / Healer.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0 |
| Unit tests | `pnpm test:unit` | all pass |
| One test file | `pnpm vitest run src/agents/__tests__/init.test.ts` | all pass |
| Lint | `pnpm lint` | exit 0 |
| Format check | `pnpm format:check` | exit 0 |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `templates/config/playwright.config.ts` (create)
- `templates/cursor/mcp.json` (create)
- `src/agents/init.ts`
- `src/agents/__tests__/init.test.ts`
- `package.json` (the `files` array only)
- `README.md` (only the `spectra --init` section)

**Out of scope** (do NOT touch, even though they look related):
- `playwright.config.ts` at the repo root — it belongs to this repo (it
  starts `dummy-test-app`). It is not the template; copy it, edit the copy.
- `.cursor/mcp.json` at the repo root — same: copy it, edit the copy.
- `src/utils/layout.ts` — `PROJECT_DIRS` is fine as it is.
- `src/agents/catalogue.ts`, `src/utils/**` — unrelated.

## Git workflow

- Branch: `advisor/006-scaffold-runnable-project`
- Commit style: conventional commits — e.g. `feat: scaffold a project the
  pipeline can finish`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a Playwright config template

Create `templates/config/playwright.config.ts` as a copy of the repo's
`playwright.config.ts` with **one** change: the `webServer` block must go,
because it points at `./dummy-test-app`, which does not exist in a user's
project.

The rest of the config must stay exactly as the repo has it, because the
Healer depends on the reporter paths: the JSON reporter must keep writing
`.spectra/output/reports/results.json`, because that is the file
`src/agents/catalogue.ts:45` declares as the Healer's input.

The file must start with the same shape as the repo's config:

```typescript
import { defineConfig, devices, type Project } from '@playwright/test';

const baseURL = process.env.SPECTRA_URL || 'http://localhost:5173';
```

Keep the `buildProjects()` helper, the `reporter` array
(`html` → `.spectra/output/reports`, `json` → `.spectra/output/reports/results.json`,
`list`), the `use` block (`baseURL`, `trace: 'on-first-retry'`,
`screenshot: 'only-on-failure'`, `testIdAttribute: 'data-testid'`),
`testDir: './tests'`, `fullyParallel: true`, `outputDir: '.spectra/output/test-results'`,
and the `SPECTRA_BROWSERS` / `SPECTRA_TAGS` handling.

**Verify**: `grep -n "dummy-test-app" templates/config/playwright.config.ts`
→ no output. The template must not mention the dummy app.

### Step 2: Add the MCP configuration as a template

Create `templates/cursor/mcp.json` with the same content as the repo's
`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser", "chromium"
      ]
    }
  }
}
```

**Verify**: `diff templates/cursor/mcp.json .cursor/mcp.json` → no output.

### Step 3: Copy both into the scaffolded project

In `src/agents/init.ts`, add to `scaffold()` — after the fixtures copy, so
the project ends up complete:

```typescript
  // Copy the Playwright config if not present: the Healer runs the tests with it.
  const configSource = path.join(TEMPLATE_DIR, 'config', 'playwright.config.ts');
  const configDest = path.join(projectRoot, 'playwright.config.ts');
  if (fs.existsSync(configSource) && !fs.existsSync(configDest)) {
    fs.copyFileSync(configSource, configDest);
  }

  // Copy the MCP config if not present: the Agents explore with Playwright MCP.
  const mcpSource = path.join(TEMPLATE_DIR, 'cursor', 'mcp.json');
  const mcpDest = path.join(projectRoot, '.cursor', 'mcp.json');
  if (fs.existsSync(mcpSource) && !fs.existsSync(mcpDest)) {
    fs.mkdirSync(path.dirname(mcpDest), { recursive: true });
    fs.copyFileSync(mcpSource, mcpDest);
  }
```

Both use the copy-if-not-exists style, like the fixtures file above them: a
user's own `playwright.config.ts` must never be replaced.

**Verify**: `pnpm typecheck` → exit 0.

### Step 4: Ship the gate documentation into the scaffolded `specs/`

`src/utils/layout.ts:19` creates an empty `specs/` directory, and
`templates/agents/shared/context.md:16` tells every Agent that `specs/`
holds "Markdown plans and gate documentation". The package already ships the
gate docs (`package.json:21` lists `"specs"` in `files`), so copy them into
the project.

In `src/agents/init.ts`, in `scaffold()`:

```typescript
  // Copy the gate documentation into specs/
  const specsSource = path.join(PACKAGE_ROOT, 'specs');
  const specsDest = path.join(projectRoot, 'specs');
  if (fs.existsSync(specsSource)) {
    installTemplates(specsSource, specsDest);
  }
```

`PACKAGE_ROOT` is exported from `src/utils/constants.ts`; import it.

Use `installTemplates` here (not a plain copy) so that a user who edited a
gate doc keeps their edit, exactly as ADR 0001 describes for the agent
templates. It writes `specs/.templates.json` — that is the same pattern the
docs templates already use (`docs/.templates.json`), and the repo's own
`.gitignore:10` already ignores that file.

**Verify**: `pnpm typecheck` → exit 0.

### Step 5: Make sure the package ships the new templates

`package.json:17-26` lists `"templates"` as a whole directory, so
`templates/config/` and `templates/cursor/` ship without a change.

But `"playwright.config.ts"` is listed separately (line 23) — that is the
**repo's** config, whose `webServer` points at `./dummy-test-app`, which is
not shipped. The package never reads that file at runtime (only `TEMPLATE_DIR`
is read, `src/utils/constants.ts:11`). Remove the line from `files`:

```json
    "files": [
      "dist",
      "!dist/**/__tests__",
      "templates",
      "specs",
      "docs",
      "LICENSE",
      "README.md"
    ],
```

**Verify**: `pnpm build` → exit 0, then `npm pack --dry-run` and read the
file list: it must contain `package/templates/config/playwright.config.ts`
and must NOT contain `package/playwright.config.ts`.

### Step 6: Write the tests

In `src/agents/__tests__/init.test.ts`, the `describe('scaffold')` block
already tests the doc templates, the fixture template and "does not overwrite
existing fixture file". Add three cases.

The test file mocks `../../utils/constants.js` with
`TEMPLATE_DIR: '/tmp/spectra-test-templates'` — extend that mock so the
tests can find the new templates:

```typescript
vi.mock('../../utils/constants.js', () => ({
  TEMPLATE_DIR: '/tmp/spectra-test-templates',
  PACKAGE_ROOT: '/tmp/spectra-test-package',
}));
```

and extend `setupTemplates()` to create the files the new code looks for:

```typescript
  const configDir = path.join(templateRoot, 'config');
  const cursorDir = path.join(templateRoot, 'cursor');
  for (const d of [configDir, cursorDir]) {
    fs.mkdirSync(d, { recursive: true });
  }
  fs.writeFileSync(path.join(configDir, 'playwright.config.ts'), '// config', 'utf-8');
  fs.writeFileSync(path.join(cursorDir, 'mcp.json'), '{}', 'utf-8');
```

Then the cases:

```typescript
  it('copies a playwright config when the project has none', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    scaffold(projectRoot);

    expect(fs.existsSync(path.join(projectRoot, 'playwright.config.ts'))).toBe(true);
  });

  it('does not overwrite an existing playwright config', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);
    fs.writeFileSync(path.join(projectRoot, 'playwright.config.ts'), 'mine', 'utf-8');

    scaffold(projectRoot);

    expect(fs.readFileSync(path.join(projectRoot, 'playwright.config.ts'), 'utf-8')).toBe('mine');
  });

  it('copies the mcp config', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    scaffold(projectRoot);

    expect(fs.existsSync(path.join(projectRoot, '.cursor', 'mcp.json'))).toBe(true);
  });
```

**Verify**: `pnpm vitest run src/agents/__tests__/init.test.ts` → all pass.

### Step 7: Update the README's `--init` section

In `README.md`, in the section that describes what `spectra --init` creates,
say that it now also creates the Playwright config and the MCP config. Find
the text by searching for `npx spectra --init` (around line 162) and for the
project-structure block (around line 478).

**Verify**: `grep -n "playwright.config.ts" README.md` → the project
structure block lists it.

### Step 8: Run everything

**Verify**: `pnpm typecheck && pnpm test:unit && pnpm lint && pnpm format:check`
→ all exit 0
**Verify**: `pnpm build` → exit 0
**Verify**: `npm pack --dry-run` → the tarball contains
`package/templates/config/playwright.config.ts` and
`package/templates/cursor/mcp.json`

## Test plan

- New tests in `src/agents/__tests__/init.test.ts`, in `describe('scaffold')`:
  1. a Playwright config is copied when the project has none,
  2. an existing Playwright config is not overwritten,
  3. the MCP config is copied.
- Structural pattern: the existing `describe('scaffold')` block in that file,
  which calls `scaffold(projectRoot)` into a fresh temp dir and asserts on
  the files that appear.
- Verification: `pnpm vitest run src/agents/__tests__/init.test.ts` → all pass.

## Done criteria

- [x] `templates/config/playwright.config.ts` exists and does not mention `dummy-test-app`
- [x] `templates/cursor/mcp.json` exists and matches `.cursor/mcp.json`
- [x] `scaffold()` copies `playwright.config.ts` and `.cursor/mcp.json`
- [x] `scaffold()` copies the gate docs into `specs/`
- [x] An existing `playwright.config.ts` is not overwritten
- [x] `package.json` `files` no longer lists `"playwright.config.ts"`
- [x] `npm pack --dry-run` shows `package/templates/config/playwright.config.ts`
- [x] `npm pack --dry-run` does NOT show `package/playwright.config.ts`
- [x] `pnpm test:unit` exits 0; at least 3 new tests
- [x] `pnpm typecheck` exits 0
- [x] `pnpm lint` and `pnpm format:check` exit 0
- [x] `pnpm build` exits 0
- [x] No files outside the in-scope list are modified (`git status`)
- [x] `plans/README.md` status row for 006 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The repo's `playwright.config.ts` no longer writes the JSON reporter to
  `.spectra/output/reports/results.json`. The catalogue declares that path
  as the Healer's input (`src/agents/catalogue.ts:45`); if it moved, report
  the new path instead of copying it.
- `PACKAGE_ROOT` is not importable from `src/agents/init.ts` without a cycle
  — it is exported by `src/utils/constants.ts`, which `init.ts` already
  imports from, so this should not happen. Report it if it does.
- `npm pack --dry-run` shows the tarball still contains
  `package/playwright.config.ts` after Step 5 — the `files` array edit did
  not take effect. Report the output.

## Maintenance notes

- The Playwright config template is now the only Playwright config the
  package offers. If the repo's own config grows a feature (a new reporter,
  a new browser), the template must grow it too — there is no test that
  compares them. Adding one is a good follow-up.
- The template deliberately has no `webServer` block: a user's app is
  started by the user, not by the config. If a future version wants one, it
  has to be opt-in and documented.
- `installTemplates` gives the gate docs the "keep the user's edit, refresh
  the rest" behaviour. That means a user who edits `specs/PLANNER-GATE.md`
  keeps their edit across `spectra --init` runs — and that the
  `specs/.templates.json` file exists in their project.

## Progress

- **2026-11-10 11:12 CET — Phase start (Batch mode).** Drift check showed
  only plan 002's `typecheck:test` script in `package.json`; the plan's
  quoted `init.ts` and `constants.ts` excerpts still match. Branch
  `advisor/006-scaffold-runnable-project` created from `main`.
- **2026-11-10 11:14 CET — Steps 1-2 done.** `templates/config/playwright.config.ts`
  created (the repo's config minus the `webServer` block);
  `templates/cursor/mcp.json` created (byte-identical to `.cursor/mcp.json`).
  `grep -n "dummy-test-app" templates/config/playwright.config.ts` → no
  output; `diff templates/cursor/mcp.json .cursor/mcp.json` → no output.
- **2026-11-10 11:14 CET — Steps 3-4 done.** `scaffold()` copies the
  Playwright config and the MCP config (copy-if-not-exists) and installs the
  gate docs into `specs/` with `installTemplates`.
- **2026-11-10 11:15 CET — Step 5 done.** `"playwright.config.ts"` removed
  from the package `files` array. `npm pack --dry-run` lists
  `package/templates/config/playwright.config.ts` and
  `package/templates/cursor/mcp.json`, and no `package/playwright.config.ts`.
- **2026-11-10 11:16 CET — Steps 6-8 done.** Four new tests in
  `describe('scaffold')`. `pnpm typecheck` 0, init tests 14 pass,
  `pnpm test:unit` → 12 files, 121 tests pass, `pnpm lint` and
  `pnpm format:check` 0, `pnpm build` 0. The README's `--init` section and
  project-structure block now list the new files.

## Surprises & Discoveries

- Copying the config into `templates/` left `shouldStartLocalWebServer()`
  behind with no caller — it exists only to decide whether to add the
  `webServer` block. It was removed from the template so a scaffolded
  project does not ship dead code (and does not trip a user's
  `noUnusedLocals`).
- The gate docs are installed with `installTemplates`, which writes
  `specs/.templates.json` — the same pattern `docs/` already uses, and the
  repo's `.gitignore` already ignores that file name.

## Decision Log

- **Batch mode.** LOW risk, explicit criteria, and every step has a
  runnable check.
- **The unused `shouldStartLocalWebServer()` helper was removed from the
  template** — the plan's "copy with one change" rule creates it, and it
  would ship into every scaffolded project.
- **The plan file stays in `plans/`** — later plans reference these files by
  path, and the repo has no archive convention.

## Outcomes & Retrospective

- **Result: completed.** `spectra --init` now produces a project the
  pipeline can finish: a Playwright config, the Playwright MCP config, and
  the gate documentation in `specs/`.
- **Verification summary:** `pnpm typecheck` 0, `pnpm test:unit` 12 files /
  121 tests, lint 0, format 0, `pnpm build` 0, `npm pack --dry-run` shows
  the two new templates and no root config, and the template typechecks on
  its own (`tsc --strict --types node` → exit 0).
- **Approved deviations:** the unused helper removed from the template; a
  fourth test for the gate-docs copy (the plan's done criteria require that
  behaviour but its test list had only three cases).
- **Follow-ups:** the template still assumes the user's project has
  `@types/node` and `@playwright/test` — the same assumption the repo's own
  config makes.
