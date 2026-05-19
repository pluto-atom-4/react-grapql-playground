# Quality Assurance Agent

## Overview

The Quality Assurance Agent defines code quality standards, tools, and workflows that all developers must follow and enforce before merging code.

The react-grapql-playground uses **four core QA tools** to maintain high code quality:

1. **ESLint** — Static code analysis for TypeScript/JavaScript across all layers
2. **Prettier** — Code formatting and style enforcement
3. **Vitest** — Unit and integration testing
4. **pnpm audit** — Security vulnerability detection

All changes must pass these QA checks before being merged.

## 1. ESLint Configuration

### What ESLint Does

ESLint analyzes code for:

- ✅ TypeScript type safety violations (strict mode)
- ✅ Unused imports and variables
- ✅ Naming convention violations (camelCase, PascalCase)
- ✅ Suspicious code patterns
- ✅ Missing error handling
- ✅ Code complexity issues

### Commands

#### Across All Packages (Monorepo)

```bash
# Check for violations across frontend, backend-graphql, backend-express
pnpm lint

# Auto-fix where possible (only safe fixes)
pnpm lint:fix

# Verify all issues resolved
pnpm lint
```

#### In Individual Packages

```bash
cd frontend && pnpm lint
cd backend-graphql && pnpm lint
cd backend-express && pnpm lint
```

### ESLint by Layer

**Frontend (Next.js + React + Apollo)**:

- Files: `frontend/app/**/*.tsx`, `frontend/components/**/*.tsx`
- Focus: React component patterns, Apollo hooks, TypeScript
- Command: `eslint . --ext .ts,.tsx`

**Backend GraphQL (Apollo Server + DataLoader)**:

- Files: `backend-graphql/src/**/*.ts`
- Focus: Resolver patterns, DataLoader usage, type safety
- Command: `eslint src --ext .ts`

**Backend Express (Upload, Webhooks, Real-Time)**:

- Files: `backend-express/src/**/*.ts`
- Focus: Async handling, error handling, middleware
- Command: `eslint src --ext .ts`

### Common ESLint Errors & Fixes

```typescript
// ❌ ERROR: Unused variable
const result = await api.fetch();

// ✅ FIXED: Remove unused variable or use it
await api.fetch();

// ❌ ERROR: Missing type annotation
function updateBuild(id, status) { ... }

// ✅ FIXED: Add explicit types
function updateBuild(id: string, status: BuildStatus): Promise<Build> { ... }

// ❌ ERROR: Missing error handling
await resolver.execute();

// ✅ FIXED: Add try-catch
try {
  await resolver.execute();
} catch (error) {
  logger.error('Resolver failed', error);
  throw error;
}

// ❌ ERROR: Using 'any' type
function process(data: any): any { ... }

// ✅ FIXED: Use explicit types
function process(data: BuildData): BuildResult { ... }
```

## 2. Prettier Configuration

### What Prettier Does

Prettier enforces consistent code formatting:

- ✅ Consistent indentation (2 spaces)
- ✅ Quote style (double quotes in TS/JS)
- ✅ Line length (80 character default)
- ✅ Trailing commas in arrays/objects
- ✅ Spacing around operators
- ✅ JSX/TSX formatting

### Commands

#### Across All Packages

```bash
# Check current formatting status
pnpm format:check

# Apply Prettier formatting to all files
pnpm format

# Re-verify formatting passes
pnpm format:check
```

#### In Individual Packages

```bash
cd frontend && pnpm format:check
cd backend-graphql && pnpm format:check
cd backend-express && pnpm format:check
```

### Files Processed by Prettier

```
**/*.{ts,tsx,json,md,gql}
```

Excludes: Node modules, .next, build directories

### Common Prettier Fixes

