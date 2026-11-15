import { expect, test } from '../fixtures/pages.js';

test.describe('Checkout multi-step form', { tag: ['@critical', '@e2e'] }, () => {
  test('advances from address to payment and back', async ({ checkoutPage }) => {
    await checkoutPage.goto();
    await expect(checkoutPage.heading).toBeVisible();
    await expect(checkoutPage.addressStep).toBeVisible();
    await checkoutPage.nextButton.click();
    await expect(checkoutPage.paymentStep).toBeVisible();
    await expect(checkoutPage.cardNumberInput).toBeVisible();
    await checkoutPage.backButton.click();
    await expect(checkoutPage.addressStep).toBeVisible();
  });
});

test.describe('Checkout interaction', { tag: ['@interaction'] }, () => {
  test('save address checkbox toggles', async ({ checkoutPage }) => {
    await checkoutPage.goto();
    const checkbox = checkoutPage.saveAddressCheckbox;
    const wasChecked = await checkbox.isChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked({ checked: !wasChecked });
  });
});
