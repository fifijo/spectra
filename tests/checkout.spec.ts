import { expect, test } from '../fixtures/pages.js';

test.describe('Checkout wizard', { tag: ['@e2e', '@critical'] }, () => {
  test('back disabled on first step; total matches summary; place order succeeds', async ({
    checkoutPage,
  }) => {
    await checkoutPage.goto();
    await expect(checkoutPage.heading).toBeVisible();
    await expect(checkoutPage.backButton).toBeDisabled();
    await expect(checkoutPage.stepCard('address')).toBeVisible();

    const expectedTotal = (499.98 + 9.99 + 499.98 * 0.08).toFixed(2);
    await expect(checkoutPage.orderTotal).toHaveText(`$${expectedTotal}`);

    await checkoutPage.fillAddressMinimal();
    await checkoutPage.clickNext();
    await expect(checkoutPage.stepCard('payment')).toBeVisible();
    await expect(checkoutPage.stepCard('address')).toHaveCount(0);

    await checkoutPage.fillPaymentMinimal();
    await checkoutPage.clickNext();
    await expect(checkoutPage.stepCard('confirm')).toBeVisible();

    await expect(checkoutPage.backButton).toBeEnabled();
    await checkoutPage.placeOrder();
    await expect(checkoutPage.orderSuccessCard).toBeVisible({ timeout: 15000 });
    await expect(checkoutPage.orderSuccessCard).toContainText('ORD-2024-001234');
    await expect(checkoutPage.orderSuccessCard).toContainText('test@example.com');

    await checkoutPage.continueShopping();
    await expect(checkoutPage.page).toHaveURL(/\/products$/);
  });
});
