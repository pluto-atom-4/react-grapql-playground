# GitHub Issues Templates - ESLint v9 Migration Phase 3-4

Ready-to-use issue templates for creating GitHub issues to track ESLint remediation work.

---

## PRIORITY 1: BLOCKING FIXES (Must Complete by April 18)

### Issue Template 1: Fix Undefined Globals Configuration

**Title**: [ESLint] Fix undefined globals configuration for Node.js 18+ APIs

**Labels**: `type-safety`, `backend`, `configuration`, `migration-eslint-v9`

**Assignee**: [Backend Lead]

**Effort**: L (Low - 15-30 minutes)

**Blocking**: Yes

**Milestone**: v1.0-eslint-migration

```markdown
## Description

ESLint is configured for Node.js but doesn't recognize fetch API globals (URL, Request, Response, fetch) available in Node.js 18+. These are used in backend integration tests but flagged as `no-undef` errors.

## Current Status
- 4 errors in test files and event-bus service
- Prevents clean linting in backend-graphql and backend-express
- Integration tests cannot run properly

## Related Issues
- Files affected:
  - `backend-graphql/src/resolvers/__tests__/Mutation.integration.test.ts` (4 errors)
  - `backend-graphql/src/services/event-bus.ts` (1 error)

## Solution

Update ESLint and/or TypeScript configuration to recognize Node.js 18+ globals.

### Option 1: Update .eslintrc.json (Root Level)
```json
{
  "parserOptions": {
    "ecmaVersion": 2022,
    "lib": ["ES2022"]
  },
  "env": {
    "node": true,
    "es2022": true
  }
}
```

### Option 2: Update backend package tsconfig
Add to backend-graphql/tsconfig.json and backend-express/tsconfig.json:
```json
{
  "compilerOptions": {
    "lib": ["ES2022"]
  }
}
```

## Success Criteria
- [ ] `fetch`, `URL`, `Request`, `Response`, `RequestInit` recognized as globals
- [ ] 0 `no-undef` errors in test files
- [ ] `pnpm lint` passes for backend-graphql
- [ ] Integration tests run without ESLint errors

## Testing
```bash
cd backend-graphql
pnpm lint
# Should pass with 0 errors related to fetch/URL/Request/Response
```

## Related Links
- Phase 4.1 Results: docs/session-report/PHASE-4-1-ROOT-LINT-RESULTS.md
- ESLint v9 Migration: docs/session-report/ESLINT-V9-MIGRATION-STATUS.md
```

---

### Issue Template 2: Fix Type-Unsafe Any Usage in Backend-Express Upload Handler

**Title**: [ESLint] Replace unsafe `any` types in backend-express upload.ts

**Labels**: `type-safety`, `backend`, `code-quality`, `migration-eslint-v9`

**Assignee**: [Backend Lead]

**Effort**: L (Low - 20-30 minutes)

**Blocking**: Yes

**Milestone**: v1.0-eslint-migration

```markdown
## Description

`src/routes/upload.ts` line 114 contains 4 consecutive `any` type specifications, compromising type safety. These should be replaced with concrete types to ensure type-safe file upload handling.

## Current Issues
```
src/routes/upload.ts
  114:9   error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  114:20  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  114:30  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  114:41  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
```

## Solution

Replace line 114 handler signature with properly typed parameters using Express types:

```typescript
import { Request, Response, NextFunction } from 'express';

interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  destination: string;
}

const handler = (
  req: Request,
  res: Response,
  next: NextFunction,
  config: UploadConfig
) => { 
  // Handler implementation
};
```

## Success Criteria
- [ ] All 4 `any` types replaced with specific types
- [ ] Handler signature properly typed with Request, Response, NextFunction
- [ ] Type safety ensures upload validation works correctly
- [ ] `pnpm lint` passes for backend-express
- [ ] Upload tests still pass

## Testing
```bash
cd backend-express
pnpm lint src/routes/upload.ts
# Should show 0 errors (any types fixed)

pnpm test:express routes/upload.test.ts
# All tests should pass
```

## Related Links
- Phase 4.4 Results: docs/session-report/PHASE-4-4-EXPRESS-LINT-RESULTS.md
```

---

### Issue Template 3: Modernize Module Syntax in Backend-Express auth.ts

