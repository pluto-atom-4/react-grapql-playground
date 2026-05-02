# Phase 2 Analysis - Quick Reference Card

## 🎯 TL;DR Recommendation

**❌ DO NOT use Git Worktree**  
**✅ USE Simple Branching** (sequential merge of #28→#32 to avoid conflicts)

---

## Current State Snapshot

```
Branch:    main (clean)
Worktrees: None
Status:    Ready for Phase 2 issues
```

---

## Issue Scope Matrix

| Issue | Scope | Duration | Files Modified | Files Created |
|-------|-------|----------|-----------------|---|
| #28 | Frontend | 2h | `layout.tsx`, `apollo-client.ts` | ✨ 3 new (error-boundary, error.tsx, styles) |
| #29 | Frontend + Express | 2h | `use-sse-events.ts`, `events.ts` | - |
| #31 | Frontend | 1.5h | `build-detail-modal.tsx` | ✨ 1 new (toast-notification) |
| #32 | Frontend | 1.5h | `apollo-client.ts` (entire rewrite) | - |

---

## Conflict Map

```
frontend/lib/apollo-client.ts
├─ Issue #28: ADD error handling → onError link
└─ Issue #32: ADD retry + timeout → RetryLink + AbortSignal
               ⚠️ SAME FILE = Coordination needed
```

**Solution**: Merge #28 → #32 sequentially (not with worktrees)

---

## Parallel vs Sequential

### ✅ Can Run in Parallel
- **Issue #31** (Toast UI) ↔ **Issue #29** (SSE/CORS)
- **Issue #31** (Toast UI) ↔ **Issue #28** (Error Boundaries)

### ⚠️ Must Coordinate
- **Issue #28** (Error Boundaries) → **Issue #32** (Retry/Timeout)
- Reason: Both touch `apollo-client.ts`
- Solution: #28 merges first, #32 builds on top

---

## Execution Timeline

```
PHASE 1 (PARALLEL - Start simultaneously)
├─ Branch: feat/issue-31-error-ui    [2h] ✅ independent
└─ Branch: feat/issue-29-cors-sse    [2h] ✅ independent
                                          ↓
PHASE 2 (SEQUENTIAL - After one branch merges)
├─ Branch: feat/issue-28-error-boundaries [2h] ✅ prepares apollo-client
│   (merge to main)
│                                          ↓
└─ Branch: feat/issue-32-timeouts     [1.5h] ✅ integrates with #28
                                          ↓
TEST & VERIFY                          [1h]

TOTAL: ~7.5 hours (vs 9.5 if purely sequential)
```

---

## Why NOT Git Worktree?

| Factor | Why Simple Branching Wins |
|--------|--------------------------|
| **Conflicts** | Only 1 file conflict (manageable via sequential merge) |
| **Team** | Solo/small team (worktrees need 3+ concurrent devs) |
| **Complexity** | Simpler workflow, no worktree setup/teardown |
| **Risk** | Lower chance of branch pollution |
| **Speed** | No worktree overhead, faster context switches |
| **Integration** | No heavy cross-branch testing needed |

---

## Merge Order (CRITICAL)

```
1. feat/issue-31-error-ui        → main  ✅ First
2. feat/issue-29-cors-sse        → main  ✅ Second
3. feat/issue-28-error-boundaries → main  ✅ Third (prepares apollo-client.ts)
4. feat/issue-32-timeouts        → main  ✅ Fourth (depends on #28)
```

**Why this order?**
- Issues #31 and #29 are independent → land first
- Issue #28 adds error handling to Apollo → foundation for #32
- Issue #32 reuses #28's error link → must come after

---

## File-Level Dependencies

### `frontend/lib/apollo-client.ts` (The Critical File)

**Current state**: Basic setup

**After #28**: 
```typescript
+ errorLink (onError handler for GraphQL errors)
```

**After #32** (on top of #28):
```typescript
+ errorLink (from #28)
+ retryLink (automatic retry with exponential backoff)
+ timeout (AbortSignal.timeout(10000))
```

→ Clean integration if done sequentially

---

## Testing Checklist

### Before Starting
- [ ] All services running (`pnpm dev`)
- [ ] Tests passing (`pnpm test`)
- [ ] No uncommitted changes (`git status` clean)

### Per Branch
- [ ] Unit tests pass (`pnpm test`)
- [ ] TypeScript build clean (`pnpm build`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Manual testing scenarios work

### After Merge
- [ ] Full test suite passes (`pnpm test`)
- [ ] Integration scenarios tested
- [ ] Error UI displays correctly
- [ ] SSE reconnects on network loss
- [ ] Apollo requests timeout after 10s
- [ ] Console shows proper error logs

---

## Quick Start Commands

### Start Phase 1 (Parallel)

```bash
# Terminal 1: Issue #31
git checkout -b feat/issue-31-error-ui main
# Edit: frontend/components/toast-notification.tsx
# Edit: frontend/components/build-detail-modal.tsx

# Terminal 2: Issue #29
git checkout -b feat/issue-29-cors-sse main
# Edit: frontend/lib/use-sse-events.ts
# Edit: backend-express/src/routes/events.ts
```

### Continue Phase 2 (Sequential)

```bash
# After first branch merges
git checkout main && git pull
git checkout -b feat/issue-28-error-boundaries main
# Create: frontend/components/error-boundary.tsx
# Create: frontend/app/error.tsx
# Edit: frontend/app/layout.tsx
# Edit: frontend/lib/apollo-client.ts (add error link)

# After #28 merges
git checkout main && git pull
git checkout -b feat/issue-32-timeouts main
# Edit: frontend/lib/apollo-client.ts (add retry + timeout)
```

---

## Key Files to Watch

| File | Issues Touching | Risk |
|------|-----------------|------|
| `frontend/lib/apollo-client.ts` | #28, #32 | 🔴 HIGH - Coordinate |
| `frontend/app/layout.tsx` | #28 | 🟡 MEDIUM - Monitor |
| `frontend/lib/use-sse-events.ts` | #29 | 🟢 LOW - Independent |
| `frontend/components/build-detail-modal.tsx` | #31 | 🟢 LOW - Independent |

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| #28 + #32 conflict in apollo-client.ts | ✅ Sequential merge (#28 first) |
| Merge conflicts during parallel work | ✅ Issues #31 and #29 have zero overlaps |
| Type errors after integration | ✅ Run `pnpm build` after each merge |
| SSE or timeout behavior broken | ✅ Manual testing + integration tests |

---

## Success Criteria

- ✅ All 4 issues implemented
- ✅ No git merge conflicts
- ✅ All tests pass
- ✅ TypeScript strict mode clean
- ✅ Manual testing: Toast, SSE reconnect, timeouts all work
- ✅ Clean commit history with descriptive messages

---

## Reference Materials

📖 **Full Analysis**: `PHASE2_WORKTREE_ANALYSIS.md`

📋 **Issues**:
- [#28 Error Boundaries](https://github.com/pluto-atom-4/react-grapql-playground/issues/28)
- [#29 CORS & SSE](https://github.com/pluto-atom-4/react-grapql-playground/issues/29)
- [#31 Error UI](https://github.com/pluto-atom-4/react-grapql-playground/issues/31)
- [#32 Timeouts & Retry](https://github.com/pluto-atom-4/react-grapql-playground/issues/32)

---

**Analysis Date**: April 18, 2026  
**Recommendation Confidence**: HIGH  
**Next Action**: Begin Phase 1 (Issues #31 & #29 in parallel)
