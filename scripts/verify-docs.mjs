#!/usr/bin/env node
/**
 * Verify what the documentation promises, by running it.
 *
 * The unit tests check that the documents match the code. This script checks
 * that the code does what the documents say: the flags, the environment
 * variables, the modes, the artefacts and the exit codes, against a real
 * project and a real browser.
 *
 *   pnpm verify:docs
 *
 * It needs the package built (`pnpm build`) and the dummy app's browser
 * installed (`pnpm exec playwright install chromium`).
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(REPO, 'dist', 'bin.js');
const TMP = path.join(REPO, '.spectra', 'verify-docs');

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (err) {
    failures.push(`${name}: ${err.message}`);
    console.log(`  FAIL ${name}\n         ${err.message}`);
  }
}
function assert(cond, message) {
  if (!cond) throw new Error(message);
}
function contains(haystack, needle, label = '') {
  assert(String(haystack).includes(needle), `${label} expected to contain "${needle}"`);
}
function read(file) {
  return fs.readFileSync(file, 'utf-8');
}

/** A project with the app, the config and the agent stub the run needs. */
function freshProject(name, { app = false, stub = false } = {}) {
  const dir = path.join(TMP, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'tests'), { recursive: true });
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'));
  if (app) {
    fs.cpSync(path.join(REPO, 'dummy-test-app'), path.join(dir, 'dummy-test-app'), {
      recursive: true,
      filter: (source) => !source.endsWith(`${path.sep}node_modules`),
    });
    fs.symlinkSync(
      path.join(REPO, 'dummy-test-app', 'node_modules'),
      path.join(dir, 'dummy-test-app', 'node_modules'),
    );
    fs.copyFileSync(
      path.join(REPO, 'playwright.config.ts'),
      path.join(dir, 'playwright.config.ts'),
    );
  }
  if (stub) {
    fs.mkdirSync(path.join(dir, 'stub'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'stub', 'opencode'), STUB_AGENT, { mode: 0o755 });
  }
  return dir;
}

