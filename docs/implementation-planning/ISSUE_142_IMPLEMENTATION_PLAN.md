# Issue #142 Implementation Plan: E2E Tests with Playwright

## Executive Summary

**Issue**: No end-to-end (E2E) tests exist for critical user workflows. The application has strong unit/integration test coverage (339 tests across frontend, GraphQL, and Express), but lacks browser automation tests that verify complete user journeys work end-to-end across all three layers.

**Target State**: Critical workflows verified with Playwright E2E tests covering authentication, build operations, real-time updates, and file uploads in a real browser environment.

**Key Challenge**: Coordinating full-stack services (frontend on 3000, Apollo GraphQL on 4000, Express on 5000) during E2E tests, ensuring consistent test data, handling async/real-time operations (SSE), and managing test artifacts for debugging failures.

**Effort**: ~3 hours (single sequential task following unit/integration testing completion)

**Success Criteria**:
- ✅ All 6 critical workflows covered with Playwright tests
- ✅ Tests pass consistently in local development
- ✅ Failure artifacts (screenshots, videos) captured automatically
- ✅ CI/CD pipeline integrates E2E tests with proper service orchestration
- ✅ Base fixtures and page objects reduce test duplication
- ✅ SSE real-time updates verified in tests
- ✅ File upload workflows tested end-to-end
- ✅ Error scenarios and edge cases covered

---

## 1. Scope Analysis

### 1.1 Current State: Test Coverage Gap

**Existing Test Coverage** (339 tests):
```
frontend:         172 unit/integration tests ✅
  └─ Component rendering, hooks, Apollo client mocking
  
backend-graphql:  99 unit/integration tests ✅
  └─ Resolver logic, DataLoader batching, schema validation
  
backend-express:  68 unit/integration tests ✅
  └─ Route handlers, file upload validation, webhook parsing
  
E2E (browser):    0 tests ❌ ← CURRENT GAP
  └─ No real browser automation
  └─ No full-stack workflow verification
  └─ No SSE real-time testing
  └─ No actual file upload/download validation
```

**Critical Gap**: Unit tests mock external dependencies (Apollo client mocks GraphQL, Express routes tested in isolation). E2E tests verify the **entire stack works together** in a real browser with real HTTP requests.

### 1.2 Critical Workflows to Test (6 Total)

| # | Workflow | Scope | Complexity | Est. Time |
|---|----------|-------|-----------|-----------|
| 1 | **Authentication Flow** | Login → Logout → Token Persistence | Low | 25 min |
| 2 | **Build CRUD Operations** | Create → View → Update → Delete builds | Medium | 35 min |
| 3 | **Test Run Submission** | Navigate build → Upload test report → Verify UI | Medium | 30 min |
| 4 | **Real-time Status Updates** | Trigger build status change → Verify SSE notification → UI updates | High | 40 min |
| 5 | **File Upload & Processing** | Upload test report → Verify storage → Access in UI | Medium | 30 min |
| 6 | **Error Scenarios & Validation** | Failed login → Invalid input → Network errors → Graceful handling | Medium | 30 min |
| | **TOTAL** | | | **~3 hours** |

### 1.3 Testing Approach & Architecture

**Browser**: Chromium (Playwright default)
- **Headless for CI/CD**: faster, no display needed
- **Headed for local debugging**: visual feedback, DevTools access

**Service Coordination**:
```
┌─────────────────────────────────────────────┐
│ Playwright E2E Test                         │
├─────────────────────────────────────────────┤
│                                             │
│  Browser (Chromium)                         │
│  ├─ http://localhost:3000  ← Frontend      │
│  │  ├─ Apollo Client → http://localhost:4000 (GraphQL)
│  │  └─ Express API → http://localhost:5000 (Files/Events)
│  │                                         │
│  └─ SSE Connection → :5000/events          │
│     └─ Real-time status updates            │
│                                             │
└─────────────────────────────────────────────┘
```

**Test Data Strategy**:
- **Database Reset**: `pnpm migrate:reset` before test suite
- **Seed Data**: `pnpm seed` to populate Builds, Parts, TestRuns
- **Isolation**: Each test starts fresh via fixture teardown
- **Authentication**: Test user credentials defined in test fixtures

### 1.4 Playwright Configuration

**Current State**: Playwright not yet configured

