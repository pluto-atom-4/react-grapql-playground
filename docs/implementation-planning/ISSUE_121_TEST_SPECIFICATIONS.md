# Issue #121 Test Specifications
## Detailed Test Cases for Integration Testing & E2E Validation

**Version**: 1.0  
**Status**: Ready to Implement  
**Reference**: ISSUE_121_INTEGRATION_TESTING_PLAN.md

---

## TEST SUITE OVERVIEW

| Suite | File | Tests | Effort | Focus |
|-------|------|-------|--------|-------|
| Unit: Auth Middleware | `backend-graphql/src/middleware/__tests__/auth.test.ts` | 12 | ✅ Done | JWT validation |
| Unit: Auth Context | `frontend/lib/__tests__/auth-context.test.tsx` | 8 | ✅ Done | State management |
| Unit: Login Form | `frontend/components/__tests__/login-form.test.tsx` | 6 | ✅ Done | Form behavior |
| **Integration: Full Auth Flow** | `frontend/__tests__/integration/full-auth-flow.test.tsx` | 12 | ⏳ NEW | Login → Dashboard → Logout |
| **Integration: Protected Routes** | `frontend/__tests__/integration/protected-routes.test.tsx` | 10 | ⏳ NEW | 401 rejection, token requirement |
| **Integration: Error Handling** | `frontend/__tests__/integration/auth-errors.test.tsx` | 8 | ⏳ NEW | Invalid creds, network errors |
| **Integration: Token Management** | `backend-graphql/src/resolvers/__tests__/token-management.test.ts` | 9 | ⏳ NEW | Token generation & validation |
| **Security: Edge Cases** | `frontend/__tests__/integration/security-edge-cases.test.tsx` | 10 | ⏳ NEW | XSS, token exposure, isolation |
| **Security: Multi-User** | `frontend/__tests__/integration/multi-user.test.tsx` | 7 | ⏳ NEW | User isolation, data boundaries |
| **E2E: Login Flow** | `frontend/__tests__/e2e/login-flow.test.ts` | 8 | ⏳ NEW | Full browser login |
| **E2E: Dashboard** | `frontend/__tests__/e2e/dashboard.test.ts` | 6 | ⏳ NEW | Authenticated access |
| **E2E: Logout Flow** | `frontend/__tests__/e2e/logout-flow.test.ts` | 7 | ⏳ NEW | Full browser logout |
| **Acceptance: Criteria** | `frontend/__tests__/acceptance-criteria.test.ts` | 11 | ⏳ NEW | All 11 from #27 |
| **TOTAL** | — | **114 tests** | ~10 hrs | Complete coverage |

---

## DETAILED TEST SPECIFICATIONS

### Suite 1: Full Auth Flow Integration Tests

**File**: `frontend/__tests__/integration/full-auth-flow.test.tsx`

#### Test 1.1: Complete Login → Dashboard → Logout Flow

**Acceptance Criteria**: #1, #2, #3, #4, #9  
**Type**: Integration  
**Effort**: 1.5 hours  
**Prerequisites**: Backend running, database seeded with test user

