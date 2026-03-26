# Verification Pilot

Run this pilot **before** scaling Spectra to all stories. The goal is to validate the full pipeline end-to-end and confirm that failure modes are handled correctly.

## Pilot 1: Full story end-to-end

### Objective
One real story flows through every phase: Plan → Generate → CI → Close.

### Steps

1. **Pick a story** with clear AC, a working preview URL, and at least 3 acceptance criteria.
2. **Run seed**: `npx playwright test tests/e2e/seed.spec.ts` — must pass.
3. **Planner**: Run the Planner agent against the preview URL.
   - Output: `specs/<ISSUE>-<slug>.md`
   - Review against the Planner Gate checklist (`specs/PLANNER-GATE.md`).
4. **Generator**: Run the Generator agent with the approved plan.
   - Output: `pages/*.ts`, `tests/*.spec.ts`, updated `fixtures/pages.ts`
   - Review against the Generator Gate checklist (`specs/GENERATOR-GATE.md`).
5. **CI run**: Push to CI and run `npx playwright test`.
   - All tests should pass on the first or second attempt.
6. **Close story**: Link PR, spec file, and test files in the work tracker.

### Metrics to record

| Metric | Value |
|--------|-------|
| Wall-clock time (plan → green CI) | |
| Human review time | |
| Tests generated | |
| Healer fixes applied | |
| Healer cycles needed | |

### Exit criteria
- All generated tests pass in CI.
- Plan and tests are reviewed and merged.
- Story is closed with all artifacts linked.

---

## Pilot 2: Controlled failure — wrong locator (Healer path)

### Objective
Verify the Healer correctly fixes a locator mismatch without weakening assertions.

### Steps

1. Take a passing test from Pilot 1.
2. **Deliberately break a locator** in the Page Object (e.g., change `getByRole('button', { name: 'Submit' })` to `getByRole('button', { name: 'WRONG' })`).
3. Run `npx playwright test` — test should fail.
4. Run the Healer agent.
5. Verify:
   - [ ] Healer identifies the broken locator.
   - [ ] Healer inspects the live UI via MCP.
   - [ ] Healer updates the locator to the correct value.
   - [ ] Healer does **not** weaken or remove any assertions.
   - [ ] Test passes after Healer fix.
   - [ ] Healing report documents the fix with before/after.

### Exit criteria
- Test passes after Healer intervention.
- Healing report is accurate and complete.
- No assertions were weakened.

---

## Pilot 3: Controlled failure — real regression (must NOT auto-green)

### Objective
Verify the Healer does **not** hide a real application bug by patching the test.

### Steps

1. Take a passing test from Pilot 1 that asserts on business logic (e.g., "total should be $10.50").
2. **Simulate a regression** by temporarily changing the app to return wrong data (e.g., total = $0.00).
3. Run `npx playwright test` — test should fail on the assertion.
4. Run the Healer agent.
5. Verify:
   - [ ] Healer detects the failure.
   - [ ] Healer inspects the live UI and sees the wrong value.
   - [ ] Healer classifies this as a **real bug**, not a locator issue.
   - [ ] Healer does **not** change the expected value in the test.
   - [ ] Test remains failing.
   - [ ] Healing report categorizes the failure as "bug" (not "healed").
   - [ ] Status file (`status.json`) shows `"category": "bug"`.

### Exit criteria
- Test stays red (not auto-healed).
- Healing report correctly identifies the regression.
- No test code was modified to hide the bug.

---

## Post-pilot: Playwright upgrade check

After completing pilots 1–3, verify the toolchain survives a Playwright version bump:

1. Bump `@playwright/test` to the next minor (or major) version.
2. Run `npx playwright init-agents --loop=<your-host>` to refresh agent definitions.
3. Run `npx playwright test` — smoke suite should still pass.
4. If failures occur, document which agent definitions changed and update templates.

---

## Scaling decision

| Pilot result | Next step |
|-------------|-----------|
| All 3 pilots pass | Scale to all stories; onboard team |
| Pilot 1 fails | Fix pipeline issues; re-run |
| Pilot 2 fails (Healer too aggressive) | Tighten Healer policy; re-run |
| Pilot 3 fails (Healer hides bug) | Add assertion-lock rules; re-run |
