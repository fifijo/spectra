# Publishing to npm

## Release from CI

The release workflow publishes with npm's **trusted publishing**: GitHub gives
the runner an OIDC token and npm exchanges it for a short-lived publish token,
so no npm secret lives in the repository.

The package `spectra-test-automation` on npmjs.com names one trusted publisher:
GitHub Actions, repository `fifijo/spectra`, workflow file `release.yml`. The
workflow needs `id-token: write` and npm 11.5.1 or newer.

Every push to `main` runs the workflow. With a changeset pending it opens the
"chore: version packages" pull request; it publishes the version when that
pull request is merged.

## Build and publish

```bash
# Build the package
pnpm run build

# Publish to npm registry
npm publish

# Or publish to a private registry
npm publish --registry https://your-registry.example.com
```

## Install from private registry

Add a `.npmrc` to consuming projects:

```ini
@yourorg:registry=https://your-registry.example.com
//your-registry.example.com/:_authToken=${NPM_TOKEN}
```

Then install:

```bash
pnpm add -D @yourorg/spectra-test-automation @playwright/test
```

## Install from Git (Bitbucket / GitHub)

```bash
# SSH
pnpm add -D "git+ssh://git@bitbucket.org/yourorg/spectra.git"

# HTTPS
pnpm add -D "git+https://github.com/fifijo/spectra.git"
```

## Versioning

Follow [semver](https://semver.org/):
- **Patch** (`0.1.1`): bug fixes, doc updates
- **Minor** (`0.2.0`): new features, new agent templates
- **Major** (`1.0.0`): breaking CLI changes or peer `@playwright/test` range changes
