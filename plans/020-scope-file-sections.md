# Plan 020: The scope file's page and exclusions reach the agents

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 660399d..HEAD -- src/utils/scope.ts src/utils/__tests__/scope.test.ts docs/SCOPE-template.md templates/docs/SCOPE-template.md templates/agents/planner/AGENT.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `660399d`, 2026-11-10

## Why this matters

The scope file template asks the user for two things the runtime never
reads:

- `## Location` → `**Page URL**: /path`. `createScopeContext()` only ever
  writes the page from the CLI's `--page` option, so a user who fills the
  field in and runs `spectra -u URL -f SCOPE.md` gets a whole-application
  run while their file says otherwise.
- `## Out of Scope` → "DO NOT test these (even if on same page)". The whole
  file is pasted verbatim under `## Detailed Requirements`, and the Planner
  template asks for "Elements to ignore" — a section the CLI never writes.

So the two most specific instructions a user can give are the two that get
lost, and the Planner is told to look for a section that does not exist.
This is a behaviour change, not a doc change: the scope file has to become
a real input.

## Current state

- `src/utils/scope.ts:26-58` — `createScopeContext()`:
  ```typescript
  export interface Scope {
    url: string;
    page?: string;
    /** The single feature to test. */
    scope?: string;
    /** Path of a file with detailed requirements. */
    file?: string;
  }

  export function createScopeContext(outputPath: string, scope: Scope): void {
    ...
    const lines: string[] = ['# Current Spectra Scope', '', '## Target', `- **URL**: ${scope.url}`];

    if (scope.page) {
      lines.push(`- **Page**: ${scope.page}`);
      lines.push(`- **Full URL**: ${fullUrl(scope.url, scope.page)}`);
    }
    ...
    if (scope.scope) {
      lines.push('## Feature Focus');
      ...
    }

    if (scope.file && fs.existsSync(scope.file)) {
      const content = fs.readFileSync(scope.file, 'utf-8');
      lines.push('## Detailed Requirements');
      lines.push(content);
      lines.push('');
    }

    lines.push('## Instructions');
    lines.push('- If a specific page is given, navigate there directly');
    lines.push('- If a feature scope is given, test ONLY that feature');
    lines.push('- Ignore unrelated elements on the same page');
    ...
  }
  ```
  Note: the file's text is pasted as one block; nothing inside it is
  parsed.
- `docs/SCOPE-template.md` (and its byte-identical copy
  `templates/docs/SCOPE-template.md`) — the sections: `## Target Feature`,
  `## Location` with `**Page URL**: /path`, `## Test Focus`, `## Elements to
  Test`, `## User Flows`, `## Out of Scope` ("DO NOT test these (even if on
  same page)"), `## Test Data`.
- `templates/agents/planner/AGENT.md:22-26` — the Planner's first step:
  "Check `.spectra/agents/shared/current-scope.md` for any constraints: -
  Specific page to focus on - Specific feature to test - **Elements to
  ignore**".