**Title**: [ESLint] Replace namespaces with ES2015 modules in backend-express

**Labels**: `code-quality`, `backend`, `modernization`, `migration-eslint-v9`

**Assignee**: [Backend Lead]

**Effort**: L (Low - 30-45 minutes)

**Blocking**: Yes

**Milestone**: v1.0-eslint-migration

```markdown
## Description

`src/middleware/auth.ts` uses outdated namespace syntax instead of ES2015 modules, and contains an unused error variable. Must be modernized to align with TypeScript and ESLint best practices.

## Current Issues
```
src/middleware/auth.ts
  15:3   error  ES2015 module syntax is preferred over namespaces  @typescript-eslint/no-namespace
  54:12  error  'error' is defined but never used                  @typescript-eslint/no-unused-vars
```

## Solution

### 1. Replace namespace with ES2015 exports

```typescript
// BEFORE
export namespace AuthUtils {
  export const validateToken = (token: string): boolean => {
    // Implementation
  };
}

// Usage: AuthUtils.validateToken(token)

// AFTER
export const validateToken = (token: string): boolean => {
  // Implementation
};

// Usage: validateToken(token)
```

### 2. Fix unused error variable

```typescript
// BEFORE
const validateRequest = (req: Request): void => {
  try {
    // Validation logic
  } catch (error) {  // Unused
    // No error handling
  }
};

// AFTER
const validateRequest = (req: Request): void => {
  try {
    // Validation logic
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Request validation failed:', message);
  }
};
```

## Success Criteria
- [ ] Namespace replaced with individual function exports
- [ ] All exports are ES2015 compatible
- [ ] Unused error variable removed or properly handled
- [ ] All imports of AuthUtils updated
- [ ] `pnpm lint` passes for backend-express
- [ ] All auth tests pass

## Testing
```bash
cd backend-express
pnpm lint src/middleware/auth.ts
# Should show 0 errors (namespace and unused var fixed)

pnpm test:express middleware/auth.test.ts
# All tests should pass
```

## Related Links
- Phase 4.4 Results: docs/session-report/PHASE-4-4-EXPRESS-LINT-RESULTS.md
```

---

### Issue Template 4: Fix Type Safety in Backend-GraphQL Resolvers

**Title**: [ESLint] Replace unsafe `any` types in backend-graphql resolvers

**Labels**: `type-safety`, `backend`, `tech-debt`, `migration-eslint-v9`

**Assignee**: [Backend Lead]

**Effort**: M (Medium - 2-3 hours)

**Blocking**: Yes

**Milestone**: v1.0-eslint-migration

```markdown
## Description

Backend-GraphQL resolvers contain 16 instances of unsafe `any` type specifications spread across Query.ts, Mutation.ts, Build.ts, dataloaders, and event-bus services. These must be replaced with specific types to maintain type safety.

## Current Issues
```
src/dataloaders/index.ts (2 errors)
src/resolvers/Build.ts (4 errors)
src/resolvers/Mutation.ts (4 errors)
src/resolvers/Query.ts (3 errors)
src/services/__tests__/event-bus.test.ts (2 errors)
src/services/event-bus.ts (1 error)
```

Total: 16 errors preventing clean builds

## Solution

### 1. Create/Update Type Definitions

Ensure `src/types.ts` includes:

```typescript
import { GraphQLResolveInfo } from 'graphql';

export interface GraphQLContext {
  dataloaders: DataLoaders;
  userId?: string;
}

export interface DataLoaders {
  buildLoader: DataLoader<string, Build>;
  partLoader: DataLoader<string, Part>;
  testRunLoader: DataLoader<string, TestRun>;
}
```

### 2. Update Resolver Signatures

```typescript
// BEFORE
export const queryResolvers = {
  builds: async (_: any, __: any, context: any) => {
    return context.dataloaders.buildLoader.loadMany(buildIds);
  },
};

// AFTER
import type { GraphQLContext } from '../types';

