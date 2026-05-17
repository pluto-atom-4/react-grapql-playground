# Issue #153 Architecture: Phase 1 + Phase 2 E2E Testing System

**Purpose**: Comprehensive architecture guide for Phase 1 + Phase 2 E2E testing  
**Audience**: Architects, senior developers  
**Level**: Advanced technical design  

---

## System Architecture Overview

### High-Level Testing Pyramid

```
                    E2E Tests (Phase 2)
                    ↑
                    │ 30+ test cases
                    │ 5 test suites
                    │ Complete workflows
                    │
    Integration Tests (React + Apollo)
                    ↑
    Unit Tests (Components, Resolvers, Routes)
```

Phase 2 builds on Phase 1 infrastructure, transforming the foundation into production-ready test cases.

---

## Phase 1 Architecture (Foundation)

### Fixture Hierarchy

```
┌─────────────────────────────────────┐
│         @playwright/test            │
│         (base.extend<T>)            │
└──────────────┬──────────────────────┘
               │
      ┌────────┴────────┐
      ↓                 ↓
 authenticatedPage   apiClient
  (Pre-logged in)   (GraphQL/REST)
      │                 │
      └────────┬────────┘
               ↓
           testUser
       (Test credentials)
```

### Fixture Setup Flow

```
Test Starts
    ↓
[authenticatedPage Fixture]
├─ Navigate to /login
├─ Fill credentials from environment
├─ Submit login form
├─ Wait for JWT token in localStorage
├─ Wait for Apollo cache ready
└─ Return logged-in page to test
    ↓
[apiClient Fixture]
├─ Extract JWT token from localStorage
├─ Create GraphQLClient with token
├─ Create ExpressClient
└─ Return combined API client
    ↓
[testUser Fixture]
├─ Read credentials from environment
├─ Provide to test
└─ Handle cleanup after test
    ↓
Test Code Executes
    ↓
Automatic Cleanup
├─ Clear localStorage
├─ Clear cookies
├─ Close browser context
└─ Cleanup API client
```

### Page Object Hierarchy

```
BasePage (Abstract Base Class)
├─ Provides common selectors and helpers:
│  ├─ getByTestId(id) - Locator by data-testid
│  ├─ waitForTestId(id, timeout) - Wait for element
│  ├─ clickByTestId(id) - Click element
│  ├─ fillByTestId(id, text) - Fill input
│  ├─ waitForNetworkIdle() - Wait for network
│  └─ Common wait patterns
│
├─ LoginPage extends BasePage
│  ├─ fillEmail(email)
│  ├─ fillPassword(password)
│  ├─ submit()
│  ├─ getErrorMessage()
│  └─ isFormReady()
│
├─ DashboardPage extends BasePage
│  ├─ getBuilds()
│  ├─ clickBuild(id)
│  ├─ logout()
│  └─ isDashboardReady()
│
├─ BuildsPage extends BasePage (Phase 2)
│  ├─ getBuilds()
│  ├─ createBuild()
│  ├─ filterByStatus()
│  └─ searchByName()
│
└─ BuildDetailPage extends BasePage (Phase 2)
   ├─ selectStatus()
   ├─ uploadFile()
   ├─ downloadFile()
   └─ save()
```

### Helper Utilities Architecture

```
Phase 1 Helpers
├─ api-client.ts
│  ├─ GraphQLClient
│  │  ├─ query(query, variables)
│  │  └─ mutation(mutation, variables)
│  ├─ ExpressClient
│  │  ├─ uploadFile(path, fileData)
│  │  ├─ sendWebhook(path, payload)
│  │  └─ streamEvents(onMessage)
│  └─ APIClient (Combined)
│
├─ seed-data.ts
│  ├─ seedTestData(apiClient)
│  └─ cleanupTestData(apiClient)
│
├─ wait-helpers.ts
│  ├─ waitForApolloCacheReady()
│  ├─ waitForNetworkIdle()
│  └─ Custom wait patterns
│
└─ test-user.ts
   └─ Test credentials provider
```

---

## Phase 2 Architecture (Production Test Cases)

### Data Flow: Complete Workflow Test

