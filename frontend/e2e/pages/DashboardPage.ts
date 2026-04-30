import { expect } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for dashboard interactions
 */
export class DashboardPage extends BasePage {
  /**
   * Get builds list container
   */
  readonly buildsList = (): Locator => this.getByTestId('builds-list');

  /**
   * Get build card by ID
   */
  buildCard = (id: string): Locator => this.getByTestId(`build-${id}`);

  /**
   * Get create build button
   */
  readonly createBuildButton = (): Locator => this.getByTestId('create-build-button');

  /**
   * Get empty state message
   */
  readonly emptyState = (): Locator => this.getByTestId('empty-state');

  /**
   * Get build list loading skeleton
   */
  readonly loadingSkeleton = (): Locator => this.getByTestId('builds-loading');

  /**
   * Get user menu
   */
  readonly userMenu = (): Locator => this.getByTestId('user-menu');

  /**
   * Get logout button
   */
  readonly logoutButton = (): Locator => this.getByTestId('logout-button');

  /**
   * Navigate to dashboard
   */
  async goto(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('[DashboardPage] Navigating to /dashboard');
    try {
      await super.goto('/dashboard');
      // eslint-disable-next-line no-console
      console.log('[DashboardPage] Navigation complete, page URL:', this.page.url());
    } catch (err) {
      console.error('[DashboardPage] Navigation error:', err instanceof Error ? err.message : err);
      throw err;
    }

    // Don't wait for specific content here - let the caller use isDashboardReady()
    // to check. This avoids timeout issues if Apollo takes time to load.
  }

  /**
   * Get builds displayed on dashboard
   */
  async getBuilds(): Promise<{ id: string; status: string; name: string }[]> {
    await this.waitForNetworkIdle();

    const builds = await this.page.locator('[data-testid^="build-"]').all();
    const buildsData = [];

    for (const buildElement of builds) {
      const testId = await buildElement.getAttribute('data-testid');
      if (testId) {
        const id = testId.replace('build-', '');
        const statusText = await buildElement.locator('[data-testid="build-status"]').textContent();
        const nameText = await buildElement.locator('[data-testid="build-name"]').textContent();

        buildsData.push({
          id,
          status: statusText || '',
          name: nameText || '',
        });
      }
    }

    return buildsData;
  }

  /**
   * Click on a build card
   */
  async clickBuild(id: string): Promise<void> {
    await this.buildCard(id).click();
    await this.page.waitForURL(`**/builds/${id}**`, { timeout: 10000 });
  }

  /**
   * Create a new build
   */
  async createBuild(name: string): Promise<void> {
    await this.clickByTestId('create-build-button');

    // Wait for create modal or form
    await this.waitForTestId('build-name-input', 10000);

    // Fill form
    await this.fillByTestId('build-name-input', name);

    // Submit
    await this.clickByTestId('create-build-submit');

    // Wait for success and redirect
    await this.waitForNetworkIdle();
  }

  /**
   * Expect empty state to be visible
   */
  async expectEmptyState(): Promise<void> {
    const empty = this.emptyState();
    await empty.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Expect builds to be loaded
   */
  async expectBuildsLoaded(count: number): Promise<void> {
    const builds = await this.getBuilds();
    expect(builds.length).toBe(count);
  }

  /**
   * Expect build to be visible by ID
   */
  async expectBuildVisible(id: string): Promise<void> {
    const build = this.buildCard(id);
    await build.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await this.clickByTestId('user-menu');
    await this.clickByTestId('logout-button');
    await this.page.waitForURL('**/login**', { timeout: 10000 });
  }

  /**
   * Check if dashboard is ready
   */
  async isDashboardReady(): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.log('[isDashboardReady] Checking dashboard readiness...');

    try {
      // Try to find builds list (might take time for Apollo to load)
      // eslint-disable-next-line no-console
      console.log('[isDashboardReady] Waiting for builds-list...');
      await this.waitForTestId('builds-list', 30000);
      // eslint-disable-next-line no-console
      console.log('[isDashboardReady] Dashboard ready: builds-list found');
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err1) {
      // eslint-disable-next-line no-console
      console.log('[isDashboardReady] builds-list not found, trying empty-state...');
      try {
        // Or empty state might be visible
        await this.waitForTestId('empty-state', 30000);
        // eslint-disable-next-line no-console
        console.log('[isDashboardReady] Dashboard ready: empty-state found');
        return true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err2) {
        // eslint-disable-next-line no-console
        console.log('[isDashboardReady] empty-state not found, checking navbar...');

        // Last resort - check if navbar is visible (means page loaded but no data yet)
        try {
          const navbar = await this.page
            .locator('[data-testid="user-menu"]')
            .isVisible({ timeout: 3000 });
          if (navbar) {
            // eslint-disable-next-line no-console
            console.log(
              '[isDashboardReady] Dashboard layout visible but no builds-list/empty-state after 30s'
            );
            return false;
          }
        } catch {
          // navbar not found either
        }

        console.error(
          '[isDashboardReady] Dashboard not ready - no builds-list, empty-state, or navbar found'
        );
        return false;
      }
    }
  }

  /**
   * Wait for build status to change
   */
  async waitForBuildStatus(id: string, status: string, timeout = 30000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const builds = await this.getBuilds();
      const build = builds.find((b) => b.id === id);
      if (build && build.status === status) {
        return;
      }
      await this.page.waitForTimeout(2000);
      await this.reload();
    }
    throw new Error(`Build ${id} did not reach status ${status} within ${timeout}ms`);
  }
}
