# 📋 Blocking Questions - User Decisions

**Date:** April 24, 2026  
**Status:** All 4 critical questions answered  
**Purpose:** Guide implementation roadmap based on user decisions

---

## 1. Dashboard Route Strategy

### ❓ Question
Should login redirect to `/dashboard` (dedicated page) or `/` (home page)?

**Current State:**
- Behavior: Redirects to `/` (home page)
- Tests expect: `/dashboard` (separate dashboard page)

**Recommendation:**
- Create `/dashboard` (better UX, aligns with tests)

### ✅ Your Decision
**→ CREATE /dashboard (Recommended)**

**Implications:**
- ✅ Aligns with test expectations (simplifies test fixes)
- ✅ Better UX (dedicated dashboard page for authenticated users)
- ✅ More scalable (home page can remain static)
- ✅ Cleaner separation of concerns
- ⏱️ Adds 30 minutes to Phase 1 (Step 1.2)

**Action Items:**
1. Create `frontend/app/dashboard/page.tsx` with auth guard
2. Update `frontend/components/login-form.tsx` redirect from `/` to `/dashboard`
3. Update `frontend/app/login/page.tsx` redirect from `/` to `/dashboard`

**Files Affected:**
- ✏️ `frontend/app/dashboard/page.tsx` (CREATE NEW)
- ✏️ `frontend/components/login-form.tsx` (line 34)
- ✏️ `frontend/app/login/page.tsx` (line 14)

---

## 2. Implementation Timeline

### ❓ Question
Can this work be completed in one session (3 hours)?

**Phase Breakdown:**
- Phase 1: Unblock tests (60 min)
- Phase 2: Complete tests (90 min)
- Phase 3: Production hardening (35 min)
- **Total:** 185 minutes (3 hours)

**Options:**
- Complete all phases now (3 hours)
- Phase 1 only now, Phase 2-3 later (60 min + rest later)
- Phase 1-2 now, Phase 3 later (150 min + 35 min later)

### ✅ Your Decision
**→ PHASE 1-2 NOW, PHASE 3 LATER**

**Implications:**
- ⏱️ Implement: 60 + 90 = 150 minutes today (2.5 hours)
- ⏱️ Defer: Phase 3 (35 minutes) for later session
- ✅ Gets all 18 tests passing today
- ✅ Keeps polish/hardening for separate session
- ✅ More sustainable work pace

**Work Breakdown Today:**
```
Phase 1 (Unblock):        60 minutes
├─ Add data-testid       15 min
├─ Create /dashboard     30 min
├─ Update redirects       5 min
├─ Fix Playwright config  2 min
└─ Test verification      8 min

Phase 2 (Complete):       90 minutes
├─ Dashboard selectors   30 min
├─ Logout implementation 40 min
├─ Session timeout       20 min
└─ Test verification      8 min

SUBTOTAL TODAY:          150 minutes (2.5 hours)
RESULT: ✅ 18/18 tests passing
```

**Phase 3 (Deferred):**
```
Phase 3 (Harden):         35 minutes
├─ Optimize selectors    10 min
├─ Loading states        10 min
├─ Security hardening    10 min
└─ Performance tests      5 min

SCHEDULED: Later session (when convenient)
RESULT: Production-grade E2E suite
```

**Success Criteria for Today:**
- ✅ All 18 E2E tests passing
- ✅ Full authentication flow validated
- ✅ Dashboard with logout working
- ✅ Session management tested

---

## 3. Team Assignment

### ❓ Question
Who will implement the fixes?

**Options:**
- You implement all phases
- Developer agent handles all
- Split: Phase 1 (unblock) vs Phase 2-3 (complete)
- Developer handles all phases

### ✅ Your Decision
**→ ASSIGN TO DEVELOPER AGENT**

**Implications:**
- 👤 Developer agent handles all implementation
- 📋 Exact code snippets and line numbers provided
- ✅ Structured, step-by-step roadmap ready
- ⏱️ Expected completion: ~2.5 hours (Phase 1-2)
- 📊 Code review after each phase (optional)

**Developer Agent Will:**
1. Follow Phase 1 implementation roadmap (60 min)
   - Add 5 data-testid attributes
   - Create /dashboard route
   - Update redirects
   - Fix Playwright config
   - Verify Phase 1 success

