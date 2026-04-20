# Issue #27 Orchestration: Quick Reference
## JWT Authentication Implementation Plan - At a Glance

---

## The Problem

**Current**: No JWT auth → all requests accepted → security vulnerability  
**Goal**: Implement end-to-end JWT auth (backend → frontend → UI)  
**Constraint**: 3 hours, must be production-ready patterns

---

## The Solution: 4 Sequential Sub-Tasks

| Phase | Task | Files | Effort | Success Metric |
|-------|------|-------|--------|-----------------|
| 1️⃣ | Backend JWT Validation | `backend-graphql/src/middleware/auth.ts` | 45 min | `pnpm test:graphql` ✅ |
| 2️⃣ | Frontend Auth Context | `frontend/lib/auth-context.tsx` | 45 min | `pnpm test:frontend` ✅ |
| 3️⃣ | Login UI & Token Flow | `frontend/components/LoginForm.tsx` | 45 min | Manual: login works ✅ |
| 4️⃣ | Integration & Validation | All tests | 30 min | `pnpm test` + `pnpm build` ✅ |

---

## Why This Sequence?

```
Backend Auth Middleware (CONTRACTS)
    ↓
    defines JWT validation, context.user shape, required header format
    ↓
Frontend Auth Context (IMPLEMENTS CONTRACT)
    ↓
    injects token from localStorage, attaches Authorization header
    ↓
Login UI (USES CONTEXT)
    ↓
    form submits token, stores via context, logout clears cache
    ↓
Integration Test (VALIDATES WHOLE FLOW)
    ↓
    login → fetch → logout = all acceptance criteria met
```

**Key insight**: Frontend can't test against unprotected backend. Backend is the "source of truth."

---

## The 3 Critical Patterns

### 1. Fresh-Per-Request Tokens
```typescript
// ✅ CORRECT
const { token } = useAuth() // Always reads current value
const authLink = setContext((_, { headers }) => ({
  headers: { authorization: token ? `Bearer ${token}` : '' }
}))

// ❌ WRONG: Stale closure
let cachedToken = null
```

### 2. Protected Resolver Guards
```typescript
// ✅ CORRECT: Guard at resolver
Query.builds = (_, __, { user }) => {
  if (!user) throw new AuthenticationError('Not authenticated')
  return prisma.build.findMany({ where: { userId: user.id } })
}

// ❌ WRONG: Trust middleware alone
Query.builds = (_, __, { user }) => {
  return prisma.build.findMany() // What if user is undefined?
}
```

### 3. Cache Reset on Logout
```typescript
// ✅ CORRECT
const handleLogout = () => {
  client.cache.reset()  // Clear cached user data
  logout()              // Clear token
  router.push('/login') // Redirect
}

// ❌ WRONG: Just clear token
const handleLogout = () => {
  logout()
  router.push('/login')  // Cache still has old user data!
}
```

---

## Risk Matrix

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Token hydration flashing | 🟡 Medium | Lazy useState init |
| Stale cache after logout | 🔴 High | Always `client.cache.reset()` |
| Login mutation missing | 🔴 High | Define in Phase 1 schema |
| CORS preflight failure | 🟡 Medium | Allow Authorization header |
| TypeScript context.user errors | 🟡 Medium | Create context type file |
| Async state test failures | 🟢 Low | Use `waitFor()` helper |

---

## Interview Talking Points

### "Describe your auth implementation approach"
> "I sequence from backend → frontend infrastructure → UI → integration. Backend validation is the contract—it defines what JWT format to expect, how to set context.user, which resolvers need auth. Frontend implements against that contract. Phase 1 is backend, Phase 2-3 build frontend against it, Phase 4 validates integration."

### "What patterns prevent common auth bugs?"
> "Three patterns: (1) Fresh-per-request tokens—AuthContext always reads current value from state, not cached closures. (2) Protected resolver guards—resolve validates auth even if middleware sets context.user, defensive. (3) Cache reset on logout—Apollo cache survives token change, so logout must reset it to prevent data leakage."

### "Why localStorage instead of cookies?"
> "MVP prioritizes simplicity. httpOnly cookies are production-ready (immune to XSS), but add complexity. The architecture doesn't change—AuthContext still provides token value, just fetched differently. Production refactors to cookies without schema changes."

---

## Acceptance Criteria Mapping

