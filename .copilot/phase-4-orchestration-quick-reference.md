# 🚀 Phase 4 Orchestration Quick Reference

**Ready to Execute:** May 7, 2026  
**Phase:** 4 (UX Features & Accessibility)  
**Issues:** #34, #35, #39, #40  
**Strategy:** Parallel execution (3-4 developers, 3-5 hours)

---

## 📋 EXECUTE NOW: Orchestrator Setup

### Step 1: Create Feature Branches (2 min)

```bash
cd /home/pluto-atom-4/Documents/stoke-full-stack/react-grapql-playground

# Create feature branches from latest main
git fetch origin main
git branch feat/issue-#34-pagination origin/main
git branch feat/issue-#35-skeletons origin/main
git branch feat/issue-#39-tailwind origin/main
git branch feat/issue-#40-accessibility origin/main

# Verify branches created
git branch -a | grep feat/issue
```

### Step 2: Create Git Worktrees (3 min)

```bash
# Create isolated worktrees for parallel agent work
git worktree add ../feat-34 feat/issue-#34-pagination
git worktree add ../feat-35 feat/issue-#35-skeletons
git worktree add ../feat-39 feat/issue-#39-tailwind
git worktree add ../feat-40 feat/issue-#40-accessibility

# Verify worktrees
git worktree list
# Expected output:
# /path/to/repo           [main]
# /path/to/feat-34        [feat/issue-#34-pagination]
# /path/to/feat-35        [feat/issue-#35-skeletons]
# /path/to/feat-39        [feat/issue-#39-tailwind]
# /path/to/feat-40        [feat/issue-#40-accessibility]
```

### Step 3: Assign Agents (1 min)

| Agent | Issue | File | Duration | Start |
|-------|-------|------|----------|-------|
| Developer 1 | #34 (Pagination) | `../feat-34/` | 1.75h | Now |
| Developer 2 | #35 (Skeletons) | `../feat-35/` | 2.25h | Now |
| Developer 3 | #39 (Tailwind) | `../feat-39/` | 1.5h | Now |
| Developer 4 | #40 (Accessibility) | `../feat-40/` | 3.5h | Now |

---

## 👨‍💻 AGENT INSTRUCTIONS (Send to Each Developer)

### Agent 1: Issue #34 - Pagination UI

**Workspace:** `../feat-34/`  
**Duration:** ~1.75 hours

```bash
# Step 1: Navigate to worktree
cd ../feat-34

# Step 2: Verify you're on the right branch
git status  # Should show: On branch feat/issue-#34-pagination

# Step 3: Implement pagination
# Reference: docs/implementation-planning/PHASE-4-ISSUE-BREAKDOWN.md (Pagination section)
# Tasks:
#   - Update GET_BUILDS GraphQL query (add limit, offset params)
#   - Create <Pagination /> component with prev/next buttons
#   - Create useBuilds(limit, offset) hook
#   - Integrate into BuildDashboard
#   - Write unit tests for component + hook

# Step 4: Commit your work (atomic commits)
git commit -m "feat: #34 add pagination component

- New <Pagination /> component with prev/next buttons
- Updated GET_BUILDS query with limit/offset params
- New useBuilds() hook for page state management

Closes #34"

# Step 5: Push to remote
git push -u origin feat/issue-#34-pagination

# Step 6: Create PR
gh pr create \
  --title "feat: #34 - Implement Pagination UI" \
  --body "## Summary

Adds pagination to the builds dashboard for better performance.

## Changes
- New <Pagination /> component with navigation buttons
- Updated GET_BUILDS query with limit/offset parameters
- New useBuilds() hook with page state management
- Integrated into BuildDashboard

## Testing
- Unit tests for Pagination component
- Hook tests for page calculation
- Integration tests with MockedProvider

Closes #34" \
  --base main
```

**Success Criteria:**
- ✅ Pagination component renders with correct button states
- ✅ Page navigation works correctly
- ✅ Apollo query accepts pagination params
- ✅ All unit + integration tests passing
- ✅ PR created and visible on GitHub

---

### Agent 2: Issue #35 - Loading Skeletons

**Workspace:** `../feat-35/`  
**Duration:** ~2.25 hours

