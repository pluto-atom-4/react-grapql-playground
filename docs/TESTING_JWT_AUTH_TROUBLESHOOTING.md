# JWT Authentication Testing - Troubleshooting Guide

**Issue**: #121 - Integration Testing & End-to-End Validation  
**Purpose**: Debug and resolve common testing issues

---

## Common Issues & Solutions

### 1. Tests Fail with "Cannot find module"

**Symptoms**
```
Error: Cannot find module 'auth-context' from '...'
```

**Root Cause**
- File doesn't exist or is in wrong location
- TypeScript path mapping issue
- Import path is incorrect

**Solutions**

```bash
# Verify file exists
ls frontend/lib/auth-context.tsx
ls backend-graphql/src/middleware/auth.ts

# Check TypeScript config
cat tsconfig.json | grep -A 5 paths

# Reinstall if corrupt
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear build cache
rm -rf dist
pnpm build
```

### 2. Tests Pass Locally but Fail in CI/CD

**Symptoms**
```
Timeout: tests exceed 30000ms
Test suite failed to compile
```

**Root Cause**
- Database connection timing out
- Race conditions in async tests
- Environment variables not set

**Solutions**

```bash
# Check database is running
docker-compose ps

# Increase timeout for slow CI
pnpm test --reporter=verbose --testTimeout=10000

# Set environment variables in CI
export JWT_SECRET="test-secret-key"
export DATABASE_URL="postgresql://..."

# Run tests with better logging
DEBUG=* pnpm test --run
```

### 3. "Port Already in Use" Error

**Symptoms**
```
Error: listen EADDRINUSE: address already in use :::4000
```

**Root Cause**
- GraphQL server still running from previous test
- Another process using the port

**Solutions**

```bash
# Find and kill process
lsof -ti :4000 | xargs kill -9
lsof -ti :5000 | xargs kill -9

# Use different port
APOLLO_PORT=4001 pnpm dev:graphql

# Check what's using the port
netstat -tulpn | grep 4000
```

### 4. Tests Flaky (Pass sometimes, fail sometimes)

**Symptoms**
```
Test passes when run alone, fails when run with others
Intermittent "Cannot find element" errors
```

**Root Cause**
- Timing issues (setTimeout too short)
- Shared state between tests
- Race conditions in async code
- DOM not updated in time

**Solutions**

```typescript
// ❌ DON'T: Use setTimeout
setTimeout(() => expect(element).toBeInTheDocument(), 100);

// ✅ DO: Use waitFor with proper conditions
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, { timeout: 5000 });

// ✅ DO: Clear state between tests
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// ✅ DO: Use userEvent instead of fireEvent
await user.type(input, 'text');
await user.click(button);
```

### 5. Apollo Client Error: "No mock provider"

**Symptoms**
```
Error: Could not find "ApolloClient" in the context
```

**Root Cause**
- Component not wrapped in MockedProvider or ApolloProvider
- MockedProvider not in test setup

**Solutions**

```typescript
import { MockedProvider } from '@apollo/client/testing';

// ✅ DO: Wrap with MockedProvider
render(
  <MockedProvider mocks={MOCKS}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </MockedProvider>
);

// ✅ DO: Provide cache
const cache = new InMemoryCache();
render(
  <MockedProvider cache={cache}>
    <App />
  </MockedProvider>
);
```

### 6. "localStorage is not defined" Error

**Symptoms**
```
ReferenceError: localStorage is not defined
```

**Root Cause**
- localStorage mock not set up
- Node.js environment (no browser globals)

**Solutions**

```typescript
// ✅ DO: Mock localStorage in test file
const localStorageMock = {
  getItem: (key) => store[key] || null,
  setItem: (key, value) => { store[key] = value; },
  removeItem: (key) => { delete store[key]; },
  clear: () => { store = {}; },
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// ✅ DO: Use Vitest setup file
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

### 7. "useAuth must be used within AuthProvider" Error

**Symptoms**
```
Error: useAuth must be used within an AuthProvider
```

**Root Cause**
- Component not wrapped in AuthProvider
- AuthProvider not in component tree

**Solutions**

```typescript
// ✅ DO: Wrap with AuthProvider
render(
  <AuthProvider>
    <YourComponent />
  </AuthProvider>
);

