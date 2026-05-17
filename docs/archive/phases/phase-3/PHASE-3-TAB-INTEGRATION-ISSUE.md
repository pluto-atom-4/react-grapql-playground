## Executive Summary

The tab component system demonstrates **strong architectural foundations** with best-in-class accessibility compliance (WCAG AA) and comprehensive keyboard navigation. However, a critical **disconnect** exists: the powerful, reusable `Tabs` component is production-ready but currently unused in the application. Tab content components (`BuildOverviewTab`, `BuildPartsTab`, etc.) exist as orphaned modules rather than being orchestrated by the Tabs container.

This issue captures the Phase 3 roadmap to integrate tabs into BuildDetailModal, standardize data flow, and complete missing interaction handlers—delivering **12-20% efficiency gains** across user personas with modest effort (11-day timeline).

---

## Main Findings from Product Review

### ✅ Strengths
- **Excellent Accessibility**: WCAG AA compliant with full keyboard navigation (arrow keys, Home/End)
- **Reusable Architecture**: Tabs component is generic UI (no domain knowledge), applicable across app
- **Smart Loading States**: Skeleton screens, smooth transitions, pagination feedback
- **Responsive Design**: Flexbox-based, mobile-friendly with proper touch targets

### ❌ Critical Gaps
1. **Product-Architecture Mismatch**: BuildDetailModal uses flat scrolling layout instead of tabs
2. **Data Flow Inconsistency**: Tab components fetch own data via hooks instead of receiving props
3. **Missing Interactivity**: "Edit Build", "View Details", test actions lack handlers
4. **No Real-Time Integration**: Polling happens but Event Bus is underutilized
5. **Mobile UX Gap**: Tab bar scrolls without visual indicators

---

## Acceptance Criteria

### Phase 3 Deliverables

- [ ] **Tab Integration in Modal**
  - Refactor BuildDetailModal to use Tabs component instead of flat layout
  - Organize sections into tabbed interface: Overview → Parts → Tests → History
  - Implement lazy loading (render only active tab to reduce DOM)
  - Verify keyboard navigation works end-to-end (arrow keys, Home/End)

- [ ] **Standardize Data Flow (Props-Based)**
  - Convert tab components from hook-based to prop-based pattern
  - Move `useActivityFeed`, `useTestRuns` to parent (BuildDetailModal)
  - Pass data down as props: `events`, `isLoading`, `testRuns`, etc.
  - **Impact**: Better testability, reusability, SSR support

- [ ] **Complete Interaction Handlers**
  - BuildOverviewTab: Implement "Edit Build" form modal + "View Details" link
  - BuildPartsTab: Implement inline quantity editor + part detail drill-down
  - BuildTestRunsTab: Implement "View" button + result filtering (pass/fail)
  - BuildHistoryTab: Implement event type filtering + date range picker

- [ ] **Real-Time Event Integration**
  - Connect BuildDetailModal to Express Event Bus via SSE
  - Update tabs when events arrive (buildStatusChanged, testRunSubmitted, etc.)
  - Refresh Apollo cache automatically (no polling needed)

