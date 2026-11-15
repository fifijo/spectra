import type { Locator, Page } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addressStep: Locator;
  readonly paymentStep: Locator;
  readonly confirmStep: Locator;
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly saveAddressCheckbox: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly streetInput: Locator;
  readonly cityInput: Locator;
  readonly stateCombobox: Locator;
  readonly zipInput: Locator;
  readonly cardNameInput: Locator;
  readonly cardNumberInput: Locator;
  readonly expiryInput: Locator;
  readonly cvcInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Checkout', level: 1 });
    this.addressStep = page.getByText('Shipping Address');
    this.paymentStep = page.getByText('Payment Details');
    this.confirmStep = page.getByText('Confirm', { exact: true }).first();
    this.nextButton = page.getByRole('button', { name: /next/i });
    this.backButton = page.getByRole('button', { name: /back/i });
    this.saveAddressCheckbox = page.getByLabel(/save this address/i);
    this.firstNameInput = page.getByLabel(/first name/i);
    this.lastNameInput = page.getByLabel(/last name/i);
    this.emailInput = page.getByLabel(/email/i);
    this.phoneInput = page.getByLabel(/phone/i);
    this.streetInput = page.getByLabel(/street address|address/i);
    this.cityInput = page.getByLabel(/city/i);
    this.stateCombobox = page
      .getByRole('combobox', { name: /state|select/i })
      .or(page.getByRole('combobox').first());
    this.zipInput = page.getByLabel(/zip/i);
    this.cardNameInput = page.getByLabel(/name on card/i);
    this.cardNumberInput = page.getByLabel(/card number/i);
    this.expiryInput = page.getByLabel(/expiry/i);
    this.cvcInput = page.getByLabel(/cvc|cvv/i);
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout');
  }
}