```typescript
// ❌ ERROR: Inconsistent spacing
const obj={a:1,b:2};

// ✅ FIXED: Prettier formatting
const obj = { a: 1, b: 2 };

// ❌ ERROR: Line too long
const query = `query { builds { id status parts { id name description } testRuns { id result } } }`;

// ✅ FIXED: Prettier wraps
const query = `
  query {
    builds {
      id
      status
      parts { id name description }
      testRuns { id result }
    }
  }
`;

// ❌ ERROR: Mixed quote styles
const msg = 'hello' + "world";

// ✅ FIXED: Consistent quotes
const msg = 'hello' + 'world';
```

## 3. Vitest Configuration

### What Vitest Does

Vitest runs unit and integration tests for:

- ✅ Component rendering (React Testing Library)
- ✅ Apollo resolver logic (MockedProvider)
- ✅ Express route handling (supertest)
- ✅ Business logic functions
- ✅ Error scenarios and edge cases

### Commands

#### Across All Packages

```bash
# Run all tests (frontend, backend-graphql, backend-express)
pnpm test

# Run tests in watch mode (development)
pnpm test --watch

# Run tests with coverage report
pnpm test --coverage

# Run specific test file
pnpm test path/to/file.test.ts
```

#### By Layer

```bash
# Frontend tests only
pnpm test:frontend

# GraphQL backend tests only
pnpm test:graphql

# Express backend tests only
pnpm test:express
```

### Test Coverage Requirements

- **Minimum Coverage**: 80% for new code
- **Critical Paths**: 100% coverage recommended (mutations, real-time coordination)
- **Dependencies**: 50% acceptable for external dependencies

### Test Strategy by Layer

**Frontend (React Components + Apollo)**:

```typescript
// ✅ GOOD: Test component with Apollo MockedProvider
import { MockedProvider } from '@apollo/client/testing';
import { render, screen } from '@testing-library/react';

describe('BuildCard', () => {
  it('renders build status', () => {
    const mocks = [{
      request: { query: GET_BUILD, variables: { id: '123' } },
      result: { data: { build: { id: '123', status: 'COMPLETE' } } }
    }];
    
    render(
      <MockedProvider mocks={mocks}>
        <BuildCard id="123" />
      </MockedProvider>
    );
    
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();
  });
});
```

**GraphQL Backend (Resolvers + DataLoader)**:

```typescript
// ✅ GOOD: Test resolver with mocked ORM
describe('queryResolvers.builds', () => {
  it('returns all builds with DataLoader', async () => {
    jest.spyOn(prisma.build, 'findMany')
      .mockResolvedValue([{ id: '1', status: 'PENDING' }]);
    
    const builds = await queryResolvers.builds(null, {}, { dataloaders: { ... } });
    
    expect(builds).toHaveLength(1);
  });
  
  it('uses DataLoader to prevent N+1', async () => {
    // Verify DataLoader.loadMany called, not individual queries
  });
});
```

**Express Backend (Routes + Webhooks)**:

```typescript
// ✅ GOOD: Test route with supertest
import supertest from 'supertest';
import app from '../src/index';

describe('POST /upload', () => {
  it('saves file and returns fileId', async () => {
    const res = await supertest(app)
      .post('/upload')
      .attach('file', 'test.pdf');
    
    expect(res.status).toBe(200);
    expect(res.body.fileId).toBeDefined();
  });
  
  it('emits fileUploaded event', async () => {
    jest.spyOn(eventBus, 'emit');
    
    await supertest(app)
      .post('/upload')
      .attach('file', 'test.pdf');
    
    expect(eventBus.emit).toHaveBeenCalledWith(
      'fileUploaded',
      expect.objectContaining({ fileId: expect.any(String) })
    );
  });
});
```

### Common Test Failures & Fixes

