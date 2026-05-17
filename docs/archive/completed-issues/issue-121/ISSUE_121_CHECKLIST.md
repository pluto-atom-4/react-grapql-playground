# Test Implementation Checklist - Issue #121

**Project:** react-grapql-playground  
**Issue:** #121 JWT Authentication Integration Tests  
**Created:** April 21, 2026  

---

## PHASE 1: SETUP & INFRASTRUCTURE (5 hours)

### 1.1 Prepare Test Environment (1 hour)

**Objective:** Set up directories and configuration

- [ ] **1.1.1** Create frontend test directories
  - [ ] `frontend/__tests__/fixtures/`
  - [ ] `frontend/__tests__/helpers/`
  - [ ] `frontend/__tests__/integration/`
  - **Time:** 5 min
  - **Status:** ⚪ Not started

- [ ] **1.1.2** Create backend-graphql test directories
  - [ ] `backend-graphql/src/__tests__/fixtures/`
  - [ ] `backend-graphql/src/__tests__/helpers/`
  - **Time:** 5 min
  - **Status:** ⚪ Not started

- [ ] **1.1.3** Create frontend vitest setup file
  - [ ] File: `frontend/vitest.setup.ts`
  - [ ] Contains: Global mocks, localStorage setup
  - [ ] Contains: next/router mock, next/image mock
  - **Time:** 10 min
  - **Status:** ⚪ Not started
  - **Reference:** ISSUE_121_STRUCTURE.md § Frontend Vitest Setup

- [ ] **1.1.4** Update frontend vitest.config.ts
  - [ ] Add setupFiles: ['./vitest.setup.ts']
  - [ ] Add coverage configuration (≥90% threshold)
  - [ ] Add reporters: ['verbose']
  - **Time:** 10 min
  - **Status:** ⚪ Not started
  - **Reference:** ISSUE_121_STRUCTURE.md § Frontend Vitest Setup

- [ ] **1.1.5** Verify backend-graphql vitest config
  - [ ] Check `backend-graphql/vitest.config.ts` exists
  - [ ] Verify coverage is configured
  - [ ] Document any issues found
  - **Time:** 5 min
  - **Status:** ⚪ Not started

- [ ] **1.1.6** Verify GitHub Actions workflow
  - [ ] Check `.github/workflows/test.yml` or similar
  - [ ] Verify tests run on PR/push
  - [ ] Verify test results reported
  - [ ] Document any updates needed
  - **Time:** 10 min
  - **Status:** ⚪ Not started

**Deliverable:** Test directories and configuration files ready
**Verification:** Directories exist, configs syntactically correct

---

### 1.2 Create Test Fixtures (2.5 hours)

**Objective:** Build reusable test data

#### Frontend Fixtures

- [ ] **1.2.1** Create `frontend/__tests__/fixtures/users.ts`
  - [ ] Export validUsers array (3 test users)
  - [ ] Export invalidUsers array (invalid scenarios)
  - [ ] Export helper functions: getValidUser(), getInvalidUser()
  - **Time:** 20 min
  - **Status:** ⚪ Not started
  - **Reference:** ISSUE_121_STRUCTURE.md § users.ts

- [ ] **1.2.2** Create `frontend/__tests__/fixtures/graphql.ts`
  - [ ] Export LOGIN_MUTATION
  - [ ] Export LOGOUT_MUTATION
  - [ ] Export GET_BUILDS, GET_BUILD, GET_TEST_RUNS queries
  - [ ] Export mock response objects
  - **Time:** 30 min
  - **Status:** ⚪ Not started
  - **Reference:** ISSUE_121_STRUCTURE.md § graphql.ts

- [ ] **1.2.3** Create `frontend/__tests__/fixtures/mocks.ts`
  - [ ] Export createLoginSuccessMock() function
  - [ ] Export loginInvalidCredentialsMock
  - [ ] Export loginServerErrorMock
  - [ ] Export getBuildsSuccessMock
  - [ ] Export getBuildsUnauthorizedMock
  - [ ] Export createGetBuildsMock(), createGetBuildMock() helpers
  - **Time:** 40 min
  - **Status:** ⚪ Not started
  - **Reference:** ISSUE_121_STRUCTURE.md § mocks.ts

#### Backend-GraphQL Fixtures

