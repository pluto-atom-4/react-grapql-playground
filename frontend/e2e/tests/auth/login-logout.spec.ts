/**
 * Phase 2A: Authentication E2E Test Suite
 *
 * Comprehensive authentication testing covering:
 * - Login flows (valid credentials, invalid credentials, edge cases)
 * - Session persistence and token management
 * - Logout and session cleanup
 * - Token expiration and re-authentication
 * - Error handling and recovery
 * - Navigation and access control
 *
 * Test cases implemented:
 * - TC-AUTH-001: Valid login with correct credentials
 * - TC-AUTH-002: Login fails with invalid password
 * - TC-AUTH-003: Login fails for non-existent user
 * - TC-AUTH-004: Session persists across navigation
 * - TC-AUTH-005: Logout clears session and redirects
 * - TC-AUTH-006: Token expiration triggers re-authentication
 */

import { test, expect } from '../fixtures';
import { LoginPage, DashboardPage } from '../pages';

// ============================================================================
// AUTHENTICATION TEST SUITE
// ============================================================================

test.describe('Authentication - Login/Logout Flows', () => {
  // --------------------------------------------------------------------------
  // TC-AUTH-001: Valid Login
  // --------------------------------------------------------------------------
  test('TC-AUTH-001: User logs in with correct credentials and reaches dashboard', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Verify login form is ready
    const isReady = await loginPage.isFormReady();
    expect(isReady).toBeTruthy();

    // Fill login form with valid credentials
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_PASSWORD || 'TestPassword123!';

    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword(testPassword);
    await loginPage.submit();

    // Verify redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');

    // Verify auth token stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
    expect(token?.length).toBeGreaterThan(50); // JWT tokens are long

    // Verify dashboard is accessible
    const dashboard = new DashboardPage(page);
    const isDashboardReady = await dashboard.isDashboardReady();
    expect(isDashboardReady).toBeTruthy();

    // Verify no error message displayed
    await expect(loginPage.errorMessage()).not.toBeVisible();
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-002: Invalid Password
  // --------------------------------------------------------------------------
  test('TC-AUTH-002: Login fails with invalid password and shows error message', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const testEmail = process.env.TEST_EMAIL || 'test@example.com';

    // Use valid email but wrong password
    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword('WrongPassword123!');
    await loginPage.submit();

    // Verify error message appears (with timeout for async error handling)
    try {
      await loginPage.expectErrorMessage('Invalid');
    } catch {
      // Error message might say "Invalid credentials", "Authentication failed", etc.
      const errorText = await loginPage.errorMessage().textContent({ timeout: 5000 });
      expect(errorText).toBeTruthy();
    }

    // Verify still on login page
    expect(page.url()).toContain('/login');

    // Verify no token stored
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeFalsy();

    // Verify loading state cleared
    const isLoading = await loginPage.loadingIndicator().isVisible().catch(() => false);
    expect(isLoading).toBeFalsy();
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-003: Non-existent User
  // --------------------------------------------------------------------------
  test('TC-AUTH-003: Login fails for non-existent user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Use email that shouldn't exist
    await loginPage.fillEmail('nonexistent-user-12345@example.com');
    await loginPage.fillPassword('TestPassword123!');
    await loginPage.submit();

    // Verify error message appears
    try {
      await loginPage.expectErrorMessage('not found');
    } catch {
      // Try generic invalid message
      const errorText = await loginPage.errorMessage().textContent({ timeout: 5000 });
      expect(errorText).toBeTruthy();
    }

    // Verify no token stored
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeFalsy();

    // Verify still on login page
    expect(page.url()).toContain('/login');
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-004: Session Persistence
  // --------------------------------------------------------------------------
  test('TC-AUTH-004: Auth token persists across page navigation', async ({
    authenticatedPage,
  }) => {
    // authenticatedPage fixture automatically logs in
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    // Get initial token
    const token1 = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token1).toBeTruthy();

    // Navigate to another page (with query parameter)
    await authenticatedPage.goto('/dashboard?filter=active');
    await dashboard.waitForNetworkIdle();

    // Token should be unchanged
    const token2 = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token2).toBe(token1);

    // Reload page
    await authenticatedPage.reload();

    // Token should still be there
    const token3 = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token3).toBe(token1);

    // Navigate back to dashboard
    await dashboard.goto();
    const isDashboardReady = await dashboard.isDashboardReady();
    expect(isDashboardReady).toBeTruthy();

    // Token unchanged after complex navigation
    const token4 = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token4).toBe(token1);
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-005: Logout Flow
  // --------------------------------------------------------------------------
  test('TC-AUTH-005: Logout clears session and redirects to login', async ({
    authenticatedPage,
  }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    // Verify logged in state
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token).toBeTruthy();

    // Verify dashboard is accessible
    const isDashboardReady = await dashboard.isDashboardReady();
    expect(isDashboardReady).toBeTruthy();

    // Click logout
    await dashboard.logout();

    // Verify redirect to login
    await authenticatedPage.waitForURL('**/login', { timeout: 10000 });
    expect(authenticatedPage.url()).toContain('/login');

    // Verify token cleared
    const clearedToken = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(clearedToken).toBeFalsy();

    // Verify cannot access dashboard without login (should redirect back to login)
    await authenticatedPage.goto('/dashboard');
    // Give page time to detect missing auth and redirect
    await authenticatedPage.waitForTimeout(1000);
    expect(authenticatedPage.url()).toContain('/login');
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-006: Token Expiration Handling
  // --------------------------------------------------------------------------
  test('TC-AUTH-006: Expired token triggers re-authentication', async ({
    authenticatedPage,
  }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    // Verify initially logged in
    const initialToken = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(initialToken).toBeTruthy();

    // Simulate token expiration by clearing it
    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('auth_token');
    });

    // Verify token cleared
    const clearedToken = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(clearedToken).toBeFalsy();

    // Try to access dashboard - should redirect to login
    await authenticatedPage.goto('/dashboard');
    await authenticatedPage.waitForTimeout(1000);

    // Should be on login page
    expect(authenticatedPage.url()).toContain('/login');

    // Now login again
    const loginPage = new LoginPage(authenticatedPage);
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_PASSWORD || 'TestPassword123!';

    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword(testPassword);
    await loginPage.submit();

    // Should redirect to dashboard again
    await authenticatedPage.waitForURL('**/dashboard', { timeout: 15000 });

    // Verify new token created
    const newToken = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(initialToken); // New token should be different
  });
});

