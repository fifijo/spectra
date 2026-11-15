import { expect, test } from '../fixtures/pages.js';

test.describe('Products empty state', { tag: ['@empty', '@smoke'] }, () => {
  test('shows no products found for impossible search', async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.searchInput.fill('zzzznonexistent');
    await expect(productsPage.noProductsMessage).toBeVisible();
  });
});

test.describe('Products interaction', { tag: ['@interaction', '@e2e'] }, () => {
  test('price range label is visible', async ({ productsPage }) => {
    await productsPage.goto();
    await expect(productsPage.priceRangeLabel).toBeVisible();
  });
});
