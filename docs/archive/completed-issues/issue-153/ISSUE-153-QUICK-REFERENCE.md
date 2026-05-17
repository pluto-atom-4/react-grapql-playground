# Issue #153 Quick Reference: Phase 2 E2E Test Cases

**Status**: Quick Reference Guide  
**Purpose**: Fast lookup for Phase 2 implementation  
**Target Audience**: Developers implementing Phase 2 test cases  

---

## Phase 2 Overview

| Aspect | Details |
|--------|---------|
| **Goal** | Implement production-ready E2E test cases |
| **Builds On** | Phase 1 infrastructure (fixtures, page objects, helpers) |
| **Scope** | 5 test suites, 30+ test cases, 5+ new page objects/helpers |
| **Effort** | 40-60 hours |
| **Deliverables** | Tests, page objects, utilities, CI/CD integration |

---

## Quick Start: Running Phase 2 Tests

```bash
# Install dependencies
pnpm install

# Start services (PostgreSQL, GraphQL, Express, Frontend)
docker-compose up -d
pnpm dev

# Run all Phase 2 tests
pnpm e2e:test

# Run specific test suite
pnpm e2e:test tests/auth/login-logout.spec.ts
pnpm e2e:test tests/builds/crud-operations.spec.ts
pnpm e2e:test tests/integration/real-time-updates.spec.ts
pnpm e2e:test tests/integration/file-uploads.spec.ts
pnpm e2e:test tests/integration/complete-workflow.spec.ts

# Run with reporting
pnpm e2e:test --reporter=html
pnpm e2e:report  # View HTML report

# Debug mode
pnpm e2e:debug tests/auth/login-logout.spec.ts
```

---

## File Structure: Phase 2

```
frontend/e2e/
├── tests/
│   ├── auth/
│   │   └── login-logout.spec.ts          (TC-AUTH-001 to TC-AUTH-006)
│   ├── builds/
│   │   └── crud-operations.spec.ts       (TC-BUILD-001 to TC-BUILD-006)
│   └── integration/
│       ├── real-time-updates.spec.ts     (TC-RT-001 to TC-RT-005)
│       ├── file-uploads.spec.ts          (TC-FILE-001 to TC-FILE-007)
│       └── complete-workflow.spec.ts     (TC-WORKFLOW-001 to TC-WORKFLOW-004)
├── pages/
│   ├── BasePage.ts                       (Phase 1)
│   ├── LoginPage.ts                      (Phase 1)
│   ├── DashboardPage.ts                  (Phase 1)
│   ├── BuildsPage.ts                     (NEW)
│   ├── BuildDetailPage.ts                (NEW)
│   └── index.ts
├── helpers/
│   ├── api-client.ts                     (Phase 1)
│   ├── seed-data.ts                      (Phase 1)
│   ├── wait-helpers.ts                   (Phase 1)
│   ├── test-user.ts                      (Phase 1)
│   ├── build-factory.ts                  (NEW)
│   ├── file-generator.ts                 (NEW)
│   ├── assertion-helpers.ts              (NEW)
│   ├── event-verifier.ts                 (NEW)
│   ├── realtime-listener.ts              (NEW)
│   ├── network-monitor.ts                (NEW)
│   └── index.ts
├── fixtures/
│   └── base.fixture.ts                   (Phase 1)
├── playwright.config.ts                  (Phase 1)
└── README.md

.github/workflows/
└── e2e-tests.yml                         (NEW: CI/CD workflow)
```

---

## Test Suites Summary

### 1. Authentication Tests (auth/login-logout.spec.ts)

| Test Case | Purpose | Key Assertion |
|-----------|---------|---------------|
| TC-AUTH-001 | Valid login succeeds | Token created, redirect to dashboard |
| TC-AUTH-002 | Invalid password fails | Error message shown, no token |
| TC-AUTH-003 | Non-existent user fails | Error message shown, no token |
| TC-AUTH-004 | Session persists | Token unchanged across navigation |
| TC-AUTH-005 | Logout clears session | Token cleared, redirect to login |
| TC-AUTH-006 | Token expiration handled | Re-authentication triggered |

