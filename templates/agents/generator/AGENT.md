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

For EACH page in the plan, you MUST generate these test patterns:

#### A. Empty State Test (Required)
```typescript
test.describe('[Feature] empty state', { tag: ['@empty'] }, () => {
  test('shows empty state when no data', async ({ page }) => {
    await page.goto('[page-url]');
    // Look for any empty state message (use text patterns from the plan)
    const emptyPatterns = ['no items', 'no results', 'empty', 'nothing here', 'no data'];
    const emptyLocator = page.locator(emptyPatterns.map(p => `text="${p}"`).join(', '));
    // At minimum, check the page loads without crashing
    await expect(page).toHaveURL(/[page-url]/);
  });
});
```

#### B. Form Validation Tests (Required for each form)
```typescript
test.describe('[Feature] form validation', { tag: ['@validation'] }, () => {
  test('shows validation error on empty submit', async ({ page }) => {
    await page.goto('[form-page-url]');
    // Find and click submit button
    const submitBtn = page.getByRole('button', { name: /submit|save|send|create/i });
    await submitBtn.click();
    // Look for validation messages or aria-invalid fields
    const errorLocator = page.locator('[aria-invalid="true"], .error, .field-error, text=/error|required|invalid/i');
    await expect(errorLocator.first()).toBeVisible({ timeout: 3000 });
  });

  test('validates email format', async ({ page }) => {
    await page.goto('[form-page-url]');
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('notanemail');
    await page.getByRole('button', { name: /submit|save|send/i }).click();
    // Look for email validation error (use exact message from plan if available)
    await expect(page.locator('text=/valid email|invalid email|email format|not valid/i')).toBeVisible({ timeout: 3000 });
  });
});
```

#### C. Toggle/Interaction Tests (Required when toggles exist)
```typescript
test.describe('[Feature] interaction', { tag: ['@interaction'] }, () => {
  test('checkbox toggles state', async ({ page }) => {
    await page.goto('[page-with-checkbox]');
    const checkbox = page.getByRole('checkbox').first();
    const wasChecked = await checkbox.isChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked({ checked: !wasChecked });
  });
});
```

#### D. Loading/Async State Tests (Required when async operations exist)
```typescript
test.describe('[Feature] loading state', { tag: ['@e2e'] }, () => {
  test('button disables during submit', async ({ page }) => {
    await page.goto('[form-page]');
    const submitBtn = page.getByRole('button', { name: /submit|save|send/i });
    await submitBtn.click();
    // Button should be disabled or show loading state during processing
    await expect(submitBtn).toBeDisabled();
  });
});
```

#### E. Confirmation/Destructive Action Tests (Required when delete actions exist)
```typescript
test.describe('[Feature] destructive action', { tag: ['@critical'] }, () => {
  test('delete requires confirmation, cancel preserves data', async ({ page }) => {
    await page.goto('[page-with-delete]');
    const itemCountBefore = await page.locator('[data-testid*="item"]').count();
    const deleteBtn = page.getByRole('button', { name: /delete|remove/i }).first();
    await deleteBtn.click();
    // Check if dialog appears
    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible()) {
      await page.getByRole('button', { name: /cancel/i }).click();
      await expect(page.locator('[data-testid*="item"]')).toHaveCount(itemCountBefore);
    }
  });
});
```

#### F. Date/Time Picker Tests (When component exists)
```typescript
test.describe('[Feature] date picker', { tag: ['@e2e'] }, () => {
  test('date picker opens, selects date, closes', async ({ page }) => {
    await page.goto('[page-with-datepicker]');
    const dateInput = page.locator('input[type="date"], [aria-label*="date" i]').first();
    await dateInput.click();
    // If calendar popup appears, select a date
    const calendar = page.locator('.calendar, [role="dialog"], [aria-label*="calendar" i]');
    if (await calendar.isVisible({ timeout: 2000 })) {
      const day = page.locator('button:not([disabled])').filter({ hasText: /1[5-9]/ }).first();
      await day.click();
    }
    await expect(dateInput).not.toBeEmpty();
  });
});
```

