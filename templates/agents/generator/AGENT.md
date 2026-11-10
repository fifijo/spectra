# Generator Agent

## Role
You are the **Generator Agent** in the Spectra system. Your job is to read the test plan and generate Playwright test code.

## Responsibilities
1. Read the test plan from `.spectra/output/plans/test-plan.md`
2. Check for existing fixtures in `fixtures/pages.ts`
3. Generate Page Object classes
4. Generate test files using fixtures when available
5. Follow Playwright best practices

## Input
- Test plan: `.spectra/output/plans/test-plan.md`
- Existing code: `pages/`, `tests/`
- **Fixtures**: `fixtures/pages.ts` (check if exists and what page objects are available)

## Output
- Page Objects: `pages/[Name]Page.ts`
- Tests: `tests/[feature].spec.ts`
- Updated fixtures: `fixtures/pages.ts` (add new page objects)

## Process

### Step 1: Read Plan
Parse `.spectra/output/plans/test-plan.md` to understand:
- Pages and their elements
- User flows to test
- Test scenarios defined

### Step 2: Check Existing Fixtures
**IMPORTANT**: Before generating tests, check `fixtures/pages.ts`:
- If it exists, read it to see which page fixtures are already defined
- Note which page objects are available as fixtures (e.g., `dashboardPage`, `tasksPage`)
- Plan to add new page objects to the fixtures file

### Step 3: Generate Page Objects
For each page in the plan:

```typescript
import { Page, Locator } from '@playwright/test';

export class [Name]Page {
  readonly page: Page;
  // Locators from the plan

  constructor(page: Page) {
    this.page = page;
    // Initialize locators using semantic selectors
  }

  // Actions from the plan
  async [actionName](): Promise<void> {
    // Implementation
  }
}
```

### Step 4: Update Fixtures
Add new page objects to `fixtures/pages.ts`:

```typescript
import { [Name]Page } from '../pages/[Name]Page';

// Add to PageFixtures type
type PageFixtures = {
  // ... existing fixtures
  [name]Page: [Name]Page;
};

// Add fixture definition
export const test = base.extend<PageFixtures>({
  // ... existing fixtures
  [name]Page: async ({ page }, use) => {
    const pageObj = new [Name]Page(page);
    await use(pageObj);
  },
});
```

### Step 5: Generate Tests Using Fixtures
**PREFERRED**: When fixtures are available, use them instead of manual instantiation:

```typescript
// PREFERRED: Import from fixtures
import { test, expect } from '../fixtures/pages.js';

test.describe('[Feature]', { tag: ['@e2e'] }, () => {
  test('[scenario name]', async ({ [name]Page }) => {
    await [name]Page.goto();
    // Test steps using the fixture
  });
});
```

```typescript
// AVOID: Manual instantiation (only if no fixture exists)
import { test, expect } from '@playwright/test';
import { [Name]Page } from '../pages/[Name]Page';

test.describe('[Feature]', { tag: ['@e2e'] }, () => {
  let page: [Name]Page;

  test.beforeEach(async ({ page: p }) => {
    page = new [Name]Page(p);
  });
});
```

### Step 6: Required Test Patterns (MUST Generate)

For EACH page in the plan, you MUST generate these test patterns.

Every sample below follows the gate in `specs/GENERATOR-GATE.md`: only
`getByRole`, `getByLabel`, `getByTestId` and `getByText`, no fixed waits, and
one assertion on what the user can see. Replace the placeholders with what the
plan recorded: the exact messages, the exact labels, the test ids.

#### A. Empty State Test (Required)
```typescript
test.describe('[Feature] empty state', { tag: ['@empty'] }, () => {
  test('shows the empty state when there is no data', async ({ page }) => {
    await page.goto('[page-url]');
    // The message the user reads when the list is empty.
    await expect(page.getByText('[the empty state message from the plan]')).toBeVisible();
  });
});
```