- [ ] **1.2.4** Create `backend-graphql/src/__tests__/fixtures/tokens.ts`
  - [ ] Export tokenFixtures object (valid, expired, malformed, etc.)
  - [ ] Include: valid token, expired token, wrong secret, no user id, empty user id
  - **Time:** 20 min
  - **Status:** ⚪ Not started
  - **Reference:** ISSUE_121_STRUCTURE.md § tokens.ts

- [ ] **1.2.5** Create `backend-graphql/src/__tests__/fixtures/graphql.ts`
  - [ ] Export GraphQL schema fixtures (if applicable)
  - [ ] Export mutation/query fixtures for backend testing
  - **Time:** 15 min
  - **Status:** ⚪ Not started
  - **Reference:** ISSUE_121_STRUCTURE.md § backend fixtures

**Deliverable:** All fixture files created and syntax-verified
**Verification:** `pnpm build` passes, no TS errors

---

### 1.3 Create Test Helpers (1.5 hours)

**Objective:** Build test utility functions

#### Frontend Helpers

- [ ] **1.3.1** Create `frontend/__tests__/helpers/apollo-mock.ts`
  - [ ] Export createApolloWrapper() function
  - [ ] Export createAuthApolloWrapper() function
  - [ ] Both handle MockedProvider + AuthProvider wrapping
  - **Time:** 20 min
  - **Status:** ⚪ Not started
  - **Reference:** ISSUE_121_STRUCTURE.md § apollo-mock.ts

- [ ] **1.3.2** Create `frontend/__tests__/helpers/storage.ts`
  - [ ] Export createStorageMock() function
  - [ ] Export setupLocalStorageMock() function
  - [ ] Export helper functions: getTokenFromStorage(), setTokenInStorage(), etc.
  - **Time:** 20 min
  - **Status:** ⚪ Not started
  - **Reference:** ISSUE_121_STRUCTURE.md § storage.ts

- [ ] **1.3.3** Create `frontend/__tests__/helpers/auth.ts`
  - [ ] Export renderUseAuthHook() function
  - [ ] Export simulateLogin() helper
  - [ ] Export simulateLogout() helper
  - **Time:** 15 min
  - **Status:** ⚪ Not started
  - **Reference:** ISSUE_121_STRUCTURE.md § auth.ts

#### Backend-GraphQL Helpers

- [ ] **1.3.4** Create `backend-graphql/src/__tests__/helpers/jwt.ts`
  - [ ] Export createTestToken() function
  - [ ] Export createExpiredToken() function
  - [ ] Export createTokenWithWrongSecret() function
  - [ ] Export decodeToken(), verifyToken() functions
  - [ ] Export createBearerHeader() function
  - **Time:** 20 min
  - **Status:** ⚪ Not started
  - **Reference:** ISSUE_121_STRUCTURE.md § jwt.ts

- [ ] **1.3.5** Create `backend-graphql/src/__tests__/helpers/resolvers.ts`
  - [ ] Export createMockContext() function
  - [ ] Export createMockPrisma() function
  - [ ] Export createAuthenticatedContext() helper
  - [ ] Export createUnauthenticatedContext() helper
  - **Time:** 20 min
  - **Status:** ⚪ Not started
  - **Reference:** ISSUE_121_STRUCTURE.md § resolvers.ts

**Deliverable:** All helper files created and syntax-verified
**Verification:** `pnpm build` passes, helpers can be imported

---

### 1.4 Verify Existing Infrastructure (1.5 hours)

**Objective:** Baseline check and documentation

- [ ] **1.4.1** Run existing tests
  - **Command:** `pnpm test --run`
  - [ ] All tests pass ✅
  - [ ] No failures 🔴
  - [ ] Note: Any failures
  - **Time:** 10 min
  - **Status:** ⚪ Not started

- [ ] **1.4.2** Run TypeScript build
  - **Command:** `pnpm build`
  - [ ] Zero errors ✅
  - [ ] Zero warnings 🟡
  - [ ] Note: Any warnings
  - **Time:** 5 min
  - **Status:** ⚪ Not started

- [ ] **1.4.3** Check test coverage baseline
  - **Command:** `pnpm test --coverage`
  - [ ] Examine coverage report
  - [ ] Document baseline metrics:
    - Frontend auth coverage: ____%
    - Backend auth coverage: ____%
  - **Time:** 5 min
  - **Status:** ⚪ Not started

