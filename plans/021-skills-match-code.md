# Plan 021: The repo's own agent-workflow skills describe the code that exists

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 660399d..HEAD -- .agents/skills/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `660399d`, 2026-11-10

## Why this matters

`.agents/skills/**` is this repository's own documentation for agents: each
`SKILL.md` tells an agent that has never seen the repo how to work in it.
Six of them now describe code that does not exist. An agent that follows
the linting skill skips `pnpm run check` on a test it just wrote (the skill
says `tests/` and `templates/` are not linted — they are). An agent that
follows the architecture skill looks for a `buildPrompt(agent, instruction,
completionPath, agentsDir)` function and an `AgentRunOptions` interface
that were replaced by `RunContext`. An agent that copies the unit-testing
skill's logger mock gets `TypeError: logger.debug is not a function` on
every call to `run()`. An agent that follows the CI skill adds a "start the
app" step back into the workflow — the exact bug this repo's plan 001
removed two weeks ago.

These files are read by agents on every task in this repository, so their
drift is not cosmetic: it is an instruction to break things.

## Current state

- `.agents/skills/linting-formatting/SKILL.md:40-48` — "Biome only scans
  these files: `src/**`, `biome.json`, `vitest.config.ts`,
  `playwright.config.ts`, `tsconfig.json`, `tsconfig.test.json`" and "Files
  outside these patterns (e.g., `templates/`, `docs/`, `tests/`) are **not**
  linted or formatted by Biome."
  `biome.json:10-21` — the real scope: `src/**`, `tests/**`, `pages/**`,
  `fixtures/**`, `templates/**` plus the five root config files.
- `.agents/skills/architecture/SKILL.md:73-75` — "`buildPrompt(agent,
  instruction, completionPath, agentsDir)`", "`runAgent(options, agentsDir,
  debug?)`", "`AgentRunOptions` interface: `name`, `color`, `emoji`,
  `prompt`, `mode`, `outputDir`, `completionPath`".
  `src/agents/runner.ts:9-16` and `:110` and `:134` — the real API:
  ```typescript
  export interface RunContext {
    mode: CliMode;
    outputDir: string;
    agentsDir: string;
    debug: boolean;
  }
  export function buildPrompt(agent: Agent, ctx: RunContext): string
  export async function runAgent(agent: Agent, ctx: RunContext): Promise<void>
  ```
  Every path in the prompt comes from the Agent catalogue entry, not from a
  parameter.
- `.agents/skills/unit-testing/SKILL.md:41-52` — the logger mock lists
  `info`, `success`, `error`, `warn`, `plain`, `cyan`, `banner`,
  `separator` — and not `debug` or `prompt`, which
  `src/utils/logger.ts` also has and which `src/cli.ts:212` calls on every
  run. The repo's own mock (`src/__tests__/cli.test.ts:25-38`) has them.
- `.agents/skills/unit-testing/SKILL.md:16-25` — the test-file table lists
  eight of the twelve files under `src/**/__tests__/`; missing:
  `src/__tests__/index.test.ts`, `src/agents/__tests__/catalogue.test.ts`,
  `src/utils/__tests__/batch.test.ts`, `src/utils/__tests__/layout.test.ts`.
- `.agents/skills/ci-workflow/SKILL.md:22-23` — step 8 "Start app |
  `pnpm dev &` (in `dummy-test-app/`)" and step 9 "Wait for app | `curl`
  health check, 30s timeout". `.github/workflows/test.yml` has no such
  steps: the app is started by the `webServer` block in
  `playwright.config.ts:61-70`.
- `.agents/skills/e2e-testing/SKILL.md:105` — "you may need
  `SPECTRA_AUTH_USER` and `SPECTRA_AUTH_PASS`". Neither name exists
  anywhere in `src/`, `templates/`, `playwright.config.ts` or the workflows.
- `.agents/skills/dev-setup/SKILL.md:46` — "`SPECTRA_URL` - target app URL
  (default: `http://localhost:5173`)". `src/cli.ts:196-201` has no default:
  without `--url` or `SPECTRA_URL` the run fails with "Error: URL required.
  Use --url or set SPECTRA_URL". The Playwright *config* does default its
  `baseURL` (`playwright.config.ts:3`) — two different things.
- `.agents/skills/architecture/SKILL.md:96-105` — the file map lists the
  agent templates, `templates/docs/` and `templates/fixtures/pages.ts`, but
  not `src/agents/catalogue.ts` (the module that owns every path, per ADR
  0001), `src/utils/layout.ts`, `src/utils/batch.ts`, nor the two templates
  the scaffold now installs: `templates/config/playwright.config.ts` and
  `templates/cursor/mcp.json`.

