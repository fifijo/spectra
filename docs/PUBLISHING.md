# Publishing to npm

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
