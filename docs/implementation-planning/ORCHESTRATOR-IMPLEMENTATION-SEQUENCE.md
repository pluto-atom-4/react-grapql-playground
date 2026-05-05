# Orchestrator Implementation Sequence Report
## Issues #33, #207, #208, #209 — FileUploader → SubmitTestRunForm → Details Panel → Polling

**Report Date:** April 2026  
**Status:** Ready for Implementation  
**Target Release:** Week of April 21–25, 2026  
**Audience:** Development Team, Tech Lead, Project Manager

---

## Executive Summary

This document provides the **definitive implementation sequence** and orchestration plan extracted from the Master Plan (`ISSUE-33-207-208-209-MASTER-PLAN.md`). It confirms the correct order, dependencies, and parallelization strategy to deliver four coordinated GitHub issues on schedule.

**Key Finding:** Issue #33 (FileUploader) is the critical foundation. Must complete before any other work begins.

---

## Implementation Order & Dependencies

### 📊 Dependency Graph

```
Week 1:
┌─────────────────────────────────────────────┐
│ Issue #33: FileUploader (FOUNDATION)        │  ← MUST START HERE
│ • 8–10 hours                                │
│ • Drag-drop, file validation, upload logic  │
│ • Blocker for all downstream work           │
└─────────────────────────────────────────────┘
                    ↓ (completion triggers Week 2)
Week 2:
┌─────────────────────────────────────────────┐
│ Issue #207: SubmitTestRunForm               │  ← INTEGRATES #33
│ • 6–8 hours                                 │
│ • Form fields, mutation, optimistic update  │
│ • Integrates FileUploader as child          │
└─────────────────────────────────────────────┘
              ↙           ↖
        (after #207 complete, start Week 2–3)
    /                               \
┌────────────────┐         ┌─────────────────────┐
│ Issue #208:    │         │ Issue #209:         │ ← CAN PARALLELIZE
│ Details Panel  │         │ Polling Hook        │
│ • 5–6 hours    │         │ • 4–5 hours         │
│ • Display info │         │ • Auto-detect RUNNING
│ • Download     │         │ • Smart polling     │
└────────────────┘         └─────────────────────┘
    ↓                           ↓
    (both feed into BuildDetailModal)
        ↓
Week 3:
┌─────────────────────────────────────────────┐
│ Integration & E2E Testing                   │
│ • All 4 components wired in modal           │
│ • Full flow: upload → submit → poll → view  │
│ • Load testing (100+ testRuns)              │
└─────────────────────────────────────────────┘
```

---

## Sequential Implementation Plan

### PHASE 1: Week 1 (Week of April 15)

#### **Issue #33: FileUploader Component** ⭐ **START HERE**

**Status:** Blocker for all downstream work  
**Effort:** 8–10 hours  
**Deliverable:** Functional FileUploader component, fully tested, ready for integration

**Why This First:**
- Issue #207 (SubmitTestRunForm) imports and uses FileUploader as a child component
- Cannot test SubmitTestRunForm without a working FileUploader
- Risk: 3-day delay if FileUploader not ready before #207 starts
- Foundation: All file handling logic lives here; form just calls callbacks

**Detailed Plan:** See `ISSUE-33-DETAILED-PLAN.md` (916 lines, production-ready)

**Task Breakdown:**
1. ✅ Create component skeleton with TypeScript interfaces (0.5h)
2. ✅ Build drag-and-drop UI with Tailwind CSS (1h)
3. ✅ Implement file validation (MIME type, size, extension) (0.75h)
4. ✅ Wire FormData + fetch to Express `/upload` endpoint (1.5h)
5. ✅ Add XMLHttpRequest progress tracking (1h)
6. ✅ Implement error handling + retry UI (1.5h)
7. ✅ Write unit tests (1h)
8. ✅ Write integration tests with mocked API (0.75h)
9. ✅ Documentation + JSDoc (0.5h)
10. ✅ ESLint/Prettier pass + final review (0.5h)

**Definition of Done:**
- [ ] Component renders with drag-drop zone
- [ ] File validation works (MIME, size, extension)
- [ ] Upload progress shows 0–100%
- [ ] Error messages match spec (5 error cases)
- [ ] Retry button works
- [ ] All unit + integration tests passing (80%+ coverage)
- [ ] No console warnings/errors
- [ ] ESLint + Prettier ✅
- [ ] TypeScript strict mode ✅

