import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for login page interactions
 */
export class LoginPage extends BasePage {
  /**
   * Get email input element
   */
  readonly emailInput = () => this.getByTestId('email-input');

  /**
   * Get password input element
   */
  readonly passwordInput = () => this.getByTestId('password-input');

  /**
   * Get submit button element
   */
  readonly submitButton = () => this.getByTestId('submit-button');

  /**
   * Get error message element
   */
  readonly errorMessage = () => this.getByTestId('error-message');

  /**
   * Get loading indicator
   */
  readonly loadingIndicator = () => this.getByTestId('loading-indicator');

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await super.goto('/login');
    await this.waitForElement('[data-testid="email-input"]', 10000);
  }

  /**
   * Perform login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillByTestId('email-input', email);
    await this.fillByTestId('password-input', password);
    await this.clickByTestId('submit-button');

    // Wait for JWT token to be set
    await this.page.waitForFunction(
      () => {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('apollo_token');
        return token && token.length > 0;
      },
      { timeout: 15000 }
    );
  }

  /**
   * Perform login and wait for redirect
   */
  async loginAndWaitForRedirect(email: string, password: string, expectedUrl = '/dashboard'): Promise<void> {
    await this.login(email, password);
    await this.page.waitForURL(`**${expectedUrl}**`, { timeout: 15000 });
  }

  /**
   * Expect error message to be visible
   */
  async expectErrorMessage(message: string): Promise<void> {
    const error = this.errorMessage();
    await error.waitFor({ state: 'visible', timeout: 5000 });
    await expect(error).toContainText(message);
  }

  /**
   * Expect no error message
   */
  async expectNoError(): Promise<void> {
    const error = this.errorMessage();
    await expect(error).not.toBeVisible();
  }

  /**
   * Expect loading indicator
   */
  async expectLoading(): Promise<void> {
    const loading = this.loadingIndicator();
    await loading.waitFor({ state: 'visible', timeout: 2000 });
  }

  /**
   * Expect loading to complete
   */
  async expectLoadingComplete(): Promise<void> {
    const loading = this.loadingIndicator();
    await loading.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Check if form is ready
   */
  async isFormReady(): Promise<boolean> {
    return (
      (await this.isVisible('[data-testid="email-input"]')) &&
      (await this.isVisible('[data-testid="password-input"]')) &&
      (await this.isVisible('[data-testid="submit-button"]'))
    );
  }
}
