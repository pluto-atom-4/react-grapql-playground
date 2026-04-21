# TEST PLAN: Issue #121 - JWT Authentication Integration Tests

**Project:** react-grapql-playground  
**Issue:** #121 Subtask 4: Integration Testing & End-to-End Validation  
**Type:** Integration Testing  
**Status:** Ready to Start (Issue #120 Complete ✅)  
**Last Updated:** April 21, 2026

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Issue #121 Overview](#issue-121-overview)
3. [Acceptance Criteria Analysis](#acceptance-criteria-analysis)
4. [Existing Test Infrastructure](#existing-test-infrastructure)
5. [Test Suite Breakdown](#test-suite-breakdown)
6. [Detailed Test Cases](#detailed-test-cases)
7. [Test Data & Fixtures](#test-data--fixtures)
8. [Mock Setup & Helpers](#mock-setup--helpers)
9. [Execution Strategy](#execution-strategy)
10. [Dependencies & Blockers](#dependencies--blockers)
11. [Success Criteria](#success-criteria)
12. [Effort Estimate & Timeline](#effort-estimate--timeline)
13. [References](#references)

---

## EXECUTIVE SUMMARY

### Scope

This test plan provides comprehensive coverage for **Issue #121**: JWT Authentication Integration Tests. The scope encompasses:

- **Frontend Integration Tests**: Authentication flow, protected routes, token persistence
- **Backend GraphQL Tests**: Auth middleware validation, protected resolvers, token generation
- **End-to-End Tests**: Full login/logout flows, session management, error handling
- **Security Tests**: Token exposure prevention, password security, data isolation

### Current State (Baseline)

| Metric | Status |
|--------|--------|
| Unit Tests for Auth | ✅ 32 tests (auth middleware + resolver guards) |
| Integration Tests | 🟡 Partial (Event Bus integration exists) |
| E2E Tests | ❌ Not yet implemented |
| Coverage (Auth Code) | ~75% (middleware + resolver) |
| Test Framework | Vitest (configured for frontend, backend-graphql, backend-express) |
| CI/CD Integration | ✅ GitHub Actions (AI code review enabled) |

### Planned Additions

| Category | Tests | Files | Effort |
|----------|-------|-------|--------|
| Full Auth Flow | 15 | frontend/__tests__/integration/full-auth-flow.test.tsx | 4 hrs |
| Protected Routes | 12 | frontend/__tests__/integration/protected-routes.test.tsx | 3 hrs |
| Error Handling | 10 | frontend/__tests__/integration/auth-errors.test.tsx | 2.5 hrs |
| Multi-User Scenarios | 7 | frontend/__tests__/integration/multi-user.test.tsx | 2 hrs |
| Token Management | 9 | backend-graphql/src/resolvers/__tests__/token-mgmt.test.ts | 2 hrs |
| Security & Edge Cases | 8 | frontend/__tests__/integration/security-edge-cases.test.tsx | 2 hrs |
| **TOTAL** | **61 new tests** | **6 new files** | **15.5 hrs** |

### Success Metrics

- ✅ **100% pass rate** for all new integration tests
- ✅ **≥90% code coverage** for authentication-related code
- ✅ **All 11 acceptance criteria from Issue #27** verified by tests
- ✅ **Test execution time** < 120 seconds for full suite
- ✅ **Zero flaky tests** (consistent results across 3 runs)
- ✅ **Full TypeScript coverage** (no type errors in tests)

---

## ISSUE #121 OVERVIEW

### Issue Details

**GitHub Issue:** https://github.com/pluto-atom-4/react-grapql-playground/issues/121  
**Title:** #27 Subtask 4: Integration Testing & End-to-End Validation  
**Parent Issue:** #27 (JWT Authentication Complete)  
**Effort:** 30 minutes (estimated, actual: TBD)  
**Priority:** FOURTH (after #120)  
**Dependencies:**
- ✅ #118: Backend JWT Middleware (DONE)
- ✅ #119: Frontend Auth Context & Apollo Link (DONE)
- ✅ #120: Frontend Login Component & User Flow (DONE)

### What This Issue Does

End-to-end testing to verify:
1. All 11 acceptance criteria from parent issue #27 are met
2. All layers work together seamlessly
3. Login flow: unauthenticated → login → dashboard → protected queries
4. Logout flow: dashboard → logout → login redirect
5. Protected queries require valid JWT, reject without

### Key Integration Points

```
Frontend (Next.js + React + Apollo Client)
    ├─ Login Component (Issue #120) ← Sends credentials
    ├─ Auth Context (Issue #119) ← Manages token storage
    ├─ Apollo Link (Issue #119) ← Injects Bearer token header
    └─ Protected Components ← Require valid token
         │
         ↓
    GraphQL Server (Apollo + Express)
         │
         ├─ Auth Middleware (Issue #118) ← Validates JWT
         │  └─ extractUserFromToken() with Bearer scheme
         │
         ├─ Query Resolvers
         │  └─ Require context.user (auth guard)
         │
         ├─ Mutation Resolvers
         │  ├─ login() → Generates JWT token
         │  ├─ logout() → Clears session (if stateful)
         │  └─ Other mutations → Auth required
         │
         └─ Event Bus
            └─ Emits events to Express on mutations
              │
              ↓
           Express Server
              │
              └─ SSE Stream (/events)
                 └─ Real-time notifications to frontend
```

---

## ACCEPTANCE CRITERIA ANALYSIS

### From Issue #121 (Direct)

- [ ] **AC1**: All 11 acceptance criteria from #27 verified
- [ ] **AC2**: E2E test: login flow (unauthenticated → login → dashboard)
- [ ] **AC3**: E2E test: logout flow (dashboard → logout → login redirect)
- [ ] **AC4**: E2E test: protected queries (require JWT, reject without)
- [ ] **AC5**: GraphQL tests: auth middleware validates token
- [ ] **AC6**: Frontend tests: AuthContext persists/clears correctly
- [ ] **AC7**: All tests passing (`pnpm test`)
- [ ] **AC8**: No TypeScript errors (`pnpm build`)

### From Issue #27 (Referenced - 11 Criteria)

1. [ ] **#27 AC1**: Successful login generates JWT token
   - **Test Coverage:** Token generation tests in mutation resolver suite
   - **File:** backend-graphql/src/resolvers/__tests__/token-mgmt.test.ts
   - **Tests:** 3 (valid creds, invalid creds, token format)

2. [ ] **#27 AC2**: Token stored in localStorage on client
   - **Test Coverage:** Auth context persistence tests
   - **File:** frontend/__tests__/integration/full-auth-flow.test.tsx
   - **Tests:** 2 (initial storage, persistence across reload)

3. [ ] **#27 AC3**: Apollo Client injects Bearer token in requests
   - **Test Coverage:** Apollo Link injection tests
   - **File:** frontend/__tests__/integration/full-auth-flow.test.tsx
   - **Tests:** 2 (with token, without token)

4. [ ] **#27 AC4**: Backend validates JWT signature and expiration
   - **Test Coverage:** Auth middleware validation tests (existing: 18 tests)
   - **File:** backend-graphql/src/middleware/__tests__/auth.test.ts ✅
   - **Tests:** 18 (covered in existing auth.test.ts)

5. [ ] **#27 AC5**: Invalid token rejected with 401
   - **Test Coverage:** Error handling tests
   - **File:** frontend/__tests__/integration/auth-errors.test.tsx
   - **Tests:** 3 (invalid token, expired token, malformed token)

6. [ ] **#27 AC6**: Logout clears token and localStorage
   - **Test Coverage:** Logout flow tests
   - **File:** frontend/__tests__/integration/full-auth-flow.test.tsx
   - **Tests:** 3 (clear token, clear localStorage, redirect)

7. [ ] **#27 AC7**: Protected resolvers require authentication
   - **Test Coverage:** Resolver auth guard tests (existing: 14 tests)
   - **File:** backend-graphql/src/resolvers/__tests__/auth-check.test.ts ✅
   - **Tests:** 14 (covered in existing auth-check.test.ts)

8. [ ] **#27 AC8**: User context available in resolvers
   - **Test Coverage:** Context user field tests (existing: 3 tests)
   - **File:** backend-graphql/src/resolvers/__tests__/auth-check.test.ts ✅
   - **Tests:** 3 (covered in existing auth-check.test.ts)

9. [ ] **#27 AC9**: Session persists across page refresh
   - **Test Coverage:** Session persistence tests
   - **File:** frontend/__tests__/integration/full-auth-flow.test.tsx
   - **Tests:** 2 (localStorage persistence, token restoration)

10. [ ] **#27 AC10**: Multiple users have isolated sessions
    - **Test Coverage:** Multi-user session isolation tests
    - **File:** frontend/__tests__/integration/multi-user.test.tsx
    - **Tests:** 3 (different tokens, data isolation, concurrent logins)

11. [ ] **#27 AC11**: Error scenarios handled gracefully
    - **Test Coverage:** Error handling tests
    - **File:** frontend/__tests__/integration/auth-errors.test.tsx
    - **Tests:** 7 (401, 500, network error, timeout, malformed token, etc.)

### Test Coverage Mapping

| Criterion | Priority | Status | Test Files | Test Count |
|-----------|----------|--------|------------|-----------|
| AC1-AC2 | HIGH | NEW | full-auth-flow.test.tsx | 15 |
| AC3-AC4 | HIGH | EXISTING ✅ | apollo-wrapper, auth.test.ts | 18 |
| AC5-AC7 | HIGH | NEW | auth-errors.test.tsx | 10 |
| AC8-AC9 | HIGH | EXISTING ✅ | auth-check.test.ts | 3 |
| AC10-AC11 | MEDIUM | NEW | multi-user.test.tsx, security.test.tsx | 15 |

---

## EXISTING TEST INFRASTRUCTURE

### Test Framework Configuration

#### Frontend (Vitest + React Testing Library)

**File:** `frontend/vitest.config.ts`

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',  // Lightweight DOM implementation
    globals: true,              // Global test functions (describe, it, expect)
    setupFiles: [],             // No setup files yet - ADD auth test fixtures
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './') }
  },
});
```

**Current Setup:**
- ✅ happy-dom environment (good for unit/integration tests)
- ✅ Global test functions enabled
- ❌ No setup files (need to add: mock providers, fixtures)
- ❌ No coverage reporters configured

**Recommended Additions:**
```typescript
setupFiles: [
  './vitest.setup.ts'  // New: global test setup
],
coverage: {
  reporter: ['text', 'json', 'html'],
  include: ['lib/**', 'components/**', 'app/**'],
  exclude: ['node_modules', '__tests__', 'dist']
},
reporters: ['verbose']
```

#### Backend GraphQL (Vitest + Node)

**File:** `backend-graphql/src/vitest.config.ts` (if exists) or inherited from root

**Current Setup:**
- ✅ Node test environment
- ✅ Tests for middleware and resolvers exist
- ✅ Prisma mock available

**Test Files Present:**
1. `backend-graphql/src/middleware/__tests__/auth.test.ts` (18 tests) ✅
2. `backend-graphql/src/resolvers/__tests__/auth-check.test.ts` (14 tests) ✅
3. `backend-graphql/src/resolvers/__tests__/Mutation.integration.test.ts` (8 tests)
4. `backend-graphql/src/services/__tests__/event-bus.test.ts` (7 tests)

#### Backend Express (Vitest + Supertest)

**File:** `backend-express/__tests__/`

**Current Setup:**
- ✅ Supertest for HTTP assertions
- ✅ Happy-dom environment
- ✅ Tests for routes: upload, webhooks, events

### Existing Auth-Related Tests

#### Unit Tests (Already Passing ✅)

1. **Auth Middleware Tests** (18 tests)
   - Location: `backend-graphql/src/middleware/__tests__/auth.test.ts`
   - Covers: Token extraction, validation, expiration, error handling
   - Status: ✅ PASSING

2. **Resolver Auth Guard Tests** (14 tests)
   - Location: `backend-graphql/src/resolvers/__tests__/auth-check.test.ts`
   - Covers: Protected resolvers reject unauthenticated requests
   - Status: ✅ PASSING

3. **Apollo Wrapper Tests** (partial)
   - Location: `frontend/__tests__/apollo-wrapper.test.tsx`
   - Covers: Apollo client singleton pattern
   - Status: ✅ PASSING (but minimal auth coverage)

#### Test Helpers & Utilities Available

```typescript
// backend-graphql/src/middleware/auth.ts
export function generateToken(userId: string): string
export function extractUserFromToken(authHeader: string | string[] | undefined): User | null

// frontend/lib/auth-context.tsx
export function useAuth(): AuthContextType
export interface AuthContextType {
  token: string | null
  login: (token: string) => void
  logout: () => void
}
```

### Mock Setup Available

#### Apollo MockedProvider

**Location:** `frontend/__tests__/apollo-wrapper.test.tsx`

**Current Usage:**
```typescript
import { MockedProvider } from '@apollo/client/testing';
// Provides mocked GraphQL queries/mutations
```

**Needed for Tests:**
- ✅ Already configured and working
- ❌ No login mutation mock yet (Issue #120 added this)
- ✅ DataLoader mocks available

#### Prisma Client Mock

**Location:** `backend-graphql/src/resolvers/__tests__/auth-check.test.ts`

**Current Usage:**
```typescript
mockPrisma = {
  build: { create: async () => {...}, findMany: async () => [] },
  part: { create: async () => {...} },
  testRun: { create: async () => {...}, findMany: async () => [] }
} as unknown as PrismaClient;
```

**Status:** ✅ Mock setup pattern established

#### Event Bus Mocks

**Location:** `backend-graphql/src/resolvers/__tests__/Mutation.integration.test.ts`

**Current Usage:**
```typescript
vi.spyOn(eventBus, 'emit').mockImplementation(async () => {
  // Mock implementation
});
```

**Status:** ✅ Spy pattern established

### Test Execution

#### Run All Tests
```bash
pnpm test              # Run all tests (all packages)
pnpm test --run        # Run without watch mode
pnpm test --watch      # Watch mode (auto-rerun)
```

#### Run Specific Suite
```bash
pnpm test:frontend              # Frontend tests only
pnpm test:graphql               # Backend GraphQL tests only
pnpm test:express               # Backend Express tests only
pnpm test path/to/test.test.ts  # Single test file
```

#### Coverage Report
```bash
pnpm test --coverage
```

**Current Status:**
```
✅ All existing tests passing (50+ tests)
✅ Test infrastructure working
❌ Coverage reporting not configured
❌ Integration test suite for auth flow missing
```

---

## TEST SUITE BREAKDOWN

### Suite 1: Full Authentication Flow (15 tests, 4 hours)

**Purpose:** Verify complete login/logout lifecycle with token management

**Location:** `frontend/__tests__/integration/full-auth-flow.test.tsx`

**Categories:**

#### 1.1: Successful Login Flow (5 tests)
- [ ] Test 1.1.1: User enters valid credentials → token generated → stored in localStorage
- [ ] Test 1.1.2: Token persists in state after login
- [ ] Test 1.1.3: User data available in context after login
- [ ] Test 1.1.4: Redirect to dashboard after successful login
- [ ] Test 1.1.5: Apollo Client receives token in subsequent requests

#### 1.2: Token Persistence (3 tests)
- [ ] Test 1.2.1: Token restored from localStorage on app load
- [ ] Test 1.2.2: Token remains available after page refresh
- [ ] Test 1.2.3: Multiple page navigations preserve token

#### 1.3: Logout Flow (4 tests)
- [ ] Test 1.3.1: Logout clears token from state
- [ ] Test 1.3.2: Logout removes token from localStorage
- [ ] Test 1.3.3: Redirect to /login after logout
- [ ] Test 1.3.4: Subsequent requests lack authentication header

#### 1.4: Session Lifecycle (3 tests)
- [ ] Test 1.4.1: Login → dashboard access → logout → login redirect sequence
- [ ] Test 1.4.2: Multiple login/logout cycles work correctly
- [ ] Test 1.4.3: Token changes on re-login with different user

**Test Execution Time:** ~20 minutes
**Prerequisites:** Apollo MockedProvider configured, login mutation mocked
**Success Criteria:** All 15 tests pass with no flakiness

---

### Suite 2: Protected Routes & Query Access (12 tests, 3 hours)

**Purpose:** Verify authorization enforcement for GraphQL queries and frontend routes

**Location:** `frontend/__tests__/integration/protected-routes.test.tsx`

**Categories:**

#### 2.1: Route Protection (4 tests)
- [ ] Test 2.1.1: Without token → redirect to /login from /dashboard
- [ ] Test 2.1.2: Without token → redirect to /login from /builds
- [ ] Test 2.1.3: Without token → redirect to /login from /builds/:id
- [ ] Test 2.1.4: With valid token → access all protected routes

#### 2.2: Query Authorization (5 tests)
- [ ] Test 2.2.1: Query `builds` rejected without token (401)
- [ ] Test 2.2.2: Query `build(id)` rejected without token (401)
- [ ] Test 2.2.3: Query `testRuns(buildId)` rejected without token (401)
- [ ] Test 2.2.4: Query `builds` accepted with valid token
- [ ] Test 2.2.5: Query returns user-specific data only

#### 2.3: Token Header Injection (3 tests)
- [ ] Test 2.3.1: Valid token sent as `Authorization: Bearer <token>`
- [ ] Test 2.3.2: Missing Authorization header rejected (no token)
- [ ] Test 2.3.3: Malformed Authorization header rejected

**Test Execution Time:** ~15 minutes
**Prerequisites:** GraphQL backend running or mocked
**Success Criteria:** All 12 tests pass, auth checks are enforced

---

### Suite 3: Error Handling & Recovery (10 tests, 2.5 hours)

**Purpose:** Verify graceful error handling for authentication failures

**Location:** `frontend/__tests__/integration/auth-errors.test.tsx`

**Categories:**

#### 3.1: Invalid Credentials (3 tests)
- [ ] Test 3.1.1: Login with wrong password → error message displayed
- [ ] Test 3.1.2: Login with non-existent email → error message displayed
- [ ] Test 3.1.3: Error message doesn't leak user existence info

#### 3.2: Token Issues (4 tests)
- [ ] Test 3.2.1: Expired token → 401 error → redirect to /login
- [ ] Test 3.2.2: Malformed token → error thrown → redirect to /login
- [ ] Test 3.2.3: Token with invalid signature → 401 → redirect
- [ ] Test 3.2.4: Missing token when required → 401 → redirect

#### 3.3: Network & Server Errors (3 tests)
- [ ] Test 3.3.1: GraphQL server error (500) → display error to user
- [ ] Test 3.3.2: Network timeout → display retry option
- [ ] Test 3.3.3: CORS error → display error message

**Test Execution Time:** ~15 minutes
**Prerequisites:** Error mocks, Apollo error handling
**Success Criteria:** All errors handled gracefully, no console errors

---

### Suite 4: Multi-User Scenarios (7 tests, 2 hours)

**Purpose:** Verify session isolation and multi-user security

**Location:** `frontend/__tests__/integration/multi-user.test.tsx`

**Categories:**

#### 4.1: Session Isolation (3 tests)
- [ ] Test 4.1.1: User A logs in → User A data in context
- [ ] Test 4.1.2: User B logs in → User A token cleared → User B data in context
- [ ] Test 4.1.3: User A queries don't return User B data

#### 4.2: Concurrent Logins (2 tests)
- [ ] Test 4.2.1: Two browser tabs with different users → tokens independent
- [ ] Test 4.2.2: Re-login in Tab A while Tab B active → both sessions update

#### 4.3: Rapid State Changes (2 tests)
- [ ] Test 4.3.1: Rapid logout/login cycles maintain consistency
- [ ] Test 4.3.2: Token change mid-request handled correctly

**Test Execution Time:** ~10 minutes
**Prerequisites:** Multi-session state management
**Success Criteria:** All users isolated, no data leakage

---

### Suite 5: Token Management & Lifecycle (9 tests, 2 hours)

**Purpose:** Verify token generation, validation, and lifecycle management (Backend)

**Location:** `backend-graphql/src/resolvers/__tests__/token-mgmt.test.ts`

**Categories:**

#### 5.1: Token Generation (3 tests)
- [ ] Test 5.1.1: Login mutation generates valid JWT
- [ ] Test 5.1.2: Token contains correct user ID
- [ ] Test 5.1.3: Token has 24-hour expiration

#### 5.2: Token Validation (3 tests)
- [ ] Test 5.2.1: Valid token passes middleware
- [ ] Test 5.2.2: Expired token rejected with 401
- [ ] Test 5.2.3: Invalid signature rejected with error

#### 5.3: Token Refresh & Rotation (3 tests)
- [ ] Test 5.3.1: Re-login generates new token
- [ ] Test 5.3.2: Old token still valid until expiration
- [ ] Test 5.3.3: Token reuse prevention (if implemented)

**Test Execution Time:** ~10 minutes
**Prerequisites:** JWT generation logic, token validation
**Success Criteria:** Token lifecycle fully covered

---

### Suite 6: Security & Edge Cases (8 tests, 2 hours)

**Purpose:** Verify security best practices and edge case handling

**Location:** `frontend/__tests__/integration/security-edge-cases.test.tsx`

**Categories:**

#### 6.1: Token Security (2 tests)
- [ ] Test 6.1.1: Token never logged in plain text
- [ ] Test 6.1.2: Token not exposed in URL parameters

#### 6.2: Password Security (2 tests)
- [ ] Test 6.2.1: Password never logged or stored
- [ ] Test 6.2.2: Password field cleared on form submission

#### 6.3: Input Validation (2 tests)
- [ ] Test 6.3.1: Login with empty email → validation error
- [ ] Test 6.3.2: Login with 1000-char email → handled gracefully

#### 6.4: Form Submission Edge Cases (2 tests)
- [ ] Test 6.4.1: Double-click submit button → single request only
- [ ] Test 6.4.2: Form submission with pending request → disabled button

**Test Execution Time:** ~10 minutes
**Prerequisites:** Form validation logic, security middleware
**Success Criteria:** All security practices verified

---

## DETAILED TEST CASES

### Suite 1: Full Authentication Flow

#### **Test Case 1.1.1: Successful Login - Valid Credentials**

**File:** `frontend/__tests__/integration/full-auth-flow.test.tsx`

**Description:** User enters valid email and password, receives JWT token, token stored in localStorage

**Setup:**
```typescript
// Mock the login mutation
const mockLoginMutation = {
  request: {
    query: LOGIN_MUTATION,
    variables: { email: 'test@example.com', password: 'password123' }
  },
  result: {
    data: {
      login: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: { id: 'user-123', email: 'test@example.com' }
      }
    }
  }
};

// Clear localStorage before test
localStorage.clear();
```

**Test Steps:**
1. Render LoginForm component wrapped in ApolloProvider + AuthProvider
2. Find email input field
3. Type 'test@example.com'
4. Find password input field
5. Type 'password123'
6. Click "Sign In" button
7. Wait for GraphQL mutation to complete
8. Verify token stored in localStorage
9. Verify user redirected to /dashboard
10. Verify token available in useAuth hook

**Expected Results:**
```typescript
// Token stored in localStorage
expect(localStorage.getItem('auth_token')).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// Auth context updated
const { token } = useAuth();
expect(token).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// Navigation occurred
expect(router.push).toHaveBeenCalledWith('/dashboard');
```

**Estimated Time:** 2 minutes  
**Dependencies:** LoginForm component, Apollo MockedProvider, useAuth hook

---

#### **Test Case 1.1.2: Token Persists in State After Login**

**File:** `frontend/__tests__/integration/full-auth-flow.test.tsx`

**Description:** Token remains accessible in Auth context throughout session

**Setup:**
```typescript
const { getByTestId } = render(
  <MockedProvider mocks={[mockLoginMutation]}>
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  </MockedProvider>
);
```

**Test Steps:**
1. Perform successful login (reuse 1.1.1 setup)
2. Verify token in context immediately after login
3. Navigate to different component
4. Verify token still in context
5. Render component that calls useAuth()
6. Verify token passed to children

**Expected Results:**
```typescript
// Token available immediately
let authContext = useAuth();
expect(authContext.token).toBeDefined();

// Token persists after navigation
renderComponent(<Dashboard />);
authContext = useAuth();
expect(authContext.token).toBe(expectedToken);
```

**Estimated Time:** 2 minutes  
**Dependencies:** AuthContext, token management

---

#### **Test Case 1.2.1: Token Restored from localStorage on App Load**

**File:** `frontend/__tests__/integration/full-auth-flow.test.tsx`

**Description:** On app initialization, existing token in localStorage is restored to context

**Setup:**
```typescript
// Pre-populate localStorage with valid token
localStorage.setItem('auth_token', 'existing-token-jwt...');

// Create new AuthProvider (simulating app reload)
const { getByTestId } = render(
  <AuthProvider>
    <TestComponent />
  </AuthProvider>
);
```

**Test Steps:**
1. Set token in localStorage directly
2. Mount AuthProvider
3. Wait for useEffect to initialize
4. Verify token loaded from localStorage
5. Verify token available in useAuth hook
6. Verify no login mutation called

**Expected Results:**
```typescript
const { token } = useAuth();
expect(token).toBe('existing-token-jwt...');
expect(mockLoginMutation).not.toHaveBeenCalled();
```

**Estimated Time:** 2 minutes  
**Dependencies:** localStorage, useEffect, AuthContext initialization

---

#### **Test Case 1.3.1: Logout Clears Token from State**

**File:** `frontend/__tests__/integration/full-auth-flow.test.tsx`

**Description:** Logout function removes token from Auth context

**Setup:**
```typescript
// Start with logged-in user
localStorage.setItem('auth_token', 'valid-token');
const { getByTestId } = render(
  <AuthProvider>
    <TestComponent />
  </AuthProvider>
);

// Wait for AuthProvider to initialize
await waitFor(() => {
  expect(useAuth().token).toBe('valid-token');
});
```

**Test Steps:**
1. Verify user is logged in (token in context)
2. Call logout() function
3. Verify token removed from state
4. Verify logout() function ran successfully
5. Verify context now has null token

**Expected Results:**
```typescript
const { logout } = useAuth();
logout();

await waitFor(() => {
  const { token } = useAuth();
  expect(token).toBeNull();
});
```

**Estimated Time:** 1.5 minutes  
**Dependencies:** logout function, context update

---

#### **Test Case 1.3.2: Logout Removes Token from localStorage**

**File:** `frontend/__tests__/integration/full-auth-flow.test.tsx`

**Description:** Logout function clears token from persistent storage

**Setup:**
```typescript
localStorage.setItem('auth_token', 'valid-token');
const { logout } = useAuth();
```

**Test Steps:**
1. Verify token in localStorage
2. Call logout()
3. Verify token removed from localStorage
4. Verify localStorage is empty or auth_token key missing

**Expected Results:**
```typescript
expect(localStorage.getItem('auth_token')).toBe('valid-token');

logout();

await waitFor(() => {
  expect(localStorage.getItem('auth_token')).toBeNull();
});
```

**Estimated Time:** 1.5 minutes  
**Dependencies:** logout function, localStorage

---

#### **Test Case 1.3.3: Redirect to /login After Logout**

**File:** `frontend/__tests__/integration/full-auth-flow.test.tsx`

**Description:** After logout, user redirected to login page

**Setup:**
```typescript
const mockRouter = { push: vi.fn() };
vi.mock('next/router', () => ({ useRouter: () => mockRouter }));

const { logout } = useAuth();
```

**Test Steps:**
1. Verify user on protected route (/dashboard)
2. Call logout()
3. Verify router.push called with /login
4. Verify navigation occurs

**Expected Results:**
```typescript
logout();

await waitFor(() => {
  expect(mockRouter.push).toHaveBeenCalledWith('/login');
});
```

**Estimated Time:** 1.5 minutes  
**Dependencies:** Next.js router, logout function

---

### Suite 2: Protected Routes

#### **Test Case 2.1.1: Without Token - Redirect from /dashboard**

**File:** `frontend/__tests__/integration/protected-routes.test.tsx`

**Description:** Unauthenticated user accessing /dashboard is redirected to /login

**Setup:**
```typescript
// Clear localStorage to ensure no token
localStorage.clear();

// Mock Next.js router
const mockRouter = { push: vi.fn(), pathname: '/dashboard' };

// Render dashboard without token
const { getByTestId } = render(
  <AuthProvider>
    <Dashboard />
  </AuthProvider>
);
```

**Test Steps:**
1. Clear localStorage
2. Mount Dashboard component
3. Dashboard should check for token
4. Token not found → component redirects
5. Verify router.push('/login') called

**Expected Results:**
```typescript
await waitFor(() => {
  expect(mockRouter.push).toHaveBeenCalledWith('/login');
});
```

**Estimated Time:** 1.5 minutes  
**Dependencies:** Protected route logic, router mock

---

#### **Test Case 2.2.1: Query `builds` Rejected Without Token (401)**

**File:** `frontend/__tests__/integration/protected-routes.test.tsx`

**Description:** GraphQL query for builds requires valid authentication

**Setup:**
```typescript
const mockError = {
  graphQLErrors: [{ message: 'Unauthorized' }],
  networkError: null
};

const mockBuildsQuery = {
  request: { query: GET_BUILDS, variables: {} },
  result: { errors: [{ message: 'Unauthorized' }] }
};
```

**Test Steps:**
1. Try to query builds without token
2. GraphQL returns 401 error
3. Verify error caught and handled
4. Verify user redirected to login

**Expected Results:**
```typescript
const error = await expect(executeQuery(GET_BUILDS)).rejects.toThrow();
expect(error.message).toContain('Unauthorized');
```

**Estimated Time:** 2 minutes  
**Dependencies:** GraphQL resolver auth, error handling

---

#### **Test Case 2.3.1: Valid Token Sent as Authorization Header**

**File:** `frontend/__tests__/integration/protected-routes.test.tsx`

**Description:** Apollo Client sends `Authorization: Bearer <token>` header

**Setup:**
```typescript
const token = 'valid-jwt-token';
localStorage.setItem('auth_token', token);

// Spy on fetch to capture headers
const fetchSpy = vi.spyOn(global, 'fetch');
```

**Test Steps:**
1. Set token in localStorage
2. Execute GraphQL query
3. Capture request headers
4. Verify Authorization header present
5. Verify format: `Bearer <token>`

**Expected Results:**
```typescript
await executeQuery(GET_BUILDS);

const { headers } = fetchSpy.mock.calls[0][1];
expect(headers.Authorization).toBe(`Bearer ${token}`);
```

**Estimated Time:** 2 minutes  
**Dependencies:** Apollo Link auth, fetch spy

---

### Suite 3: Error Handling

#### **Test Case 3.1.1: Invalid Credentials - Wrong Password**

**File:** `frontend/__tests__/integration/auth-errors.test.tsx`

**Description:** Login with correct email but wrong password shows error

**Setup:**
```typescript
const mockLoginError = {
  request: { query: LOGIN_MUTATION, variables: { ... } },
  result: {
    errors: [{ message: 'Invalid email or password' }]
  }
};
```

**Test Steps:**
1. Navigate to /login
2. Enter valid email
3. Enter wrong password
4. Click "Sign In"
5. Wait for GraphQL error
6. Verify error message displayed
7. Verify token NOT stored
8. Verify page NOT redirected

**Expected Results:**
```typescript
const errorElement = screen.getByText('Invalid email or password');
expect(errorElement).toBeInTheDocument();
expect(localStorage.getItem('auth_token')).toBeNull();
```

**Estimated Time:** 2 minutes  
**Dependencies:** Error mock, error display component

---

#### **Test Case 3.2.1: Expired Token - 401 Redirect to Login**

**File:** `frontend/__tests__/integration/auth-errors.test.tsx`

**Description:** Expired token causes 401 error and redirect to login

**Setup:**
```typescript
// Create expired token
const expiredToken = createExpiredJWT('user-123');
localStorage.setItem('auth_token', expiredToken);

// Mock backend rejecting with 401
const mockQueryError = {
  request: { query: GET_BUILDS },
  result: { errors: [{ message: 'Token expired', status: 401 }] }
};
```

**Test Steps:**
1. Set expired token in localStorage
2. Try to access /dashboard
3. Dashboard queries builds
4. Backend returns 401
5. Verify error caught
6. Verify token cleared
7. Verify redirect to /login

**Expected Results:**
```typescript
await waitFor(() => {
  expect(localStorage.getItem('auth_token')).toBeNull();
  expect(mockRouter.push).toHaveBeenCalledWith('/login');
});
```

**Estimated Time:** 2 minutes  
**Dependencies:** JWT expiration, error handling, redirect

---

#### **Test Case 3.3.1: GraphQL Server Error (500) - Display Error**

**File:** `frontend/__tests__/integration/auth-errors.test.tsx`

**Description:** Server error during login is displayed to user

**Setup:**
```typescript
const mockServerError = {
  request: { query: LOGIN_MUTATION, variables: { ... } },
  result: {
    errors: [{ message: 'Internal server error' }],
    networkError: null
  }
};
```

**Test Steps:**
1. Login form submitted
2. Server returns 500 error
3. Verify error message displayed
4. Verify user can retry
5. Verify no token stored

**Expected Results:**
```typescript
const errorMsg = screen.getByText(/error|server|failed/i);
expect(errorMsg).toBeInTheDocument();
expect(localStorage.getItem('auth_token')).toBeNull();
```

**Estimated Time:** 1.5 minutes  
**Dependencies:** Error mock, error display

---

### Suite 4: Multi-User Scenarios

#### **Test Case 4.1.1: User A Logs In → User A Data in Context**

**File:** `frontend/__tests__/integration/multi-user.test.tsx`

**Description:** First user login correctly populates context

**Setup:**
```typescript
const mockUserALogin = {
  request: { query: LOGIN_MUTATION, variables: { email: 'usera@example.com', password: 'pass' } },
  result: { data: { login: { token: 'token-a', user: { id: 'user-a-123', email: 'usera@example.com' } } } }
};
```

**Test Steps:**
1. Clear localStorage
2. Login as User A
3. Verify token-a in context
4. Verify user ID is user-a-123
5. Verify subsequent queries use user-a-123 context

**Expected Results:**
```typescript
const { token } = useAuth();
expect(token).toBe('token-a');
```

**Estimated Time:** 1.5 minutes  
**Dependencies:** Login flow, context management

---

#### **Test Case 4.1.2: User B Logs In → User A Token Cleared → User B Data in Context**

**File:** `frontend/__tests__/integration/multi-user.test.tsx`

**Description:** Second user login replaces first user's token

**Setup:**
```typescript
// First login as User A
const mockUserALogin = { ... };

// Then login as User B
const mockUserBLogin = {
  request: { query: LOGIN_MUTATION, variables: { email: 'userb@example.com', password: 'pass' } },
  result: { data: { login: { token: 'token-b', user: { id: 'user-b-456', email: 'userb@example.com' } } } }
};
```

**Test Steps:**
1. Login as User A (token-a stored)
2. Verify context has User A token
3. Login as User B
4. Verify token changed to token-b
5. Verify user ID changed to user-b-456
6. Verify localStorage has token-b
7. Verify token-a no longer available

**Expected Results:**
```typescript
// After User B login
const { token } = useAuth();
expect(token).toBe('token-b');
expect(localStorage.getItem('auth_token')).toBe('token-b');
```

**Estimated Time:** 2 minutes  
**Dependencies:** Multi-login scenario, token replacement

---

#### **Test Case 4.1.3: User A Queries Don't Return User B Data**

**File:** `frontend/__tests__/integration/multi-user.test.tsx`

**Description:** Backend enforces user data isolation via JWT

**Setup:**
```typescript
// User A token
const tokenA = generateToken('user-a-123');

// User B token
const tokenB = generateToken('user-b-456');

// Mock builds - User A should only see User A's builds
const mockBuildsForA = {
  request: { query: GET_BUILDS, context: { headers: { Authorization: `Bearer ${tokenA}` } } },
  result: { data: { builds: [{ id: 'build-a-1', name: 'Build A', createdBy: 'user-a-123' }] } }
};

// User B should see different builds
const mockBuildsForB = {
  request: { query: GET_BUILDS, context: { headers: { Authorization: `Bearer ${tokenB}` } } },
  result: { data: { builds: [{ id: 'build-b-1', name: 'Build B', createdBy: 'user-b-456' }] } }
};
```

**Test Steps:**
1. Login as User A, query builds
2. Verify builds list contains only User A's data
3. Logout User A
4. Login as User B, query builds
5. Verify builds list contains only User B's data
6. Verify no cross-user data visible

**Expected Results:**
```typescript
// User A queries
let builds = await executeQuery(GET_BUILDS, { token: tokenA });
expect(builds[0].createdBy).toBe('user-a-123');

// User B queries
builds = await executeQuery(GET_BUILDS, { token: tokenB });
expect(builds[0].createdBy).toBe('user-b-456');
```

**Estimated Time:** 2.5 minutes  
**Dependencies:** Token-based data filtering, backend resolver

---

### Suite 5: Token Management (Backend)

#### **Test Case 5.1.1: Login Mutation Generates Valid JWT**

**File:** `backend-graphql/src/resolvers/__tests__/token-mgmt.test.ts`

**Description:** Login mutation creates properly formatted JWT token

**Setup:**
```typescript
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const mockUser = { id: 'user-123', email: 'test@example.com', password: 'hashed-pass' };

const mockContext = {
  user: null,
  prisma: mockPrisma
};
```

**Test Steps:**
1. Mock Prisma findUser to return valid user
2. Call login mutation with email/password
3. Verify token returned in response
4. Decode token without secret (unsafe check)
5. Verify token contains user ID
6. Verify token has exp claim (expiration)

**Expected Results:**
```typescript
const result = await mutationResolver.Mutation.login(null, 
  { email: 'test@example.com', password: 'password123' }, 
  mockContext
);

expect(result.token).toBeDefined();
expect(typeof result.token).toBe('string');

const decoded = jwt.decode(result.token);
expect(decoded.id).toBe('user-123');
expect(decoded.exp).toBeDefined();
```

**Estimated Time:** 2 minutes  
**Dependencies:** JWT generation, Prisma mock

---

#### **Test Case 5.1.2: Token Contains Correct User ID**

**File:** `backend-graphql/src/resolvers/__tests__/token-mgmt.test.ts`

**Description:** Generated token encodes the correct user ID

**Setup:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const testUsers = [
  { id: 'user-1', email: 'user1@example.com' },
  { id: 'user-2', email: 'user2@example.com' },
  { id: 'user-3', email: 'user3@example.com' }
];
```

**Test Steps:**
1. For each test user, call login mutation
2. Decode token with JWT secret
3. Verify decoded.id matches user ID
4. Verify no other user IDs in token

**Expected Results:**
```typescript
for (const testUser of testUsers) {
  const result = await mutationResolver.Mutation.login(..., { id: testUser.id });
  const decoded = jwt.verify(result.token, JWT_SECRET);
  expect(decoded.id).toBe(testUser.id);
}
```

**Estimated Time:** 1.5 minutes  
**Dependencies:** JWT verification, multiple users

---

#### **Test Case 5.1.3: Token Has 24-Hour Expiration**

**File:** `backend-graphql/src/resolvers/__tests__/token-mgmt.test.ts`

**Description:** Generated token expires in 24 hours

**Setup:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
```

**Test Steps:**
1. Call login mutation
2. Decode token
3. Extract exp and iat claims
4. Calculate difference: exp - iat
5. Verify equals 24 hours in seconds
6. Allow 1 second variance for test timing

**Expected Results:**
```typescript
const result = await mutationResolver.Mutation.login(...);
const decoded = jwt.decode(result.token);

const expirationSeconds = decoded.exp - decoded.iat;
const expected24Hours = 24 * 60 * 60;

expect(Math.abs(expirationSeconds - expected24Hours)).toBeLessThanOrEqual(1);
```

**Estimated Time:** 1.5 minutes  
**Dependencies:** JWT claims, time calculation

---

#### **Test Case 5.2.1: Valid Token Passes Middleware**

**File:** `backend-graphql/src/resolvers/__tests__/token-mgmt.test.ts`

**Description:** Valid token successfully extracts user from middleware

**Setup:**
```typescript
const token = generateToken('user-123');
const authHeader = `Bearer ${token}`;
```

**Test Steps:**
1. Generate valid token
2. Call extractUserFromToken with Bearer header
3. Verify returns user object
4. Verify user.id matches

**Expected Results:**
```typescript
const user = extractUserFromToken(authHeader);

expect(user).not.toBeNull();
expect(user.id).toBe('user-123');
```

**Estimated Time:** 1 minute  
**Dependencies:** Token generation, middleware

---

#### **Test Case 5.2.2: Expired Token Rejected with 401**

**File:** `backend-graphql/src/resolvers/__tests__/token-mgmt.test.ts`

**Description:** Expired token causes authentication rejection

**Setup:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// Create token that expired 1 hour ago
const expiredToken = jwt.sign({ id: 'user-123' }, JWT_SECRET, { expiresIn: '-1h' });
const authHeader = `Bearer ${expiredToken}`;
```

**Test Steps:**
1. Create expired token (expiresIn: '-1h')
2. Call extractUserFromToken
3. Verify throws error
4. Verify error message contains 'expired'

**Expected Results:**
```typescript
expect(() => {
  extractUserFromToken(authHeader);
}).toThrow('Token expired');
```

**Estimated Time:** 1.5 minutes  
**Dependencies:** JWT expiration, error handling

---

#### **Test Case 5.2.3: Invalid Signature Rejected with Error**

**File:** `backend-graphql/src/resolvers/__tests__/token-mgmt.test.ts`

**Description:** Token signed with wrong key is rejected

**Setup:**
```typescript
// Sign token with wrong secret
const fakeToken = jwt.sign({ id: 'user-123' }, 'wrong-secret', { expiresIn: '24h' });
const authHeader = `Bearer ${fakeToken}`;
```

**Test Steps:**
1. Create token with wrong secret
2. Call extractUserFromToken with correct secret in function
3. Verify throws error
4. Verify error message contains 'Invalid token'

**Expected Results:**
```typescript
expect(() => {
  extractUserFromToken(authHeader);
}).toThrow('Invalid token');
```

**Estimated Time:** 1 minute  
**Dependencies:** JWT signature validation

---

### Suite 6: Security & Edge Cases

#### **Test Case 6.1.1: Token Never Logged in Plain Text**

**File:** `frontend/__tests__/integration/security-edge-cases.test.tsx`

**Description:** Auth system never logs token in console/logs

**Setup:**
```typescript
// Spy on console methods
const consoleLogSpy = vi.spyOn(console, 'log');
const consoleErrorSpy = vi.spyOn(console, 'error');

// Perform login
const token = 'secret-jwt-token-abc123';
localStorage.setItem('auth_token', token);
```

**Test Steps:**
1. Spy on console.log, console.error, console.warn
2. Perform login action
3. Store token in localStorage
4. Make API calls with token
5. Verify console calls don't contain token
6. Verify localStorage accessed but not logged

**Expected Results:**
```typescript
// No console calls should contain the actual token
const allConsoleCalls = [...consoleLogSpy.mock.calls, ...consoleErrorSpy.mock.calls];
for (const call of allConsoleCalls) {
  expect(call.toString()).not.toContain(token);
}
```

**Estimated Time:** 1.5 minutes  
**Dependencies:** Console spy, login flow

---

#### **Test Case 6.1.2: Token Not Exposed in URL Parameters**

**File:** `frontend/__tests__/integration/security-edge-cases.test.tsx`

**Description:** Token never passed as URL query parameter

**Setup:**
```typescript
const token = 'secret-jwt-token';
const mockRouter = { push: vi.fn() };
```

**Test Steps:**
1. Perform login
2. Verify redirects use next/router (not URL redirect)
3. Monitor all router.push calls
4. Verify no calls contain token as query param
5. Verify localStorage used instead

**Expected Results:**
```typescript
// After login, router.push should be called
expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');

// But NOT with token in URL
expect(mockRouter.push).not.toHaveBeenCalledWith(
  expect.stringContaining(`token=${token}`)
);
```

**Estimated Time:** 1.5 minutes  
**Dependencies:** Router mock, URL inspection

---

#### **Test Case 6.3.1: Login with Empty Email - Validation Error**

**File:** `frontend/__tests__/integration/security-edge-cases.test.tsx`

**Description:** Form validates empty email before submission

**Setup:**
```typescript
const { getByTestId } = render(<LoginForm />);
const emailInput = getByTestId('email-input');
const passwordInput = getByTestId('password-input');
const submitButton = getByTestId('submit-button');
```

**Test Steps:**
1. Leave email field empty
2. Enter password
3. Click submit button
4. Verify form validation error displayed
5. Verify no GraphQL request made
6. Verify submit button disabled or error shown

**Expected Results:**
```typescript
expect(screen.getByText(/email required|enter email/i)).toBeInTheDocument();
expect(mockLoginMutation).not.toHaveBeenCalled();
```

**Estimated Time:** 1 minute  
**Dependencies:** Form validation, input fields

---

#### **Test Case 6.4.1: Double-Click Submit - Single Request Only**

**File:** `frontend/__tests__/integration/security-edge-cases.test.tsx`

**Description:** Double-clicking submit button doesn't send duplicate requests

**Setup:**
```typescript
const { getByTestId } = render(<LoginForm />);
const submitButton = getByTestId('submit-button');
const mockLoginMutation = vi.fn();
```

**Test Steps:**
1. Fill form with valid credentials
2. Double-click submit button rapidly (2 clicks within 100ms)
3. Verify button disabled during submission
4. Wait for GraphQL response
5. Verify mutation called only once
6. Verify button re-enabled after response

**Expected Results:**
```typescript
fireEvent.click(submitButton);
fireEvent.click(submitButton); // Double-click

await waitFor(() => {
  expect(mockLoginMutation).toHaveBeenCalledTimes(1);
});
```

**Estimated Time:** 1.5 minutes  
**Dependencies:** Submit button state, debouncing/disabling

---

## TEST DATA & FIXTURES

### User Fixtures

```typescript
// frontend/__tests__/fixtures/users.ts

export const validUsers = [
  {
    id: 'user-123',
    email: 'alice@example.com',
    password: 'password123',
    token: 'jwt-token-alice-...'
  },
  {
    id: 'user-456',
    email: 'bob@example.com',
    password: 'password456',
    token: 'jwt-token-bob-...'
  },
  {
    id: 'user-789',
    email: 'charlie@example.com',
    password: 'password789',
    token: 'jwt-token-charlie-...'
  }
];

export const invalidUsers = [
  {
    email: 'nonexistent@example.com',
    password: 'password123',
    expectedError: 'Invalid email or password'
  },
  {
    email: 'alice@example.com',
    password: 'wrongpassword',
    expectedError: 'Invalid email or password'
  },
  {
    email: '',
    password: 'password123',
    expectedError: 'Email required'
  },
  {
    email: 'alice@example.com',
    password: '',
    expectedError: 'Password required'
  }
];
```

### Token Fixtures

```typescript
// backend-graphql/src/__tests__/fixtures/tokens.ts

export const tokenFixtures = {
  validToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE2MTYzMjU0MjJ9.ABC123...',
  
  expiredToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE2MTYyMzk5MjJ9.XYZ789...',
  
  malformedToken: 'not.a.valid.jwt',
  
  invalidSignatureToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE2MTYzMjU0MjJ9.WRONG_SIGNATURE_123',
  
  noUserIdToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MTYyMzk5MjIsImV4cCI6MTYxNjMyNTQyMn0.ABC123...',
  
  emptyUserIdToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxNjE2MzI1NDIyfQ.XYZ789...'
};
```

### GraphQL Query Fixtures

```typescript
// frontend/__tests__/fixtures/graphql.ts

import { gql } from '@apollo/client/core';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
      }
    }
  }
`;

export const GET_BUILDS = gql`
  query GetBuilds($limit: Int, $offset: Int) {
    builds(limit: $limit, offset: $offset) {
      id
      name
      status
      createdAt
    }
  }
`;

export const GET_BUILDS_RESPONSE = {
  builds: [
    { id: 'build-1', name: 'Build 1', status: 'PENDING', createdAt: '2026-04-20T00:00:00Z' },
    { id: 'build-2', name: 'Build 2', status: 'RUNNING', createdAt: '2026-04-21T00:00:00Z' }
  ]
};
```

### Mock Response Fixtures

```typescript
// frontend/__tests__/fixtures/mocks.ts

export const loginMocks = {
  success: (user = validUsers[0]) => ({
    request: {
      query: LOGIN_MUTATION,
      variables: { email: user.email, password: user.password }
    },
    result: {
      data: {
        login: {
          token: user.token,
          user: { id: user.id, email: user.email }
        }
      }
    }
  }),

  invalidCredentials: {
    request: {
      query: LOGIN_MUTATION,
      variables: { email: 'test@example.com', password: 'wrong' }
    },
    result: {
      errors: [{ message: 'Invalid email or password' }]
    }
  },

  serverError: {
    request: {
      query: LOGIN_MUTATION,
      variables: { email: 'test@example.com', password: 'password' }
    },
    result: {
      errors: [{ message: 'Internal server error' }]
    }
  }
};

export const buildsMocks = {
  success: (token: string) => ({
    request: {
      query: GET_BUILDS,
      variables: { limit: 10, offset: 0 }
    },
    result: {
      data: GET_BUILDS_RESPONSE
    }
  }),

  unauthorized: {
    request: {
      query: GET_BUILDS,
      variables: { limit: 10, offset: 0 }
    },
    result: {
      errors: [{ message: 'Unauthorized' }]
    }
  }
};
```

---

## MOCK SETUP & HELPERS

### Apollo MockedProvider Setup

```typescript
// frontend/__tests__/helpers/apollo-mock.ts

import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { ReactNode } from 'react';

export function createApolloWrapper(mocks: MockedResponse[] = []) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };
}

export function createAuthApolloWrapper(
  mocks: MockedResponse[] = [],
  token: string | null = null
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider initialToken={token}>
          {children}
        </AuthProvider>
      </MockedProvider>
    );
  };
}
```

### localStorage Mock & Management

```typescript
// frontend/__tests__/helpers/storage.ts

export function setupStorageMock() {
  const storage: Record<string, string> = {};

  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach(key => delete storage[key]);
    },
    length: 0,
    key: (index: number) => Object.keys(storage)[index] || null
  };
}

export function initializeStorageWithToken(token: string) {
  const storage = setupStorageMock();
  storage.setItem('auth_token', token);
  return storage;
}

export function clearStorage() {
  const storage = setupStorageMock();
  storage.clear();
  return storage;
}
```

### JWT Generation & Validation Helpers

```typescript
// backend-graphql/src/__tests__/helpers/jwt.ts

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

export function createTestToken(userId: string, expiresIn = '24h'): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn });
}

