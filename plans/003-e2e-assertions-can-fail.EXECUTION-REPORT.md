# Execution Report: The e2e assertions can fail

> Date: 2026-11-10 10:52 CET
>
> Mode: Batch
>
> Plan: `plans/003-e2e-assertions-can-fail.md` — branch `advisor/003-e2e-assertions-can-fail`

## Summary

- **Overall result: Completed**
- The five vacuous assertions now assert real behaviour (checkout
  progression, mark-as-read, user filters, user sorting, switch states), and
  the two app bugs behind them are fixed (single-thumb range slider,
  unreachable email validation).
- The suite was green before the change and green after it: 18 passed.
- The plan's acceptance check — that each new assertion fails when the
  feature breaks — was proven for three behaviours, with the breakages
  reverted.

## Phase Results

- Step 1: Green baseline — ✅
  - Implemented: nothing.
  - Verification: `pnpm exec playwright test` → 18 passed, before any change.
  - Notes: the dummy app was already running on :5173; Playwright reused it.
- Step 2: Give the price slider two thumbs — ✅
  - Implemented: `dummy-test-app/src/components/ui/slider.tsx` renders one
    `<SliderPrimitive.Thumb/>` per value.
  - Verification: `tests/products.spec.ts` green from Step 3 on.
  - Notes: Step 2 alone cannot pass — the old single-thumb helper
    `nudgePriceSliderDown()` then trips a strict-mode violation. Step 3
    removes that helper, as the plan prescribes.
- Step 3: Assert the price filter really moves — ✅
  - Implemented: `ProductsPage.priceRangeLabel` + `lowerPriceCeiling()`;
    the spec asserts `Price Range: $0 - $290`.
  - Verification: `tests/products.spec.ts` → 1 passed.
  - Notes: the label value was read off the rendered app (step = 10).
- Step 4: Assert the checkout wizard advances — ✅
  - Implemented: `CheckoutPage.stepCard()`; the spec asserts the visible
    card and that the previous card is gone (`toHaveCount(0)`).
  - Verification: `tests/checkout.spec.ts` → 1 passed.
  - Notes: the real test ids (`address-card`, `payment-card`, `confirm-card`)
    were confirmed in `dummy-test-app/src/pages/Checkout.tsx`.
- Step 5: Assert "mark as read" — ✅
  - Implemented: the spec asserts `markReadButton(1)` has count 0.
  - Verification: `tests/notifications.spec.ts` → 1 passed.
- Step 6: Assert the users filter and sort — ✅
  - Implemented: the spec asserts a non-admin and an inactive user are gone,
    the row count follows the filter, and the first/second/third row names
    change with each sort. `UsersPage` gained positional `tableRows()` /
    `tableRow(position)` locators.
  - Verification: `tests/users.spec.ts` → 1 passed.
  - Notes: `userRow(id)` is id-keyed, not positional, so the plan's literal
    snippet would have passed for the wrong reason.
- Step 7: Assert the switch states — ✅
  - Implemented: notifications and settings specs assert the checked state
    before and after each click, using `toBeChecked()` /
    `not.toBeChecked()`.
  - Verification: `tests/notifications.spec.ts tests/settings.spec.ts` → 2 passed.
- Step 8: Make the app's email validation reachable — ✅
  - Implemented: `noValidate` on the login form; the DOM mutation is gone
    from `tests/login.spec.ts`.
  - Verification: `tests/login.spec.ts` → 6 passed (the file has six tests,
    the plan counted five).
- Step 9: Run everything — ✅
  - Verification: `pnpm exec playwright test` → 18 passed;
    `pnpm typecheck && pnpm typecheck:test && pnpm test:unit` → all exit 0
    (112 tests); `pnpm lint` and `pnpm format:check` → exit 0.
- Test plan: the new assertions must fail when the feature breaks — ✅
  - `toggleSort` no-op → the users sort assertion failed
    (expected `Leo Garcia`, got `Alice Johnson`).
  - `markAsRead` no-op → the mark-read assertion failed (count 1, expected 0).
  - One thumb → the price spec timed out waiting for the second handle;
    no-op `onValueChange` → the label assertion failed
    (expected `$0 - $290`, got `$0 - $300`).
  - All three breakages were reverted.

## Verification Matrix

- E2E suite: pass (`pnpm exec playwright test` — 18 passed, before and after)
- E2E regression proof: pass (three deliberate breakages each failed the matching assertion, then reverted)
- Type check (src): pass (`pnpm typecheck`)
- Type check (generated code): pass (`pnpm typecheck:test`)
- Unit tests: pass (`pnpm test:unit` — 12 files, 112 tests)
- Lint: pass (`pnpm lint` — 30 files)
- Format check: pass (`pnpm format:check` — 30 files)
- Build: not run — no `src/` code changed
- Manual QA: pending — the GitHub Actions Playwright job runs on the next push

## Deviations

- `UsersPage` gained positional `tableRows()` / `tableRow(position)`
  locators: the plan's `userRow(1)` is keyed by user id, so the requested
  "first row after sorting" assertion needs a positional locator.
- Switch assertions use `toBeChecked()` / `not.toBeChecked()` rather than
  the plan's `aria-checked` snapshot — the same check, in the style of
  `tests/login.spec.ts`, which the plan points at.
- `CheckoutPage.stepIndicator` was left in place (now unused): the plan's
  scope says unused Page Object members are a separate cleanup.

## Blockers and Resolutions

- Blocker: none. The plan's STOP conditions did not fire.
- Impact: n/a.
- Resolution: n/a.
- Status: none.

## Follow-ups

- The users sort assertions pin exact fixture names (`Leo Garcia`,
  `Frank Miller`, `David Brown`): changing `allUsers` in
  `dummy-test-app/src/pages/Users.tsx` breaks `tests/users.spec.ts` until
  the expectations are updated.

## Changed Files

- `dummy-test-app/src/components/ui/slider.tsx` — one thumb per value.
- `dummy-test-app/src/pages/Login.tsx` — `noValidate` on the login form.
- `pages/CheckoutPage.ts` — `stepCard()`.
- `pages/NotificationsPage.ts` — `settingsToggle()`.
- `pages/ProductsPage.ts` — `priceRangeLabel`, `lowerPriceCeiling()`.
- `pages/UsersPage.ts` — `usersTableCard`, `tableRows()`, `tableRow()`.
- `tests/checkout.spec.ts`, `tests/login.spec.ts`,
  `tests/notifications.spec.ts`, `tests/products.spec.ts`,
  `tests/settings.spec.ts`, `tests/users.spec.ts` — the real assertions.
- `plans/003-e2e-assertions-can-fail.md` (untracked working material) —
  living plan log.
- `plans/README.md` (untracked working material) — status row for 003.
- `plans/003-e2e-assertions-can-fail.EXECUTION-REPORT.md` (untracked) — this report.
