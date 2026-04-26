import { test, expect } from '../fixtures/pages';

test.describe('Login', { tag: ['@e2e'] }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('shows validation errors for empty submit', async ({ loginPage }) => {
    await loginPage.submitEmpty();
    await expect(loginPage.emailError).toHaveText('Email is required');
    await expect(loginPage.passwordError).toHaveText('Password is required');
  });

  test('rejects invalid email format', async ({ loginPage }) => {
    await loginPage.emailInput.fill('notanemail');
    await loginPage.passwordInput.fill('password123');
    await loginPage.emailInput.evaluate((el: HTMLInputElement) => {
      el.type = 'text';
    });
    await loginPage.loginSubmit.click();
    await expect(loginPage.emailError).toHaveText('Please enter a valid email');
  });

  test('rejects short password when email is valid', async ({ loginPage }) => {
    await loginPage.signIn('user@example.com', '12345');
    await expect(loginPage.passwordError).toHaveText('Password must be at least 6 characters');
  });

  test('shows login error for wrong credentials', async ({ loginPage }) => {
    await loginPage.signIn('demo@example.com', 'wrongpassword');
    await expect(loginPage.loginError).toBeVisible();
    await expect(loginPage.loginError).toContainText('Invalid email or password');
  });

  test('shows loading state then success for demo user', async ({ loginPage }) => {
    await loginPage.emailInput.fill('demo@example.com');
    await loginPage.passwordInput.fill('password123');
    await loginPage.loginSubmit.click();

    await expect(loginPage.loginSubmit).toContainText('Signing in...', { timeout: 5000 });
    await expect(loginPage.loginSuccessCard).toBeVisible({ timeout: 10000 });
    await expect(loginPage.loginSuccessCard).toContainText('demo@example.com');

    await loginPage.logoutButton.click();
    await expect(loginPage.loginCard).toBeVisible();
  });

  test('password visibility toggle and remember switch are interactive', async ({ loginPage }) => {
    await loginPage.passwordInput.fill('secret');
    await loginPage.togglePassword.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
    await loginPage.togglePassword.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    await loginPage.rememberSwitch.click();
    await expect(loginPage.rememberSwitch).toBeChecked();
  });
});