- [ ] **Error Resilience**
  - Add error boundaries per tab (failures don't crash entire modal)
  - Implement retry logic for failed data loads
  - Surface errors to user with fallback UI

- [ ] **Testing & Accessibility**
  - Unit tests for each tab component (95%+ coverage)
  - Integration tests for modal + tabs keyboard navigation
  - Screen reader testing (NVDA/JAWS compatibility)
  - Automated accessibility audit (axe, Lighthouse)

---

## Technical Context

### Current Architecture Problem

```
🚫 CURRENT (Disconnected)
BuildDetailModal (flat scrollable layout)
  ├── BuildStatusSection (direct content)
  ├── BuildPartsSection (direct content)
  └── TestRunsSection (direct content)

✅ TARGET (Integrated)
BuildDetailModal
  └── Tabs (orchestration layer)
      ├── BuildOverviewTab
      ├── BuildPartsTab
      ├── BuildTestRunsTab
      └── BuildHistoryTab
```

### Data Flow Inconsistency

**Current (Anti-pattern)**:
```typescript
// BuildHistoryTab fetches its own data—hard to test
const { events, loading } = useActivityFeed(buildId);
```

**Target (Recommended)**:
```typescript
// Parent passes data; tab is presentational
<BuildHistoryTab events={events} isLoading={loading} />
```

### Integration Points
- **Apollo Cache**: Build, parts, test runs data
- **Express Event Bus**: Real-time status changes, test results
- **GraphQL Subscriptions**: Live test streaming (Phase 4 opportunity)

---

## Business Value

### Efficiency Gains by User Persona

| Persona | Use Case | Current | After | Gain |
|---------|----------|---------|-------|------|
| **Technician** | Start new build | 2-3 min (scroll through sections) | 30 sec (tab switching) | 80% faster |
| **Engineer** | Debug failed build | 30 min (context switching) | 5 min (organized tabs) | 85% faster |
| **QA** | Validate test coverage | 15 min (hunt for tests) | 2 min (tab + filter) | 87% faster |
| **Manager** | Monitor progress | 10 min (navigate modal) | 1 min (real-time tabs) | 90% faster |
| **Overall** | Modal usability | Baseline | Keyboard nav + lazy load | **12-20% gain** |

### Competitive Advantages
- Real-time test streaming without polling overhead
- Keyboard-first power user workflows (30% faster)
- WCAG AA accessibility (differentiator)
- Lazy loading reduces DOM size for performance

---

## Phase 3 Roadmap (11-Day Timeline)

### Week 1: Foundation (4 days)
1. **Day 1-2**: Refactor BuildDetailModal to use Tabs component
   - Move sections into tab content
   - Wire up tab selection state
   - Verify keyboard nav works
   
2. **Day 2-3**: Implement lazy loading + error boundaries
   - Set `lazy={true}` in Tabs component
   - Add error boundary per tab
   - Test resilience

3. **Day 3-4**: Update existing tests for new structure

### Week 2: Data Flow (4 days)
1. **Day 5-6**: Convert tab components to prop-based
   - Remove hook calls
   - Update parent to fetch all data
   - Pass down via props
   
2. **Day 6-7**: Write integration tests
   - Keyboard nav test suite
   - Accessibility audit

3. **Day 7-8**: Real-time integration
   - Connect to Express Event Bus
   - Update Apollo cache on events

### Week 3: UX Enhancements (3 days)
1. **Day 9**: Implement interaction handlers
   - "Edit Build" form modal
   - Part detail drill-down
   - Test result filtering
   
2. **Day 10**: Mobile optimizations + final testing
   - Tab bar visual indicators
   - Touch target sizing verification
   
3. **Day 11**: Performance baseline + launch readiness
   - Measure modal load time
   - Monitor tab switch latency
   - User feedback collection

---

## Related Issues & Context

### Blocking/Depends On
- **#259**: BuildOverviewTab component (✅ complete)
- **#260**: BuildPartsTab, BuildTestRunsTab components (✅ complete)

### Related Features
- **Real-time Events**: Express Event Bus (backend-express)
- **GraphQL Subscriptions**: Phase 4 roadmap
- **Mobile Optimization**: Phase 4 roadmap

---

## Implementation Notes

### Key Files to Modify
- `frontend/components/BuildDetailModal.tsx` (main refactor)
- `frontend/components/Tabs.tsx` (verify integration)
- `frontend/components/BuildOverviewTab.tsx` (data flow)
- `frontend/components/BuildPartsTab.tsx` (data flow)
- `frontend/components/BuildTestRunsTab.tsx` (data flow)
- `frontend/components/BuildHistoryTab.tsx` (data flow)
- Test files across all tabs

### Performance Targets
- Modal load time: < 500ms (currently unknown baseline)
- Tab switch latency: < 100ms
- Lazy loading: Reduce DOM by 30-40%

### Accessibility Checkpoints
- [ ] Keyboard nav works in actual screen reader (NVDA, JAWS)
- [ ] Tab order is logical (Overview → Parts → Tests → History)
- [ ] Focus management works on modal open/close
- [ ] Escape key closes modal (no tab hijack)

---

## Definition of Done

✅ All acceptance criteria met  
✅ Unit tests: 95%+ coverage  
✅ Integration tests pass (keyboard nav, accessibility)  
✅ Code review approved  
✅ Manual QA sign-off (all personas)  
✅ Performance baseline established  
✅ Documentation updated (CLAUDE.md, DESIGN.md)  
✅ Accessibility audit passes (WCAG AA)

---

## Reference: Product Review Source

See `docs/design-review/PRODUCT-REVIEW-TABS.md` for full product review analysis including:
- Detailed component breakdown
- UX assessment with accessibility findings
- Business value analysis by user persona
- Technical observations and patterns
- Implementation checklist and metrics