// ✅ DO: Check nesting order (AuthProvider inside MockedProvider)
render(
  <MockedProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </MockedProvider>
);
```

### 8. Test Fails: "Unauthorized" or 401 Error

**Symptoms**
```
Error: Unauthorized
Backend returns 401
Token not injected in header
```

**Root Cause**
- Token not stored in localStorage
- Token expired
- Apollo link not injecting Authorization header
- Backend JWT secret mismatch

**Solutions**

```typescript
// ✅ DO: Store token before making query
beforeEach(() => {
  localStorage.setItem('auth_token', 'valid-jwt-token');
});

// ✅ DO: Verify token format is JWT
const token = localStorage.getItem('auth_token');
expect(token).toMatch(/^eyJ[\w-]*\.eyJ[\w-]*\.[\w-]*$/);

// ✅ DO: Mock backend to return 401
{
  request: { query: GET_BUILDS },
  result: {
    errors: [{ message: 'Unauthorized' }],
  },
}

// ✅ DO: Check JWT_SECRET env variable
echo $JWT_SECRET
echo $DATABASE_URL
```

### 9. Database Connection Timeout

**Symptoms**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Timeout connecting to database
```

**Root Cause**
- PostgreSQL not running
- Wrong connection string
- Database not created

**Solutions**

```bash
# Start PostgreSQL
docker-compose up -d

# Verify running
docker-compose ps

# Check connection string
grep DATABASE_URL .env

# Run migrations
pnpm migrate

# Reset if needed (dev only)
pnpm migrate:reset && pnpm seed
```

### 10. TypeScript Build Fails

**Symptoms**
```
error TS2307: Cannot find module
error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

**Root Cause**
- Missing type definitions
- Import path issues
- Type mismatch in test

**Solutions**

```bash
# Check for errors
pnpm build

# See full errors
pnpm tsc --noEmit

# Fix all issues
pnpm lint:fix

# Clear cache and rebuild
rm -rf dist
pnpm build
```

### 11. Mock Data Not Working

**Symptoms**
```
Apollo query returns null data
Mock not being used
```

**Root Cause**
- Mock query doesn't match actual query
- Mock variables don't match request
- Cache issues

**Solutions**

```typescript
// ✅ DO: Match query exactly
const mocks = [
  {
    request: {
      query: GET_BUILDS,
      variables: { userId: 'user-123' }, // Must match!
    },
    result: {
      data: { builds: [...] },
    },
  },
];

// ✅ DO: Verify mock is used
render(
  <MockedProvider mocks={mocks} addTypename={false}>
    <App />
  </MockedProvider>
);

// ✅ DO: Clear cache between tests
beforeEach(() => {
  cache.reset();
});
```

### 12. Test Output Too Verbose or Not Detailed Enough

**Symptoms**
```
Not enough information to debug
Output is overwhelming
```

**Solutions**

```bash
# Verbose output
pnpm test --reporter=verbose

# Specific test
pnpm test auth-context.test.tsx --reporter=verbose

# Less output (fast)
pnpm test --reporter=dot

# See test names only
pnpm test --reporter=tap

# Full error details
pnpm test --reporter=verbose 2>&1 | head -200
```

---

## Performance Optimization

### Slow Tests

**Problem**: Tests take too long to run

**Solutions**

```bash
# Run tests in parallel
pnpm test --maxWorkers=4

# Skip slow integration tests during development
pnpm test --testNamePattern="unit"

# Run tests matching pattern
pnpm test --testNamePattern="auth"

# Disable coverage for faster runs
pnpm test --run  # (no --coverage)
```

### Memory Leaks

**Problem**: Memory usage grows during test run

**Solutions**

```typescript
// ✅ DO: Clean up after tests
afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  cache.reset();
});

