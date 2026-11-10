import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly loginCard: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginSubmit: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly loginError: Locator;
  readonly loginSuccessCard: Locator;
  readonly logoutButton: Locator;
  readonly demoHint: Locator;
  readonly forgotPasswordLink: Locator;
  readonly togglePassword: Locator;
  readonly rememberSwitch: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginCard = page.getByTestId('login-card');
    this.emailInput = page.getByTestId('login-card').getByTestId('email-input');
    this.passwordInput = page.getByTestId('login-card').getByTestId('password-input');
    this.loginSubmit = page.getByTestId('login-submit');
    this.emailError = page.getByTestId('email-error');
    this.passwordError = page.getByTestId('password-error');
    this.loginError = page.getByTestId('login-error');
    this.loginSuccessCard = page.getByTestId('login-success-card');
    this.logoutButton = page.getByTestId('logout-button');
    this.demoHint = page.getByTestId('demo-hint');
    this.forgotPasswordLink = page.getByTestId('forgot-password-link');
    this.togglePassword = page.getByTestId('toggle-password');
    this.rememberSwitch = page.getByTestId('remember-switch');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async submitEmpty(): Promise<void> {
    await this.loginSubmit.click();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginSubmit.click();
  }
}