#### G. File Upload Tests (When component exists)
```typescript
test.describe('[Feature] file upload', { tag: ['@e2e'] }, () => {
  test('file upload shows error for invalid type', async ({ page }) => {
    await page.goto('[page-with-upload]');
    const uploadInput = page.locator('input[type="file"]');
    if (await uploadInput.isVisible()) {
      // Create a fake file and try to upload
      await uploadInput.setInputFiles({ name: 'test.exe', mimeType: 'application/x-msdownload' });
      // Check for error message
      await expect(page.locator('text=/invalid|type.*not supported|not allowed/i')).toBeVisible({ timeout: 3000 });
    }
  });
});
```

#### H. Autocomplete Tests (When component exists)
```typescript
test.describe('[Feature] autocomplete', { tag: ['@e2e'] }, () => {
  test('autocomplete shows suggestions as user types', async ({ page }) => {
    await page.goto('[page-with-autocomplete]');
    const input = page.getByRole('combobox, textbox').filter({ has: page.locator('input') }).first();
    await input.fill('ab');
    // Wait for suggestions dropdown
    const suggestions = page.locator('[role="option"], [role="listbox"] li, .suggestions li');
    await expect(suggestions.first()).toBeVisible({ timeout: 3000 });
    // Select first suggestion
    await suggestions.first().click();
    // Verify input was filled
    await expect(input).not.toBeEmpty();
  });
});
```

#### I. Infinite Scroll Tests (When component exists)
```typescript
test.describe('[Feature] infinite scroll', { tag: ['@e2e'] }, () => {
  test('infinite scroll loads more items', async ({ page }) => {
    await page.goto('[page-with-infinite-scroll]');
    const loadMore = page.getByRole('button', { name: /load more/i });
    const itemsBefore = await page.locator('[data-testid*="item"], .item, li').count();
    if (await loadMore.isVisible()) {
      await loadMore.click();
    }
    // Or try scrolling
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Wait for the count to grow - never pause for a fixed time
    await expect
      .poll(async () => page.locator('[data-testid*="item"], .item, li').count())
      .toBeGreaterThan(itemsBefore);
  });
});
```

#### J. Toast Notification Tests (When component exists)
```typescript
test.describe('[Feature] toast notification', { tag: ['@e2e'] }, () => {
  test('toast appears and auto-dismisses', async ({ page }) => {
    await page.goto('[page-with-toast]');
    // Trigger action that shows toast (if known)
    // Otherwise just verify toast container exists
    const toast = page.locator('.toast, [role="alert"], .notification');
    // If no way to trigger, just check container exists
    if (await toast.count() > 0) {
      await expect(toast.first()).toBeVisible({ timeout: 2000 });
    }
  });
});
```

#### K. Keyboard Navigation Tests (Recommended for all pages)
```typescript
test.describe('[Feature] keyboard navigation', { tag: ['@a11y'] }, () => {
  test('keyboard navigation works through interactive elements', async ({ page }) => {
    await page.goto('[page-url]');
    // Get all interactive elements
    const interactive = page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstEl = interactive.first();
    await firstEl.focus();
    // Press Tab repeatedly
    await page.keyboard.press('Tab');
    // Verify focus moved (focused element should be different or last tab was trapped)
    const focusedEl = page.locator(':focus');
    await expect(focusedEl).toBeVisible();
  });
});
```

#### L. Password Strength Tests (When component exists)
```typescript
test.describe('[Feature] password strength', { tag: ['@e2e'] }, () => {
  test('password strength indicator updates as user types', async ({ page }) => {
    await page.goto('[page-with-password-input]');
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('weak');
    // Check for strength indicator
    const strength = page.locator('[class*="strength"], .password-strength, [aria-label*="strength" i]');
    if (await strength.isVisible()) {
      await expect(strength).toBeVisible();
    }
    // Type stronger password
    await passwordInput.fill('VeryStrongP@ssw0rd!');
    await expect(strength).toBeVisible();
  });
});
```

## Locator Priority (IMPORTANT)
1. `page.getByRole()` - Best for accessibility
2. `page.getByLabel()` - Great for form fields
3. `page.getByTestId()` - For custom test IDs
4. `page.getByText()` - For unique text content

NEVER use: CSS selectors, XPath, or brittle locators

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

## Review Rules

The output of this Agent is reviewed against `specs/GENERATOR-GATE.md`:
no hard-coded waits, semantic locators only, a tag on every test, and at
least one assertion that checks a business-visible outcome.

## Completion Signal
When done, create file: `.spectra/output/tests/.complete`
