# Issue #120: Login Component - Architecture & Data Flow Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE LOGIN SYSTEM                           │
└─────────────────────────────────────────────────────────────────────────┘

                              FRONTEND (React/Next.js)
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  /login Page (Server Component)                                       │
│    └─ LoginForm (Client Component)                                    │
│         ├─ Email Input                                                │
│         ├─ Password Input                                             │
│         ├─ Submit Button                                              │
│         ├─ Error Display                                              │
│         └─ Loading Spinner                                            │
│                                                                        │
│  Authentication Flow:                                                 │
│    1. Form Validation (client-side)                                   │
│    2. useMutation(LOGIN_MUTATION)                                     │
│    3. Apollo Client sends to /graphql                                 │
│    4. Receive token in response                                       │
│    5. useAuth().login(token) → localStorage + AuthContext            │
│    6. router.push('/') → redirect to dashboard                        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
           ↓ HTTP GraphQL Request ↓           ↑ JSON Response ↑
┌────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Apollo GraphQL Server)                     │
│                                                                        │
│  Mutation.login(email: String!, password: String!): AuthPayload!     │
│    ├─ Validate input (email, password required)                       │
│    ├─ Query: findUnique(User, { email })                              │
│    ├─ Compare: bcrypt.compare(password, user.passwordHash)            │
│    ├─ Generate: generateToken(user.id) → JWT                          │
│    └─ Return: { token: "eyJ..." }                                     │
│                                                                        │
│  Context:                                                              │
│    - extractUserFromToken() validates JWT on every request            │
│    - context.user set from token (null if no token/invalid)          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
           ↓ Query User Table ↓           ↑ User Data ↑
┌────────────────────────────────────────────────────────────────────────┐
│                         DATABASE (PostgreSQL)                          │
│                                                                        │
│  User Table:                                                           │
│    ├─ id: String (CUID) - PRIMARY KEY                                 │
│    ├─ email: String UNIQUE - login identifier                         │
│    ├─ passwordHash: String - bcrypt hash (NOT plaintext)             │
│    ├─ createdAt: DateTime                                             │
│    └─ updatedAt: DateTime                                             │
│                                                                        │
│  Example User:                                                         │
│    id: "clm8x9z2a000001j80d9w0p1"                                      │
│    email: "user@example.com"                                           │
│    passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoM..."                    │
│    createdAt: 2026-04-20T10:00:00Z                                    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
app/layout.tsx (Root Layout)
├─ AuthProvider (wraps entire app)
│  └─ ApolloWrapper (Apollo Client provider)
│     └─ Children
│
├─ app/page.tsx (Dashboard - Protected)
│  └─ BuildDashboard (Client Component)
│     └─ Requires: context.user to be set (token injected)
│
└─ app/(auth)/login/page.tsx (Login Page - PUBLIC)
   └─ LoginForm (Client Component)
      ├─ Email Input
      ├─ Password Input
      ├─ useMutation(LOGIN_MUTATION)
      │  ├─ On Success: useAuth().login(token) → redirect to /
      │  └─ On Error: display error message
      └─ useRouter() for redirect

Authentication Flow:
  1. User navigates to /login (public route)
  2. LoginForm renders (no auth required)
  3. User enters credentials
  4. Form submits → LOGIN_MUTATION sent
  5. Backend validates credentials + generates token
  6. Token stored in localStorage via AuthContext
  7. Apollo Client reads token from AuthContext
  8. Redirect to / (dashboard)
  9. Dashboard fetches builds with Authorization: Bearer <token>
  10. Backend accepts request (context.user is set)
  11. Dashboard renders with data
```

---

## Data Flow Diagram (Detailed)

```
STEP 1: User submits login form
┌────────────────────────────────┐
│ LoginForm.handleSubmit()       │
├────────────────────────────────┤
│ 1. validateForm()              │
│    - check email required      │
│    - check email format        │
│    - check password required   │
│    - check password length >= 8│
│                                │
│ 2. If valid: loginMutation()   │
│    - call: useMutation with    │
│      variables: {              │
│        email: "...",           │
│        password: "..."         │
│      }                         │
└────────────────────────────────┘
           ↓


STEP 2: Apollo sends GraphQL mutation
┌────────────────────────────────────────────────┐
│ Apollo Client Network Request                  │
├────────────────────────────────────────────────┤
│ POST http://localhost:4000/graphql             │
│ Headers:                                       │
│   Content-Type: application/json               │
│   Authorization: Bearer <current-token>*       │
│     (*empty on first login)                    │
│                                                │
│ Body:                                          │
│ {                                              │
│   "operationName": "Login",                    │
│   "query": "mutation Login(...) {...}",        │
│   "variables": {                               │
│     "email": "user@example.com",               │
│     "password": "password123"                  │
│   }                                            │
│ }                                              │
└────────────────────────────────────────────────┘
           ↓


