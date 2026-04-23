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

    // Navigate to login page
    await page.goto('/login', { waitUntil: 'networkidle' });

    // Wait for login form
    await page.waitForSelector('[data-testid="email-input"]', { timeout: 10000 });

    // Fill login form
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);

    // Submit login form
    await page.click('[data-testid="submit-button"]');

    // Wait for JWT token in localStorage
    await page.waitForFunction(
      () => {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('apollo_token');
        return token && token.length > 0;
      },
      { timeout: 15000 }
    );

    // Wait for Apollo cache to be ready (check for successful query execution)
    await page.waitForFunction(
      () => {
        try {
          const apolloCache = (window as any).__APOLLO_CLIENT__?.cache;
          return apolloCache !== undefined;
        } catch {
          return false;
        }
      },
      { timeout: 15000 }
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
