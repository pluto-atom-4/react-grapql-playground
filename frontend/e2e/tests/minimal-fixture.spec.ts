/**
 * Minimal test to diagnose fixture initialization behavior
 * Now with dashboard page operations like build-workflow
 */

import { test, expect } from '../fixtures';
import { DashboardPage } from '../pages';

test.describe('Minimal Fixture Test with Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    const t1 = Date.now();
    console.log('[beforeEach] Starting at', new Date().toISOString());
    dashboardPage = new DashboardPage(authenticatedPage);
    const t2 = Date.now();
    console.log('[beforeEach] DashboardPage created in', t2 - t1, 'ms');
    
    await dashboardPage.goto();
    const t3 = Date.now();
    console.log('[beforeEach] goto() completed in', t3 - t2, 'ms');
    
    await dashboardPage.isDashboardReady();
    const t4 = Date.now();
    console.log('[beforeEach] isDashboardReady() completed in', t4 - t3, 'ms');
    console.log('[beforeEach] Total beforeEach time:', t4 - t1, 'ms');
  });

  test('Dashboard fixture test', async ({ authenticatedPage }) => {
    console.log('[test] Test running at', new Date().toISOString());
    const url = authenticatedPage.url();
    expect(url).toContain('dashboard');
  });
});

