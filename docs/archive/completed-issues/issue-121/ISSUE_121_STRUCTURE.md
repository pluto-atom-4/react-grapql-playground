# Test Structure & Organization - Issue #121

**Purpose:** Guide for creating test files, directories, and organizing test code

---

## Directory Structure to Create

```
frontend/
├── __tests__/
│   ├── fixtures/
│   │   ├── graphql.ts           [NEW] GraphQL queries/mutations
│   │   ├── mocks.ts             [NEW] Mock response fixtures
│   │   └── users.ts             [NEW] User fixtures
│   ├── helpers/
│   │   ├── apollo-mock.ts       [NEW] Apollo MockedProvider helpers
│   │   ├── auth.ts              [NEW] Auth context test helpers
│   │   └── storage.ts           [NEW] localStorage mock/helpers
│   ├── integration/
│   │   ├── full-auth-flow.test.tsx        [NEW] ~15 tests
│   │   ├── protected-routes.test.tsx      [NEW] ~12 tests
│   │   ├── auth-errors.test.tsx           [NEW] ~10 tests
│   │   ├── multi-user.test.tsx            [NEW] ~7 tests
│   │   └── security-edge-cases.test.tsx   [NEW] ~8 tests
│   └── apollo-wrapper.test.tsx            [EXISTING] keep as-is
│
└── vitest.setup.ts              [NEW] Global test setup

backend-graphql/
├── src/
│   ├── __tests__/
│   │   ├── fixtures/
│   │   │   ├── graphql.ts       [NEW] GraphQL schema fixtures
│   │   │   └── tokens.ts        [NEW] JWT token fixtures
│   │   ├── helpers/
│   │   │   ├── jwt.ts           [NEW] JWT generation/validation
│   │   │   └── resolvers.ts     [NEW] Resolver mock contexts
│   │   └── integration.test.ts   [EXISTING] keep as-is
│   ├── middleware/
│   │   └── __tests__/
│   │       └── auth.test.ts      [EXISTING] keep as-is
│   └── resolvers/
│       └── __tests__/
│           ├── auth-check.test.ts                [EXISTING] keep as-is
│           ├── Mutation.integration.test.ts      [EXISTING] keep as-is
│           └── token-mgmt.test.ts                [NEW] ~9 tests
│
└── vitest.config.ts             [REVIEW] Verify coverage config
```

---

## File Creation Guide

### 1. Frontend Fixtures

#### **frontend/__tests__/fixtures/users.ts**

```typescript
/**
 * User test fixtures
 * Valid and invalid user data for authentication testing
 */

export const validUsers = [
  {
    id: 'user-123',
    email: 'alice@example.com',
    password: 'password123',
    fullName: 'Alice Test'
  },
  {
    id: 'user-456',
    email: 'bob@example.com',
    password: 'password456',
    fullName: 'Bob Test'
  },
  {
    id: 'user-789',
    email: 'charlie@example.com',
    password: 'password789',
    fullName: 'Charlie Test'
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

export function getValidUser(index = 0) {
  return validUsers[index] || validUsers[0];
}

export function getInvalidUser(index = 0) {
  return invalidUsers[index] || invalidUsers[0];
}
```

#### **frontend/__tests__/fixtures/graphql.ts**

```typescript
/**
 * GraphQL fixtures for authentication testing
 * Queries, mutations, and expected responses
 */

import { gql } from '@apollo/client/core';

// === MUTATIONS ===

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

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
    }
  }
`;

// === QUERIES ===

export const GET_BUILDS = gql`
  query GetBuilds($limit: Int, $offset: Int) {
    builds(limit: $limit, offset: $offset) {
      id
      name
      status
      createdAt
      updatedAt
    }
  }
`;

export const GET_BUILD = gql`
  query GetBuild($id: ID!) {
    build(id: $id) {
      id
      name
      status
      createdAt
      updatedAt
    }
  }
`;

export const GET_TEST_RUNS = gql`
  query GetTestRuns($buildId: ID!) {
    testRuns(buildId: $buildId) {
      id
      buildId
      status
      result
      fileUrl
      completedAt
    }
  }
`;

// === RESPONSE FIXTURES ===

