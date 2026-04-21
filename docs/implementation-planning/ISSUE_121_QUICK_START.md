# Issue #121 Quick Start Guide
## Integration Testing & End-to-End Validation - TL;DR

**Version**: 1.0  
**Status**: Ready to Implement  
**Time to Completion**: 6.5-10 hours (over 2 days)

---

## What Are We Testing?

The **complete JWT authentication flow** across all 3 layers:

```
User → Frontend (React) → GraphQL Backend → Express Server
        ↑ Login Form      ↑ JWT Validation  ↑ Protected Routes
        ↓ Store Token     ↓ User Context    ↓ Auth Middleware
```

---

## The 6 Phases at a Glance

| Phase | What | Where | Time | Status |
|-------|------|-------|------|--------|
| **1** | Verify existing unit tests are comprehensive | Review files | 1-2h | Start here |
| **2** | Test frontend + backend communication | `frontend/__tests__/integration/` | 2-3h | Core work |
| **3** | Test security & edge cases | `frontend/__tests__/integration/` | 1-2h | Defensive |
| **4** | Test full user flows (login → dashboard → logout) | `frontend/__tests__/e2e/` | 1-2h | Real-world |
| **5** | Verify all 11 acceptance criteria from #27 | `*/__tests__/acceptance-*.test.ts` | 1h | Verification |
| **6** | Create documentation & troubleshooting | `docs/TESTING_JWT_AUTH.md` | 30min | Complete |

---

## How to Run Tests (Cheat Sheet)

### Before You Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start services (in separate terminals or use pnpm dev)
pnpm dev

# 3. Database ready?
docker-compose up -d
pnpm migrate
```

### During Implementation

```bash
# Run ALL tests
pnpm test

# Run SPECIFIC layer
pnpm test:frontend
pnpm test:graphql
pnpm test:express

# Run SPECIFIC file
pnpm test login-form.test.tsx

# Watch mode (auto-rerun on file change)
pnpm test --watch

# Debug a failing test
pnpm test auth-context.test.tsx --reporter=verbose
```

### After Each Phase

```bash
# Verify TypeScript still builds
pnpm build

# Check linting
pnpm lint:fix

# Full verification
pnpm test && pnpm build && pnpm lint
```

---

## The 11 Acceptance Criteria (All Must Pass)

From Issue #27, each needs a test:

- [ ] 1: JWT token stored in localStorage
- [ ] 2: AuthContext with login/logout functions
- [ ] 3: Apollo Client sends Authorization header
- [ ] 4: Login component accepts email/password
- [ ] 5: Backend validates JWT on queries
- [ ] 6: Rejects requests without token (401 error)
- [ ] 7: User context available in resolvers
- [ ] 8: Protected queries check authentication
- [ ] 9: Logout clears token and redirects
- [ ] 10: TypeScript build succeeds
- [ ] 11: All tests pass

---

## File Structure (What You'll Create)

```
frontend/__tests__/
├── integration/
│   ├── full-auth-flow.test.tsx              ← Login to Logout
│   ├── protected-routes.test.tsx            ← Reject without token
│   ├── auth-errors.test.tsx                 ← Error handling
│   ├── security-edge-cases.test.tsx         ← Token safety
│   └── multi-user.test.tsx                  ← User isolation
├── e2e/
│   ├── login-flow.test.ts                   ← Browser: Login
│   ├── dashboard.test.ts                    ← Browser: Dashboard
│   ├── logout-flow.test.ts                  ← Browser: Logout
│   └── error-recovery.test.ts               ← Browser: Errors
└── acceptance-criteria.test.ts              ← All 11 criteria

backend-graphql/src/resolvers/__tests__/
└── token-management.test.ts                 ← Token generation & validation
```

---

## Each Phase: Step-by-Step

### Phase 1: Review (1-2 hours)

**What to check**:
```bash
# Check coverage of existing tests
pnpm test:graphql --coverage
pnpm test:frontend --coverage

