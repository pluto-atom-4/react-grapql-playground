# ISSUE #121 Integration Testing & End-to-End Validation
## Comprehensive Implementation Planning Document

**Project:** react-grapql-playground  
**Issue:** #121 (Subtask 4 of Issue #27)  
**Type:** Integration Testing & E2E Validation  
**Status:** Ready to Implement  
**Created:** April 21, 2026  
**Target Completion:** April 23, 2026

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Dependencies](#dependencies)
3. [Implementation Phases](#implementation-phases)
4. [Test Structure](#test-structure)
5. [Testing Strategy](#testing-strategy)
6. [Acceptance Criteria Mapping](#acceptance-criteria-mapping)
7. [Risk Assessment](#risk-assessment)
8. [Time Breakdown](#time-breakdown)
9. [Success Metrics](#success-metrics)
10. [Quick Reference Commands](#quick-reference-commands)

---

## OVERVIEW

### What Will Be Implemented

**Goal**: Complete end-to-end testing and validation of the JWT authentication implementation across all three layers:
- **Frontend**: React + Apollo Client + AuthContext
- **Backend (GraphQL)**: Apollo Server with JWT middleware
- **Backend (Express)**: Auxiliary server with protected routes

### Why This Matters

Issue #121 is the **final validation stage** of the JWT authentication feature (Issue #27). It ensures:
1. All 11 acceptance criteria from #27 are verified and working
2. Complete authentication flow works end-to-end (login → dashboard → logout)
3. Security is maintained (protected queries reject unauthenticated requests)
4. Type safety is preserved (TypeScript build succeeds)
5. All tests pass with high code coverage

### Interview Value

This phase demonstrates:
- **Testing Strategy**: Multi-layer integration testing approach
- **Quality Assurance**: Comprehensive test coverage across stack layers
- **End-to-End Thinking**: Validating entire user flows, not just isolated components
- **Production Readiness**: Tests that catch real-world integration issues

---

## DEPENDENCIES

### Prerequisites (Must Be Complete)

| Dependency | Status | Issue | Description |
|------------|--------|-------|-------------|
| Backend JWT Middleware | ✅ DONE | #118 | JWT validation in Apollo Server context |
| Frontend AuthContext | ✅ DONE | #119 | useAuth hook, login/logout functions |
| Frontend Apollo Auth Link | ✅ DONE | #119 | Automatic token injection into headers |
| Frontend Login Component | ✅ DONE | #120 | User login form and flow |
| Backend Login Resolver | ✅ DONE | #118 | `mutation login()` returns JWT token |
| Protected Resolvers | ✅ DONE | #118 | Queries/mutations check `context.user` |
| Database Schema | ✅ DONE | Core | User table with email, password hash |

### Blockers

**None** - All prerequisites are complete. Issue #121 can start immediately.

### Prerequisites for Running Tests

```bash
# Database
docker-compose up -d                    # Start PostgreSQL
pnpm migrate                            # Run migrations
pnpm seed                               # Populate seed data (optional)

# Dependencies
pnpm install                            # Install all dependencies
pnpm build                              # Build all packages (TypeScript)

# Services must be running for integration tests
pnpm dev                                # Start all services (3000, 4000, 5000)
```

---

## IMPLEMENTATION PHASES

### Phase 1: Unit Test Verification & Gap Analysis (1-2 hours)

**Goal**: Verify existing unit tests are comprehensive, identify gaps

**Tasks**:

1. **Review Existing Unit Tests**
   - ✅ `backend-graphql/src/middleware/__tests__/auth.test.ts` (JWT token validation)
   - ✅ `backend-graphql/src/resolvers/__tests__/Mutation.login.test.ts` (login resolver)
   - ✅ `frontend/lib/__tests__/auth-context.test.tsx` (AuthContext state management)
   - ✅ `frontend/components/__tests__/login-form.test.tsx` (login form component)

2. **Verify Coverage**
   ```bash
   pnpm test:graphql --coverage          # Check GraphQL auth middleware coverage
   pnpm test:frontend --coverage         # Check frontend auth coverage
   ```

3. **Document Gaps** (if any)
   - Are resolver error cases tested? (invalid credentials, user not found)
   - Is token refresh tested?
   - Is Apollo link error handling tested?

4. **Success Criteria**
   - All unit tests pass: `pnpm test:graphql && pnpm test:frontend`
   - No critical test gaps identified
   - Coverage ≥85% for auth-related code

---

### Phase 2: Integration Tests - Auth Flow (2-3 hours)

**Goal**: Test frontend + backend communication end-to-end

**Tasks**:

1. **Create: Full Auth Flow Integration Test**
   - **File**: `frontend/__tests__/integration/full-auth-flow.test.tsx`
   - **Description**: Complete login → dashboard → protected query → logout flow
   - **Tests to include**:
     - User logs in with email/password
     - Frontend receives JWT token
     - Token stored in localStorage
     - Apollo Client automatically injects token in subsequent queries
     - Dashboard queries execute successfully
     - User logs out
     - Token removed from localStorage
     - Redirected to login page

2. **Create: Protected Routes Test**
   - **File**: `frontend/__tests__/integration/protected-routes.test.tsx`
   - **Description**: Verify protected pages are inaccessible without auth
   - **Tests to include**:
     - Dashboard page redirects to login when not authenticated
     - Protected query fails with 401 when token missing
     - Protected query succeeds with valid token
     - Invalid token rejected with appropriate error

3. **Create: Auth Error Handling Test**
   - **File**: `frontend/__tests__/integration/auth-errors.test.tsx`
   - **Description**: Verify error scenarios
   - **Tests to include**:
     - Invalid credentials show error message
     - Expired token triggers reauthentication
     - Network error during login handled gracefully
     - GraphQL error response shows to user

4. **Create: Token Management Test**
   - **File**: `backend-graphql/src/resolvers/__tests__/token-management.test.ts`
   - **Description**: Test token generation, validation, refresh
   - **Tests to include**:
     - Token generated with correct payload
     - Token includes user ID and email
     - Token includes expiration (24 hours)
     - Token can be used for multiple requests
     - Token validation rejects expired tokens
     - Token validation rejects malformed tokens

**Setup Requirements**:

```bash
# Start services in separate terminals:
Terminal 1: pnpm dev:graphql
Terminal 2: pnpm dev:frontend
Terminal 3: pnpm dev:express

# Or use single command:
pnpm dev
```

**Success Criteria**:
- All new integration tests pass
- Full auth flow completes without errors
- Protected queries reject unauthenticated requests
- Error messages are user-friendly

---

### Phase 3: Security & Edge Case Tests (1-2 hours)

**Goal**: Verify security properties and handle edge cases

**Tasks**:

1. **Create: Security Edge Cases Test**
   - **File**: `frontend/__tests__/integration/security-edge-cases.test.tsx`
   - **Description**: XSS prevention, token exposure, CSRF
   - **Tests to include**:
     - Token never exposed in URL (always in header)
     - Token not logged to console
     - localStorage used (not cookies) - noted as MVP limitation
     - Multiple browser tabs/windows share token
     - Concurrent requests don't lose token
     - Token cleared on logout across all tabs

2. **Create: Multi-User Scenarios Test**
   - **File**: `frontend/__tests__/integration/multi-user.test.tsx`
   - **Description**: Verify user isolation and data boundaries
   - **Tests to include**:
     - User A can't see User B's builds
     - User A token doesn't access User B's resources
     - Login as different user clears previous session
     - Multiple concurrent users don't interfere

3. **Create: Race Condition Tests**
   - **File**: `frontend/__tests__/integration/race-conditions.test.tsx`
   - **Description**: Verify behavior under concurrent operations
   - **Tests to include**:
     - Simultaneous login attempts handled correctly
     - Logout during in-flight request handled gracefully
     - Token refresh doesn't cause race conditions
     - Multiple mutations don't corrupt state

**Success Criteria**:
- All security tests pass
- No token exposure vulnerabilities identified
- User isolation verified
- Race conditions handled correctly

---

### Phase 4: End-to-End User Flow Tests (1-2 hours)

**Goal**: Test complete real-world user scenarios

**Tasks**:

1. **Create: Login Flow E2E Test**
   - **File**: `frontend/__tests__/e2e/login-flow.test.ts` (or using Playwright)
   - **Scenario**: User visits app → enters credentials → redirected to dashboard
   - **Verifications**:
     - Login page renders
     - Email/password input accepts values
     - Submit button sends request
     - Token received and stored
     - Redirected to dashboard
     - Dashboard loads user's data
     - User name displayed in header

2. **Create: Dashboard with Protected Data E2E Test**
   - **File**: `frontend/__tests__/e2e/dashboard.test.ts`
   - **Scenario**: Authenticated user views builds, parts, test results
   - **Verifications**:
     - Builds list queries GraphQL
     - Data displayed correctly
     - Can click on build details
     - Protected queries require token
     - Stale data not cached after logout

3. **Create: Logout Flow E2E Test**
   - **File**: `frontend/__tests__/e2e/logout-flow.test.ts`
   - **Scenario**: User clicks logout → redirected to login → can't access dashboard
   - **Verifications**:
     - Logout button visible
     - Clicking logout succeeds
     - Redirected to login page
     - Attempting to access dashboard redirects to login
     - Token removed from localStorage

4. **Create: Error Recovery E2E Test**
   - **File**: `frontend/__tests__/e2e/error-recovery.test.ts`
   - **Scenario**: User handles network/auth errors gracefully
   - **Verifications**:
     - Network error shows retry button
     - Invalid credentials show error message
     - User can retry login after error
     - App doesn't crash on 401 response

**Implementation Note**: E2E tests can use either:
- **Option A**: Vitest with `supertest` for HTTP testing
- **Option B**: Playwright for full browser automation
- **Recommended**: Start with Vitest (faster), add Playwright if time permits

**Success Criteria**:
- All E2E flows complete without errors
- Real browser experience validated
- Error scenarios handled gracefully
- Page redirects work correctly

---

### Phase 5: Acceptance Criteria Verification (1 hour)

**Goal**: Systematically verify all 11 acceptance criteria from Issue #27

**Tasks**:

1. **Create: Acceptance Criteria Verification Test Suite**
   - **File**: `frontend/__tests__/acceptance-criteria.test.ts`
   - **Purpose**: One test per criterion, directly mapped to Issue #27

2. **Run Full Test Suite**
   ```bash
   pnpm test                             # All tests across all packages
   pnpm test:frontend                    # Frontend only
   pnpm test:graphql                     # GraphQL only
   pnpm test:express                     # Express only
   ```

3. **Verify TypeScript Build**
   ```bash
   pnpm build                            # Should pass without errors
   ```

4. **Generate Coverage Report**
   ```bash
   pnpm test --coverage                  # Should show ≥90% coverage for auth code
   ```

**Success Criteria**:
- All 11 acceptance criteria have corresponding passing tests
- No TypeScript errors
- Build succeeds
- Coverage ≥90% for authentication-related code

---

### Phase 6: Documentation & Final Verification (30 mins)

**Goal**: Document testing approach and verify everything works

**Tasks**:

1. **Create: Test Documentation**
   - **File**: `docs/TESTING_JWT_AUTH.md`
   - **Content**:
     - How to run all tests
     - How to run specific test suites
     - How to debug failing tests
     - Coverage targets and current status
     - Known limitations and workarounds

2. **Create: Troubleshooting Guide**
   - **File**: `docs/TESTING_JWT_AUTH_TROUBLESHOOTING.md`
   - **Content**:
     - Common test failures and solutions
     - How to reset test database
     - How to debug GraphQL queries
     - How to inspect Apollo cache

3. **Final Verification**
   ```bash
   # Run this checklist:
   pnpm clean                            # Clean all builds
   pnpm install                          # Fresh install
   pnpm build                            # Build all packages
   pnpm test                             # Run all tests
   pnpm lint                             # Check linting
   ```

4. **Document Results**
   - Verify all tests pass
   - Document any known issues
   - Create issue for follow-up work if needed

**Success Criteria**:
- Complete documentation exists
- Troubleshooting guide helps future developers
- Final verification passes

---

## TEST STRUCTURE

### Test Organization by Layer

#### Frontend Tests

```
frontend/__tests__/
├── integration/
│   ├── full-auth-flow.test.tsx              # Login → Dashboard → Logout
│   ├── protected-routes.test.tsx            # Protected page access control
│   ├── auth-errors.test.tsx                 # Error scenarios
│   ├── security-edge-cases.test.tsx         # Token exposure, XSS prevention
│   └── multi-user.test.tsx                  # User isolation
├── e2e/
│   ├── login-flow.test.ts                   # Real browser login
│   ├── dashboard.test.ts                    # Dashboard with data
│   ├── logout-flow.test.ts                  # Full logout flow
│   └── error-recovery.test.ts               # Error handling
├── acceptance-criteria.test.ts              # Direct criteria mapping
└── (existing)
    ├── components/__tests__/login-form.test.tsx
    └── lib/__tests__/auth-context.test.tsx
```

#### Backend GraphQL Tests

```
backend-graphql/src/
├── middleware/__tests__/
│   └── auth.test.ts                        # JWT validation (existing)
├── resolvers/__tests__/
│   ├── Mutation.login.test.ts              # Login resolver (existing)
│   ├── token-management.test.ts            # New: token generation & validation
│   └── auth-check.test.ts                  # Protected resolver verification
└── __tests__/
    └── integration.test.ts                  # Full GraphQL integration
```

#### Backend Express Tests

```
backend-express/__tests__/
├── middleware.test.ts                      # Auth middleware (if needed)
├── protected-routes.test.ts                # Protected endpoint tests
└── error-handling.test.ts                  # Error scenarios
```

### Test Naming Convention

```
describe('Feature Name', () => {
  describe('User Scenario', () => {
    it('should [expected behavior] when [condition]', () => {
      // AAA pattern: Arrange, Act, Assert
    });
  });
});

// Examples:
describe('Authentication Flow', () => {
  describe('Login', () => {
    it('should store token in localStorage when login succeeds', () => {});
    it('should redirect to dashboard when login succeeds', () => {});
    it('should show error message when credentials invalid', () => {});
  });
});
```

### Test Data & Fixtures

#### Login Test User

```typescript
export const TEST_USER = {
  id: 'test-user-123',
  email: 'test@example.com',
  password: 'SecurePassword123!',
  passwordHash: 'bcrypt-hash-here', // Pre-computed for database
};

export const INVALID_USER = {
  email: 'nonexistent@example.com',
  password: 'WrongPassword',
};

export const MOCK_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

#### Mock Responses

```typescript
export const MOCK_LOGIN_RESPONSE = {
  data: {
    login: {
      token: MOCK_JWT_TOKEN,
      user: {
        id: TEST_USER.id,
        email: TEST_USER.email,
      },
    },
  },
};

export const MOCK_PROTECTED_QUERY_RESPONSE = {
  data: {
    builds: [
      { id: 'build-1', status: 'RUNNING' },
      { id: 'build-2', status: 'COMPLETE' },
    ],
  },
};
```

---

## TESTING STRATEGY

### Layer-by-Layer Approach

#### 1. Unit Tests (Quick, Isolated)

**Focus**: Individual functions and components

**Examples**:
- `extractUserFromToken()` correctly parses JWT
- `useAuth()` hook manages state correctly
- Login form validates input

**Command**: `pnpm test:frontend && pnpm test:graphql`

**Speed**: < 10 seconds

---

#### 2. Integration Tests (Medium, Multi-Layer)

**Focus**: Frontend + Backend communication

**Examples**:
- Frontend sends login request → Backend validates → Returns token
- Frontend stores token → Includes in next request → Query succeeds
- Backend rejects request without token

**Command**: `pnpm test:integration`

**Speed**: 30-60 seconds

**Setup**:
```bash
# Ensure services running:
pnpm dev  # Starts frontend (3000), GraphQL (4000), Express (5000)

# Or start individually:
pnpm dev:frontend &
pnpm dev:graphql &
pnpm dev:express &
```

---

#### 3. End-to-End Tests (Slow, Real Browser)

**Focus**: Complete user flows

**Examples**:
- User opens app → logs in → sees dashboard → logs out
- User without token redirected to login
- Protected page inaccessible without auth

**Command**: `pnpm test:e2e`

**Speed**: 2-3 minutes (includes browser startup)

**Implementation Options**:
- Option A: Vitest + supertest (HTTP-level, faster)
- Option B: Playwright (browser-level, slower but more realistic)

---

### Test Execution Strategy

#### Running All Tests

```bash
# Everything
pnpm test

# Frontend only
pnpm test:frontend

# GraphQL backend only
pnpm test:graphql

# Express backend only
pnpm test:express

# Integration tests only
pnpm test:integration

# E2E tests only
pnpm test:e2e

# Watch mode (auto-rerun on file change)
pnpm test --watch

# With coverage
pnpm test --coverage
```

#### Debugging Failed Tests

```bash
# Run single test file
pnpm test auth-context.test.tsx

# Run with verbose output
pnpm test --reporter=verbose

# Watch specific test
pnpm test auth-context.test.tsx --watch

# Debug in Node.js
node --inspect-brk ./node_modules/vitest/vitest.mjs

# View GraphQL schema in GraphiQL
# Navigate to http://localhost:4000/graphql
```

---

## ACCEPTANCE CRITERIA MAPPING

### All 11 Acceptance Criteria from Issue #27

| # | Criterion | Test File | Test Case | Status |
|---|-----------|-----------|-----------|--------|
| 1 | JWT token stored in localStorage on successful login | `frontend/__tests__/integration/full-auth-flow.test.tsx` | should persist token to localStorage after login | ❌ NEW |
| 2 | AuthContext created with login/logout functions | `frontend/lib/__tests__/auth-context.test.tsx` | AuthProvider exports useAuth hook | ✅ EXISTING |
| 3 | Apollo Client attaches Authorization header to all requests | `frontend/__tests__/integration/full-auth-flow.test.tsx` | token injected in Authorization header | ❌ NEW |
| 4 | Login component accepts email/password input | `frontend/components/__tests__/login-form.test.tsx` | form accepts email and password | ✅ EXISTING |
| 5 | Backend validates JWT on all GraphQL queries | `backend-graphql/src/__tests__/integration.test.ts` | protected query fails without token | ❌ NEW |
| 6 | Unauthenticated requests rejected with proper error | `frontend/__tests__/integration/auth-errors.test.tsx` | missing token returns 401 error | ❌ NEW |
| 7 | User context available in resolvers (context.user) | `backend-graphql/src/middleware/__tests__/auth.test.ts` | context.user populated from token | ✅ EXISTING |
| 8 | Protected queries/mutations verify user authentication | `backend-graphql/src/resolvers/__tests__/Mutation.login.test.ts` | resolver checks context.user | ✅ EXISTING |
| 9 | Logout clears token and redirects to login | `frontend/__tests__/integration/full-auth-flow.test.tsx` | logout removes token and redirects | ❌ NEW |
| 10 | TypeScript builds without errors | (continuous during implementation) | `pnpm build` succeeds | ⏳ ONGOING |
| 11 | All tests pass | (all test files) | `pnpm test` succeeds with 100% pass rate | ❌ NEW |

### Test Case Details

#### Criterion 1: JWT Token Storage

**Test**: `login-stores-token.test.tsx`
```typescript
it('should store JWT token in localStorage on successful login', async () => {
  // 1. User logs in with valid credentials
  // 2. Backend returns JWT token
  // 3. Frontend stores token: localStorage.setItem('auth_token', token)
  // 4. Verify: localStorage.getItem('auth_token') === token
});
```

---

#### Criterion 3: Authorization Header Injection

**Test**: `apollo-auth-link.test.tsx`
```typescript
it('should inject Authorization header in all requests', async () => {
  // 1. Store token in context/localStorage
  // 2. Execute GraphQL query
  // 3. Intercept HTTP request
  // 4. Verify: Authorization header = 'Bearer <token>'
});
```

---

#### Criterion 5: JWT Validation on Backend

**Test**: `protected-queries.test.ts`
```typescript
it('should validate JWT on all protected GraphQL queries', async () => {
  // 1. Execute query without Authorization header
  // 2. Verify: Returns GraphQL error "Unauthorized"
  // 3. Execute query with valid token
  // 4. Verify: Query succeeds and returns data
});
```

---

#### Criterion 6: Unauthenticated Request Rejection

**Test**: `auth-errors.test.tsx`
```typescript
it('should reject unauthenticated requests with 401 error', async () => {
  // 1. Try to access protected endpoint without token
  // 2. Verify: Receives 401 Unauthorized error
  // 3. Verify: Error message is "Authentication required"
});
```

---

#### Criterion 9: Logout Flow

**Test**: `logout-flow.test.tsx`
```typescript
it('should clear token and redirect to login on logout', async () => {
  // 1. User logged in (token in localStorage)
  // 2. Click logout button
  // 3. Verify: Token removed from localStorage
  // 4. Verify: Redirected to login page
  // 5. Verify: Can't access dashboard (redirected to login)
});
```

---

## RISK ASSESSMENT

### Potential Issues & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| **Flaky tests** due to timing issues | Test suite unreliable | Medium | Use `waitFor()` with explicit conditions, avoid `setTimeout()` |
| **Environment variable not set** (JWT_SECRET) | Tests fail in isolation | Low | Create `.env.test` with test secrets, document in README |
| **Database in wrong state** | Tests fail intermittently | Medium | Use `beforeEach()` to seed clean data, `afterEach()` to cleanup |
| **Services not running** | Integration tests fail | High | Create setup script, document in phase description |
| **Apollo cache pollution** | Tests interfere with each other | Medium | Clear cache in `beforeEach()`, use unique test IDs |
| **Token expiration during test** | Test fails randomly | Low | Use long-lived tokens in tests, or mock time |
| **Concurrent test execution** | Port conflicts, data conflicts | Medium | Configure Vitest to run sequentially for integration tests |
| **localStorage not available** | Browser tests fail in Node.js | Low | Already mocked in existing tests, verify in new tests |
| **CORS issues** in integration tests | Can't call API from test | Low | Ensure backend CORS is configured for localhost |
| **Mock data out of sync** with database schema | Tests use wrong data shape | Medium | Use TypeScript types for mock data, validate before tests |

### Mitigation Strategies

#### 1. Prevent Flaky Tests

```typescript
// ❌ BAD: Fixed timing
setTimeout(() => {
  expect(result).toBeDefined();
}, 1000);

// ✅ GOOD: Wait for condition
await waitFor(() => {
  expect(result).toBeDefined();
}, { timeout: 5000 });
```

#### 2. Clean Database Between Tests

```typescript
beforeEach(async () => {
  // Reset database to clean state
  await db.resetSequence();
  await db.seed(TEST_DATA);
});

afterEach(async () => {
  // Cleanup after test
  await db.clear();
});
```

#### 3. Isolate Environment Variables

```bash
# .env.test (not committed)
JWT_SECRET=test-secret-key-for-tests
DATABASE_URL=postgresql://test:test@localhost:5432/boltline_test
NODE_ENV=test
```

#### 4. Clear Apollo Cache

```typescript
beforeEach(() => {
  client.cache.reset();
});
```

#### 5. Mock External Services

```typescript
// Mock time for token expiration
vi.useFakeTimers();
vi.setSystemTime(new Date('2026-04-22'));

// After test
vi.restoreAllMocks();
```

---

## TIME BREAKDOWN

### Effort Estimation by Phase

| Phase | Duration | Details | Key Tasks |
|-------|----------|---------|-----------|
| **Phase 1** | 1-2 hrs | Review existing tests | Review, verify coverage, identify gaps |
| **Phase 2** | 2-3 hrs | Integration tests | Full auth flow, protected routes, errors, tokens |
| **Phase 3** | 1-2 hrs | Security & edge cases | XSS prevention, user isolation, race conditions |
| **Phase 4** | 1-2 hrs | E2E tests | Login, dashboard, logout, error recovery |
| **Phase 5** | 1 hr | Acceptance criteria | Map all 11 criteria, verify tests |
| **Phase 6** | 30 min | Documentation | Test guide, troubleshooting, final verification |
| **TOTAL** | **6.5-10 hrs** | Realistic estimate | Includes debugging and iteration |

### Day-by-Day Timeline

#### Day 1 (April 22, 2026): Foundation & Integration Tests

- **9:00-10:30** (1.5 hrs): Phase 1 - Review unit tests
  - Review existing test files
  - Check coverage
  - Identify gaps
  
- **10:30-12:00** (1.5 hrs): Phase 2 Part A - Full Auth Flow
  - Create `full-auth-flow.test.tsx`
  - Test login → token storage → dashboard access
  - Debug any failures
  
- **13:00-14:30** (1.5 hrs): Phase 2 Part B - Protected Routes
  - Create `protected-routes.test.tsx`
  - Test 401 responses
  - Test token injection
  
- **14:30-16:00** (1.5 hrs): Phase 2 Part C - Error Handling
  - Create `auth-errors.test.tsx`
  - Test invalid credentials
  - Test network errors

**Day 1 Deliverable**: All integration tests passing ✅

#### Day 2 (April 23, 2026): Security, E2E & Acceptance

- **9:00-10:00** (1 hr): Phase 3 - Security Tests
  - Create `security-edge-cases.test.tsx`
  - Create `multi-user.test.tsx`
  - Verify no token exposure
  
- **10:00-11:30** (1.5 hrs): Phase 4 Part A - E2E Login
  - Create `login-flow.test.ts` or Playwright test
  - Test full browser experience
  
- **11:30-12:30** (1 hr): Phase 4 Part B - E2E Dashboard & Logout
  - Create `dashboard.test.ts`
  - Create `logout-flow.test.ts`
  
- **13:00-14:00** (1 hr): Phase 5 - Acceptance Criteria
  - Map all 11 criteria to tests
  - Run full test suite
  - Verify TypeScript build
  
- **14:00-14:30** (30 min): Phase 6 - Documentation
  - Create test guide
  - Create troubleshooting doc
  - Final verification

**Day 2 Deliverable**: All 11 acceptance criteria verified, all tests passing, ready for production ✅

---

## SUCCESS METRICS

### Test Coverage

| Component | Target | Current | Method |
|-----------|--------|---------|--------|
| Auth middleware | ≥95% | 75% | `pnpm test:graphql --coverage` |
| AuthContext | ≥95% | 85% | `pnpm test:frontend --coverage` |
| Login resolver | ≥95% | 80% | `pnpm test:graphql --coverage` |
| Apollo Auth Link | ≥85% | 70% | `pnpm test:frontend --coverage` |
| **Overall auth code** | **≥90%** | ~75% | `pnpm test --coverage` |

### Test Performance

| Metric | Target | Status |
|--------|--------|--------|
| Unit test suite time | < 30 seconds | ⏳ TBD |
| Integration test time | < 60 seconds | ⏳ TBD |
| E2E test time | < 180 seconds | ⏳ TBD |
| Total test time | < 300 seconds | ⏳ TBD |
| No flaky tests | 100% reliable | ⏳ TBD |

### Test Pass Rate

| Suite | Target | Current |
|-------|--------|---------|
| Unit tests | 100% | ✅ 90%+ |
| Integration tests | 100% | ❌ 0% (not yet written) |
| E2E tests | 100% | ❌ 0% (not yet written) |
| **Overall** | **100%** | ⏳ TBD |

### Acceptance Criteria Verification

✅ All 11 criteria from Issue #27 verified:
- [ ] 1: JWT token storage
- [ ] 2: AuthContext implementation
- [ ] 3: Apollo auth header injection
- [ ] 4: Login component
- [ ] 5: Backend JWT validation
- [ ] 6: Unauthenticated rejection
- [ ] 7: User context in resolvers
- [ ] 8: Protected query verification
- [ ] 9: Logout flow
- [ ] 10: TypeScript build success
- [ ] 11: All tests pass

### Production Readiness Checklist

- [ ] All tests pass: `pnpm test`
- [ ] TypeScript builds: `pnpm build`
- [ ] Code coverage ≥90%: `pnpm test --coverage`
- [ ] No security vulnerabilities
- [ ] Documentation complete
- [ ] Troubleshooting guide created
- [ ] Developer runbook for adding auth tests to new features

---

## QUICK REFERENCE COMMANDS

### Setup & Prerequisites

```bash
# Initial setup
git clone <repo>
cd react-grapql-playground

# Install dependencies
pnpm install

# Start services (required for integration tests)
pnpm dev                                # All services
pnpm dev:frontend &                     # Frontend only
pnpm dev:graphql &                      # GraphQL only
pnpm dev:express &                      # Express only

# Database setup
docker-compose up -d                    # Start PostgreSQL
pnpm migrate                            # Run migrations
pnpm seed                               # Seed test data
```

### Running Tests

```bash
# All tests
pnpm test

# By package
pnpm test:frontend
pnpm test:graphql
pnpm test:express

# Specific test file
pnpm test auth-context.test.tsx

# Watch mode
pnpm test --watch

# With coverage
pnpm test --coverage

# Verbose output
pnpm test --reporter=verbose
```

### Debugging

```bash
# Check if services are running
curl http://localhost:3000            # Frontend
curl http://localhost:4000/graphql    # GraphQL IDE
curl http://localhost:5000            # Express

# View GraphQL schema
# Open: http://localhost:4000/graphql

# Check database
docker exec -it postgres psql -U user -d boltline
\dt                                   # List tables
SELECT * FROM users LIMIT 5;          # View users

# Clean everything and start fresh
pnpm clean
pnpm install
pnpm build
pnpm test

# Debug Node.js test
node --inspect-brk ./node_modules/vitest/vitest.mjs
```

### Building & Verification

```bash
# Type checking
pnpm build                            # Full build
pnpm type-check                       # TypeScript only

# Linting
pnpm lint                             # Check
pnpm lint:fix                         # Auto-fix

# Full verification
pnpm clean && \
pnpm install && \
pnpm build && \
pnpm test && \
pnpm lint
```

---

## EXAMPLE TEST IMPLEMENTATIONS

### Example 1: Full Auth Flow Integration Test

**File**: `frontend/__tests__/integration/full-auth-flow.test.tsx`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { AuthProvider } from '../../lib/auth-context';
import App from '../../app/page';

describe('Full Authentication Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should complete login → dashboard → logout flow', async () => {
    const { user } = userEvent.setup();
    
    // Render app with mocked Apollo provider
    render(
      <MockedProvider mocks={MOCK_QUERIES}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MockedProvider>
    );

    // 1. Should show login page
    expect(screen.getByText(/login/i)).toBeInTheDocument();

    // 2. Enter credentials
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /login/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // 3. Submit login form
    await user.click(submitBtn);

    // 4. Token should be stored
    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBeTruthy();
    });

    // 5. Should redirect to dashboard
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    // 6. Logout
    const logoutBtn = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutBtn);

    // 7. Token should be cleared
    expect(localStorage.getItem('auth_token')).toBeNull();

    // 8. Should redirect to login
    await waitFor(() => {
      expect(screen.getByText(/login/i)).toBeInTheDocument();
    });
  });
});
```

### Example 2: Protected Query Test

**File**: `frontend/__tests__/integration/protected-routes.test.tsx`

```typescript
it('should reject unauthenticated queries with 401', async () => {
  // Clear token
  localStorage.removeItem('auth_token');

  const { result } = renderHook(() => useQuery(GET_BUILDS), {
    wrapper: ApolloWrapper,
  });

  // Wait for query to fail
  await waitFor(() => {
    expect(result.current.error).toBeDefined();
  });

  // Verify error is authentication error
  expect(result.current.error?.message).toContain('Unauthorized');
});

it('should succeed with valid token', async () => {
  // Store token
  localStorage.setItem('auth_token', MOCK_TOKEN);

  const { result } = renderHook(() => useQuery(GET_BUILDS), {
    wrapper: ApolloWrapper,
  });

  // Wait for data
  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });

  // Verify data structure
  expect(result.current.data.builds).toHaveLength(2);
});
```

### Example 3: GraphQL Backend Test

**File**: `backend-graphql/src/resolvers/__tests__/token-management.test.ts`

```typescript
describe('Token Management', () => {
  it('should generate token with user ID and email', () => {
    const token = generateToken('user-123', 'test@example.com');

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    expect(decoded.id).toBe('user-123');
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.exp).toBeDefined();
  });

  it('should validate correct token', () => {
    const token = generateToken('user-123');
    const authHeader = `Bearer ${token}`;

    const user = extractUserFromToken(authHeader);

    expect(user).not.toBeNull();
    expect(user!.id).toBe('user-123');
  });

  it('should reject expired token', () => {
    const expiredToken = jwt.sign(
      { id: 'user-123' },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );
    const authHeader = `Bearer ${expiredToken}`;

    expect(() => extractUserFromToken(authHeader)).toThrow('Token expired');
  });
});
```

---

## RELATED DOCUMENTATION

- **Parent Issue**: Issue #27 - JWT Authentication Implementation
- **Sub-tasks**: 
  - Issue #118 - Backend JWT Middleware ✅
  - Issue #119 - Frontend Auth Context & Apollo Link ✅
  - Issue #120 - Frontend Login Component & User Flow ✅
- **Reference**: `docs/implementation-planning/JWT_AUTH_ORCHESTRATION_PLAN.md`
- **Testing Guides**: `CLAUDE.md`, `DESIGN.md`

---

## NEXT STEPS

### To Start Implementation:

1. **Review this document** - Understand overall strategy
2. **Phase 1**: Review existing unit tests (1-2 hrs)
3. **Phase 2**: Create integration tests (2-3 hrs)
4. **Phase 3**: Create security/edge case tests (1-2 hrs)
5. **Phase 4**: Create E2E tests (1-2 hrs)
6. **Phase 5**: Verify all acceptance criteria (1 hr)
7. **Phase 6**: Document and finalize (30 min)

### Success Looks Like:

```bash
✅ pnpm test           # All tests passing
✅ pnpm build          # TypeScript builds
✅ pnpm lint           # Code quality
✅ Coverage ≥90%       # Auth code well-tested
✅ Documentation      # Clear testing guide
```

---

**Document Version**: 1.0  
**Last Updated**: April 21, 2026  
**Status**: Ready to Implement  
**Estimated Completion**: April 23, 2026