export const MOCK_BUILDS_RESPONSE = {
  builds: [
    {
      id: 'build-1',
      name: 'Build 1',
      status: 'PENDING',
      createdAt: '2026-04-20T00:00:00Z',
      updatedAt: '2026-04-20T00:00:00Z'
    },
    {
      id: 'build-2',
      name: 'Build 2',
      status: 'RUNNING',
      createdAt: '2026-04-21T00:00:00Z',
      updatedAt: '2026-04-21T00:00:00Z'
    }
  ]
};

export const MOCK_BUILD_RESPONSE = {
  build: {
    id: 'build-1',
    name: 'Build 1',
    status: 'PENDING',
    createdAt: '2026-04-20T00:00:00Z',
    updatedAt: '2026-04-20T00:00:00Z'
  }
};

export const MOCK_TEST_RUNS_RESPONSE = {
  testRuns: [
    {
      id: 'test-run-1',
      buildId: 'build-1',
      status: 'PASSED',
      result: 'PASS',
      fileUrl: '/files/test-report-1.pdf',
      completedAt: '2026-04-20T12:00:00Z'
    }
  ]
};
```

#### **frontend/__tests__/fixtures/mocks.ts**

```typescript
/**
 * Mock Apollo responses for testing
 * Pre-built mocks for common scenarios
 */

import { MockedResponse } from '@apollo/client/testing';
import { LOGIN_MUTATION, GET_BUILDS, GET_BUILD, GET_TEST_RUNS } from './graphql';
import { validUsers } from './users';

// === LOGIN MOCKS ===

export function createLoginSuccessMock(user = validUsers[0]): MockedResponse {
  return {
    request: {
      query: LOGIN_MUTATION,
      variables: {
        email: user.email,
        password: user.password
      }
    },
    result: {
      data: {
        login: {
          token: `jwt-token-${user.id}-abc123`,
          user: {
            id: user.id,
            email: user.email,
            __typename: 'User'
          },
          __typename: 'LoginResponse'
        }
      }
    }
  };
}

export const loginInvalidCredentialsMock: MockedResponse = {
  request: {
    query: LOGIN_MUTATION,
    variables: {
      email: 'test@example.com',
      password: 'wrongpassword'
    }
  },
  result: {
    errors: [{ message: 'Invalid email or password' }]
  }
};

export const loginServerErrorMock: MockedResponse = {
  request: {
    query: LOGIN_MUTATION,
    variables: {
      email: 'test@example.com',
      password: 'password'
    }
  },
  result: {
    errors: [{ message: 'Internal server error' }]
  }
};

// === QUERY MOCKS ===

export const getBuildsSuccessMock: MockedResponse = {
  request: {
    query: GET_BUILDS,
    variables: {
      limit: 10,
      offset: 0
    }
  },
  result: {
    data: {
      builds: [
        {
          id: 'build-1',
          name: 'Build 1',
          status: 'PENDING',
          createdAt: '2026-04-20T00:00:00Z',
          updatedAt: '2026-04-20T00:00:00Z',
          __typename: 'Build'
        }
      ],
      __typename: 'Query'
    }
  }
};

export const getBuildsUnauthorizedMock: MockedResponse = {
  request: {
    query: GET_BUILDS,
    variables: {
      limit: 10,
      offset: 0
    }
  },
  result: {
    errors: [{ message: 'Unauthorized' }]
  }
};

// === HELPER FUNCTIONS ===

export function createGetBuildsMock(builds: any[] = []): MockedResponse {
  return {
    request: {
      query: GET_BUILDS,
      variables: {
        limit: 10,
        offset: 0
      }
    },
    result: {
      data: {
        builds,
        __typename: 'Query'
      }
    }
  };
}

export function createGetBuildMock(build: any): MockedResponse {
  return {
    request: {
      query: GET_BUILD,
      variables: { id: build.id }
    },
    result: {
      data: { build, __typename: 'Query' }
    }
  };
}
```

### 2. Frontend Helpers

#### **frontend/__tests__/helpers/apollo-mock.ts**

```typescript
/**
 * Apollo MockedProvider setup helpers
 */

import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { ReactNode } from 'react';
import { AuthProvider } from '../../lib/auth-context';

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
  initialToken: string | null = null
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MockedProvider>
    );
  };
}
```

#### **frontend/__tests__/helpers/storage.ts**

```typescript
/**
 * localStorage mock and management helpers
 */

