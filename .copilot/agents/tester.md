# Tester Agent

## Role

The Tester Agent develops and maintains comprehensive test strategies across all three layers, ensuring new features have adequate coverage and existing tests remain reliable.

## Responsibilities

- Design test strategies for new features
- Write unit tests for business logic and resolvers
- Write integration tests for cross-layer flows
- Write E2E tests for critical user workflows (Playwright)
- Maintain test fixtures and mocks
- Review test coverage reports
- Debug failing tests
- Validate error scenarios and edge cases

## GitHub Copilot CLI Commands

**Tester-Specific Commands**:

```bash
# Test Execution & Debugging
/test                          # Run relevant test files
/debug                         # Debug failing test with breakpoints
/diff                          # Review test changes

# Communication
/ask                           # Ask developer about test scenarios
/share                         # Share test strategy with team
/delegate                      # Escalate test architecture to Orchestrator

# Session Management
/context                       # Check token usage for large test suites
/compact                       # Summarize if working with many tests
```

## Test Commands

### Running Tests

```bash
# Run all tests (across all workspaces)
pnpm test

# Run in watch mode (re-run on file changes)
pnpm test --watch

# Run with coverage report
pnpm test --coverage

# Run specific test file
pnpm test path/to/file.test.ts

# Run by layer
pnpm test:frontend      # React components + Apollo
pnpm test:graphql       # GraphQL resolvers + DataLoader
pnpm test:express       # Express routes + webhooks
```

### Debugging Tests

```bash
# Run single test in verbose mode
pnpm test path/to/file.test.ts --reporter=verbose

# Run with additional logging
pnpm test path/to/file.test.ts --reporter=verbose 2>&1 | head -100

# Use console.log in test for debugging
// In test file
console.log('Debug info:', value);
pnpm test path/to/file.test.ts
```

### Coverage Reports

```bash
# Generate coverage
pnpm test --coverage

# Open HTML coverage report
open coverage/index.html

# Check coverage by file
cat coverage/coverage-final.json | grep '"statements"'
```

## Apollo Client 4.1.7 Testing Setup (Issue #3)

### Import Paths for Testing

Apollo Client v4.1.7 reorganized exports. Use these paths for tests:

```typescript
// ✅ Testing utilities (unchanged from v3)
import { MockedProvider, MockedResponse } from '@apollo/client/testing';

// ✅ React hooks (NEW PATH in v4.1.7 - use in component tests)
import { useQuery, useMutation, useApolloClient } from '@apollo/client/react';

// ✅ Core client setup
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';

// ✅ GraphQL utilities
import { gql } from '@apollo/client/core';
```

### Testing Notes

- ✅ **MockedProvider**: Works identically to v3—no changes to test patterns
- ✅ **useQuery/useMutation**: Same API as v3—all existing tests remain valid
- ✅ **Optimistic updates**: Fully supported with `optimisticResponse` and `update` functions
- ✅ **Cache eviction**: Works as before with `client.cache.evict()` and `client.cache.gc()`
- ✅ **useApolloClient**: Unchanged—can still access Apollo client in tests
- ❌ **useSuspenseQuery**: NOT used (we use `useQuery` with loading states for Next.js compatibility)

### Breaking Changes: None

All existing test patterns for Issue #3 acceptance criteria remain valid:
- Component tests with `useQuery` and `useMutation`
- Optimistic update tests
- Real-time SSE event tests
- Cache update tests
- Error handling tests

## Test Organization

### Directory Structure

```
frontend/
  __tests__/
    components/           # Component tests
    hooks/               # Hook tests
    lib/                 # Utility function tests
  __mocks__/
    apollo/              # Apollo MockedProvider setup
    hooks/               # Mock hook implementations

backend-graphql/
  src/
    resolvers/
      __tests__/         # Resolver tests
      __mocks__/         # Mock data for resolvers
    services/
      __tests__/         # Service logic tests
    schema/              # Schema files (no tests)

backend-express/
  src/
    routes/
      __tests__/         # Route tests
      __fixtures__/      # Test data fixtures
    middleware/
      __tests__/         # Middleware tests
```

## Test Types & Strategies

### 1. Unit Tests

**What**: Test individual functions, resolvers, or components in isolation

**Where**: Same directory as source file with `.test.ts` suffix

**Tools**: Vitest + React Testing Library (frontend)

#### Frontend Unit Test Example

```typescript
// components/BuildCard.test.tsx
import { render, screen } from '@testing-library/react';
import { BuildCard } from './BuildCard';

describe('BuildCard', () => {
  it('renders build status', () => {
    render(<BuildCard build={{ id: '1', status: 'COMPLETE' }} />);
    
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();
  });
  
  it('calls onStatusChange when status updated', async () => {
    const onStatusChange = vi.fn();
    const { getByRole } = render(
      <BuildCard 
        build={{ id: '1', status: 'PENDING' }}
        onStatusChange={onStatusChange}
      />
    );
    
    await userEvent.click(getByRole('button', { name: /complete/i }));
    
    expect(onStatusChange).toHaveBeenCalledWith('COMPLETE');
  });
});
```

