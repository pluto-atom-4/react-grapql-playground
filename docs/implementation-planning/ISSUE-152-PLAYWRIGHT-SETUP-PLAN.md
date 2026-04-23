# Issue #152 Implementation Plan: Phase 1 - Playwright Setup & Infrastructure

**Status**: Draft Implementation Plan  
**Target**: Senior Full Stack Developer Interview (Stoke Space)  
**Scope**: E2E Testing Infrastructure for React/GraphQL/Express Full-Stack Application  
**Priority**: P0 (Foundational for E2E testing phase)  

---

## 1. Project Overview

### 1.1 Phase 1 Objectives

**Issue #152** establishes the foundational E2E testing infrastructure using **Playwright**, enabling comprehensive browser-based testing of the entire full-stack application (Next.js frontend + Apollo GraphQL + Express backend).

**Key Goals**:
- ✅ Set up Playwright with TypeScript configuration optimized for Next.js
- ✅ Create reusable fixtures for authentication, API interactions, and test user management
- ✅ Implement Page Object Model (POM) pattern for maintainable test code
- ✅ Establish service connectivity verification (frontend, GraphQL, Express)
- ✅ Create helper utilities for common testing tasks (seeding, API calls, waits)
- ✅ Define npm scripts for different testing modes (headed, headless, debug, reporting)
- ✅ Validate all three services are reachable and functional before tests run

### 1.2 Why Phase 1 Matters

**Testing Pyramid**:
```
        E2E Tests (Phase 1) ← You are here
    Integration Tests (React + Apollo)
Unit Tests (Components, Resolvers, Routes)
```

E2E tests verify **user workflows** across the entire stack—from login through data mutations to real-time updates. They catch integration issues that unit/integration tests miss.

---

## 2. Technology Stack

### 2.1 Playwright Ecosystem

| Component | Purpose | Version |
|-----------|---------|---------:|
| **@playwright/test** | E2E framework with test runner | ^1.48.0 |
| **@types/node** | TypeScript types for Node.js APIs | ^20.11.5 |
| **TypeScript** | Type-safe test code | ^5.7.2 |

### 2.2 Architecture Layers

```
Test Code (TypeScript)
    ↓
Fixtures (Authentication, API, Test Data)
    ↓
Page Objects (LoginPage, DashboardPage, BasePage)
    ↓
Helpers (Seed Data, API Client, Wait Utilities)
    ↓
Browser (Chromium)
    ↓
Frontend: http://localhost:3000 (Next.js)
└─ Apollo:4000 + Express:5000 + PostgreSQL
```

---

## 3. Implementation Steps Overview

### Phase Dependencies

```
Task 1: Install Dependencies
    ↓
Task 2: Playwright Configuration
    ├─→ Task 3: Base Fixture
    │   └─→ Task 4: Page Objects
    │       └─→ Task 5: Folder Structure
    ├─→ Task 6: Seed Data Utility
    ├─→ Task 7: API Client Utility
    ├─→ Task 8: Wait Helpers
    ├─→ Task 9: Service Connectivity
    ├─→ Task 10: NPM Scripts
    └─→ Task 11: Verification & Documentation
```

---

## 4. File Structure

### Final Directory Layout

```
frontend/
├── e2e/                          ← NEW E2E Infrastructure
│   ├── fixtures/                 
│   │   ├── base.fixture.ts       # Main fixture (auth, API, testUser)
│   │   ├── index.ts              # Re-exports
│   │   └── README.md             # Fixture documentation
│   │
│   ├── pages/                    # Page Object Model
│   │   ├── BasePage.ts           # Base class
│   │   ├── LoginPage.ts          # Login interactions
│   │   ├── DashboardPage.ts      # Dashboard interactions
│   │   ├── index.ts              # Re-exports
│   │   └── README.md             # POM documentation
│   │
│   ├── helpers/                  # Utilities
│   │   ├── api-client.ts         # GraphQL/REST client
│   │   ├── seed-data.ts          # Database seeding
│   │   ├── wait-helpers.ts       # Custom waits
│   │   ├── test-user.ts          # Test credentials
│   │   ├── index.ts              # Re-exports
│   │   └── README.md             # Helper docs
│   │
│   ├── tests/                    # Test files
│   │   ├── auth/                 # Auth tests (future)
│   │   ├── builds/               # Build tests (future)
│   │   ├── integration/          # Integration tests (future)
│   │   ├── example.spec.ts       # Example test
│   │   └── README.md             # Test organization
│   │
│   ├── utils/                    # Advanced utilities (future)
│   │
│   ├── playwright.config.ts      # Main configuration
│   ├── playwright.global-setup.ts # Service verification
│   ├── README.md                 # Main E2E guide
│   └── .gitignore                # Test artifacts
│
├── package.json                  ← UPDATED with e2e scripts
└── ...
```

