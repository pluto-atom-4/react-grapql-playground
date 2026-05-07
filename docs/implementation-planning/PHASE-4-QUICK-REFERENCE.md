# ⚡ PHASE 4 QUICK REFERENCE

**Last Updated:** May 5, 2026 | **Status:** 🟢 Ready to Start

---

## 📊 Issue Status at a Glance

| # | Title | Status | Effort | Risk | Owner | Files |
|---|-------|--------|--------|------|-------|-------|
| 33 | FileUploader | ✅ DONE | 2h | LOW | N/A | frontend/components/FileUploader/ |
| 34 | Pagination UI | 🔵 OPEN | 1.75h | MEDIUM | Dev 2 | frontend/components/Pagination.tsx |
| 35 | Skeletons | 🔵 OPEN | 2.25h | LOW | Dev 3 | frontend/components/SkeletonLoader/ |
| 39 | Tailwind CSS | 🔵 OPEN | 1.5h | LOW | Dev 1 | frontend/components/*.css → classes |
| 40 | Accessibility | 🔵 OPEN | 3.5h | MEDIUM | Dev 1 | frontend/components/**/*.tsx + tests |

---

## 🎯 Timeline (Recommended)

```
Day 1 (May 6)      Day 2-3 (May 7-8)      Day 3-4 (May 8-9)      Day 5 (May 10)
┌──────────┐       ┌─────────────┐        ┌──────────────┐        ┌──────────┐
│ #39 CSS  │  ───> │ #34 Paging  │        │ #40 a11y     │        │ Cleanup  │
│ 1-2h     │       │ #35 Skeleton│  ──>   │ 2-3h         │   ───> │ Deploy   │
└──────────┘       │ parallel    │        │              │        │          │
                   │ 4-5h total  │        │              │        └──────────┘
                   └─────────────┘        └──────────────┘
```

**Effort:** 9.5h sequential | **3 developers:** 3-4h | **2 developers:** 6-7h

---

## 🔗 Dependencies

```
Phase 3 ✅ Complete
    ↓
#39 (Tailwind) - DAY 1
    ↓
#34 (Pagination) ──────────┐  (parallel)
#35 (Skeletons) ───────────┤
#40 (Accessibility after) ──┘
```

**Key:** No hard blocking issues. All can run in parallel after #39.

---

## ✅ Before You Start

- [ ] Phase 3 merged & 741 tests passing
- [ ] Feature branch created (`feat/issue-{#}-...`)
- [ ] GitHub issue assigned to you
- [ ] Read PHASE-4-ISSUE-BREAKDOWN.md for your issue

---

## 📋 Issue Quick View

### #34: Pagination UI (1.75 hours)
**What:** Add prev/next buttons, load 10 builds per page  
**Create:** `frontend/components/Pagination.tsx`  
**Modify:** GraphQL query, BuildDashboard  
**Test:** Component render, Apollo cache  
**Accept Criteria:** Page state, disabled buttons, data updates  

### #35: Loading Skeletons (2.25 hours)
**What:** Shimmer placeholders while loading  
**Create:** `frontend/components/SkeletonLoader/`  
**Modify:** Dashboard, Modal  
**Test:** Render, animation, CLS metric  
**Accept Criteria:** Matches layout, smooth animation, no shift  

### #39: Tailwind CSS (1.5 hours)
**What:** Convert CSS to Tailwind, remove .css files  
**Modify:** Components add classes, remove imports  
**Delete:** `.css` files  
**Test:** Visual regression, responsive  
**Accept Criteria:** No .css files, visual unchanged  

### #40: Accessibility WCAG AA (3.5 hours)
**What:** ARIA labels, keyboard nav, focus trap  
**Modify:** All components  
**Test:** axe, keyboard, screen reader  
**Accept Criteria:** 0 violations, Lighthouse ≥ 90  

---

## 🚀 Daily Standup Template

**Use this format (2 min/person):**

> **Yesterday:** I [completed/worked on] [issue] [specific task]  
> **Today:** I [plan to work on] [task]  
> **Blocker:** [If any] [issue] [mitigation]

**Example:**
> Yesterday: Completed #39 CSS→Tailwind conversion  
> Today: Implementing #34 Pagination component  
> Blocker: Need clarification on Apollo cache behavior → Checking docs