// ✅ DO: Remove event listeners
afterEach(() => {
  window.removeEventListener('storage', handler);
});
```

---

## Test Debugging Strategies

### Enable Detailed Logging

```typescript
// Add logging to understand test flow
it('should login user', async () => {
  console.log('Step 1: Render');
  render(<App />);
  
  console.log('Step 2: Find input');
  const input = screen.getByLabelText('email');
  
  console.log('Step 3: Type');
  await user.type(input, 'test@example.com');
  
  console.log('Step 4: Verify');
  expect(input.value).toBe('test@example.com');
});

// Run with logging
pnpm test --reporter=verbose
```

### Inspect DOM

```typescript
it('should render dashboard', () => {
  render(<Dashboard />);
  
  // Print entire DOM
  console.log(screen.debug());
  
  // Print specific element
  const element = screen.getByText(/dashboard/i);
  console.log(screen.debug(element));
});
```

### Watch for State Changes

```typescript
it('should update state on login', async () => {
  const { rerender } = render(<App />);
  
  // Make changes
  // ...
  
  // Rerender and check
  rerender(<App />);
  
  expect(localStorage.getItem('auth_token')).toBeTruthy();
});
```

---

## Environment Setup Verification

### Checklist

```bash
# 1. Node version
node --version  # Should be 18+

# 2. pnpm version
pnpm --version  # Should be latest

# 3. Dependencies installed
ls node_modules/@testing-library

# 4. Database running
docker-compose ps

# 5. Environment variables
echo $JWT_SECRET
echo $DATABASE_URL

# 6. TypeScript compiles
pnpm build

# 7. Tests run
pnpm test --run
```

### Quick Validation

```bash
#!/bin/bash
set -e

echo "✓ Checking Node version..."
node --version

echo "✓ Checking pnpm version..."
pnpm --version

echo "✓ Installing dependencies..."
pnpm install

echo "✓ Starting services..."
docker-compose up -d

echo "✓ Running migrations..."
pnpm migrate

echo "✓ Running tests..."
pnpm test --run

echo "✓ Building TypeScript..."
pnpm build

echo "✅ All checks passed!"
```

---

## Getting Help

### When Stuck

1. **Read the error carefully** - Usually tells you the problem
2. **Check this guide** - Likely covered above
3. **Search test output** - Often contains hints
4. **Run with verbose logging** - See what's happening
5. **Check related issues** - Look at #27, #118, #119, #120

### Useful Commands

```bash
# Find all references to a function
grep -r "extractUserFromToken" src/

# List all test files
find . -name "*.test.ts" -o -name "*.test.tsx"

# Count tests
grep -r "it(" src/ | wc -l

# Find failing tests
pnpm test --run 2>&1 | grep FAIL

# See test summary
pnpm test --run 2>&1 | tail -20
```

---

## Checklist Before Reporting Issue

- [ ] `pnpm install` run and completed
- [ ] `docker-compose up -d` running
- [ ] `pnpm migrate` executed
- [ ] `pnpm build` succeeds
- [ ] Test run individually (not with others)
- [ ] Tried `pnpm test --run --reporter=verbose`
- [ ] Checked for port conflicts
- [ ] localStorage cleared in test setup
- [ ] No `TODO` or `FIXME` comments in code

---

## Recovery Commands

### Nuclear Option (Use Carefully)

```bash
# Complete reset
docker-compose down -v
rm -rf node_modules dist .next
pnpm install
docker-compose up -d
pnpm migrate
pnpm test --run
```

### Partial Reset

```bash
# Just database
docker-compose down -v
docker-compose up -d
pnpm migrate

# Just node modules
rm -rf node_modules
pnpm install

# Just cache
rm -rf .vitest dist node_modules/.cache
pnpm test --run
```

---

**Last Updated**: April 21, 2026  
**Issue**: #121  
**Status**: ✅ Complete

For more help, see **TESTING_JWT_AUTH.md**
