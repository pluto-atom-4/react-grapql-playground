# Issue #40: WCAG AA Accessibility - Quick Task Reference

**Date:** May 11, 2026 | **Target:** May 14, 2026 | **Status:** 🟢 Ready to Start

## 45 Tasks Organized by Phase

### ✅ Phase 1: Codebase Analysis (75 min)
**Status:** ⏳ Not Started | **Parallelizable:** YES

| Task ID | Title | Effort | Dependencies |
|---------|-------|--------|--------------|
| `phase1-audit-modal` | Audit BuildDetailModal accessibility | 15 min | None |
| `phase1-audit-dashboard` | Audit BuildDashboard & buttons | 15 min | None |
| `phase1-audit-forms` | Audit FileUploader & forms | 15 min | None |
| `phase1-audit-contrast` | Audit color contrast ratios | 20 min | None |
| `phase1-current-a11y-summary` | Create current accessibility baseline | 10 min | All Phase 1 tasks |

**Checkpoint:** Accessibility baseline document + gaps identified vs. Issue #40 requirements

---

### ✅ Phase 2: ARIA Labels & Roles (125 min)
**Status:** ⏳ Not Started | **Parallelizable:** Mostly YES (after Phase 1)

| Task ID | Title | Effort | Depends On | Components |
|---------|-------|--------|-----------|-----------|
| `phase2-modal-dialog-role` | Add dialog role and aria-modal to modals | 15 min | Phase 1 | build-detail-modal.tsx, create-build-modal.tsx |
| `phase2-semantic-html-tables` | Convert divs to semantic table elements | 20 min | Phase 1 | build-detail-modal.tsx |
| `phase2-aria-buttons-modal` | Add aria-label to all modal buttons | 20 min | Phase 2-modal | build-detail-modal.tsx |
| `phase2-aria-buttons-dashboard` | Add aria-label to dashboard buttons | 20 min | Phase 1 | build-dashboard.tsx |
| `phase2-aria-pagination` | Complete pagination ARIA attributes | 10 min | Phase 1 | Pagination.tsx |
| `phase2-aria-file-uploader` | Add aria-label to file uploader | 15 min | Phase 1 | FileUploader/FileUploader.tsx |
| `phase2-aria-status-badges` | Add aria-label to status badges | 10 min | Phase 1 | build-detail-modal.tsx |
| `phase2-aria-test-panel` | Add ARIA to TestRunDetailsPanel | 15 min | Phase 1 | test-run-details-panel.tsx |

**Checkpoint:** All interactive elements have aria-label or aria-hidden

---

### ✅ Phase 3: Keyboard Navigation (90 min)
**Status:** ⏳ Not Started | **Parallelizable:** NO (Sequential after Phase 2)

| Task ID | Title | Effort | Depends On | Implementation |
|---------|-------|--------|-----------|-----------------|
| `phase3-escape-modal` | Implement Escape key to close modals | 20 min | Phase 2 dialog role | useEffect + keydown listener |
| `phase3-focus-trap-modal` | Implement focus trap in modals | 25 min | Phase 2 dialog role | Tab wraps within modal bounds |
| `phase3-tab-order-modal` | Ensure logical tab order in modal | 15 min | Phase 3 escape | Remove negative tabIndex, verify order |
| `phase3-tab-order-dashboard` | Ensure logical tab order in dashboard | 15 min | Phase 2 buttons | tabIndex={0} for custom elements |
| `phase3-enter-space-buttons` | Verify Enter/Space activates all buttons | 20 min | Phase 2 buttons | onKeyDown handler for custom buttons |
| `phase3-pagination-arrows` | Optional: Add arrow key navigation | 15 min | Phase 3 tab-order | Left/Right arrow for prev/next |

**Checkpoint:** Tab navigation works through all elements, Escape closes modal

---

### ✅ Phase 4: Focus Management (75 min)
**Status:** ⏳ Not Started | **Parallelizable:** NO (Sequential after Phase 3)

| Task ID | Title | Effort | Depends On | Implementation |
|---------|-------|--------|-----------|-----------------|
| `phase4-focus-visible-outline` | Add focus:ring outline to all interactive | 30 min | Phase 2 buttons | `focus:ring-2 focus:ring-blue-500` Tailwind |
| `phase4-modal-focus-management` | Focus first element on modal open | 15 min | Phase 3 escape | useRef + element.focus() in useEffect |
| `phase4-focus-restore-on-close` | Restore focus when modal closes | 15 min | Phase 4 modal-focus | Store activeElement, refocus on close |
| `phase4-focus-visible-states` | Verify focus visible in loading/error | 15 min | Phase 3 tab-order | aria-busy, role="alert" on errors |

**Checkpoint:** Focus outline visible, first element focused on open, focus restored on close

---

### ✅ Phase 5: Semantic HTML & Screen Reader (90 min)
**Status:** ⏳ Not Started | **Parallelizable:** YES (after Phase 2)