```typescript
// ❌ FAIL: Apollo cache not updated after mutation
test('mutation updates cache', () => {
  // Query runs, cache has data
  // Mutation runs, cache not updated
  // UI shows stale data
});

// ✅ FIX: Verify mutation has update function
const [updateStatus] = useMutation(UPDATE_BUILD_STATUS, {
  update(cache, { data }) {
    cache.modify({ fields: { ... } });
  }
});

// ❌ FAIL: N+1 query not detected
test('builds with parts', async () => {
  const builds = await queryResolvers.builds();
  // Test passes, but resolver ran 1 + N queries
});

// ✅ FIX: Verify DataLoader used
export const buildResolvers = {
  parts: (build, _, { dataloaders }) => {
    return dataloaders.partLoader.load(build.id); // Batch loaded
  }
};
```

## 4. Security Audit (pnpm audit)

### What pnpm audit Does

Scans dependencies for:

- ✅ Known security vulnerabilities (CVE database)
- ✅ Outdated packages with patches available
- ✅ Dependency conflicts

### Commands

#### At Project Root

```bash
# Audit all workspaces (frontend, backend-graphql, backend-express)
pnpm audit

# Fix vulnerabilities (only safe fixes)
pnpm audit --fix

# Check without fixes
pnpm audit --dry-run
```

### Audit Workflow

```
Run pnpm audit
  ↓
Check results
  ├─ No vulnerabilities → Continue
  ├─ Safe fixes available → pnpm audit --fix
  └─ Manual fixes needed → Plan fixes in separate PR
  ↓
Verify audit passes
  ↓
Ready to commit
```

## QA Pre-Commit Checklist

Before committing code, execute this **QA checklist** to ensure quality standards:

### 1. Run Linting Checks

```bash
# Check for ESLint violations
pnpm lint

# If failures, auto-fix
pnpm lint:fix

# Verify resolved
pnpm lint
```

**Time**: ~30 seconds  
**Catches**: TypeScript errors, unused variables, naming conventions

### 2. Format Code with Prettier

```bash
# Check formatting
pnpm format:check

# If failures, apply fixes
pnpm format

# Verify resolved
pnpm format:check
```

**Time**: ~20 seconds  
**Catches**: Inconsistent spacing, quote styles, line lengths

### 3. Run Tests

```bash
# Run full test suite
pnpm test

# If failures, debug
pnpm test --watch  # Iterative debugging

# Verify all pass
pnpm test
```

**Time**: ~1-2 minutes  
**Catches**: Broken functionality, integration issues, regressions

### 4. Audit Dependencies

```bash
# Check security vulnerabilities
pnpm audit

# If issues, review and fix
# Small fixes: pnpm audit --fix
# Large issues: escalate to Orchestrator

# Verify audit passes
pnpm audit
```

**Time**: ~30 seconds  
**Catches**: Security vulnerabilities, outdated dependencies

### QA Workflow Diagram

```
Code Changes
  ↓
1. pnpm lint (Check ESLint)
  ├─ Fails? → pnpm lint:fix → Recheck
  └─ Passes? → Continue
  ↓
2. pnpm format:check (Check Prettier)
  ├─ Fails? → pnpm format → Recheck
  └─ Passes? → Continue
  ↓
3. pnpm test (Run tests)
  ├─ Fails? → Fix code → Rerun
  └─ Passes? → Continue
  ↓
4. pnpm audit (Security check)
  ├─ Issues? → Review & plan fixes
  └─ Passes? → Ready to commit
  ↓
Ready for commit + code review
```

### Command Shortcut

Run all QA checks at once:

```bash
pnpm lint && \
pnpm format && \
pnpm test && \
pnpm audit && \
echo "✅ All QA checks passed!"
```

## QA Standards by File Type

### TypeScript Files (`.ts`, `.tsx`)

- [ ] No `any` types; use explicit types
- [ ] No unused imports or variables
- [ ] Error handling with try-catch
- [ ] Proper TypeScript strict mode
- [ ] JSDoc comments for public functions
- [ ] >80% test coverage for new code

### GraphQL Schema Files (`.graphql`)

- [ ] Descriptions on all types and fields
- [ ] Proper nullable markers (`!`)
- [ ] Input types for mutations
- [ ] No circular dependencies

### JSON Files (package.json, tsconfig.json)