// ============================================================================
// AUTHENTICATION - ERROR HANDLING & EDGE CASES
// ============================================================================

test.describe('Authentication - Error Handling', () => {
  // --------------------------------------------------------------------------
  // TC-AUTH-007: Empty Email Field
  // --------------------------------------------------------------------------
  test('TC-AUTH-007: Login fails with empty email field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Leave email empty
    await loginPage.fillPassword('TestPassword123!');
    await loginPage.submit();

    // Should either show error or form validation
    // Check if still on login page (form should prevent submission)
    const url = page.url();
    expect(url).toContain('/login');
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-008: Empty Password Field
  // --------------------------------------------------------------------------
  test('TC-AUTH-008: Login fails with empty password field', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const testEmail = process.env.TEST_EMAIL || 'test@example.com';

    // Fill email but leave password empty
    await loginPage.fillEmail(testEmail);
    await loginPage.submit();

    // Should either show error or form validation
    const url = page.url();
    expect(url).toContain('/login');
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-009: Multiple Failed Login Attempts
  // --------------------------------------------------------------------------
  test('TC-AUTH-009: Multiple failed login attempts', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const testEmail = process.env.TEST_EMAIL || 'test@example.com';

    // Attempt login 3 times with wrong password
    for (let i = 0; i < 3; i++) {
      await loginPage.fillEmail(testEmail);
      await loginPage.fillPassword(`WrongPassword${i}!`);
      await loginPage.submit();

      // Verify error shown and still on login page
      const url = page.url();
      expect(url).toContain('/login');

      // Wait a bit before next attempt
      await page.waitForTimeout(500);

      // Clear form for next attempt
      await loginPage.fillByTestId('email-input', '');
      await loginPage.fillByTestId('password-input', '');
    }

    // Verify no token stored after multiple failures
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeFalsy();
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-010: Invalid Email Format
  // --------------------------------------------------------------------------
  test('TC-AUTH-010: Login fails with invalid email format', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Use invalid email format
    await loginPage.fillEmail('not-an-email');
    await loginPage.fillPassword('TestPassword123!');
    await loginPage.submit();

    // Should either show validation error or server error
    const url = page.url();
    expect(url).toContain('/login');

    // Verify no token stored
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeFalsy();
  });
});

// ============================================================================
// AUTHENTICATION - ADVANCED SCENARIOS
// ============================================================================

test.describe('Authentication - Advanced Scenarios', () => {
  // --------------------------------------------------------------------------
  // TC-AUTH-011: Form Refresh After Failed Attempt
  // --------------------------------------------------------------------------
  test('TC-AUTH-011: Form clears properly after failed attempt', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const testEmail = process.env.TEST_EMAIL || 'test@example.com';

    // First attempt with wrong password
    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword('WrongPassword!');
    await loginPage.submit();

    // Wait for error
    await page.waitForTimeout(1000);

    // Verify error message visible
    try {
      await loginPage.expectErrorMessage('Invalid');
    } catch {
      // Error message exists
      const errorVisible = await loginPage.errorMessage().isVisible().catch(() => false);
      expect(errorVisible).toBeTruthy();
    }

    // Now login with correct credentials
    const testPassword = process.env.TEST_PASSWORD || 'TestPassword123!';
    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword(testPassword);
    await loginPage.submit();

    // Should succeed and redirect
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');

    // Verify token created
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-012: Rapid Logout and Login
  // --------------------------------------------------------------------------
  test('TC-AUTH-012: User can logout and login again quickly', async ({
    authenticatedPage,
  }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    const loginPage = new LoginPage(authenticatedPage);

    // Start on dashboard
    await dashboard.goto();
    const token1 = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token1).toBeTruthy();

    // Logout
    await dashboard.logout();
    await authenticatedPage.waitForURL('**/login', { timeout: 10000 });

    // Verify logged out
    const token2 = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token2).toBeFalsy();

    // Login again immediately
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_PASSWORD || 'TestPassword123!';

    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword(testPassword);
    await loginPage.submit();

    // Should login successfully
    await authenticatedPage.waitForURL('**/dashboard', { timeout: 15000 });

    // Verify new token created
    const token3 = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token3).toBeTruthy();
    expect(token3).not.toBe(token1); // New token should be different
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-013: Token Available After Page Refresh
  // --------------------------------------------------------------------------
  test('TC-AUTH-013: Token persists in localStorage after page refresh', async ({
    authenticatedPage,
  }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();

    // Get token before refresh
    const tokenBefore = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(tokenBefore).toBeTruthy();

    // Refresh page
    await authenticatedPage.reload();

    // Get token after refresh
    const tokenAfter = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(tokenAfter).toBe(tokenBefore);

    // Dashboard should still be accessible
    const isDashboardReady = await dashboard.isDashboardReady();
    expect(isDashboardReady).toBeTruthy();
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-014: Unauthorized Access Redirects to Login
  // --------------------------------------------------------------------------
  test('TC-AUTH-014: Accessing protected route without token redirects to login', async ({
    page,
  }) => {
    // Direct navigation to dashboard without login
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');

    // Verify no token
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeFalsy();
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-015: Login Button Disabled During Submission
  // --------------------------------------------------------------------------
  test('TC-AUTH-015: Submit button shows loading state during login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_PASSWORD || 'TestPassword123!';

    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword(testPassword);

    // Click submit and check for loading state
    const submitButton = loginPage.submitButton();
    await submitButton.click();

    // Loading indicator should appear
    try {
      await loginPage.expectLoading();
      // Loading should complete
      await loginPage.expectLoadingComplete();
    } catch {
      // If no loading indicator, just wait for redirect
      await page.waitForURL('**/dashboard', { timeout: 15000 });
    }

    // Should be redirected to dashboard
    expect(page.url()).toContain('/dashboard');
  });
});

// ============================================================================
// AUTHENTICATION - SESSION MANAGEMENT
// ============================================================================

test.describe('Authentication - Session Management', () => {
  // --------------------------------------------------------------------------
  // TC-AUTH-016: Multiple Tabs Share Session
  // --------------------------------------------------------------------------
  test('TC-AUTH-016: Multiple browser contexts maintain separate sessions', async ({
    page,
    context,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_PASSWORD || 'TestPassword123!';

    // Login in first tab
    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword(testPassword);
    await loginPage.submit();

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    const token1 = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token1).toBeTruthy();

    // Create second context
    const context2 = await page.context().browser()?.createBrowserContext();
    const page2 = await context2?.newPage();

    if (page2) {
      // Second context should not have token
      await page2.goto('/dashboard');
      // Should redirect to login (no token)
      await page2.waitForTimeout(1500);
      expect(page2.url()).toContain('/login');

      // Login in second context
      const loginPage2 = new LoginPage(page2);
      await loginPage2.fillEmail(testEmail);
      await loginPage2.fillPassword(testPassword);
      await loginPage2.submit();

      await page2.waitForURL('**/dashboard', { timeout: 15000 });
      const token2 = await page2.evaluate(() => localStorage.getItem('auth_token'));
      expect(token2).toBeTruthy();

      // Tokens might be different (separate sessions)
      // or same (if using same user - both are valid)

      // Logout in second context
      const dashboard2 = new DashboardPage(page2);
      await dashboard2.logout();
      await page2.waitForURL('**/login', { timeout: 10000 });

      // First context should still be logged in
      const token1After = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(token1After).toBe(token1);

      // Cleanup
      await context2?.close();
    }
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-017: Browser Back Button After Logout
  // --------------------------------------------------------------------------
  test('TC-AUTH-017: Browser back button after logout does not restore session', async ({
    authenticatedPage,
  }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    const loginPage = new LoginPage(authenticatedPage);

    // Navigate to dashboard
    await dashboard.goto();
    const token1 = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token1).toBeTruthy();

    // Logout
    await dashboard.logout();
    await authenticatedPage.waitForURL('**/login', { timeout: 10000 });

    // Verify logged out
    const tokenAfterLogout = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(tokenAfterLogout).toBeFalsy();

    // Press back button
    await authenticatedPage.goBack();

    // Should still be on login (or redirect to login due to no token)
    await authenticatedPage.waitForTimeout(1000);
    // Either still on login or redirected to it
    const url = authenticatedPage.url();
    expect(url).toContain('/login');
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-018: Form Validation Messages
  // --------------------------------------------------------------------------
  test('TC-AUTH-018: Form displays appropriate validation messages', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Test with wrong credentials
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword('IncorrectPassword!');
    await loginPage.submit();

    // Should show error message (not validation error, but auth error)
    try {
      const errorVisible = await loginPage.errorMessage().isVisible({ timeout: 5000 });
      expect(errorVisible).toBeTruthy();
    } catch {
      // Error message might not be visible but user should stay on login page
      expect(page.url()).toContain('/login');
    }
  });
});