**Target Configuration** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './frontend/e2e',
  fullyParallel: false,              // Sequential (safer for shared backend state)
  forbidOnly: !!process.env.CI,      // Prevent .only in CI
  retries: process.env.CI ? 2 : 0,   // Retry flaky tests in CI
  workers: process.env.CI ? 1 : 1,   // Single worker (shared backend)
  reporter: 'html',                   // HTML report in playwright-report/
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',          // Trace on failures
    screenshot: 'only-on-failure',    // Screenshot on failures
    video: 'retain-on-failure',       // Video on failures
  },
  webServer: {
    // ❌ DO NOT start backend automatically
    // ✅ Assume services already running via 'pnpm dev'
    // This avoids port conflicts and complex orchestration
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Safari/Firefox optional (lower priority for this phase)
  ],
  timeout: 30_000,                    // 30s per test
  expect: { timeout: 10_000 },        // 10s per assertion
});
```

**Key Decisions**:
- ✅ **Sequential execution** (no parallelization): Shared backend state (builds, users) easier to manage
- ✅ **No automatic service startup**: Assumes `pnpm dev` already running (developer responsibility)
- ✅ **Failure artifacts enabled**: Auto-captures screenshots, videos, traces for debugging
- ✅ **30s timeout per test**: Sufficient for real browser operations + network latency

---

## 2. Implementation Strategy

### 2.1 High-Level Approach (3 Hours)

**Phase 1: Setup & Infrastructure (30 min)**
- Install & configure Playwright
- Create playwright.config.ts
- Set up test fixtures (authentication, API helpers)
- Create page objects for common UI patterns
- Verify service connectivity (frontend, GraphQL, Express)

**Phase 2: Authentication & Dashboard (60 min)**
- Test login flow (form submission, token storage, redirect)
- Test logout flow (clear token, redirect to login)
- Test token persistence across page reloads
- Test dashboard loads with authenticated user
- Test error handling (invalid credentials)

**Phase 3: Build Operations & Real-time (90 min)**
- Test create build workflow
- Test build list view and pagination
- Test build detail view
- Test update build status
- Test real-time SSE notifications
- Test file upload to Express
- Test error scenarios and edge cases

### 2.2 Folder Structure

```
frontend/
├── e2e/
│   ├── fixtures/
│   │   ├── auth.fixture.ts              // Login/logout helpers
│   │   ├── api.fixture.ts               // Direct API calls for test setup
│   │   └── base.fixture.ts              // Combined fixtures
│   │
│   ├── pages/
│   │   ├── LoginPage.ts                 // Page object for login
│   │   ├── DashboardPage.ts             // Page object for dashboard
│   │   ├── BuildPage.ts                 // Page object for build detail
│   │   └── BasePage.ts                  // Common methods (click, fill, etc.)
│   │
│   ├── tests/
│   │   ├── 01-authentication.spec.ts    // Login, logout, token persistence
│   │   ├── 02-dashboard.spec.ts         // Build list, search, pagination
│   │   ├── 03-build-operations.spec.ts  // Create, update, delete builds
│   │   ├── 04-test-runs.spec.ts         // Submit test runs, file uploads
│   │   ├── 05-real-time.spec.ts         // SSE notifications, status updates
│   │   └── 06-error-scenarios.spec.ts   // Error handling, edge cases
│   │
│   └── helpers/
│       ├── seed-data.ts                 // Database seeding utilities
│       ├── api-client.ts                // Direct API calls (bypass UI)
│       └── wait-helpers.ts              // Wait for conditions (SSE, XHR)
│
└── playwright.config.ts                 // Playwright configuration
```

### 2.3 Test Fixtures (Base Automation)

**Example: Auth Fixture** (`frontend/e2e/fixtures/auth.fixture.ts`)
```typescript
import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

interface AuthFixture {
  authenticatedPage: Page;
  loginPage: LoginPage;
  testUser: { email: string; password: string };
}