---

## 5. Configuration Details

### 5.1 playwright.config.ts

**Key Configuration**:
- **testDir**: `./e2e/tests` - Organize tests separately
- **fullyParallel**: `true` - Run tests in parallel locally
- **workers**: `1` (CI only) - Stability on CI
- **retries**: `2` (CI only) - Handle flaky tests
- **baseURL**: `http://localhost:3000` - Frontend base URL
- **browsers**: `chromium` - Single browser for Phase 1
- **webServer**: `pnpm dev` - Auto-start services
- **timeout**: `30s` - Test action timeout
- **navigationTimeout**: `10s` - Page load timeout
- **reporters**: HTML, JSON, JUnit, List - Multiple formats
- **trace**: `on-first-retry` - Debug traces for failed retries
- **screenshot**: `only-on-failure` - Visual debugging
- **video**: `retain-on-failure` - Record failures

### 5.2 Environment Variables

```bash
# .env.local (frontend)
PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_GRAPHQL_URL=http://localhost:4000/graphql
PLAYWRIGHT_EXPRESS_URL=http://localhost:5000

# CI environments
CI=true  # Enables retries and sequential execution
```

---

## 6. Testing Strategy

### Fixture Lifecycle

```
1. Test Starts
   ↓
2. authenticatedPage fixture
   └─ Pre-logs user in
   └─ Sets JWT token
   └─ Waits for Apollo cache ready
   ↓
3. apiClient fixture
   └─ Creates GraphQL/REST client
   └─ Configures base URLs
   └─ Sets authorization header
   ↓
4. testUser fixture
   └─ Provides test credentials
   ↓
5. Test Code Runs
   └─ Uses all three fixtures
   ↓
6. Cleanup (automatic)
   └─ Session cleared
   └─ API client cleanup
   └─ Browser context closed
```

### Page Object Model Pattern

```typescript
// Define selectors
readonly buildButton = () => this.getByTestId('build-button');

// Define actions
async clickBuild() { await this.buildButton().click(); }

// Use in tests
await dashboard.clickBuild();
```

**Benefits**:
- Single source of truth for selectors
- Easy to maintain when UI changes
- Tests focus on behavior, not implementation

### Test Organization

```
tests/
├── auth/               # Authentication flows
│   ├── login.spec.ts        - Valid/invalid login
│   ├── signup.spec.ts       - Registration (future)
│   └── logout.spec.ts       - Logout (future)
│
├── builds/             # Build management
│   ├── create-build.spec.ts - Create workflow
│   ├── list-builds.spec.ts  - Display/filter
│   └── build-detail.spec.ts - Detail page (future)
│
└── integration/        # Cross-feature workflows
    └── end-to-end.spec.ts  - Login → Create → Upload → Real-time
```

---

## 7. Service Connectivity

### Pre-Test Verification

```bash
1. Playwright starts
   ↓
2. Global setup runs (playwright.global-setup.ts)
   ├─ Check Frontend:3000 (HTTP 200)
   ├─ Check GraphQL:4000 (introspection query)
   └─ Check Express:5000 (/health endpoint)
   ↓
3. If all ready → Tests run
   ↓
4. If not ready → Error message + exit code 1
```

### Service Endpoints

**Frontend**:
```bash
GET http://localhost:3000/
Expected: HTTP 200, Next.js HTML
```

**GraphQL**:
```bash
POST http://localhost:4000/graphql
{ query: "query { __typename }" }
Expected: HTTP 200, { data: { __typename: "Query" } }
```

**Express**:
```bash
GET http://localhost:5000/health
Expected: HTTP 200, { status: "ok" }
```

---

## 8. Implementation Timeline

**Phase 1 Total: ~3.5 hours (~220 minutes)**