**Key Methods**:
- `loginPage.fillEmail()`, `loginPage.fillPassword()`, `loginPage.submit()`
- `dashboard.logout()`
- `localStorage.getItem('auth_token')`

**Setup**: ~2 hours  
**Difficulty**: ⭐ Easy

---

### 2. Build CRUD Tests (builds/crud-operations.spec.ts)

| Test Case | Purpose | Key Assertion |
|-----------|---------|---------------|
| TC-BUILD-001 | Create build | Build appears in list |
| TC-BUILD-002 | List builds with pagination | Pagination works, correct count |
| TC-BUILD-003 | Filter by status | Filter results accurate |
| TC-BUILD-004 | Search by name | Search results contain keyword |
| TC-BUILD-005 | Update build status | API and UI reflect change |
| TC-BUILD-006 | Delete build | Build removed from list |

**Key Methods**:
- `dashboard.getBuilds()`, `dashboard.createBuild()`
- `dashboard.selectFilter()`, `dashboard.searchByTestId()`
- `BuildFactory.create()`, `BuildFactory.createMany()`

**Setup**: ~15 hours  
**Difficulty**: ⭐⭐ Medium

---

### 3. Real-Time Updates Tests (integration/real-time-updates.spec.ts)

| Test Case | Purpose | Key Assertion |
|-----------|---------|---------------|
| TC-RT-001 | SSE events received | Event fired and data correct |
| TC-RT-002 | Apollo subscriptions update | Cache invalidated, UI updated |
| TC-RT-003 | Multi-user updates | All users see same data |
| TC-RT-004 | Event ordering | Events received in order |
| TC-RT-005 | Network reconnection | Subscription restored after offline |

**Key Methods**:
- `RealtimeListener.on()`, `RealtimeListener.wait()`
- `EventVerifier.waitForEvent()`, `EventVerifier.expectEventFired()`
- `page.context().setOffline()`

**Setup**: ~12 hours  
**Difficulty**: ⭐⭐⭐ Hard

---

### 4. File Upload Tests (integration/file-uploads.spec.ts)

| Test Case | Purpose | Key Assertion |
|-----------|---------|---------------|
| TC-FILE-001 | Upload test report | File appears in list |
| TC-FILE-002 | Upload CAD file | File MIME type correct |
| TC-FILE-003 | Size validation | Upload rejected for > limit |
| TC-FILE-004 | Type validation | Upload rejected for unsupported type |
| TC-FILE-005 | Progress tracking | Progress indicator shown |
| TC-FILE-006 | Download file | Downloaded file matches uploaded |
| TC-FILE-007 | Concurrent uploads | All files uploaded successfully |

**Key Methods**:
- `detailPage.uploadFile()`, `detailPage.getUploadedFiles()`
- `FileGenerator.generateTestReport()`, `FileGenerator.generateCADFile()`
- `detailPage.downloadFile()`

**Setup**: ~10 hours  
**Difficulty**: ⭐⭐ Medium

---

### 5. Integration Workflow Tests (integration/complete-workflow.spec.ts)

| Test Case | Purpose | Key Assertion |
|-----------|---------|---------------|
| TC-WORKFLOW-001 | Happy path workflow | Complete end-to-end success |
| TC-WORKFLOW-002 | Multi-user concurrent | No interference between users |
| TC-WORKFLOW-003 | Error recovery | Recovers from temporary failures |
| TC-WORKFLOW-004 | Data consistency | Data consistent across services |

**Key Methods**: Combines all other test utilities  

**Setup**: ~8 hours  
**Difficulty**: ⭐⭐ Medium

---

## Page Objects: Phase 2