**Repo conventions to match**: the skill files use ATX headings, tables with
a header row and `|---|---|`, and fenced code blocks with a language. They
are written for an agent that has never seen the repo, so every path in
them must be real. The vocabulary is fixed by `CONTEXT.md`: the *Agent
catalogue* is the one description of every Agent; a *Scope* is what a run
is pointed at.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Unit tests | `pnpm test:unit` | 12 files, 129 tests pass |
| Lint + format + assists | `pnpm check` | exit 0, 56 files |

## Scope

**In scope** (the only files you should modify):
- `.agents/skills/linting-formatting/SKILL.md`
- `.agents/skills/architecture/SKILL.md`
- `.agents/skills/unit-testing/SKILL.md`
- `.agents/skills/ci-workflow/SKILL.md`
- `.agents/skills/e2e-testing/SKILL.md`
- `.agents/skills/dev-setup/SKILL.md`

**Out of scope** (do NOT touch, even though they look related):
- `src/**` — the code is right; the skills describe it wrongly.
- `biome.json` — the scope is correct.
- `.github/workflows/**`, `playwright.config.ts` — both are correct.
- The other two skill files (`architecture` is in scope, `dev-setup` is in
  scope; `e2e-testing`, `linting-formatting`, `unit-testing`,
  `ci-workflow` are in scope) — `.agents/skills/testing-spectra-cli/SKILL.md`
  and the rest stay as they are.

## Git workflow

- Branch: `advisor/021-skills-match-code`
- Commit style: conventional commits — e.g. `docs: make the agent skills
  match the code`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fix the Biome scope in the linting skill

In `.agents/skills/linting-formatting/SKILL.md`, replace the file-scope
list with the real one and point at the source of truth instead of
duplicating it forever:

