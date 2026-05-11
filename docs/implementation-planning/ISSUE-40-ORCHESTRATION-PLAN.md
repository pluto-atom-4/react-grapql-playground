# Issue #40 Orchestration Plan: WCAG AA Accessibility

**Status:** Ready to Start | **Phase 4 Completion:** 80% (4 of 5 issues complete)  
**Target Completion:** May 14, 2026  
**Estimated Effort:** 2-3 hours  
**Acceptance Criteria:** 12 items (all mapped to work items below)

---

## 📋 Executive Summary

Issue #40 implements full WCAG AA accessibility compliance across the React application. This orchestration breaks down the work into 8 phases with 45 atomic tasks, dependencies tracked in SQL, and clear acceptance criteria for each phase.

**Key Goals:**
1. ✅ All 12 acceptance criteria from Issue #40 mapped to specific tasks
2. ✅ Tasks at 15-30 minute granularity (achievable work units)
3. ✅ Dependencies clearly defined (most phases parallelizable)
4. ✅ SQL tracking structure ready for developer execution
5. ✅ Next developer can start immediately with clear direction

---

## 🎯 Issue #40 Acceptance Criteria Mapping

| Criterion | Task(s) | Status |
|-----------|---------|--------|
| All buttons have aria-label or meaningful text | phase2-aria-buttons-*, phase7-aria-attribute-tests | ⏳ Pending |
| Modal has role="dialog" and aria-modal="true" | phase2-modal-dialog-role, phase7-aria-attribute-tests | ⏳ Pending |
| Keyboard navigation works (Tab through all) | phase3-tab-order-*, phase6-keyboard-only-test | ⏳ Pending |
| Escape key closes modal | phase3-escape-modal, phase6-keyboard-only-test | ⏳ Pending |
| Focus trap in modal (Tab stays inside) | phase3-focus-trap-modal, phase7-keyboard-nav-tests | ⏳ Pending |
| Focus indicators visible (outline or ring) | phase4-focus-visible-outline, phase7-focus-management-tests | ⏳ Pending |
| axe DevTools finds 0 violations | phase6-axe-audit, phase8-final-qa | ⏳ Pending |
| WAVE audit finds 0 errors | phase6-wave-audit, phase8-final-qa | ⏳ Pending |
| Tested with screen reader (NVDA or VoiceOver) | phase6-screen-reader-nvda, phase8-final-qa | ⏳ Pending |
| Lighthouse Accessibility score ≥ 90 | phase6-lighthouse-a11y, phase8-final-qa | ⏳ Pending |
| Contrast ratio ≥ 4.5:1 (WCAG AA) | phase6-verify-contrast-*, phase8-final-qa | ⏳ Pending |
| Tests verify keyboard navigation | phase7-keyboard-nav-tests, phase8-final-qa | ⏳ Pending |

---

## 📊 45 Atomic Work Items (Phases 1-8)

### Phase 1: Codebase Analysis (5 tasks, 75 min)
- `phase1-audit-modal` (15 min) - Audit BuildDetailModal for ARIA, roles, keyboard
- `phase1-audit-dashboard` (15 min) - Audit BuildDashboard & buttons
- `phase1-audit-forms` (15 min) - Audit FileUploader & forms
- `phase1-audit-contrast` (20 min) - Verify color contrast ratios
- `phase1-current-a11y-summary` (10 min) - Create accessibility baseline

**Outcome:** Detailed baseline analysis document

---

### Phase 2: ARIA Labels & Roles (8 tasks, 125 min)
- `phase2-aria-buttons-modal` (20 min) - Add aria-label to modal buttons
- `phase2-modal-dialog-role` (15 min) - Add dialog role and aria-modal
- `phase2-aria-buttons-dashboard` (20 min) - Add aria-label to dashboard buttons
- `phase2-aria-file-uploader` (15 min) - Add aria-label to uploader
- `phase2-aria-pagination` (10 min) - Complete pagination ARIA
- `phase2-aria-status-badges` (10 min) - Add aria-label to status badges
- `phase2-aria-test-panel` (15 min) - Add ARIA to test panel
- `phase2-semantic-html-tables` (20 min) - Replace div-tables with semantic HTML

**Outcome:** All interactive elements have proper ARIA attributes and roles

---

### Phase 3: Keyboard Navigation (6 tasks, 90 min)
- `phase3-escape-modal` (20 min) - Implement Escape key handler
- `phase3-focus-trap-modal` (25 min) - Implement focus trap in modals
- `phase3-tab-order-modal` (15 min) - Verify tab order in modal
- `phase3-tab-order-dashboard` (15 min) - Verify tab order in dashboard
- `phase3-enter-space-buttons` (20 min) - Verify Enter/Space activates buttons
- `phase3-pagination-arrows` (15 min) - Optional: arrow key pagination

**Outcome:** Full keyboard navigation working (Tab, Escape, Enter/Space)

---

### Phase 4: Focus Management (4 tasks, 75 min)
- `phase4-focus-visible-outline` (30 min) - Add focus:ring Tailwind classes
- `phase4-modal-focus-management` (15 min) - Focus first element on modal open
- `phase4-focus-restore-on-close` (15 min) - Restore focus when modal closes
- `phase4-focus-visible-states` (15 min) - Focus visible in loading/error states

**Outcome:** Clear focus indicators, proper focus flow

---

### Phase 5: Semantic HTML & Screen Reader Support (6 tasks, 90 min)
- `phase5-semantic-sections` (15 min) - Use `<section>`, `<nav>`, `<main>`
- `phase5-form-labels-uploads` (15 min) - Add proper form labels
- `phase5-error-messages-roles` (20 min) - Add role="alert" to errors
- `phase5-loading-spinners` (15 min) - Add ARIA to loading indicators
- `phase5-link-text` (10 min) - Ensure meaningful link text
- `phase5-image-alt-text` (15 min) - Add alt text and aria-hidden

