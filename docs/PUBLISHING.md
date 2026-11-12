# Publishing to npm

## Release from CI

The release workflow publishes with npm's **trusted publishing**: GitHub gives
the runner an OIDC token and npm exchanges it for a short-lived publish token,
so no npm secret lives in the repository.

The package `spectra-test-automation` on npmjs.com names one trusted publisher:
GitHub Actions, repository `fifijo/spectra`, workflow file `release.yml`. The
workflow needs `id-token: write` and npm 11.5.1 or newer.

The publish itself runs through npm: `changeset publish` would publish with
pnpm, and pnpm cannot speak OIDC. The `publish:package` script asks the
registry first, so a version that is already on npm is skipped instead of
failing the job.

Every push to `main` runs the workflow. With a changeset pending it opens the
"chore: version packages" pull request; it publishes the version when that
pull request is merged.

## Build and publish

The local release path runs the quality gate first, then publishes:

```bash
# Quality gate, build and publish
pnpm run release
```

`pnpm run release` runs `pnpm run check`, `pnpm run typecheck`,
`pnpm run typecheck:test` and `pnpm run test:unit`, then `pnpm run build`, then
`pnpm run publish:package`. The last one asks the registry whether the version
is already published and skips it when it is; otherwise it runs
`npm publish --provenance`.

To publish to a private registry instead:

```bash
npm publish --registry https://your-registry.example.com
```

## Install from private registry

The published package is unscoped (`spectra-test-automation`), so a private
registry that serves it is the default registry. Add a `.npmrc` to consuming
projects:

```ini
registry=https://your-registry.example.com
//your-registry.example.com/:_authToken=${NPM_TOKEN}
```

Then install:

```bash
pnpm add -D spectra-test-automation @playwright/test
```

A package published under a scope takes the scoped registry instead:

```ini
@yourorg:registry=https://your-registry.example.com
```

## Install from Git (Bitbucket / GitHub)

```bash
# SSH
pnpm add -D "git+ssh://git@bitbucket.org/yourorg/spectra.git"

# HTTPS
pnpm add -D "git+https://github.com/fifijo/spectra.git"
```

A package installed from Git has to build itself before it can be used, and
pnpm 10 only runs the build script of a dependency when the project allows
it. Add the package to `onlyBuiltDependencies` in `pnpm-workspace.yaml`:

```yaml
onlyBuiltDependencies:
  - "spectra-test-automation"
```

With that in place the install builds the package and puts the `spectra`
binary in `node_modules/.bin/`.

## Versioning

Follow [semver](https://semver.org/):
- **Patch** (`0.1.1`): bug fixes, doc updates
- **Minor** (`0.2.0`): new features, new agent templates
- **Major** (`1.0.0`): breaking CLI changes or peer `@playwright/test` range changes
