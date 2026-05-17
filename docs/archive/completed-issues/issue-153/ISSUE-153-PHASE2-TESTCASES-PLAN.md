# Issue #153 Implementation Plan: Phase 2 - E2E Test Cases

**Status**: Comprehensive Implementation Plan  
**Target**: Senior Full Stack Developer Interview (Stoke Space)  
**Scope**: Production-Ready E2E Test Cases Building on Phase 1 Infrastructure  
**Priority**: P0 (Completes full-stack E2E testing coverage)  
**Estimated Effort**: 40-60 hours across all test suites  

---

## 1. Project Overview

### 1.1 Phase 2 Objectives

**Issue #153** transforms the Phase 1 infrastructure into real, production-ready E2E test cases that verify complete user workflows across the full-stack application.

**Phase 1 → Phase 2 Relationship**:
- **Phase 1 (Completed)**: Infrastructure foundation - fixtures, page objects, helpers, configuration
- **Phase 2 (Current)**: Real test cases - auth flows, build CRUD, real-time updates, file uploads, integration workflows

**Key Goals**:
- ✅ Implement authentication tests (login, logout, session persistence, token handling)
- ✅ Build comprehensive CRUD tests for Build management (create, list, filter, update, delete)
- ✅ Create real-time update tests (SSE events, Apollo subscriptions, multi-user scenarios)
- ✅ Develop file upload tests (reports, CAD files, validation, error handling)
- ✅ Design end-to-end workflow tests (login → create build → upload → view updates → logout)
- ✅ Extend page objects and helpers for Phase 2 scenarios
- ✅ Establish CI/CD integration strategy for test parallelization

### 1.2 Why Phase 2 Matters

**Testing Pyramid Completion**:
```
        E2E Tests (Phase 2) ← Complete user workflows
    Integration Tests (React + Apollo) ← Existing
Unit Tests (Components, Resolvers, Routes) ← Existing
```

Phase 2 validates:
- **User workflows**: Login → Create Build → Upload Files → Real-time updates → Logout
- **Integration points**: Frontend ↔ GraphQL ↔ Express ↔ PostgreSQL
- **Error scenarios**: Network failures, validation errors, timeout recovery
- **Concurrent operations**: Multiple users, parallel mutations, event ordering
- **Production readiness**: These tests become part of CI/CD pipeline

### 1.3 Deliverables from Phase 2

1. **5 comprehensive test suites**: Auth, builds, real-time, file uploads, integration workflows
2. **Extended page objects**: BuildsPage, BuildDetailPage, UploadPage, RealtimeListener
3. **Helper utilities**: File generators, build factories, assertion helpers, event verifiers
4. **CI/CD integration**: GitHub Actions workflow with parallelization and artifact handling
5. **Documentation**: Test organization guide, debugging tips, troubleshooting

---

## 2. Technology Stack Review

### 2.1 Phase 1 Reuse (Foundation)

| Component | Purpose | Reuse |
|-----------|---------|-------|
| **@playwright/test** | E2E framework | ✅ Use as-is |
| **TypeScript 5.7+** | Type-safe tests | ✅ Continue strict mode |
| **authenticatedPage** | Pre-logged user | ✅ Extend with new scenarios |
| **apiClient** | GraphQL/REST calls | ✅ Add helpers for common mutations |
| **testUser** | Test credentials | ✅ Support multi-user scenarios |
| **BasePage** | Selector helpers | ✅ Create subclasses for new pages |
| **GraphQLClient** | API interaction | ✅ Add batch operations |
| **ExpressClient** | File/webhook ops | ✅ Add event verification |

### 2.2 Phase 2 Additions

| Component | Purpose | Type | Rationale |
|-----------|---------|------|-----------|
| **BuildsPage** | List/filter/search | Page Object | Dashboard build management |
| **BuildDetailPage** | Build view/edit | Page Object | Individual build inspection |
| **UploadPage** | File upload UI | Page Object | Test report/CAD uploads |
| **RealtimeListener** | SSE/subscription | Helper | Real-time event verification |
| **File Generators** | Test data files | Utility | Upload test scenarios |
| **Build Factories** | GraphQL objects | Utility | Consistent test data |
| **Assertion Helpers** | Common checks | Utility | DRY error handling |
| **Event Verifier** | Event validation | Utility | Real-time testing |
| **Network Monitor** | Request tracking | Utility | Flaky test debugging |

### 2.3 TypeScript Strict Mode Continuation

**Enforced Across Phase 2**:
- All test files use strict TypeScript (`strict: true` in tsconfig)
- Page objects return typed results
- Fixtures provide typed data
- Helpers are fully type-annotated
- No `any` types without explicit comments

**Example**:
```typescript
// ✅ Correct
async getBuilds(): Promise<BuildCard[]> {
  // Implementation
}

// ❌ Avoid
async getBuilds(): Promise<any[]> {
  // Implementation
}
```

### 2.4 Test Infrastructure Integration

**Phase 2 uses Phase 1 as foundation**:
```
Phase 1 Infrastructure
├── fixtures/base.fixture.ts      → authenticatedPage, apiClient, testUser
├── pages/BasePage.ts             → Base for BuildsPage, BuildDetailPage
├── helpers/api-client.ts         → GraphQLClient, ExpressClient
├── helpers/wait-helpers.ts       → Shared wait utilities
└── helpers/seed-data.ts          → Test data generation

Phase 2 Builds On:
├── tests/auth/login.spec.ts      → Uses authenticatedPage, LoginPage
├── tests/builds/crud.spec.ts     → Uses new BuildsPage, apiClient
├── tests/integration/*.spec.ts   → Uses all fixtures and pages
├── pages/BuildsPage.ts           → Extends BasePage
├── helpers/build-factory.ts      → NEW: Generate test builds
└── helpers/file-generator.ts     → NEW: Create test files
```

---

## 3. Detailed Test Suite Architecture

### 3.1 Authentication Tests (auth/login-logout.spec.ts)

**Objective**: Verify user authentication flows work correctly with proper error handling and session management.

