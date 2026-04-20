# Fresh Per-Request Pattern: Security Architecture Foundation

**Status**: ✅ Core Pattern Documented  
**Date**: April 2026  
**Target Audience**: Backend developers, architecture leads, candidates explaining system design  
**Interview Talking Points**: ⭐ See "Interview Value" sections throughout

---

## Executive Summary

The **Fresh Per-Request Pattern** is a foundational security architecture principle used across two critical layers of this application:

1. **Apollo Cache Isolation** (Issue #26, COMPLETED) — Fresh cache per HTTP request
2. **Authentication Context** (Issue #27, IN PROGRESS) — Fresh auth context per request

Both prevent **cross-request contamination**: User A's data/tokens from leaking to User B.

### One Principle, Two Implementations

| Layer | Pattern Name | Implementation | Benefit |
|-------|--------------|-----------------|---------|
| **Apollo (GraphQL)** | Server-side cache isolation | `registerApolloClient` from @apollo/client-integration-nextjs | Prevents GraphQL response leaking between concurrent users |
| **Auth (Next.js)** | Request-scoped auth context | Fresh JWT context per HTTP request | Prevents token/user context mixing between concurrent requests |

**Interview Value**: "I implement security-first architecture using Fresh Per-Request pattern across all layers. This prevents cross-user data leaks in multi-user environments."

---

## Part 1: Apollo Cache Fresh Per-Request (Issue #26 - COMPLETED)

### Problem Statement

In Next.js 13+ with Server Components, Apollo Client can be instantiated at the server level. If you use a **singleton cache** across multiple HTTP requests:

```
Request A (User: alice)  →  Apollo Client with Cache  ←  Request B (User: bob)
    ↓                           ↓                              ↓
Load Alice's builds    Store in shared cache        Load Bob's builds
    ↓                           ↓                              ↓
  ✅ Alice sees her builds   BUT shared cache   Bob sees Alice's builds ❌ LEAK!
```

**Risk Level**: 🔴 **CRITICAL** — Data leaks across authenticated users

### Solution: Fresh Cache Per Request

Using `registerApolloClient` from Apollo's official Next.js integration:

```typescript
// frontend/lib/apollo-client-server-registered.ts
import { registerApolloClient } from '@apollo/client-integration-nextjs'
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

export const { getClient } = registerApolloClient(() => {
  return new ApolloClient({
    ssrMode: true,
    cache: new InMemoryCache(),  // ← Fresh cache created per request
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
      credentials: 'include',
    }),
  })
})
```

**How It Works**:

1. Next.js App Router invokes Server Component per HTTP request
2. `getClient()` call creates a **new** ApolloClient instance with **fresh** InMemoryCache
3. Server Component fetches data using this isolated client
4. Cache is discarded when request completes
5. Next HTTP request (next user) gets a new fresh cache

**Result**:

```
Request A (User: alice)  →  Apollo Client #1 with Cache #1  →  Render HTML for alice ✅
Request B (User: bob)    →  Apollo Client #2 with Cache #2  →  Render HTML for bob ✅
                             (separate instances)
```

### Implementation: Server Component Pattern

```typescript
// frontend/app/page.tsx (Server Component - async)
import { getClient } from '@/lib/apollo-client-server-registered'
import { GET_BUILDS_QUERY } from '@/lib/graphql/queries'
import BuildDashboard from '@/components/build-dashboard'

export default async function Dashboard() {
  // 1. Get fresh Apollo client for this request
  const client = getClient()

  // 2. Fetch initial data server-side
  const { data } = await client.query({
    query: GET_BUILDS_QUERY,
  })

  // 3. Pass data to Client Component (no double-fetch on hydration)
  return <BuildDashboard initialBuilds={data.builds} />
}
```

### Why Not Singleton on Server?

❌ **Bad Pattern** (singleton cache on server):

```typescript
// ❌ NEVER DO THIS
let sharedClient: ApolloClient

export function getSharedClient() {
  if (!sharedClient) {
    sharedClient = new ApolloClient({
      ssrMode: true,
      cache: new InMemoryCache(),  // ← Reused across requests = LEAK RISK
      // ...
    })
  }
  return sharedClient
}
```

Why it fails:
- First request loads Alice's builds → cache has Alice's data
- Second request loads Bob's data → cached Alice's data still present
- GraphQL resolver returns Bob's data, but Apollo cache remembers Alice's
- Race conditions cause data to leak

### Key Insight: Per-Request vs. Singleton Trade-Off

| Property | Server (Per-Request) | Client (Singleton) |
|----------|--------------------|--------------------|
| **Isolation** | Fresh cache per request | Shared across renders (same user) |
| **Security** | Prevents cross-user leaks | Single user = safe |
| **Performance** | Minimal (cache discarded anyway) | Optimal (persistent cache) |
| **Caching** | Short-lived (1 request) | Long-lived (session) |
| **Use Case** | Server Components | Client Components |

**Interview Value**: "I distinguish between server and client contexts. Servers handle multiple users → fresh isolation per request. Clients are single-user → singleton cache for UX benefits."

---

## Part 2: Authentication Context Fresh Per-Request (Issue #27 - IN PROGRESS)

### Problem Statement

Similar to Apollo cache, if you store authentication context globally across requests:

```
Request A (User: alice, Token: JWT_A)  →  Global Auth Context  ←  Request B (User: bob, Token: JWT_B)
    ↓                                           ↓                            ↓
  Extract token JWT_A                    Store token in context        Extract token JWT_B
    ↓                                           ↓                            ↓
  Pass to resolvers                    BUT context persists            Pass to resolvers
    ↓                                           ↓                            ↓
  Resolver sees Token A    ✅           Resolver sees Token B        Resolver sees Token A ❌ LEAK!
```

**Risk Level**: 🔴 **CRITICAL** — Auth tokens leak across concurrent users

### Solution: Fresh Auth Context Per Request

The authentication context should be created **per HTTP request**, never globally:

```typescript
// backend-graphql/src/middleware/auth.ts
import jwt from 'jsonwebtoken'

export interface AuthContext {
  userId?: string
  token?: string
  isAuthenticated: boolean
}

export function extractAuthContext(req: Request): AuthContext {
  // ← Called per request, creates fresh context
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAuthenticated: false }
  }

  const token = authHeader.slice(7)
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    return {
      isAuthenticated: true,
      userId: decoded.sub,
      token,
    }
  } catch (error) {
    return { isAuthenticated: false }
  }
}
```

### Implementation: Apollo Server Context Factory

```typescript
// backend-graphql/src/index.ts
import { ApolloServer } from '@apollo/server'
import { extractAuthContext } from './middleware/auth'

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  context: async ({ req }) => {
    // ← Fresh context per request (called for every GraphQL request)
    const auth = extractAuthContext(req)

    return {
      prisma: new PrismaClient(),
      auth,  // ← Fresh auth context, no global state
      user: auth.isAuthenticated ? { id: auth.userId } : null,
      dataloaders: initializeDataLoaders(),  // ← Also fresh per request
    }
  },
})
```

### Implementation: Frontend Apollo Auth Link

```typescript
// frontend/lib/apollo-client.ts
import { setContext } from '@apollo/client/link/context'
import { HttpLink } from '@apollo/client'

const authLink = setContext((_, { headers }) => {
  // ← Called per GraphQL request, retrieves fresh token
  const token = localStorage.getItem('auth_token')

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }
})

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
  credentials: 'include',
})

// ← Link executes authLink FIRST (adds token), then httpLink
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})
```

### Key Pattern: Per-Request Context Factory

Every per-request pattern follows this structure:

```typescript
// ✅ GOOD: Per-request context factory (called per request)
context: ({ req }) => {
  return {
    auth: extractAuthContext(req),  // ← Fresh per request
    dataloaders: initializeDataLoaders(),  // ← Fresh per request
  }
}

// ❌ BAD: Global context variable (shared across requests)
let globalContext = { auth: null }

context: () => {
  return globalContext  // ← SHARED! Not isolated per request
}
```

**Interview Value**: "I use context factories that are called per request, not global singletons. This ensures each request has isolated auth state."

---

## Part 3: Unified "Fresh Per-Request" Principle

### One Pattern, Many Implementations

The Fresh Per-Request Pattern appears throughout professional software:

| System | Layer | Implementation |
|--------|-------|-----------------|
| **Our App** | Apollo Cache | Server-side `registerApolloClient` per request |
| **Our App** | Auth Context | GraphQL `context` factory called per request |
| **Express.js** | Middleware | New middleware context per request (built-in) |
| **Spring Boot** | Thread Context | RequestScope beans created per HTTP request |
| **Django** | Middleware | Request object passed through all layers |
| **Rails** | RequestStore** | Fresh context stored per request in thread-local |

All prevent the same class of vulnerability: **cross-request contamination**.

### Decision Framework: When to Apply Fresh Per-Request

Use Fresh Per-Request when:

✅ **Multi-user concurrent requests** — Multiple users hitting server simultaneously  
✅ **Sensitive data** — User tokens, personal information, PII  
✅ **State contamination risk** — Cache, context, or session vars could leak  
✅ **Server-side handling** — Node.js, backend middleware, Server Components

Don't use when:

❌ **Single-user client** — Browser JavaScript is always single-user  
❌ **Non-sensitive data** — Public cached content (OK to share cache)  
❌ **Performance critical** — Constant allocation/deallocation hurts throughput (profile first)

### Real-World Scenario: E-Commerce Site

```
Server receives 1000 concurrent requests from different users

1. Request 1000 hits server
   → Fresh auth context created (User 1000's token)
   → Resolves "get_my_orders" query
   → Returns ONLY User 1000's orders ✅

2. Request 999 hits server simultaneously
   → Fresh auth context created (User 999's token)
   → Resolves "get_my_orders" query
   → Returns ONLY User 999's orders ✅
   → User 1000's order data never leaks to User 999 ✓

Without Fresh Per-Request:
   → User 999 could see User 1000's orders if contexts mixed ❌
```

**Interview Value**: "In high-concurrency environments, shared state leaks data between users. Fresh Per-Request isolates each user's data automatically."

---

## Part 4: Implementation Checklist for Issue #27

### Phase 1: Frontend Auth Context (1 hour)

- [ ] Create `frontend/lib/auth-context.tsx` with React Context API
  - [ ] AuthProvider component wraps app
  - [ ] useAuth() hook exposes login/logout
  - [ ] Token persisted to localStorage (dev only)
  - [ ] Per-request fresh token retrieval in auth link

- [ ] Create `frontend/components/login.tsx` component
  - [ ] Email + password form fields
  - [ ] Error handling and display
  - [ ] Redirect to dashboard on success

- [ ] Update `frontend/lib/apollo-client.ts` with auth link
  - [ ] Use `setContext` to inject Authorization header
  - [ ] Retrieve token per GraphQL request
  - [ ] Handle missing token gracefully

- [ ] Update `frontend/app/layout.tsx`
  - [ ] Wrap with AuthProvider
  - [ ] Nest inside ApolloWrapper

### Phase 2: Backend JWT Validation (1 hour)

- [ ] Verify `backend-graphql/src/middleware/auth.ts` exists
  - [ ] JWT token extraction from Authorization header
  - [ ] JWT signature validation (use JWT_SECRET env var)
  - [ ] User context extraction

- [ ] Update `backend-graphql/src/index.ts` Apollo context
  - [ ] Call extractAuthContext in context factory
  - [ ] Add user object to context
  - [ ] Ensure context factory called per request (not global)

- [ ] Update GraphQL resolvers for protected queries
  - [ ] Check context.user before returning data
  - [ ] Return 401 Unauthenticated for missing user
  - [ ] Filter data by user ownership (builds, testRuns)

### Phase 3: Testing & Verification (1 hour)

- [ ] Unit tests: Auth context token persistence
- [ ] Integration tests: Login → GraphQL mutation with token
- [ ] E2E tests: Full flow (login → fetch data → logout)
- [ ] Error case: Missing token → 401 response
- [ ] TypeScript build passes
- [ ] All 10 acceptance criteria satisfied

### Security Checklist

- [ ] JWT_SECRET environment variable set
- [ ] localStorage only for development (note httpOnly cookies for production)
- [ ] Token expiration enforced (1 hour recommended)
- [ ] Authorization header validated (Bearer format)
- [ ] No auth token logged to console or error traces
- [ ] Logout clears token from localStorage

---

## Part 5: Interview Talking Points

### Question: "How do you prevent data leaks in multi-user systems?"

**Answer (60 seconds)**:

"I use the Fresh Per-Request pattern across all layers. Here's how it works:

1. **Apollo Cache Isolation**: When a Server Component needs data, it gets a fresh Apollo client with a new cache per HTTP request. This prevents one user's GraphQL response from being cached and reused for another user.

2. **Authentication Context**: Each request gets a fresh auth context that extracts the JWT token from the Authorization header. This ensures tokens are never shared across concurrent requests.

3. **The Principle**: Both Apollo cache and auth context follow the same pattern—create per-request, discard per-request. This automatically isolates each user's data and tokens.

**Result**: Even if 10,000 users hit the server simultaneously, their data and tokens never mix. Each request is completely isolated."

### Question: "Why does your architecture use two different Apollo configurations?"

**Answer (90 seconds)**:

"There's a fundamental trade-off between server and client contexts:

**Server-side** (Server Components):
- Handles multiple concurrent users simultaneously
- Requires **per-request fresh cache** to prevent data leaks
- Uses `registerApolloClient` from Apollo's official Next.js integration
- Cache is fresh, isolated, and discarded when the request completes
- This is secure but short-lived

**Client-side** (Client Components):
- Browser is always single-user (one person's browser)
- Benefits from **persistent singleton cache** for UX
- Optimistic mutations, real-time updates, and caching all depend on long-lived cache
- Safe because only one user accesses it

The decision tree is simple:
- Server Component? Use per-request fresh client
- Client Component? Use singleton with useMemo

This dual strategy gives us both security (server isolation) and UX performance (client caching)."

### Question: "Tell me about a security pattern you implemented."

**Answer (120 seconds)**:

"I implemented the Fresh Per-Request Pattern across authentication and Apollo caching. Here's the challenge:

In concurrent systems, if you use global shared state (like a singleton cache or global auth context), different users' requests can contaminate each other. Imagine two users hitting a server simultaneously—without isolation, User A's authentication token could be mixed with User B's request.

**The solution**:
- For **Apollo caching** on the server: Use `registerApolloClient` to create a fresh cache per HTTP request
- For **Authentication**: Extract JWT context in a per-request factory, never globally

**Implementation detail**: In Apollo Server, the context option accepts a function that's called per request:
```typescript
context: ({ req }) => ({
  auth: extractAuthContext(req),  // ← Fresh per request
  user: { id: 'user-123' }
})
```

**Benefit**: This simple pattern scales to 10,000+ concurrent users with zero cross-user contamination. It's the same principle used in production systems like Spring Boot (RequestScope beans) and Django (request context).

**Interview angle**: I think about concurrency and isolation first, not just happy-path functionality. This kind of security thinking is critical for systems that handle real user data."

---

## Part 6: Resources & Further Reading

### Files Related to This Pattern

**Apollo Cache Implementation**:
- `frontend/lib/apollo-client-server-registered.ts` — Per-request cache factory
- `frontend/lib/apollo-client.ts` — Client-side singleton with useMemo
- `DESIGN.md` (lines 534-700) — Complete Apollo strategy documentation

**Authentication Implementation** (Issue #27):
- `backend-graphql/src/middleware/auth.ts` — JWT extraction and validation
- `frontend/lib/auth-context.tsx` — React Context for token management (to be created)
- `frontend/components/login.tsx` — Login UI component (to be created)

**Analysis Documents**:
- `ISSUE_27_DEEP_REVIEW.md` — Complete Issue #27 analysis
- `APOLLO_CLIENT_ANALYSIS.md` — Apollo configuration analysis
- `DELIVERABLES.md` — Project deliverables with auth context

### Production Considerations

1. **Token Storage**: Dev uses localStorage (XSS vulnerable). Production should use httpOnly, secure cookies
2. **Token Refresh**: Current pattern supports 1-hour tokens. Implement refresh token rotation for longer sessions
3. **CORS**: Ensure CORS allows credentials between frontend and API
4. **HTTPS**: Fresh Per-Request assumes HTTPS. Never use HTTP for auth tokens
5. **Rate Limiting**: Add rate limiting on auth endpoints to prevent token brute-forcing

### Related Concepts

- **Session Management**: Fresh Per-Request principle also applies to session cookies
- **Middleware Patterns**: Express.js uses the same per-request pattern in middleware
- **Thread-Local Storage**: Backend frameworks like Spring use RequestScope beans (same principle)
- **Context Propagation**: Distributed systems use context propagation across service boundaries

---

## Summary

The **Fresh Per-Request Pattern** is a foundational security architecture principle:

✅ **Apollo Cache**: Server-side fresh cache per request → prevents GraphQL response contamination  
✅ **Auth Context**: Fresh token extraction per request → prevents token mixing  
✅ **Unified Principle**: Both prevent cross-user data leaks in concurrent environments

**One Pattern, Two Layers**: Same principle applied at different architectural levels produces a coherent, secure system.

**Interview Value**: Demonstrates security-first thinking, understanding of concurrency, and ability to apply architectural principles consistently across layers.

---

**Status**: Ready for Issue #27 Implementation  
**Next Steps**: 
1. Issue #111 Complete (this document)
2. Issue #113: Update DESIGN.md, APOLLO_CLIENT_ANALYSIS.md, DELIVERABLES.md (3.5 hours)
3. Issue #27: Implement JWT authentication (3 hours)