function runCli(dir, args, env = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd: dir,
    encoding: 'utf-8',
    env: { ...process.env, ...env },
    timeout: 300000,
  });
  return { code: result.status, out: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

/**
 * An agent CLI that plays the three Agents. It writes what each of them
 * writes, so the run can be checked without a model.
 */
const STUB_AGENT = `#!/bin/bash
PROMPT="$*"
DIR="$(pwd)"
case "$PROMPT" in
  *planner/AGENT.md*)
    mkdir -p "$DIR/.spectra/output/plans" "$DIR/specs" "$DIR/.spectra/output/evidence"
    printf '# Test Plan\\n\\n### Scenario 1: Dashboard\\n' > "$DIR/.spectra/output/plans/test-plan.md"
    cp "$DIR/.spectra/output/plans/test-plan.md" "$DIR/specs/test-plan.md"
    printf 'shot\\n' > "$DIR/.spectra/output/evidence/dashboard.png"
    touch "$DIR/.spectra/output/plans/.complete"
    ;;
  *generator/AGENT.md*)
    mkdir -p "$DIR/tests"
    cat > "$DIR/tests/dashboard.spec.ts" <<'EOF'
import { expect, test } from '@playwright/test';

test.describe('Dashboard', { tag: ['@smoke', '@e2e'] }, () => {
  test('shows its heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});
EOF
    touch "$DIR/.spectra/output/tests/.complete"
    ;;
  *healer/AGENT.md*)
    npx playwright test > "$DIR/healer.log" 2>&1
    mkdir -p "$DIR/.spectra/output/reports"
    printf '# Spectra Healing Report\\n' > "$DIR/.spectra/output/reports/healing-report.md"
    printf '{"total":2,"passed":2,"failed":0}\\n' > "$DIR/.spectra/output/reports/status.json"
    touch "$DIR/.spectra/output/reports/.complete"
    ;;
esac
exit 0
`;

if (!fs.existsSync(CLI)) {
  console.error('The package is not built. Run `pnpm build` first.');
  process.exit(1);
}

console.log('\n== The flags of the command line ==');
{
  const dir = freshProject('flags');
  const help = runCli(dir, ['--help']).out;
  for (const flag of ['--url', '--page', '--scope', '--file', '--batch', '--manual', '--mode', '--mcp', '--init', '--debug']) {
    check(`--help names ${flag}`, () => contains(help, flag));
  }
  check('a run without a URL is refused', () => {
    const result = runCli(dir, ['--url', ''], { SPECTRA_URL: '' });
    assert(result.code !== 0, `exit ${result.code}`);
    contains(result.out, 'URL required');
  });
  check('conflicting flags are refused', () => {
    const result = runCli(dir, ['--mcp', '--url', 'http://x', '--batch', 'b.json']);
    assert(result.code !== 0, `exit ${result.code}`);
    contains(result.out, '--batch');
  });
}

console.log('\n== The environment variables ==');
{
  const dir = freshProject('env', { app: true });
  for (const file of fs.readdirSync(path.join(REPO, 'tests'))) {
    fs.copyFileSync(path.join(REPO, 'tests', file), path.join(dir, 'tests', file));
  }
  fs.cpSync(path.join(REPO, 'pages'), path.join(dir, 'pages'), { recursive: true });
  fs.cpSync(path.join(REPO, 'fixtures'), path.join(dir, 'fixtures'), { recursive: true });

  const playwright = (args, env = {}) =>
    spawnSync('npx', ['playwright', ...args], {
      cwd: dir,
      encoding: 'utf-8',
      env: { ...process.env, ...env },
      timeout: 240000,
    }).stdout;

  check('SPECTRA_TAGS filters the run by tag', () => {
    const all = (playwright(['test', '--list']).match(/›/g) ?? []).length;
    const smoke = playwright(['test', '--list'], { SPECTRA_TAGS: '@smoke' });
    assert(all > 0, 'no test was listed');
    assert((smoke.match(/›/g) ?? []).length < all, 'the filter let every test through');
    assert(!smoke.includes('@validation'), 'a non-smoke test was listed');
  });
  check('SPECTRA_BROWSERS picks the browsers', () => {
    contains(playwright(['test', '--list'], { SPECTRA_BROWSERS: 'firefox' }), '[firefox]');
  });
  check('SPECTRA_URL sets the base URL', () => {
    fs.writeFileSync(
      path.join(dir, 'tests', 'baseurl.spec.ts'),
      "import { expect, test } from '@playwright/test';\ntest('base url', async ({ baseURL }) => { expect(baseURL).toContain('spectral.test:4321'); });\n",
    );
    const result = spawnSync('npx', ['playwright', 'test', 'tests/baseurl.spec.ts'], {
      cwd: dir,
      encoding: 'utf-8',
      env: { ...process.env, SPECTRA_URL: 'http://spectral.test:4321' },
      timeout: 240000,
    });
    contains(result.stdout, '1 passed');
  });
  check('SPECTRA_URL is the target of the run', () => {
    const result = runCli(dir, ['--mode', 'manual'], {
      SPECTRA_URL: 'http://localhost:5173',
      SPECTRA_MODE: 'manual',
    });
    contains(result.out, 'http://localhost:5173');
    contains(result.out, 'Mode: manual');
  });
}

console.log('\n== Manual mode ==');
{
  const dir = freshProject('manual');
  const child = spawn(process.execPath, [CLI, '--url', 'http://localhost:5173', '--manual'], {
    cwd: dir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  child.stdout.on('data', (chunk) => (out += chunk.toString()));
  child.stderr.on('data', (chunk) => (out += chunk.toString()));

  const prompt = path.join(dir, '.spectra', 'agents', 'planner', 'current-prompt.md');
  for (let i = 0; i < 120 && !fs.existsSync(prompt); i += 1) {
    await new Promise((r) => setTimeout(r, 250));
  }
  check('manual mode writes the prompt of the running Agent', () => {
    assert(fs.existsSync(prompt), 'no prompt');
    contains(read(prompt), 'planner/AGENT.md');
  });
  check('manual mode waits for the completion signal', () =>
    contains(out, 'Waiting for the agent to write'),
  );
  child.kill('SIGKILL');
}

console.log('\n== A full run ==');
{
  const dir = freshProject('run', { app: true, stub: true });
  const result = runCli(dir, ['--url', 'http://localhost:5173', '--mode', 'opencode'], {
    PATH: `${path.join(dir, 'stub')}:${process.env.PATH}`,
  });
  check('a green run exits 0', () => assert(result.code === 0, `exit ${result.code}\n${result.out}`));
  check('a green run says SPECTRUM COMPLETE', () => contains(result.out, 'SPECTRUM COMPLETE'));
  check('the Plan lands in the output dir', () =>
    assert(fs.existsSync(path.join(dir, '.spectra', 'output', 'plans', 'test-plan.md')), 'no plan'),
  );
  check('the Plan is kept in the project', () =>
    assert(fs.existsSync(path.join(dir, 'specs', 'test-plan.md')), 'no copy'),
  );
  check('the Healer writes its report and its status', () => {
    for (const file of ['healing-report.md', 'status.json', 'results.json']) {
      assert(
        fs.existsSync(path.join(dir, '.spectra', 'output', 'reports', file)),
        `${file} is missing`,
      );
    }
  });
  check('every Agent wrote its completion signal', () => {
    for (const signal of ['plans/.complete', 'tests/.complete', 'reports/.complete']) {
      assert(
        fs.existsSync(path.join(dir, '.spectra', 'output', signal)),
        `${signal} is missing`,
      );
    }
  });
  check('the run leaves an evidence folder', () =>
    assert(fs.existsSync(path.join(dir, '.spectra', 'output', 'evidence')), 'no evidence folder'),
  );
  check('the CLI prints the commands a consumer can run', () => {
    contains(result.out, 'npx playwright test');
    contains(result.out, 'npx playwright show-report .spectra/output/reports/html');
  });
}

console.log('\n== Native mode ==');
{
  const dir = freshProject('mcp');
  const child = spawn(
    process.execPath,
    [CLI, '--mcp', '--url', 'http://localhost:5173'],
    { cwd: dir, stdio: ['pipe', 'pipe', 'pipe'] },
  );
  let buffer = '';
  const answers = new Map();
  child.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    let nl;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      const msg = JSON.parse(line);
      if (answers.has(msg.id)) {
        answers.get(msg.id)(msg);
        answers.delete(msg.id);
      }
    }
  });
  let id = 0;
  const send = (method, params) =>
    new Promise((resolve) => {
      const request = { jsonrpc: '2.0', id: ++id, method, params };
      answers.set(request.id, resolve);
      child.stdin.write(`${JSON.stringify(request)}\n`);
    });
  const payload = (msg) => JSON.parse(msg.result.content[0].text);

  const init = await send('initialize', {});
  check('the server answers the handshake', () =>
    assert(init.result.serverInfo.name === 'spectra', 'wrong server name'),
  );
  const tools = await send('tools/list', {});
  check('the server offers the three tools', () => {
    const names = tools.result.tools.map((t) => t.name).sort();
    assert(
      JSON.stringify(names) === JSON.stringify(['spectra_done', 'spectra_next', 'spectra_status']),
      JSON.stringify(names),
    );
  });
  const brief = payload(await send('tools/call', { name: 'spectra_next' }));
  check('spectra_next gives the brief of the running Agent', () => {
    assert(brief.agent === 'planner', `agent is ${brief.agent}`);
    contains(brief.prompt, 'planner/AGENT.md');
    contains(brief.completionSignal, '.complete');
  });
  const status = payload(await send('tools/call', { name: 'spectra_status' }));
  check('spectra_status says which Agent is running', () =>
    assert(status.current === 'planner', `current is ${status.current}`),
  );

  fs.mkdirSync(path.join(dir, '.spectra', 'output', 'plans'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.spectra', 'output', 'plans', 'test-plan.md'), '# Plan\n');
  const after = payload(
    await send('tools/call', { name: 'spectra_done', arguments: { agent: 'planner' } }),
  );
  check('spectra_done moves to the next Agent', () =>
    assert(after.agent === 'generator', `agent is ${after.agent}`),
  );
  child.stdin.end();
  const code = await new Promise((resolve) => child.on('exit', resolve));
  check('native mode exits 1 when no suite ran', () => assert(code === 1, `exit ${code}`));
}

console.log('\n== A batch of scopes ==');
{
  const dir = freshProject('batch', { app: true, stub: true });
  fs.writeFileSync(
    path.join(dir, 'batch.json'),
    JSON.stringify({
      url: 'http://localhost:5173',
      scopes: [{ name: 'Login Form' }, { name: 'Checkout Flow' }],
    }),
  );
  const result = runCli(dir, ['--batch', 'batch.json', '--mode', 'opencode'], {
    PATH: `${path.join(dir, 'stub')}:${process.env.PATH}`,
  });
  check('a batch run exits 0 when every scope is green', () =>
    assert(result.code === 0, `exit ${result.code}\n${result.out.slice(-400)}`),
  );
  check('every scope keeps its own folder', () => {
    for (const folder of ['1-login-form', '2-checkout-flow']) {
      const scope = path.join(dir, '.spectra', 'output', 'scopes', folder);
      assert(fs.existsSync(scope), `${folder} is missing`);
      assert(fs.existsSync(path.join(scope, 'plans', 'test-plan.md')), 'no plan');
      assert(fs.existsSync(path.join(scope, 'reports', 'healing-report.md')), 'no report');
    }
  });
  check('the batch reports how many scopes ran', () =>
    contains(result.out, 'Scopes: 2 total'),
  );
}

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${passed} checks passed, ${failures.length} failed`);
if (failures.length > 0) {
  console.log('\nFailures:');
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exitCode = 1;
}