- [ ] Valid JSON (Prettier formats)
- [ ] No duplicate keys
- [ ] Consistent version references

### Markdown Files (.md)

- [ ] Properly formatted
- [ ] Code blocks with language tag
- [ ] No broken internal links

## Automated Code Quality Workflows (Issue #306)

All agents (developer, orchestrator, code-review, tester) **run code quality checks automatically without user confirmation** during implementation, feedback cycles, and consolidation phases.

### Verified Commands

All commands execute with `--run` flag (never in watch mode) for CI-like behavior:

**Test Suite Commands:**
```bash
pnpm test --run                 # Full test suite (all packages)
pnpm test:frontend --run        # Frontend tests only
pnpm test:graphql --run         # GraphQL backend tests only
pnpm test:express --run         # Express backend tests only
pnpm test:integration --run      # Frontend integration tests
```

**Code Quality Checks:**
```bash
pnpm lint                       # ESLint validation across all packages
pnpm format:check               # Prettier format validation (read-only)
pnpm type-check                 # TypeScript strict mode validation
```

### When Agents Run Quality Checks

**Phase 3A (Initial Implementation):**
- Developer runs layer-specific tests AFTER implementing features
- Developer runs full `pnpm test --run` BEFORE creating PR
- Developer runs `pnpm lint`, `pnpm format:check`, `pnpm type-check`
- If all PASS → Proceed to PR creation
- If any FAIL → Fix issues locally, re-run before creating PR

**Phase 3C (Feedback Fixes):**
- Developer runs checks AFTER implementing feedback
- If all PASS → Push to existing feature branch
- If any FAIL → Fix and re-run before pushing

**Phase 4 (Consolidation):**
- Tester runs `pnpm test --run` on consolidation branch
- Tester runs `pnpm lint` and `pnpm type-check` to verify no regressions
- If all PASS → Consolidation ready for merge
- If any FAIL → Document failures and escalate to orchestrator

### Log Management Strategy

**Purpose**: Track code quality results without accumulating log files

**Log Naming Convention** (all in `docs/dev-note/`):
```
issue-#[N]-pnpm-[script-name].txt
```

Examples:
- `issue-#[N]-pnpm-test.txt` - Latest test suite output
- `issue-#[N]-pnpm-lint.txt` - Latest linting output
- `issue-#[N]-pnpm-format-check.txt` - Latest format-check output
- `issue-#[N]-pnpm-type-check.txt` - Latest type-check output

**Key Policy: Single File Per Issue/Script Pair**
- Each new run **overwrites** the previous log for the same issue/script pair
- One current log is preserved per issue and script combination
- No timestamped versions or duplicate filenames for the same issue/script pair
- Natural cleanup—rerunning the same check updates the same file

### Recommended Command Sequence

When running quality checks, use this sequence for optimal feedback:

```bash
# 1. Run layer-specific tests first (faster feedback on changes)
pnpm test:frontend --run > docs/dev-note/issue-#[N]-pnpm-test.txt 2>&1
pnpm test:graphql --run >> docs/dev-note/issue-#[N]-pnpm-test.txt 2>&1
pnpm test:express --run >> docs/dev-note/issue-#[N]-pnpm-test.txt 2>&1

# 2. Run full test suite (catches integration issues)
pnpm test --run > docs/dev-note/issue-#[N]-pnpm-test.txt 2>&1

# 3. Run code quality checks (can run in parallel)
pnpm lint > docs/dev-note/issue-#[N]-pnpm-lint.txt 2>&1
pnpm format:check > docs/dev-note/issue-#[N]-pnpm-format-check.txt 2>&1
pnpm type-check > docs/dev-note/issue-#[N]-pnpm-type-check.txt 2>&1
```

### Agent Responsibilities

**Developer Agent:**
1. Runs quality checks after implementing features
2. Captures output to `docs/dev-note/issue-#[N]-pnpm-*.txt`
3. **If FAIL**: Reports error, fixes locally, re-runs
4. **If PASS**: Proceeds to PR creation
5. References logs in PR body