- [ ] **1.4.4** Verify Issue #120 complete
  - [ ] Login component exists and works
  - [ ] Login mutations properly mocked in existing tests
  - [ ] Token handling in context working
  - **Time:** 10 min
  - **Status:** ⚪ Not started

- [ ] **1.4.5** Check Apollo schema for login mutation
  - [ ] File: `backend-graphql/src/schema.graphql`
  - [ ] Verify login mutation defined
  - [ ] Verify returns token + user
  - [ ] Note any issues
  - **Time:** 5 min
  - **Status:** ⚪ Not started

- [ ] **1.4.6** Document blockers
  - [ ] List any blockers found
  - [ ] List any pre-existing test failures
  - [ ] Create GitHub issues if needed for blockers
  - **Time:** 10 min
  - **Status:** ⚪ Not started

**Deliverable:** Baseline infrastructure verified, blockers documented
**Verification:** All checks completed, results documented

---

## PHASE 2: CORE INTEGRATION TESTS (9.5 hours)

### 2.1 Implement Full Auth Flow Tests (4 hours)

**Objective:** Create 15 tests for complete authentication lifecycle

**File:** `frontend/__tests__/integration/full-auth-flow.test.tsx`

#### Test Cases to Implement

- [ ] **2.1.1** Test Case 1.1.1: Successful Login - Valid Credentials
  - [ ] User logs in with valid email/password
  - [ ] Token generated and returned
  - [ ] Token stored in localStorage
  - [ ] User redirected to /dashboard
  - [ ] Context updated with token
  - **Status:** ⚪ Not started
  - **Time:** 15 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 1.1.1

- [ ] **2.1.2** Test Case 1.1.2: Token Persists in Context
  - [ ] Token available immediately after login
  - [ ] Token persists across component re-renders
  - [ ] Token available to child components via useAuth
  - **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 1.1.2

- [ ] **2.1.3** Test Case 1.1.3: User Data Available After Login
  - [ ] User object returned from login
  - [ ] User ID available in context
  - [ ] User email available in context
  - **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **2.1.4** Test Case 1.1.4: Redirect After Successful Login
  - [ ] Router.push called with /dashboard
  - [ ] Redirect happens after mutation completes
  - **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **2.1.5** Test Case 1.1.5: Apollo Client Receives Token
  - [ ] Subsequent requests include Authorization header
  - [ ] Header format: Authorization: Bearer <token>
  - **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **2.1.6** Test Case 1.2.1: Token Restored from localStorage
  - [ ] Pre-populate localStorage with token
  - [ ] Mount AuthProvider
  - [ ] Verify token loaded on init
  - [ ] Verify token available in useAuth hook
  - **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 1.2.1

- [ ] **2.1.7** Test Case 1.2.2: Token Persists After Page Refresh
  - [ ] Login user
  - [ ] Simulate page reload/navigation
  - [ ] Verify token still available
  - **Status:** ⚪ Not started
  - **Time:** 15 min

- [ ] **2.1.8** Test Case 1.2.3: Multiple Navigations Preserve Token
  - [ ] Login user
  - [ ] Navigate to multiple pages (/builds, /builds/123)
  - [ ] Verify token available on each page
  - **Status:** ⚪ Not started
  - **Time:** 15 min

- [ ] **2.1.9** Test Case 1.3.1: Logout Clears Token from State
  - [ ] Login user
  - [ ] Call logout()
  - [ ] Verify token is null in context
  - [ ] Verify logout completes without error
  - **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 1.3.1

- [ ] **2.1.10** Test Case 1.3.2: Logout Removes from localStorage
  - [ ] Login user (token in localStorage)
  - [ ] Call logout()
  - [ ] Verify token removed from localStorage
  - [ ] Verify localStorage.getItem('auth_token') is null
  - **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 1.3.2

- [ ] **2.1.11** Test Case 1.3.3: Redirect to /login After Logout
  - [ ] Login user
  - [ ] Call logout()
  - [ ] Verify router.push called with /login
  - [ ] Verify redirect happens
  - **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 1.3.3

