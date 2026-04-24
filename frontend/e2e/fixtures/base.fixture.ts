import { test as base, Page, expect } from '@playwright/test';
import { GraphQLClient } from '../helpers/api-client';

/**
 * Test user credentials for E2E testing
 */
export interface TestUser {
  email: string;
  password: string;
  id?: string;
}

/**
 * Fixture extensions for Playwright tests
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Fixtures = {
  authenticatedPage: Page;
  apiClient: GraphQLClient;
  testUser: TestUser;
};

/**
 * Authenticated page fixture - logs in user and waits for Apollo cache ready
 */
const authenticatedPageFixture = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page, context }, use) => {
    // Get test user credentials
    const testUser: TestUser = {
      email: process.env.TEST_EMAIL || 'test@example.com',
      password: process.env.TEST_PASSWORD || 'TestPassword123!',
    };

    // Navigate to home page (unprotected) and clear state
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Reload to get fresh state
    await page.reload({ waitUntil: 'domcontentloaded' });
    
    // Add small pause for page to fully render
    await page.waitForTimeout(500);
    
    // Click login link to navigate to login form
    const loginLink = page.locator('[data-testid="home-login-link"]');
    await loginLink.waitFor({ state: 'visible', timeout: 10000 });
    await loginLink.click();
    
    // Add pause for login page to render
    await page.waitForTimeout(500);

    // Wait for login form elements to be visible
    const emailInput = page.locator('[data-testid="email-input"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });

    // Fill form
    await emailInput.fill(testUser.email);
    await emailInput.blur();
    await page.waitForTimeout(100);

    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
    await passwordInput.fill(testUser.password);
    await passwordInput.blur();
    await page.waitForTimeout(100);

    // Submit
    const submitButton = page.locator('[data-testid="submit-button"]');
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Start listening for redirect BEFORE click
    const urlChangePromise = page.waitForURL(/.*\/dashboard/, { timeout: 20000 });
    await submitButton.click();
    
    // Wait for redirect
    try {
      await urlChangePromise;
    } catch (err) {
      console.error('Dashboard redirect failed:', err);
      throw err;
    }

    // Wait for JWT token in localStorage
    await page.waitForFunction(
      () => {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('apollo_token');
        return token && token.length > 0;
      },
      { timeout: 10000 }
    );

    // Use the authenticated page
    await use(page);

    // Cleanup - clear localStorage after test
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
  },
});

/**
 * GraphQL API client fixture - provides authenticated GraphQL client
 */
const apiClientFixture = authenticatedPageFixture.extend<{ apiClient: GraphQLClient }>({
  apiClient: async ({ page }, use) => {
    // Extract JWT token from localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('auth_token') || localStorage.getItem('apollo_token') || '';
    });

    const baseURL = process.env.GRAPHQL_URL || 'http://localhost:4000';
    const client = new GraphQLClient(baseURL, token);

    await use(client);

    // Cleanup
    client.clearToken();
  },
});

/**
 * Test user fixture - provides test credentials
 */
const testUserFixture = apiClientFixture.extend<{ testUser: TestUser }>({
  testUser: async ({}, use) => {
    const testUser: TestUser = {
      email: process.env.TEST_EMAIL || 'test@example.com',
      password: process.env.TEST_PASSWORD || 'TestPassword123!',
      id: `test-user-${Date.now()}`,
    };

    await use(testUser);

    // Cleanup happens in apiClient fixture
  },
});

export const test = testUserFixture;
export { expect };
