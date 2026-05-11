# Issue #40 Orchestration: Complete Execution Package

> **Status:** Ready for Developer Execution | **Date:** May 11, 2026  
> **Target:** Issue #40 Complete by May 14, 2026 | **Phase 4:** 80% → 100%

---

## 📚 Documentation Files (Read in This Order)

### 1. **ISSUE-40-DEVELOPER-GUIDE.md** ⭐ START HERE
   - **For:** First-time developers, quick orientation
   - **Contains:** 5-minute quick start, phase overviews, implementation patterns
   - **Time to read:** 15 minutes
   - **Key sections:**
     - Quick Start (5 min)
     - Phase Overview (high-level)
     - Implementation patterns (code examples)
     - Common gotchas

### 2. **ISSUE-40-TASK-SUMMARY.md** 📋 TASK REFERENCE
   - **For:** Daily work tracking, which task comes next
   - **Contains:** All 45 tasks organized by phase, SQL commands, progress tracking
   - **Time to read:** 10 minutes (then reference daily)
   - **Key sections:**
     - 45 tasks by phase (table format)
     - Effort estimates + dependencies
     - SQL tracking commands
     - Completion milestone checklist
     - 12 acceptance criteria tracker

### 3. **ISSUE-40-ORCHESTRATION-PLAN.md** 📊 FULL PLAN
   - **For:** Project managers, architecture overview, detailed planning
   - **Contains:** Complete execution roadmap with phases, dependencies, timelines
   - **Time to read:** 30 minutes
   - **Key sections:**
     - Detailed phase breakdown (8 phases)
     - Parallelization strategy
     - Component modification guide
     - Success criteria
     - Reference resources

---

## 🎯 45 Atomic Tasks Overview

| Phase | Tasks | Effort | Focus |
|-------|-------|--------|-------|
| Phase 1: Analysis | 5 | 1.3h | Audit current state, identify gaps |
| Phase 2: ARIA | 8 | 2.1h | Add labels, roles, semantic HTML |
| Phase 3: Keyboard | 6 | 1.8h | Tab order, Escape, focus trap |
| Phase 4: Focus | 4 | 1.3h | Focus ring, first element, restore |
| Phase 5: Semantic | 6 | 1.5h | Sections, forms, error roles, loading |
| Phase 6: Testing | 8 | 2.7h | axe, WAVE, Lighthouse, manual tests |
| Phase 7: Automated | 4 | 1.6h | Write keyboard + ARIA + focus tests |
| Phase 8: Rollout | 4 | 1.1h | Docs, README, PR, final QA |
| **TOTAL** | **45** | **~13h** | **Full WCAG AA compliance** |

---

## 📊 SQL Task Tracking

All 45 tasks live in SQLite session database with:
- ✅ Status tracking (pending → in_progress → done)
- ✅ Effort estimates (15-30 min per task)
- ✅ Dependencies (35 dependency links tracked)
- ✅ Phase organization (phase1- through phase8- prefixes)

**Quick Commands:**
```sql
-- View all pending tasks
SELECT id, title FROM todos WHERE status = 'pending' ORDER BY id;

-- Mark task in progress
UPDATE todos SET status = 'in_progress' WHERE id = 'phase1-audit-modal';

-- Mark task done
UPDATE todos SET status = 'done' WHERE id = 'phase1-audit-modal';

-- View task dependencies
SELECT td.todo_id, td.depends_on, t.status 
FROM todo_deps td JOIN todos t ON td.depends_on = t.id
WHERE td.todo_id = 'phase2-aria-buttons-modal';

-- View progress by phase
SELECT SUBSTR(id, 1, 7) as phase, COUNT(*) as total, 
  SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed
FROM todos GROUP BY phase;
```

---

## 🎯 12 Acceptance Criteria (All Mapped)

✅ **1. All buttons have aria-label or meaningful text**  
✅ **2. Modal has role="dialog" and aria-modal="true"**  
✅ **3. Keyboard navigation works (Tab through all)**  
✅ **4. Escape key closes modal**  
✅ **5. Focus trap in modal (Tab stays inside)**  
✅ **6. Focus indicators visible (outline or ring)**  
✅ **7. axe DevTools finds 0 violations**  
✅ **8. WAVE audit finds 0 errors**  
✅ **9. Tested with screen reader (NVDA/VoiceOver)**  
✅ **10. Lighthouse Accessibility score ≥ 90**  
✅ **11. Contrast ratio ≥ 4.5:1 (WCAG AA)**  
✅ **12. Tests verify keyboard navigation**  

Each criterion is mapped to specific tasks. See ISSUE-40-ORCHESTRATION-PLAN.md for mapping table.

---

## 🚀 Getting Started (5 Minutes)

### Step 1: Read Quick Start
```bash
head -100 ISSUE-40-DEVELOPER-GUIDE.md
```