- [ ] **2.1.12** Test Case 1.3.4: Subsequent Requests Lack Auth Header
  - [ ] Login user
  - [ ] Call logout()
  - [ ] Make API request
  - [ ] Verify Authorization header not present
  - **Status:** ⚪ Not started
  - **Time:** 15 min

- [ ] **2.1.13** Test Case 1.4.1: Full Lifecycle - Login → Dashboard → Logout
  - [ ] Complete flow: login → access dashboard → logout
  - [ ] Verify each step succeeds
  - [ ] Verify no errors throughout
  - **Status:** ⚪ Not started
  - **Time:** 15 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 1.4.1

- [ ] **2.1.14** Test Case 1.4.2: Multiple Login/Logout Cycles
  - [ ] Login → Logout → Login → Logout
  - [ ] Verify consistency across cycles
  - **Status:** ⚪ Not started
  - **Time:** 15 min

- [ ] **2.1.15** Test Case 1.4.3: Token Changes on Re-login with Different User
  - [ ] Login as User A
  - [ ] Logout
  - [ ] Login as User B
  - [ ] Verify token changed
  - [ ] Verify different user ID in context
  - **Status:** ⚪ Not started
  - **Time:** 15 min

**Implementation Steps:**
1. Create file: `frontend/__tests__/integration/full-auth-flow.test.tsx`
2. Import dependencies (vitest, react testing library, fixtures, helpers)
3. Implement beforeEach/afterEach hooks (cleanup)
4. Implement each test case above
5. Run: `pnpm test full-auth-flow.test.tsx`
6. Verify: All 15 tests passing ✅

**Deliverable:** 15 passing tests in full-auth-flow.test.tsx
**Verification:** `pnpm test full-auth-flow.test.tsx --run` shows 15 passed

---

### 2.2 Implement Protected Routes Tests (3 hours)

**Objective:** Create 12 tests for route and query protection

**File:** `frontend/__tests__/integration/protected-routes.test.tsx`

#### Test Cases to Implement

- [ ] **2.2.1** Test Case 2.1.1: Redirect to /login without token from /dashboard
  - [ ] Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 2.1.1

- [ ] **2.2.2** Test Case 2.1.2: Redirect to /login without token from /builds
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **2.2.3** Test Case 2.1.3: Redirect to /login without token from /builds/:id
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 10 min

- [ ] **2.2.4** Test Case 2.1.4: Access all protected routes with valid token
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 15 min

- [ ] **2.2.5** Test Case 2.2.1: Query builds rejected without token
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 2.2.1

- [ ] **2.2.6** Test Case 2.2.2: Query build(id) rejected without token
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 10 min

- [ ] **2.2.7** Test Case 2.2.3: Query testRuns rejected without token
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 10 min

- [ ] **2.2.8** Test Case 2.2.4: Query builds accepted with valid token
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 10 min

- [ ] **2.2.9** Test Case 2.2.5: Query returns user-specific data only
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 15 min

- [ ] **2.2.10** Test Case 2.3.1: Valid token sent as Bearer header
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 15 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 2.3.1

- [ ] **2.2.11** Test Case 2.3.2: Missing Authorization header rejected
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 10 min

- [ ] **2.2.12** Test Case 2.3.3: Malformed Authorization header rejected
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 10 min

**Implementation Steps:**
1. Create file: `frontend/__tests__/integration/protected-routes.test.tsx`
2. Import dependencies and fixtures
3. Implement 12 test cases above
4. Run: `pnpm test protected-routes.test.tsx`
5. Verify: All 12 tests passing ✅

**Deliverable:** 12 passing tests in protected-routes.test.tsx
**Verification:** `pnpm test protected-routes.test.tsx --run` shows 12 passed

---

### 2.3 Implement Error Handling Tests (2.5 hours)

**Objective:** Create 10 tests for error scenarios

**File:** `frontend/__tests__/integration/auth-errors.test.tsx`

#### Test Cases to Implement

- [ ] **2.3.1** Test Case 3.1.1: Invalid Credentials - Wrong Password
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 3.1.1

- [ ] **2.3.2** Test Case 3.1.2: Invalid Credentials - Nonexistent Email
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **2.3.3** Test Case 3.1.3: Error Message Safe (no user existence leak)
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **2.3.4** Test Case 3.2.1: Expired Token → 401 → Redirect to /login
  - [ ] **Status:** ⚪ Not started
  - **Time:** 15 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 3.2.1