### BuildsPage
```typescript
// Methods
await buildPage.goto()
await buildPage.getBuilds()  // Returns BuildCard[]
await buildPage.createBuild(name, description)
await buildPage.filterByStatus(status)
await buildPage.searchByName(query)
await buildPage.selectBuild(id)
await buildPage.deleteBuild(id)
await buildPage.nextPage()
await buildPage.prevPage()
```

### BuildDetailPage
```typescript
// Methods
await detailPage.goto(buildId)
await detailPage.selectStatus(status)
await detailPage.uploadFile(path, label)
await detailPage.downloadFile(label)
await detailPage.getUploadedFiles()  // Returns UploadedFile[]
await detailPage.deleteFile(label)
await detailPage.save()
await detailPage.getUploadProgress()  // Returns 0-100
```

---

## Helper Utilities: Phase 2

### BuildFactory
```typescript
const factory = new BuildFactory(apiClient);

// Create single build
const build = await factory.create({ 
  name: 'Test Build',
  status: 'PENDING' 
});

// Create multiple
const builds = await factory.createMany(5, { status: 'PENDING' });

// Create with relationships
const buildWithParts = await factory.createWithParts(parts);

// Delete
await factory.delete(buildId);
await factory.deleteMany([id1, id2]);
```

### FileGenerator
```typescript
const fileGen = new FileGenerator();

// Generate files
const jsonFile = await fileGen.generateTestReport('report.json');
const cadFile = await fileGen.generateCADFile('design.step');
const largeFile = await fileGen.generateLargeFile('big.bin', 50); // 50MB
const exeFile = await fileGen.generateExecutable('script.exe');

// Each returns: { path: string, size: number, mimeType: string }
console.log(jsonFile.path, jsonFile.size);

// Cleanup
await fileGen.cleanup();
```

### RealtimeListener
```typescript
const listener = new RealtimeListener(page);

// Listen for events
listener.on('buildStatusChanged', (event) => {
  console.log(`Build ${event.buildId} status: ${event.status}`);
});

// Wait for specific event
const event = await listener.wait('buildCreated', 5000);

// Get all events fired
const events = listener.getEvents('buildStatusChanged');

// Clear history
listener.clear();
```

### EventVerifier
```typescript
const verifier = new EventVerifier(apiClient);

// Wait for event to fire
await verifier.waitForEvent('buildStatusChanged', 5000);

// Assertions
await verifier.expectEventFired('buildCreated');
await verifier.expectEventNotFired('buildDeleted');

// Get history
const history = await verifier.getEventHistory();
```

---

## Key Selectors (data-testid)

**Login Page**:
- `email-input` - Email input field
- `password-input` - Password input field
- `submit-button` - Login submit button
- `error-message` - Error message display

**Dashboard**:
- `builds-list` - Builds list container
- `build-${id}` - Individual build card
- `build-status` - Status badge
- `build-name` - Build name
- `create-build-button` - Create button
- `user-menu` - User menu button
- `logout-button` - Logout button

**Build Detail**:
- `build-title` - Build title
- `build-status` - Status dropdown
- `build-files` - Files section
- `upload-button` - Upload button
- `save-button` - Save button
- `upload-progress` - Progress bar

---

## Common Patterns

### Login in Test
```typescript
test('example', async ({ authenticatedPage }) => {
  // authenticatedPage fixture automatically logs in
  // Just use it directly
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
});
```

### Create & Verify via API and UI
```typescript
test('create build via API and verify in UI', async ({
  authenticatedPage,
  apiClient,
}) => {
  // Create via API
  const build = await apiClient.mutation(`...`, variables);
  
  // Verify in UI
  const dashboard = new DashboardPage(authenticatedPage);
  await dashboard.goto();
  const builds = await dashboard.getBuilds();
  const found = builds.find(b => b.id === build.id);
  expect(found).toBeDefined();
});
```

### Handle Async Operations
```typescript
test('async operation with proper waiting', async ({ page }) => {
  // Wait for network idle
  await page.waitForLoadState('networkidle');
  
  // Wait for specific element
  await page.waitForSelector('[data-testid="element"]', { timeout: 5000 });
  
  // Wait for URL change
  await page.waitForURL('**/expected-url**');
});
```