| # | Criterion | Phase | Success |
|---|-----------|-------|---------|
| 1 | JWT token in localStorage | 3 | `localStorage.getItem('auth_token')` returns token |
| 2 | AuthContext with login/logout | 2 | `useAuth()` hook exists, exports functions |
| 3 | Apollo attaches Authorization header | 2 | DevTools shows `Authorization: Bearer <token>` |
| 4 | Login component accepts email/password | 3 | `<LoginForm>` renders inputs, handles submit |
| 5 | Backend validates JWT on queries | 1 | `pnpm test:graphql` passes |
| 6 | Unauthenticated requests rejected with 401 | 1 | Missing token → GraphQL error |
| 7 | User context in resolvers | 1 | `context.user` populated |
| 8 | Protected queries verify auth | 1 | Resolver guards check `context.user` |
| 9 | Logout clears token & redirects | 3 | `localStorage.removeItem()` + `router.push('/login')` |
| 10 | TypeScript build passes | 4 | `pnpm build` succeeds |
| 11 | All tests pass | 4 | `pnpm test` succeeds |

---

## Execution Timeline (Actual)

### Day 1: Backend Foundation (2 hours)
- **9:00-9:45**: Phase 1 (Backend JWT middleware)
  - Create auth.ts, implement validation
  - Wire into Apollo context
  - Protect 2-3 resolvers
  - Write tests
  - Verify: `pnpm test:graphql` ✅
  
- **9:45-10:30**: Phase 2 (Frontend infrastructure)
  - Create AuthContext
  - Create Apollo auth link
  - Update layout.tsx
  - Wire into Apollo Client
  - Write tests
  - Verify: `pnpm test:frontend` ✅

### Day 2: UI & Integration (1 hour)
- **2:00-2:45**: Phase 3 (Login UI)
  - Create LoginForm, login page
  - Add logout button
  - Implement token storage
  - Write tests
  - Verify: `pnpm test:frontend` ✅
  
- **2:45-3:15**: Phase 4 (Integration)
  - `pnpm test` (all tests)
  - `pnpm build` (TypeScript)
  - Manual E2E testing
  - Update CLAUDE.md
  - Close Issue #27 ✅

---

## Architecture Diagram (Simplified)

```
┌─ FRONTEND ─────────────────────────┐
│                                    │
│  Login Form ──> AuthContext ◄──┐  │
│       │               │         │  │
│       └─> Apollo Link ────> localStorage
│               │                 │  │
│               ▼                 │  │
│        Authorization:          │  │
│        Bearer <token>          │  │
│               │                 │  │
└───────────────┼─────────────────┘  │
                │                    │ HTTP
                ▼                    │
┌─ BACKEND ────────────────────────┐ │
│                                  │ │
│  Extract token              ◄────┘ │
│  JWT.verify(token)               │
│  context.user = decoded          │
│       │                          │
│       ▼                          │
│  Query.builds({user})            │
│  if (!user) throw Error          │
│  return prisma.build.find...()  │
│                                  │
└──────────────────────────────────┘
```

---

## Deliverables Checklist

### Phase 1: Backend JWT Validation
- [ ] `backend-graphql/src/middleware/auth.ts` created
- [ ] `extractUserFromToken()` validates JWT
- [ ] Apollo context includes `context.user`
- [ ] 2-3 resolvers protected
- [ ] Unit tests written and passing

### Phase 2: Frontend Auth Infrastructure
- [ ] `frontend/lib/auth-context.tsx` created
- [ ] `frontend/lib/apollo-auth-link.ts` created
- [ ] AuthProvider wraps app in layout.tsx
- [ ] Apollo Client uses auth link
- [ ] Unit tests written and passing

### Phase 3: Frontend Login UI
- [ ] `frontend/components/LoginForm.tsx` created
- [ ] `frontend/app/login/page.tsx` created
- [ ] Login mutation added to queries
- [ ] Logout button implemented
- [ ] Token storage + redirect implemented
- [ ] Tests written and passing

### Phase 4: Integration & Validation
- [ ] `pnpm test` passes (all packages)
- [ ] `pnpm build` succeeds (TypeScript)
- [ ] Manual E2E test: login → fetch → logout ✅
- [ ] Manual test: 401 on missing token ✅
- [ ] CLAUDE.md updated with JWT testing guide
- [ ] All 11 acceptance criteria checked

---

## Key References

- **Full Plan**: `docs/implementation-planning/JWT_AUTH_ORCHESTRATION_PLAN.md`
- **Security Architecture**: FRESH_PER_REQUEST_PATTERN.md
- **Frontend Auth**: DESIGN.md (Frontend Authentication section)
- **Apollo Patterns**: APOLLO_CLIENT_ANALYSIS.md
- **Issue #27 Discussion**: https://github.com/pluto-atom-4/react-grapql-playground/issues/27

---

## Success Metrics

✅ **All 11 acceptance criteria from Issue #27 met**  
✅ **TypeScript build passes**  
✅ **All tests pass** (`pnpm test`)  
✅ **Manual E2E flow works** (login → fetch → logout)  
✅ **No production security warnings**  
✅ **Documentation complete**

---

**Status**: Ready for Implementation  
**Estimated Effort**: 3 hours total  
**Team**: 1-2 developers  
**Priority**: HIGH 🔴