**Acceptance Criteria:** See ISSUE-33-DETAILED-PLAN.md (40+ items)

---

### PHASE 2: Week 2 (Week of April 21)

#### **Issue #207: SubmitTestRunForm Component** ⭐ **DEPENDS ON #33**

**Status:** Parent issue, integrates FileUploader  
**Effort:** 6–8 hours  
**Deliverable:** Form fully functional with file upload, mutation, optimistic updates

**Why After #33:**
- SubmitTestRunForm imports FileUploader: `import FileUploader from '../file-uploader'`
- Cannot write meaningful tests without FileUploader working
- Form logic depends on FileUploader callbacks (onUploadSuccess, onUploadError)

**Task Breakdown:**
1. ✅ Create form component skeleton (0.5h)
2. ✅ Add form fields: testResult, notes (0.75h)
3. ✅ Integrate FileUploader component (1h)
4. ✅ Wire useSubmitTestRun mutation (1.5h)
5. ✅ Implement optimistic response (1h)
6. ✅ Add error handling + validation (1h)
7. ✅ Write tests with MockedProvider (1.5h)
8. ✅ Documentation (0.5h)

**Definition of Done:**
- [ ] Form renders all fields
- [ ] FileUploader child renders and works
- [ ] Submit button disabled until file + testResult ready
- [ ] Mutation fires with correct variables
- [ ] Optimistic UI update applies immediately
- [ ] Error handling shows toast/alert
- [ ] All tests passing (80%+ coverage)
- [ ] ESLint + Prettier ✅