### Multi-Browser Test
```typescript
test('multi-user scenario', async ({ page, context }) => {
  // Create second browser context
  const context2 = await context.browser()?.createBrowserContext();
  const page2 = await context2?.newPage();
  
  // Use both pages
  await page.goto('/dashboard');
  await page2?.goto('/dashboard');
  
  // Cleanup
  await context2?.close();
});
```

### Error Handling
```typescript
test('handle errors gracefully', async ({ apiClient }) => {
  try {
    const result = await apiClient.query(`query { invalid }`);
    if (result.errors) {
      console.log('GraphQL error:', result.errors[0].message);
    }
  } catch (error) {
    console.log('Network error:', error);
  }
});
```

---

## Implementation Checklist

### Phase 2A: Authentication (Week 1-2)
- [ ] Implement `tests/auth/login-logout.spec.ts`
  - [ ] TC-AUTH-001: Valid login
  - [ ] TC-AUTH-002: Invalid password
  - [ ] TC-AUTH-003: Non-existent user
  - [ ] TC-AUTH-004: Session persistence
  - [ ] TC-AUTH-005: Logout
  - [ ] TC-AUTH-006: Token expiration
- [ ] LoginPage extensions
- [ ] Test user fixtures
- [ ] Run: `pnpm e2e:test tests/auth/login-logout.spec.ts --run`

### Phase 2B: Build CRUD (Week 2-3)
- [ ] Create `BuildsPage.ts` page object
- [ ] Create `BuildDetailPage.ts` page object
- [ ] Create `BuildFactory.ts` helper
- [ ] Implement `tests/builds/crud-operations.spec.ts`
  - [ ] TC-BUILD-001: Create
  - [ ] TC-BUILD-002: List with pagination
  - [ ] TC-BUILD-003: Filter by status
  - [ ] TC-BUILD-004: Search by name
  - [ ] TC-BUILD-005: Update status
  - [ ] TC-BUILD-006: Delete
- [ ] Run: `pnpm e2e:test tests/builds/crud-operations.spec.ts --run`

### Phase 2C: Real-Time (Week 3-4)
- [ ] Create `RealtimeListener.ts` helper
- [ ] Create `EventVerifier.ts` helper
- [ ] Implement `tests/integration/real-time-updates.spec.ts`
  - [ ] TC-RT-001: SSE events
  - [ ] TC-RT-002: Apollo subscriptions
  - [ ] TC-RT-003: Multi-user updates
  - [ ] TC-RT-004: Event ordering
  - [ ] TC-RT-005: Network reconnection
- [ ] Run: `pnpm e2e:test tests/integration/real-time-updates.spec.ts --run`

### Phase 2D: File Uploads (Week 4)
- [ ] Create `FileGenerator.ts` helper
- [ ] Implement `tests/integration/file-uploads.spec.ts`
  - [ ] TC-FILE-001: Upload test report
  - [ ] TC-FILE-002: Upload CAD file
  - [ ] TC-FILE-003: Size validation
  - [ ] TC-FILE-004: Type validation
  - [ ] TC-FILE-005: Progress tracking
  - [ ] TC-FILE-006: Download
  - [ ] TC-FILE-007: Concurrent uploads
- [ ] Run: `pnpm e2e:test tests/integration/file-uploads.spec.ts --run`

### Phase 2E: Workflows (Week 4-5)
- [ ] Create `AssertionHelpers.ts` utility
- [ ] Implement `tests/integration/complete-workflow.spec.ts`
  - [ ] TC-WORKFLOW-001: Happy path
  - [ ] TC-WORKFLOW-002: Multi-user
  - [ ] TC-WORKFLOW-003: Error recovery
  - [ ] TC-WORKFLOW-004: Data consistency
