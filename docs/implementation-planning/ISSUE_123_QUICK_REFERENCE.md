# Issue #123 Implementation Quick Reference

## TL;DR

**Issue**: 3 critical JWT backend security & type issues causing DoS, security vulnerabilities, and type fragility

**Plan Location**: `docs/implementation-planning/IMPLEMENTATION_PLAN_ISSUE_123.md` (25 KB, comprehensive)

**Implementation**: 7 tasks across 4 phases, 4-5.5 hours total

---

## The 3 Issues

### 1. CRITICAL: Context Factory Crashes on Invalid JWT
```
File: backend-graphql/src/index.ts:45
Current: const user = extractUserFromToken(req.headers.authorization);
Problem: Throws exception → crashes Apollo server (DoS)
Fix: Wrap in try-catch, set user: null on error
Risk: Any malformed JWT crashes entire server
```

### 2. HIGH: Missing JWT id Type Validation
```
File: backend-graphql/src/middleware/auth.ts:52-57
Problem: JWT with id: null, id: 123, id: [] pass validation
Fix: Add typeof decoded.id === 'string' && decoded.id.length > 0
Risk: Invalid tokens accepted, runtime errors downstream
```

### 3. MEDIUM: Type Inconsistency (BuildContext vs DataLoaders)
```
Files: types.ts:40-41 vs dataloaders/index.ts:69-70
Problem: PartData[] vs Part[] (custom types vs Prisma types)
Fix: Remove PartData/TestRunData, use Prisma types everywhere
Risk: Type confusion, potential resolver errors
```

---

## 7-Task Implementation (Dependency-Ordered)

```
PHASE 1 (Parallel):
├─ Task 1: Add JWT id Type Validation
├─ Task 2: Standardize DataLoader Types

PHASE 2 (Sequential):
└─ Task 3: Context Factory Try-Catch [depends on Task 1]

PHASE 3 (Parallel):
├─ Task 4: JWT Validation Tests (5 new tests) [depends on Task 1]
├─ Task 5: Context Factory Tests (4 new tests) [depends on Task 3]
└─ Task 6: DataLoader Type Check [depends on Task 2]

PHASE 4 (Final):
└─ Task 7: Full Integration Test (pnpm test, lint, build)
```

---

## Files Modified (6 Total)

**Code Changes**:
- `backend-graphql/src/middleware/auth.ts` (1 change)
- `backend-graphql/src/index.ts` (1 change)
- `backend-graphql/src/types.ts` (2 changes)
- `backend-graphql/src/dataloaders/index.ts` (1 change)

**Test Changes**:
- `backend-graphql/src/middleware/__tests__/auth.test.ts` (5 new tests)
- `backend-graphql/src/resolvers/__tests__/auth-check.test.ts` (4 new tests)

---

## Acceptance Criteria (9/9)

✅ All 44 backend-graphql tests pass (including 9 new tests)  
✅ All 68 backend-express tests pass  
✅ All 10 frontend tests pass  
✅ ESLint passes  
✅ TypeScript strict mode passes  
✅ Invalid JWT returns GraphQL error (not 500)  
✅ JWT id must be non-empty string  
✅ Types consistent across BuildContext & DataLoaders  
✅ All resolvers use correct types  

---

## Verification Commands

```bash
# TypeScript check
pnpm tsc --noEmit

# Lint check
pnpm lint

# Backend tests
pnpm -F backend-graphql test

# Full test suite
pnpm test

# Expected: 122 tests (44 + 68 + 10) all pass
```

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Type breaking changes | LOW | Internal types only, no schema changes |
| Missing JWT validation cases | HIGH | 5 comprehensive test cases (null, number, empty, array, object) |
| Context factory still crashes | CRITICAL | Try-catch + security tests |
| Type errors after refactoring | MEDIUM | Full TypeScript + test suite check |
| Resolver property access fails | LOW | Use Prisma types directly |

---

## Estimated Effort

- **Planning**: ✅ Complete
- **Implementation**: 2-3 hours (code changes)
- **Testing**: 1-2 hours (test coverage)
- **Verification**: 30 minutes (final checks)
- **Total**: 4-5.5 hours

---

## Key Implementation Points

1. **JWT Validation**: Add `typeof decoded.id === 'string' && decoded.id.length > 0`
2. **Context Factory**: Wrap in try-catch, set user: null on error
3. **DataLoader Types**: Replace PartData[] with Part[], TestRunData[] with TestRun[]
4. **Test Coverage**: 5 JWT tests + 4 context factory tests + type consistency
5. **No Schema Changes**: All changes internal to implementation

---

## Next Steps

1. Review full plan: `docs/implementation-planning/IMPLEMENTATION_PLAN_ISSUE_123.md`
2. Execute Phase 1 tasks (parallel): Tasks 1 & 2
3. Execute Phase 2-4 in sequence
4. Run verification commands
5. Commit with reference to Issue #123

---

## Critical Path

**Fastest implementation route**:
1. Task 1 (JWT id validation)
2. Task 3 (Context try-catch)  
3. Task 5 (Context factory tests)
4. Task 7 (Final integration test)

Parallel: Task 2 → Task 6 during above

**Estimated**: 4 hours on critical path

---

For detailed information, see: `docs/implementation-planning/IMPLEMENTATION_PLAN_ISSUE_123.md`