2. Follow Phase 2 implementation roadmap (90 min)
   - Add dashboard data-testid attributes
   - Implement logout functionality
   - Implement session timeout logic
   - Verify all 18 tests pass

3. Provide:
   - Summary of changes made
   - Test execution results
   - Any issues encountered
   - Recommendation for Phase 3

**Documentation Ready:**
- ✅ Exact line numbers for all changes
- ✅ Code snippets ready to use
- ✅ Verification commands for each step
- ✅ Success criteria clearly defined
- ✅ Troubleshooting guide included

---

## 4. CI/CD Integration

### ❓ Question
Should E2E tests run in automated pipeline after completion?

**Options:**
- Yes, add to pre-commit + PR validation
- Yes, PR validation only
- Maybe later
- No, manual testing for now

### ✅ Your Decision
**→ REVISITED: GitHub Issues #9 and #98 cover this**

**Explanation:**
- This is already tracked in existing GitHub issues
- Issue #9: Pre-commit hooks
- Issue #98: PR validation pipeline
- Will be handled as part of CI/CD setup
- Not blocking for current E2E test fixes

**Decision Impact:**
- ✅ E2E tests will be integration-ready when Phase 2 completes
- ✅ CI/CD setup will be addressed through issues #9 and #98
- ✅ No immediate action needed for this phase
- ➡️ Future: Hook up tests to CI/CD via those issues

**Timeline:**
- Today (Phase 1-2): Make tests pass (150 min)
- Later: CI/CD integration (covered by #9, #98)

---

## Summary of Decisions

| Question | Decision | Impact | Timeline |
|----------|----------|--------|----------|
| **Dashboard Route** | Create `/dashboard` | +30 min implementation, aligns with UX | Phase 1 Step 1.2 |
| **Implementation Timeline** | Phase 1-2 today, Phase 3 later | 150 min today, 35 min deferred | Today 2.5h + Later 35m |
| **Team Assignment** | Developer agent | Clear roadmap provided | Start now |
| **CI/CD Integration** | Handled via issues #9, #98 | Not blocking, future setup | Deferred |

---

## Immediate Next Steps

### For User:
1. ✅ Review this decisions document
2. ➡️ Provide developer agent with implementation roadmap
3. 👀 Monitor progress (optional check-ins)
4. ✅ Verify Phase 1 completes (60 min from start)
5. ✅ Verify Phase 2 completes (150 min from start)
6. 📊 Review test results

### For Developer Agent:
1. Start Phase 1 (Step 1.1: add data-testid attributes)
2. Follow step-by-step roadmap in CONSOLIDATED-E2E-REVIEW-OUTCOME.md
3. Complete Phase 1 verification
4. Continue Phase 2
5. Verify all 18 tests pass
6. Provide summary and next steps

---

## Expected Outcomes

### By End of Today (150 minutes):
```
✅ Phase 1 Complete:
   • Data-testid attributes added (5 total)
   • Dashboard route created
   • Redirects updated
   • Playwright config fixed
   • Tests no longer timeout on form interaction

✅ Phase 2 Complete:
   • Dashboard UI components built
   • Logout functionality implemented
   • Session timeout logic added
   • All 18 E2E tests passing
   • Full authentication flow validated

Status: 🎉 READY FOR PHASE 3 (when convenient)
```

### By End of Phase 3 (Future):
```
✅ Production-Ready E2E Suite:
   • Selectors optimized
   • Loading states implemented
   • Security hardened
   • Performance tuned (<5 min total)
   • Ready for CI/CD integration via #9, #98
```

---

## Reference Documents

**Implementation Guide:**
- 📄 `CONSOLIDATED-E2E-REVIEW-OUTCOME.md` (1,040 lines)
  - Complete technical reference
  - Step-by-step roadmap with code snippets
  - All exact line numbers and file locations

**Quick Reference:**
- 📄 `INDEX.md` (278 lines) - Navigation guide
- 📄 `EXECUTIVE-SUMMARY.md` (378 lines) - High-level overview
- 📄 `DECISIONS.md` (this file) - User decisions and implications

---

**Decision Date:** April 24, 2026  
**Status:** All questions answered and documented  
**Ready for:** Developer agent implementation  
**Next Review:** After Phase 1 verification (60 min)