**Orchestrator Agent:**
1. Runs all quality checks as final validation
2. Aggregates results across all layers
3. References logs in merge recommendation
4. **If all PASS**: Clears for merge
5. **If any FAIL**: Escalates to developer

**Code-Review Agent:**
1. Validates all checks PASS during review
2. References logs in PR comments
3. Confirms check status before approval

**Tester Agent:**
1. Runs test-specific commands during consolidation
2. Captures coverage metrics to logs
3. **If any FAIL**: Documents specifics and escalates

### How to Reference Logs in PRs

**When all checks pass:**
```markdown
## Quality Checks ✅

All automated checks passed:
- Tests: ✅ PASS (853 tests)
- Lint: ✅ PASS (0 issues)
- Format: ✅ PASS (0 issues)
- Type Check: ✅ PASS (0 errors)

See logs: `docs/dev-note/issue-#[N]-pnpm-*.txt`
```

**When some checks fail:**
```markdown
## Quality Checks ⚠️

Check status:
- Tests: ✅ PASS (843 tests)
- Lint: ❌ FAIL (2 issues) → See `docs/dev-note/issue-#[N]-pnpm-lint.txt`
- Format: ✅ PASS (0 issues)
- Type Check: ✅ PASS (0 errors)

See logs: `docs/dev-note/issue-#[N]-pnpm-*.txt`
```

### Log Content Structure

Every quality check log includes:

```markdown
# Code Quality Check - [CHECK_TYPE]