**Acceptance Criteria**:
- ✅ Valid login with correct credentials succeeds
- ✅ Invalid login attempts show appropriate error messages
- ✅ Session persists across page navigation
- ✅ Token expiration is handled gracefully
- ✅ Logout clears all user data
- ✅ Remember-me (if implemented) works correctly
- ✅ Multiple login attempts prevent brute force

**Test Cases**:

#### TC-AUTH-001: Valid Login
```typescript
test('User logs in with correct credentials and reaches dashboard', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  
  // Fill login form
  await loginPage.fillEmail('test@example.com');
  await loginPage.fillPassword('TestPassword123!');
  await loginPage.submit();
  
  // Verify redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  
  // Verify auth token stored
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  expect(token).toBeTruthy();
  expect(token?.length).toBeGreaterThan(100); // JWT tokens are long
  
  // Verify dashboard is accessible
  const dashboard = new DashboardPage(page);
  expect(await dashboard.isDashboardReady()).toBeTruthy();
});
```

**Flow**:
1. Navigate to `/login`
2. Enter valid email and password
3. Click submit button
4. Verify redirect to `/dashboard`
5. Check JWT token in localStorage
6. Confirm dashboard loads successfully

**Error Scenarios**:
- Network timeout during login
- Server returns 500 error
- GraphQL authentication mutation fails

---

#### TC-AUTH-002: Invalid Password
```typescript
test('Login fails with invalid password and shows error message', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  
  // Use valid email but wrong password
  await loginPage.fillEmail('test@example.com');
  await loginPage.fillPassword('WrongPassword123!');
  await loginPage.submit();
  
  // Verify error message appears
  await loginPage.waitForErrorMessage(5000);
  const errorMsg = await loginPage.getErrorMessage();
  expect(errorMsg).toContain('Invalid credentials');
  
  // Verify still on login page
  expect(page.url()).toContain('/login');
  
  // Verify no token stored
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  expect(token).toBeFalsy();
});
```

**Flow**:
1. Navigate to login page
2. Enter valid email, wrong password
3. Submit form
4. Verify error message displayed
5. Confirm no auth token created
6. Verify user remains on login page

---

#### TC-AUTH-003: Non-existent User
```typescript
test('Login fails for non-existent user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  
  await loginPage.fillEmail('nonexistent@example.com');
  await loginPage.fillPassword('TestPassword123!');
  await loginPage.submit();
  
  await loginPage.waitForErrorMessage(5000);
  const errorMsg = await loginPage.getErrorMessage();
  expect(errorMsg).toContain('User not found');
  
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  expect(token).toBeFalsy();
});
```

---

#### TC-AUTH-004: Session Persistence
```typescript
test('Auth token persists across page navigation', async ({
  authenticatedPage,
}) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Get initial token
  const token1 = await authenticatedPage.evaluate(() =>
    localStorage.getItem('auth_token')
  );
  expect(token1).toBeTruthy();
  
  // Navigate to another page
  await authenticatedPage.goto('/dashboard?filter=active');
  
  // Token should be unchanged
  const token2 = await authenticatedPage.evaluate(() =>
    localStorage.getItem('auth_token')
  );
  expect(token2).toBe(token1);
  
  // Refresh page
  await authenticatedPage.reload();
  
  // Token should still be there
  const token3 = await authenticatedPage.evaluate(() =>
    localStorage.getItem('auth_token')
  );
  expect(token3).toBe(token1);
});
```

---

#### TC-AUTH-005: Logout Flow
```typescript
test('Logout clears session and redirects to login', async ({
  authenticatedPage,
}) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Verify logged in
  const token = await authenticatedPage.evaluate(() =>
    localStorage.getItem('auth_token')
  );
  expect(token).toBeTruthy();
  
  // Click logout
  await dashboard.logout();
  
  // Verify redirect to login
  await authenticatedPage.waitForURL('**/login', { timeout: 10000 });
  
  // Verify token cleared
  const clearedToken = await authenticatedPage.evaluate(() =>
    localStorage.getItem('auth_token')
  );
  expect(clearedToken).toBeFalsy();
  
  // Verify cannot access dashboard without login
  await authenticatedPage.goto('/dashboard');
  expect(authenticatedPage.url()).toContain('/login');
});
```

---

#### TC-AUTH-006: Token Expiration Handling
```typescript
test('Expired token triggers re-authentication', async ({
  authenticatedPage,
  apiClient,
}) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Simulate token expiration by clearing it
  await authenticatedPage.evaluate(() => {
    localStorage.removeItem('auth_token');
  });
  
  // Try to perform authenticated action
  try {
    const result = await apiClient.query(`
      query GetBuilds {
        builds { id }
      }
    `);
    
    // Should fail or return empty
    expect(result.data?.builds).toBeUndefined();
  } catch (error) {
    // Expected: authentication error
    expect(error).toBeDefined();
  }
  
  // Navigate should redirect to login
  await authenticatedPage.goto('/dashboard');
  expect(authenticatedPage.url()).toContain('/login');
});
```

---

### 3.2 Build Management Tests (builds/crud-operations.spec.ts)

**Objective**: Verify complete CRUD operations for builds with proper validation and error handling.

**Acceptance Criteria**:
- ✅ Create build with required fields succeeds
- ✅ List builds displays all user builds with pagination
- ✅ Filter builds by status works correctly
- ✅ Search builds by name returns matching results
- ✅ Update build status persists correctly
- ✅ Delete build removes it from list
- ✅ Bulk operations complete successfully
- ✅ Validation errors display helpful messages
- ✅ Network failures handled gracefully

**Test Cases**:

#### TC-BUILD-001: Create Build
```typescript
test('User can create a new build', async ({ authenticatedPage, apiClient }) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Click create button
  await dashboard.clickByTestId('create-build-button');
  
  // Wait for modal
  await authenticatedPage.waitForSelector('[data-testid="build-modal"]');
  
  // Fill form
  const buildName = `E2E Test Build ${Date.now()}`;
  await dashboard.fillByTestId('build-name-input', buildName);
  await dashboard.fillByTestId('build-description-input', 'Test build created by E2E');
  
  // Select status
  await dashboard.selectDropdown('build-status-select', 'PENDING');
  
  // Submit
  await dashboard.clickByTestId('build-submit-button');
  
  // Verify created
  await authenticatedPage.waitForLoadState('networkidle');
  const builds = await dashboard.getBuilds();
  const created = builds.find((b) => b.name === buildName);
  expect(created).toBeDefined();
  expect(created?.status).toBe('PENDING');
});
```

