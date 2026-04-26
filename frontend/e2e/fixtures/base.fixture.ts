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
    // eslint-disable-next-line react-hooks/rules-of-hooks
    // eslint-disable-next-line no-console
    console.log('[fixture] About to run test with authenticated page');
    
    await use(page);
    
    // Cleanup - clear localStorage after test
    // Note: Do NOT close the page here - Playwright manages page lifecycle
    try {
      if (!page.isClosed()) {
        await context.clearCookies();
        await page.evaluate(() => localStorage.clear());
      }
    } catch (err) {
      // Page might already be closed, that's ok
      // eslint-disable-next-line no-console
      console.warn('[fixture] Cleanup error (page may be closed):', err instanceof Error ? err.message : err);
    }
  },
});

/**
 * GraphQL API client fixture - provides authenticated GraphQL client
 */
const apiClientFixture = authenticatedPageFixture.extend<{ apiClient: GraphQLClient }>({
  apiClient: async ({ authenticatedPage }, use) => {
    // Extract JWT token from localStorage (authenticatedPage has already logged in)
    let token = '';
    
    try {
      // Try using page.evaluate() (works in most cases)
      token = await authenticatedPage.evaluate(() => {
        return localStorage.getItem('auth_token') || localStorage.getItem('apollo_token') || '';
      });
      if (token) {
        // eslint-disable-next-line no-console
        console.log('[apiClient] Token extracted via page.evaluate()');
      }
    } catch (error) {
      // Fallback for Firefox sandbox: try getting from context storage
      // eslint-disable-next-line no-console
      console.warn('[apiClient] page.evaluate() failed, trying context.cookies():', error instanceof Error ? error.message : error);
      try {
        const cookies = await authenticatedPage.context().cookies();
        const authCookie = cookies.find(c => c.name === 'auth_token');
        if (authCookie) {
          token = authCookie.value;
          // eslint-disable-next-line no-console
          console.log('[apiClient] Token extracted from cookies');
        } else {
          // eslint-disable-next-line no-console
          console.warn('[apiClient] No auth_token cookie found');
        }
      } catch (cookieErr) {
        // If both methods fail, continue without token (tests may still work for public queries)
        // eslint-disable-next-line no-console
        console.warn('[apiClient] Could not extract auth token from page or cookies:', cookieErr instanceof Error ? cookieErr.message : cookieErr);
      }
    }

    if (!token) {
      // eslint-disable-next-line no-console
      console.warn('[apiClient] WARNING: No auth token found, API requests will be unauthorized');
    }

    const baseURL = process.env.GRAPHQL_URL || 'http://localhost:4000';
    const client = new GraphQLClient(baseURL, token);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(client);

    // Cleanup
    client.clearToken();
  },
});

/**
 * Test user fixture - provides test credentials
 */
const testUserFixture = apiClientFixture.extend<{ testUser: TestUser }>({
  // eslint-disable-next-line no-empty-pattern
  testUser: async ({}, use) => {
    const testUser: TestUser = {
      email: process.env.TEST_EMAIL || 'test@example.com',
      password: process.env.TEST_PASSWORD || 'TestPassword123!',
      id: `test-user-${Date.now()}`,
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(testUser);

    // Cleanup happens in apiClient fixture
  },
});

export const test = testUserFixture;
export { expect };
