# Issue #40 Developer Guide: Start Here 🚀

**Status:** Ready for immediate execution  
**Target Completion:** May 14, 2026  
**Estimated Time:** 2-3 hours  

---

## 🎯 Quick Start (5 minutes)

### 1. Review the Plan
- **ISSUE-40-ORCHESTRATION-PLAN.md** - Full orchestration with phases and dependencies
- **ISSUE-40-TASK-SUMMARY.md** - Quick reference for all 45 tasks

### 2. Set Up Task Tracking
```bash
# View all pending tasks
sqlite3 /home/pluto-atom-4/Documents/stoke-full-stack/react-grapql-playground/.tasks.db
> SELECT id, title FROM todos WHERE status = 'pending' LIMIT 10;
```

### 3. Read Acceptance Criteria
All 12 acceptance criteria are mapped to specific tasks. See ISSUE-40-ORCHESTRATION-PLAN.md for the complete mapping.

### 4. Start Phase 1
```bash
# Mark your first task as in_progress
# UPDATE todos SET status = 'in_progress' WHERE id = 'phase1-audit-modal';
```

---

## 📋 What This Orchestration Provides

✅ **45 Atomic Tasks** - 15-30 minute work units (not vague stories)  
✅ **8 Phases** - Clear progression (Analysis → ARIA → Keyboard → Focus → Semantic → Testing → Automated → Rollout)  
✅ **SQL Tracking** - Dependencies, effort estimates, status in one place  
✅ **Component Mapping** - Exactly which files to modify  
✅ **Testing Strategy** - How to verify each phase is complete  
✅ **Acceptance Criteria** - All 12 mapped to specific tasks  

---

## 🔍 Phase Overview

### Phase 1: Codebase Analysis (75 min)
**Dependency:** None | **Blocks:** All other phases | **Parallelizable:** YES

Review the current accessibility state of 5 components:
- BuildDetailModal.tsx - Missing ARIA, no Escape handler, no focus trap
- BuildDashboard.tsx - Buttons missing labels, pagination ARIA incomplete
- FileUploader - Limited accessibility features
- Color contrast - Need to verify 4.5:1 WCAG AA

**Outcome:** Baseline analysis document + list of gaps

---

### Phase 2: ARIA Labels & Roles (125 min)
**Dependency:** Phase 1 | **Blocks:** Phase 3, 4, 5 | **Parallelizable:** Mostly (after Phase 1)

Add semantic ARIA attributes to all interactive elements:
- `role="dialog" aria-modal="true" aria-labelledby` on modals
- `aria-label` on all buttons (Close, Status change, Add Part, etc.)
- `role="navigation" aria-label="Pagination"` on pagination
- Replace div-based tables with semantic `<table>` elements

**Quick Example:**
```tsx
// BEFORE
<button onClick={onClose} className="...">×</button>

// AFTER
<button 
  onClick={onClose} 
  aria-label="Close build details modal"
  className="... focus:ring-2 focus:ring-blue-500"
>
  ×
</button>
```

---

### Phase 3: Keyboard Navigation (90 min)
**Dependency:** Phase 2 | **Blocks:** Phase 4, 7 | **Parallelizable:** NO

Enable keyboard-only access (Tab, Enter, Space, Escape):

1. **Escape closes modals:**
   ```tsx
   useEffect(() => {
     const handleEscape = (e: KeyboardEvent) => {
       if (e.key === 'Escape') onClose();
     };
     window.addEventListener('keydown', handleEscape);
     return () => window.removeEventListener('keydown', handleEscape);
   }, [onClose]);
   ```

2. **Tab order through modals (logical sequence)**
3. **Focus trap (Tab stays inside modal)**

---

### Phase 4: Focus Management (75 min)
**Dependency:** Phase 3 | **Blocks:** Phase 7 | **Parallelizable:** NO

1. Add Tailwind focus ring to all interactive elements:
   ```tsx
   <button className="... focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
   ```

2. Focus first element when modal opens:
   ```tsx
   const firstButton = useRef<HTMLButtonElement>(null);
   useEffect(() => {
     firstButton.current?.focus();
   }, []);
   ```

3. Restore focus when modal closes

---

### Phase 5: Semantic HTML & Screen Reader (90 min)
**Dependency:** Phase 2 | **Blocks:** Phase 6, 7 | **Parallelizable:** YES (after Phase 2)

1. Use semantic elements: `<section>`, `<nav>`, `<main>`, `<label>`
2. Add ARIA roles for dynamic content:
   - Error messages: `role="alert" aria-live="polite"`
   - Loading spinners: `role="status" aria-busy="true"`