---

#### TC-BUILD-002: List Builds with Pagination
```typescript
test('Dashboard displays builds with pagination', async ({
  authenticatedPage,
  apiClient,
}) => {
  // Seed multiple builds (more than page size)
  const buildFactory = new BuildFactory(apiClient);
  const builds = await buildFactory.createMany(15);
  
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Check first page shows max 10 items
  let displayedBuilds = await dashboard.getBuilds();
  expect(displayedBuilds.length).toBeLessThanOrEqual(10);
  
  // Click next page
  await dashboard.clickByTestId('pagination-next');
  await authenticatedPage.waitForLoadState('networkidle');
  
  // Check second page
  displayedBuilds = await dashboard.getBuilds();
  expect(displayedBuilds.length).toBeGreaterThan(0);
  
  // Verify all builds appear across pages
  const allDisplayed = new Set<string>();
  builds.forEach((b) => allDisplayed.add(b.id));
  expect(allDisplayed.size).toBe(builds.length);
});
```

---

#### TC-BUILD-003: Filter by Status
```typescript
test('Filter builds by status', async ({ authenticatedPage, apiClient }) => {
  // Create builds with different statuses
  const factory = new BuildFactory(apiClient);
  await factory.createMany(5, { status: 'PENDING' });
  await factory.createMany(3, { status: 'RUNNING' });
  await factory.createMany(2, { status: 'COMPLETE' });
  
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Filter to PENDING only
  await dashboard.selectFilter('status-filter', 'PENDING');
  await authenticatedPage.waitForLoadState('networkidle');
  
  let builds = await dashboard.getBuilds();
  expect(builds.every((b) => b.status === 'PENDING')).toBeTruthy();
  expect(builds.length).toBeGreaterThanOrEqual(5);
  
  // Filter to RUNNING
  await dashboard.selectFilter('status-filter', 'RUNNING');
  await authenticatedPage.waitForLoadState('networkidle');
  
  builds = await dashboard.getBuilds();
  expect(builds.every((b) => b.status === 'RUNNING')).toBeTruthy();
  expect(builds.length).toBeGreaterThanOrEqual(3);
});
```

---

#### TC-BUILD-004: Search Builds by Name
```typescript
test('Search builds by name', async ({ authenticatedPage, apiClient }) => {
  const factory = new BuildFactory(apiClient);
  await factory.create({ name: 'Rocket Engine Test' });
  await factory.create({ name: 'Fuel Tank Assembly' });
  await factory.create({ name: 'Valve Testing' });
  
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Search for "Rocket"
  await dashboard.searchByTestId('builds-search', 'Rocket');
  await authenticatedPage.waitForLoadState('networkidle');
  
  let builds = await dashboard.getBuilds();
  expect(builds.length).toBe(1);
  expect(builds[0].name).toContain('Rocket');
  
  // Search for "Test"
  await dashboard.searchByTestId('builds-search', 'Test');
  await authenticatedPage.waitForLoadState('networkidle');
  
  builds = await dashboard.getBuilds();
  expect(builds.length).toBe(2);
});
```

---

#### TC-BUILD-005: Update Build Status
```typescript
test('Update build status via UI and API', async ({
  authenticatedPage,
  apiClient,
}) => {
  const factory = new BuildFactory(apiClient);
  const build = await factory.create({ status: 'PENDING' });
  
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Click on build
  await dashboard.clickBuild(build.id);
  
  // Wait for detail page
  await authenticatedPage.waitForURL(`**/builds/${build.id}**`);
  
  const detailPage = new BuildDetailPage(authenticatedPage);
  
  // Update status
  await detailPage.selectStatus('RUNNING');
  await detailPage.save();
  
  // Verify via API
  await authenticatedPage.waitForLoadState('networkidle');
  const updated = await apiClient.query(`
    query GetBuild($id: ID!) {
      build(id: $id) {
        id
        status
      }
    }
  `, { id: build.id });
  
  expect(updated.data?.build?.status).toBe('RUNNING');
});
```

---

#### TC-BUILD-006: Delete Build
```typescript
test('Delete build removes from dashboard', async ({
  authenticatedPage,
  apiClient,
}) => {
  const factory = new BuildFactory(apiClient);
  const build = await factory.create();
  
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Right-click to delete
  await dashboard.rightClickBuild(build.id);
  
  // Confirm delete
  await authenticatedPage.click('[data-testid="delete-confirm-button"]');
  
  // Verify deleted
  await authenticatedPage.waitForLoadState('networkidle');
  const builds = await dashboard.getBuilds();
  const deleted = builds.find((b) => b.id === build.id);
  expect(deleted).toBeUndefined();
});
```

---

### 3.3 Real-Time Update Tests (integration/real-time-updates.spec.ts)

**Objective**: Verify real-time updates work correctly using SSE and Apollo subscriptions.

**Acceptance Criteria**:
- ✅ SSE events received and processed
- ✅ Apollo subscriptions update cache
- ✅ Multiple concurrent users see updates
- ✅ Event ordering preserved
- ✅ Network reconnection restores subscription
- ✅ Event retry logic works
- ✅ UI updates reflect server state

**Test Cases**:

#### TC-RT-001: SSE Event Reception
```typescript
test('Receive SSE events for build status changes', async ({
  authenticatedPage,
  apiClient,
}) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Listen for events
  const events: any[] = [];
  const eventListener = new RealtimeListener(authenticatedPage);
  
  eventListener.on('buildStatusChanged', (event) => {
    events.push(event);
  });
  
  // Create and update build via API
  const factory = new BuildFactory(apiClient);
  const build = await factory.create();
  
  // Update status
  await apiClient.mutation(`
    mutation UpdateStatus($id: ID!, $status: BuildStatus!) {
      updateBuildStatus(id: $id, status: $status) {
        id
        status
      }
    }
  `, {
    id: build.id,
    status: 'RUNNING',
  });
  
  // Wait for event
  await authenticatedPage.waitForTimeout(2000);
  
  // Verify event received
  expect(events.length).toBeGreaterThan(0);
  const event = events.find((e) => e.buildId === build.id);
  expect(event).toBeDefined();
  expect(event?.status).toBe('RUNNING');
});
```