- `src/utils/__tests__/scope.test.ts` — nine existing cases ("creates
  output file with URL-only options", "includes page and full URL when page
  is provided", "includes feature focus section when scope is provided",
  "includes scope file content when scopeFile exists", "skips scope file
  section when scopeFile does not exist", "includes all sections when all
  options are provided", …).

**The behaviour this plan adds** (two rules, in this precedence):

1. **Page**: `--page` wins; if the CLI gave no page and the scope file has a
   `**Page URL**: /path` line, that path is the page. The CLI's flag
   precedence for a batch is the same shape (`options.page ?? scopeDef.page`,
   `src/cli.ts:155-157`).
2. **Exclusions**: an `## Out of Scope` section in the scope file is lifted
   out of the pasted requirements and written as its own
   `## Elements to Ignore` section, so the Planner's third bullet finds it.

**Repo conventions to match**: TypeScript with 2-space indent, single quotes,
a 100-column line width and trailing commas (Biome). Tests live in
`src/utils/__tests__/scope.test.ts` and use `vitest` with a temp directory
per case (`makeTmpDir()`), as the existing cases do. Errors are not thrown
for a malformed scope file — a scope file is user input, so a missing or
odd section must never fail the run.

**Vocabulary (from `CONTEXT.md`)**: a *Scope* is what a run is pointed at
(a URL, optionally a page, a feature focus, and an optional scope file); a
*feature focus* is the single feature a run should test, set with
`--scope`. Do not call `--scope` and the scope file the same thing.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Unit tests | `pnpm test:unit` | 12 files, 129 tests pass |
| One test file | `pnpm vitest run src/utils/__tests__/scope.test.ts` | all pass |
| Lint + format + assists | `pnpm check` | exit 0, 56 files |
| Build | `pnpm build` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `src/utils/scope.ts`
- `src/utils/__tests__/scope.test.ts`
- `docs/SCOPE-template.md`
- `templates/docs/SCOPE-template.md`
- `templates/agents/planner/AGENT.md`

**Out of scope** (do NOT touch, even though they look related):
- `src/cli.ts` — the CLI already passes `options.page` and `options.file`
  into `createScopeContext`; the page fallback belongs in `scope.ts` so the
  function owns the whole rule.
- `src/utils/__tests__/cli.test.ts` — unless a test there breaks because of
  the new context lines (see STOP conditions).
- `src/args.ts` — the CLI flags do not change.
- `templates/agents/generator/AGENT.md`, `templates/agents/healer/AGENT.md`
  — they receive the same context file; no change is needed here.

## Git workflow

- Branch: `advisor/020-scope-file-sections`
- Commit style: conventional commits — e.g. `fix: read the page and the
  exclusions from the scope file`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Parse the scope file

In `src/utils/scope.ts`, add two small helpers next to `fullUrl`:

```typescript
/** The page path a scope file names, if any. */
function pageFromScopeFile(content: string): string | undefined {
  const match = content.match(/^\s*\*\*Page URL\*\*:\s*(\S+)\s*$/m);
  return match?.[1];
}

/** The "Out of Scope" block of a scope file, without its heading. */
function exclusionsFromScopeFile(content: string): string | undefined {
  const match = content.match(/^##\s+Out of Scope\s*$([\s\S]*?)(?=^##\s|\Z)/m);
  const block = match?.[1]?.trim();
  return block ? block : undefined;
}
```

Both helpers must return `undefined` for anything they do not recognise —
a scope file is user input, and a malformed one must not fail the run.

### Step 2: Apply the page rule

In `createScopeContext`, read the scope file once (before the `## Target`
block is written), and use the file's page only when the CLI gave none:

```typescript
  const fileContent = scope.file && fs.existsSync(scope.file)
    ? fs.readFileSync(scope.file, 'utf-8')
    : undefined;
  const page = scope.page ?? (fileContent ? pageFromScopeFile(fileContent) : undefined);
```

Then use `page` (not `scope.page`) in the `## Target` block, so the
"**Page**" and "**Full URL**" lines are written when the page came from the
file too.

**Verify**: `pnpm typecheck` → exit 0.

### Step 3: Lift the exclusions into their own section

Still in `createScopeContext`, replace the "paste the whole file" block
with one that keeps the requirements but adds the exclusions separately:

```typescript
  if (fileContent) {
    const exclusions = exclusionsFromScopeFile(fileContent);
    const requirements = exclusions
      ? fileContent.replace(/^##\s+Out of Scope\s*$[\s\S]*?(?=^##\s|\Z)/m, '').trim()
      : fileContent.trim();

    if (requirements) {
      lines.push('## Detailed Requirements');
      lines.push(requirements);
      lines.push('');
    }

    if (exclusions) {
      lines.push('## Elements to Ignore');
      lines.push(exclusions);
      lines.push('');
    }
  }
```

The `## Instructions` block already says "Ignore unrelated elements on the
same page"; leave it as it is.

**Verify**: `pnpm typecheck` → exit 0.

### Step 4: Test the two new behaviours

In `src/utils/__tests__/scope.test.ts`, add three cases, modelled on the
existing "includes scope file content when scopeFile exists" case (write a
scope file into the temp dir, call `createScopeContext`, read the output
file):

1. `takes the page from the scope file when the CLI gave none` — the scope
   file contains `**Page URL**: /checkout`; assert the output contains
   `**Page**: /checkout` and `**Full URL**: http://localhost:5173/checkout`.
2. `prefers the CLI page over the scope file page` — the scope file says
   `/checkout`, the caller passes `page: '/login'`; assert the output
   contains `**Page**: /login` and not `/checkout`.
3. `writes the out-of-scope section as elements to ignore` — the scope file
   contains an `## Out of Scope` section with "Feature A"; assert the
   output contains `## Elements to Ignore` and `Feature A`.

**Verify**: `pnpm vitest run src/utils/__tests__/scope.test.ts` → all pass
(the existing nine cases must still pass; the "includes scope file content
when scopeFile exists" case asserts the file's content is present, which
still holds).

### Step 5: Make the template and the Planner agree

- In `docs/SCOPE-template.md` and `templates/docs/SCOPE-template.md` (keep
  them byte-identical — a test compares them), add one line under
  `## Location`:

  ```markdown
  **Page URL**: /path
  **Section**: [Which part of the page]

  This is the page the run is pointed at. A `--page` flag overrides it.
  ```

  and one line under `## Out of Scope`:

  ```markdown
  DO NOT test these (even if on same page):
  - Feature A
  - Feature B

  These are passed to the agents as "Elements to Ignore".
  ```

- In `templates/agents/planner/AGENT.md:22-26`, the three bullets become:

  ```markdown
  - Specific page to focus on
  - Specific feature to test
  - Elements to ignore (the "## Elements to Ignore" section)
  ```

**Verify**: `diff docs/SCOPE-template.md templates/docs/SCOPE-template.md`
→ no output.

### Step 6: Run everything

**Verify**: `pnpm check && pnpm typecheck && pnpm test:unit && pnpm build`
→ all exit 0; unit tests report 12 files and 132 tests (129 + 3 new).

**Verify**: `pnpm exec playwright test --list` → `Total: 18 tests in 12
files` (the repo's own suite does not use a scope file).

## Test plan

- New tests in `src/utils/__tests__/scope.test.ts`:
  1. the page comes from the scope file when the CLI gave none,
  2. the CLI's page wins over the scope file's,
  3. the "Out of Scope" section is written as "Elements to Ignore".
- Structural pattern: the existing "includes scope file content when
  scopeFile exists" and "includes page and full URL when page is provided"
  cases in the same file.
- Verification: `pnpm vitest run src/utils/__tests__/scope.test.ts` → all
  pass.

## Done criteria

- [ ] A scope file with `**Page URL**: /path` sets the page when no
      `--page` was given
- [ ] A `--page` (or `page` option) still wins over the scope file
- [ ] The "Out of Scope" section is written as `## Elements to Ignore`
- [ ] `docs/SCOPE-template.md` and `templates/docs/SCOPE-template.md` are
      byte-identical and document both rules
- [ ] `templates/agents/planner/AGENT.md` names the "Elements to Ignore"
      section
- [ ] `pnpm vitest run src/utils/__tests__/scope.test.ts` passes (9 existing
      + 3 new)
- [ ] `pnpm test:unit` exits 0; 132 tests pass
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm build` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 020 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `src/utils/scope.ts` no longer pastes the scope file under
  `## Detailed Requirements` — the live file may already parse it; re-check
  the drift and follow the live code.
- An existing test in `src/__tests__/cli.test.ts` asserts the exact shape of
  the context file and breaks because of the new lines — report the test and
  the assertion; do not change the assertion silently.
- The Planner template no longer lists "Elements to ignore" — the context
  section name must match what the template asks for; report the live text.

## Maintenance notes

- The two rules are deliberately small: a page path and an exclusion block.
  A scope file that carries richer structure (per-element requirements,
  test data) stays free-form inside "Detailed Requirements" — the Agents
  read it as prose.
- The page fallback changes what a run points at, so it is a behaviour
  change: existing scope files that fill in `**Page URL**` will now scope
  the run to that page instead of the whole application. That is the point
  of the field, but it is worth a line in the release notes.
- Reviewers should check the precedence: the flag always wins, exactly as
  it does for a batch's `page`.