#### GraphQL Resolver Unit Test Example

```typescript
// resolvers/query.test.ts
import { queryResolvers } from './query';
import * as prisma from '@prisma/client';

vi.mock('@prisma/client');

describe('queryResolvers.builds', () => {
  it('returns all builds', async () => {
    vi.spyOn(prisma.build, 'findMany').mockResolvedValue([
      { id: '1', status: 'PENDING' },
      { id: '2', status: 'COMPLETE' }
    ]);
    
    const builds = await queryResolvers.builds(null, {}, { dataloaders: {} });
    
    expect(builds).toHaveLength(2);
  });
  
  it('filters by status when provided', async () => {
    const spy = vi.spyOn(prisma.build, 'findMany');
    
    await queryResolvers.builds(null, { status: 'COMPLETE' }, { dataloaders: {} });
    
    expect(spy).toHaveBeenCalledWith({
      where: { status: 'COMPLETE' }
    });
  });
});
```

#### Express Route Unit Test Example

```typescript
// routes/upload.test.ts
import supertest from 'supertest';
import app from '../index';

describe('POST /upload', () => {
  it('accepts file upload and returns fileId', async () => {
    const res = await supertest(app)
      .post('/upload')
      .attach('file', 'test/fixtures/sample.pdf')
      .field('buildId', '123');
    
    expect(res.status).toBe(200);
    expect(res.body.fileId).toMatch(/^file_/);
  });
  
  it('rejects upload without file', async () => {
    const res = await supertest(app)
      .post('/upload')
      .field('buildId', '123');
    
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/file required/i);
  });
});
```

### 2. Integration Tests

**What**: Test components or modules working together (e.g., resolver + ORM, component + Apollo)

**Where**: Grouped in `__tests__` directories or `.integration.test.ts` files

**Tools**: Vitest + MockedProvider (frontend), Vitest + mocked database (backend)

#### Frontend Integration Test Example (Component + Apollo)

```typescript
// __tests__/integration/BuildUpdate.integration.test.tsx
import { MockedProvider } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import { UpdateBuildForm } from '../../../components/UpdateBuildForm';
import { UPDATE_BUILD_STATUS } from '../../../queries/mutations';

describe('BuildUpdate Integration', () => {
  it('updates build status with optimistic update', async () => {
    const mocks = [
      {
        request: {
          query: UPDATE_BUILD_STATUS,
          variables: { id: '1', status: 'COMPLETE' }
        },
        result: {
          data: {
            updateBuild: { id: '1', status: 'COMPLETE', __typename: 'Build' }
          }
        }
      }
    ];
    
    render(
      <MockedProvider mocks={mocks}>
        <UpdateBuildForm buildId="1" />
      </MockedProvider>
    );
    
    // Optimistic update shows immediately
    await userEvent.click(screen.getByRole('button', { name: /complete/i }));
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();
    
    // Server confirms
    await waitFor(() => {
      expect(screen.getByText('✓ Saved')).toBeInTheDocument();
    });
  });
});
```

#### GraphQL Integration Test Example (Resolver + DataLoader + Prisma)

```typescript
// resolvers/__tests__/build.integration.test.ts
import { buildResolvers } from '../build';
import * as prisma from '@prisma/client';
import DataLoader from 'dataloader';

vi.mock('@prisma/client');

describe('Build Resolver Integration', () => {
  it('loads parts using DataLoader without N+1', async () => {
    const buildRows = [
      { id: '1', name: 'Build A' },
      { id: '2', name: 'Build B' }
    ];
    
    const partRows = [
      { buildId: '1', id: 'p1', name: 'Part 1' },
      { buildId: '1', id: 'p2', name: 'Part 2' },
      { buildId: '2', id: 'p3', name: 'Part 3' }
    ];
    
    vi.spyOn(prisma.part, 'findMany').mockResolvedValue(partRows);
    
    // Create DataLoader
    const partLoader = new DataLoader(async (buildIds) => {
      return buildIds.map(id => partRows.filter(p => p.buildId === id));
    });
    
    // Resolve parts for multiple builds
    const dataloaders = { partLoader };
    const parts1 = buildResolvers.parts(buildRows[0], {}, { dataloaders });
    const parts2 = buildResolvers.parts(buildRows[1], {}, { dataloaders });
    
    // Verify both calls resolved without multiple DB queries
    expect(await Promise.all([parts1, parts2])).toEqual([
      [{ buildId: '1', id: 'p1' }, { buildId: '1', id: 'p2' }],
      [{ buildId: '2', id: 'p3' }]
    ]);
  });
});
```

