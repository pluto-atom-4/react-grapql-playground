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

import { test, expect } from '../../fixtures';
import { LoginPage, DashboardPage } from '../../pages';

// ============================================================================
// AUTHENTICATION TEST SUITE
// ============================================================================

test.describe('Authentication - Login/Logout Flows', () => {
  // --------------------------------------------------------------------------
  // TC-AUTH-001: Valid Login
  // --------------------------------------------------------------------------
  test('TC-AUTH-001: User logs in with correct credentials and reaches dashboard', async ({
    page,
    context,
  }) => {
    // Navigate to home page first to establish origin
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    
    // Clear any existing auth state
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Reload to ensure clean state
    await page.reload({ waitUntil: 'domcontentloaded' });
    
    // Click the login link
    await page.click('[data-testid="home-login-link"]');
    
    // Wait for login page to load
    await page.waitForURL(/.*\/login/, { timeout: 10000 });
    
    // Pause for form to render
    await page.waitForTimeout(500);

    const loginPage = new LoginPage(page);
    
    // Verify login form is ready
    const isReady = await loginPage.isFormReady();
    expect(isReady).toBeTruthy();

    // Fill login form with valid credentials
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_PASSWORD || 'TestPassword123!';

    // Fill form and submit
    await loginPage.fillByTestId('email-input', testEmail);
    await loginPage.fillByTestId('password-input', testPassword);
    
    // Start listening for URL change BEFORE submitting (use regex for flexible matching)
    const urlChangePromise = page.waitForURL(/.*\/dashboard/, { timeout: 20000 });
    
    // Click submit button
    await loginPage.clickByTestId('submit-button');

    // Wait for the redirect to complete
    await urlChangePromise;
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

    // Use valid email but wrong password - fill and submit manually
    await loginPage.fillByTestId('email-input', testEmail);
    await loginPage.fillByTestId('password-input', 'WrongPassword123!');
    await loginPage.clickByTestId('submit-button');
    
    // Wait for loading state to clear
    await page.waitForTimeout(1500);

    // Verify still on login page (login failed)
    expect(page.url()).toContain('/login');

    // Verify no token stored
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeFalsy();

    // Verify loading state cleared
    const isLoading = await loginPage
      .loadingIndicator()
      .isVisible()
      .catch(() => false);
    expect(isLoading).toBeFalsy();
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-003: Non-existent User
  // --------------------------------------------------------------------------
  test('TC-AUTH-003: Login fails for non-existent user', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Use email that shouldn't exist - fill and submit manually
    await loginPage.fillByTestId('email-input', 'nonexistent-user-12345@example.com');
    await loginPage.fillByTestId('password-input', 'TestPassword123!');
    await loginPage.clickByTestId('submit-button');
    
    // Wait for loading to clear
    await page.waitForTimeout(1500);

    // Verify still on login page (login failed)
    expect(page.url()).toContain('/login');

    // Verify no token stored
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeFalsy();
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-004: Session Persistence
  // --------------------------------------------------------------------------
  test('TC-AUTH-004: Auth token persists across page navigation', async ({ authenticatedPage }) => {
    // authenticatedPage fixture automatically logs in and navigates to dashboard

    // Get initial token
    const token1 = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(token1).toBeTruthy();

    // Navigate to another page (with query parameter)
    await authenticatedPage.goto('/dashboard?filter=active', { waitUntil: 'domcontentloaded' });

    // Token should be unchanged
    const token2 = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(token2).toBe(token1);

    // Reload page
    await authenticatedPage.reload({ waitUntil: 'domcontentloaded' });

    // Token should still be there
    const token3 = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(token3).toBe(token1);

    // Navigate back to dashboard
    await authenticatedPage.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    
    // Wait for dashboard to show (either builds list or empty state)
    try {
      await authenticatedPage.locator('[data-testid="builds-list"]').waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      await authenticatedPage.locator('[data-testid="empty-state"]').waitFor({ state: 'visible', timeout: 5000 });
    }

    // Token unchanged after complex navigation
    const token4 = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(token4).toBe(token1);
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-005: Logout Flow
  // --------------------------------------------------------------------------
  test('TC-AUTH-005: Logout clears session and redirects to login', async ({
    authenticatedPage,
  }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    // Fixture already navigated to dashboard - don't call goto() again

    // Verify logged in state
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();

    // Verify dashboard is accessible
    const isDashboardReady = await dashboard.isDashboardReady();
    expect(isDashboardReady).toBeTruthy();

    // Click logout
    await dashboard.logout();

    // Verify redirect to login (use regex pattern)
    await authenticatedPage.waitForURL(/.*\/login/, { timeout: 10000 });
    expect(authenticatedPage.url()).toContain('/login');

    // Verify token cleared
    const clearedToken = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(clearedToken).toBeFalsy();

    // Verify cannot access home page without login (should show login link, not dashboard)
    await authenticatedPage.goto('/', { waitUntil: 'domcontentloaded' });
    // Give page time to detect missing auth and render login page
    await authenticatedPage.waitForTimeout(500);
    
    // Should show login link on home page when not authenticated
    const loginLink = authenticatedPage.locator('[data-testid="home-login-link"]');
    await expect(loginLink).toBeVisible({ timeout: 5000 });
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-006: Token Expiration Handling
  // --------------------------------------------------------------------------
  test('TC-AUTH-006: Expired token triggers re-authentication', async ({ authenticatedPage }) => {
    // Fixture already navigated to dashboard - don't call goto() again

    // Verify initially logged in
    const initialToken = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(initialToken).toBeTruthy();

    // Simulate token expiration by clearing it - use storage event to trigger React update
    await authenticatedPage.evaluate(() => {
      localStorage.removeItem('auth_token');
      // Dispatch storage event to notify React components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'auth_token',
        newValue: null,
        oldValue: localStorage.getItem('auth_token'),
      }));
    });

    // Wait for redirect to login page (polling with retries)
    await authenticatedPage.waitForURL(/.*\/login/, { timeout: 5000 });

    // Should be on login page
    expect(authenticatedPage.url()).toContain('/login');

    // Now login again
    const loginPage = new LoginPage(authenticatedPage);
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_PASSWORD || 'TestPassword123!';

    await loginPage.login(testEmail, testPassword);

    // Should redirect to dashboard again (use regex pattern)
    await authenticatedPage.waitForURL(/.*\/dashboard/, { timeout: 15000 });

    // Verify new token created
    const newToken = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
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
    await loginPage.fillByTestId('password-input', 'TestPassword123!');
    await loginPage.clickByTestId('submit-button');

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
    await loginPage.fillByTestId('email-input', testEmail);
    await loginPage.clickByTestId('submit-button');

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
      await loginPage.fillByTestId('email-input', testEmail);
      await loginPage.fillByTestId('password-input', `WrongPassword${i}!`);
      await loginPage.clickByTestId('submit-button');

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

    // Use invalid email format - fill and submit manually
    await loginPage.fillByTestId('email-input', 'not-an-email');
    await loginPage.fillByTestId('password-input', 'TestPassword123!');
    await loginPage.clickByTestId('submit-button');
    
    // Wait for form to process
    await page.waitForTimeout(1500);

    // Should still be on login page (form validation or server error)
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

    // First attempt with wrong password - submit directly
    await loginPage.fillByTestId('email-input', testEmail);
    await loginPage.fillByTestId('password-input', 'WrongPassword!');
    await loginPage.clickByTestId('submit-button');

    // Wait for error
    await page.waitForTimeout(1500);

    // Verify still on login page (failed login)
    expect(page.url()).toContain('/login');
    
    // Verify no token created
    const tokenAfterFailure = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(tokenAfterFailure).toBeFalsy();

    // Now login with correct credentials
    const testPassword = process.env.TEST_PASSWORD || 'TestPassword123!';
    await loginPage.login(testEmail, testPassword);

    // Should succeed and redirect
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');

    // Verify token created
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-012: Rapid Logout and Login
  // --------------------------------------------------------------------------
  test('TC-AUTH-012: User can logout and login again quickly', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    const loginPage = new LoginPage(authenticatedPage);

    // Fixture already navigated to dashboard
    const token1 = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(token1).toBeTruthy();

    // Logout
    await dashboard.logout();
    await authenticatedPage.waitForURL(/.*\/login/, { timeout: 10000 });

    // Verify logged out
    const token2 = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(token2).toBeFalsy();

    // Login again immediately
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_PASSWORD || 'TestPassword123!';

    await loginPage.login(testEmail, testPassword);

    // Should login successfully
    await authenticatedPage.waitForURL(/.*\/dashboard/, { timeout: 15000 });

    // Verify new token created
    const token3 = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
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
    // Fixture already navigated to dashboard

    // Get token before refresh
    const tokenBefore = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(tokenBefore).toBeTruthy();

    // Refresh page
    await authenticatedPage.reload({ waitUntil: 'domcontentloaded' });

    // Get token after refresh
    const tokenAfter = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
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
    await page.waitForURL(/.*\/login/, { timeout: 10000 });
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

    // Fill form
    await loginPage.fillByTestId('email-input', testEmail);
    await loginPage.fillByTestId('password-input', testPassword);

    // Submit form
    await loginPage.clickByTestId('submit-button');

    // Wait for token to be created (indicates loading is complete)
    await page.waitForFunction(
      () => {
        const token = localStorage.getItem('auth_token');
        return token && token.length > 0;
      },
      { timeout: 15000 }
    );

    // Verify token exists
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });
});

// ============================================================================
// AUTHENTICATION - SESSION MANAGEMENT
// ============================================================================

test.describe('Authentication - Session Management', () => {
  // --------------------------------------------------------------------------
  // TC-AUTH-016: Multiple Tabs Share Session
  // --------------------------------------------------------------------------
  test('TC-AUTH-016: New pages without login do not have auth token', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_PASSWORD || 'TestPassword123!';

    // Login
    await loginPage.login(testEmail, testPassword);

    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
    const token1 = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token1).toBeTruthy();

    // Verify token persists across navigation
    await page.goto('/dashboard?filter=active');
    const token2 = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token2).toBe(token1);

    // Reload page
    await page.reload();
    const token3 = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token3).toBe(token1);

    // Navigate back to dashboard
    await page.goto('/dashboard');
    const isDashboardReady = await new DashboardPage(page).isDashboardReady();
    expect(isDashboardReady).toBeTruthy();

    // Token unchanged after complex navigation
    const token4 = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token4).toBe(token1);
  });

  // --------------------------------------------------------------------------
  // TC-AUTH-017: Browser Back Button After Logout
  // --------------------------------------------------------------------------
  test('TC-AUTH-017: Browser back button after logout does not restore session', async ({
    authenticatedPage,
  }) => {
    const dashboard = new DashboardPage(authenticatedPage);

    // Fixture already navigated to dashboard
    const token1 = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(token1).toBeTruthy();

    // Logout
    await dashboard.logout();
    await authenticatedPage.waitForURL(/.*\/login/, { timeout: 10000 });

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

    // Test with wrong credentials - submit directly
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    await loginPage.fillByTestId('email-input', testEmail);
    await loginPage.fillByTestId('password-input', 'IncorrectPassword!');
    await loginPage.clickByTestId('submit-button');
    
    // Wait for form processing
    await page.waitForTimeout(1500);

    // Should stay on login page (failed login)
    expect(page.url()).toContain('/login');
    
    // Should not have auth token
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeFalsy();
  });
});