```typescript
describe('Full Authentication Flow', () => {
  describe('Complete User Journey', () => {
    it('should complete login → dashboard → logout flow', async () => {
      // ARRANGE
      const { user } = userEvent.setup();
      localStorage.clear();
      
      render(
        <MockedProvider mocks={APOLLO_MOCKS}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MockedProvider>
      );

      // ACT & ASSERT - Step 1: See login page
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

      // ACT & ASSERT - Step 2: Enter credentials
      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const loginBtn = screen.getByRole('button', { name: /log in/i });

      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');
      
      await user.clear(passwordInput);
      await user.type(passwordInput, 'SecurePassword123!');

      // ACT & ASSERT - Step 3: Submit login
      await user.click(loginBtn);

      // ACT & ASSERT - Step 4: Token stored in localStorage
      await waitFor(
        () => {
          const token = localStorage.getItem('auth_token');
          expect(token).toBeTruthy();
          expect(token).toMatch(/^eyJ/); // JWT starts with 'eyJ'
        },
        { timeout: 5000 }
      );

      // ACT & ASSERT - Step 5: Redirected to dashboard
      await waitFor(
        () => {
          expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // ACT & ASSERT - Step 6: User name displayed
      await waitFor(() => {
        expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
      });

      // ACT & ASSERT - Step 7: Builds list visible (protected query succeeded)
      await waitFor(() => {
        expect(screen.getByText(/builds/i)).toBeInTheDocument();
      });

      // ACT & ASSERT - Step 8: Click logout
      const logoutBtn = screen.getByRole('button', { name: /log out/i });
      await user.click(logoutBtn);

      // ACT & ASSERT - Step 9: Token cleared
      expect(localStorage.getItem('auth_token')).toBeNull();

      // ACT & ASSERT - Step 10: Redirected to login
      await waitFor(
        () => {
          expect(screen.getByText(/welcome/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // ACT & ASSERT - Step 11: Can't access dashboard without token
      // Try to navigate directly
      window.location.hash = '#/dashboard';
      
      await waitFor(() => {
        expect(window.location.hash).not.toContain('/dashboard');
      });
    });
  });
});
```

**Verifications**:
- ✅ Login form accepts email and password
- ✅ Token stored as JWT in localStorage
- ✅ User redirected to dashboard after login
- ✅ Dashboard can execute protected queries (token injected)
- ✅ Logout clears token
- ✅ Logout redirects to login
- ✅ Dashboard inaccessible without token

**Error Scenarios**:
- ❌ Invalid credentials → Show error message
- ❌ Network error during login → Show retry button
- ❌ Database error → Show error message

---

#### Test 1.2: Token Persisted After Page Reload

**Type**: Integration  
**Effort**: 0.5 hours

```typescript
it('should persist token after page reload', async () => {
  // Arrange: User logged in
  localStorage.setItem('auth_token', VALID_TOKEN);
  
  // Act: Render app fresh
  const { rerender } = render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );

  // Assert: Token still available
  await waitFor(() => {
    expect(localStorage.getItem('auth_token')).toBe(VALID_TOKEN);
  });

  // Assert: User not redirected to login
  expect(screen.queryByText(/welcome to login/i)).not.toBeInTheDocument();
  expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
});
```

---

#### Test 1.3: Token Injected in Apollo Requests

**Type**: Integration  
**Effort**: 1 hour

```typescript
it('should inject Authorization header in GraphQL requests', async () => {
  // Arrange
  const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('auth_token');
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  });

  const testLink = new ApolloLink((operation, forward) => {
    // Intercept to verify header
    expect(operation.getContext().headers.authorization).toMatch(/^Bearer /);
    return forward(operation);
  });

  const client = new ApolloClient({
    link: concat(authLink, testLink, httpLink),
    cache: new InMemoryCache(),
  });

  // Act
  localStorage.setItem('auth_token', VALID_TOKEN);
  
  render(
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  );

  // Assert: Query succeeds (header was correct)
  await waitFor(() => {
    expect(screen.getByText(/builds/i)).toBeInTheDocument();
  });
});
```

---

#### Test 1.4: Concurrent Mutations Don't Lose Token

**Type**: Integration  
**Effort**: 1 hour

```typescript
it('should handle concurrent mutations without losing token', async () => {
  // Arrange
  localStorage.setItem('auth_token', VALID_TOKEN);
  
  const { user } = userEvent.setup();

  render(
    <MockedProvider mocks={APOLLO_MOCKS}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MockedProvider>
  );

  // Act: Trigger multiple mutations concurrently
  const updateBtn1 = screen.getByRole('button', { name: /update build 1/i });
  const updateBtn2 = screen.getByRole('button', { name: /update build 2/i });

  await Promise.all([
    user.click(updateBtn1),
    user.click(updateBtn2),
  ]);

  // Assert: Token still valid
  await waitFor(() => {
    expect(localStorage.getItem('auth_token')).toBe(VALID_TOKEN);
  });

  // Assert: Both mutations succeeded
  await waitFor(() => {
    expect(screen.getByText(/updates completed/i)).toBeInTheDocument();
  });
});
```

