import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly rememberMeSwitch: Locator;
  readonly forgotPasswordButton: Locator;
  readonly passwordVisibilityButton: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Sign In' });
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.signInButton = page.getByRole('button', { name: /sign in/i });
    this.rememberMeSwitch = page.getByRole('switch', { name: /remember me/i });
    this.forgotPasswordButton = page.getByRole('button', { name: /forgot password/i });
    this.passwordVisibilityButton = page.getByRole('button', { name: /show|hide|password/i });
    this.emailError = page.getByText('Email is required');
    this.passwordError = page.getByText('Password is required');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async submitEmpty(): Promise<void> {
    await this.signInButton.click();
  }
}