---

## 🧪 Test Commands

```bash
# Run all tests
pnpm test

# Run specific issue tests
pnpm test frontend/components/Pagination         # #34
pnpm test frontend/components/SkeletonLoader     # #35
pnpm test frontend/components/BuildDashboard     # Verify #39

# Accessibility audit (if configured)
pnpm test:a11y                                   # #40

# Build check (for #39, #40)
pnpm build
pnpm lint
```

---

## 📝 PR Template

```markdown
## Issue
Fixes #[issue_number]

## What Changed
- [Change 1]
- [Change 2]

## Acceptance Criteria
- [x] Criterion 1
- [x] Criterion 2

## Testing
- [x] Unit tests passing
- [x] Integration tests passing
- [x] Visual regression verified

## Screenshots (if applicable)
[Before/after]
```

---

## 🎯 Success Checklist

After completing your issue:
- [ ] Feature branch pushed
- [ ] PR created with description
- [ ] Tests passing (741+)
- [ ] No linting errors
- [ ] Code review approved
- [ ] Visual verification (if UI)
- [ ] Mobile responsive tested
- [ ] PR merged to main

---

## ⚠️ Common Issues & Solutions

**Issue #34 (Pagination)**
- Q: Data doesn't update on page change?
- A: Check Apollo cache.modify or refetchQueries

**Issue #35 (Skeletons)**
- Q: Skeleton has layout shift?
- A: Use exact dimensions as final content

**Issue #39 (Tailwind)**
- Q: Style missing after CSS removal?
- A: Use browser DevTools to verify all rules applied

**Issue #40 (Accessibility)**
- Q: axe still finding violations?
- A: Check aria-labels, roles, color contrast

---

## 🔍 File Locations

```
frontend/
  ├─ components/
  │  ├─ Pagination.tsx                [#34 CREATE]
  │  ├─ SkeletonLoader/               [#35 CREATE]
  │  │  ├─ TableSkeleton.tsx
  │  │  ├─ ModalSkeleton.tsx
  │  │  └─ skeleton.module.css
  │  ├─ BuildDashboard.tsx            [#34, #35, #39, #40 MODIFY]
  │  ├─ BuildDetailModal.tsx          [#35, #39, #40 MODIFY]
  │  └─ FileUploader/                 [#33 DONE]
  │
  ├─ lib/
  │  ├─ graphql/
  │  │  └─ queries.ts                 [#34 MODIFY - add limit/offset]
  │  └─ hooks/
  │     └─ useBuilds.ts               [#34 MODIFY - add params]
  │
  └─ __tests__/
     └─ components/
        ├─ Pagination.test.tsx        [#34 CREATE]
        ├─ SkeletonLoader/            [#35 CREATE]
        │  └─ SkeletonLoader.test.tsx
        └─ accessibility.test.tsx     [#40 CREATE]
```

---

## 📞 Resources

**Full Documentation:**
- PHASE-4-ORCHESTRATION-SUMMARY.md (10 min overview)
- PHASE-4-EXECUTION-PLAN.md (25 min detailed)
- PHASE-4-ISSUE-BREAKDOWN.md (detailed per issue)
- PHASE-4-DEPENDENCIES.md (dependency analysis)

**GitHub Issues:**
- Issue #34: https://github.com/pluto-atom-4/react-grapql-playground/issues/34
- Issue #35: https://github.com/pluto-atom-4/react-grapql-playground/issues/35
- Issue #39: https://github.com/pluto-atom-4/react-grapql-playground/issues/39
- Issue #40: https://github.com/pluto-atom-4/react-grapql-playground/issues/40

**Tools:**
- Tailwind CSS: https://tailwindcss.com/docs
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- axe DevTools: https://www.deque.com/axe/devtools/

---

## 💬 Communication Channels

**Daily Standup:** 9 AM EST (10 min)  
**Blocker Chat:** Real-time (Slack/Teams)  
**Code Review:** 24-hour turnaround  
**End-of-Day:** 5 PM EST (5 min sync)

---

**Print this page as a desk reference!**

**Phase 4 Ready: ✅ May 6, 2026**