- [ ] **2.3.5** Test Case 3.2.2: Malformed Token → Error → Redirect
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **2.3.6** Test Case 3.2.3: Invalid Token Signature → 401 → Redirect
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 10 min

- [ ] **2.3.7** Test Case 3.2.4: Missing Token When Required → 401 → Redirect
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 10 min

- [ ] **2.3.8** Test Case 3.3.1: Server Error (500) - Display Error
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 3.3.1

- [ ] **2.3.9** Test Case 3.3.2: Network Timeout - Display Retry Option
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 15 min

- [ ] **2.3.10** Test Case 3.3.3: CORS Error - Display Error Message
  - [ ] **Status:** ⚪ Not started
  - [ ] **Time:** 10 min

**Implementation Steps:**
1. Create file: `frontend/__tests__/integration/auth-errors.test.tsx`
2. Import dependencies and error mocks
3. Implement 10 test cases above
4. Run: `pnpm test auth-errors.test.tsx`
5. Verify: All 10 tests passing ✅

**Deliverable:** 10 passing tests in auth-errors.test.tsx
**Verification:** `pnpm test auth-errors.test.tsx --run` shows 10 passed

---

### 2.4 Integration Tests Summary Check

- [ ] **2.4.1** All Phase 2 tests implemented
  - [ ] full-auth-flow.test.tsx: 15/15 tests ✅
  - [ ] protected-routes.test.tsx: 12/12 tests ✅
  - [ ] auth-errors.test.tsx: 10/10 tests ✅
  - **Total Phase 2:** 37 tests
  - **Time:** 5 min

- [ ] **2.4.2** Run full suite: `pnpm test --run`
  - [ ] All Phase 2 tests passing
  - [ ] Zero failures
  - [ ] Zero flaky tests
  - **Time:** 10 min

- [ ] **2.4.3** TypeScript verification
  - [ ] Run: `pnpm build`
  - [ ] Zero TS errors
  - [ ] All test files properly typed
  - **Time:** 5 min

**Milestone:** Phase 2 Complete - 37 tests passing ✅

---

## PHASE 3: ADVANCED TESTS (5.5 hours)

### 3.1 Implement Multi-User Tests (2 hours)

**Objective:** Create 7 tests for session isolation and multi-user scenarios

**File:** `frontend/__tests__/integration/multi-user.test.tsx`

#### Test Cases to Implement

- [ ] **3.1.1** Test Case 4.1.1: User A Logs In → User A Data in Context
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 4.1.1

- [ ] **3.1.2** Test Case 4.1.2: User B Logs In → User A Cleared → User B Data
  - [ ] **Status:** ⚪ Not started
  - **Time:** 15 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 4.1.2

- [ ] **3.1.3** Test Case 4.1.3: User A Queries Don't Return User B Data
  - [ ] **Status:** ⚪ Not started
  - **Time:** 20 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 4.1.3

- [ ] **3.1.4** Test Case 4.2.1: Two Browser Tabs → Independent Tokens
  - [ ] **Status:** ⚪ Not started
  - **Time:** 15 min

- [ ] **3.1.5** Test Case 4.2.2: Re-login in Tab A → Both Sessions Update
  - [ ] **Status:** ⚪ Not started
  - **Time:** 15 min

- [ ] **3.1.6** Test Case 4.3.1: Rapid Logout/Login Cycles → Consistency
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **3.1.7** Test Case 4.3.2: Token Change Mid-Request → Handled
  - [ ] **Status:** ⚪ Not started
  - **Time:** 15 min

**Implementation Steps:**
1. Create file: `frontend/__tests__/integration/multi-user.test.tsx`
2. Implement 7 test cases above
3. Run: `pnpm test multi-user.test.tsx`
4. Verify: All 7 tests passing ✅

**Deliverable:** 7 passing tests in multi-user.test.tsx
**Verification:** `pnpm test multi-user.test.tsx --run` shows 7 passed

---

### 3.2 Implement Token Management Backend Tests (2 hours)

**Objective:** Create 9 tests for token generation, validation, lifecycle

**File:** `backend-graphql/src/resolvers/__tests__/token-mgmt.test.ts`

#### Test Cases to Implement

- [ ] **3.2.1** Test Case 5.1.1: Login Mutation Generates Valid JWT
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 5.1.1