---

### Suite 2: Protected Routes Integration Tests

**File**: `frontend/__tests__/integration/protected-routes.test.tsx`

#### Test 2.1: Dashboard Redirects Without Token

```typescript
describe('Protected Routes', () => {
  describe('Access Control', () => {
    it('should redirect to login when accessing dashboard without token', async () => {
      // Arrange
      localStorage.clear();

      // Act
      const { navigate } = renderHook(() => useNavigate(), {
        wrapper: ({ children }) => (
          <BrowserRouter>
            {children}
          </BrowserRouter>
        ),
      });

      render(
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      );

      navigate('/dashboard');

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/welcome/i)).toBeInTheDocument(); // Login page
      });
    });
  });
});
```

---

#### Test 2.2: Protected Query Fails Without Token

```typescript
it('should return 401 error for protected query without token', async () => {
  // Arrange
  localStorage.clear();

  // Act
  const { result } = renderHook(() => useQuery(GET_BUILDS), {
    wrapper: ApolloWrapper,
  });

  // Assert: Query fails with auth error
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
  });

  expect(result.current.error?.message).toContain('Unauthorized');
  expect(result.current.data).toBeUndefined();
});
```

---

#### Test 2.3: Protected Query Succeeds With Valid Token

```typescript
it('should succeed for protected query with valid token', async () => {
  // Arrange
  localStorage.setItem('auth_token', VALID_TOKEN);

  // Act
  const { result } = renderHook(() => useQuery(GET_BUILDS), {
    wrapper: ApolloWrapper,
  });

  // Assert: Query succeeds
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  expect(result.current.data.builds).toHaveLength(2);
  expect(result.current.data.builds[0]).toHaveProperty('id');
  expect(result.current.data.builds[0]).toHaveProperty('status');
});
```

---

#### Test 2.4: Invalid Token Rejected

```typescript
it('should reject invalid token with 401', async () => {
  // Arrange: Store malformed token
  localStorage.setItem('auth_token', 'invalid-token-not-jwt');

  // Act
  const { result } = renderHook(() => useQuery(GET_BUILDS), {
    wrapper: ApolloWrapper,
  });

  // Assert: Query fails
  await waitFor(() => {
    expect(result.current.error).toBeDefined();
  });

  expect(result.current.error?.message).toContain('Invalid token');
});
```

---

#### Test 2.5: Expired Token Handled Gracefully

```typescript
it('should handle expired token gracefully', async () => {
  // Arrange: Create expired token
  const expiredToken = jwt.sign(
    { id: 'user-123', email: 'test@example.com' },
    JWT_SECRET,
    { expiresIn: '-1h' } // Already expired
  );

  localStorage.setItem('auth_token', expiredToken);

  // Act
  const { result } = renderHook(() => useQuery(GET_BUILDS), {
    wrapper: ApolloWrapper,
  });

  // Assert: Query fails with expiration error
  await waitFor(() => {
    expect(result.current.error).toBeDefined();
  });

  expect(result.current.error?.message).toMatch(/expired|invalid/i);

  // Assert: Should trigger reauthentication
  // (User component should prompt for login)
});
```

---

### Suite 3: Error Handling Integration Tests

**File**: `frontend/__tests__/integration/auth-errors.test.tsx`

#### Test 3.1: Invalid Credentials Show Error

```typescript
describe('Error Handling', () => {
  it('should show error message for invalid credentials', async () => {
    // Arrange
    const { user } = userEvent.setup();

    render(
      <MockedProvider mocks={[
        {
          request: {
            query: LOGIN_MUTATION,
            variables: { email: 'wrong@example.com', password: 'wrong' },
          },
          result: {
            errors: [
              new GraphQLError('Invalid email or password'),
            ],
          },
        },
      ]}>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </MockedProvider>
    );

    // Act
    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    // Assert: Token not stored
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});
```

---

#### Test 3.2: Network Error Shows Retry

