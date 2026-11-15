import type { Locator, Page } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly cartButton: Locator;
  readonly searchInput: Locator;
  readonly categoryCombobox: Locator;
  readonly priceRangeLabel: Locator;
  readonly noProductsMessage: Locator;
  readonly productCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Products', level: 1 });
    this.cartButton = page.getByRole('button', { name: /cart/i });
    this.searchInput = page.getByPlaceholder('Search products...');
    this.categoryCombobox = page
      .getByRole('combobox', { name: /category|all categories/i })
      .or(page.getByRole('combobox').first());
    this.priceRangeLabel = page.getByText(/Price Range:/);
    this.noProductsMessage = page.getByText('No products found');
    this.productCards = page.getByRole('button', { name: /add to cart/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/products');
  }
}