# Look for gaps in:
# - Error handling (invalid credentials, expired tokens)
# - Token refresh scenarios
# - Apollo link header injection
# - Concurrent requests
```

**If something is missing**, add a test. If not, move forward.

---

### Phase 2: Integration Tests (2-3 hours)

**Create 4 files**:

1. **full-auth-flow.test.tsx** - Login → Dashboard → Logout
   ```typescript
   // Test: User logs in with email/password
   // Test: Token stored in localStorage
   // Test: Apollo header has token
   // Test: Dashboard query succeeds
   // Test: Logout clears token
   // Test: Redirected to login
   ```

2. **protected-routes.test.tsx** - Reject without token
   ```typescript
   // Test: Dashboard redirects to login without token
   // Test: Protected query fails with 401 when no token
   // Test: Protected query succeeds with valid token
   ```

3. **auth-errors.test.tsx** - Error scenarios
   ```typescript
   // Test: Invalid credentials show error
   // Test: Expired token handled gracefully
   // Test: Network error retry works
   ```

4. **token-management.test.ts** (Backend)
   ```typescript
   // Test: Token generated with correct payload
   // Test: Token includes expiration
   // Test: Expired token rejected
   ```

---

### Phase 3: Security & Edge Cases (1-2 hours)

**Create 2 files**:

1. **security-edge-cases.test.tsx** - Token safety
   ```typescript
   // Test: Token never in URL
   // Test: Multiple tabs share token
   // Test: Concurrent requests work
   ```

2. **multi-user.test.tsx** - User isolation
   ```typescript
   // Test: User A can't see User B's data
   // Test: Login as different user clears session
   ```

---

### Phase 4: E2E Tests (1-2 hours)

**Create 4 files** (simulated browser tests):

1. **login-flow.test.ts** - Full login
   ```typescript
   // Test: Visit app
   // Test: See login form
   // Test: Enter email/password
   // Test: Click submit
   // Test: See dashboard
   ```

2. **dashboard.test.ts** - Dashboard access
   ```typescript
   // Test: Dashboard shows user's builds
   // Test: Data loaded from GraphQL
   ```

3. **logout-flow.test.ts** - Full logout
   ```typescript
   // Test: Click logout
   // Test: Redirected to login
   // Test: Can't access dashboard without login
   ```

4. **error-recovery.test.ts** - Error handling
   ```typescript
   // Test: Network error shows retry
   // Test: User can retry after error
   ```

---

### Phase 5: Acceptance Criteria (1 hour)

**Create 1 file**: `acceptance-criteria.test.ts`

Map each of the 11 criteria to a test:

```typescript
describe('Issue #27 Acceptance Criteria', () => {
  it('Criterion 1: JWT stored in localStorage', () => {
    // Test from full-auth-flow.test.tsx
  });
  it('Criterion 2: AuthContext created', () => {
    // Test from existing auth-context.test.tsx
  });
  // ... etc for all 11
});
```

**Then run**:
```bash
pnpm test                    # All tests must pass
pnpm build                   # TypeScript builds
pnpm test --coverage         # Coverage ≥90%
```

---

### Phase 6: Documentation (30 minutes)

**Create 2 files**:

1. **docs/TESTING_JWT_AUTH.md** - How to run tests
   ```markdown
   # JWT Authentication Testing Guide
   
   ## Running Tests
   pnpm test                   # Run all
   pnpm test:frontend          # Frontend only
   ...
   
   ## Debugging
   pnpm test --watch           # Watch mode
   pnpm test --reporter=verbose
   ...
   ```

2. **docs/TESTING_JWT_AUTH_TROUBLESHOOTING.md** - Common issues
   ```markdown
   # Troubleshooting
   
   ## "Cannot find module auth-context"
   → Solution: Ensure file is created in frontend/lib/
   
   ## Tests fail with "port 4000 in use"
   → Solution: Kill existing process: kill $(lsof -ti :4000)
   
   ...
   ```

---

## Testing Pyramid (What to Prioritize)

```
        /\
       /E2E\       ← Real browser (1-2 hours) - High value
      /——————\
     /Integration\ ← Multiple layers (2-3 hours) - Core effort
    /———————————\
   /Unit Tests\   ← Single functions (done!) - Baseline
  /———————————\