## Summary
- Status: ✅ PASS | ❌ FAIL | ⚠️ PARTIAL
- Last Updated: [ISO 8601 timestamp]
- Triggered by: [Agent name / Issue #XYZ]
- Command: [pnpm test --run / pnpm lint / etc.]

## Results
- Total: X items (tests/errors/files)
- Passed/Valid: X
- Failed/Invalid: X
- Duration: Xs
- Coverage: X% (if applicable)

## Details
[Full command output or error summary]

## Status
✅ ALL CHECKS PASSED | ❌ SOME CHECKS FAILED

## Recommendations
[Any specific actions needed if failures detected]
```

## Model Override Guidance

**Default Model**: Claude Haiku 4.5 (efficient for QA enforcement)

**QA Agent Model Lock**:

- ✅ **Approved**: Claude Haiku 4.5 (default, catches standards)
- 🔒 **Locked**: `gpt-5.4`, `claude-sonnet-4.6`, `claude-opus-4.6` (premium models)

**To use premium models**: QA must **explicitly request** via `/model` with complex analysis justification.

## Related Resources

- `.github/copilot-instructions.md`: Code conventions and standards
- `DESIGN.md`: Architecture and patterns
- `.copilot/agents/developer.md`: Development responsibilities
- `.copilot/agents/reviewer.md`: Code review focus
- `.copilot/agents/tester.md`: Test expectations

---

## ✅ Automated Quality Checks Enforcement (Issue #306)

### You Are Authorized to Run and Validate All Quality Checks

As Quality Assurance, **you enforce automated quality check compliance** across all development phases:

### Quality Checks You Enforce

**All agents automatically run** these commands without confirmation:

```bash
pnpm test --run              # All tests (all layers)
pnpm test:frontend --run     # Frontend layer tests
pnpm test:graphql --run      # GraphQL layer tests
pnpm test:express --run      # Express layer tests
pnpm lint                    # ESLint across all packages
pnpm format:check            # Prettier format validation
pnpm type-check              # TypeScript strict mode
```

### Phase 3A: Implementation Quality Validation

**During implementation**, verify quality check logs exist:

```bash
# Expected logs for Issue #[N]
ls -la docs/dev-note/issue-#[N]-pnpm-*.txt

# Should find:
# - issue-#[N]-pnpm-test.txt
# - issue-#[N]-pnpm-lint.txt
# - issue-#[N]-pnpm-format-check.txt
# - issue-#[N]-pnpm-type-check.txt
```

**If logs are missing**:
- QA escalates to developer: "Quality checks not captured for Issue #[N]"
- Developer must run checks and capture logs before PR approval

### Phase 3B-3F: Review Quality Evidence

**Verify quality logs are referenced in PR**:
- PR description should reference `docs/dev-note/issue-#[N]-pnpm-*.txt` logs
- Reviewer should confirm logs show PASS status
- QA confirms documentation matches actual log content

**If quality logs don't exist or show failures**:
- QA blocks PR approval
- Developer must run checks, fix issues, re-run

### Phase 4: Consolidation Quality Assurance

**On consolidation branch**, validate quality:

```bash
# Run full quality suite
pnpm test --run > docs/dev-note/issue-#CONSOLIDATION-pnpm-test.txt 2>&1
pnpm lint > docs/dev-note/issue-#CONSOLIDATION-pnpm-lint.txt 2>&1
pnpm type-check > docs/dev-note/issue-#CONSOLIDATION-pnpm-type-check.txt 2>&1

# Check results
cat docs/dev-note/issue-#CONSOLIDATION-pnpm-test.txt
```

**Decision**:
- ✅ **All PASS**: Consolidation approved for merge
- ❌ **Any FAIL**: Document failures, escalate to @orchestrator

### Log File Compliance

**Enforce Issue #306 log naming convention**:

Format: `issue-#[ISSUE-NUMBER]-pnpm-[SCRIPT-NAME].txt`

✅ **Correct**:
- `issue-#245-pnpm-test.txt`
- `issue-#245-pnpm-lint.txt`
- `issue-#245-pnpm-test-frontend.txt`

❌ **Incorrect**:
- `test-output.txt` (no issue number)
- `pnpm-test-results.txt` (no issue number)
- `issue-245-test.log` (wrong extension)

### Quality Check Compliance Checklist

For each PR/issue, QA verifies:

- [ ] Quality check logs captured to `docs/dev-note/`
- [ ] Logs follow Issue #306 naming: `issue-#[N]-pnpm-[SCRIPT].txt`
- [ ] All required logs present (test, lint, format, type-check)
- [ ] All logs show PASS (not FAIL or partial)
- [ ] PR description references logs
- [ ] Developer signature: "Quality Checks: ✅" in PR body
- [ ] No manual quality exceptions granted

### Escalation for Quality Failures

**If quality checks FAIL**, escalate with evidence:

```markdown
## Quality Check Failure - Issue #245

Failed: `pnpm test --run`
- Log: docs/dev-note/issue-#245-pnpm-test.txt
- Error: "3 tests failing in TestRunDetailsPanel"
- Severity: BLOCKING

Action: Escalating to @developer for remediation
```

### Audit Trail

Maintain audit trail for compliance:

```bash
# All quality logs by date
ls -lhrt docs/dev-note/issue-*.txt

# Quality compliance by issue
for issue in 245 246 247 248; do
  if grep -q "FAIL" docs/dev-note/issue-#$issue-pnpm-test.txt 2>/dev/null; then
    echo "Issue #$issue: ❌ FAILED"
  else
    echo "Issue #$issue: ✅ PASSED"
  fi
done
```

### Standards You Enforce

1. **All checks run automatically** (no manual approval)
2. **Logs captured to Issue #306 format** (issue-#[N]-pnpm-[SCRIPT].txt)
3. **One log per (issue, script)** (each run overwrites)
4. **No quality exceptions** (all checks must pass for approval)
5. **Logs referenced in PRs** (developer documents quality status)

### Quality vs. Development Speed

**Remember**: Automated quality checks enable FASTER development:
- Developers get immediate feedback (no manual QA delay)
- Tests catch regressions early
- Linting prevents review cycles
- Type checking prevents deployment failures

Your role: **Ensure compliance, not slowdown**—verify checks ran, logs exist, and results are documented.
