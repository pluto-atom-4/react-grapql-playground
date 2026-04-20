# JWT Authentication Implementation Plan (Issue #27)
## Comprehensive Orchestration & Sequencing Strategy

**Created**: April 20, 2026  
**Status**: Ready for Implementation  
**Effort**: 3 hours (4 sub-tasks × ~45 min each)  
**Priority**: HIGH (High-Priority, Ready-to-Start)

---

## EXECUTIVE SUMMARY

**Scope**: Implement end-to-end JWT authentication across React frontend, Apollo GraphQL backend, and Express auxiliary server, enabling secure user authentication and authorization.

**Approach**: Break into 4 sequential sub-tasks that flow from backend infrastructure → frontend auth context → integration → testing, minimizing blockers and enabling parallel work on day 2-3.

**Interview Value**: Demonstrates ability to orchestrate complex, multi-layered authentication flows while maintaining security, type safety, and testability. Shows understanding of stateless authentication, middleware patterns, and cross-layer communication.

---

## PART 1: DEEP ACCEPTANCE CRITERIA ANALYSIS

### Grouping by Layer & Concern

#### **Backend Layer** (Criteria 5-8)
- **5**: Backend validates JWT on all GraphQL queries
- **6**: Unauthenticated requests rejected with 401 error
- **7**: User context available in resolvers (`context.user`)
- **8**: Protected queries/mutations verify user authentication

**Why together**: These are interdependent. Validation must happen first, then populate context, then resolvers use it.

---

#### **Frontend Auth Infrastructure** (Criteria 2-3)
- **2**: AuthContext created with login/logout functions
- **3**: Apollo Client attaches Authorization header

**Why together**: Apollo Link depends on AuthContext being available. AuthContext provides the token that Apollo needs to inject into headers.

---

#### **Frontend Token & UI** (Criteria 1, 4, 9)
- **1**: JWT token stored in localStorage
- **4**: Login component accepts email/password
- **9**: Logout clears token and redirects to login

**Why together**: All three form the "Login/Logout Flow". Token storage bridges context and component. Logout is mirror of login.

---

#### **Quality Gates** (Criteria 10-11)
- **10**: TypeScript build passes
- **11**: All tests pass

**Why last**: These validate all prior work. Can't fix TS errors until implementations exist.

---

## PART 2: LOGICAL EXECUTION PHASES

### Phase 1: Backend Foundation (30 mins)
**Goal**: Ensure backend can validate JWT and reject unauthenticated requests  
**Owner**: Backend Engineer (or full-stack if solo)

**Deliverables**:
- Create `backend-graphql/src/middleware/auth.ts` (JWT validation)
- Wire auth middleware into Apollo Server context
- Add `context.user` to all GraphQL resolvers
- Update schema to require auth on protected mutations
- Write 2-3 resolver tests for auth flows

**Why first**:
- Frontend cannot test against unprotected backend
- Backend auth is the "source of truth"—frontend just sends tokens
- Follows "inside-out" architecture principle (core security layer first)

**Risks**:
- ⚠️ If JWT validation is wrong, frontend can't test auth flow
- ⚠️ If schema doesn't define which mutations need auth, frontend won't know what to expect

**Mitigations**:
- Use GraphQL directives (@auth) to mark protected fields
- Test middleware in isolation before wiring to Apollo

---

### Phase 2: Frontend Auth Infrastructure (30 mins)
**Goal**: Create AuthContext and Apollo Auth Link  
**Owner**: Frontend Engineer

**Deliverables**:
- Create `frontend/lib/auth-context.tsx` with useAuth hook
- Create `frontend/lib/apollo-auth-link.ts` (setContext from @apollo/client)
- Integrate AuthProvider in `frontend/app/layout.tsx`
- Update Apollo Client to use auth link
- Write tests for context and link behavior

**Why after backend**:
- AuthContext just needs a token—backend validation is decoupled
- Apollo Auth Link injects the token—backend middleware validates it
- If backend doesn't require/validate auth, this layer has nothing to do

**Risks**:
- ⚠️ Token hydration timing (localStorage + SSR) causes flashing
- ⚠️ Apollo cache can get stale after token refresh

**Mitigations**:
- Use Next.js suppressHydrationWarning on auth boundaries
- Document token refresh strategy (not required for MVP, but important for production)

---

### Phase 3: Frontend Auth UI & Token Flow (30 mins)
**Goal**: Build login form and token management  
**Owner**: Frontend Engineer

**Deliverables**:
- Create `frontend/components/LoginForm.tsx` (email/password form)
- Add login mutation to GraphQL queries
- Implement token storage (localStorage.setItem in AuthContext)
- Implement logout flow (localStorage.removeItem, redirect)
- Wire LoginForm into login page route
- Write tests for form submission, error handling, redirects