```typescript
it('should show retry button on network error', async () => {
  // Arrange
  const { user } = userEvent.setup();

  render(
    <MockedProvider mocks={[
      {
        request: { query: LOGIN_MUTATION },
        error: new Error('Network error'),
      },
    ]}>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </MockedProvider>
  );

  // Act
  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /log in/i }));

  // Assert: Error displayed
  await waitFor(() => {
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });

  // Assert: Retry button visible
  expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
});
```

---

### Suite 4: Token Management Backend Tests

**File**: `backend-graphql/src/resolvers/__tests__/token-management.test.ts`

#### Test 4.1: Generate Token With Correct Payload

```typescript
describe('Token Management', () => {
  describe('Token Generation', () => {
    it('should generate token with correct payload', () => {
      // Arrange
      const userId = 'user-123';
      const email = 'test@example.com';

      // Act
      const token = generateToken(userId, email);

      // Assert: Token is valid JWT
      expect(token).toMatch(/^eyJ/); // JWT format

      // Assert: Can decode token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.id).toBe(userId);
      expect(decoded.email).toBe(email);
      expect(decoded.iat).toBeDefined(); // Issued at
      expect(decoded.exp).toBeDefined(); // Expires at
    });
  });
});
```

---

#### Test 4.2: Token Includes 24-Hour Expiration

```typescript
it('should include 24-hour expiration in token', () => {
  // Arrange
  const beforeNow = Date.now();

  // Act
  const token = generateToken('user-123');
  const decoded = jwt.verify(token, JWT_SECRET) as any;

  // Assert
  const expirationMs = decoded.exp * 1000;
  const expirationDate = new Date(expirationMs);
  const currentDate = new Date();
  const timeDiffHours = (expirationDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60);

  expect(timeDiffHours).toBeGreaterThan(23.5); // Allow 30min clock skew
  expect(timeDiffHours).toBeLessThan(24.5);
});
```

---

#### Test 4.3: Validate Token Extracts User

```typescript
it('should validate and extract user from token', () => {
  // Arrange
  const token = generateToken('user-456', 'user456@example.com');
  const authHeader = `Bearer ${token}`;

  // Act
  const user = extractUserFromToken(authHeader);

  // Assert
  expect(user).not.toBeNull();
  expect(user?.id).toBe('user-456');
  expect(user?.email).toBe('user456@example.com');
});
```

---

#### Test 4.4: Reject Expired Token

```typescript
it('should reject expired token', () => {
  // Arrange
  const expiredToken = jwt.sign(
    { id: 'user-123', email: 'test@example.com' },
    JWT_SECRET,
    { expiresIn: '-1h' }
  );
  const authHeader = `Bearer ${expiredToken}`;

  // Act & Assert
  expect(() => {
    extractUserFromToken(authHeader);
  }).toThrow('Token expired');
});
```

---

### Suite 5: Security Edge Cases Tests

**File**: `frontend/__tests__/integration/security-edge-cases.test.tsx`

#### Test 5.1: Token Never Exposed in URL

```typescript
describe('Security & Edge Cases', () => {
  it('should never expose token in URL', async () => {
    // Arrange
    localStorage.setItem('auth_token', VALID_TOKEN);

    // Act
    render(
      <MockedProvider mocks={APOLLO_MOCKS}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MockedProvider>
    );

    // Assert: URL should never contain token
    expect(window.location.href).not.toContain(VALID_TOKEN);
    expect(window.location.search).not.toContain('token=');
    expect(window.location.hash).not.toContain('token=');
  });
});
```

---

#### Test 5.2: Token Not Logged to Console

```typescript
it('should not log token to console', async () => {
  // Arrange
  const consoleSpy = vi.spyOn(console, 'log');
  localStorage.setItem('auth_token', VALID_TOKEN);

  // Act
  render(
    <MockedProvider mocks={APOLLO_MOCKS}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MockedProvider>
  );

  // Assert: Token never logged
  consoleSpy.mock.calls.forEach(call => {
    const loggedText = JSON.stringify(call);
    expect(loggedText).not.toContain(VALID_TOKEN);
  });

  consoleSpy.mockRestore();
});
```