STEP 3: Backend receives & validates
┌──────────────────────────────────────────────────┐
│ Mutation.login() Resolver                        │
├──────────────────────────────────────────────────┤
│ 1. Input validation                              │
│    - if (!email?.trim()) throw 'Email required' │
│    - if (!password?.trim()) throw 'Pwd required'│
│                                                  │
│ 2. Query database                               │
│    - const user = await prisma.user.findUnique( │
│        where: { email: args.email.toLowerCase()}│
│      )                                           │
│                                                  │
│ 3. Password verification                        │
│    - if (!user) throw 'Invalid email or pwd'   │
│    - const valid = await bcrypt.compare(        │
│        args.password,                           │
│        user.passwordHash                        │
│      )                                           │
│    - if (!valid) throw 'Invalid email or pwd'  │
│                                                  │
│ 4. Generate token                               │
│    - const token = generateToken(user.id)       │
│                                                  │
│ 5. Return response                              │
│    - return { token }                           │
└──────────────────────────────────────────────────┘
           ↓


STEP 4: Backend returns JWT token
┌────────────────────────────────────────┐
│ GraphQL Response (Success)             │
├────────────────────────────────────────┤
│ {                                      │
│   "data": {                            │
│     "login": {                         │
│       "token": "eyJhbGciOiJIUzI1..."  │
│     }                                  │
│   }                                    │
│ }                                      │
│                                        │
│ Token payload (decoded):               │
│ {                                      │
│   "id": "clm8x9z2a000001j80d9w0p1",  │
│   "iat": 1713607200,                   │
│   "exp": 1713693600  (24h later)       │
│ }                                      │
└────────────────────────────────────────┘
           ↓


STEP 5: Frontend stores token
┌────────────────────────────────────────────┐
│ LoginForm.useMutation onCompleted callback│
├────────────────────────────────────────────┤
│ 1. Extract token from response             │
│    - const token = result.data.login.token │
│                                            │
│ 2. Call useAuth().login(token)             │
│    ├─ setToken(newToken)                   │
│    │  (React state update)                 │
│    │                                       │
│    └─ localStorage.setItem(                │
│        'auth_token',                       │
│        newToken                            │
│      )                                     │
└────────────────────────────────────────────┘
           ↓


STEP 6: Redirect to dashboard
┌──────────────────────────────────┐
│ router.push('/')                 │
├──────────────────────────────────┤
│ Navigation to: /                 │
│   (app/page.tsx)                 │
│   BuildDashboard component       │
└──────────────────────────────────┘
           ↓


STEP 7: Apollo Client injects token
┌───────────────────────────────────────────┐
│ Apollo Auth Link                          │
├───────────────────────────────────────────┤
│ const authLink = setContext((_, ctx) => {│
│   const { token } = useAuth()             │
│   // token now populated from state       │
│   return {                                │
│     headers: {                            │
│       authorization: token                │
│         ? `Bearer ${token}`               │
│         : ''                              │
│     }                                     │
│   }                                       │
│ })                                        │
│                                           │
│ Result: All requests now include token   │
└───────────────────────────────────────────┘
           ↓


STEP 8: Dashboard fetches protected data
┌────────────────────────────────────────────┐
│ app/page.tsx Server Component              │
├────────────────────────────────────────────┤
│ const client = getClient()                 │
│ const result = await client.query({        │
│   query: BUILDS_QUERY,                     │
│   variables: { limit: 10, offset: 0 }     │
│ })                                         │
│                                            │
│ Network Request:                           │
│   POST /graphql                            │
│   Authorization: Bearer <token>            │
│                                            │
│ Backend:                                   │
│   context.user = extractUserFromToken()   │
│   // context.user.id = "clm8x9z2a..."     │
│   // Resolver proceeds (not Unauthorized) │
└────────────────────────────────────────────┘
           ↓


STEP 9: Dashboard renders
┌────────────────────────────────────┐
│ BuildDashboard (Client Component)  │
├────────────────────────────────────┤
│ Receives initialBuilds from server │
│ Renders build list                 │
│ Uses Apollo Cache for subsequent   │
│ queries and mutations              │
└────────────────────────────────────┘
           ↓
      SUCCESS!
