# E2E Helpers

Utility functions and clients for E2E tests.

## API Clients

### GraphQLClient

Execute GraphQL queries and mutations with JWT authentication.

```typescript
const client = new GraphQLClient('http://localhost:4000', token);

// Query
const result = await client.query(`
  query GetBuilds {
    builds { id status }
  }
`);

// Mutation
const created = await client.mutation(`
  mutation CreateBuild($input: CreateBuildInput!) {
    createBuild(input: $input) {
      id status
    }
  }
`, { input: { name: 'Test' } });

// Set/clear token
client.setToken(newToken);
client.clearToken();
```

### ExpressClient

Interact with Express server (file uploads, webhooks, SSE).

```typescript
const express = new ExpressClient('http://localhost:5000');

// Upload file
const { fileId } = await express.uploadFile('/upload', buffer, 'test.pdf');

// Health check
const health = await express.getHealth();

// Send webhook
await express.sendWebhook('/webhooks/ci-results', {
  buildId: '123',
  status: 'PASSED',
});

// Stream SSE events
await express.streamEvents(
  (data) => console.log('Event:', data),
  (error) => console.error('SSE error:', error)
);
```

## Data Seeding

### seedTestData

Create complete test data (builds, parts, test runs) via GraphQL.

```typescript
const data = await seedTestData(apiClient);
// Returns: { buildIds: [], partIds: [], testRunIds: [] }

// Cleanup after test
await cleanupTestData(apiClient, data);
```

### seedBuildWithParts

Create single build with multiple parts.

```typescript
const { buildId, partIds } = await seedBuildWithParts(
  apiClient,
  'Test Build',
  3 // number of parts
);
```

## Wait Helpers

Custom waits for common E2E scenarios.

```typescript
// Wait for GraphQL query to complete
await waitForGraphQL(page, 'GetBuilds');

// Wait for SSE event
const event = await waitForSSEEvent(page, 'buildCreated', 5000);

// Wait for network idle
await waitForNetworkIdle(page);

// Wait for Apollo cache ready
await waitForApolloCacheReady(page);

// Wait for element to stop changing
await waitForElementStable(page, '[data-testid="build-list"]');

// Wait for loading states to complete
await waitForGraphQLLoading(page);

// Wait for HTTP response
const response = await waitForResponse(page, /graphql/);

// Wait for specific element count
await waitForElements(page, '[data-testid="build-item"]', 5);
```

## Test User Management

```typescript
// Get default test user
const user = getTestUser();
// { email: 'test@example.com', password: '...', id: 'test-user-1234', name: 'Test User' }

// Generate unique user
const uniqueUser = generateTestUser('e2e');
// { email: 'e2e+1234-abc@example.com', ... }

// Validate user
if (isValidTestUser(user)) {
  console.log('Valid test user');
}
```

## Usage in Tests

```typescript
import { test } from '../fixtures';
import {
  GraphQLClient,
  seedTestData,
  cleanupTestData,
  waitForApolloCacheReady,
  getTestUser,
} from '../helpers';

test('create build and verify via API', async ({ apiClient, authenticatedPage }) => {
  // Seed data
  const data = await seedTestData(apiClient);

  // Navigate page
  await authenticatedPage.goto('/dashboard');
  await waitForApolloCacheReady(authenticatedPage);

  // Cleanup
  await cleanupTestData(apiClient, data);
});
```

## Environment Variables

The helpers use these environment variables (defaults provided):

```env
TEST_EMAIL=test@example.com
TEST_PASSWORD=TestPassword123!
GRAPHQL_URL=http://localhost:4000
EXPRESS_URL=http://localhost:5000
```
