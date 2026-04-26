import { test, expect } from '../fixtures/pages';

test.describe('Products', { tag: ['@e2e'] }, () => {
  test('search, category filter, slider, and cart count', async ({ productsPage }) => {
    await productsPage.goto();
    await expect(productsPage.heading).toBeVisible();
    await expect(productsPage.filtersCard).toBeVisible();

    await productsPage.searchInput.fill('Wireless');
    await expect(productsPage.productsGrid.getByTestId('product-card-1')).toBeVisible();
    await expect(productsPage.productsGrid.getByTestId('product-card-2')).toHaveCount(0);

    await productsPage.searchInput.clear();
    await productsPage.selectCategory('Electronics');
    await expect(productsPage.productsGrid.getByTestId(/product-card-/)).toHaveCount(3);

    await productsPage.nudgePriceSliderDown();
    await productsPage.addToCartButton(1).click();
    await expect(productsPage.cartButton).toContainText('Cart (1)');
    await expect(productsPage.addToCartButton(1)).toBeDisabled();
  });
});