- [ ] **3.2.2** Test Case 5.1.2: Token Contains Correct User ID
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 5.1.2

- [ ] **3.2.3** Test Case 5.1.3: Token Has 24-Hour Expiration
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 5.1.3

- [ ] **3.2.4** Test Case 5.2.1: Valid Token Passes Middleware
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 5.2.1

- [ ] **3.2.5** Test Case 5.2.2: Expired Token Rejected with 401
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 5.2.2

- [ ] **3.2.6** Test Case 5.2.3: Invalid Signature Rejected with Error
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 5.2.3

- [ ] **3.2.7** Test Case 5.3.1: Re-login Generates New Token
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **3.2.8** Test Case 5.3.2: Old Token Still Valid Until Expiration
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **3.2.9** Test Case 5.3.3: Token Reuse Prevention (if implemented)
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min

**Implementation Steps:**
1. Create file: `backend-graphql/src/resolvers/__tests__/token-mgmt.test.ts`
2. Implement 9 test cases above
3. Run: `pnpm test:graphql token-mgmt.test.ts`
4. Verify: All 9 tests passing ✅

**Deliverable:** 9 passing tests in token-mgmt.test.ts
**Verification:** `pnpm test:graphql token-mgmt.test.ts --run` shows 9 passed

---

### 3.3 Implement Security & Edge Cases Tests (1.5 hours)

**Objective:** Create 8 tests for security best practices and edge cases

**File:** `frontend/__tests__/integration/security-edge-cases.test.tsx`

#### Test Cases to Implement

- [ ] **3.3.1** Test Case 6.1.1: Token Never Logged in Plain Text
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 6.1.1

- [ ] **3.3.2** Test Case 6.1.2: Token Not Exposed in URL Parameters
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 6.1.2

- [ ] **3.3.3** Test Case 6.2.1: Password Never Logged or Stored
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **3.3.4** Test Case 6.2.2: Password Field Cleared After Submit
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **3.3.5** Test Case 6.3.1: Login with Empty Email → Validation Error
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 6.3.1

- [ ] **3.3.6** Test Case 6.3.2: Login with 1000-char Email → Graceful Handling
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **3.3.7** Test Case 6.4.1: Double-Click Submit → Single Request Only
  - [ ] **Status:** ⚪ Not started
  - **Time:** 15 min
  - **Reference:** ISSUE_121_PLAN.md § Test Case 6.4.1

- [ ] **3.3.8** Test Case 6.4.2: Form Submission with Pending Request → Disabled
  - [ ] **Status:** ⚪ Not started
  - **Time:** 10 min

**Implementation Steps:**
1. Create file: `frontend/__tests__/integration/security-edge-cases.test.tsx`
2. Implement 8 test cases above
3. Run: `pnpm test security-edge-cases.test.tsx`
4. Verify: All 8 tests passing ✅

**Deliverable:** 8 passing tests in security-edge-cases.test.tsx
**Verification:** `pnpm test security-edge-cases.test.tsx --run` shows 8 passed

---

### 3.4 Advanced Tests Summary Check

- [ ] **3.4.1** All Phase 3 tests implemented
  - [ ] multi-user.test.tsx: 7/7 tests ✅
  - [ ] token-mgmt.test.ts: 9/9 tests ✅
  - [ ] security-edge-cases.test.tsx: 8/8 tests ✅
  - **Total Phase 3:** 24 tests
  - **Time:** 5 min

- [ ] **3.4.2** Run full suite: `pnpm test --run`
  - [ ] All Phase 3 tests passing
  - [ ] Combined with Phase 2: 61 tests passing
  - **Time:** 10 min

**Milestone:** Phase 3 Complete - 24 new tests + 37 Phase 2 = 61 total ✅

---

## PHASE 4: VERIFICATION & REPORTING (3 hours)

### 4.1 Comprehensive Test Run (1 hour)

- [ ] **4.1.1** Run all tests
  - **Command:** `pnpm test --run`
  - [ ] Expected: 61 new tests passing
  - [ ] Plus existing tests (expect 30-50+)
  - [ ] Total: 90+ tests passing ✅
  - **Status:** ⚪ Not started
  - **Time:** 15 min

