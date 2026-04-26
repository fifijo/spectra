import type { Locator, Page } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly cartButton: Locator;
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly priceSlider: Locator;
  readonly productsGrid: Locator;
  readonly filtersCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Products' });
    this.cartButton = page.getByTestId('cart-button');
    this.searchInput = page.getByTestId('search-input');
    this.categorySelect = page.getByTestId('category-select');
    this.priceSlider = page.getByTestId('price-slider');
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

  /** Nudge price range via the slider thumb (dummy app uses a single Radix thumb for [min,max]). */
  async nudgePriceSliderDown(): Promise<void> {
    const thumb = this.priceSlider.getByRole('slider');
    await thumb.focus();
    await thumb.press('ArrowLeft');
    await thumb.press('ArrowLeft');
    await thumb.press('ArrowLeft');
  }
}
