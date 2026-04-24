import { Page } from '@playwright/test';

/**
 * Base page object class providing common interactions
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a URL
   * Uses 'domcontentloaded' instead of 'networkidle' to avoid timeout
   * on pages with polling/real-time connections
   */
  async goto(url: string, options?: { timeout?: number }): Promise<void> {
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',  // DOM is ready, don't wait for all network requests
      timeout: options?.timeout || 15000,  // 15 second timeout
    });
    
    // Additional wait for Next.js hydration to complete
    await this.page.waitForFunction(
      () => {
        // Check if Next.js has hydrated
        return (window as any).__NEXT_DATA__ && (window as any).__NEXT_DATA__.isReady !== false;
      },
      { timeout: 5000 }
    ).catch(() => {
      // Hydration check might fail on non-Next.js pages, that's ok
      return true;
    });
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
   * Click element by test ID with explicit waits
   */
  async clickByTestId(testId: string): Promise<void> {
    const element = this.getByTestId(testId);
    
    // Wait for visibility
    await element.waitFor({ state: 'visible', timeout: 5000 });
    
    // For button elements, wait for enabled state
    await element.waitFor({ state: 'enabled', timeout: 5000 });
    
    // Click
    await element.click();
  }

  /**
   * Fill input by test ID with explicit waits for interactivity
   */
  async fillByTestId(testId: string, text: string): Promise<void> {
    const element = this.getByTestId(testId);
    
    // Wait for visibility
    await element.waitFor({ state: 'visible', timeout: 5000 });
    
    // For input elements, wait for enabled state
    await element.waitFor({ state: 'enabled', timeout: 5000 });
    
    // Focus, clear, and fill
    await element.focus();
    await element.clear();
    await element.fill(text);
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