```
Test Execution
    ↓
[1. Authentication]
├─ Fixture: authenticatedPage
├─ Action: LoginPage.login()
├─ Verification: Token stored, dashboard accessible
└─ Output: Logged-in page
    ↓
[2. CRUD Operations]
├─ BuildFactory.create()
├─ BuildsPage.getBuilds()
├─ BuildDetailPage.selectStatus()
└─ Output: Updated build in database
    ↓
[3. Real-Time Updates]
├─ EventListener.on('buildStatusChanged')
├─ API: updateBuildStatus() mutation
├─ SSE: Event emitted by Express
├─ Cache: Apollo updates automatically
└─ Output: UI reflects change
    ↓
[4. File Upload]
├─ FileGenerator.generateTestReport()
├─ BuildDetailPage.uploadFile()
├─ Express: /upload endpoint
├─ Storage: File saved
└─ Output: File in database
    ↓
[5. Verification]
├─ API: Query to verify data
├─ UI: Check dashboard
├─ Events: Verify event fired
└─ Consistency: All layers agree
    ↓
[6. Cleanup]
├─ BuildFactory.delete()
├─ Clear test data
└─ Logout
```

### Test Organization Structure

```
tests/
├── auth/
│   └── login-logout.spec.ts
│       ├── Test Suite: Authentication
│       ├── TC-AUTH-001 to TC-AUTH-006
│       ├── Uses: LoginPage, authenticatedPage fixture
│       └── Scope: Login, logout, session management
│
├── builds/
│   └── crud-operations.spec.ts
│       ├── Test Suite: Build Management
│       ├── TC-BUILD-001 to TC-BUILD-006
│       ├── Uses: BuildsPage, BuildDetailPage, BuildFactory
│       └── Scope: CRUD operations, pagination, filtering
│
└── integration/
    ├── real-time-updates.spec.ts
    │   ├── Test Suite: Real-Time Events
    │   ├── TC-RT-001 to TC-RT-005
    │   ├── Uses: RealtimeListener, EventVerifier
    │   └── Scope: SSE, subscriptions, multi-user
    │
    ├── file-uploads.spec.ts
    │   ├── Test Suite: File Operations
    │   ├── TC-FILE-001 to TC-FILE-007
    │   ├── Uses: FileGenerator, BuildDetailPage
    │   └── Scope: Upload, download, validation
    │
    └── complete-workflow.spec.ts
        ├── Test Suite: End-to-End Workflows
        ├── TC-WORKFLOW-001 to TC-WORKFLOW-004
        ├── Uses: All page objects and helpers
        └── Scope: Complete user journeys
```

### New Helpers: Phase 2

```
BuildFactory (NEW)
├─ Purpose: Generate consistent test builds
├─ Methods:
│  ├─ create(overrides?)
│  ├─ createMany(count, overrides?)
│  └─ delete(id)
└─ Benefit: DRY test data, easy cleanup

FileGenerator (NEW)
├─ Purpose: Create test files of various types
├─ Methods:
│  ├─ generateTestReport()
│  ├─ generateCADFile()
│  ├─ generateLargeFile()
│  └─ cleanup()
└─ Benefit: Realistic file upload scenarios

RealtimeListener (NEW)
├─ Purpose: Subscribe to real-time events
├─ Methods:
│  ├─ on(eventName, callback)
│  ├─ wait(eventName, timeout)
│  └─ getEvents(eventName)
└─ Benefit: Verify SSE and subscriptions work

EventVerifier (NEW)
├─ Purpose: Verify events fire correctly
├─ Methods:
│  ├─ waitForEvent(name, timeout)
│  ├─ expectEventFired(name)
│  └─ getEventHistory()
└─ Benefit: Reliable event verification

AssertionHelpers (NEW)
├─ Purpose: Common assertions (DRY)
├─ Methods:
│  ├─ assertBuildStatus()
│  ├─ assertFileUpload()
│  └─ assertErrorMessage()
└─ Benefit: Readable, maintainable assertions

NetworkMonitor (NEW)
├─ Purpose: Track network requests
├─ Methods:
│  ├─ recordRequests()
│  ├─ getRequestCount()
│  └─ getSlowRequests()
└─ Benefit: Debug flaky tests, performance analysis
```

---

## Integration Points: Phase 2 Tests ↔ Full Stack

### Authentication Flow

```
Test Code
    ↓
authenticatedPage Fixture
    ├─ POST /api/auth/login (GraphQL mutation)
    │  ├─ Calls: Apollo Server on :4000
    │  ├─ Validates: Email/password
    │  ├─ Database: PostgreSQL query
    │  └─ Returns: JWT token
    │
    ├─ Store JWT in localStorage
    │
    └─ Verify Apollo cache ready
       └─ Queries: GraphQL to populate cache
```