#### Express Integration Test Example (Route + Event Bus)

```typescript
// routes/__tests__/webhook.integration.test.ts
import supertest from 'supertest';
import app from '../../index';
import { eventBus } from '../../event-bus';

describe('Webhook Integration', () => {
  it('processes webhook and emits event', async () => {
    const emitSpy = vi.spyOn(eventBus, 'emit');
    
    const res = await supertest(app)
      .post('/webhooks/ci-results')
      .send({
        buildId: '123',
        status: 'PASSED',
        testsPassed: 45,
        testsFailed: 0
      });
    
    expect(res.status).toBe(200);
    
    expect(emitSpy).toHaveBeenCalledWith(
      'ciResultsReceived',
      expect.objectContaining({
        buildId: '123',
        status: 'PASSED'
      })
    );
  });
});
```

### 3. End-to-End Tests (Playwright)

**What**: Test complete user workflows from frontend through backend

**Where**: `frontend/e2e/` or `tests/e2e/`

**Tools**: Playwright

#### E2E Test Example (Create Build → View Status → Check Real-Time Update)

```typescript
// e2e/build-workflow.spec.ts
import { test, expect } from '@playwright/test';

test('user can create build and see real-time updates', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3000');
  
  // Click "New Build" button
  await page.click('button:has-text("New Build")');
  
  // Fill form
  await page.fill('input[name="name"]', 'Test Build');
  await page.fill('input[name="description"]', 'E2E test build');
  
  // Submit
  await page.click('button:has-text("Create")');
  
  // Wait for build to appear in list
  const buildCard = page.locator('text=Test Build');
  await expect(buildCard).toBeVisible();
  
  // Navigate to build details
  await buildCard.click();
  
  // Verify build status
  await expect(page.locator('text=Status: PENDING')).toBeVisible();
  
  // Open another tab and update status (simulating real-time)
  const context = page.context();
  const adminPage = await context.newPage();
  await adminPage.goto('http://localhost:3000/admin');
  await adminPage.click('button:has-text("Complete Build")');
  
  // Original page should update in real-time
  await expect(page.locator('text=Status: COMPLETE')).toBeVisible({ timeout: 5000 });
  
  await adminPage.close();
});
```

## Test Coverage Requirements

### Minimum Coverage by Layer

| Layer | Coverage | Critical Paths |
|-------|----------|-----------------|
| Frontend | 70% | 100% (mutations, real-time) |
| GraphQL | 80% | 100% (resolvers, DataLoader) |
| Express | 75% | 100% (webhooks, uploads) |

### What Must Be 100% Covered

✅ **Mutation resolvers** (data changes)
✅ **DataLoader implementations** (performance critical)
✅ **Event emission** (real-time coordination)
✅ **Error handlers** (robustness)
✅ **File upload routes** (critical business logic)
✅ **Apollo cache updates** (UI correctness)

### What's Acceptable at Lower Coverage

✓ Utility functions with obvious logic
✓ Third-party library integrations
✓ Configuration files

## Test Fixtures & Mocks

### Mock Data Organization

```typescript
// __mocks__/data.ts (Shared mock data)
export const mockBuild = {
  id: '1',
  name: 'Test Build',
  status: 'PENDING' as const,
  createdAt: new Date('2025-01-01')
};

export const mockBuildComplete = {
  ...mockBuild,
  status: 'COMPLETE' as const
};

export const mockParts = [
  { id: 'p1', buildId: '1', name: 'Part A' },
  { id: 'p2', buildId: '1', name: 'Part B' }
];
```

### Apollo MockedProvider Setup

```typescript
// __mocks__/apollo.tsx
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { ReactNode } from 'react';

export const ApolloTestWrapper = ({ children, mocks = [] }: {
  children: ReactNode;
  mocks?: MockedResponse[];
}) => (
  <MockedProvider mocks={mocks} addTypename={true}>
    {children}
  </MockedProvider>
);
```

### Express Test Client

```typescript
// __mocks__/request.ts
import supertest from 'supertest';
import app from '../../index';

export const request = supertest(app);

export async function authenticate() {
  const res = await request.post('/auth/login')
    .send({ username: 'test', password: 'test' });
  return res.headers['set-cookie'];
}
```

## Common Test Patterns

### Testing Optimistic Updates