export const queryResolvers = {
  builds: async (
    _: unknown,
    __: unknown,
    context: GraphQLContext,
    info: GraphQLResolveInfo
  ) => {
    return context.dataloaders.buildLoader.loadMany(buildIds);
  },
};
```

### Files to Update
- `src/dataloaders/index.ts`
- `src/resolvers/Query.ts`
- `src/resolvers/Mutation.ts`
- `src/resolvers/Build.ts`
- `src/services/event-bus.ts`
- `src/services/__tests__/event-bus.test.ts`

## Success Criteria
- [ ] All 16 `any` type instances replaced
- [ ] `GraphQLResolveInfo` properly imported and used
- [ ] Context type properly annotated throughout
- [ ] `pnpm lint` passes for backend-graphql (0 any-type errors)
- [ ] All resolver tests pass
- [ ] `pnpm test:graphql` passes

## Testing
```bash
cd backend-graphql
pnpm lint
# Should pass with 0 errors (any types fixed)

pnpm test:graphql
# All resolver tests should pass
```

## Related Links
- Phase 4.3 Results: docs/session-report/PHASE-4-3-GRAPHQL-LINT-RESULTS.md
```

---

## PRIORITY 2: HIGH-PRIORITY FIXES (Phase 2: April 19-20)

### Issue Template 5: Fix Browser Environment Configuration & Promise Handling in Frontend

**Title**: [ESLint] Fix frontend type safety: browser globals, promises, and component types

**Labels**: `type-safety`, `frontend`, `browser-globals`, `promise-handling`, `migration-eslint-v9`

**Assignee**: [Frontend Lead]

**Effort**: H (High - 3-4 hours)

**Blocking**: Yes - Prevents deployment

**Milestone**: v1.0-eslint-migration

```markdown
## Description

Frontend has 30 blocking errors:
1. Browser globals (`prompt`, `alert`, `console`) not recognized (5 errors)
2. Floating promises not properly awaited (7 errors)
3. Unsafe `any` types in components (18 errors)

## Current Issues
```
build-dashboard.tsx (23 errors)
build-detail-modal.tsx (24 errors)
use-sse-events.ts (2 errors)
```

## Solution

### 1. Fix Browser Globals Configuration

Update `.eslintrc.json`:

```json
{
  "overrides": [
    {
      "files": ["**/*.tsx", "**/*.ts"],
      "env": {
        "browser": true,
        "node": true,
        "es2022": true
      }
    }
  ]
}
```

### 2. Fix Promise Handling

```typescript
// BEFORE - Floating promise
const handleStatusUpdate = () => {
  updateBuildStatus({ buildId, status });
};

// AFTER - Properly awaited
const handleStatusUpdate = async () => {
  try {
    await updateBuildStatus({ buildId, status });
  } catch (error) {
    console.error('Update failed:', error);
  }
};
```

### 3. Fix Component Type Safety

```typescript
import type { BuildsQuery } from '@/lib/graphql/__generated__';

interface BuildDashboardProps {
  builds: BuildsQuery['builds'];
}

const BuildDashboard = ({ builds }: BuildDashboardProps) => {
  return builds.map((build) => (
    <div key={build.id}>{build.status}</div>
  ));
};
```

## Success Criteria
- [ ] Browser globals properly configured
- [ ] All floating promises awaited or marked with `void`
- [ ] Components typed with Apollo response types
- [ ] 0 blocking errors in frontend
- [ ] `pnpm lint` passes
- [ ] All component tests pass

## Testing
```bash
cd frontend
pnpm lint
# Should pass with 0 errors

pnpm test
# All tests should pass
```

## Related Links
- Phase 4.2 Results: docs/session-report/PHASE-4-2-FRONTEND-LINT-RESULTS.md
```

---

### Issue Template 6: Include Test Files in Frontend TypeScript Configuration

**Title**: [ESLint] Fix TypeScript configuration to include test files in frontend

**Labels**: `configuration`, `testing`, `frontend`, `migration-eslint-v9`

**Assignee**: [Frontend Lead]

**Effort**: L (Low - 10 minutes)

**Blocking**: Yes - Test files not properly type-checked

**Milestone**: v1.0-eslint-migration

