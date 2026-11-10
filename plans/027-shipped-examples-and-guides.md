# Plan 027: A scaffolded project gets the examples the guides tell it to run

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 660399d..HEAD -- src/agents/init.ts src/agents/__tests__/init.test.ts templates/ docs/ README.md src/utils/cli.ts src/cli.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `660399d`, 2026-11-10

## Why this matters

Three shipped guides tell a user to run a command that fails on a fresh
install, because the file the command names does not exist in their
project:

- `docs/BATCH-CONFIG.md:121`, `docs/QUICK-REFERENCE.md:57` and
  `docs/WALKTHROUGH.md:224` all say `npx spectra --batch scopes-batch.json`.
  The example file lives at the root of *this* repository; it is not in the
  package's `files` list and `--init` does not copy it, so the CLI answers
  "Batch file not found".
- The same three documents describe a project layout that omits
  `.cursor/mcp.json` — a file `--init` now creates and the run needs — and
  the README's navigation links to a "Documentation" section that does not
  exist.

Two more small inaccuracies live in the same files: the guides promise a
folder name (`1-Login Form`) that the CLI actually slugifies
(`1-login-form`), and `docs/WALKTHROUGH.md:92-98` shows a test that
instantiates a Page Object by hand — the exact pattern the Generator
template forbids ("**AVOID**: Manual instantiation") and the gate rejects.

## Current state

- `scopes-batch.json` — the example at the root of this repository.
  `package.json:17-25` — `"files": ["dist", "!dist/**/__tests__",
  "templates", "specs", "docs", "LICENSE", "README.md"]`: the file is not
  published. `src/agents/init.ts:57-103` — `scaffold()` does not copy it.
- `src/cli.ts:114-116` — the error a user gets: `Batch file not found:
  ${batchPath}`.
- `src/cli.ts:149-151` — the folder name: `const label = scopeDef.name ??
  \`Scope ${i + 1}\`; const folder = \`${i + 1}-${slugify(label)}\`;` and
  `slugify()` (`:66-72`) lowercases the label and replaces every run of
  non-alphanumeric characters with `-`.
- `src/agents/init.ts:66-70` — the scaffold copies **only**
  `templates/docs/` into the project's `docs/` (the scope template). The
  three guides in `docs/` (`BATCH-CONFIG.md`, `QUICK-REFERENCE.md`,
  `WALKTHROUGH.md`) ship in the npm tarball but are never installed into a
  project.
