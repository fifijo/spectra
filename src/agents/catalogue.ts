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
  /** Project paths the Agent writes to or edits. */
  projectOutputs: string[];
  /** The file the Agent writes when it is done. */
  completionSignal: string;
}

export const AGENTS: Agent[] = [
  {
    name: 'planner',
    color: 'blue',
    emoji: '🔵',
    inputs: [],
    outputs: ['plans/test-plan.md'],
    projectOutputs: [],
    completionSignal: 'plans/.complete',
  },
  {
    name: 'generator',
    color: 'green',
    emoji: '🟢',
    inputs: ['plans/test-plan.md'],
    outputs: [],
    projectOutputs: ['pages/', 'tests/', 'fixtures/pages.ts'],
    completionSignal: 'tests/.complete',
  },
  {
    name: 'healer',
    color: 'magenta',
    emoji: '🟣',
    inputs: ['reports/results.json'],
    outputs: ['reports/healing-report.md', 'reports/status.json'],
    projectOutputs: ['pages/', 'tests/'],
    completionSignal: 'reports/.complete',
  },
];

/** Every completion signal, relative to the run's output dir. */
export const COMPLETION_SIGNALS = AGENTS.map((agent) => agent.completionSignal);

/** Every artefact an Agent writes into the run's output dir, relative to it. */
export const OUTPUT_ARTEFACTS = AGENTS.flatMap((agent) => agent.outputs);

/** The scope context every Agent reads, relative to the agents dir. */
export const SCOPE_CONTEXT = 'shared/current-scope.md';
