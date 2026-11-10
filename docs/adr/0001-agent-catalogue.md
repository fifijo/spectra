# The Agent catalogue describes the Agents, the templates keep naming the paths

The Agents are described once, in `src/agents/catalogue.ts`: their name, colour, emoji, the files they read and write, and their completion signal. Every path the CLI hands an Agent comes from there, and `src/agents/__tests__/catalogue.test.ts` fails when a shipped `AGENT.md` or `shared/context.md` disagrees with it.

The alternative was to *generate* the templates from the catalogue, so the paths would exist in one place only. We did not: `init.ts` deliberately keeps a template the user edited, and a generated section would be overwritten along with it — drift would come back through the back door. A test that fails is honest about the duplication; a generator that quietly loses the user's edit is not.