```

**Focus**: Integration tests first (Phase 2), then verify with E2E.

---

## Common Test Patterns

### Pattern 1: Test Login Success

```typescript
it('should log in user and store token', async () => {
  // Arrange: Setup mocks and test data
  const mockResponse = { data: { login: { token: 'jwt-123' } } };
  
  // Act: Perform action
  render(<LoginForm />);
  await userEvent.type(screen.getByLabelText(/email/), 'test@example.com');
  await userEvent.type(screen.getByLabelText(/password/), 'password123');
  await userEvent.click(screen.getByRole('button'));
  
  // Assert: Verify result
  await waitFor(() => {
    expect(localStorage.getItem('auth_token')).toBe('jwt-123');
  });
});
```

### Pattern 2: Test Protected Query Without Token

```typescript
it('should reject query without token', async () => {
  // Arrange: Clear token
  localStorage.clear();
  
  // Act: Execute query
  const { result } = renderHook(() => useQuery(GET_BUILDS));
  
  // Assert: Verify error
  await waitFor(() => {
    expect(result.current.error?.message).toContain('Unauthorized');
  });
});
```

### Pattern 3: Test Backend Middleware

```typescript
it('should validate JWT token', () => {
  // Arrange
  const token = generateToken('user-123');
  const authHeader = `Bearer ${token}`;
  
  // Act
  const user = extractUserFromToken(authHeader);
  
  // Assert
  expect(user?.id).toBe('user-123');
});
```

---

## Debugging Checklist

| Problem | Check | Solution |
|---------|-------|----------|
| Tests fail randomly | Timing issues | Use `waitFor()` instead of `setTimeout()` |
| "Cannot find module" | File doesn't exist | Create the file in correct location |
| "Port already in use" | Service running | `kill $(lsof -ti :4000)` |
| Apollo cache stale | Not cleared | Clear cache in `beforeEach()` |
| Database issues | Wrong state | Run `pnpm migrate:reset` |
| TypeScript errors | Build issues | `pnpm build` to see full errors |

---

## Success Indicators

✅ **After Phase 1**: No test gaps found, existing tests pass  
✅ **After Phase 2**: Login → Dashboard flow works in tests  
✅ **After Phase 3**: Security verified, no token exposure  
✅ **After Phase 4**: Real user scenarios pass E2E tests  
✅ **After Phase 5**: All 11 acceptance criteria verified  
✅ **After Phase 6**: Documentation complete, ready for handoff  

---

## Final Verification (Before Calling Done)

```bash
# Run this checklist:
✅ pnpm test                    # All tests pass
✅ pnpm build                   # TypeScript builds
✅ pnpm lint                    # Code quality
✅ pnpm test --coverage         # Coverage ≥90%
✅ grep -r "TODO\|FIXME" src/   # No TODOs left
✅ All 11 criteria verified     # Acceptance criteria mapped to tests
✅ Documentation exists         # TESTING_JWT_AUTH.md created
```

**If all ✅, you're done!** Create PR, ask for review.

---

## Related Issues & Resources

- **Parent**: Issue #27 - JWT Authentication Implementation
- **Pre-reqs**: 
  - Issue #118 ✅ - Backend JWT Middleware
  - Issue #119 ✅ - Frontend Auth Context & Apollo Link
  - Issue #120 ✅ - Frontend Login Component
- **Full Plan**: See `ISSUE_121_INTEGRATION_TESTING_PLAN.md` for detailed breakdown
- **Architecture**: See `DESIGN.md` for system overview

---

## Questions? Problems?

1. **"How do I run a single test?"** → `pnpm test login-form.test.tsx`
2. **"Tests are flaky"** → Use `waitFor()` with conditions, avoid timeouts
3. **"Can't connect to backend"** → Run `pnpm dev` first in separate terminal
4. **"TypeScript errors"** → Run `pnpm build` to see full error list
5. **"Database issues"** → Run `pnpm migrate:reset && pnpm seed`

See `TESTING_JWT_AUTH_TROUBLESHOOTING.md` for more.

---

**Ready to start? Begin with Phase 1 review, then move to Phase 2.**  
**Expected completion: 2 days (6.5-10 hours total effort)**
