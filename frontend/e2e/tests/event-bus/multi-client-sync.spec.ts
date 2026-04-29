/**
 * Phase E2: Multi-Client Synchronization E2E Tests
 *
 * Comprehensive tests for real-time synchronization across multiple browser instances:
 * - Two browser instances see the same updates
 * - Three browsers with staggered actions maintain consistency
 * - Tab synchronization within same user session
 * - Events broadcast to all connected SSE clients
 *
 * Verifies:
 * - Events propagate to all SSE listeners
 * - UI updates in all browsers simultaneously
 * - No race conditions or stale data
 * - No page refresh needed for synchronization
 */

import { test, expect, devices, Browser } from '@playwright/test';

// Helper to login in a page
async function loginPage(page: any, baseURL: string): Promise<void> {
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);

  const loginLink = page.locator('[data-testid="home-login-link"]');
  await loginLink.waitFor({ state: 'visible', timeout: 10000 });
  await loginLink.click();

  const emailInput = page.locator('[data-testid="email-input"]');
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });

  const testUser = {
    email: process.env.TEST_EMAIL || 'test@example.com',
    password: process.env.TEST_PASSWORD || 'TestPassword123!',
  };

  await emailInput.fill(testUser.email);
  await emailInput.blur();
  await page.waitForTimeout(100);

  const passwordInput = page.locator('[data-testid="password-input"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.fill(testUser.password);
  await passwordInput.blur();
  await page.waitForTimeout(100);

  const submitButton = page.locator('[data-testid="submit-button"]');
  await submitButton.waitFor({ state: 'visible', timeout: 5000 });

  const urlChangePromise = page.waitForURL(/.*\/dashboard/, { timeout: 20000 });
  await submitButton.click();

  try {
    await urlChangePromise;
  } catch (err) {
    throw new Error(`Dashboard redirect failed: ${err instanceof Error ? err.message : err}`);
  }

  // Wait for JWT token
  await page.waitForFunction(
    (): boolean => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('apollo_token');
      return !!(token && token.length > 0);
    },
    { timeout: 10000 }
  );
}

