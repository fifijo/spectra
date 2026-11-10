# Plan 022: The README describes what the tool actually does

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 660399d..HEAD -- README.md src/agents/catalogue.ts src/utils/detect-mode.ts src/cli.ts templates/agents/planner/AGENT.md templates/agents/healer/AGENT.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/016-consumer-ci-workflow.md
- **Category**: docs
- **Planned at**: commit `660399d`, 2026-11-10

## Why this matters

The README is the npm package's front page and the first document anyone
reads. Right now it states, in the sections a reader reaches first:

- that the Planner writes `test-plan.md` and the Generator writes
  `pages/*.ts` and `tests/*.spec.ts` — the catalogue says
  `.spectra/output/plans/test-plan.md` and
  `pages/`, `tests/`, **and** `fixtures/pages.ts`;
- a sample run transcript with `Mode: full-spectrum` and per-agent
  `✓ Discovered 5 pages` lines — the CLI's modes are `cursor-agent`,
  `claude-code` and `manual`, and it prints no such lines;
- a Playwright config snippet with only a `use` block, while the README's
  own report command (`npx playwright show-report .spectra/output/reports`)
  and its `SPECTRA_BROWSERS` / `SPECTRA_TAGS` variables only work with the
  config the package actually ships;
- two environment-variable tables that give `SPECTRA_URL` two different
  defaults;
- two navigation links that point at headings that do not exist;
- a private-registry install command that names a package that is not
  published under that name;
- a publish section that says `npm publish`, bypassing the changeset
  version bump and changelog the project actually uses.

Every one of those is a fact a reader will act on.

## Current state