| Task ID | Title | Effort | Depends On | Implementation |
|---------|-------|--------|-----------|-----------------|
| `phase5-semantic-sections` | Use semantic HTML sections in modals | 15 min | Phase 2 tables | `<section>`, `<nav>`, `<main>` elements |
| `phase5-form-labels-uploads` | Add proper labels to file uploader | 15 min | Phase 2 aria-uploader | `<label htmlFor>`, aria-describedby |
| `phase5-error-messages-roles` | Add role="alert" to error messages | 20 min | Phase 2 buttons | role="alert" aria-live="polite" |
| `phase5-loading-spinners` | Add ARIA to loading indicators | 15 min | Phase 2 status | aria-busy, role="status" |
| `phase5-link-text` | Ensure download links have meaningful text | 10 min | Phase 2 test-panel | aria-label with specifics |
| `phase5-image-alt-text` | Add alt text to all images/SVGs | 15 min | Phase 2 buttons | aria-hidden on decorative, alt on images |

**Checkpoint:** Semantic HTML throughout, screen reader friendly

---

### ✅ Phase 6: Testing & Validation (175 min)
**Status:** ⏳ Not Started | **Parallelizable:** Partially (contrast + audits)

| Task ID | Title | Effort | Depends On | Tool/Method |
|---------|-------|--------|-----------|-------------|
| `phase6-verify-contrast-main` | Verify 4.5:1 contrast: primary elements | 20 min | Phase 1 audit | WebAIM Contrast Checker |
| `phase6-verify-contrast-secondary` | Verify 4.5:1 contrast: secondary elements | 20 min | Phase 1 audit | WebAIM Contrast Checker |
| `phase6-axe-audit` | Run axe DevTools audit | 20 min | Phase 2 ARIA | axe DevTools extension, 0 violations target |
| `phase6-wave-audit` | Run WAVE accessibility audit | 20 min | Phase 2 ARIA | WAVE browser extension, 0 errors target |
| `phase6-lighthouse-a11y` | Run Lighthouse accessibility audit | 15 min | Phase 6 axe | Lighthouse tab in DevTools, ≥90 target |
| `phase6-keyboard-only-test` | Manual keyboard-only navigation test | 25 min | Phase 3 nav | Unplug mouse, Tab/Escape/Enter throughout |
| `phase6-screen-reader-nvda` | Manual screen reader test | 30 min | Phase 5 semantic | NVDA or VoiceOver, navigate full app |
| `phase6-contrast-report` | Document contrast ratios in accessibility doc | 10 min | Phase 6 verify-contrast | Create summary of all contrast ratios tested |

**Checkpoint:** WCAG AA verified (keyboard, screen reader, contrast, audits all passing)

---

### ✅ Phase 7: Automated Testing (95 min)
**Status:** ⏳ Not Started | **Parallelizable:** Mostly (after Phase 6)

| Task ID | Title | Effort | Depends On | Test Framework |
|---------|-------|--------|-----------|-----------------|
| `phase7-keyboard-nav-tests` | Write tests for keyboard navigation | 30 min | Phase 6 keyboard-test | React Testing Library + userEvent |
| `phase7-aria-attribute-tests` | Write tests for ARIA attributes | 25 min | Phase 6 axe-audit | React Testing Library, getByRole, getByLabelText |
| `phase7-focus-management-tests` | Write tests for focus management | 20 min | Phase 4 focus-restore | React Testing Library, document.activeElement |
| `phase7-semantic-html-tests` | Write tests for semantic HTML | 20 min | Phase 5 semantic | React Testing Library DOM queries |

**Checkpoint:** All keyboard nav + ARIA + focus + semantic tests passing

---

### ✅ Phase 8: Documentation & Rollout (65 min)
**Status:** ⏳ Not Started | **Parallelizable:** NO (Sequential)

| Task ID | Title | Effort | Depends On | Deliverable |
|---------|-------|--------|-----------|------------|
| `phase8-accessibility-doc` | Create ACCESSIBILITY.md documentation | 20 min | Phase 6 verify-contrast | New ACCESSIBILITY.md with WCAG standards, shortcuts, testing procedures |
| `phase8-update-readme` | Update README with accessibility features | 10 min | Phase 8 accessibility-doc | Add WCAG AA section, link to ACCESSIBILITY.md |
| `phase8-pr-checklist` | Complete PR checklist and documentation | 20 min | Phase 7 tests | PR summary, test results, axe/WAVE/Lighthouse scores |
| `phase8-final-qa` | Final QA and verification | 15 min | Phase 8 pr-checklist | All 12 acceptance criteria verified, ready to merge |

**Checkpoint:** PR ready for review and merge

---

## 📈 Progress Tracking

### SQL Task Status Commands