**Outcome:** Semantic HTML throughout, screen reader friendly

---

### Phase 6: Testing & Validation (8 tasks, 175 min)
- `phase6-verify-contrast-main` (20 min) - Test primary element contrast
- `phase6-verify-contrast-secondary` (20 min) - Test secondary element contrast
- `phase6-axe-audit` (20 min) - Run axe DevTools audit
- `phase6-wave-audit` (20 min) - Run WAVE audit
- `phase6-lighthouse-a11y` (15 min) - Run Lighthouse accessibility
- `phase6-keyboard-only-test` (25 min) - Manual keyboard-only navigation
- `phase6-screen-reader-nvda` (30 min) - Screen reader walkthrough
- `phase6-contrast-report` (10 min) - Document contrast ratios

**Outcome:** Verified WCAG AA compliance (contrast, keyboard, screen reader)

---

### Phase 7: Automated Testing (4 tasks, 95 min)
- `phase7-keyboard-nav-tests` (30 min) - Write keyboard navigation tests
- `phase7-aria-attribute-tests` (25 min) - Write ARIA attribute tests
- `phase7-focus-management-tests` (20 min) - Write focus management tests
- `phase7-semantic-html-tests` (20 min) - Write semantic HTML tests

**Outcome:** Comprehensive automated tests prevent regressions

---

### Phase 8: Documentation & Rollout (4 tasks, 65 min)
- `phase8-accessibility-doc` (20 min) - Create ACCESSIBILITY.md
- `phase8-update-readme` (10 min) - Update README with a11y features
- `phase8-pr-checklist` (20 min) - Complete PR checklist & documentation
- `phase8-final-qa` (15 min) - Final QA and verification

**Outcome:** PR ready to merge with full documentation

---

## ⏱️ Estimated Timeline

### Single Developer Path
- **Total Effort:** ~13 hours
- **Recommended Split:**
  - Day 1: Phases 1-2 (3.5 hours)
  - Day 2: Phases 3-4 (2.75 hours)
  - Day 3: Phases 5-6 (4.5 hours)
  - Day 4: Phases 7-8 (2.75 hours)
- **Total Duration:** 4 days

### Two Developer Path
- **Total Effort:** ~7 hours (parallel)
- **Timeline:** 2-3 days with parallelization

**Fits within May 14, 2026 target ✅**

---

## 🔄 Parallelization Strategy

**Phases 1-2:** Sequential (Phase 1 → Phase 2)  
**Phases 2-5:** Mostly parallel after Phase 2 complete  
**Phase 6:** Sequential (after Phase 2-5)  
**Phases 7-8:** Sequential (after Phase 6)  

**Best Multi-Developer Split:**
- **Dev 1:** Phases 1, 3, 5 (Analysis, Keyboard, Semantic)
- **Dev 2:** Phases 2, 4, 6 (ARIA, Focus, Testing)
- **Both:** Phase 7-8 (Testing + Rollout)

---

## 📝 Components to Modify (Priority)

### Tier 1: High Impact
1. **build-detail-modal.tsx** - Main modal
   - Add role="dialog", aria-modal="true", aria-labelledby
   - Add aria-label to all buttons
   - Implement Escape handler + focus trap
   - Replace div-table with `<table>`

2. **build-dashboard.tsx** - Dashboard
   - Add aria-label to buttons
   - Update pagination aria attributes

3. **Pagination.tsx** - Pagination
   - Add role="navigation", aria-label
   - Add button labels, page size aria-label

### Tier 2: Medium Impact
4. **FileUploader/** - Upload feature
   - Add aria-label, aria-describedby

5. **test-run-details-panel.tsx** - Test details
   - Add button labels, role="alert"

### Tier 3: Lower Impact
6. **toast-notification.tsx** - Toasts
7. **SkeletonLoader/** - Loading states
8. **create-build-modal.tsx** - Create modal

---

## ✅ Success Checklist (12 Acceptance Criteria)

- [ ] All buttons have aria-label or meaningful text
- [ ] Modals have role="dialog" and aria-modal="true"
- [ ] Tab navigation reaches all interactive elements
- [ ] Escape key closes modals
- [ ] Focus trap works (Tab stays in modal)
- [ ] Focus outline visible on all interactive elements
- [ ] axe DevTools: 0 violations
- [ ] WAVE audit: 0 errors
- [ ] Screen reader test passing (NVDA/VoiceOver)
- [ ] Lighthouse Accessibility: ≥ 90 score
- [ ] All text contrast: ≥ 4.5:1 (WCAG AA)
- [ ] Automated tests verify keyboard navigation

---

## 🚀 Getting Started

1. **Review this plan** and the SQL task tracking
2. **Start Phase 1** tasks (codebase analysis)
3. **Mark tasks as `in_progress`** in SQL as you work
4. **Follow phase sequence** (most independent after Phase 2)
5. **Update task status** to `done` when complete
6. **Run tests** after each phase
7. **Document findings** for PR

**SQL Commands:**
```sql
-- View all pending tasks
SELECT * FROM todos WHERE status = 'pending';

-- Start a task
UPDATE todos SET status = 'in_progress' WHERE id = 'phase1-audit-modal';

-- Complete a task
UPDATE todos SET status = 'done' WHERE id = 'phase1-audit-modal';

-- View dependencies
SELECT todo_id, depends_on FROM todo_deps WHERE todo_id = 'phase2-aria-buttons-modal';
```

---

## 📚 Reference Resources

- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Orchestration Date:** May 11, 2026  
**Status:** 🟢 Ready for Developer Execution  
**Next Milestone:** Issue #40 Complete by May 14, 2026
