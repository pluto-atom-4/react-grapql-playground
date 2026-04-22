# Issue #142 Quick Reference: E2E Tests with Playwright

## 🎯 One-Liner
Add Playwright E2E tests for 6 critical workflows (authentication, build CRUD, test runs, real-time SSE, file uploads, error handling) covering 25 test cases across 3 hours.

## 📊 Quick Stats
- **Tests**: 25 E2E tests across 6 test suites
- **Effort**: 3 hours (Phase 1: 30min, Phase 2: 60min, Phase 3: 90min)
- **Coverage**: 6 critical workflows end-to-end
- **Framework**: Playwright (Chromium headless)
- **Structure**: Fixtures + Page Objects + Helper Utilities

## 🚀 Phase Breakdown

### Phase 1: Setup (30 min)
```bash
# Install & configure
pnpm add -D @playwright/test @types/node
npx playwright install chromium

# Create structure
mkdir -p frontend/e2e/{fixtures,pages,tests,helpers}

# Files to create:
- frontend/playwright.config.ts
- frontend/e2e/fixtures/base.fixture.ts
- frontend/e2e/pages/BasePage.ts
- frontend/e2e/pages/LoginPage.ts
- frontend/e2e/pages/DashboardPage.ts
- frontend/e2e/helpers/wait-helpers.ts
```

### Phase 2: Auth & Dashboard (60 min)
```
01-authentication.spec.ts: 5 tests
├─ Login with valid credentials
├─ Login with invalid credentials
├─ Token persistence across reloads
├─ Logout functionality
└─ Protected route redirect

02-dashboard.spec.ts: 4 tests
├─ Build list display
├─ Search functionality
├─ Build detail navigation
└─ Loading states
```

### Phase 3: Build Operations (90 min)
```
03-build-operations.spec.ts: 5 tests
├─ Create build
├─ Update status
├─ Delete build
├─ Detail view

04-test-runs.spec.ts: 4 tests
├─ Submit test run with file
├─ Download test report
├─ List test runs
└─ Invalid submission handling

05-real-time.spec.ts: 3 tests
├─ Real-time status updates (SSE)
├─ Status badge updates
└─ Multi-user notifications

06-error-scenarios.spec.ts: 6 tests
├─ Network errors
├─ 404 handling
├─ File upload errors
├─ Race conditions
├─ Form validation
└─ Permission denied
```

## 🛠️ Key Fixtures

```typescript
// 1. Auth Fixture - Automatically login user
authenticatedPage: async ({ page, loginPage, testUser }, use) => {
  await loginPage.login(testUser.email, testUser.password);
  await page.waitForURL('**/dashboard');
  await use(page);
}

// 2. API Fixture - Direct GraphQL/Express calls
graphqlRequest: async (query, variables) => {
  const response = await fetch('http://localhost:4000/graphql', {...});
  return response.json();
}

// 3. Combined Fixture - Both auth + API
export const test = authTest.extend(apiTest);
```

## 📖 Page Objects (UI Abstraction)

```typescript
// LoginPage - encapsulates login selectors
class LoginPage {
  async login(email, password) { ... }
  async getErrorMessage() { ... }
}

// DashboardPage - encapsulates dashboard selectors
class DashboardPage {
  async getBuildCount() { ... }
  async getBuildByName(name) { ... }
  async clickCreateBuild() { ... }
}

// BasePage - common UI interactions
class BasePage {
  async goto(path) { ... }
  async click(selector) { ... }
  async fill(selector, text) { ... }
}
```

## 🧪 Running Tests

```bash
# Local headed mode (see browser)
pnpm e2e:headed

# Headless (CI mode)
pnpm e2e

# Debug mode (step through)
pnpm e2e:debug

# Single test file
pnpm e2e frontend/e2e/tests/01-authentication.spec.ts

# Specific test
pnpm e2e --grep "user can login"

# View HTML report
pnpm e2e:report
```

## ⚙️ Configuration Highlights