```markdown
### File Scope

Biome's scope is defined by `files.includes` in `biome.json` — read it
rather than trusting this list. It currently covers `src/**`, `tests/**`,
`pages/**`, `fixtures/**`, `templates/**` and the root config files
(`biome.json`, `vitest.config.ts`, `playwright.config.ts`, `tsconfig.json`,
`tsconfig.test.json`).

`pnpm check` covers all of them: lint, format and the assists. A file
outside that list is not checked — if you add one, add it to `biome.json`
too.
```

**Verify**: `grep -n "files.includes" .agents/skills/linting-formatting/SKILL.md`
→ one hit.

### Step 2: Fix the runner API in the architecture skill

In `.agents/skills/architecture/SKILL.md`, replace the `src/agents/runner.ts`
bullets with the real signatures:

```markdown
### `src/agents/runner.ts`
- `buildPrompt(agent, ctx)` - assembles the prompt string
- `runAgent(agent, ctx)` - async; dispatches to the mode's CLI and resolves
  when the agent is done
- `RunContext` interface: `mode`, `outputDir`, `agentsDir`, `debug`
- Every path in the prompt comes from the Agent catalogue entry - the
  prompt never names a path itself
```

**Verify**: `grep -n "AgentRunOptions\|completionPath" .agents/skills/architecture/SKILL.md`
→ no output.

### Step 3: Complete the architecture skill's file map

In the same file's module and template lists, add:

```markdown
### `src/agents/catalogue.ts`
- The one description of every Agent: name, colour, emoji, inputs, outputs,
  project outputs and completion signal
- Every path the CLI hands an Agent comes from here
- `src/agents/__tests__/catalogue.test.ts` fails when a shipped `AGENT.md`
  or `shared/context.md` disagrees with it - run it after any change under
  `templates/agents/**` or to the catalogue

### `src/utils/layout.ts`
- `PROJECT_DIRS` - the folders a scaffolded project gets
- `OUTPUT_DIRS` - the folders a run writes into

### `src/utils/batch.ts`
- Parses a Batch file into Scope definitions
```

and under the templates list:

```markdown
- `templates/config/playwright.config.ts` - the Playwright config a
  scaffolded project gets (no `webServer` block: the user's app is started
  by the user)
- `templates/cursor/mcp.json` - the Playwright MCP config
```

**Verify**: `grep -n "templates/config/playwright.config.ts" .agents/skills/architecture/SKILL.md`
→ one hit.

### Step 4: Fix the logger mock and the test list in the unit-testing skill

In `.agents/skills/unit-testing/SKILL.md`, add the two missing methods to
the mock:

```typescript
  vi.mock('../utils/logger.js', () => ({
    logger: {
      info: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      plain: vi.fn(),
      cyan: vi.fn(),
      banner: vi.fn(),
      separator: vi.fn(),
      debug: vi.fn(),
      prompt: vi.fn(),
    },
  }));
```

and add the four missing test files to the table, each with one line:

```markdown
| `src/__tests__/index.test.ts` | The package's public exports |
| `src/agents/__tests__/catalogue.test.ts` | The shipped templates against the Agent catalogue - run it after any change under `templates/agents/**` |
| `src/utils/__tests__/batch.test.ts` | The Batch file parser |
| `src/utils/__tests__/layout.test.ts` | The project and output folder lists |
```

**Verify**: `grep -n "debug: vi.fn()" .agents/skills/unit-testing/SKILL.md`
→ one hit; `grep -c "catalogue.test.ts" .agents/skills/unit-testing/SKILL.md`
→ 1 or more.

### Step 5: Fix the CI skill's step table

In `.agents/skills/ci-workflow/SKILL.md`, delete the two rows for the app
start and the wait, renumber the rows that follow, and add one note under
the table:

```markdown
| 8. Run E2E tests | `pnpm test` | Playwright - it starts the dummy app itself through the `webServer` block in `playwright.config.ts` |
```

Note: the app is **not** started by a workflow step. The `webServer` block
in `playwright.config.ts` starts it and waits for
`http://localhost:5173`; with `CI=true` it refuses to reuse a server that
is already running.
```

**Verify**: `grep -n "Start app\|Wait for app" .agents/skills/ci-workflow/SKILL.md`
→ no output.

### Step 6: Fix the invented environment variables

In `.agents/skills/e2e-testing/SKILL.md:105`, delete the sentence about
`SPECTRA_AUTH_USER` / `SPECTRA_AUTH_PASS` and replace it with:

```markdown
None required for basic E2E testing against the dummy-test-app. Against an
authenticated application, add your own authentication state — the package
reads no authentication environment variables.
```

In `.agents/skills/dev-setup/SKILL.md:46`, replace the `SPECTRA_URL` line
with:

```markdown
- `SPECTRA_URL` - target app URL. The CLI requires it (`--url` or this
  variable); the Playwright config defaults its `baseURL` to
  `http://localhost:5173` for the tests themselves.
```

**Verify**: `grep -rn "SPECTRA_AUTH" .agents/` → no output.

### Step 7: Run the checks

**Verify**: `pnpm check && pnpm typecheck && pnpm test:unit` → all exit 0;
12 files and 129 tests pass.

## Test plan

No new unit test: this plan changes six Markdown files. The acceptance
check is mechanical — each grep above must return what it says, and the
files must not name a symbol that does not exist.

A quick manual check for the logger mock: copy the mock from the
unit-testing skill into a scratch test that calls `run({})` and confirm it
does not throw `logger.debug is not a function`. Delete the scratch file
afterwards.

## Done criteria

- [ ] The linting skill states Biome's real scope and points at
      `biome.json`
- [ ] The architecture skill documents `buildPrompt(agent, ctx)`,
      `runAgent(agent, ctx)` and `RunContext`
- [ ] The architecture skill's file map includes the catalogue, layout, batch
      parser and the two new templates
- [ ] The unit-testing skill's logger mock includes `debug` and `prompt`
- [ ] The unit-testing skill's test table lists all twelve test files
- [ ] The CI skill no longer documents an app-start or app-wait step
- [ ] `grep -rn "SPECTRA_AUTH" .agents/` returns nothing
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test:unit` exits 0; 129 tests pass
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 021 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `src/agents/runner.ts` no longer exports `buildPrompt` and `runAgent`
  with a `RunContext` — re-check the drift and follow the live code.
- `biome.json`'s `files.includes` differs from the list in Step 1 — copy
  the live list instead.
- The unit-testing skill's logger mock has already been fixed — skip that
  part and report it.

## Maintenance notes

- These files are read by agents on every task in this repository, so a
  change to `src/` should be checked against them. The cheapest guard is
  to prefer pointing at the code ("read `biome.json`") over copying it.
- The skills are the repository's own docs; they are not shipped in the npm
  package (`package.json` `files` lists `templates`, `specs`, `docs`), so
  a change here does not affect consumers.
- Reviewers should look for the word "not linted" or "not checked" in the
  skills — those claims are the ones that go stale.