export function createStorageMock() {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
    key: (index: number) => Object.keys(store)[index] || null,
    length: Object.keys(store).length
  } as Storage;
}

export function setupLocalStorageMock() {
  const mock = createStorageMock();
  Object.defineProperty(window, 'localStorage', {
    value: mock,
    writable: true
  });
  return mock;
}

export function getTokenFromStorage(): string | null {
  return localStorage.getItem('auth_token');
}

export function setTokenInStorage(token: string) {
  localStorage.setItem('auth_token', token);
}

export function clearAuthTokenFromStorage() {
  localStorage.removeItem('auth_token');
}

export function clearAllStorage() {
  localStorage.clear();
}
```

#### **frontend/__tests__/helpers/auth.ts**

```typescript
/**
 * Auth context testing helpers
 */

import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../lib/auth-context';
import { createAuthApolloWrapper } from './apollo-mock';

export function renderUseAuthHook(initialToken?: string) {
  const wrapper = createAuthApolloWrapper([], initialToken || null);
  return renderHook(() => useAuth(), { wrapper });
}

export async function simulateLogin(token: string) {
  const { result } = renderUseAuthHook();
  
  act(() => {
    result.current.login(token);
  });

  return result.current;
}

export async function simulateLogout() {
  const { result } = renderUseAuthHook('existing-token');
  
  act(() => {
    result.current.logout();
  });

  return result.current;
}
```

### 3. Frontend Vitest Setup

#### **frontend/vitest.setup.ts**

```typescript
/**
 * Global test setup for Vitest
 * Initializes mocks and utilities before tests run
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { setupLocalStorageMock } from './__tests__/helpers/storage';

// Setup localStorage mock before tests
setupLocalStorageMock();

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/'
  })
}));

// Mock Next.js Image component (if needed)
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...props
  }: any) => <img src={src} alt={alt} {...props} />
}));

// Suppress console warnings in tests
global.console.warn = vi.fn();
global.console.error = vi.fn();
```

#### **frontend/vitest.config.ts** (UPDATED)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],  // ADD THIS LINE
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['lib/**/*.ts', 'lib/**/*.tsx', 'components/**/*.ts', 'components/**/*.tsx'],
      exclude: ['node_modules', 'dist', '__tests__'],
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90
    },
    reporters: ['verbose']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### 4. Backend-GraphQL Fixtures & Helpers

#### **backend-graphql/src/__tests__/fixtures/tokens.ts**

```typescript
/**
 * JWT token fixtures for testing
 * Valid, expired, malformed, and invalid tokens
 */

export const tokenFixtures = {
  valid: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE2MTYzMjU0MjJ9.valid_sig_abc123',
  
  expired: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE2MTYyMzk5MjJ9.exp_sig_xyz789',
  
  malformed: 'not.valid.jwt',
  
  wrongSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE2MTYzMjU0MjJ9.wrong_secret_sig',
  
  noUserId: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MTYyMzk5MjIsImV4cCI6MTYxNjMyNTQyMn0.no_id_sig',
  
  emptyUserId: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxNjE2MzI1NDIyfQ.empty_id_sig'
};
```

#### **backend-graphql/src/__tests__/helpers/jwt.ts**

```typescript
/**
 * JWT generation and validation helpers for testing
 */

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

export function createBearerHeader(token: string): string {
  return `Bearer ${token}`;
}
```

#### **backend-graphql/src/__tests__/helpers/resolvers.ts**

```typescript
/**
 * Resolver testing helpers - mock contexts and utilities
 */

import { PrismaClient } from '@prisma/client';
import { BuildContext } from '../../types';
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
      create: async () => ({
        id: '1',
        name: 'Test',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      findUnique: async () => null,
      findMany: async () => [],
      update: async () => ({
        id: '1',
        name: 'Test',
        status: 'RUNNING',
        createdAt: new Date(),
        updatedAt: new Date()
      })
    },
    part: {
      create: async () => ({
        id: '1',
        buildId: '1',
        name: 'Part',
        sku: 'SKU',
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    },
    testRun: {
      create: async () => ({
        id: '1',
        buildId: '1',
        status: 'PASSED',
        result: 'PASS',
        fileUrl: '',
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }),
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

## Naming Conventions

### Test Files

```
# Integration tests - group by feature
✅ full-auth-flow.test.tsx
✅ protected-routes.test.tsx
✅ auth-errors.test.tsx