- `docs/WALKTHROUGH.md:92-98` — the sample test:
  ```typescript
  const loginPage = new LoginPage(page);
  ```
  against `templates/agents/generator/AGENT.md:96-107` ("**AVOID**: Manual
  instantiation (only if no fixture exists)") and
  `specs/GENERATOR-GATE.md:44` ("Imports use the fixtures pattern").
- `docs/QUICK-REFERENCE.md:117-148` and `docs/WALKTHROUGH.md:371-414` —
  the two project trees, neither of which lists `.cursor/mcp.json`.
- `docs/BATCH-CONFIG.md:143` and `:151`, `README.md:471` — the folder name
  is written as `<number>-<name>` with no mention of the slug rule.
- `docs/QUICK-REFERENCE.md:129` and `docs/WALKTHROUGH.md:384` — "`specs/` #
  **Pipeline** gate docs & Markdown plans"; `specs/PILOT.md:3` and `:110` —
  "the full **pipeline**", "Fix **pipeline** issues"; `specs/PILOT.md:22` —
  "Link PR, **spec file**, and test files". `CONTEXT.md:7-9` forbids
  "pipeline" for the Spectrum, and `CONTEXT.md:47-49` forbids "test plan"
  and "spec" for the Plan.

**Repo conventions to match**: 2-space indent, single quotes, 100-column
width, trailing commas (Biome). The scaffold's copy style: copy-if-not-exists
for files the user owns (`templates/fixtures/pages.ts`,
`templates/config/playwright.config.ts`, `templates/cursor/mcp.json`),
`installTemplates` for files the user may edit (`templates/agents/`,
`templates/docs/`, `PACKAGE_ROOT/specs/`). The vocabulary is fixed by
`CONTEXT.md`: *Spectrum* (not "pipeline"), *Plan* (not "test plan" or
"spec"), *Scope*, *Batch*, *Scope results*.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `pnpm install` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Unit tests | `pnpm test:unit` | 12 files, 129 tests pass |
| One test file | `pnpm vitest run src/agents/__tests__/init.test.ts` | all pass |
| Lint + format + assists | `pnpm check` | exit 0, 56 files |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `templates/scopes-batch.json` (create — a copy of the repository's example)
- `src/agents/init.ts`
- `src/agents/__tests__/init.test.ts`
- `docs/BATCH-CONFIG.md`, `docs/QUICK-REFERENCE.md`, `docs/WALKTHROUGH.md`
- `specs/PILOT.md`
- `README.md` (the batch example section only)

**Out of scope** (do NOT touch, even though they look related):
- `scopes-batch.json` at the repository root — the repository keeps its own
  example; the template is a copy for consumers.
- `src/utils/batch.ts` — the parser is correct and is not the problem.
- `docs/SCOPE-template.md`, `templates/docs/SCOPE-template.md` — another
  plan owns the scope-file template.
- `specs/README.md`, `specs/PLANNER-GATE.md`, `specs/GENERATOR-GATE.md`,
  `specs/CI-HEALER-POLICY.md` — not this plan's business.
- `src/cli.ts` — the slug rule is the CLI's behaviour; this plan documents
  it, it does not change it.

## Git workflow

- Branch: `advisor/027-shipped-examples-and-guides`
- Commit style: conventional commits — e.g. `docs: give a scaffolded project
  the examples its guides tell it to run`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Ship the batch example as a template

Copy the repository's `scopes-batch.json` to `templates/scopes-batch.json`.
Read the root file first and keep the copy byte-identical — it must parse
with the same parser (`src/utils/batch.ts`).

**Verify**: `diff scopes-batch.json templates/scopes-batch.json` → no
output.

### Step 2: Scaffold the example and the guides

In `src/agents/init.ts`, inside `scaffold()`:

```typescript
  // Copy the batch example if not present: the guides tell the user to run it.
  const batchSource = path.join(TEMPLATE_DIR, 'scopes-batch.json');
  const batchDest = path.join(projectRoot, 'scopes-batch.json');
  if (fs.existsSync(batchSource) && !fs.existsSync(batchDest)) {
    fs.copyFileSync(batchSource, batchDest);
  }
```

and, next to the existing `installTemplates(PACKAGE_ROOT/specs → specs)` and
`installTemplates(templates/docs → docs)` blocks, install the three guides
so a scaffolded project has them:

```typescript
  // Copy the guides into docs/ so the user has them next to the project
  const guidesSource = path.join(PACKAGE_ROOT, 'docs');
  const guidesDest = path.join(projectRoot, 'docs');
  if (fs.existsSync(guidesSource)) {
    installTemplates(guidesSource, guidesDest);
  }
```

`installTemplates` keeps a file the user edited and refreshes the rest —
the right behaviour for a guide. It also writes `docs/.templates.json`,
which the repository's own `.gitignore` already ignores.

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Point the guides at the scaffolded files

In `docs/BATCH-CONFIG.md:117-125`, `docs/QUICK-REFERENCE.md:57` and
`docs/WALKTHROUGH.md:224`, add one sentence before the batch command:

```markdown
`spectra --init` writes an example `scopes-batch.json` into your project.
```

In the same three documents, add `.cursor/mcp.json` to the project tree
(the file `--init` creates), and in `docs/QUICK-REFERENCE.md` and
`docs/WALKTHROUGH.md` state the slug rule where the folder name appears:

```markdown
The folder is `<number>-<slug>`: the Scope's name, lowercased, with every
run of non-alphanumeric characters replaced by `-` — a Scope named
"Login Form" is kept in `1-login-form/`.
```

**Verify**: `grep -rn "scopes-batch.json" docs/` → every hit has the
sentence above within two lines.

### Step 4: Fix the walkthrough's sample test

In `docs/WALKTHROUGH.md:92-98`, replace the hand-instantiated Page Object
with the fixtures pattern the template mandates:

```typescript
import { test, expect } from '../fixtures/pages.js';

test('signs in with valid credentials', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.emailInput.fill('demo@example.com');
  await loginPage.passwordInput.fill('password123');
  await loginPage.loginSubmit.click();
  await expect(loginPage.heading).toBeVisible();
});
```

**Verify**: `grep -n "new LoginPage(page)" docs/WALKTHROUGH.md` → no output.

### Step 5: Use the domain vocabulary in the guides

In `docs/QUICK-REFERENCE.md:129`, `docs/WALKTHROUGH.md:384`,
`specs/PILOT.md:3`, `:22` and `:110`, replace the forbidden words:

| Current | Replace with |
|---------|--------------|
| "**Pipeline** gate docs" | "**Spectrum** gate docs" |
| "validate the full **pipeline** end-to-end" | "validate the full **Spectrum** end-to-end" |
| "Fix **pipeline** issues" | "Fix **Spectrum** issues" |
| "Link PR, **spec file**, and test files" | "Link PR, **Plan**, and test files" |

Do not rename the `specs/` directory or any file path.

**Verify**: `grep -rn "pipeline" docs/ specs/ README.md` → no output
outside code blocks that quote a command.

### Step 6: Point the README's batch example at the scaffolded file

In `README.md:403-452`, the batch section says "Create
`scopes-batch.json`:" and shows the JSON. Change it to:

```markdown
`spectra --init` writes an example `scopes-batch.json` into your project.
Edit it, or write your own:
```

and keep the JSON block.

**Verify**: `grep -n "spectra --init. writes an example" README.md` → one
hit.

### Step 7: Test the two new scaffold copies

In `src/agents/__tests__/init.test.ts`, inside `describe('scaffold')`, add
two cases, modelled on the existing Playwright-config cases:

1. `copies the batch example when the project has none` — assert
   `fs.existsSync(path.join(projectRoot, 'scopes-batch.json'))` is `true`.
2. `does not overwrite an existing batch example` — write the file with the
   content `mine` first, then assert it still reads `mine`.

`setupTemplates()` in that test file builds the fake template tree — extend
it to create `templates/scopes-batch.json` (for example with `{"scopes":[]}`).

The guides copy needs no new test: `installTemplates` is already covered by
the existing doc-template cases.

**Verify**: `pnpm vitest run src/agents/__tests__/init.test.ts` → all pass.

### Step 8: Run everything

**Verify**: `pnpm check && pnpm typecheck && pnpm test:unit && pnpm build`
→ all exit 0; unit tests report 12 files and 133 tests (129 + 4 new: the
two above plus the two added by plans 014 and 016, if those have landed).

**Verify**: `npm pack --dry-run` lists
`package/templates/scopes-batch.json`.

**Verify**: `pnpm exec playwright test --list` → `Total: 18 tests in 12
files`.

## Test plan

- New tests in `src/agents/__tests__/init.test.ts`, in `describe('scaffold')`:
  1. a batch example is copied when the project has none,
  2. an existing batch example is not overwritten.
- Structural pattern: the existing Playwright-config and MCP-config cases
  in the same block.
- Verification: `pnpm vitest run src/agents/__tests__/init.test.ts` → all
  pass.

## Done criteria

- [ ] `templates/scopes-batch.json` exists and is identical to the
      repository's example
- [ ] `--init` writes `scopes-batch.json` and the three guides into the
      project
- [ ] The three guides say where the example comes from, list
      `.cursor/mcp.json` in the project tree, and state the folder slug rule
- [ ] `docs/WALKTHROUGH.md` no longer instantiates a Page Object by hand
- [ ] "pipeline" and "spec file" are gone from the guides and
      `specs/PILOT.md` (outside quoted commands)
- [ ] The README's batch section points at the scaffolded example
- [ ] `pnpm vitest run src/agents/__tests__/init.test.ts` passes
- [ ] `pnpm test:unit` exits 0
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm build` exits 0
- [ ] `npm pack --dry-run` lists `package/templates/scopes-batch.json`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 027 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `scopes-batch.json` at the repository root no longer parses with
  `src/utils/batch.ts` — copy the live file, and report if it does not
  parse.
- `src/agents/init.ts` no longer installs `PACKAGE_ROOT/specs` with
  `installTemplates` — follow the live style for the guides.
- The `docs/` directory contains a file that must not be installed into a
  user's project (an internal note) — report it instead of copying the
  whole directory.

## Maintenance notes

- The guides are installed with `installTemplates`, so a user who edits one
  keeps their edit; the repository's own `docs/.templates.json` marker file
  is what records that.
- The batch example is a copy, not a link: a user who edits it changes
  their project only. When the example changes here, existing projects keep
  theirs — the same trade-off ADR 0001 records for the agent templates.
- Reviewers should check the vocabulary: `Spectrum`, `Plan`, `Scope`,
  `Batch` — the forbidden synonyms are in `CONTEXT.md` and they creep back
  into prose faster than into code.