```typescript
// playwright.config.ts
{
  baseURL: 'http://localhost:3000',
  timeout: 30_000,              // 30s per test
  expect: { timeout: 10_000 },  // 10s per assertion
  trace: 'on-first-retry',      // Failure trace
  screenshot: 'only-on-failure',// Screenshot on error
  video: 'retain-on-failure',   // Video on error
  retries: process.env.CI ? 2 : 0,
  fullyParallel: false,         // Sequential (safe with shared backend)
}
```

## 📋 Pre-requisites

```bash
# 1. Start services
pnpm dev
# This starts: Frontend (3000), GraphQL (4000), Express (5000)

# 2. Seed database
pnpm seed

# 3. Verify health
curl http://localhost:3000
curl http://localhost:4000/graphql
curl http://localhost:5000
```

## ✅ Success Criteria

- [ ] All 25 tests pass locally
- [ ] Tests pass in CI/CD (`pnpm e2e` exit 0)
- [ ] Failure artifacts captured (screenshots, videos)
- [ ] GitHub Actions workflow integrated
- [ ] Documentation complete
- [ ] No timeout errors or flakiness
- [ ] Real-time SSE tests pass reliably

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `lsof -i :3000` then `kill -9 <PID>` |
| Tests timeout | Increase timeout in config or use explicit waits |
| SSE events fail | Use `page.evaluate()` to listen for EventSource |
| File upload fails | Verify file exists, use retry loop |
| Services not running | `pnpm dev` in another terminal |

## 📚 Key Files

| File | Purpose |
|------|---------|
| `frontend/playwright.config.ts` | Main configuration |
| `frontend/e2e/fixtures/base.fixture.ts` | Auth + API fixtures |
| `frontend/e2e/pages/LoginPage.ts` | Login UI abstraction |
| `frontend/e2e/pages/DashboardPage.ts` | Dashboard UI abstraction |
| `frontend/e2e/tests/01-authentication.spec.ts` | Auth tests (5) |
| `frontend/e2e/tests/02-dashboard.spec.ts` | Dashboard tests (4) |
| `frontend/e2e/tests/03-build-operations.spec.ts` | CRUD tests (5) |
| `frontend/e2e/tests/04-test-runs.spec.ts` | Test run tests (4) |
| `frontend/e2e/tests/05-real-time.spec.ts` | Real-time tests (3) |
| `frontend/e2e/tests/06-error-scenarios.spec.ts` | Error tests (6) |
| `.github/workflows/e2e.yml` | CI/CD workflow |

## 🎓 Interview Points

1. **Full-stack verification**: "E2E tests verify the entire workflow works end-to-end—from browser to GraphQL to real-time events."

2. **Service coordination**: "Managing three independent services requires fixtures for health checks and atomic test setup."

3. **Real-time challenges**: "SSE events need explicit waits in `page.evaluate()` since they're asynchronous."

4. **Failure debugging**: "Playwright captures traces, screenshots, and videos automatically—crucial for CI/CD debugging."

5. **Test patterns**: "Fixtures abstract common setup (login, API calls). Page objects encapsulate selectors. This keeps tests DRY."

## 🔗 Related Documents

- **Full Plan**: `ISSUE_142_IMPLEMENTATION_PLAN.md` (1,739 lines)
- **Phase Testing**: `ISSUE_141_IMPLEMENTATION_PLAN.md` (Empty test replacement)
- **Test Isolation**: `ISSUE_144_IMPLEMENTATION_PLAN.md` (Parallel execution)

## 📅 Timeline

```
Start → Phase 1 (30min) → Phase 2 (60min) → Phase 3 (90min) → Done
                                                               3 hours
```

## 🚀 Next Steps

1. Read full plan: `ISSUE_142_IMPLEMENTATION_PLAN.md`
2. Install Playwright: `pnpm add -D @playwright/test`
3. Create folder structure: `mkdir -p frontend/e2e/{fixtures,pages,tests,helpers}`
4. Implement Phase 1 (config + fixtures)
5. Implement Phase 2 (auth + dashboard)
6. Implement Phase 3 (build ops + real-time + errors)
7. Verify: `pnpm e2e` (exit 0)
8. Merge with artifacts and documentation

---

**Reference**: Issue #142 - E2E Tests with Playwright  
**Type**: Implementation Planning  
**Status**: Ready for Development  