- [ ] Run: `pnpm e2e:test tests/integration/complete-workflow.spec.ts --run`

### Phase 2F: CI/CD & Docs (Week 5)
- [ ] Create `.github/workflows/e2e-tests.yml`
- [ ] Configure parallel execution
- [ ] Setup artifact archiving
- [ ] Generate HTML reports
- [ ] Create ISSUE-153-ARCHITECTURE.md
- [ ] Document troubleshooting

---

## Debugging Guide

### Enable Verbose Logging
```bash
DEBUG=pw:api pnpm e2e:test
```

### Run Single Test
```bash
pnpm e2e:test tests/auth/login-logout.spec.ts -g "TC-AUTH-001"
```

### Debug Mode (with Inspector)
```bash
pnpm e2e:debug tests/auth/login-logout.spec.ts
# Opens Playwright Inspector, allows step-by-step debugging
```

### View Test Report
```bash
pnpm e2e:test --reporter=html
pnpm e2e:report
# Opens test-results/index.html in browser
```

### Check Traces
```bash
# Traces saved on first failure retry
# Contains: Network requests, DOM snapshots, screenshots
npx playwright show-trace test-results/trace.zip
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `data-testid` not found | Check component has attribute, use Inspector to verify |
| Timeout on network wait | Increase timeout, check if service is running |
| Token not persisting | Check localStorage API not mocked differently |
| SSE not connecting | Verify Express server running on port 5000 |
| File upload fails | Check file path exists, use FileGenerator |
| Multi-browser issue | Ensure contexts properly closed, no resource leaks |

---

## Environment Setup

**Required Environment Variables** (`.env.local`):

```env
# Frontend
BASE_URL=http://localhost:3000
PLAYWRIGHT_BASE_URL=http://localhost:3000

# GraphQL API
GRAPHQL_URL=http://localhost:4000/graphql

# Express API
EXPRESS_URL=http://localhost:5000

# Test Credentials
TEST_EMAIL=test@example.com
TEST_PASSWORD=TestPassword123!
```

**Services Required**:
- PostgreSQL (Docker): `docker-compose up -d`
- Frontend: `pnpm dev:frontend`
- GraphQL: `pnpm dev:graphql`
- Express: `pnpm dev:express`

---

## Success Criteria

- ✅ All test suites pass: `pnpm e2e:test --run` (5-10 min)
- ✅ No flaky tests: Run 5 times, all pass
- ✅ Pass rate > 95%
- ✅ All page objects have TypeScript types
- ✅ All helpers fully documented
- ✅ HTML reports generate successfully
- ✅ CI/CD pipeline completes in < 10 minutes

---

## Interview Preparation

**Key Topics**:
1. **Page Object Model**: Why we abstract selectors into page objects
2. **Fixture Pattern**: How Phase 1 fixtures enable Phase 2 tests
3. **Real-Time Testing**: Challenges of testing SSE and Apollo subscriptions
4. **Flaky Test Prevention**: Strategies for reliable async operations
5. **Test Organization**: Directory structure and test categorization
6. **CI/CD Integration**: Parallelization and reporting

**Story to Tell**:
*"Phase 1 gave us the infrastructure. Phase 2 is about coverage—authentication, CRUD operations, real-time updates, file uploads, and end-to-end workflows. We use factories to generate consistent test data, page objects to abstract the UI, and helpers to reduce duplication. The result: 30+ test cases that verify the entire system from user perspective, running in parallel in under 10 minutes."*

---

## Additional Resources

- **Full Plan**: `docs/implementation-planning/ISSUE-153-PHASE2-TESTCASES-PLAN.md`
- **Playwright Docs**: https://playwright.dev/
- **Phase 1 Reference**: `docs/implementation-planning/ISSUE-152-QUICK-REFERENCE.md`
- **Project Architecture**: `DESIGN.md`
- **TypeScript Strict**: `tsconfig.json`

---

**Last Updated**: April 17, 2026  
**Status**: Ready for Implementation