---

#### Test 5.3: Multiple Browser Tabs Share Session

```typescript
it('should share token across multiple tabs', async () => {
  // Arrange
  const token = generateToken('user-123');
  localStorage.setItem('auth_token', token);

  // Act: Simulate tab 1 and tab 2 accessing same storage
  const tab1 = localStorage.getItem('auth_token');
  const tab2 = localStorage.getItem('auth_token');

  // Assert: Both tabs see same token
  expect(tab1).toBe(tab2);
  expect(tab1).toBe(token);
});
```

---

### Suite 6: Multi-User Isolation Tests

**File**: `frontend/__tests__/integration/multi-user.test.tsx`

#### Test 6.1: User Can't See Other User's Data

```typescript
describe('Multi-User Scenarios', () => {
  it('should isolate User A data from User B', async () => {
    // Arrange: Mock different responses based on token
    const userAToken = generateToken('user-a', 'user-a@example.com');
    const userBToken = generateToken('user-b', 'user-b@example.com');

    const mocks = [
      {
        request: {
          query: GET_BUILDS,
          context: { headers: { authorization: `Bearer ${userAToken}` } },
        },
        result: {
          data: {
            builds: [{ id: 'build-a1', status: 'RUNNING' }],
          },
        },
      },
      {
        request: {
          query: GET_BUILDS,
          context: { headers: { authorization: `Bearer ${userBToken}` } },
        },
        result: {
          data: {
            builds: [{ id: 'build-b1', status: 'COMPLETE' }],
          },
        },
      },
    ];

    // Act: User A queries
    localStorage.setItem('auth_token', userAToken);
    let { result: resultA } = renderHook(() => useQuery(GET_BUILDS), {
      wrapper: ApolloWrapper,
    });

    // Assert: User A sees only their builds
    await waitFor(() => {
      expect(resultA.current.data.builds).toHaveLength(1);
      expect(resultA.current.data.builds[0].id).toBe('build-a1');
    });

    // Act: User B queries (clear and switch token)
    localStorage.clear();
    localStorage.setItem('auth_token', userBToken);
    
    let { result: resultB } = renderHook(() => useQuery(GET_BUILDS), {
      wrapper: ApolloWrapper,
    });

    // Assert: User B sees only their builds
    await waitFor(() => {
      expect(resultB.current.data.builds).toHaveLength(1);
      expect(resultB.current.data.builds[0].id).toBe('build-b1');
    });

    // Assert: User A's data not visible to User B
    expect(resultB.current.data.builds).not.toContainEqual(
      expect.objectContaining({ id: 'build-a1' })
    );
  });
});
```

---

### Suite 7: Acceptance Criteria Tests

**File**: `frontend/__tests__/acceptance-criteria.test.ts`

```typescript
describe('Issue #27 Acceptance Criteria', () => {
  describe('1. JWT token stored in localStorage', () => {
    it('criterion 1: JWT token stored in localStorage on login', async () => {
      // Test from full-auth-flow.test.tsx
    });
  });

  describe('2. AuthContext created with login/logout', () => {
    it('criterion 2: AuthContext provides login and logout functions', async () => {
      // Test from auth-context.test.tsx
    });
  });

  describe('3. Apollo Client attaches Authorization header', () => {
    it('criterion 3: Authorization header injected in all requests', async () => {
      // Test from full-auth-flow.test.tsx
    });
  });

  describe('4. Login component accepts email/password', () => {
    it('criterion 4: Login form accepts email and password input', async () => {
      // Test from login-form.test.tsx
    });
  });

  describe('5. Backend validates JWT on GraphQL queries', () => {
    it('criterion 5: Backend validates JWT token', async () => {
      // Test from protected-routes.test.tsx
    });
  });

  describe('6. Unauthenticated requests rejected with 401', () => {
    it('criterion 6: Request without token returns error', async () => {
      // Test from auth-errors.test.tsx
    });
  });

  describe('7. User context available in resolvers', () => {
    it('criterion 7: context.user populated from token', async () => {
      // Test from auth.test.ts (backend)
    });
  });

  describe('8. Protected queries verify user authentication', () => {
    it('criterion 8: Resolver checks context.user', async () => {
      // Test from Mutation.login.test.ts
    });
  });

  describe('9. Logout clears token and redirects', () => {
    it('criterion 9: Logout removes token and redirects to login', async () => {
      // Test from full-auth-flow.test.tsx
    });
  });

  describe('10. TypeScript builds without errors', () => {
    it('criterion 10: pnpm build succeeds', async () => {
      // Run: pnpm build
    });
  });

  describe('11. All tests pass', () => {
    it('criterion 11: pnpm test passes', async () => {
      // Run: pnpm test
    });
  });
});
```