```

---

## Token Flow Across System

```
localStorage (Browser)
│
├─ KEY: 'auth_token'
├─ VALUE: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
│
└─ Lifecycle:
   1. EMPTY on page load (first time)
   2. SET when user logs in successfully
   3. PERSIST across page reloads
   4. READ by AuthProvider on mount
   5. UPDATED by useAuth().login()
   6. CLEARED by useAuth().logout()

        ↓ (read on app load) ↓

AuthContext (React State)
│
├─ State: token = 'eyJhbGc...' | null
├─ Methods:
│  ├─ login(token: string) → setToken + localStorage.setItem
│  ├─ logout() → setToken(null) + localStorage.removeItem
│  └─ Hook: useAuth() → { token, login, logout }
│
└─ Consumers:
   ├─ Apollo auth link (reads token for requests)
   ├─ LoginForm (calls login on successful mutation)
   ├─ Dashboard (redirects if token missing)
   └─ Logout button (calls logout)

        ↓ (injected into requests) ↓

Apollo Client Auth Link
│
├─ Reads: const { token } = useAuth()
├─ Formats: Authorization: Bearer <token>
├─ Injects: into every GraphQL request
│
└─ Applied to:
   ├─ Queries (e.g., BUILDS_QUERY)
   ├─ Mutations (e.g., CREATE_BUILD_MUTATION)
   └─ Any HTTP request to /graphql

        ↓ (sent in header) ↓

Backend GraphQL Server
│
├─ Receives: Authorization header
├─ Extracts: extractUserFromToken()
│  ├─ Parse: "Bearer <token>"
│  ├─ Verify: jwt.verify(token, JWT_SECRET)
│  └─ Return: { id: user.id }
│
├─ Sets: context.user = { id: ... } | null
│
└─ Resolvers use context.user:
   ├─ Queries:
   │  ├─ builds: if (!context.user) throw Unauthorized
   │  ├─ build: if (!context.user) throw Unauthorized
   │  └─ testRuns: if (!context.user) throw Unauthorized
   │
   ├─ Mutations:
   │  ├─ createBuild: if (!context.user) throw Unauthorized
   │  ├─ updateBuildStatus: if (!context.user) throw Unauthorized
   │  ├─ addPart: if (!context.user) throw Unauthorized
   │  └─ submitTestRun: if (!context.user) throw Unauthorized
   │
   └─ login (special - no auth required):
      - No context.user check
      - Returns token to client
```

---

## Session Persistence Flow

```
SESSION CREATED:
  User logs in
    ↓
  Token received from server
    ↓
  Token stored: localStorage.setItem('auth_token', token)
    ↓
  Token state: useAuth().token = token

SESSION PERSISTS (page reload):
  1. User closes tab/refreshes page
     - localStorage PERSISTS
     - React state RESET (lost)

  2. Page reloads
     - AuthProvider mounts
     - AuthProvider useEffect runs (empty dependency array)

  3. AuthProvider useEffect:
     ```typescript
     useEffect(() => {
       if (typeof window !== 'undefined') {
         const storedToken = localStorage.getItem('auth_token')
         setToken(storedToken)  // Read from storage
       }
     }, [])  // Runs once on mount
     ```

  4. Token restored from localStorage
     - useAuth().token = storedToken

  5. Apollo auth link reads new token
     - Next request has Authorization header

  6. Protected queries work again
     - context.user is set (token valid)

SESSION ENDS (logout):
  User clicks logout button
    ↓
  useAuth().logout() called
    ↓
  localStorage.removeItem('auth_token')
    ↓
  setToken(null)
    ↓
  useAuth().token = null
    ↓
  Apollo auth link has no token
    ↓
  Next request: Authorization: ''
    ↓
  Backend: context.user = null
    ↓
  Resolvers throw: Unauthorized
    ↓
  redirect to /login
```

---

## Error Scenarios & Recovery

```
SCENARIO 1: Invalid Email Format
  User enters: "notanemail"
  ↓
  Client validation triggers
  ↓
  Error: "Please enter a valid email address"
  ↓
  Button stays disabled
  ↓
  User fixes input
  ↓
  Error clears on input change
  ↓
  RETRY

SCENARIO 2: Password Too Short
  User enters: "short"
  ↓
  Client validation triggers
  ↓
  Error: "Password must be at least 8 characters"
  ↓
  Button stays disabled
  ↓
  User types more characters
  ↓
  Error clears
  ↓
  Button enables
  ↓
  RETRY