3. Meaningful link text in download buttons

---

### Phase 6: Testing & Validation (175 min)
**Dependency:** Phases 2-5 | **Blocks:** Phase 8 | **Parallelizable:** Partial

1. **Automated Audits** (75 min):
   - axe DevTools: 0 violations
   - WAVE: 0 errors
   - Lighthouse: ≥ 90 score
   - Contrast: All text ≥ 4.5:1

2. **Manual Testing** (100 min):
   - Keyboard-only navigation (unplug mouse, Tab through everything)
   - Screen reader walkthrough (NVDA or VoiceOver)

---

### Phase 7: Automated Testing (95 min)
**Dependency:** Phase 6 | **Blocks:** Phase 8 | **Parallelizable:** Mostly

Write React Testing Library tests:
- Keyboard navigation (Tab, Escape, Focus trap)
- ARIA attributes present (aria-label, role="dialog", etc.)
- Focus management (first element focused, restored on close)
- Semantic HTML structure

Example test:
```tsx
test('Escape key closes modal', async () => {
  render(<BuildDetailModal buildId="123" onClose={onClose} />);
  await userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalled();
});
```

---

### Phase 8: Documentation & Rollout (65 min)
**Dependency:** Phase 7 | **Blocks:** None | **Parallelizable:** NO

1. Create ACCESSIBILITY.md with WCAG standards, keyboard shortcuts, testing procedures
2. Update README.md with accessibility features
3. Complete PR checklist with test results + screenshots
4. Final QA: verify all 12 acceptance criteria met

---

## 📊 Recommended Work Schedule

### Single Developer: 4 Days
- **Day 1 AM:** Phase 1 (75 min) ✅
- **Day 1 PM:** Phase 2 (125 min) ✅
- **Day 2 AM:** Phase 3 (90 min) + Phase 4 (75 min) ✅
- **Day 2 PM:** Phase 5 (90 min) + Phase 6 start ✅
- **Day 3:** Phase 6 complete (175 min) ✅
- **Day 4 AM:** Phase 7 (95 min) ✅
- **Day 4 PM:** Phase 8 (65 min) + Buffer ✅

**Total: ~13 hours of focused work**

### Two Developers: 2-3 Days (With Parallelization)
- **Dev 1:** Phases 1, 3, 5 (Analysis, Keyboard, Semantic)
- **Dev 2:** Phases 2, 4, 6 (ARIA, Focus, Testing)
- **Both:** Phases 7-8 (Automated tests, Rollout)

---

## 🛠️ Tools & Setup

### Browser Extensions (Required for Phase 6)
```bash
# Install these before Phase 6 testing:
# 1. axe DevTools - Chrome extension for automated a11y audit
# 2. WAVE - WebAIM accessibility checker
# 3. Color Contrast Analyzer (optional)
```