- [ ] **4.1.2** Generate coverage report
  - **Command:** `pnpm test --coverage`
  - [ ] Document coverage percentages:
    - Statements: ____% (target: ≥90%)
    - Branches: ____% (target: ≥90%)
    - Functions: ____% (target: ≥90%)
    - Lines: ____% (target: ≥90%)
  - **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **4.1.3** TypeScript build verification
  - **Command:** `pnpm build`
  - [ ] Zero errors ✅
  - [ ] Zero warnings 🟡
  - [ ] All files compile successfully
  - **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **4.1.4** Linting verification
  - **Command:** `pnpm lint`
  - [ ] Zero errors
  - [ ] Zero warnings (or document any)
  - [ ] Code formatting correct
  - **Status:** ⚪ Not started
  - **Time:** 5 min

**Deliverable:** All tests passing, coverage ≥90%, zero TS/lint errors
**Verification:** Full report generated

---

### 4.2 Performance & Flakiness Testing (1 hour)

- [ ] **4.2.1** Run tests 3 times consecutively
  - **Command:** `pnpm test --run` (x3)
  - [ ] Run 1: All passing ✅
  - [ ] Run 2: All passing ✅
  - [ ] Run 3: All passing ✅
  - [ ] No flaky tests detected
  - **Status:** ⚪ Not started
  - **Time:** 15 min

- [ ] **4.2.2** Measure test execution time
  - [ ] Total time per run: ___ seconds
  - [ ] Target: < 120 seconds
  - [ ] Document slowest tests (if > 5 sec each)
  - **Status:** ⚪ Not started
  - **Time:** 5 min

- [ ] **4.2.3** Check for console warnings/errors
  - [ ] Run tests with full output
  - [ ] Review stderr for warnings
  - [ ] Document any unexpected console output
  - [ ] Target: Zero unexpected output
  - **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **4.2.4** Memory usage check
  - [ ] Monitor memory during test run
  - [ ] Check for memory leaks
  - [ ] Verify cleanup functions run
  - [ ] Document any issues
  - **Status:** ⚪ Not started
  - **Time:** 10 min

**Deliverable:** Performance metrics, flakiness report, console output log
**Verification:** All checks passed, metrics documented

---

### 4.3 Acceptance Criteria Verification (1 hour)

- [ ] **4.3.1** Verify Issue #27 Criteria Coverage
  - [ ] AC1: Successful login generates JWT - ✅ Test Case 5.1.1
  - [ ] AC2: Token stored in localStorage - ✅ Test Case 1.2.1
  - [ ] AC3: Apollo injects Bearer token - ✅ Test Case 2.3.1
  - [ ] AC4: Backend validates JWT - ✅ Existing tests + 5.2.1
  - [ ] AC5: Invalid token rejected (401) - ✅ Test Cases 3.2.x
  - [ ] AC6: Logout clears token - ✅ Test Cases 1.3.x
  - [ ] AC7: Protected resolvers require auth - ✅ Existing tests + 2.1.x
  - [ ] AC8: User context in resolvers - ✅ Existing tests
  - [ ] AC9: Session persists across refresh - ✅ Test Case 1.2.2
  - [ ] AC10: Multi-user data isolation - ✅ Test Case 4.1.3
  - [ ] AC11: Error scenarios handled - ✅ Test Suite 3
  - **Status:** ⚪ Not started
  - **Time:** 15 min

- [ ] **4.3.2** Verify Issue #121 Criteria Coverage
  - [ ] AC1: All 11 criteria from #27 verified - ✅ (see above)
  - [ ] AC2: E2E login flow test - ✅ Test Cases 1.1.x, 1.4.1
  - [ ] AC3: E2E logout flow test - ✅ Test Cases 1.3.x
  - [ ] AC4: Protected queries test - ✅ Test Suite 2
  - [ ] AC5: Auth middleware validation test - ✅ Test Cases 5.2.x
  - [ ] AC6: AuthContext tests - ✅ Test Cases 1.2.x, 1.3.x
  - [ ] AC7: All tests passing - ✅ Verified in 4.1.1
  - [ ] AC8: No TypeScript errors - ✅ Verified in 4.1.3
  - **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **4.3.3** Create Traceability Matrix
  - [ ] Document test file → criterion mapping
  - [ ] Create TEST_COVERAGE_MATRIX.md file
  - [ ] Include test case numbers, file paths, criteria
  - **Status:** ⚪ Not started
  - **Time:** 15 min