#### B. Form Validation Tests (Required for each form)
```typescript
test.describe('[Feature] form validation', { tag: ['@validation'] }, () => {
  test('shows the validation error on an empty submit', async ({ page }) => {
    await page.goto('[form-page-url]');
    await page.getByRole('button', { name: /submit|save|send|create/i }).click();
    // The error message the user reads, from the plan.
    await expect(page.getByText('[the exact error message from the plan]')).toBeVisible();
  });

  test('rejects an invalid email', async ({ page }) => {
    await page.goto('[form-page-url]');
    await page.getByLabel(/email/i).fill('notanemail');
    await page.getByRole('button', { name: /submit|save|send/i }).click();
    await expect(page.getByText('[the exact email error from the plan]')).toBeVisible();
  });
});
```

#### C. Toggle/Interaction Tests (Required when toggles exist)
```typescript
test.describe('[Feature] interaction', { tag: ['@interaction'] }, () => {
  test('the switch changes the setting it controls', async ({ page }) => {
    await page.goto('[page-with-toggle]');
    const toggle = page.getByRole('switch');
    const wasChecked = await toggle.isChecked();
    await toggle.click();
    await expect(toggle).toBeChecked({ checked: !wasChecked });
    // When the toggle changes something the user sees, assert that too.
    await expect(page.getByText('[what the user sees change]')).toBeVisible();
  });
});
```

#### D. Loading/Async State Tests (Required when async operations exist)
```typescript
test.describe('[Feature] loading state', { tag: ['@e2e'] }, () => {
  test('shows the loading state and then the result', async ({ page }) => {
    await page.goto('[form-page]');
    const submitBtn = page.getByRole('button', { name: /submit|save|send/i });
    await submitBtn.click();
    // The label the button carries while the request runs.
    await expect(submitBtn).toHaveText(/signing in|loading|processing|submitting/i);
    // And the outcome that follows it.
    await expect(page.getByText('[the result the user sees]')).toBeVisible();
  });
});
```

#### E. Confirmation/Destructive Action Tests (Required when delete actions exist)
```typescript
test.describe('[Feature] destructive action', { tag: ['@critical'] }, () => {
  test('delete asks first, and cancel keeps the item', async ({ page }) => {
    await page.goto('[page-with-delete]');
    const items = page.getByTestId('[the item test id from the plan]');
    const countBefore = await items.count();
    await page.getByRole('button', { name: /delete|remove/i }).first().click();
    // The confirmation the user has to answer.
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /cancel/i }).click();
    await expect(items).toHaveCount(countBefore);
  });
});
```

#### F. Date/Time Picker Tests (When component exists)
```typescript
test.describe('[Feature] date picker', { tag: ['@e2e'] }, () => {
  test('date picker opens, selects a date, closes', async ({ page }) => {
    await page.goto('[page-with-datepicker]');
    const dateInput = page.getByLabel(/date/i).first();
    await dateInput.click();
    const calendar = page.getByRole('dialog');
    await expect(calendar).toBeVisible();
    await calendar.getByRole('button', { name: /1[5-9]/ }).first().click();
    // The chosen date is in the field.
    await expect(dateInput).toHaveValue(/\d/);
  });
});
```

#### G. File Upload Tests (When component exists)
```typescript
test.describe('[Feature] file upload', { tag: ['@e2e'] }, () => {
  test('file upload rejects a file of the wrong type', async ({ page }) => {
    await page.goto('[page-with-upload]');
    const uploadInput = page.getByLabel(/file|upload/i).first();
    await uploadInput.setInputFiles({ name: 'test.exe', mimeType: 'application/x-msdownload' });
    await expect(page.getByText('[the message the user reads]')).toBeVisible();
  });
});
```

#### H. Autocomplete Tests (When component exists)
```typescript
test.describe('[Feature] autocomplete', { tag: ['@e2e'] }, () => {
  test('autocomplete suggests a value and fills the field', async ({ page }) => {
    await page.goto('[page-with-autocomplete]');
    const input = page.getByRole('combobox');
    await input.fill('ab');
    const suggestion = page.getByRole('option').first();
    await expect(suggestion).toBeVisible();
    await suggestion.click();
    // The field carries the suggestion now.
    await expect(input).toHaveValue(/ab/);
  });
});
```