| Task | Duration | Cumulative |
|------|----------|-----------|
| 1. Dependencies | 15 min | 15 min |
| 2. Configuration | 20 min | 35 min |
| 3. Base Fixture | 25 min | 60 min |
| 4. Page Objects | 30 min | 90 min |
| 5. Folder Structure | 10 min | 100 min |
| 6. Seed Data | 20 min | 120 min |
| 7. API Client | 25 min | 145 min |
| 8. Wait Helpers | 20 min | 165 min |
| 9. Connectivity Check | 15 min | 180 min |
| 10. NPM Scripts | 10 min | 190 min |
| 11. Documentation | 30 min | 220 min |

---

## 9. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Port conflicts** | Medium | Global setup checks, config overrides via env |
| **Flaky tests** | Medium | Explicit waits, retry logic, clean isolation |
| **Database state pollution** | High | Seed/cleanup per test, unique IDs |
| **Backend not ready** | High | Global setup verifies, auto-start via webServer |
| **API incompleteness** | Medium | Loosely typed initially, tighten post-backend |
| **Fixture complexity** | Low | Comprehensive docs, examples, debugging guide |

---

## 10. Success Criteria

### All Acceptance Criteria Met

```bash
✓ AC 1.1: @playwright/test and @types/node installed
✓ AC 1.2: playwright.config.ts created with Chromium, base URL, TypeScript support
✓ AC 1.3: Base fixture with authenticatedPage, apiClient, testUser
✓ AC 1.4: BasePage, LoginPage, DashboardPage page objects
✓ AC 1.5: Directory structure (fixtures, pages, tests, helpers)
✓ AC 1.6: Seed data utility (seedTestData, cleanupTestData)
✓ AC 1.7: API client (GraphQL and REST methods)
✓ AC 1.8: Wait helpers (GraphQL, Express, SSE, network, cache)
✓ AC 1.9: Service connectivity verification (global setup)
✓ AC 1.10: NPM scripts (e2e, e2e:headed, e2e:debug, e2e:report)
✓ AC 1.11: Documentation and example test
```

### Verification Commands

```bash
# Check dependencies
pnpm list | grep "@playwright/test"

# Check files exist
test -f frontend/playwright.config.ts
test -f frontend/e2e/fixtures/base.fixture.ts
test -f frontend/e2e/pages/BasePage.ts
test -d frontend/e2e/{fixtures,pages,tests,helpers}

# Check TypeScript
npx tsc --noEmit

# List tests
npx playwright test --list

# Run example test
pnpm e2e -- frontend/e2e/tests/example.spec.ts

# View report
pnpm e2e:report
```

---

## 11. Next Phases (Not in Scope)

**Phase 2**: E2E Test Cases
- Authentication tests (login, signup, logout, password reset)
- Build management tests (CRUD, filtering, pagination)
- Real-time update tests (SSE events, Apollo subscriptions)
- File upload integration tests

**Phase 3**: Advanced E2E Patterns
- Performance testing with traces
- Visual regression testing
- Cross-browser testing (Firefox, WebKit)
- Mobile testing

**Phase 4**: CI/CD Integration
- GitHub Actions workflow
- Test reporting in PRs
- Artifact uploads (reports, videos)
- Scheduled E2E runs

---

## Interview Talking Points

1. **Complete E2E Coverage**: "E2E tests verify the entire user journey—from frontend rendering through GraphQL queries to database persistence—in a single test."

2. **Page Object Model**: "POM makes tests maintainable. When the UI changes, we update the page object once instead of 50 tests."

3. **Fixture Patterns**: "Each test gets a fresh authenticated context via fixtures. No state leakage between tests, even running in parallel."

4. **Real-Time Testing**: "We test real-time updates by listening for SSE events while triggering mutations from the API—validating the complete event flow."

5. **Service Connectivity**: "Before tests run, we verify all services (frontend, GraphQL, Express) are ready. Fail fast, not mid-test."

6. **Type Safety**: "End-to-end TypeScript—from test setup through API calls to assertions—catches bugs at compile time."

---

## Resources & Documentation

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Fixtures Documentation](https://playwright.dev/docs/test-fixtures)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

---

**Ready to implement? Start with Task 1: Install Playwright Dependencies**