---

## TEST DATA & FIXTURES

### Mock User Data

```typescript
export const TEST_USER = {
  id: 'test-user-123',
  email: 'test@example.com',
  password: 'SecurePassword123!',
  passwordHash: '$2b$10$...' // bcrypt hash of password
};

export const INVALID_USER = {
  email: 'nonexistent@example.com',
  password: 'WrongPassword'
};

export const USER_B = {
  id: 'test-user-456',
  email: 'user-b@example.com',
  password: 'AnotherPassword456!',
};
```

### Mock JWT Tokens

```typescript
export const VALID_TOKEN = jwt.sign(
  { id: TEST_USER.id, email: TEST_USER.email },
  JWT_SECRET,
  { expiresIn: '24h' }
);

export const EXPIRED_TOKEN = jwt.sign(
  { id: TEST_USER.id, email: TEST_USER.email },
  JWT_SECRET,
  { expiresIn: '-1h' }
);

export const INVALID_TOKEN = 'invalid.not.jwt';
```

### Mock GraphQL Responses

```typescript
export const MOCK_LOGIN_RESPONSE = {
  data: {
    login: {
      __typename: 'AuthPayload',
      token: VALID_TOKEN,
      user: {
        __typename: 'User',
        id: TEST_USER.id,
        email: TEST_USER.email,
      },
    },
  },
};

export const MOCK_BUILDS_RESPONSE = {
  data: {
    builds: [
      { __typename: 'Build', id: 'build-1', status: 'RUNNING' },
      { __typename: 'Build', id: 'build-2', status: 'COMPLETE' },
    ],
  },
};
```

### Apollo Mocks Array

```typescript
export const APOLLO_MOCKS = [
  {
    request: {
      query: LOGIN_MUTATION,
      variables: {
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    },
    result: MOCK_LOGIN_RESPONSE,
  },
  {
    request: {
      query: GET_BUILDS,
    },
    result: MOCK_BUILDS_RESPONSE,
  },
  // ... more mocks
];
```

---

## TEST EXECUTION CHECKLIST

### Before Starting

- [ ] All dependencies installed: `pnpm install`
- [ ] Database running: `docker-compose up -d`
- [ ] Migrations applied: `pnpm migrate`
- [ ] Environment variables set: `.env.local` or `.env.test`

### During Implementation

- [ ] Each test file has `beforeEach()` and `afterEach()` hooks
- [ ] Tests use `waitFor()` for async operations
- [ ] Mock data uses correct TypeScript types
- [ ] No hardcoded timeouts (use `waitFor()`)
- [ ] localStorage cleared in `beforeEach()`
- [ ] Apollo cache cleared in `beforeEach()`

### After Implementation

- [ ] All tests pass: `pnpm test`
- [ ] No console errors or warnings
- [ ] TypeScript builds: `pnpm build`
- [ ] Coverage ≥90%: `pnpm test --coverage`
- [ ] No flaky tests (run 3x: `pnpm test`)

---

## References

- Full Plan: `ISSUE_121_INTEGRATION_TESTING_PLAN.md`
- Quick Start: `ISSUE_121_QUICK_START.md`
- Architecture: `DESIGN.md`
- Existing Tests: `backend-graphql/src/middleware/__tests__/auth.test.ts`

---

**Last Updated**: April 21, 2026  
**Status**: Ready to Implement