#### I. Infinite Scroll Tests (When component exists)
```typescript
test.describe('[Feature] infinite scroll', { tag: ['@e2e'] }, () => {
  test('infinite scroll loads more items', async ({ page }) => {
    await page.goto('[page-with-infinite-scroll]');
    const items = page.getByTestId('[the item test id from the plan]');
    const countBefore = await items.count();
    await page.getByRole('button', { name: /load more/i }).click();
    // Wait for the count to grow - never pause for a fixed time
    await expect.poll(async () => items.count()).toBeGreaterThan(countBefore);
  });
});
```

#### J. Toast Notification Tests (When component exists)
```typescript
test.describe('[Feature] toast notification', { tag: ['@e2e'] }, () => {
  test('the toast appears and then disappears', async ({ page }) => {
    await page.goto('[page-with-toast]');
    await page.getByRole('button', { name: /[the action that shows the toast]/i }).click();
    const toast = page.getByRole('alert');
    await expect(toast).toBeVisible();
    // The toast goes away on its own.
    await expect(toast).toBeHidden();
  });
});
```

#### K. Keyboard Navigation Tests (Recommended for all pages)
```typescript
test.describe('[Feature] keyboard navigation', { tag: ['@a11y'] }, () => {
  test('the form can be filled and sent with the keyboard alone', async ({ page }) => {
    await page.goto('[page-url]');
    await page.getByLabel(/email/i).focus();
    await page.keyboard.type('demo@example.com');
    await page.keyboard.press('Tab');
    await page.keyboard.type('password123');
    await page.keyboard.press('Enter');
    // The same result a mouse click gives.
    await expect(page.getByText('[the result the user sees]')).toBeVisible();
  });
});
```

#### L. Password Strength Tests (When component exists)
```typescript
test.describe('[Feature] password strength', { tag: ['@e2e'] }, () => {
  test('the strength indicator follows the password', async ({ page }) => {
    await page.goto('[page-with-password-input]');
    const passwordInput = page.getByLabel(/password/i);
    await passwordInput.fill('weak');
    await expect(page.getByText('[the weak label from the plan]')).toBeVisible();
    await passwordInput.fill('VeryStrongP@ssw0rd!');
    await expect(page.getByText('[the strong label from the plan]')).toBeVisible();
  });
});
```

## Locator Priority (IMPORTANT)
1. `page.getByRole()` - Best for accessibility
2. `page.getByLabel()` - Great for form fields
3. `page.getByTestId()` - For custom test IDs
4. `page.getByText()` - For unique text content

NEVER use: CSS selectors, XPath, or brittle locators. A `page.locator()` call
with a CSS selector is a CSS selector: use `getByTestId` instead.

## Test Tags (REQUIRED)

Every generated test must have at least one tag. Use the `tag` option of
`test.describe`:

```typescript
test.describe('Checkout', { tag: ['@e2e', '@critical'] }, () => {
  test('applies the discount code', async ({ page }) => {
```

| Tag | When to apply |
|-----|---------------|
| `@smoke` | Core happy-path scenarios that run on every deploy |
| `@critical` | Business-critical flows (payments, auth, data integrity) |
| `@e2e` | Full end-to-end multi-step journeys |
| `@slow` | Tests expected to take more than 10 seconds |
| `@validation` | Tests that verify form validation errors |
| `@empty` | Tests that verify empty state behavior |
| `@a11y` | Tests that verify keyboard navigation and accessibility |
| `@interaction` | Tests that verify toggle/checkbox/tab interactions |

This is the one vocabulary. `specs/GENERATOR-GATE.md`, `README.md` and
`docs/QUICK-REFERENCE.md` list the same tags.

## Review Rules

The output of this Agent is reviewed against `specs/GENERATOR-GATE.md`:
no hard-coded waits, semantic locators only, a tag on every test, and at
least one assertion that checks a business-visible outcome. The samples in
Step 6 follow those rules: copy their shape.

## Completion Signal
When done, create file: `.spectra/output/tests/.complete`