```markdown
## Description

Test files in `frontend/__tests__/` are not included in `tsconfig.json`, causing ESLint parsing errors.

## Solution

Update `frontend/tsconfig.json`:

```json
{
  "include": [
    "src/**/*",
    "__tests__/**/*",
    "**/*.ts",
    "**/*.tsx"
  ],
  "exclude": ["node_modules"]
}
```

## Success Criteria
- [ ] Test files properly included in TypeScript configuration
- [ ] ESLint can parse test files without errors
- [ ] 0 configuration errors
- [ ] `pnpm lint` passes

## Testing
```bash
cd frontend
pnpm lint __tests__/
# Should pass with 0 errors
```

## Related Links
- Phase 4.2 Results: docs/session-report/PHASE-4-2-FRONTEND-LINT-RESULTS.md
```

---

## PRIORITY 3: MEDIUM-PRIORITY FIXES

### Issue Template 7: Add Missing Return Type Annotations in Frontend

**Title**: [ESLint] Add explicit return type annotations to frontend functions

**Labels**: `code-quality`, `typescript-best-practices`, `frontend`, `migration-eslint-v9`

**Assignee**: [Any]

**Effort**: M (Medium - 1-2 hours)

**Blocking**: No (Warnings only)

**Milestone**: v1.0-eslint-migration

```markdown
## Description

27 functions across frontend lack explicit return type annotations. Explicit annotations improve IDE support and code clarity.

## Current Warnings (27 total)
```
apollo-wrapper.tsx (2)
layout.tsx (1)
page.tsx (1)
build-dashboard.tsx (2)
build-detail-modal.tsx (4)
apollo-client.ts (1)
apollo-hooks.ts (11)
use-sse-events.ts (2)
next.config.js (1)
```

## Solution

Add explicit return types:

```typescript
// BEFORE
const createApolloClient = () => {
  return new ApolloClient({ ... });
};

// AFTER
const createApolloClient = (): ApolloClient => {
  return new ApolloClient({ ... });
};
```

Can be partially auto-fixed:
```bash
cd frontend
pnpm lint --fix
```

## Success Criteria
- [ ] All 27 functions have explicit return types
- [ ] Code clarity improved
- [ ] IDE autocomplete enhanced
- [ ] 0 warnings for missing return types

## Testing
```bash
cd frontend
pnpm lint
# Should pass with 0 return-type warnings
```

## Related Links
- Phase 4.2 Results: docs/session-report/PHASE-4-2-FRONTEND-LINT-RESULTS.md
```

---

## PRIORITY 4: LOW-PRIORITY FIXES

### Issue Template 8: Fix Console Logging Code Quality Warnings

**Title**: [ESLint] Replace console.log with console.warn/error in backend

**Labels**: `code-quality`, `logging`, `backend`, `migration-eslint-v9`

**Assignee**: [Any]

**Effort**: L (Low - 15 minutes)

**Blocking**: No (Warnings only)

**Milestone**: v1.1-technical-debt

```markdown
## Description

4 instances of `console.log()` should be replaced with `console.warn()` or `console.error()` per best practices.

## Current Warnings (4 total)
```
backend-graphql/src/index.ts (2 warnings)
backend-express/src/index.ts (1 warning)
backend-express/src/middleware/validateEventSecret.ts (1 warning)
```

## Solution

Replace `console.log()` with appropriate method:

```typescript
// BEFORE
console.log(`Server running at http://localhost:${PORT}/graphql`);

// AFTER
console.error(`Server running at http://localhost:${PORT}/graphql`);
```

## Success Criteria
- [ ] All `console.log()` replaced with `console.warn()` or `console.error()`
- [ ] 0 console warnings

## Testing
```bash
pnpm lint
# Should pass with 0 console warnings
```

## Related Links
- Phase 4.1 Results: docs/session-report/PHASE-4-1-ROOT-LINT-RESULTS.md
```

---

## Quick Reference

| Issue # | Title | Priority | Effort | Blocking |
|---------|-------|----------|--------|----------|
| 1 | Globals Config | CRITICAL | L | Yes |
| 2 | Upload Handler Types | CRITICAL | L | Yes |
| 3 | Module Syntax | CRITICAL | L | Yes |
| 4 | GraphQL Resolver Types | CRITICAL | M | Yes |
| 5 | Frontend Type Safety | HIGH | H | Yes |
| 6 | Test TypeScript Config | HIGH | L | Yes |
| 7 | Return Type Annotations | MEDIUM | M | No |
| 8 | Console Logging | LOW | L | No |

---

**Generated**: April 17, 2026  
**Status**: Ready for GitHub issue creation
