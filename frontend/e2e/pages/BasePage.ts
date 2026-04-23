import { Page } from '@playwright/test';

/**
 * Base page object class providing common interactions
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a URL
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string) {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout, state: 'visible' });
  }

  /**
   * Wait for test ID element to be visible
   */
  async waitForTestId(testId: string, timeout = 10000): Promise<void> {
    await this.getByTestId(testId).waitFor({ state: 'visible', timeout });
  }

  /**
   * Click element by test ID
   */
  async clickByTestId(testId: string): Promise<void> {
    await this.getByTestId(testId).click();
  }

  /**
   * Fill input by test ID
   */
  async fillByTestId(testId: string, text: string): Promise<void> {
    await this.getByTestId(testId).fill(text);
  }

  /**
   * Get text of element by test ID
   */
  async getTextByTestId(testId: string): Promise<string> {
    return this.getByTestId(testId).textContent() || '';
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 2000, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for network requests to complete
   */
  async waitForNetworkIdle(timeout = 10000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Reload page
   */
  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'networkidle' });
  }
}