```sql
-- View all pending tasks
SELECT id, title, status FROM todos WHERE status = 'pending' ORDER BY id;

-- View Phase 1 tasks
SELECT id, title, status, estimated_effort_minutes FROM todos 
WHERE id LIKE 'phase1-%' ORDER BY id;

-- Mark task as in progress
UPDATE todos SET status = 'in_progress' WHERE id = 'phase1-audit-modal';

-- Mark task as done
UPDATE todos SET status = 'done' WHERE id = 'phase1-audit-modal';

-- View blocked tasks
SELECT id, title FROM todos WHERE status = 'blocked';

-- View progress by phase
SELECT 
  SUBSTR(id, 1, 7) as phase,
  COUNT(*) as total_tasks,
  SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed,
  SUM(estimated_effort_minutes) as total_effort_min
FROM todos GROUP BY phase ORDER BY phase;

-- View dependencies for a task
SELECT td.todo_id, td.depends_on, t.status 
FROM todo_deps td
JOIN todos t ON td.depends_on = t.id
WHERE td.todo_id = 'phase2-aria-buttons-modal';
```

---

## 🏁 Completion Milestone Checklist

Use this to track overall progress:

### Phase 1: Analysis ✅
- [ ] All 5 analysis tasks marked `done`
- [ ] Baseline document created
- [ ] Gaps identified vs. Issue #40 requirements

### Phase 2: ARIA ✅
- [ ] All 8 ARIA tasks marked `done`
- [ ] All buttons have aria-label or text content
- [ ] Modals have role="dialog" aria-modal="true"
- [ ] Pagination has role="navigation" aria-label

### Phase 3: Keyboard ✅
- [ ] All 6 keyboard tasks marked `done`
- [ ] Tab navigation works through all elements
- [ ] Escape closes modals
- [ ] Focus trap works in modals

### Phase 4: Focus ✅
- [ ] All 4 focus tasks marked `done`
- [ ] Focus outline visible on all interactive elements
- [ ] First element focused on modal open
- [ ] Focus restored when modal closes

### Phase 5: Semantic ✅
- [ ] All 6 semantic tasks marked `done`
- [ ] Semantic HTML elements used (section, nav, main)
- [ ] Error/loading messages have proper ARIA roles
- [ ] Screen reader friendly throughout

### Phase 6: Testing ✅
- [ ] All 8 testing tasks marked `done`
- [ ] axe DevTools: 0 violations ✅
- [ ] WAVE audit: 0 errors ✅
- [ ] Lighthouse a11y: ≥ 90 ✅
- [ ] Keyboard-only navigation: working ✅
- [ ] Screen reader: all content announced ✅
- [ ] All contrast: ≥ 4.5:1 ✅

### Phase 7: Automated Tests ✅
- [ ] All 4 test tasks marked `done`
- [ ] Keyboard navigation tests passing
- [ ] ARIA attribute tests passing
- [ ] Focus management tests passing
- [ ] Semantic HTML tests passing

### Phase 8: Rollout ✅
- [ ] All 4 rollout tasks marked `done`
- [ ] ACCESSIBILITY.md created
- [ ] README updated
- [ ] PR ready for review
- [ ] All 12 acceptance criteria verified

---

## 🎯 12 Acceptance Criteria Tracking

- [ ] **1. All buttons have aria-label or meaningful text**
  - Phase: Phase 2, 7
  - Verification: Manual + automated tests
  
- [ ] **2. Modal has role="dialog" and aria-modal="true"**
  - Phase: Phase 2, 7
  - Verification: axe audit + manual inspection
  
- [ ] **3. Keyboard navigation works (Tab through all)**
  - Phase: Phase 3, 6, 7
  - Verification: Manual keyboard test + automated tests
  
- [ ] **4. Escape key closes modal**
  - Phase: Phase 3, 6
  - Verification: Manual keyboard test
  
- [ ] **5. Focus trap in modal (Tab stays inside)**
  - Phase: Phase 3, 6, 7
  - Verification: Manual keyboard test + automated tests
  
- [ ] **6. Focus indicators visible (outline or ring)**
  - Phase: Phase 4, 6
  - Verification: Visual inspection + automated tests
  
- [ ] **7. axe DevTools finds 0 violations**
  - Phase: Phase 6, 8
  - Verification: axe DevTools audit
  
- [ ] **8. WAVE audit finds 0 errors**
  - Phase: Phase 6, 8
  - Verification: WAVE audit
  
- [ ] **9. Tested with screen reader (NVDA or VoiceOver)**
  - Phase: Phase 6, 8
  - Verification: Manual screen reader walkthrough
  
- [ ] **10. Lighthouse Accessibility score ≥ 90**
  - Phase: Phase 6, 8
  - Verification: Lighthouse audit
  
- [ ] **11. Contrast ratio ≥ 4.5:1 (WCAG AA)**
  - Phase: Phase 6, 8
  - Verification: WebAIM Contrast Checker
  
- [ ] **12. Tests verify keyboard navigation**
  - Phase: Phase 7, 8
  - Verification: Automated test suite

---

**Created:** May 11, 2026  
**Next Update:** As tasks progress  
**Status:** 🟢 Ready for Developer Execution