SCENARIO 3: Non-Existent User
  User enters: "nobody@example.com" + "password123"
  ↓
  Form validates OK (passes format checks)
  ↓
  Submit → LOGIN_MUTATION sent
  ↓
  Backend: User.findUnique returns null
  ↓
  Backend throws: "Invalid email or password"
  ↓
  Apollo catches error
  ↓
  Frontend displays: "Invalid email or password"
  ↓
  Button re-enabled
  ↓
  User can RETRY

SCENARIO 4: Wrong Password
  User enters: "user@example.com" + "wrongpassword"
  ↓
  Form validates OK
  ↓
  Submit → LOGIN_MUTATION sent
  ↓
  Backend: User found, bcrypt.compare returns false
  ↓
  Backend throws: "Invalid email or password"
  ↓
  (Same as scenario 3)
  ↓
  User RETRIES with correct password

SCENARIO 5: Network Error
  User submits form
  ↓
  Apollo client tries to reach /graphql
  ↓
  Network request fails (server down, no internet, etc.)
  ↓
  Apollo catches network error
  ↓
  Frontend displays error message
  ↓
  Button re-enabled
  ↓
  User can RETRY

SCENARIO 6: Token Expired
  User logged in 24+ hours ago
  ↓
  Token still in localStorage
  ↓
  User refreshes page
  ↓
  AuthProvider restores token from localStorage
  ↓
  Apollo injects expired token
  ↓
  Backend: jwt.verify throws TokenExpiredError
  ↓
  Backend: extractUserFromToken throws "Token expired"
  ↓
  Resolver rejects request
  ↓
  Frontend receives error
  ↓
  Redirect to /login (manual or automatic)
  ↓
  User LOGS IN AGAIN
```

---

## Security Checkpoints

```
┌─ FRONTEND ─────────────────────────────────────────┐
│                                                   │
│ ✅ Client-side validation (email format, length) │
│ ✅ SSR-safe localStorage access                  │
│ ✅ No plaintext passwords sent over HTTP          │
│ ✅ HTTPS required (enforced by env)              │
│ ✅ No sensitive data in state (e.g., password)   │
│ ✅ Errors don't leak sensitive info              │
│ ✅ Content-Security-Policy headers               │
│ ✅ No hardcoded secrets in code                   │
│                                                   │
└───────────────────────────────────────────────────┘
           ↓ (HTTPS encrypted) ↓
┌─ NETWORK ──────────────────────────────────────────┐
│                                                   │
│ ✅ TLS/SSL encryption (HTTPS only)               │
│ ✅ Token in Authorization header (not URL)       │
│ ✅ CORS configured (only trusted origins)        │
│ ✅ No token logging in server logs                │
│                                                   │
└───────────────────────────────────────────────────┘
           ↓ (HTTPS decrypts) ↓
┌─ BACKEND ──────────────────────────────────────────┐
│                                                   │
│ ✅ JWT signature verification (tamper detection) │
│ ✅ Bcrypt password hashing (irreversible)        │
│ ✅ Generic error messages (no user enumeration)  │
│ ✅ Server-side input validation                  │
│ ✅ JWT expiration enforcement (24h)              │
│ ✅ Token secret in environment variable          │
│ ✅ Protected resolvers check context.user        │
│ ✅ No password ever transmitted/stored plaintext  │
│ ✅ No debug info in error responses              │
│                                                   │
└───────────────────────────────────────────────────┘
           ↓ (verified token) ↓
┌─ DATABASE ─────────────────────────────────────────┐
│                                                   │
│ ✅ Bcrypt hash stored (not plaintext)            │
│ ✅ Email unique constraint (prevents duplicates) │
│ ✅ No sensitive data in indexes                   │
│ ✅ Database access controlled (VPC, auth)       │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## TypeScript Type Safety

```typescript
// Request Type
interface LoginInput {
  email: string;      // validated: email format
  password: string;   // validated: length >= 8
}

// Response Type
interface AuthPayload {
  token: string;      // JWT token (24h expiry)
}

// Apollo Mutation Result
interface LoginResult {
  data: {
    login: AuthPayload;
  };
}

// Form State Type
interface FormState {
  email: string;
  password: string;
  errors: {
    email?: string;
    password?: string;
    submit?: string;
  };
  isSubmitting: boolean;
}

// Context Type
interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

// JWT Payload (decoded)
interface JWTPayload {
  id: string;          // user.id
  iat: number;         // issued at
  exp: number;         // expiration time
}
```

---

**Last Updated**: April 2026  
**Diagrams**: Complete system flow, component hierarchy, data flow, token lifecycle, error handling, security checkpoints
