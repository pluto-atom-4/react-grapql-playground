# Phase 5 Phase 1 - Quick Reference Card

## 🚀 Quick Start (May 11)

### Your Assignment
You're assigned to one of three parallel Phase 1 issues. Work independently on your own feature branch.

### Feature Branches (One Per Issue)
```bash
feat/issue-#255-status-badges-empty-states      # Dev-1
feat/issue-#256-interactive-states-hover         # Dev-2
feat/issue-#257-form-accessibility-polish        # Dev-3
```

### Switch to Your Branch
```bash
git fetch origin
git switch feat/issue-#<N>-<description>
```

### Development Workflow
```
1. Make changes on your feature branch
2. Commit: git commit -m "feat(#N): description"
3. Test: pnpm test --run
4. Lint: pnpm lint
5. Push: git push origin feat/issue-#<N>-...
6. Create PR: gh pr create --title "..." --body "..."
```

---

## 📋 Phase 1 Overview

| Issue | Title | Owner | Effort | Status |
|-------|-------|-------|--------|--------|
| #255 | Status Badges & Empty States | Dev-1 | 8-12h | Pending |
| #256 | Interactive States & Hover | Dev-2 | 8-12h | Pending |
| #257 | Form & Accessibility Polish | Dev-3 | 6-10h | Pending |

**Timeline**: May 11 (start) → May 15 (consolidation) → May 16 (Phase 1 → Phase 2 gate)

---

## 🎯 Your Specific Issue

### Issue #255: Status Badges & Empty States (Dev-1)

**Files to Modify**:
- `frontend/components/StatusBadge.tsx`
- `frontend/components/build-dashboard.tsx`
- `frontend/components/build-detail-modal.tsx`
- `frontend/components/SkeletonPulse.tsx`
- `frontend/components/TableSkeleton.tsx`

**Acceptance Criteria**:
- [ ] Status badge colors updated (PENDING/RUNNING/COMPLETE/FAILED)
- [ ] Color contrast ≥4.5:1 (WCAG AA)
- [ ] EmptyState component created and integrated
- [ ] Empty states for: no builds, no parts, no test runs
- [ ] Skeleton animations smooth
- [ ] Responsive design verified
- [ ] All tests passing (791+)
- [ ] No accessibility regressions

**Tailwind Classes**:
```tailwind
Status Badges:
PENDING:  bg-yellow-100 text-yellow-800 border-yellow-200
RUNNING:  bg-blue-100 text-blue-800 border-blue-200
COMPLETE: bg-green-100 text-green-800 border-green-200
FAILED:   bg-red-100 text-red-800 border-red-200

Empty State Container: flex flex-col items-center justify-center py-12 px-4 text-center
CTA Button: bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors
```

**Reference**: `docs/implementation-planning/PHASE-5-PHASE-1-IMPLEMENTATION-PLAN.md` (lines 95-200)

---

### Issue #256: Interactive States & Hover Effects (Dev-2)

**Files to Modify**:
- `frontend/components/Button.tsx`
- `frontend/components/build-dashboard.tsx`
- Form input components
- `frontend/components/Pagination.tsx`

**Acceptance Criteria**:
- [ ] All buttons have visible hover state
- [ ] Buttons scale on click (97% → 100%)
- [ ] Focus rings visible on Tab navigation
- [ ] Table rows highlight on hover
- [ ] Form inputs show focus ring
- [ ] Transitions smooth (150-200ms)
- [ ] No performance regression
- [ ] Responsive verified

**Tailwind Classes**:
```tailwind
Button States:
Base:   bg-blue-600 text-white
Hover:  hover:bg-blue-700 hover:shadow-lg
Active: active:scale-95
Focus:  focus:ring-2 focus:ring-blue-500 focus:outline-none

Transitions: transition-all duration-150 ease-out

Table Row Hover: hover:bg-gray-50 transition-colors duration-150

Form Input Focus: focus:ring-2 focus:ring-blue-500 focus:border-transparent
```

**Reference**: `docs/implementation-planning/PHASE-5-PHASE-1-IMPLEMENTATION-PLAN.md` (lines 203-307)

---

### Issue #257: Form & Accessibility Polish (Dev-3)

**Files to Modify**:
- `frontend/components/FileUploader.tsx`
- Form input components
- `frontend/components/build-detail-modal.tsx`
- Form submission handlers

**Acceptance Criteria**:
- [ ] Form error states styled clearly (red border + error text)
- [ ] Tooltips on field hover/focus
- [ ] File input custom styled (Tailwind)
- [ ] Modal close button accessible
- [ ] All form labels associated (htmlFor)
- [ ] Error messages announced to screen readers
- [ ] Required field indicators clear
- [ ] No accessibility regressions

**Tailwind Classes**:
```tailwind
Error State:
Input:      border-2 border-red-500 focus:ring-red-500
Error Text: text-red-600 text-sm mt-1
Error Icon: text-red-500 inline mr-1

Success State:
Input:        border-2 border-green-500
Success Text: text-green-600 text-sm mt-1
Success Icon: text-green-500 inline mr-1

Required Indicator: <span className="text-red-600 ml-1">*</span>
```

**Tooltip**: Use HTML title attribute initially (MVP):
```html
<input title="Help text here" />
```

**Reference**: `docs/implementation-planning/PHASE-5-PHASE-1-IMPLEMENTATION-PLAN.md` (lines 310-400)

---

## 🔄 Review Cycle Process

### When Reviewer Requests Changes

**CRITICAL**: Do NOT create a new branch!

1. **Switch to existing branch**:
   ```bash
   git switch feat/issue-#<N>-<description>
   ```

2. **Make fixes** (only files mentioned in feedback):
   ```bash
   vim frontend/components/StatusBadge.tsx  # Edit as needed
   ```

3. **Stage & commit**:
   ```bash
   git add frontend/components/StatusBadge.tsx
   git diff --cached  # Verify before commit
   git commit -m "fix(#N): Address review feedback
   
   - Fixed aria-label on icon
   - Optimized animation for low-end devices
   - Added mobile styles
   
   Co-authored-by: @reviewer-name"
   ```

4. **Push to same branch**:
   ```bash
   git push origin feat/issue-#<N>-<description>
   ```

5. **PR auto-updates automatically** — no new PR needed

---

## ✅ Acceptance Checklist

Before creating PR, verify:

- [ ] Branch created locally
- [ ] Changes made on correct branch
- [ ] All unit tests passing: `pnpm test --run`
- [ ] Linting clean: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
- [ ] Accessibility check: axe DevTools or Lighthouse
- [ ] Mobile responsive verified
- [ ] No console errors
- [ ] Commit message descriptive
- [ ] Ready to push

---

## 📞 Communication

**Daily Standup** (9:00 AM):
1. Blockers?
2. Completed since yesterday?
3. Today's focus?
4. On track for May 15?

**PR Feedback SLA**: 24 hours max  
**Escalation**: If blocked for >24 hours, tag Orchestrator

---

## 🎯 Success Criteria (Phase 1 Overall)

- ✅ All 3 PRs merged to main
- ✅ 791+ tests passing (no regressions)
- ✅ Lighthouse score ≥85
- ✅ WCAG AA compliance maintained
- ✅ Zero console errors
- ✅ Ready for Phase 2

---

**Timeline**: May 11 start → May 15 consolidation → May 16 gate pass  
**Questions?** Check `PHASE-5-ORCHESTRATION-SUMMARY.md` or ask Orchestrator
