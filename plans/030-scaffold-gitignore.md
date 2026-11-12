# Plan 030: `--init` adds the ignore rules a Spectra project needs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. This
> plan adds one constant, one function and one test group. If a STOP condition
> occurs, stop and report.
>
> **Planned at**: commit `98a6d24`, 2026-11-12. Drift check (run first):
> `git diff --stat 98a6d24..HEAD -- src/utils/layout.ts src/agents/init.ts src/agents/__tests__/init.test.ts`

## Why this matters

`spectra --init` creates the output tree and then runs Agents in it. The
output contains `.spectra/output/<agent>.log` (everything the agent printed
while exploring the user's app), Playwright traces and screenshots, the
Healing Report, and two template manifests (`docs/.templates.json`,
`specs/.templates.json`). None of it is ignored in the user's project: the
repository's own `.gitignore:9-14` ignores `.spectra/output/`,
`.spectra/agents/` and `docs/.templates.json`, but that file belongs to this
repository — `--init` copies no ignore rules at all
(`src/agents/init.ts:57-110`).

A user who follows the Quick Start, runs Spectra, and commits gets agent logs
and run artefacts in their history. That is a data-leak surface as much as a
repo-hygiene one: the log is a transcript of the app the agent explored.

## Current state

`src/agents/init.ts:57-110` — `scaffold()` creates `PROJECT_DIRS`, installs
the agent templates, copies the docs and the gate docs into `specs/`, then
calls `copyIfMissing` five times (fixture, config, two MCP configs, seed spec,
CI workflow). It never writes `.gitignore`.

`src/utils/layout.ts:16-25` — the folder list:

```ts
/** The folders of a Spectra project, relative to the project root. */
export const PROJECT_DIRS = [
  'tests',
  'specs',
  'pages',
  'fixtures',
  ...AGENTS.map((agent) => `.spectra/agents/${agent.name}`),
  `.spectra/agents/${path.dirname(SCOPE_CONTEXT)}`,
  ...OUTPUT_DIRS.map((dir) => `.spectra/output/${dir}`),
];
```

`.gitignore:8-20` of this repository — the rules a scaffolded project is
missing:

```text
.spectra/output/
.spectra/agents/
docs/.templates.json
test-results/
playwright-report/
```

`src/agents/__tests__/init.test.ts:14-19` mocks `TEMPLATE_DIR` and
`PACKAGE_ROOT` with `vi.mock('../../utils/constants.js')`; `scaffold()` is
tested by creating a project dir, calling `scaffold(projectRoot)` and
asserting files exist (`:300-386` has `copies the mcp config`,
`does not overwrite an existing seed spec`, and similar).

**Repo conventions**: Node built-ins only, no new dependency. 2 spaces, single
quotes, 100 columns, trailing commas (Biome). Comments explain why.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Lint, format, assists | `pnpm check` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Typecheck tests | `pnpm typecheck:test` | exit 0 |
| Unit tests | `pnpm test:unit` | 14 files, 180 tests (plus the new ones) pass |

## Scope

**In scope**:
- `src/utils/layout.ts` — one exported constant.
- `src/agents/init.ts` — one function, one call in `scaffold()`.
- `src/agents/__tests__/init.test.ts` — new tests.

**Out of scope**:
- `templates/` — do not add a `templates/.gitignore`: npm strips `.gitignore`
  from published tarballs, which is exactly the trap this plan avoids.
- `.gitignore` (this repository's) — already correct.
- `README.md`, `docs/` — the behaviour needs no documentation; the file is
  self-explanatory when the user opens it.

## Git workflow

- Branch: `advisor/030-scaffold-gitignore`
- Commit style: `feat: scaffold the ignore rules a Spectra run needs`
- Do not push or open a PR unless the operator asked for it.

## Steps

### Step 1: Add the list of paths a run must not commit

In `src/utils/layout.ts`, after `PROJECT_DIRS`, add:

```ts
/**
 * Paths a scaffolded project must not commit: the agent logs and run
 * artefacts, the installed templates (reinstalled on every run), and the two
 * manifests that remember which template each copied file came from.
 */
export const PROJECT_IGNORES = [
  '.spectra/output/',
  '.spectra/agents/',
  'test-results/',
  'playwright-report/',
  'docs/.templates.json',
  'specs/.templates.json',
];
```

**Verify**: `grep -n "PROJECT_IGNORES" src/utils/layout.ts` → one hit.

### Step 2: Append the missing lines in `scaffold()`

In `src/agents/init.ts`, import `PROJECT_IGNORES` from `../utils/layout.js`
(the file already imports `PROJECT_DIRS` there). Add this function next to
`copyIfMissing`:

```ts
/**
 * Add the ignore rules a Spectra project needs. A `.gitignore` the user
 * already has is kept: only the missing lines are appended, once.
 */
function ensureGitignore(projectRoot: string): void {
  const file = path.join(projectRoot, '.gitignore');
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
  const ignored = new Set(current.split(/\r?\n/).map((line) => line.trim()));
  const missing = PROJECT_IGNORES.filter((entry) => !ignored.has(entry));
  if (missing.length === 0) return;

  const separator = current.length === 0 ? '' : current.endsWith('\n') ? '\n' : '\n\n';
  const block = `# Spectra\n${missing.join('\n')}\n`;
  fs.writeFileSync(file, `${current}${separator}${block}`, 'utf-8');
}
```

Call it at the end of `scaffold()`, after the CI workflow `copyIfMissing` and
before `logger.success('Project scaffolded successfully.')`:

```ts
  // The run's own output is not source: keep it out of the user's history.
  ensureGitignore(projectRoot);
```

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Test it

In `src/agents/__tests__/init.test.ts`, add three tests to the
`describe('scaffold', ...)` block (find the block that contains
`copies the mcp config`; keep its existing style — `makeTmpDir()`,
`tmpDirs.push(projectRoot)`, `scaffold(projectRoot)`). Import
`PROJECT_IGNORES` from `../../utils/layout.js` in the existing import block.

```ts
  it('ignores the output a run leaves behind', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    scaffold(projectRoot);

    const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf-8');
    for (const entry of PROJECT_IGNORES) expect(gitignore).toContain(entry);
  });

  it('keeps the ignore rules the project already had', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);
    const file = path.join(projectRoot, '.gitignore');
    fs.writeFileSync(file, 'node_modules/\n.env\n', 'utf-8');

    scaffold(projectRoot);

    const gitignore = fs.readFileSync(file, 'utf-8');
    expect(gitignore).toContain('node_modules/');
    expect(gitignore).toContain('.env\n');
    expect(gitignore).toContain('.spectra/output/');
  });

  it('adds each ignore rule once, however often the project is scaffolded', () => {
    const projectRoot = makeTmpDir();
    tmpDirs.push(projectRoot);

    scaffold(projectRoot);
    const once = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf-8');
    scaffold(projectRoot);

    expect(fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf-8')).toBe(once);
  });
```

**Verify**: `pnpm test:unit -- src/agents/__tests__/init.test.ts` → all tests
pass, including the three new ones.

### Step 4: Run the full gate

**Verify**: `pnpm check && pnpm typecheck && pnpm typecheck:test &&
pnpm test:unit` → all exit 0.

## Test plan

The three tests above are the test plan:
- creation when the project has no `.gitignore`,
- additive behaviour when the user has one (the common case — the fix must not
  clobber it),
- idempotence across a second `scaffold()` (`--mcp` and every run call it).

## Done criteria

- A fresh `scaffold()` produces `.gitignore` containing every `PROJECT_IGNORES`
  entry.
- A pre-existing `.gitignore` keeps its content and gains only the missing
  lines.
- A second `scaffold()` leaves the file byte-identical.
- `pnpm check && pnpm typecheck && pnpm typecheck:test && pnpm test:unit` pass.

## STOP conditions

- If `src/utils/layout.ts` already exports `PROJECT_IGNORES`, stop and report.
- If `init.test.ts` no longer mocks `../utils/constants.js`, adjust the test
  setup to the file you find rather than copying the excerpt blindly; if that
  is unclear, stop.
- If a reviewer asks for a shipped `templates/.gitignore`, stop: npm drops
  `.gitignore` from tarballs, so the file would never reach a consumer.

## Maintenance note

`PROJECT_IGNORES` is now the one place that says what a Spectra run produces
outside version control. If a new artefact folder is added to
`OUTPUT_DIRS`/`PROJECT_DIRS`, check whether it needs a line here too — and
remember `.spectra/output/` already covers every artefact under it.