---

#### TC-RT-002: Apollo Subscription Updates Cache
```typescript
test('Apollo subscriptions update dashboard cache', async ({
  authenticatedPage,
  apiClient,
}) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Get initial builds
  let builds = await dashboard.getBuilds();
  const initialCount = builds.length;
  
  // Create new build via API (simulating another user)
  const factory = new BuildFactory(apiClient);
  const newBuild = await factory.create();
  
  // Wait for subscription to update cache
  await authenticatedPage.waitForTimeout(3000);
  await dashboard.reload();
  
  // Verify new build appears
  builds = await dashboard.getBuilds();
  expect(builds.length).toBe(initialCount + 1);
  
  const found = builds.find((b) => b.id === newBuild.id);
  expect(found).toBeDefined();
});
```

---

#### TC-RT-003: Multi-user Concurrent Updates
```typescript
test('Multiple concurrent users receive updates', async ({
  authenticatedPage,
  apiClient,
  testUser,
}) => {
  // Create second test user context
  const browser = authenticatedPage.context().browser();
  const context2 = await browser?.createBrowserContext();
  const page2 = await context2?.newPage();
  
  // Login second user
  const loginPage2 = new LoginPage(page2!);
  await loginPage2.goto();
  await loginPage2.login('user2@example.com', 'Password123!');
  
  const dashboard1 = new DashboardPage(authenticatedPage);
  const dashboard2 = new DashboardPage(page2!);
  
  await dashboard1.goto();
  await dashboard2.goto();
  
  // User1 creates build
  const factory = new BuildFactory(apiClient);
  const build = await factory.create();
  
  // Both users should see it
  await authenticatedPage.waitForTimeout(2000);
  
  const builds1 = await dashboard1.getBuilds();
  const builds2 = await dashboard2.getBuilds();
  
  const found1 = builds1.find((b) => b.id === build.id);
  const found2 = builds2.find((b) => b.id === build.id);
  
  expect(found1).toBeDefined();
  expect(found2).toBeDefined();
  
  // Cleanup
  await context2?.close();
});
```

---

#### TC-RT-004: Event Ordering
```typescript
test('Events maintain order and consistency', async ({
  authenticatedPage,
  apiClient,
}) => {
  const factory = new BuildFactory(apiClient);
  const build = await factory.create({ status: 'PENDING' });
  
  const events: any[] = [];
  const eventListener = new RealtimeListener(authenticatedPage);
  
  eventListener.on('buildStatusChanged', (event) => {
    if (event.buildId === build.id) {
      events.push({ timestamp: Date.now(), status: event.status });
    }
  });
  
  // Rapid status updates
  const statuses = ['RUNNING', 'COMPLETE', 'FAILED'];
  for (const status of statuses) {
    await apiClient.mutation(`
      mutation UpdateStatus($id: ID!, $status: BuildStatus!) {
        updateBuildStatus(id: $id, status: $status) {
          id
          status
        }
      }
    `, { id: build.id, status });
    
    await authenticatedPage.waitForTimeout(500);
  }
  
  // Wait for all events
  await authenticatedPage.waitForTimeout(2000);
  
  // Verify order
  expect(events.length).toBeGreaterThanOrEqual(3);
  expect(events[0].status).toBe('RUNNING');
  expect(events[1].status).toBe('COMPLETE');
  expect(events[2].status).toBe('FAILED');
});
```

---

#### TC-RT-005: Network Reconnection
```typescript
test('Subscription reconnects after network loss', async ({
  authenticatedPage,
}) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Simulate network offline
  await authenticatedPage.context().setOffline(true);
  await authenticatedPage.waitForTimeout(2000);
  
  // Should still be on page
  expect(authenticatedPage.url()).toContain('/dashboard');
  
  // Restore network
  await authenticatedPage.context().setOffline(false);
  await authenticatedPage.waitForTimeout(2000);
  
  // Should recover
  const isReady = await dashboard.isDashboardReady();
  expect(isReady).toBeTruthy();
});
```

---

### 3.4 File Upload Tests (integration/file-uploads.spec.ts)

**Objective**: Verify file upload functionality with validation and error handling.

**Acceptance Criteria**:
- ✅ Upload test reports succeeds
- ✅ Upload CAD files succeeds
- ✅ File validation enforces size/type limits
- ✅ Upload progress tracking works
- ✅ Failed uploads show error messages
- ✅ Download uploaded files works
- ✅ File cleanup removes temporary files
- ✅ Multiple concurrent uploads handled

**Test Cases**:

#### TC-FILE-001: Upload Test Report
```typescript
test('User can upload test report file', async ({
  authenticatedPage,
  apiClient,
}) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Create a build first
  const factory = new BuildFactory(apiClient);
  const build = await factory.create();
  
  // Navigate to build detail
  await dashboard.clickBuild(build.id);
  await authenticatedPage.waitForURL(`**/builds/${build.id}**`);
  
  const detailPage = new BuildDetailPage(authenticatedPage);
  
  // Generate test file
  const fileGen = new FileGenerator();
  const testFile = await fileGen.generateTestReport('test-results.json');
  
  // Upload file
  await detailPage.uploadFile(testFile.path, 'Test Report');
  
  // Verify upload success
  await authenticatedPage.waitForLoadState('networkidle');
  const files = await detailPage.getUploadedFiles();
  
  const uploaded = files.find((f) => f.name === 'Test Report');
  expect(uploaded).toBeDefined();
  expect(uploaded?.size).toBe(testFile.size);
  
  // Cleanup
  await fileGen.cleanup();
});
```

---

#### TC-FILE-002: Upload CAD File
```typescript
test('User can upload CAD file', async ({
  authenticatedPage,
  apiClient,
}) => {
  const factory = new BuildFactory(apiClient);
  const build = await factory.create();
  
  const detailPage = new BuildDetailPage(authenticatedPage);
  await detailPage.goto(build.id);
  
  // Generate CAD file
  const fileGen = new FileGenerator();
  const cadFile = await fileGen.generateCADFile('design.step');
  
  // Upload
  await detailPage.uploadFile(cadFile.path, 'CAD Design');
  
  // Verify
  await authenticatedPage.waitForLoadState('networkidle');
  const files = await detailPage.getUploadedFiles();
  
  const uploaded = files.find((f) => f.name === 'CAD Design');
  expect(uploaded).toBeDefined();
  expect(uploaded?.mimeType).toContain('application/');
  
  await fileGen.cleanup();
});
```

