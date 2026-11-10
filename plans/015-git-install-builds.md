# Plan 015: A git install produces a package with a working `spectra` binary

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 660399d..HEAD -- package.json README.md docs/QUICK-REFERENCE.md docs/WALKTHROUGH.md .gitignore`
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

Three documents offer to install the package straight from the repository:
`pnpm add -D "git+https://github.com/fifijo/spectra.git" @playwright/test`.
That install cannot work today. The package's binary is `dist/bin.js`, the
build output lives in `dist/`, and `dist/` is git-ignored — so a git install
copies a tree with no `dist/` at all. The package has no `prepare`, `prepack`
or `postinstall` script, so nothing builds it either. The user gets a
package whose `spectra` bin points at a file that does not exist, and their
first `npx spectra --init` fails with a module-not-found error and no hint
about why. This is the only install path a user can take without npm
publish rights.

## Current state

- `package.json:6-16` — the entry points:
  ```json
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "bin": { "spectra": "dist/bin.js" },
  ```
- `package.json:26-50` — the scripts. There is `build` (`tsc`),
  `prepublishOnly` (`pnpm run build`) and no `prepare`, `prepack` or
  `postinstall`. `prepublishOnly` runs when the package is *published*, not
  when it is installed from git.
- `.gitignore:5` — `dist/` is ignored, so the git tree has no build output.
- `README.md:170-176` — "Option B: Install from Git":
  ```bash
  # Install directly from the repository
  pnpm add -D "git+https://github.com/fifijo/spectra.git" @playwright/test
  ```
- `README.md:888-896` — the same command under "Install from Git
  (Bitbucket / GitHub)".
- `docs/QUICK-REFERENCE.md:21-25` and `docs/WALKTHROUGH.md:163-167` — the
  same command in the install tables.

**Repo conventions to match**: `package.json` scripts are chained with `&&`
(`"release": "pnpm run check && pnpm run typecheck && …"`) and are grouped
with the other scripts; devDependencies are sorted alphabetically. Commit
messages are conventional (`fix: …`, `chore: …`).

**Vocabulary (from `CONTEXT.md`)**: the package is *Spectra*; the CLI binary
is `spectra`. Do not rename it.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `pnpm install` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0, no errors |
| Unit tests | `pnpm test:unit` | 12 files, 129 tests pass |
| Lint + format + assists | `pnpm check` | exit 0, 56 files |
| Build | `pnpm build` | exit 0 |
| Packaging | `npm pack --dry-run` | exit 0; the file list contains `package/dist/bin.js` |
| Tarball install (no network) | see Step 4 | `spectra --help` prints the usage text |

## Scope

**In scope** (the only files you should modify):
- `package.json` (the `scripts` object only)
- `README.md`
- `docs/QUICK-REFERENCE.md`, `docs/WALKTHROUGH.md`

**Out of scope** (do NOT touch, even though they look related):
- `.gitignore` — `dist/` must stay ignored; the build output is not
  committed.
- `src/**` — no code change is needed; the package already builds.
- `package.json` `files`, `version`, `dependencies`, `devDependencies` —
  only the `scripts` object may change.
- `.github/workflows/release.yml` — the publish path already works
  (`prepublishOnly` builds before publishing).

## Git workflow

- Branch: `advisor/015-git-install-builds`
- Commit style: conventional commits — e.g. `fix: build the package on install
  from git`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add a `prepare` script

In `package.json`, add to the `scripts` object, next to `build`:

```json
    "build": "tsc",
    "prepare": "pnpm run build",
    "prepublishOnly": "pnpm run build",
```

`prepare` runs after a git-URL install (npm and pnpm both honour it), so
the installed tree contains `dist/`. It also runs on a plain `pnpm install`
in a checkout, which is why it must be idempotent — `tsc` is.

**Verify**: `pnpm run prepare` → exit 0, and `ls dist/bin.js` prints the
file.

### Step 2: Say so in the three install documents

In `README.md` (Option B at ~line 170 and "Install from Git" at ~line 888),
`docs/QUICK-REFERENCE.md` and `docs/WALKTHROUGH.md`, add one sentence after
the git-install command:

> The install builds the package from source (the `prepare` script), so the
> `spectra` binary is ready to run.

Do not change the commands themselves, and do not remove the option — it is
the only path for a consumer without npm publish rights.

**Verify**: `grep -rn "prepare" README.md docs/QUICK-REFERENCE.md
docs/WALKTHROUGH.md` → three hits.

### Step 3: Confirm a normal install still works

`prepare` now runs on every install in a checkout, including CI
(`pnpm install --frozen-lockfile`). The build must therefore be part of the
install path without breaking it.

**Verify**: `pnpm install --frozen-lockfile` → exit 0.

**Verify**: `pnpm check && pnpm typecheck && pnpm test:unit && pnpm build`
→ all exit 0; unit tests report 12 files and 129 tests.

### Step 4: Prove the installed tarball has a working binary

The real check for this plan, without needing the network:

```bash
npm pack                       # writes spectra-test-automation-<version>.tgz
mkdir -p /tmp/opencode/spectra-install && cd /tmp/opencode/spectra-install
npm install /path/to/spectra-test-automation-<version>.tgz
./node_modules/.bin/spectra --help
```

`--help` prints the usage text from `src/args.ts:7-33` ("Usage: spectra
[options]" and the options list) and exits 0.

Delete the tarball and the temp directory afterwards; do not commit either.

**Verify**: the command above prints the usage text and exits 0.

## Test plan

No new unit test: this plan changes a lifecycle script and three documents.
The acceptance check is the tarball install in Step 4 — it proves the
installed package has a runnable binary, which no unit test can show.

## Done criteria

- [ ] `package.json` has a `prepare` script that runs the build
- [ ] `pnpm install --frozen-lockfile` exits 0
- [ ] `npm pack --dry-run` lists `package/dist/bin.js`
- [ ] A tarball install exposes a `spectra` binary that prints the usage
      text with `--help`
- [ ] `README.md`, `docs/QUICK-REFERENCE.md` and `docs/WALKTHROUGH.md` say
      the git install builds from source
- [ ] `pnpm check` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test:unit` exits 0; 129 tests pass
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 015 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `package.json` already has a `prepare`, `prepack` or `postinstall` script
  — someone solved this differently; re-check the drift and follow the live
  file.
- `pnpm install --frozen-lockfile` fails now that `prepare` runs — the build
  is not install-safe in this environment; report the output.
- `npm pack` produces a tarball without `dist/` even after `prepare` — the
  publish path is broken for another reason; report the file list.

## Maintenance notes

- `prepare` duplicates `prepublishOnly`. That is deliberate: `prepare` is
  what git installs need, `prepublishOnly` is what npm publishes need, and
  npm runs `prepare` before `prepublishOnly` anyway.
- The install now compiles the package, so a git install needs a working
  TypeScript toolchain and takes a few seconds longer than a registry
  install. If the project ever ships prebuilt binaries, this script becomes
  unnecessary.
- Reviewers should check that no `dist/` file is ever committed — the
  `.gitignore` entry is what keeps the git tree clean.
