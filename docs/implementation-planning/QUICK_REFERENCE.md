# PR #245 & #246 - Quick Reference Card

## TL;DR - The Decision

✅ **PARALLEL EXECUTION IS GO**

**Start Both Agents Now** → **50-55 min to merge** → **Production ready**

---

## At a Glance

| Item | Status |
|------|--------|
| **Blocking Dependencies** | ❌ ZERO |
| **Merge Conflicts** | ✅ MINIMAL (2 min to resolve) |
| **Safe to Parallelize** | ✅ YES |
| **Timeline** | 50-55 minutes |
| **Risk** | 🟢 LOW |

---

## What Gets Fixed

### PR #245: Pagination
```
Issue 1: ✅ Verify import (no change needed)
Issue 2: ❌ Integrate Pagination component
Issue 3: ❌ Fix test mock (add count())
Issue 4: 📝 Update commit message
```

### PR #246: CLS Fix
```
Issue 1: ❌ Add minHeight to table rows (prevent layout shift)
```

---

## The 3-Minute Briefing

### Agent-1 (Pagination): 30 min work

```
1. Verify TableSkeleton import (2 min, no change needed)
2. Integrate Pagination component (15 min):
   - Import Pagination from './Pagination'
   - Destructure controls from useBuilds()
   - Render component below table
3. Fix test mock (5 min):
   - Add count: async () => 42 to mockPrisma
4. Run tests (10 min):
   - pnpm test:graphql && pnpm test:frontend
```

### Agent-2 (CLS Fix): 15 min work

```
1. Add minHeight to table rows (5 min):
   - Add style={{ minHeight: '56px' }} to actual table rows
   - Match skeleton height to prevent layout shift
2. Verify CLS fix (10 min):
   - pnpm test:frontend
   - Lighthouse audit: CLS < 0.1
```

### Orchestrator: 20 min review & merge

```
1. Code review both PRs (10 min)
2. Run full test suite (5 min)
3. Merge: PR #246 first, then PR #245 (5 min)
```

---

## Files to Change

### PR #245

| File | Changes | Lines |
|------|---------|-------|
| `frontend/components/build-dashboard.tsx` | Import Pagination, destructure controls, render | 30, 150-160 |
| `backend-graphql/src/resolvers/__tests__/auth-check.test.ts` | Add count() method | ~45 |

### PR #246

| File | Changes | Lines |
|------|---------|-------|
| `frontend/components/build-dashboard.tsx` | Add minHeight to table rows | 50-100 |

---

## Execution Checklist

### Before Starting
- [ ] Both agents ready
- [ ] Feature branches created
- [ ] `pnpm install` complete
- [ ] Latest main pulled

### Agent-1 Checklist
- [ ] P1.1: Verify import (2 min)
- [ ] P1.2: Integrate Pagination (15 min)
- [ ] P1.3: Add count() to mock (5 min)
- [ ] P1.4: Tests passing (10 min)
- [ ] Browser test: Pagination works
- [ ] Push branch: `git push origin fix/pr-245-pagination-integration`

### Agent-2 Checklist
- [ ] S1.1: Add minHeight (5 min)
- [ ] S1.2: CLS verified < 0.1 (10 min)
- [ ] Tests passing
- [ ] Push branch: `git push origin fix/pr-246-cls-fix`

### Orchestrator Checklist
- [ ] Code review both (10 min)
- [ ] Full test suite passing (5 min)
- [ ] No merge conflicts or trivial to resolve
- [ ] Merge PR #246 first
- [ ] Merge PR #245 second
- [ ] Final smoke test
- [ ] Ready for staging

---

## Git Commands

### Agent-1
```bash
git checkout -b fix/pr-245-pagination-integration
# Make changes...
pnpm test:graphql && pnpm test:frontend
git add -A
git commit -m "feat: Integrate pagination into BuildDashboard"
git push origin fix/pr-245-pagination-integration
```

### Agent-2
```bash
git checkout -b fix/pr-246-cls-fix
# Make changes...
pnpm test:frontend
git add -A
git commit -m "fix: Add minHeight to table rows to prevent CLS"
git push origin fix/pr-246-cls-fix
```

### Orchestrator
```bash
git checkout main && git pull
git merge fix/pr-246-cls-fix
git merge fix/pr-245-pagination-integration
# If conflict: resolve, then:
git add -A && git commit
pnpm test
git push origin main
```

---

## Common Issues & Fixes

### Pagination Doesn't Render
```
Cause: Props not matching, import wrong
Fix: Check useBuilds returns all pagination controls
Time: 5 min
```

### Test Mock Fails
```
Cause: count() not added or wrong type
Fix: Add count: async () => 42 to mock
Time: 2 min
```

### CLS Not Improved
```
Cause: minHeight on wrong element or too low
Fix: Measure actual row height, adjust minHeight
Time: 5 min
```

### Merge Conflict
```
Cause: Both PRs edit build-dashboard.tsx
Fix: Keep both changes (different sections)
Time: 2 min
```

---

## Success Metrics

### PR #245 ✅ Success When:
- [ ] Pagination component renders
- [ ] Next/Previous buttons work
- [ ] Page size selector works
- [ ] Total count displays
- [ ] All tests pass
- [ ] No console errors

### PR #246 ✅ Success When:
- [ ] Skeleton matches actual row height (56px)
- [ ] Lighthouse CLS < 0.1
- [ ] No layout shift on load
- [ ] All tests pass
- [ ] Mobile still responsive

---

## Timeline Summary

```
T+0min   → START (both agents)
T+5min   → Agent-2 done (minHeight added)
T+15min  → Agent-2 validation complete
T+20min  → Agent-1 integration complete
T+30min  → Agent-1 tests complete
T+35min  → Code review starts
T+45min  → Full test suite running
T+50min  → Both PRs merged
T+55min  → DONE ✅
```

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Conflict | Medium | Low | Merge PR #246 first |
| Pagination fails | Low | High | Test in browser |
| CLS not fixed | Low | Low | Run Lighthouse |
| Tests fail | Low | Medium | Debug + 5 min fix |

**Overall Risk: 🟢 LOW**

---

## Notes for Team

1. **Stay coordinated**: Quick checkpoint every 10 min
2. **Test locally first**: Before pushing branches
3. **Different sections**: Both PRs modify build-dashboard.tsx but in different places
4. **Merge order matters**: PR #246 (CLS) → PR #245 (Pagination)
5. **Browser validation**: Pagination AND skeleton must work together
6. **No rush**: Better to be careful than to merge broken code

---

## Decision

✅ **APPROVED FOR PARALLEL EXECUTION**

- Low risk
- Zero blocking dependencies
- 50-55 minute timeline
- Both features ready for staging

**GO AHEAD!**

---

**Quick Ref Version:** 1.0  
**Last Updated:** 2026-05-08  
**Status:** ✅ READY TO EXECUTE
