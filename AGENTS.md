# AGENTS.md

Spectra is a TypeScript CLI and library that runs the Planner → Generator → Healer Spectrum over a running web app. Domain vocabulary is fixed by `CONTEXT.md`; the implemented architecture is in `Project_Architecture_Blueprint.md`. (The runtime Agents' own instructions are `templates/agents/*/AGENT.md` — not this file.)

## Commands

- `pnpm check` — Biome lint, format and import assists
- `pnpm typecheck` — `src/`
- `pnpm typecheck:test` — `pages/`, `tests/`, `fixtures/`, `playwright.config.ts`
- `pnpm test:unit` — Vitest, colocated under `src/**/__tests__/`
- `pnpm build` — `tsc` to `dist/`
- `pnpm test` — Playwright against `dummy-test-app/`

Before finishing: `pnpm check && pnpm typecheck && pnpm typecheck:test && pnpm test:unit`.

## Invariants

- `src/agents/catalogue.ts` is the single source for Agent names, paths, inputs, outputs, `writes` and completion signals. Do not hard-code those elsewhere.
- Only `outputs` files and `writes` folders are verified (`src/agents/verify.ts`). `projectOutputs` is prompt-only.
- Completion is checked in one place. Both `cli.ts` and `mcp/server.ts` call `missingOutputs`; never reimplement it.
- The library never exits. `process.exit` is only in `bin.ts` (failure) and `args.ts` (`--help`).
- Zero runtime dependencies. Use Node built-ins.
- `templates/`, `specs/`, `docs/` and `assets/` ship in the npm package. A change to a shipped config, fixture, prompt or gate doc usually needs its `templates/` twin.
- `pages/`, `tests/` and `fixtures/pages.ts` are generated but checked in and typechecked. `.spectra/` is ignored and must not be committed.
- Template upgrades preserve user edits (`installTemplates` hash manifest); keep it that way.
- A scope file outside the project crosses the trust boundary: keep the warning in `warnOnUntrustedFile`.
- Style: Biome, 2 spaces, 100 columns, single quotes, trailing commas. Comments only explain why.

## Tests

Non-trivial logic needs a Vitest test under `src/**/__tests__/`. If you change generated output or the Playwright config, run `pnpm typecheck:test` and `pnpm test`. Integration behaviour belongs in `src/__tests__/cli.test.ts`; MCP behaviour in `src/mcp/__tests__/server.test.ts`.