### Screen Reader (Required for Phase 6)
- **macOS:** VoiceOver (built-in, Cmd+F5 to enable)
- **Windows:** NVDA (free download: https://www.nvaccess.org/)

### Color Contrast Tool
- https://webaim.org/resources/contrastchecker/

### Component Files to Modify

| Priority | File | Phase(s) | Changes |
|----------|------|---------|---------|
| 1 | build-detail-modal.tsx | 2, 3, 4 | Dialog role, button labels, Escape, focus trap |
| 1 | build-dashboard.tsx | 2, 3 | Button labels, tab order |
| 1 | Pagination.tsx | 2, 3 | Navigation role, button labels, arrow keys |
| 2 | FileUploader/FileUploader.tsx | 2, 5 | Uploader labels, form descriptions |
| 2 | test-run-details-panel.tsx | 2, 5 | Button labels, error roles |
| 3 | toast-notification.tsx | 5 | Status role, live region |
| 3 | SkeletonLoader/* | 4, 5 | aria-busy, status roles |
| 3 | create-build-modal.tsx | 2, 3 | Dialog role, form labels |

---

## ✅ Acceptance Criteria Quick Reference

| # | Criterion | Task(s) | Verification |
|---|-----------|---------|--------------|
| 1 | All buttons have aria-label or meaningful text | Phase 2, 7 | axe audit + manual |
| 2 | Modal has role="dialog" and aria-modal="true" | Phase 2, 7 | Code inspection + axe |
| 3 | Keyboard navigation works (Tab through all) | Phase 3, 6, 7 | Manual + tests |
| 4 | Escape key closes modal | Phase 3, 6 | Manual keyboard test |
| 5 | Focus trap in modal (Tab stays inside) | Phase 3, 6, 7 | Manual + tests |
| 6 | Focus indicators visible (outline or ring) | Phase 4, 6 | Visual inspection |
| 7 | axe DevTools finds 0 violations | Phase 6, 8 | axe DevTools audit |
| 8 | WAVE audit finds 0 errors | Phase 6, 8 | WAVE audit |
| 9 | Tested with screen reader (NVDA/VoiceOver) | Phase 6, 8 | Manual walkthrough |
| 10 | Lighthouse Accessibility score ≥ 90 | Phase 6, 8 | Lighthouse audit |
| 11 | Contrast ratio ≥ 4.5:1 (WCAG AA) | Phase 6, 8 | WebAIM Contrast Checker |
| 12 | Tests verify keyboard navigation | Phase 7, 8 | Test suite passing |

---

## 🚀 Getting Started Now

### Step 1: Review Documentation (5 min)
```bash
cat ISSUE-40-ORCHESTRATION-PLAN.md    # Full plan
cat ISSUE-40-TASK-SUMMARY.md           # Quick reference
```

### Step 2: Install Tools (5 min)
- axe DevTools Chrome extension
- WAVE extension
- Have NVDA/VoiceOver ready

### Step 3: Start Phase 1 (75 min)
```bash
# Task 1: Audit BuildDetailModal
# - Open frontend/components/build-detail-modal.tsx
# - Review current state:
#   - Look for existing aria-* attributes
#   - Check for role="dialog" on modal
#   - Look for Escape key handler
#   - Check for focus trap logic
#   - Review modal structure (is it semantic HTML?)
# - Document findings

# Task 2: Audit BuildDashboard
# - Open frontend/components/build-dashboard.tsx
# - Check button labels, aria-label attributes
# - Review pagination integration
# - Document gaps

# ... (continue for Tasks 3-5)

# Task 5: Create summary document
# - List current ARIA attributes found
# - List gaps vs. Issue #40 requirements
# - Prioritize fixes
```

### Step 4: Move to Phase 2 (125 min)
After Phase 1 complete, start adding ARIA attributes systematically

---

## 📝 Key Implementation Patterns

### Adding aria-label to Buttons
```tsx
// Status button in modal
<button
  onClick={() => handleStatusChange(status)}
  disabled={isUpdatingStatus}
  aria-label={`Change status to ${status}`}
  className="... focus:ring-2 focus:ring-blue-500"
>
  {status}
</button>

// Close button
<button
  onClick={onClose}
  aria-label="Close build details modal"
  className="... focus:ring-2 focus:ring-blue-500"
>
  ×
</button>
```

### Adding Dialog Role to Modals
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  className="fixed inset-0 ... z-50"
>
  <div className="...">
    <h2 id="modal-title">{buildData.name}</h2>
    {/* modal content */}
  </div>
</div>
```

### Implementing Escape Handler
```tsx
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, [onClose]);
```

### Adding Focus Ring with Tailwind
```tsx
<button className="px-4 py-2 ... focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Click me
</button>
```

---

## 🐛 Common Gotchas

1. **Don't set negative tabIndex on focusable elements** - Breaks keyboard navigation
2. **Don't use aria-label on elements that already have text** - Use aria-label only for icon buttons
3. **Don't forget focus:ring Tailwind classes** - Focus outline is required for WCAG AA
4. **Don't close modal without restoring focus** - Users keyboard-only need focus restored to trigger element
5. **Don't skip semantic HTML** - Use `<button>` not `<div onClick>`, `<table>` not div-tables

---

## ✨ Success Looks Like

After Issue #40 completion:
- ✅ Entire app navigable by keyboard only
- ✅ Screen reader announces all content correctly
- ✅ Focus outline clearly visible
- ✅ All buttons labeled (not just icons)
- ✅ Modal can be closed with Escape
- ✅ Tab stays inside modal (focus trap)
- ✅ axe DevTools: 0 violations
- ✅ Lighthouse a11y: ≥ 90 score

---

## 📞 Questions?

Refer to:
- WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/
- ARIA APG: https://www.w3.org/WAI/ARIA/apg/
- React a11y: https://react.dev/reference/react-dom/components#common-props

---

**Ready to Start?** Begin with Phase 1 tasks in ISSUE-40-TASK-SUMMARY.md  
**Estimated Completion:** May 14, 2026  
**Good luck! 🚀**