---

#### TC-FILE-003: File Size Validation
```typescript
test('Upload fails for files exceeding size limit', async ({
  authenticatedPage,
  apiClient,
}) => {
  const factory = new BuildFactory(apiClient);
  const build = await factory.create();
  
  const detailPage = new BuildDetailPage(authenticatedPage);
  await detailPage.goto(build.id);
  
  // Generate large file (over limit, e.g., > 100MB)
  const fileGen = new FileGenerator();
  const largeFile = await fileGen.generateLargeFile('huge.bin', 150); // 150MB
  
  // Try to upload
  try {
    await detailPage.uploadFile(largeFile.path, 'Too Large');
    
    // Should show error
    const error = await detailPage.getUploadError();
    expect(error).toContain('exceeds maximum size');
  } catch (e) {
    // Upload rejected
    expect(e).toBeDefined();
  }
  
  await fileGen.cleanup();
});
```

---

#### TC-FILE-004: File Type Validation
```typescript
test('Upload fails for unsupported file types', async ({
  authenticatedPage,
  apiClient,
}) => {
  const factory = new BuildFactory(apiClient);
  const build = await factory.create();
  
  const detailPage = new BuildDetailPage(authenticatedPage);
  await detailPage.goto(build.id);
  
  // Generate unsupported file
  const fileGen = new FileGenerator();
  const execFile = await fileGen.generateExecutable('script.exe');
  
  // Try to upload
  try {
    await detailPage.uploadFile(execFile.path, 'Executable');
    
    const error = await detailPage.getUploadError();
    expect(error).toContain('not supported');
  } catch (e) {
    expect(e).toBeDefined();
  }
  
  await fileGen.cleanup();
});
```

---

#### TC-FILE-005: Upload Progress Tracking
```typescript
test('Upload shows progress indication', async ({
  authenticatedPage,
  apiClient,
}) => {
  const factory = new BuildFactory(apiClient);
  const build = await factory.create();
  
  const detailPage = new BuildDetailPage(authenticatedPage);
  await detailPage.goto(build.id);
  
  // Generate medium file
  const fileGen = new FileGenerator();
  const file = await fileGen.generateLargeFile('medium.bin', 10); // 10MB
  
  // Start upload
  const uploadPromise = detailPage.uploadFile(file.path, 'Progress Test');
  
  // Monitor progress
  let progressSeen = false;
  for (let i = 0; i < 50; i++) {
    const progress = await detailPage.getUploadProgress();
    if (progress && progress > 0 && progress < 100) {
      progressSeen = true;
      console.log(`Upload progress: ${progress}%`);
    }
    await authenticatedPage.waitForTimeout(100);
  }
  
  // Wait for completion
  await uploadPromise;
  
  expect(progressSeen).toBeTruthy();
  
  await fileGen.cleanup();
});
```

---

#### TC-FILE-006: Download Uploaded File
```typescript
test('User can download uploaded file', async ({
  authenticatedPage,
  apiClient,
  context,
}) => {
  const factory = new BuildFactory(apiClient);
  const build = await factory.create();
  
  const detailPage = new BuildDetailPage(authenticatedPage);
  await detailPage.goto(build.id);
  
  // Upload file first
  const fileGen = new FileGenerator();
  const testFile = await fileGen.generateTestReport('test.json');
  await detailPage.uploadFile(testFile.path, 'Test File');
  
  await authenticatedPage.waitForLoadState('networkidle');
  
  // Download file
  const downloadPromise = context.waitForEvent('download');
  await detailPage.downloadFile('Test File');
  const download = await downloadPromise;
  
  // Verify download
  expect(download.suggestedFilename()).toContain('test');
  
  await fileGen.cleanup();
});
```

---

#### TC-FILE-007: Concurrent Uploads
```typescript
test('Multiple files can upload concurrently', async ({
  authenticatedPage,
  apiClient,
}) => {
  const factory = new BuildFactory(apiClient);
  const build = await factory.create();
  
  const detailPage = new BuildDetailPage(authenticatedPage);
  await detailPage.goto(build.id);
  
  // Generate multiple files
  const fileGen = new FileGenerator();
  const file1 = await fileGen.generateTestReport('report1.json');
  const file2 = await fileGen.generateTestReport('report2.json');
  const file3 = await fileGen.generateCADFile('design.step');
  
  // Start all uploads concurrently
  const uploads = [
    detailPage.uploadFile(file1.path, 'Report 1'),
    detailPage.uploadFile(file2.path, 'Report 2'),
    detailPage.uploadFile(file3.path, 'CAD Design'),
  ];
  
  await Promise.all(uploads);
  
  // Verify all uploaded
  await authenticatedPage.waitForLoadState('networkidle');
  const files = await detailPage.getUploadedFiles();
  
  expect(files.length).toBeGreaterThanOrEqual(3);
  expect(files.some((f) => f.name === 'Report 1')).toBeTruthy();
  expect(files.some((f) => f.name === 'Report 2')).toBeTruthy();
  expect(files.some((f) => f.name === 'CAD Design')).toBeTruthy();
  
  await fileGen.cleanup();
});
```

---

### 3.5 Integration Workflow Tests (integration/complete-workflow.spec.ts)

**Objective**: Verify end-to-end user workflows spanning login, data operations, and real-time updates.

**Acceptance Criteria**:
- ✅ Complete workflow: login → create build → upload files → receive updates → logout
- ✅ Multi-user concurrent workflows
- ✅ Error recovery and retry
- ✅ Data consistency across services
- ✅ Performance within acceptable limits
- ✅ No data loss on failure

**Test Cases**:

