import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for dashboard interactions
 */
export class DashboardPage extends BasePage {
  /**
   * Get builds list container
   */
  readonly buildsList = () => this.getByTestId('builds-list');

  /**
   * Get build card by ID
   */
  buildCard = (id: string) => this.getByTestId(`build-${id}`);

  /**
   * Get create build button
   */
  readonly createBuildButton = () => this.getByTestId('create-build-button');

  /**
   * Get empty state message
   */
  readonly emptyState = () => this.getByTestId('empty-state');

  /**
   * Get build list loading skeleton
   */
  readonly loadingSkeleton = () => this.getByTestId('builds-loading');

  /**
   * Get user menu
   */
  readonly userMenu = () => this.getByTestId('user-menu');

  /**
   * Get logout button
   */
  readonly logoutButton = () => this.getByTestId('logout-button');

  /**
   * Navigate to dashboard
   */
  async goto(): Promise<void> {
    await super.goto('/dashboard');
    // Wait for builds list or empty state to appear
    try {
      await this.waitForTestId('builds-list', 10000);
    } catch {
      // Might show empty state instead
      await this.waitForTestId('empty-state', 10000);
    }
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
    try {
      await this.waitForTestId('builds-list', 3000);
      return true;
    } catch {
      try {
        await this.waitForTestId('empty-state', 3000);
        return true;
      } catch {
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
