import { expect, test } from '../fixtures/pages.js';

test.describe('Login form validation', { tag: ['@validation', '@critical'] }, () => {
  test('shows required field errors on empty submit', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.submitEmpty();
    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.passwordError).toBeVisible();
  });
});

test.describe('Login interaction', { tag: ['@interaction', '@e2e'] }, () => {
  test('remember me switch toggles', async ({ loginPage }) => {
    await loginPage.goto();
    const toggle = loginPage.rememberMeSwitch;
    const wasChecked = await toggle.isChecked();
    await toggle.click();
    await expect(toggle).toBeChecked({ checked: !wasChecked });
  });
});

test.describe('Login keyboard navigation', { tag: ['@a11y'] }, () => {
  test('form fields can be focused and typed with keyboard', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.emailInput.focus();
    await loginPage.page.keyboard.type('demo@example.com');
    await expect(loginPage.emailInput).toHaveValue('demo@example.com');
    await loginPage.passwordInput.focus();
    await loginPage.page.keyboard.type('password123');
    await expect(loginPage.passwordInput).toHaveValue('password123');
  });
});