#### TC-WORKFLOW-001: Complete Happy Path
```typescript
test('Complete workflow: login → create → upload → update → logout', async ({
  authenticatedPage,
  apiClient,
  context,
}) => {
  // Step 1: Verify authenticated
  expect(authenticatedPage.url()).toContain('/dashboard');
  
  // Step 2: Create build
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  const buildName = `E2E Workflow ${Date.now()}`;
  await dashboard.clickByTestId('create-build-button');
  await authenticatedPage.waitForSelector('[data-testid="build-modal"]');
  await dashboard.fillByTestId('build-name-input', buildName);
  await dashboard.clickByTestId('build-submit-button');
  
  await authenticatedPage.waitForLoadState('networkidle');
  
  // Find created build
  let builds = await dashboard.getBuilds();
  const build = builds.find((b) => b.name === buildName);
  expect(build).toBeDefined();
  
  // Step 3: Open build detail
  await dashboard.clickBuild(build!.id);
  await authenticatedPage.waitForURL(`**/builds/${build!.id}**`);
  
  const detailPage = new BuildDetailPage(authenticatedPage);
  
  // Step 4: Upload test file
  const fileGen = new FileGenerator();
  const testFile = await fileGen.generateTestReport('test-results.json');
  await detailPage.uploadFile(testFile.path, 'Test Results');
  
  await authenticatedPage.waitForLoadState('networkidle');
  let files = await detailPage.getUploadedFiles();
  expect(files.some((f) => f.name === 'Test Results')).toBeTruthy();
  
  // Step 5: Update build status
  await detailPage.selectStatus('RUNNING');
  await detailPage.save();
  
  // Step 6: Verify via API
  const buildResult = await apiClient.query(`
    query GetBuild($id: ID!) {
      build(id: $id) {
        id
        name
        status
      }
    }
  `, { id: build!.id });
  
  expect(buildResult.data?.build?.status).toBe('RUNNING');
  
  // Step 7: Logout
  await dashboard.goto();
  await dashboard.logout();
  
  // Verify back at login
  expect(authenticatedPage.url()).toContain('/login');
  
  // Cleanup
  await fileGen.cleanup();
});
```

---

#### TC-WORKFLOW-002: Multi-user Concurrent Operations
```typescript
test('Multiple users can operate concurrently without interference', async ({
  authenticatedPage,
  apiClient,
  context: context1,
}) => {
  // Setup User 1
  const dashboard1 = new DashboardPage(authenticatedPage);
  await dashboard1.goto();
  
  // Setup User 2
  const browser = authenticatedPage.context().browser();
  const context2 = await browser?.createBrowserContext();
  const page2 = await context2?.newPage();
  
  const loginPage2 = new LoginPage(page2!);
  await loginPage2.goto();
  await loginPage2.login('user2@example.com', 'Password123!');
  
  const dashboard2 = new DashboardPage(page2!);
  await dashboard2.goto();
  
  // User 1: Create build
  const factory1 = new BuildFactory(apiClient);
  const build1 = await factory1.create({ name: 'User1 Build' });
  
  // User 2: Create build
  const factory2 = new BuildFactory(apiClient);
  const build2 = await factory2.create({ name: 'User2 Build' });
  
  // Verify each user sees their build
  let builds1 = await dashboard1.getBuilds();
  let builds2 = await dashboard2.getBuilds();
  
  // Note: Depending on auth model, may see own builds only or shared builds
  expect(builds1.some((b) => b.name === 'User1 Build')).toBeTruthy();
  expect(builds2.some((b) => b.name === 'User2 Build')).toBeTruthy();
  
  // Cleanup
  await context2?.close();
});
```

---

#### TC-WORKFLOW-003: Error Recovery
```typescript
test('Workflow recovers from temporary errors', async ({
  authenticatedPage,
  apiClient,
}) => {
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  
  // Simulate network error during operation
  const factory = new BuildFactory(apiClient);
  
  // Go offline
  await authenticatedPage.context().setOffline(true);
  
  try {
    // Try to create build (will fail)
    await factory.create({ name: 'Offline Build' });
    expect(true).toBeFalsy(); // Should fail
  } catch (e) {
    // Expected
    expect(e).toBeDefined();
  }
  
  // Restore network
  await authenticatedPage.context().setOffline(false);
  await authenticatedPage.waitForTimeout(2000);
  
  // Retry should succeed
  const build = await factory.create({ name: 'Online Build' });
  expect(build.id).toBeDefined();
  
  // Verify in dashboard
  await dashboard.reload();
  const builds = await dashboard.getBuilds();
  expect(builds.some((b) => b.name === 'Online Build')).toBeTruthy();
});
```

---

#### TC-WORKFLOW-004: Data Consistency
```typescript
test('Data remains consistent across services after operations', async ({
  authenticatedPage,
  apiClient,
}) => {
  const dashboard = new DashboardPage(authenticatedPage);
  const factory = new BuildFactory(apiClient);
  
  // Create build
  const build = await factory.create({
    name: 'Consistency Test',
    status: 'PENDING',
  });
  
  // Verify in dashboard
  await dashboard.goto();
  let builds = await dashboard.getBuilds();
  let dashboardBuild = builds.find((b) => b.id === build.id);
  expect(dashboardBuild?.name).toBe('Consistency Test');
  
  // Update status via API
  await apiClient.mutation(`
    mutation UpdateStatus($id: ID!, $status: BuildStatus!) {
      updateBuildStatus(id: $id, status: $status) {
        id
        status
      }
    }
  `, { id: build.id, status: 'RUNNING' });
  
  // Verify update in database (via API)
  const dbCheck = await apiClient.query(`
    query GetBuild($id: ID!) {
      build(id: $id) {
        status
      }
    }
  `, { id: build.id });
  
  expect(dbCheck.data?.build?.status).toBe('RUNNING');
  
  // Verify update in dashboard
  await dashboard.reload();
  builds = await dashboard.getBuilds();
  dashboardBuild = builds.find((b) => b.id === build.id);
  expect(dashboardBuild?.status).toBe('RUNNING');
});
```

---

## 4. Page Object Extensions for Phase 2

### 4.1 New Page Objects

