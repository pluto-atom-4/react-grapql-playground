# Playwright Fixtures

Custom fixtures for E2E tests.

## Available Fixtures

### `authenticatedPage`
A Playwright `Page` object that is pre-authenticated with a test user.

- Automatically logs in before test
- Waits for JWT token in localStorage
- Waits for Apollo cache to be ready
- Clears cookies and localStorage after test

**Usage**:
```typescript
import { test } from '../fixtures';

test('authenticated test', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // Page is now authenticated
});
```

### `apiClient`
GraphQL API client with JWT authentication.

- Automatically extracts JWT from authenticated page
- Provides `query()` and `mutation()` methods
- Sets Authorization header

**Usage**:
```typescript
test('API test', async ({ apiClient }) => {
  const result = await apiClient.query(`
    query GetBuilds {
      builds { id status }
    }
  `);
});
```

### `testUser`
Test user credentials and metadata.

- Provides email, password for login
- Generates unique test ID

**Usage**:
```typescript
test('with test user', async ({ testUser }) => {
  console.log(testUser.email); // test@example.com
  console.log(testUser.id); // test-user-1234567890
});
```

## Environment Variables

- `TEST_EMAIL`: Test user email (default: `test@example.com`)
- `TEST_PASSWORD`: Test user password (default: `TestPassword123!`)
- `GRAPHQL_URL`: GraphQL endpoint (default: `http://localhost:4000`)

## Creating Custom Fixtures

To create a new fixture, extend the base fixtures:

```typescript
import { test as base } from './base.fixture';

const myFixture = base.extend({
  myCustomFixture: async ({ authenticatedPage }, use) => {
    // Setup
    const resource = await setupResource();
    
    await use(resource);
    
    // Cleanup
    await cleanupResource();
  },
});

export const test = myFixture;
```