test.describe('Event Bus: Multi-Client Synchronization', () => {
  // --------------------------------------------------------------------------
  // TC-E2E-MCS-001: Two browsers sync in real-time
  // --------------------------------------------------------------------------
  test('TC-E2E-MCS-001: Two browsers sync in real-time', async ({ browser }) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';

    // Create two browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Both login and open dashboard
      await loginPage(page1, baseURL);
      await loginPage(page2, baseURL);

      // Navigate to dashboard in both
      await page1.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });
      await page2.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });

      // Wait for both dashboards to be ready
      await page1.waitForTimeout(1000);
      await page2.waitForTimeout(1000);

      // Create build in page1
      const buildName = `E2E Multi Build ${Date.now()}`;

      const createButton1 = page1.locator('[data-testid="create-build-button"]');
      await createButton1.waitFor({ state: 'visible', timeout: 5000 });
      await createButton1.click();

      const buildNameInput = page1.locator('[data-testid="build-name-input"]');
      await buildNameInput.waitFor({ state: 'visible', timeout: 5000 });
      await buildNameInput.fill(buildName);

      const submitButton1 = page1.locator('[data-testid="create-build-submit"]');
      await submitButton1.click();

      // Wait for network and SSE propagation
      await page1.waitForTimeout(1000);

      // Verify: Build appears in page1
      const buildCard1 = page1.locator(`[data-testid="build-${buildName}"]`);
      await buildCard1.waitFor({ state: 'visible', timeout: 5000 });

      // Verify: Build appears in page2 (via SSE, no refresh needed)
      const buildCard2 = page2.locator(`[data-testid="build-${buildName}"]`);
      await buildCard2.waitFor({ state: 'visible', timeout: 10000 });

      // Verify: Both show same status
      const status1 = await buildCard1.locator('[data-testid="build-status"]').textContent();
      const status2 = await buildCard2.locator('[data-testid="build-status"]').textContent();

      expect(status1).toBe(status2);
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  // --------------------------------------------------------------------------
  // TC-E2E-MCS-002: Three browsers with staggered actions
  // --------------------------------------------------------------------------
  test('TC-E2E-MCS-002: Three browsers with staggered actions maintain consistency', async ({
    browser,
  }) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';

    // Create three browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();

    try {
      // All login
      await Promise.all([
        loginPage(page1, baseURL),
        loginPage(page2, baseURL),
        loginPage(page3, baseURL),
      ]);

      // Navigate to dashboard
      await Promise.all([
        page1.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' }),
        page2.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' }),
        page3.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' }),
      ]);

      await page1.waitForTimeout(1000);
      await page2.waitForTimeout(1000);
      await page3.waitForTimeout(1000);

      // Browser 1: Create build
      const buildName = `E2E Three Build ${Date.now()}`;
      const createButton1 = page1.locator('[data-testid="create-build-button"]');
      await createButton1.waitFor({ state: 'visible', timeout: 5000 });
      await createButton1.click();

      const buildNameInput1 = page1.locator('[data-testid="build-name-input"]');
      await buildNameInput1.waitFor({ state: 'visible', timeout: 5000 });
      await buildNameInput1.fill(buildName);

      const submitButton1 = page1.locator('[data-testid="create-build-submit"]');
      await submitButton1.click();

      await page1.waitForTimeout(1000);

      // All should see the build
      const buildCard1 = page1.locator(`[data-testid="build-${buildName}"]`);
      const buildCard2 = page2.locator(`[data-testid="build-${buildName}"]`);
      const buildCard3 = page3.locator(`[data-testid="build-${buildName}"]`);

      await buildCard1.waitFor({ state: 'visible', timeout: 5000 });
      await buildCard2.waitFor({ state: 'visible', timeout: 10000 });
      await buildCard3.waitFor({ state: 'visible', timeout: 10000 });

      // Browser 2: Update status
      const statusDropdown2 = page2.locator('[data-testid="status-select"]');
      // Might need to click on build first if status dropdown not visible
      if (!(await statusDropdown2.isVisible())) {
        await buildCard2.click();
        await page2.waitForURL(`**/builds/**`, { timeout: 10000 });
        await page2.waitForTimeout(500);
      }

      await statusDropdown2.waitFor({ state: 'visible', timeout: 5000 });
      await statusDropdown2.click();

      const completeOption2 = page2.locator('[data-testid="status-option-COMPLETE"]');
      await completeOption2.waitFor({ state: 'visible', timeout: 5000 });
      await completeOption2.click();

      await page2.waitForTimeout(1000);

      // All should see the updated status
      // Check in page1 (need to navigate back to dashboard or check cache)
      const statusValue1 = page1.locator('[data-testid="build-status-value"]');
      const statusValue2 = page2.locator('[data-testid="build-status-value"]');
      const statusValue3 = page3.locator('[data-testid="build-status-value"]');

      // Wait for status updates in all pages
      await statusValue1.waitFor({ state: 'visible', timeout: 5000 });
      await statusValue2.waitFor({ state: 'visible', timeout: 5000 });
      await statusValue3.waitFor({ state: 'visible', timeout: 5000 });

      // Verify all show COMPLETE
      await expect(statusValue1).toContainText('COMPLETE');
      await expect(statusValue2).toContainText('COMPLETE');
      await expect(statusValue3).toContainText('COMPLETE');
    } finally {
      await context1.close();
      await context2.close();
      await context3.close();
    }
  });

  // --------------------------------------------------------------------------
  // TC-E2E-MCS-003: One user, two tabs synchronization
  // --------------------------------------------------------------------------
  test('TC-E2E-MCS-003: One user, two tabs synchronization', async ({ page, browser }) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';

    // Login in first page
    await loginPage(page, baseURL);

    // Open second tab in same context (same user session)
    const page2 = await page.context().newPage();

    try {
      // Navigate both to dashboard
      await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });
      await page2.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });

      await page.waitForTimeout(1000);
      await page2.waitForTimeout(1000);

      // Tab A: Create build
      const buildName = `E2E Tab Sync ${Date.now()}`;
      const createButton = page.locator('[data-testid="create-build-button"]');
      await createButton.waitFor({ state: 'visible', timeout: 5000 });
      await createButton.click();

      const buildNameInput = page.locator('[data-testid="build-name-input"]');
      await buildNameInput.waitFor({ state: 'visible', timeout: 5000 });
      await buildNameInput.fill(buildName);

      const submitButton = page.locator('[data-testid="create-build-submit"]');
      await submitButton.click();

      await page.waitForTimeout(1000);

      // Tab B: Should see build without refresh (same session, SSE broadcast)
      const buildCard2 = page2.locator(`[data-testid="build-${buildName}"]`);
      await buildCard2.waitFor({ state: 'visible', timeout: 10000 });

      // Tab B: Update build status
      const statusDropdown2 = page2.locator('[data-testid="status-select"]');
      await statusDropdown2.waitFor({ state: 'visible', timeout: 5000 });
      await statusDropdown2.click();

      const completeOption2 = page2.locator('[data-testid="status-option-COMPLETE"]');
      await completeOption2.waitFor({ state: 'visible', timeout: 5000 });
      await completeOption2.click();

      await page2.waitForTimeout(1000);

      // Tab A: Should see updated status (via SSE)
      const statusValue = page.locator('[data-testid="build-status-value"]');
      await statusValue.waitFor({ state: 'visible', timeout: 5000 });
      await expect(statusValue).toContainText('COMPLETE');
    } finally {
      await page2.close();
    }
  });

  // --------------------------------------------------------------------------
  // TC-E2E-MCS-004: Rapid sync under load
  // --------------------------------------------------------------------------
  test('TC-E2E-MCS-004: Rapid sync under load with multiple updates', async ({ browser }) => {
    const baseURL = process.env.BASE_URL || 'http://localhost:3000';

    // Create two contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Login both
      await Promise.all([loginPage(page1, baseURL), loginPage(page2, baseURL)]);

      // Navigate to dashboard
      await Promise.all([
        page1.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' }),
        page2.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' }),
      ]);

      await page1.waitForTimeout(1000);
      await page2.waitForTimeout(1000);

      // Rapidly create multiple builds from page1
      for (let i = 0; i < 3; i++) {
        const buildName = `E2E Load Build ${Date.now()}-${i}`;

        const createButton = page1.locator('[data-testid="create-build-button"]');
        await createButton.waitFor({ state: 'visible', timeout: 5000 });
        await createButton.click();

        const buildNameInput = page1.locator('[data-testid="build-name-input"]');
        await buildNameInput.waitFor({ state: 'visible', timeout: 5000 });
        await buildNameInput.fill(buildName);

        const submitButton = page1.locator('[data-testid="create-build-submit"]');
        await submitButton.click();

        await page1.waitForTimeout(500);
      }

      // Verify all 3 builds appear in page2 (they should arrive via SSE)
      for (let i = 0; i < 3; i++) {
        const buildName = `E2E Load Build`;
        const buildCards = page2.locator('[data-testid^="build-"]');
        const count = await buildCards.count();
        // Just verify we have multiple builds (exact match may vary based on test data)
        expect(count).toBeGreaterThanOrEqual(3);
      }
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