### Step 2: Install Tools
- axe DevTools (Chrome extension)
- WAVE (browser extension)
- NVDA (Windows) or enable VoiceOver (Mac)

### Step 3: Review First Phase
- Read Phase 1 section in ISSUE-40-DEVELOPER-GUIDE.md
- Understand what tasks 1-5 require

### Step 4: Start First Task
```sql
UPDATE todos SET status = 'in_progress' WHERE id = 'phase1-audit-modal';
```

---

## 📈 Components to Modify

### High Priority (Modify First)
1. **build-detail-modal.tsx** - Main modal
   - Add: `role="dialog" aria-modal="true"`
   - Add: aria-label to buttons
   - Implement: Escape handler
   - Add: focus trap

2. **build-dashboard.tsx** - Dashboard
   - Add: aria-label to buttons
   - Add: tab order

3. **Pagination.tsx** - Pagination
   - Add: `role="navigation"`
   - Add: button labels

### Medium Priority
4. **FileUploader/FileUploader.tsx**
5. **test-run-details-panel.tsx**

### Lower Priority
6. **toast-notification.tsx**
7. **SkeletonLoader/**
8. **create-build-modal.tsx**

---

## ⏱️ Timeline

### Single Developer: 4 Days
- Day 1: Phases 1-2 (ARIA labels)
- Day 2: Phases 3-4 (Keyboard + focus)
- Day 3: Phases 5-6 (Semantic + testing)
- Day 4: Phases 7-8 (Automated tests + docs)

**~13 hours total** (fits May 11-14 timeline)

### Two Developers: 2-3 Days
- Dev 1: Phases 1, 3, 5 (Analysis, Keyboard, Semantic)
- Dev 2: Phases 2, 4, 6 (ARIA, Focus, Testing)
- Both: Phases 7-8

**~7 hours parallel** (faster timeline)

---

## ✅ Success Checklist

Before merging to main:
- [ ] All 12 acceptance criteria verified ✓
- [ ] Phase 1 analysis complete
- [ ] Phase 2 ARIA labels added
- [ ] Phase 3 keyboard navigation working
- [ ] Phase 4 focus management complete
- [ ] Phase 5 semantic HTML applied
- [ ] Phase 6 testing passing (manual + automated)
- [ ] Phase 7 tests all passing
- [ ] Phase 8 documentation complete
- [ ] Lighthouse a11y: ≥ 90
- [ ] axe DevTools: 0 violations
- [ ] WAVE: 0 errors
- [ ] Screen reader: all content announced
- [ ] Keyboard-only: fully functional

---

## 🔗 Key Resources

- [WCAG 2.1 Level AA](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [React Accessibility](https://react.dev/reference/react-dom/components#common-props)
- [MDN Keyboard Events](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [NVDA Screen Reader](https://www.nvaccess.org/)

---

## 📞 FAQ

**Q: Where do I start?**  
A: Read ISSUE-40-DEVELOPER-GUIDE.md (15 min), then start Phase 1 tasks.

**Q: How do I track progress?**  
A: Use SQL commands to mark tasks in_progress and done. See ISSUE-40-TASK-SUMMARY.md.

**Q: What if I get stuck?**  
A: Check "Common Gotchas" section in ISSUE-40-DEVELOPER-GUIDE.md or review WCAG standards.

**Q: Can I parallelize work?**  
A: Yes! See "Parallelization Strategy" in ISSUE-40-ORCHESTRATION-PLAN.md.

**Q: What's the minimum viable Phase?**  
A: Phase 1-2 (ARIA labels). Everything else builds on these.

---

## 🎯 Phase 4 Context

This is Issue #40 of Phase 4 (UX Features & Accessibility):

- ✅ #33: FileUploader (May 5) - Complete
- ✅ #39: Tailwind (May 7) - Complete
- ✅ #34: Pagination (May 10) - Complete
- ✅ #35: Skeletons (May 10) - Complete
- 🔵 #40: Accessibility (May 11+) - **YOU ARE HERE** ← Ready to start

After Issue #40: Phase 4 = 100% complete ✅

---

## 📋 Files Location

All documentation in: `docs/implementation-planning/`

```
├── ISSUE-40-README.md (this file)
├── ISSUE-40-DEVELOPER-GUIDE.md ⭐ START HERE
├── ISSUE-40-TASK-SUMMARY.md (daily reference)
└── ISSUE-40-ORCHESTRATION-PLAN.md (full plan)
```

SQL database: Session store (45 tasks, 35 dependencies)

---

**Created:** May 11, 2026  
**Status:** 🟢 Ready for Developer Execution  
**Next Milestone:** Issue #40 Complete by May 14, 2026  

---

**Start here:** Read ISSUE-40-DEVELOPER-GUIDE.md (15 minutes) → Begin Phase 1 → Execute following the plan! 🚀
