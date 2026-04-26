import type { Locator, Page } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly checkoutSteps: Locator;
  readonly backButton: Locator;
  readonly nextButton: Locator;
  readonly placeOrderButton: Locator;
  readonly orderSummaryCard: Locator;
  readonly orderTotal: Locator;
  readonly orderSuccessCard: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Checkout' });
    this.checkoutSteps = page.getByTestId('checkout-steps');
    this.backButton = page.getByTestId('back-button');
    this.nextButton = page.getByTestId('next-button');
    this.placeOrderButton = page.getByTestId('place-order-button');
    this.orderSummaryCard = page.getByTestId('order-summary-card');
    this.orderTotal = page.getByTestId('order-total');
    this.orderSuccessCard = page.getByTestId('order-success-card');
    this.continueShoppingButton = page.getByTestId('continue-shopping-button');
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout');
  }

  stepIndicator(step: 'address' | 'payment' | 'confirm'): Locator {
    return this.page.getByTestId(`step-${step}`);
  }

  async fillAddressMinimal(): Promise<void> {
    await this.page.getByTestId('first-name-input').fill('Test');
    await this.page.getByTestId('last-name-input').fill('User');
    await this.page.getByTestId('checkout-email-input').fill('test@example.com');
    await this.page.getByTestId('phone-input').fill('5551234567');
    await this.page.getByTestId('address-input').fill('123 Main St');
    await this.page.getByTestId('city-input').fill('Austin');
    await this.page.getByTestId('state-select').click();
    await this.page.getByRole('option', { name: 'Texas' }).click();
    await this.page.getByTestId('zip-input').fill('78701');
  }

  async fillPaymentMinimal(): Promise<void> {
    await this.page.getByTestId('card-name-input').fill('Test User');
    await this.page.getByTestId('card-number-input').fill('4242424242424242');
    await this.page.getByTestId('expiry-input').fill('12/30');
    await this.page.getByTestId('cvc-input').fill('123');
  }

  async clickNext(): Promise<void> {
    await this.nextButton.click();
  }

  async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }
}