**Why after infrastructure**:
- Form submits to a login mutation (backend must have it)
- AuthContext.login() stores token (AuthContext already exists)
- Redirect requires auth state to be reactive (AuthContext + Apollo Link ready)

**Risks**:
- ⚠️ Login mutation doesn't exist or has wrong signature
- ⚠️ Token isn't stored before Apollo refetches, causing flash/logout
- ⚠️ Logout doesn't clear cache, showing stale data

**Mitigations**:
- Define login mutation schema in Phase 1
- Use Apollo cache.reset() on logout
- Add integration test: login → fetch data → logout → redirected

---

### Phase 4: Integration & Testing (30 mins)
**Goal**: End-to-end verification and TypeScript validation  
**Owner**: Full-stack (validation checkpoint)

**Deliverables**:
- Run `pnpm test` across all packages
- Run `pnpm build` to validate TypeScript
- Manual testing: login flow → authenticated query → logout
- Verify localStorage persistence across page reload
- Check 401 responses on unauthenticated requests
- Document in CLAUDE.md: how to test JWT auth locally

**Why last**:
- Catches issues from all phases
- TypeScript errors often emerge when integrating layers
- Manual testing validates UX consistency

**Risks**:
- ⚠️ Tests can't run if implementation in phase 3 isn't complete
- ⚠️ Integration tests fail due to timing (async auth checks)

**Mitigations**:
- Run phase 1-3 tests in isolation first
- Use await/waitFor in integration tests for async state
- Add debugging logs if integration test fails

---

## PART 3: DEPENDENCY GRAPH & SEQUENCING

```
Phase 1: Backend Auth Middleware
  ├─ Create: backend-graphql/src/middleware/auth.ts
  ├─ Create: backend-graphql/src/types/context.ts (user type)
  ├─ Update: backend-graphql/src/index.ts (wire middleware)
  ├─ Update: backend-graphql/src/schema.graphql (@auth directive)
  ├─ Update: resolvers to read context.user
  └─ Tests: auth middleware, protected mutations
       ↓ (BLOCKS everything below)

Phase 2: Frontend Auth Infrastructure (parallel with Phase 1 if split team)
  ├─ Create: frontend/lib/auth-context.tsx
  ├─ Create: frontend/lib/apollo-auth-link.ts
  ├─ Update: frontend/app/layout.tsx (AuthProvider wrapper)
  ├─ Update: frontend/lib/apollo-client.ts (useAuth hook)
  └─ Tests: context localStorage, auth link header injection
       ↓ (DEPENDS on Phase 1 complete to verify integration)

Phase 3: Frontend Auth UI & Token Management
  ├─ Create: frontend/components/LoginForm.tsx
  ├─ Create: frontend/app/login/page.tsx (login route)
  ├─ Update: frontend/components/LogoutButton.tsx
  ├─ Add: login mutation to frontend/lib/graphql-queries.ts
  └─ Tests: form, mutation, token storage, logout redirect
       ↓ (DEPENDS on Phase 2 complete)

Phase 4: Integration & Validation
  ├─ Run: pnpm test (all packages)
  ├─ Run: pnpm build (TypeScript)
  ├─ Manual: Full login → fetch → logout flow
  ├─ Manual: Verify 401 on missing token
  └─ Document: JWT testing guide in CLAUDE.md
       ↓ (DEPENDS on Phase 1-3 complete)
```

---

## PART 4: CRITICAL DECISION POINTS & RISKS

### Why Backend First?
**Decision**: Validate JWT and reject unauthenticated requests BEFORE building frontend

**Rationale**:
- Backend is the "source of truth" for authentication
- Frontend can't verify auth logic without a backend to test against
- Failing fast on backend prevents wasted frontend work
- Aligns with "contract-first" API design (define GraphQL schema before UI)

**Risk if reversed**:
- Frontend builds a login form that works with mock auth
- Backend auth validation doesn't match frontend expectations
- Integration fails → rework both layers

---

### Why localStorage Instead of httpOnly Cookies?
**Decision**: MVP uses localStorage; production switches to httpOnly

**Rationale**:
- localStorage is simple for development/interview demo
- Can be refactored to cookies later without changing schema/resolvers
- Shows understanding of both approaches

**Production Note**:
- httpOnly cookies are immune to XSS
- Current approach vulnerable if JS is compromised
- Acceptable for MVP, must upgrade before production deployment

---

### Why Separate Auth Middleware Files?
**Decision**: Both `backend-express/src/middleware/auth.ts` AND `backend-graphql/src/middleware/auth.ts`

**Rationale**:
- Express middleware validates file upload/webhook requests
- GraphQL middleware validates query/mutation context
- Same JWT_SECRET, different validation logic (HTTP vs GraphQL)
- Demonstrates understanding of middleware layers

---

## PART 5: SUB-TASK SPECIFICATIONS

### SUB-TASK 1: Backend JWT Validation Middleware (Issue #27.1)

