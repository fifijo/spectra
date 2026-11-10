import type { Locator, Page } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly cartButton: Locator;
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly priceSlider: Locator;
  readonly priceRangeLabel: Locator;
  readonly productsGrid: Locator;
  readonly filtersCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Products' });
    this.cartButton = page.getByTestId('cart-button');
    this.searchInput = page.getByTestId('search-input');
    this.categorySelect = page.getByTestId('category-select');
    this.priceSlider = page.getByTestId('price-slider');
    this.priceRangeLabel = page.getByText(/Price Range: \$/);
    this.productsGrid = page.getByTestId('products-grid');
    this.filtersCard = page.getByTestId('filters-card');
  }

  async goto(): Promise<void> {
    await this.page.goto('/products');
  }

  productCard(productId: number): Locator {
    return this.page.getByTestId(`product-card-${productId}`);
  }

  addToCartButton(productId: number): Locator {
    return this.page.getByTestId(`add-to-cart-${productId}`);
  }

  async selectCategory(name: string): Promise<void> {
    await this.categorySelect.click();
    await this.page.getByRole('option', { name }).click();
  }

  /** Lower the maximum of the price range by one step. */
  async lowerPriceCeiling(): Promise<void> {
    const thumbs = this.priceSlider.getByRole('slider');
    await thumbs.nth(1).focus();
    await thumbs.nth(1).press('ArrowLeft');
  }
}