```bash
# Step 1: Navigate to worktree
cd ../feat-35

# Step 2: Verify you're on the right branch
git status  # Should show: On branch feat/issue-#35-skeletons

# Step 3: Implement skeletons
# Reference: docs/implementation-planning/PHASE-4-ISSUE-BREAKDOWN.md (Skeletons section)
# Tasks:
#   - Create <TableSkeleton /> component
#   - Create <ModalSkeleton /> component
#   - Add shimmer animation CSS (gradient animation)
#   - Integrate into BuildDashboard (show during Apollo loading)
#   - Integrate into BuildDetailModal (show during data fetch)
#   - Test on mobile (responsive, no CLS)

# Step 4: Commit your work
git commit -m "feat: #35 add loading skeleton components

- New <TableSkeleton /> component with shimmer animation
- New <ModalSkeleton /> component
- Integrated into BuildDashboard loading state
- Integrated into BuildDetailModal loading state
- Verified responsive on mobile (no CLS)

Closes #35"

# Step 5: Push to remote
git push -u origin feat/issue-#35-skeletons

# Step 6: Create PR
gh pr create \
  --title "feat: #35 - Add Loading Skeletons" \
  --body "## Summary

Adds professional loading skeleton components with smooth shimmer animation.

## Changes
- New <TableSkeleton /> component matching table structure
- New <ModalSkeleton /> component matching modal structure
- Smooth shimmer animation (1.5s loop)
- Integrated into BuildDashboard and BuildDetailModal

## Testing
- Skeleton render tests
- Animation CSS verification
- Mobile responsive tests (no layout shift)
- Lighthouse CLS score: 0

Closes #35" \
  --base main
```

**Success Criteria:**
- ✅ Skeleton components render correctly
- ✅ Shimmer animation is smooth (60 FPS, no jank)
- ✅ Skeleton disappears instantly when data loads
- ✅ Mobile responsive (no CLS)
- ✅ All tests passing
- ✅ PR created and visible on GitHub

---

### Agent 3: Issue #39 - Replace CSS with Tailwind

**Workspace:** `../feat-39/`  
**Duration:** ~1.5 hours

```bash
# Step 1: Navigate to worktree
cd ../feat-39

# Step 2: Verify you're on the right branch
git status  # Should show: On branch feat/issue-#39-tailwind

# Step 3: Migrate CSS to Tailwind
# Reference: docs/implementation-planning/PHASE-4-ISSUE-BREAKDOWN.md (Tailwind section)
# Tasks:
#   - Find all .css files in frontend/components/
#   - Convert CSS rules to Tailwind classes
#   - Update component imports (remove .css)
#   - Verify responsive design (sm:, md:, lg: breakpoints)
#   - Delete .css files
#   - Run visual regression tests

# Step 4: Commit your work
git commit -m "refactor: #39 migrate custom CSS to Tailwind

- Migrated all component CSS to Tailwind classes
- Removed custom CSS files
- Verified responsive breakpoints (sm, md, lg)
- Updated component imports

Closes #39"

# Step 5: Push to remote
git push -u origin feat/issue-#39-tailwind

# Step 6: Create PR
gh pr create \
  --title "refactor: #39 - Consolidate to Tailwind CSS" \
  --body "## Summary

Consolidates custom CSS into Tailwind classes for consistency and maintainability.

## Changes
- Migrated BuildDashboard CSS to Tailwind classes
- Migrated BuildDetailModal CSS to Tailwind classes
- Removed custom .css files
- Verified responsive design on mobile/tablet/desktop

## Testing
- Visual regression tests pass
- Responsive design verified (sm, md, lg)
- Build succeeds with no CSS errors
- All tests passing

Closes #39" \
  --base main
```

**Success Criteria:**
- ✅ No .css files remain in components/
- ✅ All styles converted to Tailwind classes
- ✅ Responsive design working (mobile/tablet/desktop)
- ✅ Visual appearance unchanged (regression test)
- ✅ All tests passing
- ✅ Build succeeds
- ✅ PR created and visible on GitHub

---

### Agent 4: Issue #40 - Accessibility (WCAG AA)

**Workspace:** `../feat-40/`  
**Duration:** ~3.5 hours

```bash
# Step 1: Navigate to worktree
cd ../feat-40

# Step 2: Verify you're on the right branch
git status  # Should show: On branch feat/issue-#40-accessibility

# Step 3: Implement accessibility improvements
# Reference: docs/implementation-planning/PHASE-4-ISSUE-BREAKDOWN.md (Accessibility section)
# Tasks:
#   - Add ARIA labels to all interactive elements (buttons, modals, inputs)
#   - Add semantic HTML (<button>, <nav>, <main>, <section>, <label>)
#   - Implement keyboard navigation (Tab, Enter, Space, Escape)
#   - Add focus visible indicators (focus:ring-2)
#   - Implement modal focus trap (Tab stays inside modal)
#   - Verify color contrast (4.5:1 for WCAG AA)
#   - Test with screen reader (NVDA or VoiceOver)

# Step 4: Commit your work (multiple commits for clear history)
git commit -m "feat: #40 add ARIA labels and semantic HTML

- Add aria-label to all buttons
- Add role=\"dialog\" to modal
- Use semantic elements (<button>, <nav>, <main>)

Closes #40 (part 1)"

git commit -m "feat: #40 implement keyboard navigation

- Tab through all interactive elements
- Enter/Space activates buttons
- Escape key closes modal

Closes #40 (part 2)"

git commit -m "feat: #40 add focus management and focus trap

- Focus visible indicators (focus:ring-2)
- Modal focus trap (Tab stays inside)
- First element focused on modal open

Closes #40 (part 3)"

git commit -m "feat: #40 verify color contrast and screen reader

- Verify 4.5:1 contrast ratio (WCAG AA)
- Test with screen reader
- Fix any violations

Closes #40 (final)"

# Step 5: Push to remote
git push -u origin feat/issue-#40-accessibility

# Step 6: Create PR
gh pr create \
  --title "feat: #40 - Implement WCAG AA Accessibility" \
  --body "## Summary

Adds comprehensive accessibility improvements including ARIA labels, keyboard navigation, focus management, and WCAG AA compliance.

## Changes
- Added ARIA labels to all interactive elements
- Semantic HTML elements (<button>, <nav>, <main>, <section>, <label>)
- Full keyboard navigation (Tab, Enter, Space, Escape)
- Focus visible indicators with Tailwind focus:ring
- Modal focus trap implementation
- Verified color contrast (4.5:1 ratio)

## Testing
- Unit tests for keyboard handlers
- Integration tests for focus trap
- Manual screen reader testing (VoiceOver/NVDA)
- axe DevTools: 0 violations
- Lighthouse a11y score: 90+

Closes #40" \
  --base main
```