**Title**: `#27.1: Implement Backend JWT Validation & Context`

**Effort**: 45 minutes  
**Blocker**: None (can start immediately)  
**Unblocks**: #27.2 (frontend infrastructure)

**Acceptance Criteria**:
- [ ] Created `backend-graphql/src/middleware/auth.ts` with extractUserFromToken()
- [ ] JWT validation extracts token from `Authorization: Bearer <token>` header
- [ ] Invalid/expired tokens throw GraphQL error (not 401, since GraphQL doesn't use HTTP status)
- [ ] Apollo Server context includes `context.user` (undefined if unauthenticated)
- [ ] At least 2 resolvers protected with `if (!context.user) throw new Error('Unauthorized')`
- [ ] Unit tests for: valid token, expired token, malformed token, missing token
- [ ] TypeScript builds without errors
- [ ] Tests pass: `pnpm test:graphql`

**Key Files to Create/Modify**:
- Create: `backend-graphql/src/middleware/auth.ts`
- Create: `backend-graphql/src/middleware/extractUserFromToken.ts` (utility)
- Modify: `backend-graphql/src/index.ts` (wire into Apollo context)
- Modify: `backend-graphql/src/schema.graphql` (add @auth directive if using)
- Create: `backend-graphql/src/__tests__/auth.test.ts`

**Implementation Notes**:
- Use `jsonwebtoken.verify()` to validate token
- JWT_SECRET from environment variable
- Handle `Authorization: Bearer <token>` parsing
- Resolver pattern: `if (!context.user) throw new AuthenticationError('Not authenticated')`

**Pseudo-Code**:
```typescript
// backend-graphql/src/middleware/auth.ts
export function extractUserFromToken(authHeader?: string) {
  if (!authHeader?.startsWith('Bearer ')) return null
  
  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    return decoded as { id: string; email: string }
  } catch {
    throw new AuthenticationError('Invalid token')
  }
}

// In Apollo Server context:
context: ({ req }) => {
  const user = extractUserFromToken(req.headers.authorization)
  return { user, prisma, dataloaders }
}

// In resolver:
Query.builds = (_, __, { user }) => {
  if (!user) throw new AuthenticationError('Not authenticated')
  return prisma.build.findMany()
}
```

**Testing Checklist**:
- Test: Valid JWT → extracts user ID correctly
- Test: Expired JWT → throws AuthenticationError
- Test: Missing token → context.user is undefined
- Test: Malformed token → throws error
- Test: Query without auth fails with AuthenticationError
- Test: Query with valid token succeeds

**Success Criteria**:
- `pnpm test:graphql` passes (all auth tests)
- `pnpm build` succeeds (TypeScript validation)
- GraphQL query fails with 401 when token missing
- GraphQL query succeeds when token valid

---

### SUB-TASK 2: Frontend Auth Context & Apollo Link (Issue #27.2)

**Title**: `#27.2: Create AuthContext & Apollo Auth Link`

**Effort**: 45 minutes  
**Blocker**: #27.1 (backend must validate JWT first)  
**Unblocks**: #27.3 (frontend UI)

**Acceptance Criteria**:
- [ ] Created `frontend/lib/auth-context.tsx` with AuthProvider component
- [ ] useAuth() hook exposes `token`, `login()`, `logout()`
- [ ] Token persisted in localStorage on login()
- [ ] Token retrieved from localStorage on app boot
- [ ] Created `frontend/lib/apollo-auth-link.ts` using @apollo/client/link/context
- [ ] Apollo Client uses auth link to inject `Authorization: Bearer <token>` header
- [ ] AuthProvider wraps app in `frontend/app/layout.tsx`
- [ ] Logout clears token from context and localStorage
- [ ] Unit tests for context: token storage, login, logout, hydration
- [ ] Unit tests for link: header injection, missing token handling
- [ ] No TypeScript errors
- [ ] Tests pass: `pnpm test:frontend`

**Key Files to Create/Modify**:
- Create: `frontend/lib/auth-context.tsx`
- Create: `frontend/lib/apollo-auth-link.ts`
- Modify: `frontend/app/layout.tsx` (add AuthProvider)
- Modify: `frontend/lib/apollo-client.ts` (use auth link)
- Create: `frontend/lib/__tests__/auth-context.test.tsx`
- Create: `frontend/lib/__tests__/apollo-auth-link.test.ts`

**Implementation Notes**:
- Use React Context API (no Redux needed)
- localStorage only in browser (guard with `typeof window !== 'undefined'`)
- Apollo auth link uses `setContext()` from @apollo/client/link/context
- Emit token in Authorization header if available

**Pseudo-Code**:
```typescript
// frontend/lib/auth-context.tsx
export function AuthProvider({ children }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  })

  const login = (newToken: string) => {
    setToken(newToken)
    localStorage.setItem('auth_token', newToken)
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem('auth_token')
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// frontend/lib/apollo-auth-link.ts
export const createAuthLink = (getToken: () => string | null) => {
  return setContext((_, { headers }) => ({
    headers: {
      ...headers,
      authorization: getToken() ? `Bearer ${getToken()}` : '',
    },
  }))
}

// Usage in Apollo Client:
const client = new ApolloClient({
  link: createAuthLink(() => token).concat(httpLink),
  cache: new InMemoryCache(),
})
```

**Testing Checklist**:
- Test: useAuth() works inside AuthProvider
- Test: login() sets token in state and localStorage
- Test: logout() clears token and localStorage
- Test: Token persists across re-mounts (from localStorage)
- Test: Apollo link injects Authorization header when token present
- Test: Apollo link doesn't inject header when token missing
- Test: useAuth() throws error outside provider

**Success Criteria**:
- `pnpm test:frontend` passes (all context and link tests)
- `pnpm build` succeeds
- Token is persisted in localStorage
- Apollo DevTools shows Authorization header in network requests

---

### SUB-TASK 3: Frontend Login UI & Token Management (Issue #27.3)

**Title**: `#27.3: Build Login Form & Implement Logout Flow`

**Effort**: 45 minutes  
**Blocker**: #27.2 (AuthContext and Apollo link must exist)  
**Unblocks**: #27.4 (integration testing)

**Acceptance Criteria**:
- [ ] Created `frontend/components/LoginForm.tsx` (email/password form)
- [ ] Created `frontend/app/login/page.tsx` (login page route)
- [ ] Form submission calls LOGIN mutation via Apollo useMutation()
- [ ] Successful login: token stored via AuthContext.login(), redirects to /builds
- [ ] Failed login: displays error message
- [ ] Created logout button component (or integrated into dashboard)
- [ ] Logout clears token, clears Apollo cache, redirects to /login
- [ ] Tests for: form submission, login mutation, error handling, redirect
- [ ] Protected pages redirect unauthenticated users to /login
- [ ] No TypeScript errors
- [ ] Tests pass: `pnpm test:frontend`

**Key Files to Create/Modify**:
- Create: `frontend/components/LoginForm.tsx`
- Create: `frontend/app/login/page.tsx`
- Create or Modify: `frontend/components/LogoutButton.tsx`
- Modify: `frontend/lib/graphql-queries.ts` (add LOGIN mutation)
- Create: `frontend/components/__tests__/LoginForm.test.tsx`
- Modify: `frontend/app/page.tsx` (add redirect if not authenticated)

**Implementation Notes**:
- Form should display loading state during mutation
- Error message should show login failure reason
- After logout, must reset Apollo cache (client.cache.reset())
- Redirect should use next/navigation useRouter()

**Pseudo-Code**:
```typescript
// frontend/components/LoginForm.tsx
'use client'
import { useMutation } from '@apollo/client'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const [loginMutation, { loading, error }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      login(data.login.token)
      router.push('/builds')
    },
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await loginMutation({
      variables: {
        email: formData.get('email'),
        password: formData.get('password'),
      },
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      {error && <p className="error">{error.message}</p>}
      <button disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}

// Logout button:
export function LogoutButton() {
  const { logout } = useAuth()
  const router = useRouter()
  const client = useApolloClient()

  const handleLogout = () => {
    client.cache.reset()
    logout()
    router.push('/login')
  }

  return <button onClick={handleLogout}>Logout</button>
}
```

**GraphQL Query/Mutation**:
```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      id
      email
    }
  }
}
```

**Testing Checklist**:
- Test: Form renders with email and password inputs
- Test: Form submission calls loginMutation with inputs
- Test: Successful login calls AuthContext.login() and redirects
- Test: Failed login displays error message
- Test: Logout button clears token and redirects
- Test: LogoutButton calls client.cache.reset()
- Test: Protected page redirects unauthenticated user to /login
- Test: Apollo query refetches after login

**Success Criteria**:
- `pnpm test:frontend` passes
- `pnpm build` succeeds
- Manual test: Enter credentials → logged in → can fetch data → logout → redirected to login
- No flash/redirect loops

---

### SUB-TASK 4: Integration Testing & Type Validation (Issue #27.4)

**Title**: `#27.4: End-to-End Test & TypeScript Validation`

**Effort**: 30 minutes  
**Blocker**: #27.3 (all implementation must be complete)  
**Unblocks**: Completion of #27

**Acceptance Criteria**:
- [ ] All unit tests pass: `pnpm test`
- [ ] TypeScript builds: `pnpm build` succeeds
- [ ] No compilation errors or warnings
- [ ] Integration test written: login → fetch data → logout
- [ ] Integration test verifies: token in localStorage, auth header in GraphQL request, 401 on missing token
- [ ] Manual verification: Login flow works end-to-end
- [ ] Manual verification: Unauthenticated request returns 401
- [ ] Manual verification: Token persists after page reload
- [ ] Documented in CLAUDE.md: How to test JWT locally (curl examples)
- [ ] All 11 acceptance criteria from Issue #27 checked off

**Key Files to Create/Modify**:
- Create: `integration-test/auth-flow.test.ts` (or use existing test file)
- Modify: `CLAUDE.md` (add JWT testing section)
- Verify: All existing tests still pass

**Integration Test Outline**:
```typescript
// integration-test/auth-flow.test.ts (pseudocode)
describe('JWT Authentication End-to-End', () => {
  test('Complete login → fetch → logout flow', async () => {
    // 1. Start with no token
    expect(localStorage.getItem('auth_token')).toBeNull()

    // 2. Submit login form
    const { token } = await login('user@example.com', 'password')

    // 3. Verify token stored
    expect(localStorage.getItem('auth_token')).toBe(token)

    // 4. Verify Apollo query succeeds
    const builds = await query(GET_BUILDS)
    expect(builds).toBeDefined()

    // 5. Verify request had Authorization header
    expect(lastRequestHeaders['authorization']).toBe(`Bearer ${token}`)

    // 6. Logout
    logout()

    // 7. Verify token cleared
    expect(localStorage.getItem('auth_token')).toBeNull()

    // 8. Verify unauthenticated query fails
    const error = await query(GET_BUILDS).catch(e => e)
    expect(error.message).toContain('401')
  })

  test('Token persists after page reload', async () => {
    login('user@example.com', 'password')
    expect(localStorage.getItem('auth_token')).toBeTruthy()

    // Simulate page reload
    window.location.reload()

    // Token should still be in localStorage (hydrated by AuthContext)
    expect(localStorage.getItem('auth_token')).toBeTruthy()
  })

  test('Unauthenticated request returns 401', async () => {
    // Clear token
    localStorage.removeItem('auth_token')

    // Query without Authorization header
    const error = await query(GET_BUILDS).catch(e => e)
    expect(error).toHaveProperty('status', 401)
    expect(error.message).toContain('Unauthorized')
  })
})
```

**Manual Testing Guide** (for CLAUDE.md):
```bash
# 1. Start all services
pnpm dev

# 2. Test login endpoint in GraphiQL
# POST http://localhost:4000/graphql
# Query:
mutation Login {
  login(email: "user@example.com", password: "password") {
    token
    user { id email }
  }
}

# 3. Copy token from response

# 4. Test authenticated query
# Add header: Authorization: Bearer <token>
query GetBuilds {
  builds { id status }
}
# Should succeed

# 5. Test unauthenticated query (without Authorization header)
# Should return 401 Unauthorized

# 6. Test frontend login
# Open http://localhost:3000
# Should redirect to /login if not authenticated
# Submit form, should store token and redirect to /builds

# 7. Verify localStorage
# Open DevTools → Application → LocalStorage → auth_token

# 8. Test logout
# Click logout button
# Should clear localStorage and redirect to /login
```

**Testing Checklist**:
- Run: `pnpm test` (all tests pass)
- Run: `pnpm build` (no TypeScript errors)
- Run: `pnpm lint:fix` (format checks pass)
- Manual: Login works end-to-end
- Manual: Unauthenticated requests rejected
- Manual: Token persists across reload
- Manual: Logout clears everything
- Manual: Error messages display correctly

**Success Criteria**:
- All tests pass: `pnpm test`
- Build succeeds: `pnpm build`
- No TypeScript errors or warnings
- Manual testing passes
- Documentation complete
- Issue #27 can be closed (all 11 acceptance criteria met)

---

## PART 6: SEQUENCING & TIMING

### Recommended Execution Order (Day 1 - 2 hours, Day 2 - 1 hour)

#### Day 1: Backend & Infrastructure (2 hours)

**9:00 AM - 9:45 AM: SUB-TASK 1** (Backend JWT Validation)
- Read FRESH_PER_REQUEST_PATTERN.md for security context
- Implement extractUserFromToken()
- Wire into Apollo Server context
- Protect 2-3 resolvers
- Write unit tests
- Verify: `pnpm test:graphql` passes

**9:45 AM - 10:30 AM: SUB-TASK 2** (Frontend Auth Infrastructure)
- Create AuthContext with login/logout
- Create Apollo auth link
- Update app layout
- Wire into Apollo Client
- Write tests
- Verify: `pnpm test:frontend` passes
- Check: tokens not yet stored/working (that's phase 3)

#### Day 2: UI & Integration (1 hour)

**2:00 PM - 2:45 PM: SUB-TASK 3** (Frontend Login UI)
- Create login form component
- Add login page route
- Add logout button
- Implement token storage via AuthContext
- Write tests
- Verify: `pnpm test:frontend` passes

**2:45 PM - 3:15 PM: SUB-TASK 4** (Integration & Validation)
- Run full test suite
- Fix any integration issues
- Manual end-to-end testing
- Update documentation
- Verify: `pnpm build` passes
- Close Issue #27

---

## PART 7: ARCHITECTURE PATTERNS & CITATIONS

### Pattern 1: Fresh-Per-Request Auth Context
**Citation**: FRESH_PER_REQUEST_PATTERN.md (merged)

JWT tokens are stateless and short-lived. AuthContext should always reflect the latest token from localStorage, not cached. Each request gets a fresh token value from storage.

```typescript
// ✅ CORRECT: Fresh token on every request
const { token } = useAuth() // Always reads current value from context
const authLink = setContext((_, { headers }) => ({
  headers: { authorization: token ? `Bearer ${token}` : '' }
}))

// ❌ WRONG: Stale token from closure
let cachedToken = null
const authLink = setContext((_, { headers }) => ({
  headers: { authorization: cachedToken ? `Bearer ${cachedToken}` : '' }
}))
```

**Why**: If token expires or is refreshed, component closures have stale values. Context ensures all consumers get the latest.

---

### Pattern 2: Apollo Auth Link with setContext
**Citation**: APOLLO_CLIENT_ANALYSIS.md (merged)

Use `setContext` middleware from @apollo/client/link/context, not ApolloLink directly. It's designed for async operations and header injection.

```typescript
// ✅ CORRECT: Use setContext for clean auth header injection
import { setContext } from '@apollo/client/link/context'

const authLink = setContext((_, { headers }) => ({
  headers: { ...headers, authorization: `Bearer ${token}` }
}))

// ❌ WRONG: Manual HttpLink extension
const httpLink = new HttpLink({
  uri: URL,
  request: (op) => {
    op.setContext({ headers: { authorization: `Bearer ${token}` } })
  }
})
```

**Why**: setContext is battle-tested, handles async token refresh gracefully, separates concerns.

---

### Pattern 3: Lazy Token Hydration from localStorage
**Citation**: DESIGN.md (Frontend Authentication section)

Don't block app render on localStorage read. Use lazy initializer in useState.

```typescript
// ✅ CORRECT: Lazy init (no blocking)
const [token, setToken] = useState<string | null>(() => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
})

// ❌ WRONG: Blocks during render
const token = typeof window !== 'undefined' 
  ? localStorage.getItem('auth_token') 
  : null
```

**Why**: Lazy init delays read until first render, avoiding hydration mismatch. Non-lazy reads during SSR can cause flashing.

---

### Pattern 4: Protected Resolver Guards
**Citation**: FRESH_PER_REQUEST_PATTERN.md (merged)

Always validate authentication at resolver entry point, not in middleware alone. Middleware ensures context.user exists, but resolver decides if that's sufficient.

```typescript
// ✅ CORRECT: Guard at resolver
Query.builds = (_, __, { user }) => {
  if (!user) throw new AuthenticationError('Not authenticated')
  // Now safe to use user.id for row-level security
  return prisma.build.findMany({ where: { userId: user.id } })
}

// ❌ WRONG: Assume middleware did everything
Query.builds = (_, __, { user }) => {
  return prisma.build.findMany() // What if user is undefined?
}
```

**Why**: Defensive programming. Middleware might be bypassed (tests, debugging), but resolver validation is explicit.

---

### Pattern 5: Cache Reset on Logout
**Citation**: DESIGN.md (Apollo Client section)

When logging out, must reset Apollo cache to remove stale user data. SimpleInMemoryCache persists across navigation.

```typescript
// ✅ CORRECT: Reset cache on logout
const handleLogout = () => {
  client.cache.reset()  // Clear all cached queries
  logout()               // Clear token
  router.push('/login')  // Redirect
}

// ❌ WRONG: Just clear token
const handleLogout = () => {
  logout()
  router.push('/login')  // Cache still has old user data!
}
```

**Why**: Apollo cache survives token change. Next query reuses cached data from previous user, exposing private data.

---

## PART 8: RISKS, MITIGATIONS & CONTINGENCIES

### Risk 1: Token Hydration Flashing
**Severity**: Medium  
**Symptom**: Page flashes between login/anonymous states on load

**Cause**: localStorage read is async relative to SSR render

**Mitigation**:
- Use lazy useState initializer
- Add suppressHydrationWarning to auth boundaries
- Consider storing token in cookie (httpOnly for security)

**Contingency**:
- If flash persists, check localStorage access timing
- Add console.log to track when token is read vs rendered

---

### Risk 2: Stale Token After Refresh
**Severity**: High  
**Symptom**: User logs out, but can still access data

**Cause**: Apollo cache not reset, or token not cleared from context

**Mitigation**:
- Always call client.cache.reset() on logout
- Verify token is cleared from localStorage
- Test: logout → refresh page → should be on /login

**Contingency**:
- Add cache cleanup to AuthContext.logout()
- Add redirect inside logout callback, not after

---

### Risk 3: Missing Login Mutation on Backend
**Severity**: High  
**Symptom**: Frontend form submits to undefined GraphQL mutation

**Cause**: Backend doesn't implement login resolver

**Mitigation**:
- Phase 1 includes adding login mutation to schema
- Define login return type: { token: String!, user: User! }

**Contingency**:
- Check GraphQL schema with GraphiQL before frontend tests
- Use mock mutation in frontend tests if backend not ready

---

### Risk 4: CORS Issues with Authorization Header
**Severity**: Medium  
**Symptom**: Apollo sends OPTIONS preflight, fails with CORS error

**Cause**: Custom headers (Authorization) require CORS preflight

**Mitigation**:
- Ensure backend sets CORS headers: Access-Control-Allow-Headers: Authorization
- Express/Apollo both need CORS middleware

**Contingency**:
- Check Network tab in DevTools for preflight response
- Verify Access-Control-Allow-Headers includes Authorization

---

### Risk 5: TypeScript Errors on Auth Types
**Severity**: Medium  
**Symptom**: `pnpm build` fails with "user is undefined" errors

**Cause**: context.user type not declared in Apollo context

**Mitigation**:
- Create `backend-graphql/src/types/context.ts` with ContextType
- Declare user?: { id: string; email: string }

**Contingency**:
- Add type assertion in resolvers: `const user = context.user!`
- Check tsconfig.json has strictNullChecks enabled

---

### Risk 6: Test Failures Due to Async State
**Severity**: Low  
**Symptom**: Tests fail intermittently with "token is null"

**Cause**: Test doesn't await async state updates

**Mitigation**:
- Use waitFor() from React Testing Library
- Mock localStorage in tests
- Clear localStorage between tests

**Contingency**:
- Add delays: `await new Promise(r => setTimeout(r, 100))`
- Check test setup/teardown for proper cleanup

---

## PART 9: INTERVIEW TALKING POINTS

### "Why This Sequence?"

> "I break JWT implementation into 4 phases: backend validation first, then frontend infrastructure, then UI, finally integration testing. This sequence minimizes blockers—frontend can't test auth without backend validation, frontend UI needs auth context to work.
>
> Phase 1 is the 'contract'—define what backend expects (Authorization header, JWT format). Phase 2-3 build frontend against that contract. Phase 4 validates the contract is correct.
>
> Parallel work is possible in day 1 if we have a team: while backend dev writes middleware, frontend dev can stub auth context against documentation. But I serialize on verification to catch integration bugs early."

---

### "How Do You Prevent Common Auth Mistakes?"

> "Three patterns I follow:
>
> 1. **Fresh-per-request tokens**: AuthContext always reads current token from state, not cached closures. If token expires, all consumers get the new value.
>
> 2. **Protected resolver guards**: Even if middleware sets context.user, resolvers still validate. Defensive coding—middleware might be bypassed in tests/debugging.
>
> 3. **Cache reset on logout**: Apollo cache persists across route changes. If I don't reset it, next user sees previous user's data. Always: `client.cache.reset()` before logout.
>
> These three patterns prevent 80% of auth bugs."

---

### "How Do You Handle Token Expiration?"

> "MVP doesn't implement token refresh—assumes tokens are long-lived (24h). For production:
>
> 1. Set JWT expiresIn to 1 hour (short-lived)
> 2. Issue refresh token (HTTPOnly cookie, 30 days)
> 3. When Apollo query fails with 401, use refresh token to get new JWT
> 4. Retry original query
>
> This is a second iteration—adds complexity, but necessary for security."

---

### "Why localStorage Instead of Cookies?"

> "Tradeoff: localStorage is simple for MVP, but vulnerable to XSS. httpOnly cookies are immune to XSS but require server-side session management.
>
> For interview: I choose localStorage because:
> - Clearer to explain (no session state on backend)
> - Easier to test (no cookie parsing in tests)
> - Sufficient for demo (not internet-scale)
>
> For production, I'd refactor to httpOnly cookies:
> - `Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Strict`
> - Frontend doesn't touch token (browser handles it)
> - No JS extraction possible
>
> The implementation doesn't change—AuthContext still provides token value, just fetched differently."

---

### "How Do You Test Auth Flows?"

> "Three levels:
>
> 1. **Unit tests**: Test auth context in isolation (localStorage mocked), test Apollo link header injection.
> 2. **Resolver tests**: Mock context.user, verify resolvers throw on missing user.
> 3. **Integration tests**: Full login form → mutation → Apollo query → logout. Tests that all layers work together.
>
> I don't mock backend in integration tests—use real Apollo Server + test database. This catches integration bugs like 'resolver forgot to check context.user'."

---

## PART 10: ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React + Next.js)                                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────────────┐   │
│  │ AuthContext      │ ◄──────►│ localStorage             │   │
│  │ (token, login,   │         │ ('auth_token': 'xxx')    │   │
│  │  logout)         │         └──────────────────────────┘   │
│  └────────┬─────────┘                                         │
│           │                                                   │
│           ▼                                                   │
│  ┌──────────────────────────────────────────────────┐        │
│  │ Apollo Client                                    │        │
│  │ ┌────────────────────────────────────────────┐  │        │
│  │ │ Auth Link (setContext)                     │  │        │
│  │ │ Injects: Authorization: Bearer <token>    │  │        │
│  │ └──────────────┬───────────────────────────┬┘  │        │
│  │                │                           │    │        │
│  │   Query.builds │ ◄───────────────────────► │ HTTP       │
│  │   Mutation.login                           │ Request    │
│  └────────────────────────────────────────────────┘        │
│           │                                                 │
│           │ with Authorization header                       │
│           ▼                                                 │
└───────────┼──────────────────────────────────────────────┘
            │
            │ NETWORK
            ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (Apollo GraphQL)                                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │ HTTP Request (Authorization: Bearer <token>)      │    │
│  └──────────────────────────┬───────────────────────┘    │
│                             │                             │
│                             ▼                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Apollo Server Context Middleware                  │    │
│  │ • Extract token from Authorization header        │    │
│  │ • JWT.verify(token) → user object                │    │
│  │ • Attach context.user to GraphQL execution      │    │
│  └──────────────────────────┬───────────────────────┘    │
│                             │                             │
│                             ▼                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ GraphQL Resolver (Query.builds)                    │    │
│  │ if (!context.user) throw AuthenticationError      │    │
│  │ return prisma.build.findMany(                     │    │
│  │   where: { userId: context.user.id }  // Row-level   │
│  │ )                                      // Security    │
│  └──────────────────────────┬───────────────────────┘    │
│                             │                             │
│                             ▼                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ PostgreSQL                                         │    │
│  │ Returns: [Build1, Build2, ...]                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## PART 11: COMPLETION CHECKLIST

Use this to verify Issue #27 is truly complete:

- [ ] **Phase 1: Backend JWT Validation**
  - [ ] `backend-graphql/src/middleware/auth.ts` exists
  - [ ] extractUserFromToken() validates JWT
  - [ ] Apollo context includes context.user
  - [ ] At least 2 resolvers protected
  - [ ] Unit tests pass
  - [ ] `pnpm test:graphql` passes

- [ ] **Phase 2: Frontend Auth Infrastructure**
  - [ ] `frontend/lib/auth-context.tsx` exists
  - [ ] `frontend/lib/apollo-auth-link.ts` exists
  - [ ] AuthProvider wraps app in layout.tsx
  - [ ] Apollo Client uses auth link
  - [ ] Unit tests pass
  - [ ] `pnpm test:frontend` passes

- [ ] **Phase 3: Frontend Login UI**
  - [ ] LoginForm component created
  - [ ] Login page route exists
  - [ ] Logout button implemented
  - [ ] Token stored in localStorage on login
  - [ ] Logout clears token and cache
  - [ ] Tests pass

- [ ] **Phase 4: Integration & Validation**
  - [ ] `pnpm test` passes (all tests)
  - [ ] `pnpm build` succeeds (no TypeScript errors)
  - [ ] Manual test: login → fetch → logout works
  - [ ] Manual test: unauthenticated request rejected
  - [ ] Documentation updated (CLAUDE.md)
  - [ ] All 11 acceptance criteria from Issue #27 met

- [ ] **Quality Gates**
  - [ ] No ESLint errors: `pnpm lint`
  - [ ] No TypeScript errors: `pnpm build`
  - [ ] All tests pass: `pnpm test`
  - [ ] Code formatted: `pnpm format:check` or `pnpm lint:fix`

- [ ] **Documentation**
  - [ ] CLAUDE.md updated with JWT testing guide
  - [ ] Comments added to non-obvious code
  - [ ] Commit messages reference Issue #27

---

## CONCLUSION

This orchestration plan demonstrates a systematic approach to breaking down complex, multi-layered features:

1. **Layer-first sequencing** minimizes blockers (backend → frontend infrastructure → UI)
2. **Clear acceptance criteria** per sub-task enables parallel work verification
3. **Risk acknowledgment** shows experience with common pitfalls
4. **Pattern citations** tie implementation to documented architecture
5. **Interview talking points** explain trade-offs and decisions

**Hiring managers love this because it shows**:
- Understanding of dependencies and sequencing
- Security mindset (auth guards, cache management)
- Testing discipline (unit + integration + manual)
- Communication ability (clear sub-tasks, documentation)
- Production awareness (httpOnly cookies, token refresh)

**Next step**: Create the 4 GitHub sub-issues and assign to team members (or self if solo).
