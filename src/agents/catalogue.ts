/**
 * The Spectrum's Agents, described once.
 *
 * Output paths are relative to the run's output dir; project paths are relative to the project root.
 */
export type AgentColor = 'blue' | 'green' | 'magenta';

export interface Agent {
  name: string;
  color: AgentColor;
  emoji: string;
  /** Files the Agent reads from the run's output dir. */
  inputs: string[];
  /** Files the Agent writes into the run's output dir. */
  outputs: string[];
  /** Project paths the Agent writes to or edits. The prompt tells it to. */
  projectOutputs: string[];
  /**
   * Project folders where the Agent must have written a file during the run.
   * A folder counts as done when one of the files inside it is new or changed.
   *
   * This is what the run checks; `projectOutputs` is only what the prompt says.
   * A folder here ends with a slash.
   */
  writes: string[];
  /** The file the Agent writes when it is done. */
  completionSignal: string;
}

/** The test results the Healer reads. The Playwright config writes it. */
export const TEST_RESULTS = 'reports/results.json';

export const AGENTS: Agent[] = [
  {
    name: 'planner',
    color: 'blue',
    emoji: '🔵',
    inputs: [],
    outputs: ['plans/test-plan.md'],
    projectOutputs: [],
    writes: [],
    completionSignal: 'plans/.complete',
  },
  {
    name: 'generator',
    color: 'green',
    emoji: '🟢',
    inputs: ['plans/test-plan.md'],
    outputs: [],
    projectOutputs: ['pages/', 'tests/', 'fixtures/pages.ts'],
    writes: ['tests/'],
    completionSignal: 'tests/.complete',
  },
  {
    name: 'healer',
    color: 'magenta',
    emoji: '🟣',
    inputs: [TEST_RESULTS],
    outputs: ['reports/healing-report.md', 'reports/status.json'],
    projectOutputs: ['pages/', 'tests/'],
    writes: [],
    completionSignal: 'reports/.complete',
  },
];

/** Every completion signal, relative to the run's output dir. */
export const COMPLETION_SIGNALS = AGENTS.map((agent) => agent.completionSignal);

/** Every artefact an Agent writes into the run's output dir, relative to it. */
export const OUTPUT_ARTEFACTS = AGENTS.flatMap((agent) => agent.outputs);

/** The scope context every Agent reads, relative to the agents dir. */
export const SCOPE_CONTEXT = 'shared/current-scope.md';