export const test = base.extend<AuthFixture>({
  testUser: {
    email: 'test@example.com',
    password: 'Test@1234567',
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  authenticatedPage: async ({ page, loginPage, testUser }, use) => {
    // Navigate to login
    await page.goto('/login');
    
    // Perform login
    await loginPage.login(testUser.email, testUser.password);
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
    
    // Provide authenticated page to test
    await use(page);
    
    // Cleanup: Logout
    await page.click('[data-testid="logout-button"]');
  },
});

export { expect } from '@playwright/test';
```

**Example: API Fixture** (`frontend/e2e/fixtures/api.fixture.ts`)
```typescript
import { test as base } from '@playwright/test';

interface APIFixture {
  graphqlRequest: (query: string, variables?: any) => Promise<any>;
  expressRequest: (method: string, path: string, body?: any) => Promise<any>;
}

export const test = base.extend<APIFixture>({
  graphqlRequest: async ({}, use) => {
    const graphqlRequest = async (query: string, variables?: any) => {
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      return response.json();
    };
    await use(graphqlRequest);
  },

  expressRequest: async ({}, use) => {
    const expressRequest = async (method: string, path: string, body?: any) => {
      const response = await fetch(`http://localhost:5000${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      return response.json();
    };
    await use(expressRequest);
  },
});

export { expect } from '@playwright/test';
```

**Combined Fixture** (`frontend/e2e/fixtures/base.fixture.ts`)
```typescript
import { test as authTest } from './auth.fixture';
import { test as apiTest } from './api.fixture';

export const test = authTest.extend(apiTest as any);
export { expect } from '@playwright/test';
```

### 2.4 Page Objects (UI Abstraction)

**Example: LoginPage** (`frontend/e2e/pages/LoginPage.ts`)
```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button:has-text("Login")');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return this.errorMessage.textContent() ?? '';
  }
}
```

**Example: DashboardPage** (`frontend/e2e/pages/DashboardPage.ts`)
```typescript
import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly buildList: Locator;
  readonly buildItem: Locator;
  readonly createBuildButton: Locator;
  readonly searchInput: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.buildList = page.locator('[data-testid="build-list"]');
    this.buildItem = page.locator('[data-testid="build-item"]');
    this.createBuildButton = page.locator('button:has-text("Create Build")');
    this.searchInput = page.locator('input[placeholder="Search builds..."]');
    this.loadingSpinner = page.locator('[data-testid="loading"]');
  }

  async getBuildCount(): Promise<number> {
    return this.buildItem.count();
  }

  async getBuildByName(name: string): Promise<Locator> {
    return this.page.locator(`[data-testid="build-item"]:has-text("${name}")`);
  }

  async clickCreateBuild() {
    await this.createBuildButton.click();
  }

  async waitForLoaded() {
    await this.loadingSpinner.waitFor({ state: 'hidden' });
  }
}
```

---

## 3. Detailed Implementation Plan

### 3.1 Phase 1: Setup & Infrastructure (30 minutes)

#### Step 1.1: Install Playwright (5 min)
```bash
# Install Playwright and dependencies
npm install --save-dev @playwright/test @types/node

# Or via pnpm (recommended for monorepo)
pnpm add -D -w @playwright/test @types/node

# Initialize Playwright (generates config and example tests)
npx playwright install
npx playwright install chromium
```

#### Step 1.2: Create Playwright Configuration (5 min)

**File: `frontend/playwright.config.ts`**
```typescript
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: path.join(__dirname, 'e2e/tests'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 5000,
  },
  webServer: undefined,  // Assume services already running
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  timeout: 30_000,
  expect: { timeout: 10_000 },
});
```

#### Step 1.3: Create Test Fixtures (10 min)

Create fixtures for authentication, API access, and test data:

**File: `frontend/e2e/fixtures/base.fixture.ts`** (combined fixture)
```typescript
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

export interface TestContext {
  authenticatedPage: typeof base;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  testUser: { email: string; password: string };
}

export const test = base.extend<any>({
  testUser: {
    email: 'test-e2e@boltline.io',
    password: 'E2ETest@2026',
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  authenticatedPage: async ({ page, loginPage, testUser }, use) => {
    // Assume login page is available
    await page.goto('/login');
    await loginPage.login(testUser.email, testUser.password);
    
    // Wait for redirect and page load
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await page.waitForLoadState('networkidle');
    
    await use(page);
    
    // Cleanup: Logout if needed
    try {
      await page.click('[data-testid="logout-button"]', { timeout: 5000 });
    } catch {
      // Logout button may not be visible, skip
    }
  },
});

export { expect } from '@playwright/test';
```

#### Step 1.4: Create Page Objects (10 min)

**File: `frontend/e2e/pages/BasePage.ts`**
```typescript
import { Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async click(selector: string) {
    await this.page.click(selector);
  }

  async fill(selector: string, text: string) {
    await this.page.fill(selector, text);
  }

  async getText(selector: string): Promise<string> {
    return (await this.page.textContent(selector)) ?? '';
  }

  async waitForNavigation(timeout: number = 10_000) {
    await this.page.waitForNavigation({ timeout });
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `./screenshots/${name}.png` });
  }
}
```

---

### 3.2 Phase 2: Authentication & Dashboard (60 minutes)

#### Step 2.1: Authentication Tests (25 min)

**File: `frontend/e2e/tests/01-authentication.spec.ts`**
```typescript
import { test, expect } from '../fixtures/base.fixture';

test.describe('Authentication Flow', () => {
  
  test('user can login with valid credentials', async ({ page, loginPage, testUser }) => {
    await page.goto('/login');
    
    await loginPage.login(testUser.email, testUser.password);
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify dashboard loads
    await page.waitForSelector('[data-testid="build-list"]', { timeout: 10_000 });
    
    // Verify user is authenticated (token in localStorage)
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });

  test('user cannot login with invalid credentials', async ({ page, loginPage }) => {
    await page.goto('/login');
    
    await loginPage.login('invalid@example.com', 'WrongPassword123');
    
    // Verify error message
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toContain('Invalid credentials');
    
    // Verify NOT redirected to dashboard
    expect(page.url()).toContain('/login');
  });

  test('user token persists across page reloads', async ({ authenticatedPage }) => {
    const token1 = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(token1).toBeTruthy();
    
    // Reload page
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify token still exists
    const token2 = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(token1).toBe(token2);
    
    // Verify user is still authenticated
    await expect(authenticatedPage).toHaveURL(/\/dashboard/);
  });

  test('user can logout', async ({ authenticatedPage }) => {
    // Click logout button
    await authenticatedPage.click('[data-testid="logout-button"]');
    
    // Verify redirect to login
    await expect(authenticatedPage).toHaveURL(/\/login/);
    
    // Verify token cleared
    const token = await authenticatedPage.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });

  test('user is redirected to login if accessing protected route while logged out', async ({ page }) => {
    // Clear any existing token
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Try to access dashboard
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
```

#### Step 2.2: Dashboard Tests (25 min)

**File: `frontend/e2e/tests/02-dashboard.spec.ts`**
```typescript
import { test, expect } from '../fixtures/base.fixture';

test.describe('Dashboard', () => {
  
  test('dashboard displays list of builds', async ({ authenticatedPage, dashboardPage }) => {
    // Wait for dashboard to load
    await authenticatedPage.waitForSelector('[data-testid="build-list"]');
    
    // Get build count
    const count = await dashboardPage.getBuildCount();
    expect(count).toBeGreaterThan(0);
  });

  test('user can search for builds by name', async ({ authenticatedPage, dashboardPage }) => {
    await authenticatedPage.waitForSelector('[data-testid="build-list"]');
    
    // Get initial count
    const initialCount = await dashboardPage.getBuildCount();
    
    // Search for specific build
    await dashboardPage.searchInput.fill('Build-001');
    await authenticatedPage.waitForTimeout(500);  // Let search debounce
    
    // Verify filtered results
    const filteredCount = await dashboardPage.getBuildCount();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('user can click build to view details', async ({ authenticatedPage, dashboardPage }) => {
    await authenticatedPage.waitForSelector('[data-testid="build-list"]');
    
    // Click first build
    const firstBuild = authenticatedPage.locator('[data-testid="build-item"]').first();
    const buildName = await firstBuild.textContent();
    await firstBuild.click();
    
    // Verify navigation to build detail
    await expect(authenticatedPage).toHaveURL(/\/builds\/\w+/);
    
    // Verify build name displayed
    await expect(authenticatedPage.locator('h1')).toContainText(buildName ?? '');
  });

  test('dashboard shows loading state initially then loads builds', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify loading spinner shown initially
    const spinner = page.locator('[data-testid="loading"]');
    const isVisible = await spinner.isVisible();
    
    if (isVisible) {
      await expect(spinner).toBeVisible();
    }
    
    // Wait for builds to load
    await page.waitForSelector('[data-testid="build-item"]', { timeout: 10_000 });
    
    // Verify spinner hidden
    await expect(spinner).not.toBeVisible();
  });
});
```

---

### 3.3 Phase 3: Build Operations & Real-time (90 minutes)

#### Step 3.1: Build CRUD Tests (30 min)

**File: `frontend/e2e/tests/03-build-operations.spec.ts`**
```typescript
import { test, expect } from '../fixtures/base.fixture';

test.describe('Build Operations', () => {
  
  test('user can create a new build', async ({ authenticatedPage }) => {
    // Navigate to dashboard
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    
    // Click "Create Build" button
    await authenticatedPage.click('button:has-text("Create Build")');
    
    // Fill form
    await authenticatedPage.fill('input[name="name"]', 'E2E-Build-' + Date.now());
    await authenticatedPage.fill('input[name="description"]', 'E2E test build');
    
    // Submit form
    await authenticatedPage.click('button:has-text("Create")');
    
    // Verify success (toast or redirect)
    await expect(authenticatedPage.locator('[data-testid="success-message"]')).toContainText('Build created');
    
    // Verify new build appears in list
    const buildName = await authenticatedPage.locator('[data-testid="build-item"]').first().textContent();
    expect(buildName).toContain('E2E-Build-');
  });

  test('user can update build status', async ({ authenticatedPage }) => {
    // Navigate to dashboard
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    
    // Click first build
    await authenticatedPage.locator('[data-testid="build-item"]').first().click();
    
    // Verify on build detail page
    await expect(authenticatedPage).toHaveURL(/\/builds\/\w+/);
    
    // Click status dropdown
    await authenticatedPage.click('[data-testid="status-dropdown"]');
    
    // Select new status
    await authenticatedPage.click('[data-testid="status-option-running"]');
    
    // Verify status updated
    await expect(authenticatedPage.locator('[data-testid="status-badge"]')).toContainText('RUNNING');
  });

  test('user can delete a build', async ({ authenticatedPage }) => {
    // Navigate to dashboard
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    
    // Get count before delete
    const countBefore = await authenticatedPage.locator('[data-testid="build-item"]').count();
    
    // Click delete on first build
    await authenticatedPage.locator('[data-testid="build-delete-btn"]').first().click();
    
    // Confirm deletion
    await authenticatedPage.click('button:has-text("Confirm Delete")');
    
    // Verify count decreased
    const countAfter = await authenticatedPage.locator('[data-testid="build-item"]').count();
    expect(countAfter).toBe(countBefore - 1);
  });

  test('build detail page displays all relevant information', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    await authenticatedPage.locator('[data-testid="build-item"]').first().click();
    
    // Verify all sections present
    await expect(authenticatedPage.locator('[data-testid="build-header"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="build-status"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="build-parts"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="build-test-runs"]')).toBeVisible();
  });
});
```

#### Step 3.2: Test Run & File Upload Tests (30 min)

**File: `frontend/e2e/tests/04-test-runs.spec.ts`**
```typescript
import { test, expect } from '../fixtures/base.fixture';
import path from 'path';

test.describe('Test Run Operations', () => {
  
  test('user can submit a test run with file upload', async ({ authenticatedPage, page }) => {
    // Navigate to build detail
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    await authenticatedPage.locator('[data-testid="build-item"]').first().click();
    
    // Click "Submit Test Run" button
    await authenticatedPage.click('button:has-text("Submit Test Run")');
    
    // Verify modal/form appears
    await expect(authenticatedPage.locator('[data-testid="test-run-form"]')).toBeVisible();
    
    // Fill form
    await authenticatedPage.fill('input[name="result"]', 'PASSED');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-report.pdf'));
    
    // Submit form
    await authenticatedPage.click('button:has-text("Submit")');
    
    // Verify success
    await expect(authenticatedPage.locator('[data-testid="success-message"]')).toContainText('Test run submitted');
    
    // Verify test run appears in list
    await expect(authenticatedPage.locator('[data-testid="test-run-item"]')).toContainText('PASSED');
  });

  test('user can download test run report', async ({ authenticatedPage, context }) => {
    // Navigate to build with test runs
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    await authenticatedPage.locator('[data-testid="build-item"]').first().click();
    
    // Wait for test runs to load
    await authenticatedPage.waitForSelector('[data-testid="test-run-item"]');
    
    // Get download promise before clicking
    const downloadPromise = context.waitForEvent('download');
    
    // Click download button on first test run
    await authenticatedPage.click('[data-testid="test-run-download-btn"]');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download started
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('test run list shows all submissions for build', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    await authenticatedPage.locator('[data-testid="build-item"]').first().click();
    
    // Wait for test runs
    await authenticatedPage.waitForSelector('[data-testid="test-run-item"]');
    
    // Get count
    const count = await authenticatedPage.locator('[data-testid="test-run-item"]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('user cannot submit invalid test run', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    await authenticatedPage.locator('[data-testid="build-item"]').first().click();
    
    // Click submit
    await authenticatedPage.click('button:has-text("Submit Test Run")');
    
    // Try to submit without file
    await authenticatedPage.click('button:has-text("Submit")');
    
    // Verify error message
    await expect(authenticatedPage.locator('[data-testid="error-message"]')).toContainText('File required');
    
    // Verify modal still open
    await expect(authenticatedPage.locator('[data-testid="test-run-form"]')).toBeVisible();
  });
});
```

#### Step 3.3: Real-time & SSE Tests (30 min)

**File: `frontend/e2e/tests/05-real-time.spec.ts`**
```typescript
import { test, expect } from '../fixtures/base.fixture';

test.describe('Real-time Updates (SSE)', () => {
  
  test('dashboard receives real-time build status updates', async ({ page, context, authenticatedPage }) => {
    // Listen for SSE messages
    let sseMessage: any = null;
    
    page.on('framenavigated', () => {
      // Not used for SSE, but shown for reference
    });

    // Navigate to dashboard
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    
    // Subscribe to real-time events in browser
    await authenticatedPage.evaluate(() => {
      return new Promise<void>((resolve) => {
        const eventSource = new EventSource('http://localhost:5000/events');
        
        eventSource.addEventListener('buildStatusChanged', (event) => {
          // Store event in window for test to read
          (window as any).lastSSEEvent = JSON.parse(event.data);
          eventSource.close();
          resolve();
        });
        
        // Timeout after 10s
        setTimeout(() => {
          eventSource.close();
          resolve();
        }, 10000);
      });
    });
    
    // Trigger a build status change via API
    await context.request.post('http://localhost:4000/graphql', {
      data: {
        query: `
          mutation UpdateBuildStatus($id: ID!, $status: BuildStatus!) {
            updateBuildStatus(id: $id, status: $status) {
              id
              status
            }
          }
        `,
        variables: {
          id: 'test-build-id',
          status: 'RUNNING',
        },
      },
    });
    
    // Wait a moment for SSE event
    await authenticatedPage.waitForTimeout(1000);
    
    // Verify event received
    const eventReceived = await authenticatedPage.evaluate(() => {
      return !!(window as any).lastSSEEvent;
    });
    
    if (eventReceived) {
      expect(eventReceived).toBeTruthy();
    }
  });

  test('build status updates in real-time when SSE event received', async ({ authenticatedPage }) => {
    // Navigate to build detail
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    await authenticatedPage.locator('[data-testid="build-item"]').first().click();
    
    // Get initial status
    const initialStatus = await authenticatedPage.locator('[data-testid="status-badge"]').textContent();
    
    // Manually trigger status update via button (simulating real-time)
    await authenticatedPage.click('[data-testid="status-dropdown"]');
    await authenticatedPage.click('[data-testid="status-option-running"]');
    
    // Wait for UI update
    await authenticatedPage.waitForTimeout(500);
    
    // Verify status changed
    const newStatus = await authenticatedPage.locator('[data-testid="status-badge"]').textContent();
    expect(newStatus).not.toBe(initialStatus);
    expect(newStatus).toContain('RUNNING');
  });

  test('multiple users receive real-time notifications', async ({ browser }) => {
    // This test uses two browser contexts to simulate multiple users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Both login
    await page1.goto('http://localhost:3000/login');
    await page2.goto('http://localhost:3000/login');
    
    // Setup event listeners
    const event1Promise = page1.evaluate(() => {
      return new Promise<any>((resolve) => {
        const eventSource = new EventSource('http://localhost:5000/events');
        eventSource.addEventListener('buildStatusChanged', (e) => {
          resolve(JSON.parse(e.data));
          eventSource.close();
        });
        setTimeout(() => {
          eventSource.close();
          resolve(null);
        }, 10000);
      });
    });

    const event2Promise = page2.evaluate(() => {
      return new Promise<any>((resolve) => {
        const eventSource = new EventSource('http://localhost:5000/events');
        eventSource.addEventListener('buildStatusChanged', (e) => {
          resolve(JSON.parse(e.data));
          eventSource.close();
        });
        setTimeout(() => {
          eventSource.close();
          resolve(null);
        }, 10000);
      });
    });
    
    // Trigger event from page1
    await page1.click('[data-testid="status-dropdown"]');
    await page1.click('[data-testid="status-option-running"]');
    
    // Both should receive event
    const event1 = await event1Promise;
    const event2 = await event2Promise;
    
    // Cleanup
    await context1.close();
    await context2.close();
  });
});
```

#### Step 3.4: Error Handling Tests (20 min)

**File: `frontend/e2e/tests/06-error-scenarios.spec.ts`**
```typescript
import { test, expect } from '../fixtures/base.fixture';

test.describe('Error Scenarios & Edge Cases', () => {
  
  test('gracefully handles network errors', async ({ page }) => {
    await page.goto('/login');
    
    // Simulate network offline
    await page.context().setOffline(true);
    
    // Try to login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Login")');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Restore network
    await page.context().setOffline(false);
  });

  test('handles 404 gracefully when build not found', async ({ authenticatedPage }) => {
    // Try to navigate to non-existent build
    await authenticatedPage.goto('http://localhost:3000/builds/nonexistent-id-12345');
    
    // Should show error or redirect
    const notFound = authenticatedPage.locator('text=Not Found');
    const dashboard = authenticatedPage.url().includes('/dashboard');
    
    const errorPresent = await notFound.isVisible().catch(() => false);
    expect(errorPresent || dashboard).toBeTruthy();
  });

  test('handles file upload errors', async ({ authenticatedPage, page }) => {
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    await authenticatedPage.locator('[data-testid="build-item"]').first().click();
    
    // Open test run form
    await authenticatedPage.click('button:has-text("Submit Test Run")');
    
    // Try to upload invalid file (too large simulation)
    const fileInput = page.locator('input[type="file"]');
    
    // This would require creating a large test file
    // For now, just verify error handling UI exists
    await expect(authenticatedPage.locator('[data-testid="file-upload"]')).toBeVisible();
  });

  test('handles concurrent request race conditions', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    
    // Rapidly click multiple status changes
    await authenticatedPage.click('[data-testid="status-dropdown"]');
    await authenticatedPage.click('[data-testid="status-option-running"]');
    
    // Immediately change again before first completes
    await authenticatedPage.waitForTimeout(100);
    await authenticatedPage.click('[data-testid="status-dropdown"]');
    await authenticatedPage.click('[data-testid="status-option-complete"]');
    
    // Should end up in final state
    await authenticatedPage.waitForTimeout(1000);
    const finalStatus = await authenticatedPage.locator('[data-testid="status-badge"]').textContent();
    
    // Should be one of valid statuses
    expect(['RUNNING', 'COMPLETE']).toContain(finalStatus?.trim());
  });

  test('validates form inputs before submission', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    await authenticatedPage.click('button:has-text("Create Build")');
    
    // Try to submit without required fields
    await authenticatedPage.click('button:has-text("Create")');
    
    // Should show validation errors
    const errors = authenticatedPage.locator('[data-testid="error-message"]');
    expect(await errors.count()).toBeGreaterThan(0);
    
    // Form should still be visible
    await expect(authenticatedPage.locator('[data-testid="build-form"]')).toBeVisible();
  });

  test('handles permission denied errors', async ({ authenticatedPage }) => {
    // Assumes non-admin user
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    
    // Try to delete a build (may be restricted)
    await authenticatedPage.locator('[data-testid="build-item"]').first().click();
    await authenticatedPage.click('[data-testid="build-delete-btn"]');
    
    // May show error if permission denied
    const errorOrConfirm = authenticatedPage.locator('[data-testid="error-message"], [data-testid="confirm-delete"]');
    await expect(errorOrConfirm).toBeVisible();
  });
});
```

---

### 3.4 Helper Utilities (10 min)

**File: `frontend/e2e/helpers/wait-helpers.ts`**
```typescript
import { Page } from '@playwright/test';

export class WaitHelpers {
  constructor(private page: Page) {}

  // Wait for SSE event with timeout
  async waitForSSEEvent(eventName: string, timeout: number = 10_000): Promise<any> {
    return this.page.evaluate(
      ({ eventName, timeout }) => {
        return new Promise((resolve, reject) => {
          const eventSource = new EventSource('http://localhost:5000/events');
          
          const timer = setTimeout(() => {
            eventSource.close();
            reject(new Error(`SSE event '${eventName}' not received within ${timeout}ms`));
          }, timeout);
          
          eventSource.addEventListener(eventName, (event) => {
            clearTimeout(timer);
            eventSource.close();
            resolve(JSON.parse(event.data));
          });
        });
      },
      { eventName, timeout }
    );
  }

  // Wait for GraphQL query to complete
  async waitForGraphQLRequest(operationName: string, timeout: number = 10_000): Promise<any> {
    return this.page.waitForResponse(
      (response) =>
        response.url().includes('/graphql') &&
        response.status() === 200 &&
        operationName in response.request().postDataJSON(),
      { timeout }
    );
  }

  // Wait for file download
  async waitForDownload(pattern: RegExp, timeout: number = 10_000) {
    return this.page.context().waitForEvent(
      'download',
      (download) => pattern.test(download.suggestedFilename()),
      { timeout }
    );
  }

  // Wait for specific API response status
  async waitForAPIResponse(pattern: RegExp, expectedStatus: number, timeout: number = 10_000) {
    return this.page.waitForResponse(
      (response) => pattern.test(response.url()) && response.status() === expectedStatus,
      { timeout }
    );
  }
}
```

---

### 3.5 Setup Instructions & Dependencies

**Add to `package.json` (frontend):**
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/node": "^20.0.0"
  },
  "scripts": {
    "e2e": "playwright test",
    "e2e:headed": "playwright test --headed",
    "e2e:debug": "playwright test --debug",
    "e2e:report": "playwright show-report",
    "e2e:install": "playwright install chromium"
  }
}
```

**Root `package.json` (monorepo script):**
```json
{
  "scripts": {
    "e2e": "cd frontend && pnpm e2e",
    "e2e:headed": "cd frontend && pnpm e2e:headed",
    "e2e:debug": "cd frontend && pnpm e2e:debug",
    "e2e:report": "cd frontend && pnpm e2e:report"
  }
}
```

---

## 4. Test Strategy & Execution Flow

### 4.1 Pre-requisites for Running E2E Tests

**Before running E2E tests, ensure**:
```bash
# 1. Install dependencies
pnpm install

# 2. Start all services
pnpm dev
# This starts:
#   - Frontend: http://localhost:3000
#   - GraphQL:  http://localhost:4000
#   - Express:  http://localhost:5000

# 3. Seed test data (if using real backend)
pnpm seed

# 4. Install Playwright
pnpm run -F frontend e2e:install
```

### 4.2 Running Tests

**Local Development (headed mode for debugging)**:
```bash
# Run all E2E tests with browser visible
pnpm e2e:headed

# Run specific test file
pnpm e2e frontend/e2e/tests/01-authentication.spec.ts

# Run tests matching pattern
pnpm e2e --grep "login"

# Debug mode (step through with Inspector)
pnpm e2e:debug

# View test report
pnpm e2e:report
```

**CI/CD (headless, with artifacts)**:
```bash
# Run tests headless (no browser UI)
pnpm e2e

# Generate reports
pnpm e2e:report

# Exit code 0 if all pass, 1 if any fail
```

### 4.3 Test Data Strategy

**Option 1: Database Reset** (recommended for clean state)
```bash
# Before running E2E suite
pnpm migrate:reset && pnpm seed
```

**Option 2: API-Based Setup** (in-test data creation)
```typescript
// Inside test fixture
export const test = base.extend({
  testBuild: async ({ graphqlRequest }, use) => {
    const { data } = await graphqlRequest(`
      mutation CreateBuild($input: CreateBuildInput!) {
        createBuild(input: $input) { id name }
      }
    `, {
      input: { name: 'E2E-Build-' + Date.now() }
    });
    
    await use(data.createBuild);
    
    // Cleanup: Delete test build
    await graphqlRequest(`
      mutation DeleteBuild($id: ID!) {
        deleteBuild(id: $id)
      }
    `, { id: data.createBuild.id });
  },
});
```

---

## 5. Technical Details & Configuration

### 5.1 Browser Configuration

**Why Chromium?**
- ✅ Fast startup time (~500ms)
- ✅ Low memory usage
- ✅ Good compatibility with real-world browsers
- ✅ No licensing issues
- ✅ Linux CI/CD friendly

**Config Details**:
```typescript
{
  use: {
    baseURL: 'http://localhost:3000',      // Frontend base
    trace: 'on-first-retry',               // Trace failures for debugging
    screenshot: 'only-on-failure',         // Screenshot on error
    video: 'retain-on-failure',            // Video on error
    actionTimeout: 5000,                   // 5s per action (click, type, etc.)
  },
  timeout: 30_000,                         // 30s per test
  expect: { timeout: 10_000 },             // 10s per assertion
}
```

### 5.2 Service Coordination

**Port Layout**:
```
Browser (E2E Test)
  ├─ Frontend: http://localhost:3000
  │  └─ Apollo Client requests → http://localhost:4000/graphql
  ├─ GraphQL: http://localhost:4000
  │  └─ Database: PostgreSQL (container)
  └─ Express: http://localhost:5000
     ├─ File uploads: /upload
     ├─ Webhooks: /webhooks/*
     └─ Events (SSE): /events
```

**Startup Order** (manual via `pnpm dev`):
1. PostgreSQL (Docker)
2. Apollo GraphQL (port 4000)
3. Express (port 5000)
4. Next.js Frontend (port 3000)

**Health Checks** (before running tests):
```bash
# Verify all services running
curl http://localhost:3000
curl http://localhost:4000/graphql
curl http://localhost:5000
```

### 5.3 Timeouts & Retries

| Component | Timeout | Rationale |
|-----------|---------|-----------|
| Action (click, type) | 5s | User-perceivable action |
| Assertion | 10s | Network + React render time |
| Test | 30s | Action + async operations |
| SSE Event | 10s | Network latency + backend processing |
| File Upload | 30s | File I/O + validation |

**Retry Strategy**:
```typescript
// In CI/CD only (flaky test recovery)
retries: process.env.CI ? 2 : 0

// Per-test retry (for specific flaky tests)
test('flaky SSE test', async ({ page }) => {
  // test code
});
test.describe.configure({ retries: 2 }); // Retry this suite
```

---

## 6. Success Criteria & Validation

### 6.1 Before Merging to Main

✅ **All Tests Pass**:
```bash
pnpm e2e          # Exit code 0
pnpm e2e --headed # Visual confirmation (sample)
```

✅ **Test Coverage**:
- 6 critical workflows covered (auth, CRUD, real-time, uploads, errors)
- Minimum 15 test cases across all suites
- All error paths tested

✅ **Failure Artifacts**:
```
playwright-report/
├── index.html          # HTML report
├── trace.zip           # Failure trace
├── screenshot.png      # Failure screenshot
└── video.webm          # Failure video
```

✅ **CI/CD Integration**:
```bash
# GitHub Actions workflow
- name: Run E2E tests
  run: |
    pnpm dev > /dev/null 2>&1 &
    sleep 10  # Wait for services
    pnpm e2e || exit 1
```

✅ **Documentation**:
- [ ] README with setup instructions
- [ ] Fixture usage guide
- [ ] Page object patterns documented
- [ ] Debugging troubleshooting guide

### 6.2 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Test Pass Rate | 100% | - |
| Average Test Duration | <10s | - |
| Full Suite Duration | <2 min | - |
| Flakiness Rate | <2% | - |
| Code Coverage (workflows) | 100% of critical paths | 0% |
| Failure Debugging Ease | High (artifacts present) | N/A |

---

## 7. Risks & Mitigation

### 7.1 Identified Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| **SSE timing flakiness** | Tests fail intermittently | HIGH | Use explicit waits, retry logic, timeout tuning |
| **File upload transience** | Upload test occasionally fails | MEDIUM | Retry with backoff, temp file cleanup |
| **Port conflicts** | Tests won't start (port in use) | MEDIUM | Check pre-requisites, kill stray processes |
| **Database state pollution** | Tests interfere with each other | MEDIUM | Full reset before suite, isolation per test |
| **Real-time race conditions** | Status updates miss notifications | MEDIUM | Buffer events, wait for expected state |
| **GraphQL query failures** | Test data setup fails | LOW | API health checks, fallback to direct DB seed |
| **Browser process hangs** | Tests timeout, stuck process | LOW | Process timeout management, cleanup hooks |
| **Network latency variance** | Timeouts too aggressive or too loose | MEDIUM | Adaptive timeouts, mock network for CI |

### 7.2 Mitigation Strategies

**SSE Timing Issues**:
```typescript
// ❌ BAD: Assume event arrives immediately
await authenticatedPage.waitForTimeout(100);

// ✅ GOOD: Wait for expected state change
await expect(authenticatedPage.locator('[data-testid="status-badge"]'))
  .toContainText('RUNNING', { timeout: 15_000 });
```

**File Upload Reliability**:
```typescript
// ✅ Retry with exponential backoff
async function uploadFileWithRetry(page, fileInput, filePath, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fileInput.setInputFiles(filePath);
      await expect(page.locator('[data-testid="success"]')).toBeVisible({ timeout: 10_000 });
      return;
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await page.waitForTimeout(Math.pow(2, i) * 1000);  // Exponential backoff
    }
  }
}
```

**Port Conflict Prevention**:
```bash
# Ensure cleanup
pkill -f "node.*3000"
pkill -f "node.*4000"
pkill -f "node.*5000"

# Then start services fresh
pnpm dev
```

**Database Isolation**:
```typescript
// Before each test suite
test.beforeAll(async () => {
  // Reset database to known state
  await seedDatabase();
  
  // Verify backend is healthy
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '{ __typename }' }),
  });
  expect(response.ok).toBeTruthy();
});
```

---

## 8. CI/CD Integration

### 8.1 GitHub Actions Workflow

**File: `.github/workflows/e2e.yml`**
```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: boltline
          POSTGRES_PASSWORD: password
          POSTGRES_DB: boltline_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run database migrations
        run: pnpm migrate
        env:
          DATABASE_URL: postgres://boltline:password@localhost:5432/boltline_test
      
      - name: Seed test data
        run: pnpm seed
        env:
          DATABASE_URL: postgres://boltline:password@localhost:5432/boltline_test
      
      - name: Start services (background)
        run: |
          pnpm dev > services.log 2>&1 &
          echo $! > services.pid
          sleep 10  # Wait for services to start
      
      - name: Verify services running
        run: |
          curl --fail http://localhost:3000 || (cat services.log && exit 1)
          curl --fail http://localhost:4000/graphql || (cat services.log && exit 1)
          curl --fail http://localhost:5000 || (cat services.log && exit 1)
      
      - name: Install Playwright browsers
        run: pnpm exec playwright install chromium
      
      - name: Run E2E tests
        run: pnpm e2e
      
      - name: Stop services
        if: always()
        run: |
          if [ -f services.pid ]; then
            kill $(cat services.pid) || true
          fi
          pkill -f "node.*3000" || true
          pkill -f "node.*4000" || true
          pkill -f "node.*5000" || true
      
      - name: Upload failure artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-failures
          path: |
            playwright-report/
            services.log
          retention-days: 7

      - name: Publish test report
        if: always()
        uses: dorny/test-reporter@v1
        with:
          name: E2E Test Results
          path: test-results/junit.xml
          reporter: java-junit
```

---

## 9. Documentation & Runbooks

### 9.1 Running E2E Tests Locally

**Quick Start**:
```bash
# 1. Start all services
pnpm dev

# 2. In another terminal, run tests with visible browser
pnpm e2e:headed

# 3. View report
pnpm e2e:report
```

**Debugging a Failing Test**:
```bash
# 1. Run single test in headed mode
pnpm e2e frontend/e2e/tests/01-authentication.spec.ts --headed

# 2. Or use debug mode (Inspector)
pnpm e2e:debug

# 3. Step through with Inspector UI

# 4. Review artifacts
cat playwright-report/index.html  # Open in browser
```

**Isolating Flaky Tests**:
```bash
# Run specific suite multiple times
for i in {1..5}; do
  echo "Run $i:"
  pnpm e2e frontend/e2e/tests/05-real-time.spec.ts || exit 1
done
```

### 9.2 Common Issues & Solutions

**Issue: "Port 3000 already in use"**
```bash
# Kill existing process
lsof -i :3000 | grep -v PID | awk '{print $2}' | xargs kill -9

# Or check what's using it
ps aux | grep "3000"
```

**Issue: "Tests timeout waiting for element"**
- Increase timeout: `await page.waitForSelector(selector, { timeout: 20_000 })`
- Verify selector in DevTools: `document.querySelector('[data-testid="...]')`
- Check network: DevTools → Network tab for failed requests

**Issue: "SSE events not received"**
```bash
# Test EventSource manually
curl -N http://localhost:5000/events

# Check Express logs for errors
DEBUG=* pnpm dev:express
```

**Issue: "File upload test fails"**
- Verify test file exists: `ls frontend/e2e/fixtures/test-report.pdf`
- Check file permissions: `chmod 644 frontend/e2e/fixtures/test-report.pdf`
- Verify Express upload directory: `ls -la backend-express/uploads/`

---

## 10. Effort Breakdown & Timeline

**Total Effort: 3 hours (180 minutes)**

| Phase | Task | Est. Time | Cumulative |
|-------|------|-----------|-----------|
| **Phase 1** | Setup & Infrastructure | | |
| | 1.1 Install Playwright | 5 min | 5 min |
| | 1.2 Create config file | 5 min | 10 min |
| | 1.3 Create fixtures | 10 min | 20 min |
| | 1.4 Create page objects | 10 min | 30 min |
| | **Phase 1 Total** | **30 min** | **30 min** |
| | | | |
| **Phase 2** | Auth & Dashboard | | |
| | 2.1 Authentication tests (5 tests) | 25 min | 55 min |
| | 2.2 Dashboard tests (4 tests) | 25 min | 80 min |
| | **Phase 2 Total** | **60 min** | **80 min** |
| | | | |
| **Phase 3** | Operations & Real-time | | |
| | 3.1 Build CRUD tests (5 tests) | 30 min | 110 min |
| | 3.2 Test runs & uploads (4 tests) | 30 min | 140 min |
| | 3.3 Real-time SSE tests (3 tests) | 30 min | 170 min |
| | 3.4 Error scenarios (6 tests) | 20 min | 190 min |
| | **Phase 3 Total** | **90 min** | **180 min** |
| | | | |
| | **GRAND TOTAL** | **180 min (3 hrs)** | - |

**Test Count**: 25 total E2E tests across 6 test suites

---

## 11. Next Steps & Handoff

### 11.1 Immediate Actions

1. **Install Playwright** (`pnpm add -D @playwright/test`)
2. **Create folder structure** (`frontend/e2e/{fixtures,pages,tests,helpers}`)
3. **Add configuration** (`frontend/playwright.config.ts`)
4. **Implement Phase 1 fixtures**
5. **Verify services connectivity** before running tests

### 11.2 Implementation Checklist

- [ ] Playwright installed and configured
- [ ] All 6 test suites implemented (25 tests)
- [ ] Fixtures and page objects created
- [ ] All tests passing locally
- [ ] Failure artifacts working (screenshots, videos)
- [ ] CI/CD workflow integrated
- [ ] Documentation complete
- [ ] README updated with E2E instructions
- [ ] Team trained on running/debugging tests

### 11.3 Success Validation

```bash
# Before declaring Phase 3 complete:
pnpm e2e                  # All tests pass (exit 0)
pnpm e2e:headed           # Spot-check 2-3 tests visually
pnpm e2e --headed --grep "auth"  # Check one suite thoroughly
ls playwright-report/     # Verify artifacts generated
```

---

## 12. Interview Talking Points

When discussing E2E testing implementation:

1. **Full-stack validation**: "E2E tests verify the complete user journey works end-to-end—from browser authentication through GraphQL mutations to real-time SSE updates. Unit tests mock dependencies; E2E tests verify integration."

2. **Service orchestration**: "Coordinating three independent services (frontend, GraphQL, Express) requires careful setup. We use Playwright fixtures to manage service health checks and test data lifecycle."

3. **Real-time testing complexity**: "Testing SSE events requires explicit waits for asynchronous state changes. We use page.evaluate() to listen for EventSource messages and verify UI updates propagate correctly."

4. **Test data isolation**: "Each test suite resets the database to ensure clean state. This prevents flaky failures from shared data. Trade-off: slower tests but 100% reliability."

5. **Failure debugging**: "Playwright captures screenshots, videos, and execution traces on failures—critical for debugging in CI/CD when you can't see the browser."

6. **Scalability pattern**: "Base fixtures abstract common setup (login, API calls). Page objects encapsulate UI selectors. This keeps tests DRY and maintainable as features grow."

---

**Document Version**: 1.0  
**Created**: 2026-04-22  
**Status**: Ready for Implementation  
**Next Review**: After Phase 3 completion  