**Blocks:** Nothing (successor is #208 & #209)

**Unblocks:** #208, #209 ready to start

---

### PHASE 2–3: Week 2–3 (Can Parallelize)

#### **Issue #208: TestRunDetailsPanel Component** ⭐ **PARALLELIZABLE**

**Status:** Display component for test results  
**Effort:** 5–6 hours  
**Deliverable:** Panel displays TestRun details, download link functional

**Why After #207:**
- Receives TestRun object via props (from SubmitTestRunForm's mutation result)
- Can start immediately after #207 complete (does not depend on #207 code)
- Can work in parallel with #209

**Task Breakdown:**
1. ✅ Create panel component (0.5h)
2. ✅ Display TestRun fields (status, result, dates, notes) (1h)
3. ✅ Add file download section (1h)
4. ✅ Style responsive layout (desktop/mobile) (1.5h)
5. ✅ Write tests (1.5h)
6. ✅ Documentation (0.5h)

**Definition of Done:**
- [ ] Panel displays all TestRun fields
- [ ] File download link works
- [ ] Status/result badges color-coded
- [ ] Responsive on mobile/desktop
- [ ] Tests passing (80%+ coverage)
- [ ] ESLint + Prettier ✅

---

#### **Issue #209: useTestRuns Polling Hook** ⭐ **PARALLELIZABLE**

**Status:** Real-time polling hook  
**Effort:** 4–5 hours  
**Deliverable:** Hook auto-detects RUNNING status, enables 2s polling

**Why After #207:**
- Uses GetTestRuns query (which references TestRun type from #207)
- Does not depend on #207 code; starts after #207's schema is confirmed
- Can work in parallel with #208

**Task Breakdown:**
1. ✅ Create hook skeleton (0.5h)
2. ✅ Implement GetTestRuns query (0.5h)
3. ✅ Wire useQuery + polling logic (1.5h)
4. ✅ Auto-detect RUNNING status → enable polling (1h)
5. ✅ Write tests: polling, refetch, cleanup (1.5h)
6. ✅ Documentation (0.5h)

**Definition of Done:**
- [ ] Hook fetches testRuns correctly
- [ ] Polling starts when any testRun has status = RUNNING
- [ ] Polling stops when no RUNNING status
- [ ] Manual refetch works
- [ ] Cleanup prevents memory leaks
- [ ] Tests passing (80%+ coverage)
- [ ] ESLint + Prettier ✅

---

### PHASE 3: Week 3 (After Phases 1–2)

#### **Integration & E2E Testing**

**Status:** Final assembly and validation  
**Effort:** 2–3 hours  
**Deliverable:** All 4 components wired in BuildDetailModal, full flow working

**Task Breakdown:**
1. ✅ Wire all 4 components in BuildDetailModal (1h)
2. ✅ Test full flow: open modal → submit test → poll → view details (1h)
3. ✅ Verify cache updates, optimistic UX (0.5h)
4. ✅ Load testing (100+ testRuns) (0.5h)
5. ✅ Manual browser testing (0.5h)

**Definition of Done:**
- [ ] Full feature working end-to-end
- [ ] No console errors
- [ ] Performance acceptable (< 500ms load time)
- [ ] Cache strategy working
- [ ] All tests passing

---

## Effort Summary

| Issue | Title | Hours | Week | Status |
|-------|-------|-------|------|--------|
| #33 | FileUploader | 8–10 | 1 | ⭐ BLOCKER |
| #207 | SubmitTestRunForm | 6–8 | 2 | Depends on #33 |
| #208 | TestRunDetailsPanel | 5–6 | 2–3 | Parallel after #207 |
| #209 | useTestRuns Polling | 4–5 | 2–3 | Parallel after #207 |
| **Total** | **Integration & E2E** | **2–3** | **3** | **Final assembly** |
| | | **25–32h** | **3 weeks** | **On schedule** |

---

## Why This Order Matters

### Critical Path Analysis

**Must Start with #33 (FileUploader):**
- ✅ No dependencies within this set of 4 issues
- ✅ Takes longest (8–10h)
- ✅ Blocks #207 (6–8h)
- ✅ Critical path = #33 → #207 = 14–18 hours minimum
- ✅ If #33 delayed by 1 day, entire release slips by 1 day

**Why Not Start With #207 or #209:**
- ❌ #207 imports FileUploader; cannot test without working #33
- ❌ #209 needs stable GraphQL schema confirmed in #207
- ❌ Starting #207 first risks rework if FileUploader issues emerge
- ❌ Creates bottleneck instead of parallelization opportunity

**Why Parallelize #208 & #209:**
- ✅ Both independent after #207 confirms GraphQL contract
- ✅ Different developers can work simultaneously
- ✅ Saves 5–6 hours of sequential time
- ✅ Enables "pipelining" for Week 3 integration

---

## Integration Points

### Issue #33 → Issue #207

**How They Connect:**
```typescript
// SubmitTestRunForm imports FileUploader
import FileUploader from '../file-uploader';

// Passes callbacks
<FileUploader
  onUploadSuccess={(fileUrl, fileName) => {
    setUploadedFileUrl(fileUrl);
    setUploadedFileName(fileName);
  }}
  onUploadError={(error) => showErrorToast(error)}
/>
```

**Dependency Detail:**
- FileUploader provides `fileUrl` string
- SubmitTestRunForm passes `fileUrl` to mutation
- Cannot test SubmitTestRunForm without FileUploader working

---

### Issue #207 → Issues #208 & #209

**How They Connect:**
```typescript
// BuildDetailModal orchestrates all 3
const { data: testRuns } = useTestRuns(buildId); // #209 hook

<SubmitTestRunForm onSuccess={() => refetch()} /> // #207

{testRuns?.map(tr => (
  <TestRunRow 
    onClick={() => setSelectedTestRun(tr)} // opens #208
  />
))}

{selectedTestRun && (
  <TestRunDetailsPanel testRun={selectedTestRun} /> // #208
)}
```

**Dependency Detail:**
- Both #208 & #209 receive data from BuildDetailModal (parent)
- #208 displays TestRun props (from #209's query)
- #209 provides refetch trigger (on #207 submission)
- Can develop in parallel once #207 GraphQL contract confirmed

---

## Risk Mitigation

### High Risk: FileUploader Delays

**Impact:** 3+ days (cascades to #207, then #208/#209)

**Mitigation:**
- ✅ Detailed plan provided (916 lines, no ambiguity)
- ✅ TypeScript interfaces ready to copy-paste
- ✅ Test templates included (reduces rework)
- ✅ Daily standup to catch blockers early

### Medium Risk: GraphQL Schema Mismatch

**Impact:** #207 needs correct schema; #208/#209 depend on it

**Mitigation:**
- ✅ Schema provided in Master Plan (copy-paste ready)
- ✅ GraphQL Code Generator auto-generates types
- ✅ Backend API already exists (verified in prep)

### Low Risk: Integration Issues Week 3

**Impact:** 1–2 days if full flow doesn't work

**Mitigation:**
- ✅ Each component tested independently (80%+ coverage)
- ✅ Integration test plan in master plan
- ✅ Cache strategy documented
- ✅ E2E tests catch integration issues early

---

## Recommended Team Structure

**Week 1 (FileUploader):**
- 1 Developer (full-time on #33)
- Tech Lead (code review, architecture decisions)

**Week 2 (SubmitTestRunForm + Parallelization):**
- Developer 1: #207 (SubmitTestRunForm) — sequential after #33
- Developer 2: #208 (TestRunDetailsPanel) — parallel
- Developer 3: #209 (Polling Hook) — parallel
- Tech Lead: Oversees integration, resolves blockers

**Week 3 (Integration):**
- All 3 developers: Final integration, E2E testing, load testing
- Tech Lead: Final code review, release prep

---

## Next Steps (Immediate Actions)

### ✅ Step 1: Confirm Sequence (You are here)
- [x] Master Plan analyzed
- [x] Dependencies extracted
- [x] Implementation order determined: **#33 → #207 → (#208 || #209) → Integration**
- [x] Orchestrator Report created

### ⏭️ Step 2: Assign Developer to #33
- [ ] Tech Lead confirms developer available full-time Week 1
- [ ] Developer reads `ISSUE-33-DETAILED-PLAN.md` (20 mins)
- [ ] Developer sets up project locally (30 mins)
- [ ] Developer starts Task 1 (component skeleton)
- [ ] Daily standups for progress tracking

### ⏭️ Step 3: Prepare Week 2 Team
- [ ] Developer 2 reviews `ISSUE-208-DETAILED-PLAN.md` (to be created)
- [ ] Developer 3 reviews `ISSUE-209-DETAILED-PLAN.md` (to be created)
- [ ] Assign code reviewers (Tech Lead + peer)
- [ ] Schedule daily standups

### ⏭️ Step 4: Prepare Backend Verification
- [ ] Verify Express `/upload` endpoint exists and works
- [ ] Verify GraphQL schema for TestRun, GetTestRuns, SubmitTestRun
- [ ] Run `pnpm dev` to confirm all services running
- [ ] Test Express endpoint with curl

### ⏭️ Step 5: Monitor Critical Path
- [ ] Track #33 completion daily
- [ ] If #33 at risk, escalate immediately
- [ ] Issue #207 cannot start until #33 complete
- [ ] Issue #208/#209 can start after #207 GraphQL contract confirmed

---

## Success Metrics (Definition of Done for Full Feature)

**Week 1:**
- [ ] Issue #33 complete, all tests passing, code reviewed
- [ ] FileUploader working in isolation, ready for integration
- [ ] Zero blockers preventing Week 2 start

**Week 2:**
- [ ] Issue #207 complete, FileUploader integration verified
- [ ] Issues #208 & #209 complete, parallel development working
- [ ] All components tested independently (80%+ coverage)

**Week 3:**
- [ ] All 4 issues integrated in BuildDetailModal
- [ ] Full end-to-end flow working: upload → submit → poll → view
- [ ] Load testing complete (100+ testRuns)
- [ ] Manual browser testing ✅
- [ ] Release ready for production

---

## Approval & Sign-Off

**Orchestrator Report Status:** ✅ Ready for Implementation

**Recommended Next Action:** Assign Developer to Issue #33, start with `ISSUE-33-DETAILED-PLAN.md`

**Master Plan Reference:** `/home/pluto-atom-4/Documents/stoke-full-stack/react-grapql-playground/docs/implementation-planning/ISSUE-33-207-208-209-MASTER-PLAN.md`

**Detailed Plans Created:**
- ✅ `ISSUE-33-DETAILED-PLAN.md` (916 lines)
- ⏭️ `ISSUE-207-DETAILED-PLAN.md` (to be created after #33 complete)
- ⏭️ `ISSUE-208-DETAILED-PLAN.md` (can start Week 2)
- ⏭️ `ISSUE-209-DETAILED-PLAN.md` (can start Week 2)

---

**Document Status:** Ready for Implementation  
**Created:** April 2026  
**Target Release:** Week of April 21–25, 2026  
**Author:** Orchestrator Agent  
**Distribution:** Development Team, Tech Lead, Project Manager