### Build Management Flow

```
Test Code
    ↓
BuildFactory.create()
    ├─ GraphQL Mutation: createBuild()
    ├─ Server: Apollo Server processes
    ├─ Database: INSERT into builds table
    └─ Cache: Apollo updates local cache
    ↓
BuildsPage.getBuilds()
    ├─ Query DOM: [data-testid^="build-"]
    ├─ Extract: ID, status, name from elements
    └─ Return: BuildCard[]
    ↓
Verify
    └─ Compare API response vs UI display
```

### Real-Time Updates Flow

```
Test Code
    ↓
RealtimeListener.on('buildStatusChanged', callback)
    └─ Subscribes to EventSource(:5000/events)
    ↓
API Mutation: updateBuildStatus()
    ├─ Apollo Server processes mutation
    ├─ Database: UPDATE builds table
    └─ Emit Event: Express event bus
    ↓
Express Server
    ├─ Receives: event from Apollo
    ├─ Broadcasts: via SSE to all clients
    └─ Sends: event to browser
    ↓
Test Receives Event
    └─ callback() fired with event data
    ↓
Apollo Cache Updates
    ├─ Query invalidated
    ├─ Refetch from server
    └─ UI re-renders
    ↓
Test Verifies
    └─ Check: dashboard reflects new status
```

### File Upload Flow

```
Test Code
    ↓
FileGenerator.generateTestReport()
    └─ Creates: file on disk at test-files/report.json
    ↓
BuildDetailPage.uploadFile(path, label)
    ├─ Reads: file from disk
    ├─ POST /upload (Express FormData)
    ├─ Express stores: file on disk/S3
    ├─ Database: INSERT into uploads table
    └─ Returns: fileId
    ↓
Emit Event: fileUploaded
    └─ Express broadcasts via SSE
    ↓
UI Updates
    ├─ RealtimeListener receives event
    ├─ Apollo cache invalidated
    └─ Build detail reloads files list
    ↓
Test Verifies
    ├─ File appears in getUploadedFiles()
    └─ File metadata correct (size, type)
```

---

## Data Isolation & Test Independence

### Test Isolation Strategy

```
Each Test
    ├─ Starts with: Clean database (fresh PostgreSQL container)
    ├─ Creates: Test data via factories
    ├─ Executes: Test scenario
    ├─ Verifies: Expected outcomes
    └─ Cleans up: Delete test data via API
    
Result: Tests can run:
    ├─ In any order
    ├─ In parallel (without interference)
    └─ Multiple times (idempotent)
```

### Parallel Execution Architecture

```
CI/CD Pipeline
    ├─ Start PostgreSQL container (once)
    ├─ Seed initial data (once)
    │
    ├─ [Worker 1] → auth/login-logout.spec.ts
    ├─ [Worker 2] → builds/crud-operations.spec.ts
    ├─ [Worker 3] → integration/real-time-updates.spec.ts
    ├─ [Worker 4] → integration/file-uploads.spec.ts
    │
    ├─ Each worker:
    │  ├─ Has own browser context
    │  ├─ Own localStorage/cookies
    │  ├─ Own API requests (with unique IDs)
    │  └─ Cleanup at end
    │
    └─ Results aggregated
       └─ Report generated
```

### Data Cleanup Strategy

```
After Each Test
    ├─ API Cleanup:
    │  └─ BuildFactory.delete(createdBuildIds)
    │
    ├─ Browser Cleanup:
    │  ├─ localStorage.clear()
    │  ├─ Clear cookies
    │  └─ Close context
    │
    ├─ File Cleanup:
    │  └─ FileGenerator.cleanup()
    │
    └─ Event Listeners:
       └─ RealtimeListener.clear()
```

---

## Error Handling Architecture

### Error Flow

```
Test Action Fails
    ↓
Catch Error
    ├─ Network Error
    │  ├─ Retry logic (3 attempts)
    │  └─ Log: network details
    │
    ├─ GraphQL Error
    │  ├─ Parse: error.errors[0].message
    │  ├─ Log: GraphQL error
    │  └─ Verify: expected error
    │
    ├─ Assertion Error
    │  ├─ Screenshot: on failure
    │  ├─ Trace: browser trace
    │  ├─ Video: record on failure
    │  └─ Report: detailed error
    │
    └─ Timeout Error
       ├─ Increase timeout
       ├─ Check: service connectivity
       └─ Debug: with Inspector
```