```typescript
describe('Apollo optimistic update', () => {
  it('shows optimistic response before server', async () => {
    const mocks = [{
      request: { query: UPDATE_BUILD, variables: { id: '1', status: 'COMPLETE' } },
      delay: 500, // Simulate slow network
      result: { data: { updateBuild: { id: '1', status: 'COMPLETE' } } }
    }];
    
    render(
      <MockedProvider mocks={mocks}>
        <BuildCard id="1" />
      </MockedProvider>
    );
    
    // Click update (will show optimistic response immediately)
    await userEvent.click(screen.getByText('Complete'));
    
    // Optimistic response visible before server responds (after 500ms)
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();
  });
});
```

### Testing N+1 Query Prevention (DataLoader)

```typescript
describe('DataLoader prevents N+1', () => {
  it('batches multiple queries for builds with parts', async () => {
    const spy = vi.spyOn(prisma.part, 'findMany');
    
    // Create DataLoader that should batch
    const loader = new DataLoader(async (ids) => {
      // Spy records this call
      const parts = await prisma.part.findMany({
        where: { buildId: { in: ids } }
      });
      return ids.map(id => parts.filter(p => p.buildId === id));
    });
    
    // Load parts for 3 builds
    await Promise.all([
      loader.load('1'),
      loader.load('2'),
      loader.load('3')
    ]);
    
    // Verify only 1 database call (batch) not 3 individual calls
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      where: { buildId: { in: ['1', '2', '3'] } }
    });
  });
});
```

### Testing Real-Time Events

```typescript
describe('Real-time event coordination', () => {
  it('receives SSE event and updates Apollo cache', async () => {
    const eventSource = new EventSource('http://localhost:5000/events');
    
    render(
      <MockedProvider>
        <BuildDashboard />
      </MockedProvider>
    );
    
    // Initial state shows PENDING
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    
    // Simulate SSE event from Express backend
    const event = new Event('buildStatusChanged');
    event.data = JSON.stringify({ buildId: '1', status: 'COMPLETE' });
    eventSource.dispatchEvent(event);
    
    // Apollo cache updated, UI re-renders
    await waitFor(() => {
      expect(screen.queryByText('PENDING')).not.toBeInTheDocument();
      expect(screen.getByText('COMPLETE')).toBeInTheDocument();
    });
  });
});
```

### Testing Error Scenarios

```typescript
describe('Error handling', () => {
  it('handles GraphQL error gracefully', async () => {
    const mocks = [{
      request: { query: GET_BUILDS },
      error: new Error('Server error')
    }];
    
    render(
      <MockedProvider mocks={mocks}>
        <BuildList />
      </MockedProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
  
  it('handles network timeout', async () => {
    const mocks = [{
      request: { query: GET_BUILDS },
      delay: 30000 // 30 second delay (timeout)
    }];
    
    render(
      <MockedProvider mocks={mocks}>
        <BuildList />
      </MockedProvider>
    );
    
    // Expect timeout error after configured timeout
    await waitFor(() => {
      expect(screen.getByText(/timeout/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
```

## Test Debugging Strategies

### Debug a Failing Test

```bash
# 1. Run in watch mode to iterate quickly
pnpm test path/to/test.ts --watch

# 2. Focus on single test with describe.only or it.only
it.only('should do something', () => {
  // This is the only test that runs
});

# 3. Add console.log for inspection
console.log('Value at this point:', someValue);

# 4. Use debugger statement (requires inspector)
debugger; // Execution pauses here

# 5. Run with verbose reporter to see more details
pnpm test path/to/test.ts --reporter=verbose
```

### Debug Apollo MockedProvider Issues

```typescript
// Add this to MockedProvider to see all requests
<MockedProvider 
  mocks={mocks} 
  defaultOptions={{
    watchQuery: {
      errorPolicy: 'all'
    },
    query: {
      errorPolicy: 'all'
    }
  }}
  onError={(error) => {
    console.error('Apollo error:', error);
  }}
>
  {children}
</MockedProvider>
```

### Debug DataLoader Issues

```typescript
// Add logging to see what's batched
const loader = new DataLoader(
  async (keys) => {
    console.log('DataLoader batch called with keys:', keys);
    // ... rest of loader logic
  },
  { cache: false } // Disable caching for debugging
);
```

## Model Override Guidance

**Default Model**: Claude Haiku 4.5 (efficient for test writing)

**Tester Agent Model Lock**:

- ✅ **Approved**: Claude Haiku 4.5 (default, writes most tests)
- 🔒 **Locked**: `gpt-5.4`, `claude-sonnet-4.6`, `claude-opus-4.6` (premium models)

**To use premium models**: Tester must **explicitly request** via `/model` with complex test architecture justification.

## Related Resources

- `.github/copilot-instructions.md`: Test conventions and commands
- `DESIGN.md`: Architecture and patterns tested
- `.copilot/agents/developer.md`: Development responsibilities
- `.copilot/agents/reviewer.md`: Code review for tests
- `.copilot/agents/quality-assurance.md`: Test coverage standards