export function createExpiredToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '-1h' });
}

export function createMalformedToken(): string {
  return 'not.a.valid.jwt.token';
}

export function createTokenWithWrongSecret(userId: string): string {
  return jwt.sign({ id: userId }, 'wrong-secret', { expiresIn: '24h' });
}

export function decodeToken(token: string) {
  return jwt.decode(token);
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
```

### Auth Context Test Helpers

```typescript
// frontend/__tests__/helpers/auth.ts

import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../lib/auth-context';
import { createAuthApolloWrapper } from './apollo-mock';

export function useAuthInTest(initialToken?: string) {
  const wrapper = createAuthApolloWrapper([], initialToken || null);
  return renderHook(() => useAuth(), { wrapper });
}

export async function loginInTest(email: string, password: string) {
  // Helper to simulate login in test context
  const { result } = useAuthInTest();
  
  act(() => {
    result.current.login('test-jwt-token');
  });

  return result.current;
}

export async function logoutInTest() {
  const { result } = useAuthInTest('existing-token');
  
  act(() => {
    result.current.logout();
  });

  return result.current;
}
```

### Resolver Test Helpers

```typescript
// backend-graphql/src/__tests__/helpers/resolvers.ts

import { BuildContext } from '../../types';
import { PrismaClient } from '@prisma/client';
import { createLoaders } from '../../dataloaders';

export function createMockContext(
  user: { id: string } | null = null,
  prisma: PrismaClient | null = null
): BuildContext {
  const mockPrisma = prisma || createMockPrisma();
  const loaders = createLoaders(mockPrisma);

  return {
    user,
    prisma: mockPrisma,
    buildPartLoader: loaders.buildPartLoader,
    buildTestRunLoader: loaders.buildTestRunLoader
  };
}

export function createMockPrisma(): PrismaClient {
  return {
    build: {
      create: async () => ({ id: '1', name: 'Test', status: 'PENDING', createdAt: new Date(), updatedAt: new Date() }),
      findUnique: async () => null,
      findMany: async () => [],
      update: async () => ({ id: '1', name: 'Test', status: 'RUNNING', createdAt: new Date(), updatedAt: new Date() })
    },
    part: {
      create: async () => ({ id: '1', buildId: '1', name: 'Part', sku: 'SKU', quantity: 1, createdAt: new Date(), updatedAt: new Date() })
    },
    testRun: {
      create: async () => ({ id: '1', buildId: '1', status: 'PASSED', result: 'PASS', fileUrl: '', completedAt: new Date(), createdAt: new Date(), updatedAt: new Date() }),
      findMany: async () => []
    }
  } as unknown as PrismaClient;
}

export function createAuthenticatedContext(userId = 'user-123') {
  return createMockContext({ id: userId });
}

export function createUnauthenticatedContext() {
  return createMockContext(null);
}
```

---

## EXECUTION STRATEGY

### Phase 1: Setup & Infrastructure (4-6 hours)

#### 1.1: Prepare Test Environment (1 hour)
- [ ] Create test directories and file structure
- [ ] Set up vitest configuration for coverage reporting
- [ ] Create `vitest.setup.ts` with global fixtures
- [ ] Install additional test dependencies (if needed)
- [ ] Configure GitHub Actions to run new tests

**Deliverables:**
- Directory structure created
- vitest.config.ts updated with setup files and coverage
- GitHub Actions workflow updated

#### 1.2: Create Test Fixtures & Helpers (2-3 hours)
- [ ] Create user fixtures (valid/invalid users)
- [ ] Create token fixtures (valid/expired/invalid)
- [ ] Create GraphQL query fixtures (LOGIN, GET_BUILDS)
- [ ] Create mock response fixtures
- [ ] Create Apollo MockedProvider helpers
- [ ] Create auth context test helpers
- [ ] Create resolver test helpers
- [ ] Create JWT generation helpers

**Deliverables:**
- `frontend/__tests__/fixtures/` directory
- `backend-graphql/src/__tests__/fixtures/` directory
- `frontend/__tests__/helpers/` directory
- `backend-graphql/src/__tests__/helpers/` directory

#### 1.3: Verify Existing Infrastructure (1-2 hours)
- [ ] Run existing tests (`pnpm test`)
- [ ] Verify all existing tests pass
- [ ] Check test coverage baseline
- [ ] Document any pre-existing issues
- [ ] Set up coverage threshold (≥90%)

**Deliverables:**
- Baseline test report
- Coverage report
- Issue list (if any)

---

### Phase 2: Core Integration Tests (6-8 hours)

#### 2.1: Implement Full Auth Flow Tests (4 hours)
- [ ] Create `full-auth-flow.test.tsx`
- [ ] Implement 15 test cases (1.1.1 through 1.4.3)
- [ ] Test successful login flow
- [ ] Test token persistence
- [ ] Test logout flow
- [ ] Test session lifecycle

**Deliverables:**
- 15 passing tests in `full-auth-flow.test.tsx`
- Coverage > 85% for LoginForm and AuthContext

#### 2.2: Implement Protected Routes Tests (3 hours)
- [ ] Create `protected-routes.test.tsx`
- [ ] Implement 12 test cases (2.1.1 through 2.3.3)
- [ ] Test route protection
- [ ] Test query authorization
- [ ] Test token header injection

**Deliverables:**
- 12 passing tests in `protected-routes.test.tsx`
- Coverage > 85% for protected route logic

#### 2.3: Implement Error Handling Tests (2 hours)
- [ ] Create `auth-errors.test.tsx`
- [ ] Implement 10 test cases (3.1.1 through 3.3.3)
- [ ] Test invalid credentials
- [ ] Test token issues
- [ ] Test network/server errors

**Deliverables:**
- 10 passing tests in `auth-errors.test.tsx`
- Coverage > 85% for error handling

---

### Phase 3: Advanced Tests (4-5 hours)

#### 3.1: Multi-User & Session Tests (2 hours)
- [ ] Create `multi-user.test.tsx`
- [ ] Implement 7 test cases (4.1.1 through 4.3.2)
- [ ] Test session isolation
- [ ] Test concurrent logins
- [ ] Test data isolation

**Deliverables:**
- 7 passing tests in `multi-user.test.tsx`
- Verify no data leakage between users

#### 3.2: Token Management Backend Tests (2 hours)
- [ ] Create `token-mgmt.test.ts` (backend-graphql)
- [ ] Implement 9 test cases (5.1.1 through 5.3.3)
- [ ] Test token generation
- [ ] Test token validation
- [ ] Test token lifecycle

**Deliverables:**
- 9 passing tests in `token-mgmt.test.ts`
- Coverage > 85% for token logic

#### 3.3: Security & Edge Cases Tests (1.5 hours)
- [ ] Create `security-edge-cases.test.tsx`
- [ ] Implement 8 test cases (6.1.1 through 6.4.2)
- [ ] Test token security
- [ ] Test password security
- [ ] Test form submission edge cases

**Deliverables:**
- 8 passing tests in `security-edge-cases.test.tsx`
- All security best practices verified

---

### Phase 4: Verification & Reporting (2-3 hours)

#### 4.1: Comprehensive Test Run (1 hour)
- [ ] Run all tests: `pnpm test --run`
- [ ] Verify 100% pass rate
- [ ] Verify no TypeScript errors
- [ ] Verify coverage report generated
- [ ] Verify coverage ≥90%

**Deliverables:**
- Test run report (all passing)
- Coverage report (≥90%)
- Zero type errors

#### 4.2: Performance & Flakiness Tests (1 hour)
- [ ] Run tests 3 times sequentially
- [ ] Verify consistent results (no flaky tests)
- [ ] Measure test suite execution time
- [ ] Verify execution time < 120 seconds
- [ ] Check for console warnings/errors

**Deliverables:**
- Flakiness report (0 flaky tests)
- Performance metrics (< 120 seconds)
- Zero console warnings

#### 4.3: Acceptance Criteria Verification (1 hour)
- [ ] Verify all 11 criteria from #27 tested
- [ ] Verify all 8 criteria from #121 tested
- [ ] Document test → criterion mapping
- [ ] Create test coverage matrix
- [ ] Generate final report

**Deliverables:**
- Acceptance Criteria Coverage Matrix
- Test → Criterion Traceability Document
- Final Test Report
- Ready for merge to main

---

### Phase 5: Integration with CI/CD (1 hour)

#### 5.1: GitHub Actions Integration
- [ ] Update `.github/workflows/test.yml` (if exists)
- [ ] Ensure tests run on PR/push
- [ ] Verify test results reported
- [ ] Set branch protection to require tests passing
- [ ] Test PR workflow end-to-end

**Deliverables:**
- Updated GitHub Actions workflow
- Branch protection rules enabled
- Test results visible on PRs

---

## DEPENDENCIES & BLOCKERS

### Critical Dependencies

| Item | Status | Impact | Notes |
|------|--------|--------|-------|
| Issue #120 Complete | ✅ DONE | HIGH | All login component work done |
| Issue #119 Complete | ✅ DONE | HIGH | Auth context + Apollo Link complete |
| Issue #118 Complete | ✅ DONE | HIGH | Backend JWT middleware ready |
| Vitest Configuration | ✅ READY | HIGH | Test framework ready |
| MockedProvider Setup | ✅ READY | MEDIUM | Apollo mocking available |
| Prisma/DB Mock | ✅ READY | MEDIUM | Existing patterns established |

### Potential Blockers

**Block 1: Test Database Access**
- **Issue:** Tests may need real database for integration testing
- **Risk:** If using mocks, may miss real database interaction bugs
- **Solution:** Use test database container (Docker PostgreSQL) or keep mocks for speed
- **Status:** 🟡 MEDIUM - Plan to use mocks first, add DB tests if needed

**Block 2: GraphQL Mutation Implementation**
- **Issue:** Login mutation must be fully implemented in backend
- **Risk:** If login mutation missing or incomplete, tests will fail
- **Current Status:** Need to verify login mutation is working
- **Solution:** Check if mutation implemented, otherwise create it
- **Status:** 🟡 MEDIUM - Need to verify

**Block 3: Next.js Routing in Tests**
- **Issue:** next/router mocking in happy-dom environment
- **Risk:** Router navigation might not work in test environment
- **Current Status:** Need to mock router properly
- **Solution:** Use vi.mock() to mock next/router
- **Status:** 🟡 MEDIUM - Common pattern, should work

**Block 4: localStorage in Node Environment**
- **Issue:** localStorage not available in Node.js test environment
- **Risk:** Tests in happy-dom might fail on localStorage access
- **Current Status:** happy-dom provides limited DOM support
- **Solution:** Create localStorage mock/polyfill
- **Status:** 🟡 MEDIUM - happy-dom may support, test first

**Block 5: Apollo Cache Consistency**
- **Issue:** Apollo cache must persist across mock queries
- **Risk:** Cache may not update correctly between mutations/queries
- **Current Status:** MockedProvider may have cache issues
- **Solution:** Verify cache=new InMemoryCache() in tests, use clearCache() between tests
- **Status:** 🟡 MEDIUM - Known Apollo gotcha

---

## SUCCESS CRITERIA

### Test Coverage Criteria

- [ ] **C1**: ≥90% code coverage for auth-related code
  - Frontend: LoginForm.tsx, auth-context.tsx, apollo-link (if auth-specific)
  - Backend: auth middleware, login resolver, protected resolvers
  - Metric: `pnpm test --coverage` report shows ≥90%

- [ ] **C2**: All 11 acceptance criteria from Issue #27 verified
  - Each criterion has ≥1 corresponding test
  - Test explicitly verifies the criterion
  - Test name references the criterion

- [ ] **C3**: All 8 acceptance criteria from Issue #121 verified
  - AC1-8 have test suites
  - Tests marked as passing
  - No skipped tests

### Test Quality Criteria

- [ ] **C4**: 100% test pass rate
  - `pnpm test --run` shows 0 failures
  - No skipped tests
  - All tests deterministic (no timeouts/flakiness)

- [ ] **C5**: Zero flaky tests
  - Run test suite 3 times consecutively
  - All tests pass all 3 runs
  - No intermittent failures
  - No tests dependent on execution order

- [ ] **C6**: No TypeScript errors
  - `pnpm build` completes successfully
  - No `TS` errors in console
  - All test files have proper types
  - No `any` types without justification

### Performance Criteria

- [ ] **C7**: Test execution time < 120 seconds
  - `pnpm test --run` completes in < 2 minutes
  - No individual test takes > 10 seconds
  - Parallel test execution enabled

- [ ] **C8**: Memory usage acceptable
  - No memory leaks detected
  - Cleanup functions run properly
  - MockedProvider cleaned up between tests

### Integration Criteria

- [ ] **C9**: All tests pass locally
  - Developer machine: MacOS/Linux with Node 18+
  - Tests pass with `pnpm test --run`
  - No platform-specific failures

- [ ] **C10**: All tests pass in CI
  - GitHub Actions workflow runs successfully
  - Tests pass on ubuntu-latest runner
  - Test results reported on PRs

### Documentation Criteria

- [ ] **C11**: Test plan documented
  - This document complete
  - Test cases documented
  - Fixtures and helpers documented
  - Execution strategy clear

- [ ] **C12**: Test code well-commented
  - Each test has comment explaining purpose
  - Complex assertions commented
  - Mock setup explained

---

## EFFORT ESTIMATE & TIMELINE

### Effort Breakdown (Detailed)

| Phase | Task | Duration | Resources |
|-------|------|----------|-----------|
| **1: Setup** | Prepare environment | 1 hr | 1 eng |
| | Create fixtures | 2.5 hrs | 1 eng |
| | Verify infrastructure | 1.5 hrs | 1 eng |
| **Subtotal Phase 1** | | **5 hrs** | |
| **2: Core Tests** | Full auth flow tests (15 tests) | 4 hrs | 1 eng |
| | Protected routes tests (12 tests) | 3 hrs | 1 eng |
| | Error handling tests (10 tests) | 2.5 hrs | 1 eng |
| **Subtotal Phase 2** | | **9.5 hrs** | |
| **3: Advanced** | Multi-user tests (7 tests) | 2 hrs | 1 eng |
| | Token management tests (9 tests) | 2 hrs | 1 eng |
| | Security tests (8 tests) | 1.5 hrs | 1 eng |
| **Subtotal Phase 3** | | **5.5 hrs** | |
| **4: Verification** | Final test run & validation | 1 hr | 1 eng |
| | Performance & flakiness | 1 hr | 1 eng |
| | Acceptance criteria check | 1 hr | 1 eng |
| **Subtotal Phase 4** | | **3 hrs** | |
| **5: CI/CD** | GitHub Actions integration | 1 hr | 1 eng |
| **Subtotal Phase 5** | | **1 hr** | |
| **TOTAL** | | **24 hours** | 1 eng |

### Realistic Estimates

- **Optimistic:** 18 hours (experienced dev, no blockers)
- **Realistic:** 24 hours (good pace, minor issues resolved)
- **Pessimistic:** 32 hours (blockers encountered, refactoring needed)

### Timeline (2-Week Sprints)

**Week 1 (April 22-26):**
- Day 1-2: Phase 1 Setup (5 hrs completed in 1.5 days with buffers)
- Day 3-5: Phase 2 Core Tests (9.5 hrs completed in 2.5 days)
- **Total Week 1: 14.5 hours**

**Week 2 (April 29-May 3):**
- Day 1-2: Phase 3 Advanced Tests (5.5 hrs completed in 1.5 days)
- Day 3: Phase 4 Verification (3 hrs)
- Day 4: Phase 5 CI/CD (1 hr)
- Day 5: Buffer / Code review / Fixes
- **Total Week 2: 9.5 hours + buffer**

**Completion Target:** Friday, May 2, 2026

### Team Allocation

**Primary:** 1 Senior Software Engineer (24 hours)
**Secondary:** Optional QA Lead for verification (2-3 hours)
**Code Review:** Engineering Manager (2-3 hours)

---

## REFERENCES

### Related GitHub Issues
- **#27**: JWT Authentication Complete (parent issue)
- **#118**: Backend JWT Middleware ✅ DONE
- **#119**: Frontend Auth Context & Apollo Link ✅ DONE
- **#120**: Frontend Login Component & User Flow ✅ DONE

### Documentation Files
- **docs/JWT_AUTH_ORCHESTRATION_PLAN.md** - Overall architecture
- **CLAUDE.md** - Development guide and debugging tips
- **DESIGN.md** - Dual-backend architecture

### Code References
- **frontend/lib/auth-context.tsx** - Auth context implementation
- **backend-graphql/src/middleware/auth.ts** - JWT middleware
- **backend-graphql/src/resolvers/Mutation.ts** - Login mutation
- **frontend/__tests__/apollo-wrapper.test.tsx** - Existing Apollo tests
- **backend-graphql/src/middleware/__tests__/auth.test.ts** - Existing auth tests
- **backend-graphql/src/resolvers/__tests__/auth-check.test.ts** - Existing resolver tests

### Test Framework Documentation
- **Vitest:** https://vitest.dev/
- **React Testing Library:** https://testing-library.com/react
- **Apollo Testing:** https://www.apollographql.com/docs/react/development-testing/
- **Supertest:** https://github.com/visionmedia/supertest

### JWT & Authentication References
- **JWT.io:** https://jwt.io/ - Token format and validation
- **jsonwebtoken npm:** https://www.npmjs.com/package/jsonwebtoken
- **OWASP Authentication Cheat Sheet:** https://cheatsheetseries.owasp.org/

---

## APPENDIX: TEST CHECKLIST

### Pre-Implementation Checklist

- [ ] All issues #118, #119, #120 verified complete
- [ ] Existing tests passing: `pnpm test --run`
- [ ] No TypeScript errors: `pnpm build`
- [ ] Dependencies installed: `pnpm install`
- [ ] Test configuration reviewed and understood
- [ ] GitHub issue #121 fully understood
- [ ] Test plan reviewed by team

### Implementation Checklist

**Phase 1 Setup:**
- [ ] Create fixture directories
- [ ] Create helper functions
- [ ] Update vitest config
- [ ] Verify setup works with simple test

**Phase 2 Core Tests:**
- [ ] full-auth-flow.test.tsx created (15 tests)
- [ ] protected-routes.test.tsx created (12 tests)
- [ ] auth-errors.test.tsx created (10 tests)
- [ ] All tests passing locally
- [ ] No TypeScript errors

**Phase 3 Advanced Tests:**
- [ ] multi-user.test.tsx created (7 tests)
- [ ] token-mgmt.test.ts created (9 tests)
- [ ] security-edge-cases.test.tsx created (8 tests)
- [ ] All tests passing locally
- [ ] No TypeScript errors

**Phase 4 Verification:**
- [ ] All tests pass: 61/61 ✅
- [ ] Coverage ≥90%
- [ ] No flaky tests (3 runs)
- [ ] Performance < 120 seconds
- [ ] All 11 #27 criteria covered
- [ ] All 8 #121 criteria covered

**Phase 5 CI/CD:**
- [ ] GitHub Actions updated
- [ ] Tests run on PR
- [ ] Tests required for merge
- [ ] Results visible on GitHub

### Post-Implementation Checklist

- [ ] Pull request created
- [ ] Code review passed
- [ ] All feedback addressed
- [ ] Tests pass in CI
- [ ] Merged to main
- [ ] Deployment verified
- [ ] Monitoring set up
- [ ] Documentation updated

---

**Document Version:** 1.0  
**Last Updated:** April 21, 2026  
**Next Review:** After Phase 1 completion  
**Author:** Copilot QA Lead  
**Status:** Ready for Implementation ✅