- [ ] **4.3.4** Generate Final Report
  - [ ] Create TEST_REPORT_ISSUE_121.md
  - [ ] Include:
    - Summary of work completed
    - Test statistics (61 new tests created)
    - Coverage metrics
    - Performance metrics
    - Issues resolved/remaining
  - **Status:** ⚪ Not started
  - **Time:** 10 min

**Deliverable:** Acceptance Criteria verified, traceability matrix, final report
**Verification:** All 11+8 criteria covered, report signed off

---

## PHASE 5: CI/CD INTEGRATION (1 hour)

### 5.1 GitHub Actions Integration

- [ ] **5.1.1** Verify GitHub Actions test workflow
  - [ ] Check `.github/workflows/test.yml` exists
  - [ ] Verify tests run on PR/push
  - [ ] Verify all test packages included (frontend, graphql, express)
  - **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **5.1.2** Update workflow if needed
  - [ ] Add coverage report step (if missing)
  - [ ] Add coverage threshold check (≥90%)
  - [ ] Add TypeScript build verification
  - **Status:** ⚪ Not started
  - **Time:** 10 min

- [ ] **5.1.3** Test PR workflow end-to-end
  - [ ] Create test PR with dummy change
  - [ ] Verify tests run automatically
  - [ ] Verify results reported on PR
  - [ ] Verify pass/fail status displayed
  - **Status:** ⚪ Not started
  - **Time:** 15 min

- [ ] **5.1.4** Configure branch protection
  - [ ] Require all tests passing before merge
  - [ ] Require minimum coverage (90%)
  - [ ] Require TypeScript build success
  - [ ] Document policy
  - **Status:** ⚪ Not started
  - **Time:** 15 min

- [ ] **5.1.5** Merge feature branch
  - [ ] Create PR with all test files
  - [ ] Pass code review
  - [ ] Pass all CI checks
  - [ ] Merge to main branch
  - **Status:** ⚪ Not started
  - **Time:** 10 min

**Deliverable:** CI/CD integration complete, tests run automatically on PR
**Verification:** Test workflow passing on main branch

---

## POST-IMPLEMENTATION CHECKLIST

- [ ] **5.2.1** All deliverables created
  - [ ] ISSUE_121_PLAN.md ✅
  - [ ] ISSUE_121_STRUCTURE.md ✅
  - [ ] TEST_COVERAGE_MATRIX.md (to create)
  - [ ] TEST_REPORT_ISSUE_121.md (to create)
  - [ ] 61 new test files/cases
  - [ ] All fixture and helper files

- [ ] **5.2.2** Documentation complete
  - [ ] Test plan reviewed and approved
  - [ ] Test cases documented with expected results
  - [ ] Fixtures and helpers documented
  - [ ] Execution strategy clear to team

- [ ] **5.2.3** Code review passed
  - [ ] All tests reviewed for quality
  - [ ] Naming conventions followed
  - [ ] Code style consistent
  - [ ] No technical debt introduced

- [ ] **5.2.4** Tests verified on CI
  - [ ] GitHub Actions passing
  - [ ] Coverage metrics met
  - [ ] Performance acceptable
  - [ ] No flaky tests

- [ ] **5.2.5** Issue #121 closed
  - [ ] All acceptance criteria met ✅
  - [ ] PR merged to main
  - [ ] Close GitHub issue
  - [ ] Celebrate! 🎉

---

## SUMMARY

**Total Tests Created:** 61  
**Total Effort:** 24 hours  
**Timeline:** 2 weeks (Week 1: Phase 1-2, Week 2: Phase 3-5)  
**Team:** 1 Senior Engineer + QA reviews

**Key Milestones:**
- ✅ Phase 1 Complete: Infrastructure ready
- ✅ Phase 2 Complete: 37 core tests passing
- ✅ Phase 3 Complete: 24 advanced tests passing
- ✅ Phase 4 Complete: All criteria verified, coverage ≥90%
- ✅ Phase 5 Complete: CI/CD integrated
- ✅ Issue #121 Complete: Ready for production

---

**Document Version:** 1.0  
**Created:** April 21, 2026  
**Status:** Ready for Implementation ✅
