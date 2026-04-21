# Issue #120: Login Component & User Flow - Implementation Plan

**Date**: April 2026  
**Issue**: Frontend Login Component & User Flow  
**Parent Issue**: #27 (JWT Authentication)  
**Dependency**: Issue #119 (Frontend Auth Context & Apollo Link) - ✅ COMPLETED & MERGED  
**Status**: Planning Phase

---

## Executive Summary

**Problem Statement**:  
The frontend authentication system (Issue #119) provides the infrastructure for token management and Apollo Client integration, but lacks a user-facing login component and complete login flow. Users cannot authenticate into the application.

**Solution Approach**:  
Build a production-ready login form component that:
1. Collects email and password credentials
2. Validates input client-side (required fields, email format, password strength)
3. Submits credentials to a new GraphQL `login` mutation
4. Receives JWT token from backend
5. Stores token in localStorage via AuthContext
6. Redirects to dashboard upon success
7. Displays user-friendly errors on failure
8. Shows loading states during submission
9. Persists authentication across page reloads

**Interview Context**:  
This demonstrates full-stack capability:
- **Frontend**: React form handling, validation, error states, optimistic UX
- **Backend**: GraphQL mutation, password hashing (bcrypt), JWT token generation
- **Security**: Proper token handling, SSR-safe localStorage, environment variable secrets
- **UX**: Loading indicators, error messages, redirect flow

---

## Current Foundation Review

### ✅ Already in Place (from Issue #119 & #118)

#### Frontend Auth System
- `frontend/lib/auth-context.tsx` - AuthContext with `login()` and `logout()` methods
- `useAuth()` hook for component access to token and auth methods
- `AUTH_TOKEN_KEY = 'auth_token'` - standardized localStorage key
- SSR-safe token initialization (guards with `typeof window !== 'undefined'`)
- Token injection into Apollo Client headers

#### Apollo Client Setup
- `frontend/lib/apollo-client.ts` - Auth link that injects `Authorization: Bearer <token>`
- `setContext` link wraps all HTTP requests with token
- Credentials-based CORS handling

#### Backend JWT Infrastructure
- `backend-graphql/src/middleware/auth.ts` - JWT extraction and validation
- `extractUserFromToken()` - Parses Authorization header and validates JWT signature
- `generateToken(userId)` - Creates JWT tokens (24h expiry)
- `isValidJWTPayload()` - Type-safe JWT payload validation
- JWT secret from `process.env.JWT_SECRET`

#### Protected Resolvers Pattern
- All mutations require `if (!context.user) throw new Error('Unauthorized')`
- Query resolvers (builds, build, testRuns) also protected
- Context factory in `backend-graphql/src/index.ts` extracts user on every request

#### Database
- Prisma ORM with PostgreSQL
- Current schema: Build, Part, TestRun (NO User model yet)
- Need to add User model for login

#### Testing Infrastructure
- `backend-graphql/src/resolvers/__tests__/auth-check.test.ts` - Auth validation tests
- Vitest + MockedProvider patterns established
- Test database setup via docker-compose

---

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPLETE LOGIN FLOW                         │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├─> User navigates to /login page
  │     (Frontend Server Component: frontend/app/(auth)/login/page.tsx)
  │
  ├─> Page renders LoginForm component
  │     (Client Component: frontend/components/login-form.tsx)
  │     - Email input field (required, email format)
  │     - Password input field (required, min 8 chars)
  │     - "Sign In" button
  │     - Error message display area
  │     - Loading spinner (hidden initially)
  │
  ├─> User enters credentials
  │     - email@example.com
  │     - password123
  │
  ├─> Form validation (client-side)
  │     ✓ Email required? → Yes
  │     ✓ Email is valid format? → Yes
  │     ✓ Password required? → Yes
  │     ✓ Password length >= 8? → Yes
  │     ✓ Show any validation errors? → No
  │     ✓ Enable submit button? → Yes
  │
  ├─> User clicks "Sign In" button
  │     - Disable button (prevent double-click)
  │     - Show loading spinner
  │     - Call useMutation(LOGIN_MUTATION)
  │
  ├─> Apollo Client sends GraphQL mutation
  │     POST http://localhost:4000/graphql
  │     {
  │       "operationName": "Login",
  │       "query": "mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) { token } }",
  │       "variables": { "email": "email@example.com", "password": "password123" }
  │     }
  │
  ├─> Backend GraphQL resolves login mutation
  │     (backend-graphql/src/resolvers/Mutation.ts - login function)
  │     
  │     1. Validate input (email required, password required)
  │     2. Query User table for user with matching email
  │     3. Compare password with bcrypt.compare(password, user.passwordHash)
  │     4. If invalid: throw GraphQL error with message "Invalid email or password"
  │     5. If valid: call generateToken(user.id) → JWT token string
  │     6. Return { token: "eyJhbGc..." }
  │
  ├─> Frontend receives response
  │     {
  │       "data": {
  │         "login": {
  │           "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  │         }
  │       }
  │     }
  │
  ├─> useMutation callback executes
  │     - Extract token from data.login.token
  │     - Call useAuth().login(token) → updates AuthContext
  │     - AuthContext.login() → localStorage.setItem('auth_token', token)
  │     - Set token state in LoginForm (optional)
  │
  ├─> Apollo Client auto-updates authorization header
  │     - Next request includes: Authorization: Bearer <new-token>
  │     - Auth link in apollo-client.ts reads updated token from context
  │
  ├─> Clear errors and hide loading state
  │     - Set errorMessage = null
  │     - Show success message (optional)
  │
  ├─> Redirect to dashboard
  │     - useRouter().push('/') or replace('/dashboard')
  │     - Page refreshes and BuildDashboard loads
  │
  ├─> Dashboard renders with authentication
  │     - Fresh Apollo client instance on server (registerApolloClient)
  │     - Fetches builds with Authorization: Bearer <token>
  │     - Backend resolvers accept request (context.user is set)
  │     - BuildDashboard renders with live data
  │
  └─> SUCCESS - User is logged in

ERROR PATH (if login fails):

  ├─> Backend returns GraphQL error
  │     {
  │       "errors": [
  │         {
  │           "message": "Invalid email or password",
  │           "extensions": { "code": "UNAUTHENTICATED" }
  │         }
  │       ]
  │     }
  │
  ├─> useMutation catch handler triggers
  │     - Extract error.message from GraphQL error
  │     - Set errorMessage = "Invalid email or password"
  │     - Hide loading spinner
  │     - Enable submit button
  │
  ├─> Display error to user
  │     - Show <div className="text-red-600">Invalid email or password</div>
  │     - Focus on password field (optional)
  │
  └─> User can retry or adjust credentials
       - Error clears when user starts typing
       - Or user clicks "Forgot Password" (future feature)

SESSION PERSISTENCE (page reload):

  ├─> User is logged in and closes browser
  │     - Token stored in localStorage
  │     - Session lost in React state (AuthContext)
  │
  ├─> User reopens browser and navigates to /
  │     - AuthProvider mounts (app/layout.tsx)
  │     - AuthContext useEffect runs (Issue #119)
  │     - Reads localStorage.getItem('auth_token')
  │     - Sets state: token = "eyJhbGc..."
  │
  ├─> Apollo Client initializes
  │     - Auth link reads token from AuthContext.token
  │     - Injects Authorization: Bearer <token> on all requests
  │
  ├─> Page fetches data (server component)
  │     - getClient() creates fresh Apollo client
  │     - Has token from localStorage (via AuthContext)
  │     - Backend accepts request (valid JWT)
  │     - Page renders with data
  │
  └─> Session restored - User stays logged in
```

---

## Component Architecture

### Frontend Directory Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              [NEW - Server Component]
│   │   └── layout.tsx                [NEW - Auth route group layout]
│   ├── layout.tsx                    [EXISTING - Root layout with AuthProvider]
│   └── page.tsx                      [EXISTING - Dashboard, protected]
│
├── components/
│   ├── login-form.tsx                [NEW - Client Component]
│   ├── build-dashboard.tsx           [EXISTING - Protected dashboard]
│   └── ...
│
└── lib/
    ├── auth-context.tsx              [EXISTING - AuthContext + useAuth() hook]
    ├── apollo-client.ts              [EXISTING - Apollo with auth link]
    ├── graphql-queries.ts            [EXISTING - Build queries/mutations]
    └── graphql-mutations.ts          [NEW or modified - LOGIN_MUTATION]
```

### LoginForm Component Structure

#### File: `frontend/components/login-form.tsx`

```typescript
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { useAuth } from '@/lib/auth-context';
import { LOGIN_MUTATION } from '@/lib/graphql-mutations';

interface FormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

export default function LoginForm(): ReactElement {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginMutation, { loading: mutationLoading }] = useMutation(LOGIN_MUTATION);

  // Validate form client-side
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await loginMutation({
        variables: { email, password },
      });

      const token = result.data?.login?.token;
      if (!token) {
        throw new Error('No token received from server');
      }

      // Store token in AuthContext (saves to localStorage)
      login(token);

      // Redirect to dashboard
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear error on input change
  const handleEmailChange = (value: string): void => {
    setEmail(value);
    if (errors.email) setErrors({ ...errors, email: undefined });
  };

  const handlePasswordChange = (value: string): void => {
    setPassword(value);
    if (errors.password) setErrors({ ...errors, password: undefined });
  };

  const isLoading = isSubmitting || mutationLoading;
  const isDisabled = isLoading || !email.trim() || !password.trim();

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="user@example.com"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded ${
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isDisabled}
          className={`w-full px-4 py-2 rounded font-medium transition ${
            isDisabled
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
```

### Login Page (Server Component)

#### File: `frontend/app/(auth)/login/page.tsx`

```typescript
import type { ReactElement } from 'react';
import LoginForm from '@/components/login-form';

export const metadata = {
  title: 'Sign In - Boltline',
  description: 'Sign in to your Boltline manufacturing account',
};

export default function LoginPage(): ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Boltline</h1>
          <p className="text-gray-600 mt-2">Manufacturing Test Dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
```

---

## GraphQL Mutation Design

### Backend Schema Addition

#### File: `backend-graphql/src/schema.graphql` (updated)

```graphql
"""
Login response type containing JWT token
"""
type AuthPayload {
  """JWT token for authenticated requests"""
  token: String!
}

extend type Mutation {
  """
  Authenticate user with email and password.
  
  Returns JWT token if credentials are valid.
  Throws error if email not found or password invalid.
  
  Example:
    mutation {
      login(email: "user@example.com", password: "password123") {
        token
      }
    }
  """
  login(email: String!, password: String!): AuthPayload!
}
```

### Backend Resolver Implementation

#### File: `backend-graphql/src/resolvers/Mutation.ts` (add to existing)

```typescript
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/auth';

export const mutationResolver = {
  Mutation: {
    // ... existing resolvers (createBuild, updateBuildStatus, etc.)

    /**
     * Authenticate user with email and password.
     * Returns JWT token if credentials valid.
     * 
     * Pattern:
     * 1. Validate input (email and password required)
     * 2. Query User table for matching email
     * 3. Compare password with bcrypt hash
     * 4. Generate JWT token if valid
     * 5. Return token (user not authenticated yet in context)
     */
    async login(
      _parent: unknown,
      args: { email: string; password: string },
      context: BuildContext,
      _info: GraphQLResolveInfo
    ) {
      // Validate input
      if (!args.email?.trim()) {
        throw new Error('Email is required');
      }
      if (!args.password?.trim()) {
        throw new Error('Password is required');
      }

      // Find user by email
      const user = await context.prisma.user.findUnique({
        where: { email: args.email.toLowerCase() },
      });

      // User not found OR password invalid: use generic message for security
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Compare password with bcrypt hash
      const isPasswordValid = await bcrypt.compare(args.password, user.passwordHash);

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token (24h expiry)
      const token = generateToken(user.id);

      return { token };
    },
  },
};
```

### Frontend GraphQL Mutation

#### File: `frontend/lib/graphql-mutations.ts` (NEW or modified)

```typescript
import { gql } from '@apollo/client/core';

/**
 * Login mutation to authenticate user and receive JWT token
 */
export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
    }
  }
`;

// Export other mutations...
export const CREATE_BUILD_MUTATION = gql`
  mutation CreateBuild($name: String!, $description: String) {
    createBuild(name: $name, description: $description) {
      ...BuildInfo
    }
  }
  ${BUILD_FRAGMENT}
`;
```

---

## Form Validation Strategy

### Client-Side Validation

```typescript
// Email validation using HTML5 pattern + regex
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation
function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// Form validation function
function validateForm(email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  // Email validation
  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!password.trim()) {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return errors;
}
```

### Server-Side Validation (Backend)

```typescript
// In login resolver (Mutation.ts)

// Input validation
if (!args.email?.trim()) {
  throw new Error('Email is required');
}
if (!args.password?.trim()) {
  throw new Error('Password is required');
}

// Email exists check
const user = await context.prisma.user.findUnique({
  where: { email: args.email.toLowerCase() },
});

if (!user) {
  throw new Error('Invalid email or password');
}

// Password verification with bcrypt
const isPasswordValid = await bcrypt.compare(args.password, user.passwordHash);
if (!isPasswordValid) {
  throw new Error('Invalid email or password');
}
```

### TypeScript Types

```typescript
// frontend/types/auth.ts (NEW)

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthPayload {
  token: string;
}

export interface FormErrors {
  email?: string;
  password?: string;
  submit?: string;
}
```

---

## Error Handling

### Error States & User Feedback

#### 1. Validation Errors (Client-Side)

```typescript
// User leaves email field empty
errors.email = 'Email is required';

// User enters invalid email format
errors.email = 'Please enter a valid email address';

// User enters short password
errors.password = 'Password must be at least 8 characters';
```

#### 2. Network/GraphQL Errors (Server-Side)

```typescript
// User doesn't exist
throw new Error('Invalid email or password');

// Password is incorrect
throw new Error('Invalid email or password');

// Database connection error
throw new Error('An error occurred during login. Please try again.');

// JWT token generation error
throw new Error('Failed to generate authentication token');
```

#### 3. Apollo Client Error Handling

```typescript
const [loginMutation, { loading: mutationLoading, error }] = useMutation(
  LOGIN_MUTATION,
  {
    onError: (err) => {
      const message = err.message || 'Login failed. Please try again.';
      setErrors({ submit: message });
    },
  }
);
```

#### 4. UI Error Display

```typescript
// Error message display in form
{errors.submit && (
  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
    {errors.submit}
  </div>
)}

// Field-level errors
{errors.email && (
  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
)}
```

---

## Token Management

### Token Acquisition Flow

```
1. User submits credentials (email, password)
   ↓
2. Frontend sends GraphQL mutation: login(email, password)
   ↓
3. Backend validates credentials
   ↓
4. Backend calls generateToken(user.id)
   ↓
5. generateToken creates JWT:
   - Payload: { id: user.id }
   - Secret: process.env.JWT_SECRET
   - Expiry: 24 hours
   - Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ↓
6. Backend returns: { data: { login: { token: "eyJ..." } } }
   ↓
7. Frontend useMutation receives response
   ↓
8. Extract token: const token = result.data.login.token
   ↓
9. Call useAuth().login(token)
   ↓
10. AuthContext.login() executes:
    - setToken(newToken)
    - localStorage.setItem('auth_token', newToken)
    ↓
11. React state updated, component re-renders
    ↓
12. Apollo Client auth link reads updated token from context
    ↓
13. All subsequent requests include: Authorization: Bearer <token>
```

### Token Storage Pattern

```typescript
// Token stored in localStorage (client-side)
const AUTH_TOKEN_KEY = 'auth_token';

// Stored as plain string (not JSON)
localStorage.setItem('auth_token', 'eyJhbGc...');
// NOT: localStorage.setItem('auth_token', JSON.stringify({ token: 'eyJ...' }));

// Retrieved on AuthProvider mount (app/layout.tsx)
const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

// SSR-safe (guards with typeof window !== 'undefined')
if (typeof window !== 'undefined') {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

// Token cleared on logout
localStorage.removeItem(AUTH_TOKEN_KEY);
```

---

## Implementation Checklist

### Phase 1: Backend - User Model & Schema (Days 1-2)

- [ ] Create User model in Prisma schema
  - [ ] id: String @id @default(cuid())
  - [ ] email: String @unique @db.VarChar(255)
  - [ ] passwordHash: String
  - [ ] createdAt: DateTime @default(now())
  - [ ] updatedAt: DateTime @updatedAt

- [ ] Run Prisma migration: `pnpm migrate`

- [ ] Add AuthPayload type to GraphQL schema (`schema.graphql`)
  - [ ] type AuthPayload { token: String! }
  - [ ] extend type Mutation { login(...): AuthPayload! }

- [ ] Install bcrypt: `pnpm add bcrypt` (backend-graphql)

- [ ] Implement login resolver in `backend-graphql/src/resolvers/Mutation.ts`
  - [ ] Input validation (email, password required)
  - [ ] Query user by email
  - [ ] Verify password with bcrypt.compare()
  - [ ] Generate token with generateToken()
  - [ ] Return { token }

- [ ] Write backend tests: `backend-graphql/src/resolvers/__tests__/login.test.ts`
  - [ ] Test input validation
  - [ ] Test valid credentials
  - [ ] Test invalid email/password
  - [ ] Test token generation
  - [ ] Run tests: `pnpm test:graphql`

- [ ] Create seed data with test user (optional):
  - [ ] Add test user in `pnpm seed` script
  - [ ] Run: `pnpm seed`

### Phase 2: Frontend - GraphQL Mutation (Days 2-3)

- [ ] Create/update `frontend/lib/graphql-mutations.ts`
  - [ ] Define LOGIN_MUTATION with email and password variables
  - [ ] Return token field

- [ ] Define TypeScript types in `frontend/types/auth.ts` (NEW)
  - [ ] LoginInput interface
  - [ ] AuthPayload interface
  - [ ] FormErrors interface

- [ ] Test mutation in GraphiQL
  - [ ] Start backend: `pnpm dev:graphql`
  - [ ] Open http://localhost:4000/graphql
  - [ ] Execute mutation with test user credentials
  - [ ] Verify token is returned

### Phase 3: Frontend - LoginForm Component (Days 3-4)

- [ ] Create `frontend/components/login-form.tsx` (NEW)
  - [ ] Form state: email, password, errors, isSubmitting
  - [ ] Validation functions: isValidEmail(), validateForm()
  - [ ] useMutation(LOGIN_MUTATION) hook
  - [ ] handleSubmit(): validate → mutate → login → redirect
  - [ ] Error handling: GraphQL errors, network errors
  - [ ] UI: email input, password input, submit button, error display
  - [ ] Accessibility: labels, id attributes, error aria-live
  - [ ] Styling: Tailwind CSS with error states

- [ ] Unit tests: `frontend/components/__tests__/login-form.test.tsx`
  - [ ] Form validation tests
  - [ ] Form submission tests
  - [ ] Error handling tests
  - [ ] Token handling tests
  - [ ] Run tests: `pnpm test:frontend`

### Phase 4: Frontend - Login Page (Days 4)

- [ ] Create `frontend/app/(auth)/login/page.tsx` (NEW)
  - [ ] Server Component (async)
  - [ ] Metadata with SEO tags
  - [ ] Layout structure: heading, description, LoginForm

- [ ] Optional: Create `frontend/app/(auth)/layout.tsx` (NEW)
  - [ ] Group auth-related routes
  - [ ] Optional styling/branding

- [ ] Test in browser
  - [ ] Start frontend: `pnpm dev:frontend`
  - [ ] Navigate to http://localhost:3000/login
  - [ ] Form renders correctly

### Phase 5: Integration Testing (Days 5)

- [ ] Test full login flow locally
  - [ ] Start all services: `pnpm dev`
  - [ ] Navigate to /login
  - [ ] Enter valid credentials
  - [ ] Submit form
  - [ ] Check network request (DevTools)
  - [ ] Verify token in localStorage
  - [ ] Check redirect to dashboard
  - [ ] Verify builds load (protected query)

- [ ] Test error cases
  - [ ] Invalid email format
  - [ ] Short password
  - [ ] Non-existent user
  - [ ] Wrong password
  - [ ] Network error
  - [ ] Verify error messages display

- [ ] Test session persistence
  - [ ] Login successfully
  - [ ] Refresh page (F5)
  - [ ] Verify still logged in (token in localStorage)
  - [ ] Verify builds still load

### Phase 6: Code Quality & Documentation (Days 6-7)

- [ ] Lint and format
  - [ ] Run: `pnpm lint:fix`
  - [ ] Fix any ESLint errors

- [ ] Type checking
  - [ ] Run: `pnpm build`
  - [ ] Verify no TypeScript errors

- [ ] Documentation
  - [ ] Add JSDoc comments to LoginForm component
  - [ ] Document login mutation in schema
  - [ ] Add architecture notes to CLAUDE.md (optional)

---

## Acceptance Criteria (Verification Checklist)

### 1. Login Form Renders Correctly
- [ ] Form displays with email and password fields
- [ ] Form has "Sign In" button
- [ ] Error message area is present (hidden initially)
- [ ] Form is centered and styled appropriately

### 2. Form Validation (Client-Side)
- [ ] Email required validation works
- [ ] Email format validation works
- [ ] Password required validation works
- [ ] Password length validation works (min 8 chars)
- [ ] Submit button disabled when form invalid
- [ ] Submit button enabled when form valid
- [ ] Errors clear when user starts typing

### 3. Successful Login
- [ ] Token received from backend
- [ ] Token stored in localStorage
- [ ] AuthContext updated with new token
- [ ] User redirected to dashboard
- [ ] Token persists across page reload

### 4. Error Handling
- [ ] Invalid credentials error displayed
- [ ] Network error handling works
- [ ] Error messages user-friendly
- [ ] User can retry after error

### 5. Backend GraphQL Mutation
- [ ] Login mutation defined in schema
- [ ] Mutation accepts email and password
- [ ] User model exists with passwordHash
- [ ] Bcrypt used for password verification
- [ ] Token generated and returned

### 6. Integration
- [ ] Full login flow works end-to-end
- [ ] Protected queries require token
- [ ] Apollo Client injects token correctly
- [ ] All tests passing

---

## Risks & Mitigations

### Risk 1: Token Not Persisting Across Reloads
**Mitigation**: Use SSR-safe localStorage guards, ensure AuthProvider wraps ApolloWrapper

### Risk 2: Apollo Client Not Injecting Token
**Mitigation**: Verify auth link reads from useAuth(), check Authorization header format

### Risk 3: Password Stored in Plaintext
**Mitigation**: Use bcrypt for hashing, never return password hash to client

### Risk 4: Generic Error Messages
**Mitigation**: Use "Invalid email or password" for both user-not-found and wrong-password cases

### Risk 5: Token Expires Without Notice
**Mitigation**: Catch "Token expired" errors, redirect to login, implement token refresh (future)

### Risk 6: localStorage Vulnerable to XSS
**Mitigation**: Set Content-Security-Policy headers, sanitize user input

---

## Effort Estimate

- **Backend Implementation**: 1-2 days (User model, resolver, tests)
- **Frontend Implementation**: 2-3 days (LoginForm, mutation, page)
- **Integration & Testing**: 1-2 days (E2E tests, full flow verification)
- **Total**: 25 hours (~3-4 developer days)

---

## Success Criteria Summary

✅ **Must Have**:
- Login form validates input
- User can login with valid credentials
- Token stored and persists across reloads
- Error messages displayed on failure

✅ **Should Have**:
- All tests passing
- Full type safety
- Comprehensive error handling
- Loading states for UX

⚡ **Nice to Have**:
- Remember me checkbox
- Forgot password link
- Password strength indicator

---

**Plan Created**: April 2026  
**Target Completion**: End of Week (April 25, 2026)
