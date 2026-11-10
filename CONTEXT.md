# Spectra

Full-spectrum test automation: an AI pipeline that explores an application, writes Playwright tests for it, and repairs the tests when they break.

## Language

**Spectrum**:
The three-stage pipeline that turns a running application into passing Playwright tests.
_Avoid_: pipeline, flow, orchestration

**Agent**:
One of the three Spectrum stages — Planner, Generator, Healer. Each is a Markdown definition plus a prompt, run by an AI CLI tool.
_Avoid_: stage, worker, step

**Agent catalogue**:
The one description of every Agent: its name, colour, emoji, the files it reads and writes, and its completion signal. Everything the CLI tells an Agent comes from here.
_Avoid_: agent table, registry, manifest, spec

**Scope**:
What a Spectrum run is pointed at: a URL, optionally a page, a feature focus, and an optional scope file. In a Batch it also has a name.
_Avoid_: target

**Scope definition**:
One entry of a Batch file: what a Scope is pointed at, plus a name and notes. It carries no URL of its own — the Batch gives one to every Scope.
_Avoid_: scope options, batch scope, scope config

**Scope results**:
The Plan and the Healing Report one Scope produced, kept under `.spectra/output/scopes/<number>-<name>/` so the next Scope cannot overwrite them.
_Avoid_: scope output, artefacts, run results

**Feature focus**:
The single feature a run should test, ignoring everything else on the same page. Set with `--scope`.
_Avoid_: scope (reserved for the whole Scope)

**Batch**:
A JSON file listing Scope definitions to run one after another.
_Avoid_: scope batch, multi-scope, sweep

**Mode**:
Which CLI tool runs the Agents — `cursor-agent`, `claude-code`, `codex`,
`opencode`, `gemini`, or `manual`.
_Avoid_: runner, backend, provider

**Completion signal**:
The file an Agent writes to declare it has finished its work — `plans/.complete`, `tests/.complete`, `reports/.complete`. A run starts the next Agent only after the current one is done: in manual mode on the completion signal, in automated mode on the Agent's exit.
_Avoid_: gate (used for the human review checklists in `specs/`), marker, done file

**Plan**:
The Markdown document the Planner writes describing what to test. The Generator reads it.
_Avoid_: test plan, spec, strategy

**Page Object**:
A TypeScript class under `pages/` that wraps one page's locators.
_Avoid_: page class, POM, screen

**Healing Report**:
The Markdown record of what the Healer diagnosed and changed.
_Avoid_: fix log, report
