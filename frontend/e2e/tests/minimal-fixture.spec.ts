/**
 * Minimal test to diagnose fixture initialization behavior
 * Now with dashboard page operations like build-workflow
 */

import { test, expect } from '../fixtures';
import { DashboardPage } from '../pages';

test.describe('Minimal Fixture Test with Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboardPage = new DashboardPage(authenticatedPage);
    
    await dashboardPage.goto();
    
    await dashboardPage.isDashboardReady();
  });

  test('Dashboard fixture test', ({ authenticatedPage }) => {
    const url = authenticatedPage.url();
    expect(url).toContain('dashboard');
  });
});