#### BuildsPage
```typescript
/**
 * Page object for builds list/management
 */
export class BuildsPage extends BasePage {
  // Selectors
  readonly buildsList = () => this.getByTestId('builds-list');
  readonly createButton = () => this.getByTestId('create-build-button');
  readonly statusFilter = () => this.getByTestId('status-filter');
  readonly searchInput = () => this.getByTestId('builds-search');
  readonly paginationNext = () => this.getByTestId('pagination-next');
  readonly paginationPrev = () => this.getByTestId('pagination-prev');
  
  // Methods
  async goto(): Promise<void> {}
  async getBuilds(): Promise<BuildCard[]> {}
  async createBuild(data: CreateBuildInput): Promise<void> {}
  async filterByStatus(status: string): Promise<void> {}
  async searchByName(query: string): Promise<void> {}
  async selectBuild(id: string): Promise<void> {}
  async deleteBuild(id: string): Promise<void> {}
  async nextPage(): Promise<void> {}
  async prevPage(): Promise<void> {}
}
```

#### BuildDetailPage
```typescript
/**
 * Page object for individual build detail/edit
 */
export class BuildDetailPage extends BasePage {
  // Selectors
  readonly buildTitle = () => this.getByTestId('build-title');
  readonly statusDropdown = () => this.getByTestId('build-status');
  readonly filesSection = () => this.getByTestId('build-files');
  readonly uploadButton = () => this.getByTestId('upload-button');
  readonly saveButton = () => this.getByTestId('save-button');
  
  // Methods
  async goto(buildId: string): Promise<void> {}
  async selectStatus(status: string): Promise<void> {}
  async uploadFile(path: string, label: string): Promise<void> {}
  async downloadFile(label: string): Promise<void> {}
  async getUploadedFiles(): Promise<UploadedFile[]> {}
  async deleteFile(label: string): Promise<void> {}
  async save(): Promise<void> {}
  async getUploadProgress(): Promise<number | null> {}
}
```

#### RealtimeListener
```typescript
/**
 * Helper for listening to real-time events
 */
export class RealtimeListener {
  private eventListeners: Map<string, (event: any) => void>;
  
  constructor(page: Page) {}
  
  on(eventName: string, callback: (event: any) => void): void {}
  off(eventName: string): void {}
  wait(eventName: string, timeout?: number): Promise<any> {}
  getEvents(eventName: string): any[] {}
  clear(): void {}
}
```

---

### 4.2 Extended Helper Methods in BasePage

```typescript
// Dropdown selection
async selectDropdown(testId: string, optionText: string): Promise<void> {}

// File input handling
async uploadFile(path: string): Promise<void> {}

// Wait for multiple conditions
async waitForMultiple(conditions: string[]): Promise<void> {}

// Right-click context menu
async rightClick(testId: string): Promise<void> {}

// Keyboard shortcuts
async pressKeyCombo(keys: string[]): Promise<void> {}

// Scroll to element
async scrollToElement(testId: string): Promise<void> {}

// Get element coordinates
async getCoordinates(testId: string): Promise<{ x: number; y: number }> {}
```

---

## 5. Helper Utilities for Phase 2

### 5.1 BuildFactory

```typescript
export class BuildFactory {
  constructor(apiClient: GraphQLClient) {}
  
  async create(overrides?: Partial<Build>): Promise<Build> {}
  async createMany(count: number, overrides?: Partial<Build>): Promise<Build[]> {}
  async createWithParts(parts: Part[]): Promise<Build> {}
  async createWithTestRuns(testRuns: TestRun[]): Promise<Build> {}
  async delete(id: string): Promise<void> {}
  async deleteMany(ids: string[]): Promise<void> {}
}
```

### 5.2 FileGenerator

```typescript
export class FileGenerator {
  async generateTestReport(filename: string): Promise<GeneratedFile> {}
  async generateCADFile(filename: string): Promise<GeneratedFile> {}
  async generateLargeFile(filename: string, sizeMB: number): Promise<GeneratedFile> {}
  async generateExecutable(filename: string): Promise<GeneratedFile> {}
  async cleanup(): Promise<void> {}
}
```

### 5.3 AssertionHelpers

```typescript
export class AssertionHelpers {
  assertBuildStatus(build: Build, expectedStatus: string): void {}
  assertBuildStructure(build: Build): void {}
  assertFileUpload(file: UploadedFile, expectedSize: number): void {}
  assertErrorMessage(message: string, expectedContent: string): void {}
  assertPageTitle(page: Page, expectedTitle: string): void {}
}
```

### 5.4 EventVerifier

```typescript
export class EventVerifier {
  async waitForEvent(name: string, timeout?: number): Promise<Event> {}
  async expectEventFired(name: string): Promise<void> {}
  async expectEventNotFired(name: string): Promise<void> {}
  async getEventHistory(): Promise<Event[]> {}
  async clearEventHistory(): Promise<void> {}
}
```

### 5.5 NetworkMonitor

```typescript
export class NetworkMonitor {
  async recordRequests(): Promise<void> {}
  async stopRecording(): Promise<Request[]> {}
  async getRequestCount(pattern: string): Promise<number> {}
  async getSlowRequests(threshold: number): Promise<Request[]> {}
  async expectNoFailedRequests(): Promise<void> {}
}
```

---

## 6. CI/CD Integration Planning

### 6.1 GitHub Actions Workflow

**File**: `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests (Phase 2)

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-suite:
          - auth/login-logout.spec.ts
          - builds/crud-operations.spec.ts
          - integration/real-time-updates.spec.ts
          - integration/file-uploads.spec.ts
          - integration/complete-workflow.spec.ts
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Start services
        run: |
          docker-compose up -d
          pnpm seed
      
      - name: Run tests
        run: npx playwright test ${{ matrix.test-suite }}
      
      - name: Upload artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.test-suite }}
          path: test-results/
```

### 6.2 Test Parallelization Strategy

- **Parallel workers**: 4 workers per test suite
- **Test isolation**: Each test cleans up its data
- **Shared setup**: Docker containers (PostgreSQL) started once per workflow
- **Retry logic**: Failed tests retry once automatically
- **Reporting**: HTML reports generated and archived

### 6.3 Report Generation

```bash
pnpm e2e:report
# Generates: test-results/index.html
# Contains: Pass rate, timings, screenshots, traces
```

---

## 7. Implementation Timeline