### Flaky Test Prevention

```
Strategies

1. Explicit Waits (not delays)
   ├─ waitForSelector() with timeout
   ├─ waitForLoadState('networkidle')
   ├─ waitForURL() for navigation
   └─ waitForFunction() for custom conditions

2. Event Verification
   ├─ Wait for SSE event to arrive
   ├─ Verify event contains expected data
   └─ Assert UI updated from event

3. Proper Cleanup
   ├─ Delete test data between tests
   ├─ Clear cache/storage
   └─ Close contexts

4. Resource Limits
   ├─ Proper browser context cleanup
   ├─ Close open connections
   └─ Monitor memory usage
```

---

## Reporting & Metrics

### Test Report Structure

```
test-results/
├── index.html           (Main report)
├── data/
│   ├── test.json       (Machine-readable)
│   └── trace.zip       (Browser traces)
├── videos/
│   └── failed-*.webm   (Failed test recordings)
└── screenshots/
    └── failed-*.png    (Failure screenshots)

Report Contains:
├─ Total tests run
├─ Pass/fail count
├─ Pass rate percentage
├─ Flaky tests (passed on retry)
├─ Execution time per test
├─ Browser version
└─ Links to traces/videos
```

### Metrics Tracked

```
Per Test:
├─ Execution time (duration)
├─ Retry count
├─ Pass/fail status
└─ Error message

Per Suite:
├─ Total tests
├─ Passed count
├─ Failed count
└─ Pass rate

Aggregated:
├─ Total execution time
├─ Critical failures
├─ Flaky tests
└─ Trend over time
```

---

## Performance Characteristics

### Test Execution Timeline

```
Phase 1 Infrastructure Setup: ~5 seconds
├─ Start Playwright
├─ Create browser context
└─ Load fixtures

Authentication (TC-AUTH-001): ~8 seconds
├─ Navigate to login: 2s
├─ Fill form: 1s
├─ Submit: 3s
├─ Redirect + cache ready: 2s

Build CRUD (TC-BUILD-001): ~12 seconds
├─ Navigate dashboard: 3s
├─ Create build: 4s
├─ Verify in list: 5s

Real-Time (TC-RT-001): ~15 seconds
├─ Setup listener: 2s
├─ Create build: 4s
├─ Update status (trigger event): 3s
├─ Wait for event: 3s
├─ Verify UI: 3s

File Upload (TC-FILE-001): ~20 seconds
├─ Navigate detail: 3s
├─ Generate file: 2s
├─ Upload (network dependent): 10s
├─ Verify in list: 5s

Complete Workflow (TC-WORKFLOW-001): ~45 seconds
├─ All above steps combined
├─ Login: 8s
├─ Create: 4s
├─ Upload: 10s
├─ Update: 5s
├─ Verify: 10s
├─ Logout: 3s
└─ Cleanup: 5s

Total Suite Execution: ~3-5 minutes (parallel across 4 workers)
Total CI/CD Pipeline: ~10-12 minutes
├─ Setup: 2 min
├─ Tests: 8 min
└─ Report generation: 2 min
```

---

## Scalability & Future Phases

### Phase 3: Performance & Load Testing

```
Load Testing Architecture
├─ Generate: 100+ concurrent users
├─ Measure: Response times, throughput
├─ Track: CPU, memory, database connections
└─ Report: Performance baselines

Tools:
├─ k6 (load testing)
├─ Grafana (metrics visualization)
└─ Prometheus (metrics collection)
```

### Phase 4: Advanced Coverage

```
Visual Regression
├─ Capture: Baseline screenshots
├─ Compare: Against golden images
├─ Report: Visual differences

Cross-Browser Testing
├─ Firefox
├─ WebKit (Safari)
├─ Mobile Chrome

Accessibility Testing
├─ axe-core for automated checks
├─ WCAG compliance validation
└─ Screen reader compatibility

API Contract Testing
├─ Verify GraphQL schema
├─ Check REST endpoint contracts
└─ Version compatibility
```

---

## Deployment: CI/CD Integration

### GitHub Actions Workflow Structure

