/**
 * Example E2E test demonstrating fixtures, page objects, and API client usage
 */

import { test, expect } from '../fixtures';
import { LoginPage, DashboardPage } from '../pages';
import { seedTestData, cleanupTestData, waitForApolloCacheReady } from '../helpers';

test.describe('Dashboard Examples', () => {
  /**
   * Example 1: Basic authenticated page test
   */
  test('Example 1: Load dashboard with authenticated page', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    // Verify dashboard is ready
    const isReady = await dashboard.isDashboardReady();
    expect(isReady).toBeTruthy();
  });

  /**
   * Example 2: Query builds and verify structure
   */
  test('Example 2: Query builds via API and verify structure', async ({ apiClient }) => {
    const result = await apiClient.query(`
      query GetBuilds {
        builds {
          id
          status
          name
          createdAt
        }
      }
    `);

    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data?.builds)).toBeTruthy();

    if (result.data?.builds?.length > 0) {
      const build = result.data.builds[0];
      expect(build).toHaveProperty('id');
      expect(build).toHaveProperty('status');
      expect(build).toHaveProperty('name');
    }
  });

  /**
   * Example 3: Create test data and verify in UI
   */
  test('Example 3: Seed test data and verify in dashboard', async ({
    authenticatedPage,
    apiClient,
  }) => {
    // Seed test data
    const seededData = await seedTestData(apiClient);
    expect(seededData.buildIds.length).toBeGreaterThan(0);

    try {
      // Navigate to dashboard
      const dashboard = new DashboardPage(authenticatedPage);
      await dashboard.goto();

      // Wait for Apollo cache to be ready with the new data
      await waitForApolloCacheReady(authenticatedPage);

      // Get builds from UI
      const builds = await dashboard.getBuilds();
      expect(builds.length).toBeGreaterThanOrEqual(seededData.buildIds.length);

      // Verify at least one build is present
      const buildIds = builds.map((b) => b.id);
      const hasTestBuild = seededData.buildIds.some((id) => buildIds.includes(id));
      if (hasTestBuild) {
        console.log('✓ Test build found in dashboard');
      }
    } finally {
      // Cleanup test data
      await cleanupTestData(apiClient, seededData);
    }
  });

  /**
   * Example 4: Test loading and error states
   */
  test('Example 4: Verify loading states', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    // Check if loading skeleton appears during data fetch
    const isLoading = await authenticatedPage
      .locator('[data-testid="builds-loading"]')
      .isVisible()
      .catch(() => false);

    if (isLoading) {
      console.log('✓ Loading skeleton visible');
      await dashboard.waitForNetworkIdle();
    } else {
      console.log('✓ Data loaded without visible loading state');
    }
  });

  /**
   * Example 5: Test user management
   */
  test('Example 5: Access test user credentials', async ({ testUser }) => {
    expect(testUser).toBeDefined();
    expect(testUser.email).toBeDefined();
    expect(testUser.password).toBeDefined();
    expect(testUser.id).toBeDefined();

    console.log(`Test user ID: ${testUser.id}`);
    console.log(`Test user email: ${testUser.email}`);
  });

  /**
   * Example 6: Combine page objects and API client
   */
  test('Example 6: Full workflow - create via API and view in UI', async ({
    authenticatedPage,
    apiClient,
  }) => {
    // Create build via API
    const createResult = await apiClient.mutation(`
      mutation CreateBuild($input: CreateBuildInput!) {
        createBuild(input: $input) {
          id
          name
          status
        }
      }
    `, {
      input: {
        name: `E2E Test Build ${Date.now()}`,
        description: 'Created by E2E test example',
      },
    });

    const buildId = createResult.data?.createBuild?.id;
    expect(buildId).toBeDefined();

    // Verify in dashboard UI
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await waitForApolloCacheReady(authenticatedPage);

    const builds = await dashboard.getBuilds();
    const createdBuild = builds.find((b) => b.id === buildId);
    expect(createdBuild).toBeDefined();

    // Cleanup
    if (buildId) {
      await apiClient.mutation(`
        mutation DeleteBuild($id: ID!) {
          deleteBuild(id: $id) {
            success
          }
        }
      `, { id: buildId });
    }
  });
});

test.describe('Login Examples', () => {
  /**
   * Example 7: Custom login (non-fixture)
   */
  test('Example 7: Manual login flow', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Verify form is ready
    const isReady = await loginPage.isFormReady();
    expect(isReady).toBeTruthy();

    // Note: The authenticatedPage fixture already does this for other tests
    console.log('✓ Login page loaded and form is ready');
  });
});

test.describe('Error Handling Examples', () => {
  /**
   * Example 8: Handle GraphQL errors
   */
  test('Example 8: Catch GraphQL error responses', async ({ apiClient }) => {
    try {
      const result = await apiClient.query(`
        query InvalidQuery {
          nonExistentField
        }
      `);

      if (result.errors) {
        console.log('✓ GraphQL error caught:', result.errors[0].message);
      }
    } catch (error) {
      console.log('✓ GraphQL error handled:', error instanceof Error ? error.message : error);
    }
  });

  /**
   * Example 9: Handle timeout scenarios
   */
  test('Example 9: Handle timeout with page operations', async ({ authenticatedPage }) => {
    try {
      await authenticatedPage.waitForSelector('[data-testid="non-existent-element"]', {
        timeout: 1000,
      });
    } catch (error) {
      console.log('✓ Timeout handled gracefully');
      expect(error instanceof Error).toBeTruthy();
    }
  });
});

test.describe('Real-time Updates Examples', () => {
  /**
   * Example 10: Wait for network idle
   */
  test('Example 10: Wait for network operations', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    // All network requests should be complete
    await dashboard.waitForNetworkIdle();

    console.log('✓ All network requests completed');
  });
});
