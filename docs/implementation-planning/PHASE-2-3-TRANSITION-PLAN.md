# PHASE 2-3 TRANSITION PLAN
## Pre-Phase-3 Execution Blueprint

**Document Status:** Ready for Implementation  
**Target Timeline:** Issues #256 + #295 complete before #261  
**Last Updated:** [Session Start]  
**Audience:** Development Team, Project Orchestrator  

---

## EXECUTIVE SUMMARY

This document outlines the **critical pre-Phase-3 foundation work** required to unlock Phase 3 full execution. Issues #256 and #295 represent two independent but complementary workstreams that must complete **before** Issue #261 (responsive table redesign) can proceed effectively.

### Key Insight
- **Issue #256** (Hover & Focus Interactive States) establishes **foundational micro-interactions** across all components
- **Issue #295** (Tab Integration in Modal) delivers **core modal UX architecture** with proper data flow patterns
- **Issue #261** (Responsive Table Redesign) **depends on both** foundational layers to implement cards properly

### Why Sequential Completion Matters
1. Interactive states (#256) ensure consistent hover/focus behavior across table cards (#261)
2. Tab integration (#295) establishes proper data-passing patterns for modal context
3. Responsive tables (#261) can then use clean, accessible card layouts with proper states

**Impact**: 12-20% UX efficiency gains across all user personas (technician, engineer, QA, manager)

---

## DEPENDENCY ANALYSIS

### Issue #256: Interactive States & Micro-interactions - Hover & Focus

**Status:** Phase 1 Visual Polish (Open)  
**Effort:** Small to Medium (8-12 hours)  
**Components Affected:**
- `frontend/components/Button.tsx`
- `frontend/components/BuildTable.tsx`
- `frontend/components/Form*.tsx` (all form components)

#### What It Delivers
- ✅ Button hover states (color shift, shadow depth)
- ✅ Focus ring styling for all interactive elements
- ✅ Form input focus states (visible indicators)
- ✅ Table row hover effects
- ✅ Smooth transition animations throughout UI
- ✅ Logical tab focus order with accessibility

#### Acceptance Criteria
```
□ Button hover states implemented (color shift, shadow depth)
□ Focus ring styling applied to all interactive elements
□ Form input focus states clearly visible
□ Table row hover effects working
□ Smooth transition animations throughout UI
□ Tab focus order logical and accessible
□ Micro-interactions feel responsive without being jarring
□ Unit tests cover all interactive states
```

#### Why It Matters for Phase 3
- **Foundation for Cards**: Responsive tables (#261) will render as cards on mobile—these cards need consistent hover/focus states
- **Accessibility Gate**: Tab integration (#295) requires proper focus management; #256 establishes focus ring conventions
- **User Feedback Loop**: Micro-interactions make modal interactions (#295) feel polished

#### Implementation Notes
- Use Tailwind transitions (`transition-all duration-200`)
- Ensure focus rings meet WCAG AAA (3:1 contrast minimum)
- Test keyboard navigation extensively
- Apply changes consistently across table rows that will become cards

---

### Issue #295: Phase 3 Tab Integration in BuildDetailModal

**Status:** Phase 3 Modal Architecture (Open)  
**Effort:** Medium (11-day timeline)  
**Key Reference:** `docs/design-review/PRODUCT-REVIEW-TABS.md`

#### What It Delivers
The **production-ready Tab component system** currently unused in BuildDetailModal. This issue integrates tabs into the modal and standardizes data flow across the application.

**Components to Refactor:**
- `frontend/components/BuildDetailModal.tsx` (main)
- `frontend/components/Tabs.tsx` (integration point)
- `frontend/components/BuildOverviewTab.tsx` (data flow)
- `frontend/components/BuildPartsTab.tsx` (data flow)
- `frontend/components/BuildTestRunsTab.tsx` (data flow)
- `frontend/components/BuildHistoryTab.tsx` (data flow)

#### Acceptance Criteria

**Tab Integration in Modal:**
```
□ Refactor BuildDetailModal to use Tabs component instead of flat layout
□ Organize sections into tabbed interface: Overview → Parts → Tests → History
□ Implement lazy loading (render only active tab to reduce DOM)
□ Verify keyboard navigation works end-to-end (arrow keys, Home/End)
```

**Standardize Data Flow (Props-Based):**
```
□ Convert tab components from hook-based to prop-based pattern
□ Move useActivityFeed, useTestRuns to parent (BuildDetailModal)
□ Pass data down as props: events, isLoading, testRuns, etc.
□ Better testability, reusability, SSR support
```

**Complete Interaction Handlers:**
```
□ BuildOverviewTab: Implement "Edit Build" form modal + "View Details" link
□ BuildPartsTab: Implement inline quantity editor + part detail drill-down
□ BuildTestRunsTab: Implement "View" button + result filtering (pass/fail)
□ BuildHistoryTab: Implement event type filtering + date range picker
```

**Real-Time Event Integration:**
```
□ Connect BuildDetailModal to Express Event Bus via SSE
□ Update tabs when events arrive (buildStatusChanged, testRunSubmitted, etc.)
□ Refresh Apollo cache automatically (no polling needed)
```

**Error Resilience:**
```
□ Add error boundaries per tab (failures don't crash entire modal)
□ Implement retry logic for failed data loads
□ Surface errors to user with fallback UI
```

**Testing & Accessibility:**
```
□ Unit tests for each tab component (95%+ coverage)
□ Integration tests for modal + tabs keyboard navigation
□ Screen reader testing (NVDA/JAWS compatibility)
□ Automated accessibility audit (axe, Lighthouse)
```

#### 11-Day Implementation Timeline

**Week 1: Foundation (4 days)**
- **Days 1-2:** Refactor BuildDetailModal to use Tabs component
  - Move sections into tab content
  - Wire up tab selection state
  - Verify keyboard nav works
- **Days 2-3:** Implement lazy loading + error boundaries
  - Set `lazy={true}` in Tabs component
  - Add error boundary per tab
  - Test resilience
- **Days 3-4:** Update existing tests for new structure

**Week 2: Data Flow (4 days)**
- **Days 5-6:** Convert tab components to prop-based
  - Remove hook calls
  - Update parent to fetch all data
  - Pass down via props
- **Days 6-7:** Write integration tests
  - Keyboard nav test suite
  - Accessibility audit
- **Days 7-8:** Real-time integration
  - Connect to Express Event Bus
  - Update Apollo cache on events

**Week 3: UX Enhancements (3 days)**
- **Day 9:** Implement interaction handlers
  - "Edit Build" form modal
  - Part detail drill-down
  - Test result filtering
- **Day 10:** Mobile optimizations + final testing
  - Tab bar visual indicators
  - Touch target sizing verification
- **Day 11:** Performance baseline + launch readiness
  - Measure modal load time
  - Monitor tab switch latency
  - User feedback collection

#### Why It Matters for Phase 3
- **Modal Architecture Foundation**: Establishes the tabbed interface pattern used across Phase 3
- **Data Flow Standard**: Sets prop-based pattern that responsive cards (#261) will inherit
- **Real-Time Integration**: Event Bus connection enables live updates in cards
- **Accessibility Baseline**: WCAG AA compliance becomes standard for all Phase 3 work

#### Product Value
From `PRODUCT-REVIEW-TABS.md`:
- **Technician:** 80% faster (2-3 min → 30 sec to start new build via tab switching)
- **Engineer:** 85% faster (30 min → 5 min to debug failed build with organized tabs)
- **QA:** 87% faster (15 min → 2 min to validate test coverage with tab + filter)
- **Manager:** 90% faster (10 min → 1 min to monitor progress with real-time tabs)
- **Overall:** 12-20% UX efficiency gain

---

### Issue #261: Responsive Table Redesign - Mobile Card Layout

**Status:** Phase 3 Mobile Optimization (Open)  
**Effort:** Small to Medium (8-12 hours)  
**Depends On:** Issues #256 + #295

#### What It Requires from Predecessors

**From Issue #256 (Interactive States):**
- ✅ Hover effects for cards (cards need hover states like table rows)
- ✅ Focus ring styling (cards need accessible focus indicators)
- ✅ Smooth transitions (card expand/collapse animations)

**From Issue #295 (Tab Integration):**
- ✅ Data flow patterns established in parent components
- ✅ Standardized error handling patterns
- ✅ Modal context + interaction handlers
- ✅ Real-time event integration (cards need live updates)

#### Acceptance Criteria
```
□ Responsive breakpoints defined (sm: 640px, md: 1024px, lg: 1280px)
□ Desktop: table view with all columns
□ Tablet (640-1024px): 2-column card grid
□ Mobile (<640px): single column card stack
□ Card header shows build name and status
□ Card body displays key properties
□ Swipe actions for table rows (optional)
□ Touch targets minimum 48px
□ Tested on real mobile devices
```

#### Components to Create/Modify
- `frontend/components/BuildTable.tsx` (refactor)
- `frontend/components/BuildCard.tsx` (new)

#### Why It Can't Proceed Before #256 + #295

1. **Interactive States Dependency** (#256)
   - Cards need consistent hover/focus behavior
   - Focus ring styling must match modal context
   - Transitions must align with #295 modal patterns

2. **Data Flow Dependency** (#295)
   - Cards inherit prop-based data flow from tabs
   - Error boundaries follow #295 pattern
   - Real-time updates use established Event Bus connection

3. **Architecture Dependency**
   - Modal context (BuildDetailModal from #295) needs to know about card selections
   - Cards need to trigger same handlers as table rows
   - Responsive layout needs clean separation between card and modal concerns

---

## DEPENDENCY FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                       PHASE 2-3 TRANSITION                      │
└─────────────────────────────────────────────────────────────────┘

                     PARALLEL WORKSTREAMS (Days 1-12)

┌──────────────────────────┐      ┌──────────────────────────────┐
│   ISSUE #256             │      │   ISSUE #295                 │
│   Interactive States     │      │   Tab Integration            │
│   (8-12 hours)           │      │   (11 days)                  │
├──────────────────────────┤      ├──────────────────────────────┤
│ Deliverables:            │      │ Deliverables:                │
│ • Hover states           │      │ • Modal→Tabs refactor        │
│ • Focus rings            │      │ • Prop-based data flow       │
│ • Transitions            │      │ • Error boundaries           │
│ • Tab focus order        │      │ • Real-time integration      │
│ • Tests (interactive)    │      │ • Tests (integration)        │
│                          │      │ • Accessibility audit        │
│ Components:              │      │ Components:                  │
│ • Button.tsx             │      │ • BuildDetailModal.tsx       │
│ • BuildTable.tsx         │      │ • Tabs.tsx                   │
│ • Form*.tsx              │      │ • BuildOverviewTab.tsx       │
│                          │      │ • BuildPartsTab.tsx          │
│                          │      │ • BuildTestRunsTab.tsx       │
│                          │      │ • BuildHistoryTab.tsx        │
└──────────────────────────┘      └──────────────────────────────┘
         │ Completes                        │ Completes
         │ Foundation                       │ Foundation
         └────────────────┬─────────────────┘
                          │
                   GATES UNBLOCK:
                   • Focus management pattern ✓
                   • Hover/transition styles ✓
                   • Data flow standardization ✓
                   • Real-time integration ✓
                   • Error handling pattern ✓
                          │
                          ↓
         ┌──────────────────────────────┐
         │   ISSUE #261                 │
         │   Responsive Table Redesign  │
         │   (8-12 hours)               │
         ├──────────────────────────────┤
         │ Deliverables:                │
         │ • Card layout (responsive)   │
         │ • Hover/focus (from #256)    │
         │ • Data flow (from #295)      │
         │ • Real-time updates (from#295)
         │ • Touch optimization         │
         │ Components:                  │
         │ • BuildTable.tsx (refactor)  │
         │ • BuildCard.tsx (new)        │
         └──────────────────────────────┘
```

---

## PARALLEL EXECUTION STRATEGY

### Can #256 and #295 Run in Parallel?

**YES - Fully Independent**

| Aspect | #256 | #295 | Overlap? |
|--------|------|------|----------|
| **Components Modified** | Button, BuildTable, Form* | BuildDetailModal, Tabs, Build*Tab | ❌ None |
| **Test Files** | Interactive state tests | Modal + tab integration tests | ❌ None |
| **Dependencies** | Tailwind, Vitest | Apollo, GraphQL, Express Event Bus | ❌ None |
| **Team Allocation** | Frontend (UI/UX specialist) | Frontend (Architecture lead) | ❌ Can be different people |
| **Branch Conflicts** | Unlikely | Unlikely | ❌ None expected |
| **Merge Strategy** | Feature branch → main | Feature branch → main | ✅ Sequential is fine |

### Parallel Execution Timeline

```
Day 1-12: Run #256 and #295 in parallel
├── #256: Developer A works on interactive states
│   ├── Day 1-2: Button + Form focus states
│   ├── Day 3-4: Table row hover + transitions
│   ├── Day 5-6: Testing + refinement
│   └── Day 7: QA sign-off
│
└── #295: Developer B works on tab integration
    ├── Day 1-4: Modal refactor + tab integration
    ├── Day 5-8: Data flow standardization + tests
    ├── Day 9-11: Interaction handlers + real-time integration
    └── Day 12: QA sign-off + accessibility audit

Day 13: Both complete, gate #261
Day 14-25: #261 Responsive table redesign (uses both foundations)
```

### Why Parallel Execution is Safe
1. **No File Overlap**: Different components, different test files
2. **No Dependency Overlap**: #256 doesn't use tabs; #295 doesn't use interactive states
3. **Merge Order Doesn't Matter**: PR #256 merges before #295 (or vice versa) with no conflicts
4. **Independent Validation**: Each can be QA'd independently

---

## SEQUENTIAL EXECUTION PATH (If Parallel Not Feasible)

If team bandwidth requires sequential execution:

```
Phase 2-3 Transition Timeline (Sequential)
═══════════════════════════════════════════

Days 1-12: Issue #256 (Interactive States)
├── Create feature branch: feat/issue-256-interactive-states
├── Day 1-2: Button hover + focus states
├── Day 3-4: Form inputs + table row hover
├── Day 5-6: Transitions + tab focus order
├── Day 7-8: Unit tests for all interactive states
├── Day 9: QA testing
├── Day 10: Code review + refinements
├── Day 11: Final QA sign-off
└── Day 12: Merge to main

Days 13-24: Issue #295 (Tab Integration)
├── Create feature branch: feat/issue-295-tab-integration
├── Day 13-14: BuildDetailModal refactor (flat → tabs)
├── Day 15-16: Tab content components setup + lazy loading
├── Day 17-18: Data flow standardization (hook → props)
├── Day 19-20: Error boundaries + resilience
├── Day 21-22: Real-time Event Bus integration
├── Day 23: Integration tests + accessibility audit
├── Day 24: Merge to main

Days 25-36: Issue #261 (Responsive Table)
├── Create feature branch: feat/issue-261-responsive-table
├── Day 25-26: BuildCard component creation
├── Day 27-28: Responsive breakpoints + layout
├── Day 29-30: Hover/focus states (using #256 patterns)
├── Day 31-32: Data flow (using #295 patterns)
├── Day 33: Mobile device testing
├── Day 34: Accessibility testing
├── Day 35: QA sign-off
└── Day 36: Merge to main
```

---

## SUCCESS CRITERIA & VALIDATION GATES

### Issue #256 Success Gate

**Pre-Merge Checklist:**
```
Code Quality:
□ All unit tests pass (npm run test:frontend)
□ ESLint passes (npm run lint)
□ No TypeScript errors (npm run type-check)
□ Code review approved

Functionality:
□ Button states: hover, active, disabled, focus
□ Form inputs: focus rings visible, transitions smooth
□ Table rows: hover effect + keyboard navigation
□ Focus order: logical tab sequence (can verify with Tab key)

Accessibility:
□ Focus rings meet WCAG AAA (4.5:1 contrast)
□ Transitions don't flash (< 3 Hz)
□ Screen reader announces focus state changes
□ Keyboard navigation works without mouse

Performance:
□ Transition animations smooth (60 FPS)
□ No layout shift on focus (use outline, not box-shadow)
□ Bundle size impact < 5KB

Cross-Browser:
□ Chrome ✓
□ Firefox ✓
□ Safari ✓
□ Edge ✓
```

### Issue #295 Success Gate

**Pre-Merge Checklist:**
```
Code Quality:
□ All unit tests pass (npm run test:frontend)
□ Integration tests pass (modal + tabs together)
□ ESLint passes (npm run lint)
□ No TypeScript errors (npm run type-check)
□ Code review approved

Functionality:
□ BuildDetailModal renders with tab interface
□ Tab selection works (keyboard + mouse)
□ Lazy loading active (verify DOM size < original)
□ All interaction handlers implemented
□ Real-time events update tab content

Data Flow:
□ Tab components receive props (no internal useActivityFeed calls)
□ Parent passes: events, loading, testRuns, onEdit, etc.
□ Error boundaries catch tab-level errors
□ Apollo cache updates on SSE events

Accessibility:
□ Keyboard nav: arrow keys, Home/End, Escape
□ Screen reader: announces active tab, panel role
□ Focus management: focus stays in tab on modal open
□ WCAG AA audit passes (axe, Lighthouse)

Performance:
□ Modal load time < 500ms
□ Tab switch latency < 100ms
□ Lazy loading reduces DOM by 30-40%
□ No memory leaks (Event Listener cleanup)

Real-Time Integration:
□ SSE connection works (curl -N http://localhost:5000/events)
□ Events trigger cache updates
□ No polling needed (Event Bus does updates)
```

### Issue #261 Success Gate

**Pre-Merge Checklist:**
```
Code Quality:
□ All unit tests pass (npm run test:frontend)
□ ESLint passes (npm run lint)
□ No TypeScript errors (npm run type-check)
□ Code review approved

Responsive Design:
□ Desktop (>1024px): table view ✓
□ Tablet (640-1024px): 2-column grid ✓
□ Mobile (<640px): single column ✓
□ Breakpoints match Tailwind (sm, md, lg)

Card Component:
□ BuildCard.tsx implemented
□ Card header: build name + status
□ Card body: key properties visible
□ Hover effects work (from #256 patterns)
□ Focus ring visible (from #256 patterns)

Touch Targets:
□ All clickable elements >= 48px (CSS min-height/width)
□ Swipe actions tested (if implemented)
□ Touch scrolling works smoothly

Mobile Device Testing:
□ iOS 12+ tested ✓
□ Android 5+ tested ✓
□ Tablets tested ✓
□ Real device testing (not just browser emulation)

Accessibility:
□ Focus visible on card elements
□ Screen reader announces card content
□ WCAG AA audit passes

Performance:
□ Card render time < 50ms per card
□ No layout shift on load
□ Images optimized (use Next.js Image)
```

---

## INTEGRATION POINTS WITH PHASE 3

### How #256 Enables Phase 3

**Interactive States Foundation:**
- All Phase 3 components inherit hover/focus behavior
- Modal interactions feel polished
- Cards respond to user input immediately
- Accessible focus management across all UI

### How #295 Enables Phase 3

**Modal Architecture Pattern:**
- `BuildDetailModal` becomes orchestration template
- Tab integration pattern used for other modals
- Data flow (props-based) standard for Phase 3 components
- Real-time Event Bus integration active for live updates
- Error boundaries prevent modal crashes

### How #261 Integrates with Phase 3

**Mobile-First Delivery:**
- Responsive table pattern applied to other data grids
- Card layout used in Phase 3 list views
- Touch optimization baseline for mobile phase
- Completes Phase 3 Mobile Optimization (from UX review)

---

## WORKSTREAM ALLOCATION

### Recommended Team Structure

**Workstream A: Issue #256 (Interactive States)**
- **Primary Dev**: Frontend UI/UX specialist
- **Skills Needed**: CSS/Tailwind, Vitest, accessibility
- **Time Commitment**: 8-12 hours (1-2 days focused work)
- **Dependencies**: None (can start immediately)

**Workstream B: Issue #295 (Tab Integration)**
- **Primary Dev**: Frontend architecture/lead engineer
- **Skills Needed**: React, TypeScript, Apollo Client, real-time data, testing
- **Time Commitment**: 11 days (distributed 2-3 days/week or 1-2 weeks intensive)
- **Dependencies**: Tab component production-ready (verify in code)

**Workstream C: Issue #261 (Responsive Table)**
- **Primary Dev**: Frontend developer (can start after #256 + #295)
- **Skills Needed**: Responsive design, CSS Grid/Flex, mobile UX
- **Time Commitment**: 8-12 hours (1-2 days, after gating workstreams)
- **Dependencies**: #256 + #295 must be merged to main first

### Parallel Execution Recommendation
- **Best Case**: Allocate separate devs to #256 and #295 (days 1-12 parallel)
- **Fallback**: Run sequentially if team unavailable (days 1-36 sequential)
- **Risk Mitigation**: Ensure #261 dev is available after gating workstreams complete

---

## RISK ASSESSMENT & MITIGATIONS

### Risk 1: Tab Component Not Production-Ready
**Severity:** Medium | **Probability:** Low

**Symptoms:**
- Tab keyboard nav broken (arrow keys, Home/End)
- Lazy loading doesn't render child components
- ARIA attributes missing

**Mitigation:**
- [ ] QA Tab component thoroughly before starting #295
- [ ] Create test file: `frontend/components/__tests__/Tabs.test.tsx`
- [ ] Verify keyboard nav works in actual screen reader (NVDA/JAWS)
- [ ] Check ARIA attributes: `role="tablist"`, `role="tab"`, `role="tabpanel"`

### Risk 2: Real-Time Event Bus Not Connected
**Severity:** High | **Probability:** Medium

**Symptoms:**
- Tab content doesn't update when events arrive
- Manual refresh needed (SSE not working)
- Event connection fails silently

**Mitigation:**
- [ ] Verify Express Event Bus running: `curl -N http://localhost:5000/events`
- [ ] Create integration test with mock SSE
- [ ] Add logging: `console.log('[SSE Event]', event)`
- [ ] Fallback: Implement polling as backup until SSE stable

### Risk 3: Data Flow Refactor Breaks Existing Queries
**Severity:** Medium | **Probability:** Medium

**Symptoms:**
- BuildDetailModal doesn't load build data
- Tab components render with undefined props
- Apollo cache queries fail

**Mitigation:**
- [ ] Run existing tests first: `npm run test:frontend`
- [ ] Use `MockedProvider` in tests (already set up)
- [ ] Verify Apollo cache with DevTools browser extension
- [ ] Create before/after snapshot tests

### Risk 4: Merge Conflicts Between #256 and #295
**Severity:** Low | **Probability:** Low (different components)

**Symptoms:**
- Git merge shows conflicts in BuildTable.tsx or other files
- Manual conflict resolution needed

**Mitigation:**
- [ ] Coordinate merge order: #256 → main, then #295 rebases on main
- [ ] Use `git rebase origin/main` to keep commits clean
- [ ] Merge shorter branch first (#256, 8-12 hours vs. #295, 11 days)

### Risk 5: Responsive Table Implementation Blocks On Missing Foundations
**Severity:** High | **Probability:** Medium

**Symptoms:**
- #261 dev can't implement cards without hover/focus styles
- Data flow patterns unclear from #295

**Mitigation:**
- [ ] Document #256 hover/focus patterns in `CLAUDE.md`
- [ ] Document #295 data flow patterns in `DESIGN.md`
- [ ] Create reference components: `BuildTableExample.tsx` (desktop) + `BuildCardExample.tsx` (mobile)
- [ ] #261 dev reviews both PRs before starting

---

## COMMUNICATION PLAN

### Kick-Off (Day 1)
- [ ] Team sync: Review this plan + issue details
- [ ] Assign developers to workstreams
- [ ] Create feature branches
- [ ] Post in each issue: "Starting work - assigned to [dev name]"

### Mid-Point Check-Ins (Day 4, Day 8)
- [ ] Sync between #256 and #295 developers
- [ ] Review acceptance criteria progress
- [ ] Escalate blockers immediately
- [ ] Adjust timeline if needed

### Pre-Merge Prep (Days 10-12)
- [ ] QA testing in dedicated environment
- [ ] Code review with architectural focus
- [ ] Accessibility audit (axe, Lighthouse)
- [ ] Performance baseline measurement

### Post-Merge (Days 13-14)
- [ ] Merge #256 to main
- [ ] Merge #295 to main (rebase on #256 if needed)
- [ ] Verify integration on main
- [ ] Gate check: All acceptance criteria met? → Proceed to #261

### Issue #261 Kick-Off (Day 15)
- [ ] Assign developer to #261
- [ ] Review #256 + #295 merged code
- [ ] Create responsive table feature branch
- [ ] Proceed with card implementation

---

## NEXT STEPS & ACTION ITEMS

### Immediate (Today)
```
□ Distribute this plan to team
□ Review all three issues (#256, #295, #261) in GitHub
□ Verify Tab component is production-ready
□ Assign developers to workstreams (A, B, C)
```

### Week 1 Preparation
```
□ #256 Developer:
  - Set up test environment
  - Review Button, Form, BuildTable components
  - Create feature branch: feat/issue-256-interactive-states
  - Check Tailwind transition utilities available

□ #295 Developer:
  - Review Tab component code + product review (PRODUCT-REVIEW-TABS.md)
  - Study BuildDetailModal current structure
  - Review Express Event Bus SSE endpoint
  - Create feature branch: feat/issue-295-tab-integration
  - Set up Apollo Client DevTools for debugging

□ Project Lead:
  - Prepare QA checklist for each issue
  - Set up performance monitoring (modal load time, tab switch latency)
  - Schedule mid-point sync (Day 4)
  - Create acceptance testing environment
```

### Week 1-2 Execution
```
□ Developer A (#256): Execute interactive states implementation
□ Developer B (#295): Execute tab integration implementation
□ Project Lead: Monitor progress, escalate blockers
```

### Week 3 Completion
```
□ QA both #256 and #295 in staging
□ Code review + approval
□ Accessibility audit pass
□ Merge to main (in order: #256, then #295)
□ Gate verification: Ready for #261?
```

### Week 4 - Issue #261
```
□ Assign developer to #261
□ Create BuildCard component
□ Implement responsive breakpoints
□ Merge to main
□ Complete Phase 2-3 transition!
```

---

## REFERENCE DOCUMENTS

- **Issue #256 Details**: `https://github.com/pluto-atom-4/react-grapql-playground/issues/256`
- **Issue #295 Details**: `https://github.com/pluto-atom-4/react-grapql-playground/issues/295`
- **Issue #261 Details**: `https://github.com/pluto-atom-4/react-grapql-playground/issues/261`
- **Product Review (Tabs)**: `docs/design-review/PRODUCT-REVIEW-TABS.md`
- **Phase 2 Coordination Guide**: `docs/implementation-planning/PHASE-2-COORDINATION-GUIDE.md`
- **Component Registry**: `docs/COMPONENT-REGISTRY.md` (file ownership)
- **DESIGN.md**: `DESIGN.md` (architecture patterns)
- **CLAUDE.md**: `CLAUDE.md` (project conventions)

---

## APPROVAL & SIGN-OFF

**Plan Status:** Ready for Execution  
**Prepared By:** Orchestration Coordinator  
**Reviewed By:** [Project Lead - Pending]  
**Approved By:** [Director - Pending]  

**Next Milestone:** All issues gated → Issue #261 starts → Phase 3 Mobile Optimization Complete  
**Success Metric:** 3 issues merged, 95% coverage, WCAG AA audit pass, no production blockers

---

**This plan bridges Phase 2 completion and Phase 3 full execution. Execute with confidence.**