**Success Criteria:**
- ✅ All buttons have aria-label or meaningful text
- ✅ Modal has role=\"dialog\" and aria-modal=\"true\"
- ✅ Full keyboard navigation (Tab, Enter, Escape)
- ✅ Focus trap in modal (Tab stays inside)
- ✅ Focus indicators visible
- ✅ axe DevTools: 0 violations
- ✅ Lighthouse a11y: ≥ 90
- ✅ Screen reader tested (VoiceOver or NVDA)
- ✅ All tests passing
- ✅ PR created and visible on GitHub

---

## 📊 ORCHESTRATOR MONITORING

### Monitor Progress (Every 30 minutes)

```bash
# Check PR creation status
gh pr list --state open

# Check test status per issue
gh pr view <pr-number> --json title,statusCheckRollup

# Monitor worktrees
git worktree list

# Check commits per branch
git log main..feat/issue-#34-pagination --oneline
git log main..feat/issue-#35-skeletons --oneline
git log main..feat/issue-#39-tailwind --oneline
git log main..feat/issue-#40-accessibility --oneline
```

### Resolve Blockers

If an agent reports being blocked:

```bash
# Step 1: Investigate
cd ../feat-<N>  # Go to agent's worktree
git status      # Check for conflicts
pnpm test --run # Check test failures

# Step 2: Communicate
# Share error messages and help troubleshoot

# Step 3: Escalate if needed
# If > 30 minutes blocked, escalate to reviewer or escalation agent
```

---

## 🎯 SUCCESS METRICS

### Per Agent (Individual Success)

- ✅ Feature branch created with correct naming
- ✅ Issue implementation complete (all AC met)
- ✅ All tests passing locally
- ✅ Commit messages reference issue
- ✅ PR created with comprehensive description
- ✅ PR visible on GitHub (https://github.com/org/repo/pulls)

### Phase Completion (Overall Success)

- ✅ 4 open PRs (one per issue)
- ✅ 741+ tests passing
- ✅ 0 merge conflicts
- ✅ All acceptance criteria met
- ✅ Code review feedback addressed
- ✅ All 4 PRs merged to main
- ✅ Worktrees removed
- ✅ Phase 5 ready to start

---

## 🧹 CLEANUP (After Merge)

```bash
# After each PR is merged
gh pr merge <pr-number> --merge

# Remove worktree
git worktree remove ../feat-<N>

# Verify cleanup
git worktree list  # Should only show main repo
git branch -a | grep feat/issue  # Should be empty (deleted)
```

---

## 📞 QUICK REFERENCE

| Need | Command |
|------|---------|
| Check status | `gh pr list --state open` |
| View PR details | `gh pr view <pr-number>` |
| View test results | `gh pr view <pr-number> --json statusCheckRollup` |
| Monitor worktrees | `git worktree list` |
| Check agent progress | `git log main..feat/issue-#<N>-* --oneline` |
| Merge PR | `gh pr merge <pr-number> --merge` |
| Remove worktree | `git worktree remove ../feat-<N>` |

---

## 📝 TIMELINE ESTIMATE

| Time | Activity |
|------|----------|
| Now | Orchestrator: Create branches, worktrees, dispatch agents |
| 0-30 min | All agents: Start work, initial commits |
| 30-90 min | All agents: Core implementation, unit tests |
| 90-180 min | All agents: Integration tests, PR creation |
| 180-240 min | All agents: Finish work, push to remote |
| 240+ min | Reviewer: Code review, feedback |
| N+60 min | Orchestrator: Merge PRs, verify all tests, cleanup |

**Total Parallel Time:** ~3-4 hours (vs 9.5 sequential)

---

**Status:** ✅ Ready to Execute  
**Start:** Now (May 7, 2026)  
**Target Completion:** Today + 4-5 hours  
**Next Phase:** Phase 5 (Testing Enhancements)