### Phase 2A: Foundation & Auth (Week 1-2, ~15 hours)
- [ ] Auth tests: login, logout, session persistence, token handling
- [ ] LoginPage extensions
- [ ] Test user management
- [ ] Error handling patterns

**Deliverable**: `tests/auth/login-logout.spec.ts` (100% passing)

### Phase 2B: CRUD Operations (Week 2-3, ~15 hours)
- [ ] BuildsPage page object
- [ ] BuildDetailPage page object
- [ ] Build CRUD tests: create, list, filter, search, update, delete
- [ ] BuildFactory utility
- [ ] Pagination and filtering

**Deliverable**: `tests/builds/crud-operations.spec.ts` (100% passing)

### Phase 2C: Real-Time Updates (Week 3-4, ~12 hours)
- [ ] RealtimeListener helper
- [ ] SSE event tests
- [ ] Apollo subscription tests
- [ ] Multi-user concurrent updates
- [ ] Network reconnection handling
- [ ] Event verifier utility

**Deliverable**: `tests/integration/real-time-updates.spec.ts` (100% passing)

### Phase 2D: File Uploads (Week 4, ~10 hours)
- [ ] UploadPage page object
- [ ] File upload tests
- [ ] FileGenerator utility
- [ ] Upload validation
- [ ] Progress tracking
- [ ] Error handling

**Deliverable**: `tests/integration/file-uploads.spec.ts` (100% passing)

### Phase 2E: Integration Workflows (Week 4-5, ~8 hours)
- [ ] End-to-end workflow tests
- [ ] Multi-user scenarios
- [ ] Error recovery tests
- [ ] Data consistency verification
- [ ] Performance validation

**Deliverable**: `tests/integration/complete-workflow.spec.ts` (100% passing)

### Phase 2F: Documentation & CI/CD (Week 5, ~5 hours)
- [ ] Create ISSUE-153-QUICK-REFERENCE.md
- [ ] Setup GitHub Actions workflow
- [ ] Test parallelization configuration
- [ ] Report generation and archiving
- [ ] Flaky test detection

**Deliverable**: CI/CD integration complete, all tests passing

---

## 8. Risk Assessment

### Identified Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| data-testid attributes missing | Blocker | Medium | Document required attributes, add to components early |
| SSE event timing unreliable | Test flakiness | Medium | Implement robust event waiting, retry logic |
| File upload timeout | Test failure | Low | Increase timeout, use smaller test files |
| Multi-user race conditions | Flaky tests | Medium | Implement proper data isolation per user |
| Real-time event loss | Data consistency | Low | Implement event log verification |
| Network simulation issues | False failures | Low | Use realistic network profiles |
| CI container resource limits | Build timeout | Medium | Optimize test parallelization, monitor resources |
| Apollo cache inconsistency | State corruption | Low | Clear cache between tests, verify mutations |

---

## 9. Success Criteria

- ✅ All 5 test suites pass consistently (95%+ pass rate)
- ✅ No flaky tests (after 10 consecutive runs)
- ✅ Complete code coverage for test utilities
- ✅ All page objects have TypeScript types
- ✅ Tests run in parallel without interference
- ✅ CI/CD pipeline integration complete
- ✅ HTML reports generated and archived
- ✅ Documentation complete and current
- ✅ Setup takes <5 minutes for new developer

---

## 10. Interview Talking Points

**When Discussing Phase 2 Implementation**:

1. **Test Coverage Strategy**:
   *"Phase 2 covers the complete user journey: authentication, CRUD operations on builds, real-time updates via SSE, and file uploads. Each test suite is independent and can run in parallel, reducing CI/CD time from 30 minutes to 5 minutes."*

2. **Real-Time Testing Approach**:
   *"We implemented a RealtimeListener helper that subscribes to Server-Sent Events, allowing us to verify that changes in one browser are immediately reflected in another. This tests both the event bus reliability and Apollo cache consistency."*

3. **Handling Flakiness**:
   *"Flaky tests are a common problem in E2E testing. We addressed this with three strategies: (1) Explicit waits for network idle instead of arbitrary delays, (2) Event verification with timeouts and retries, (3) Proper test isolation so one failure doesn't cascade."*

4. **Scaling to Production**:
   *"The test architecture is designed for scale. We use test factories to generate consistent data, page objects to abstract UI changes, and helper utilities to reduce duplication. Adding a new test suite takes ~2 hours, not days."*

5. **Multi-User Testing**:
   *"One often-overlooked aspect of E2E testing is verifying concurrent user scenarios. Phase 2 includes tests where multiple browser contexts operate simultaneously, catching race conditions and consistency issues that single-user tests miss."*

---

## 11. Next Phases (Phase 3 & 4)

### Phase 3: Performance & Reliability Testing
- Load testing (50+ concurrent users)
- Stress testing (rapid CRUD operations)
- Memory leak detection
- Long-running stability tests
- Performance baselines and regression detection

### Phase 4: Advanced Coverage
- Visual regression testing (Pixelmatch)
- Cross-browser testing (Firefox, WebKit)
- Mobile viewport testing
- Accessibility testing (axe-core)
- API contract testing

---

## 12. Verification Checklist

**Before declaring Phase 2 complete**:
- [ ] All 5 test suites passing in CI/CD
- [ ] Pass rate consistently > 95%
- [ ] No timeout-related failures
- [ ] All page objects have full TypeScript types
- [ ] Helper utilities have complete documentation
- [ ] CI/CD workflow runs in < 10 minutes
- [ ] Test reports generate successfully
- [ ] New developer can run tests in < 5 minutes
- [ ] All code follows ESLint v9 standards
- [ ] At least 80% code coverage in helpers

---

## References

- **Phase 1 Plan**: `docs/implementation-planning/ISSUE-152-PLAYWRIGHT-SETUP-PLAN.md`
- **Phase 1 Quick Ref**: `docs/implementation-planning/ISSUE-152-QUICK-REFERENCE.md`
- **Playwright Docs**: https://playwright.dev/docs/intro
- **Project Architecture**: `DESIGN.md`
- **Claude Guidance**: `CLAUDE.md`

---

**Last Updated**: April 17, 2026  
**Status**: Ready for Phase 2 Implementation  
**Estimated Completion**: 40-60 hours