# Fixture files - describe data type
✅ users.ts
✅ tokens.ts
✅ graphql.ts

# Helper files - describe utility purpose
✅ apollo-mock.ts
✅ jwt.ts
✅ resolvers.ts
```

### Test Cases

```
# Format: describe('Category/Feature', () => { it('should...', ...) })

✅ describe('Full Authentication Flow')
   it('should login with valid credentials')
   it('should store token in localStorage')
   
✅ describe('Protected Routes')
   it('should redirect to /login without token')
   it('should allow access with valid token')

❌ it('test login')  # Too vague
❌ it('auth flow') # Missing "should"
```

### Mock Variables

```
# Format: mockXxx or xxxMock

✅ const mockLoginMutation = { ... }
✅ const loginSuccessMock = { ... }
✅ const mockRouter = vi.fn()

❌ const login = { ... }  # Not clearly a mock
❌ const response = { ... }  # Too generic
```

---

## Import Organization

### For Test Files

```typescript
// 1. Vitest imports
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 2. Testing library imports
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// 3. External library imports
import { MockedProvider } from '@apollo/client/testing';
import { gql } from '@apollo/client/core';

// 4. Application imports
import { LoginForm } from '../../components/LoginForm';
import { useAuth } from '../../lib/auth-context';
import { AuthProvider } from '../../lib/auth-context';

// 5. Test helpers and fixtures
import { createAuthApolloWrapper } from '../helpers/apollo-mock';
import { loginSuccessMock, getBuildsSuccessMock } from '../fixtures/mocks';
import { validUsers } from '../fixtures/users';
```

### For Fixture Files

```typescript
/**
 * [Purpose description]
 */

// External imports (if any)
import { gql } from '@apollo/client/core';
import { MockedResponse } from '@apollo/client/testing';

// Type imports (use 'import type')
import type { BuildContext } from '../../types';

// Other fixture imports
import { validUsers } from './users';

// Export fixtures
export const ...
```

---

## Test File Template

```typescript
/**
 * Test Suite: [Feature Name]
 * File: [path]
 * 
 * Tests for:
 * - [What is tested]
 * - [Related functionality]
 * 
 * References:
 * - Issue #XXX: [Issue title]
 * - AC1, AC2: [Related acceptance criteria]
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// [Additional imports as needed]

describe('[Feature Name]', () => {
  // Setup and teardown
  beforeEach(() => {
    // Clear mocks, reset state
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    // Cleanup
    vi.clearAllMocks();
  });

  describe('[Category]', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      const setup = /* ... */;

      // Act
      const result = /* ... */;

      // Assert
      expect(result).toBe(/* ... */);
    });
  });
});
```

---

## Debugging & Utilities

### Common Testing Patterns

#### Testing async mutations

```typescript
it('should handle async mutation', async () => {
  const { result } = renderHook(() => useMutation(...));
  
  await act(async () => {
    await result.current.mutate(...);
  });

  expect(result.current.data).toBeDefined();
});
```

#### Testing with Apollo MockedProvider

```typescript
it('should execute query with mock', async () => {
  const mocks = [createGetBuildsMock(...)];
  
  render(
    <MockedProvider mocks={mocks}>
      <MyComponent />
    </MockedProvider>
  );

  await waitFor(() => {
    expect(screen.getByText('Build 1')).toBeInTheDocument();
  });
});
```

#### Testing error states

```typescript
it('should handle error', async () => {
  const mocks = [{ request: {...}, result: { errors: [...] } }];
  
  // Test error handling
});
```

---

## Checklist for Test Implementation

- [ ] Create fixture files (users, tokens, graphql, mocks)
- [ ] Create helper files (apollo-mock, storage, auth, jwt, resolvers)
- [ ] Create vitest.setup.ts
- [ ] Update vitest.config.ts (coverage, setupFiles)
- [ ] Create test suite directories (integration/)
- [ ] Implement each test file with proper naming
- [ ] Verify all imports work correctly
- [ ] Run tests: `pnpm test --run`
- [ ] Verify coverage ≥90%
- [ ] Verify no TypeScript errors: `pnpm build`

---

**Version:** 1.0  
**Created:** April 21, 2026  
**Ready for Implementation:** ✅