```
.github/workflows/e2e-tests.yml
├─ Trigger: Push to main/develop, PR
├─ Matrix: 5 test suites (parallel jobs)
├─ Steps:
│  ├─ Checkout code
│  ├─ Setup Node 18
│  ├─ Install pnpm dependencies
│  ├─ Start Docker services
│  ├─ Seed test database
│  ├─ Run Playwright tests
│  ├─ Upload test artifacts
│  └─ Comment results on PR
└─ Duration: 10-12 minutes total

Artifacts Retained:
├─ HTML reports
├─ Test videos (failures)
├─ Screenshots (failures)
└─ Browser traces (failures)
```

### Flaky Test Detection

```
GitHub Workflow Enhancements
├─ Track: Test pass rate per suite
├─ Alert: If pass rate < 95%
├─ Bisect: Find flaky tests
├─ Report: Flaky test dashboard
└─ Action: Retry and document

Integration with GitHub Issues:
├─ Auto-create issue for flaky tests
├─ Tag: flaky-test, needs-investigation
├─ Link: to failing CI runs
└─ Assign: to team for fix
```

---

## Security & Best Practices

### Test Data Security

```
Sensitive Data Handling
├─ Test email: test@example.com (hardcoded)
├─ Test password: environment variable
├─ API tokens: temporary, per-test
└─ Never: Commit real user credentials

Environment Isolation
├─ CI/CD: Separate environment from production
├─ Database: Fresh container per run
├─ APIs: Mocked external services
└─ Files: Test artifacts cleaned up
```

### Code Quality Standards

```
Enforcement
├─ ESLint v9: Strict linting rules
├─ TypeScript: Strict mode enabled
├─ prettier: Code formatting
├─ Pre-commit hooks: Verify standards
└─ PR review: Check test quality

Patterns to Avoid
├─ ❌ Hard-coded timeouts
├─ ❌ Flaky selectors
├─ ❌ No error handling
├─ ❌ Unclear test intent
└─ ❌ Duplicate setup code
```

---

## Maintenance & Evolution

### Test Maintenance Schedule

```
Weekly
├─ Monitor: Pass rate dashboard
├─ Address: Flaky test patterns
└─ Update: Selectors if UI changes

Monthly
├─ Review: Test coverage gaps
├─ Add: New test cases
├─ Refactor: Repeated patterns
└─ Update: Documentation

Quarterly
├─ Assess: E2E strategy alignment
├─ Plan: New test suites
├─ Upgrade: Playwright version
└─ Train: Team on new patterns
```

### Adding New Tests

```
When Adding New Feature X

1. Page Objects
   └─ Create: XPage extends BasePage
   └─ Add: Selectors and methods

2. Helper Utilities
   └─ Add: XFactory or XGenerator if needed

3. Test Cases
   └─ Create: tests/feature/x.spec.ts
   └─ Implement: 3-5 test scenarios

4. Integration
   └─ Add: To complete-workflow test
   └─ Verify: Works with other features

5. Documentation
   └─ Update: Quick reference
   └─ Add: To architecture diagram
```

---

## Summary: Phase 1 + Phase 2

| Aspect | Phase 1 | Phase 2 | Total |
|--------|---------|---------|-------|
| **Test Suites** | 1 (example) | 5 | 6 |
| **Test Cases** | 10 | 30+ | 40+ |
| **Page Objects** | 3 | 5 | 8 |
| **Helpers** | 5 | 6 | 11 |
| **Estimated Effort** | 25 hours | 40-60 hours | 65-85 hours |
| **Lines of Test Code** | 231 | 1500+ | 1700+ |
| **CI/CD Time** | N/A | 10-12 min | 10-12 min |
| **Pass Rate Target** | 100% | 95%+ | 95%+ |

---

## References & Resources

- **Phase 1 Plan**: `ISSUE-152-PLAYWRIGHT-SETUP-PLAN.md`
- **Phase 2 Plan**: `ISSUE-153-PHASE2-TESTCASES-PLAN.md`
- **Playwright Docs**: https://playwright.dev/docs/intro
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **GraphQL Best Practices**: https://graphql.org/learn/best-practices/
- **Project Architecture**: `DESIGN.md`
- **Environment Setup**: `CLAUDE.md`

---

**Last Updated**: April 17, 2026  
**Architecture Version**: 2.0 (Phase 1 + Phase 2)  
**Status**: Production-Ready Design