- `README.md:209-236` — the three agent cards:
  ```markdown
  ### 🔵 Planner
  ...
  **Output:** `test-plan.md`
  ### 🟢 Generator
  ...
  **Output:** `pages/*.ts`, `tests/*.spec.ts`
  ### 🟣 Healer
  ...
  **Output:** Passing tests ✅
  ```
  `src/agents/catalogue.ts:22-50` — the truth:
  ```typescript
  { name: 'planner', outputs: ['plans/test-plan.md'], completionSignal: 'plans/.complete' },
  { name: 'generator', projectOutputs: ['pages/', 'tests/', 'fixtures/pages.ts'], completionSignal: 'tests/.complete' },
  { name: 'healer', inputs: ['reports/results.json'],
    outputs: ['reports/healing-report.md', 'reports/status.json'],
    projectOutputs: ['pages/', 'tests/'], completionSignal: 'reports/.complete' },
  ```
- `README.md:266-318` — the "See Example Output" block: `Mode:
  full-spectrum`, `✓ Discovered 5 pages`, `✓ Created pages/HomePage.ts`,
  `📄 Page Objects: 3`, `🧪 Test files: 2`.
  `src/utils/detect-mode.ts:3` — `export type CliMode = 'cursor-agent' |
  'claude-code' | 'manual';`
  `src/cli.ts:286-299` — the real summary: "Generated:" with the Page
  Object and test-file counts, then a "Commands:" block.
- `README.md:603-616` — the Playwright config snippet (only `use`).
  `templates/config/playwright.config.ts:30-60` — the config the scaffold
  installs: `reporter` → `.spectra/output/reports` and
  `.spectra/output/reports/results.json`, `outputDir` →
  `.spectra/output/test-results`, `projects` from `SPECTRA_BROWSERS`,
  `grep` from `SPECTRA_TAGS`, `testIdAttribute: 'data-testid'`.
- `README.md:580-586` — the environment-variable table (`SPECTRA_URL`
  default "(none — required)"); `README.md:731-737` — the CI table, which
  gives `SPECTRA_URL` the default `http://localhost:5173` and omits
  `SPECTRA_BROWSERS`, `SPECTRA_TAGS` and `SPECTRA_DEBUG`.
- `README.md:18-26` — the navigation:
  ```markdown
  [Quick Start](#-quick-start) •
  [How It Works](#-the-spectrum) •
  [Examples](#-examples) •
  [Documentation](#-documentation)
  ```
  There is no "Documentation" heading, and "How It Works" is a real heading
  at `README.md:203` — the link points at "The Spectrum" instead.
- `README.md:858-872` — the publish section (`npm publish`).
  `package.json:47-49` — the real flow: `"version-packages": "changeset
  version"`, `"release": "pnpm run check && … && changeset publish"`.
- `README.md:875-886` — the private registry: `.npmrc` scoped to
  `@yourorg:` and `pnpm add -D @yourorg/spectra-test-automation
  @playwright/test`. `package.json:2` — the package is published unscoped as
  `spectra-test-automation`.
- `README.md:744-812` — the "Generated Output Examples": the Plan example
  uses a `## Pages Discovered` table; `templates/agents/planner/AGENT.md:129-174`
  says the Plan has "Application Overview", per-page sections and
  numbered scenarios with an Expected Result. The Healing Report example
  uses a `| Metric | Count |` table; `templates/agents/healer/AGENT.md:69-85`
  says the report is `# Spectra Healing Report` with a bullet Summary and
  `### [Test Name]` blocks with Error / Root Cause / Fix Applied / File
  Modified.

**Repo conventions to match**: the README uses emoji section headings and
fenced code blocks with a language. Keep the existing tone and layout — this
plan corrects facts, it does not rewrite the page. The vocabulary is fixed
by `CONTEXT.md`: the *Spectrum*, the three *Agents*, the *Plan*, *Page
Objects*, the *Healing Report*.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Unit tests | `pnpm test:unit` | 12 files, 129 tests pass |
| Lint + format + assists | `pnpm check` | exit 0, 56 files |

## Scope

**In scope** (the only file you should modify):
- `README.md`

**Out of scope** (do NOT touch, even though they look related):
- `src/**`, `templates/**`, `specs/**`, `docs/**` — this plan only changes
  the README, and it changes it to match them.
- `package.json` — the release flow it documents already exists.
- `.github/workflows/**` — the CI workflow is correct.

## Git workflow

- Branch: `advisor/022-readme-accuracy`
- Commit style: conventional commits — e.g. `docs: make the README describe
  what the tool does`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fix the three agent cards

In `README.md:209-236`, replace the three `**Output:**` lines with the
catalogue's paths:

```markdown
**Output:** `.spectra/output/plans/test-plan.md`
```

```markdown
**Output:** `pages/*.ts`, `tests/*.spec.ts`, `fixtures/pages.ts`
```

```markdown
**Output:** `.spectra/output/reports/healing-report.md`, `.spectra/output/reports/status.json`
```

**Verify**: `grep -n "Output:" README.md` → the three lines above.

### Step 2: Replace the fabricated transcript

Rewrite the "See Example Output" block in `README.md:266-318` so it shows
what a run really prints: the banner, `Mode: <mode>` with one of
`cursor-agent`, `claude-code` or `manual`, the per-agent separators, the
"Generated:" counts and the "Commands:" block. Take the shape from
`src/cli.ts:220-300` and the mode list from `src/utils/detect-mode.ts:3`.

Delete the invented lines (`✓ Discovered 5 pages`, `✓ Created
pages/HomePage.ts`, `📄 Page Objects: 3`, `🧪 Test files: 2`, `Mode:
full-spectrum`).

**Verify**: `grep -n "full-spectrum\|Discovered 5 pages\|📄 Page Objects" README.md`
→ no output.

### Step 3: Fix the Playwright configuration section

Replace the snippet in `README.md:603-616` with the config the package
ships, and say where it comes from:

```markdown
### Playwright Configuration

`spectra --init` creates a `playwright.config.ts` for your project. It is
the file the generated tests run with, and it is what makes the commands
below work:

- the HTML report goes to `.spectra/output/reports` (the
  `npx playwright show-report .spectra/output/reports` command)
- the JSON results the Healer reads go to
  `.spectra/output/reports/results.json`
- `SPECTRA_BROWSERS` chooses the browsers, `SPECTRA_TAGS` filters by tag

Edit the `webServer` block in it to point at your application, or start
your app yourself and keep `reuseExistingServer: !process.env.CI`.
```

**Verify**: `grep -n "results.json" README.md` → at least one hit.

### Step 4: One environment-variable table

Delete the CI table's "Default" column duplication: keep the main table
(`README.md:580-586`) as the single source, and in the CI section replace
the table with one line pointing at it:

```markdown
The workflow sets `CI: true` and `SPECTRA_URL`; the other variables in the
table above work in CI exactly as they do locally.
```

**Verify**: `grep -n "SPECTRA_URL" README.md` → the table row and the CI
sentence, and no second table.

### Step 5: Fix the navigation links

In `README.md:18-26`, point the second link at the real heading
(`#-how-it-works`) and the fourth at a section that exists. Add a short
"## 📚 Documentation" section near the end of the page (before
"## 📦 Publishing to npm") that lists the three guides this repository
ships — `docs/BATCH-CONFIG.md`, `docs/QUICK-REFERENCE.md` and
`docs/WALKTHROUGH.md` — with a one-line description each, and states that
they are in the npm tarball under `node_modules/spectra-test-automation/docs/`.

**Verify**: `grep -n "^## 📚 Documentation" README.md` → one hit; every
`(#-…)` link in the navigation points at a heading that exists (check each
anchor against the heading list).

### Step 6: Fix the publish section and the private registry

In `README.md:858-886`, document the flow the project uses:

```markdown
### Build and publish

The repository publishes through changesets, so a release is a version
bump plus a changelog entry:

```bash
# Describe the change
pnpm run changeset

# Version, build and publish
pnpm run release
```

`pnpm run release` runs the quality gate (check, typecheck, unit tests),
builds the package and publishes it. For a private registry, set
`publishConfig.registry` in `package.json` and publish with
`npm publish --registry https://your-registry.example.com`.
```

and fix the private-registry install command to use the unscoped package
name that is actually published:

```bash
pnpm add -D spectra-test-automation @playwright/test
```

with a sentence saying that a scoped name (`@yourorg/spectra-test-automation`)
would need the package to be published under that scope.

**Verify**: `grep -n "@yourorg/spectra-test-automation" README.md` → at
most one hit, and it is the sentence that explains scoping.

### Step 7: Make the output examples match the templates

In `README.md:744-812`, rewrite the two example artefacts so their shape
matches what the agents write:

- the Plan example follows `templates/agents/planner/AGENT.md:129-174`
  (Application Overview, the per-page sections, User Flows, numbered
  scenarios with an Expected Result);
- the Healing Report example follows `templates/agents/healer/AGENT.md:69-85`
  (`# Spectra Healing Report`, the bullet Summary, the per-test blocks with
  Error / Root Cause / Fix Applied / File Modified).

Add the `status.json` shape from `specs/CI-HEALER-POLICY.md:94-116` as a
third short example.

**Verify**: `grep -n "Spectra Healing Report" README.md` → one hit.

### Step 8: Run the checks

**Verify**: `pnpm check && pnpm typecheck && pnpm test:unit` → all exit 0;
12 files and 129 tests pass.

## Test plan

No new unit test: this plan changes one Markdown file. The acceptance
check is mechanical — the greps in each step.

If you want a machine check that the README does not drift again, the
cheapest is to grep it for the things this plan fixes:

```bash
grep -n "full-spectrum\|Start application\|pnpm test:seed\|pnpm report" README.md
```

→ no output.

## Done criteria

- [ ] The three agent cards name the catalogue's output paths
- [ ] The sample transcript shows only output the CLI produces
- [ ] The Playwright configuration section points at the shipped config
- [ ] There is one environment-variable table
- [ ] Every navigation link points at an existing heading, and a
      "Documentation" section exists
- [ ] The publish section documents the changeset flow, and the
      private-registry command uses the published package name
- [ ] The Plan, Healing Report and status.json examples match the templates
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test:unit` exits 0; 129 tests pass
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 022 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `src/agents/catalogue.ts` no longer declares the outputs quoted in the
  "Current state" section — re-check the drift and copy the live values.
- `src/cli.ts` no longer prints a "Commands:" block or a "Generated:" block
  — take the transcript shape from the live code instead.
- The README has been restructured (different heading names, no "See
  Example Output" block) — apply the same corrections to whatever is there
  and report the difference.

## Maintenance notes

- The README is the one document that cannot be checked by a test. The
  cheapest guard is to copy facts from the code rather than retyping them,
  and to prefer a link to the source file over a second copy of a path.
- Plans 014-021 change what the README says (a seed spec, a CI workflow, a
  tag list, a config template). Execute this plan after them so the text
  matches the final behaviour.
- Reviewers should read the Quick Start and the CI section first: those are
  the two places a new user acts on what they read.
