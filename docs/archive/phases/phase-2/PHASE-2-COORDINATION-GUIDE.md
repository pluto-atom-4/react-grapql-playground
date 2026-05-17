# Phase 2 Coordination Guide

**Prepared for**: Phase 2 Development Team (Issues #258-266)  
**Last Updated**: [Today - Post #275 Resolution]  
**Status**: ✅ READY (Blocker Resolved - Issue #275 CLOSED)  
**Reference**: 
- `docs/implementation-planning/CONFLICT-RESOLUTION-STRATEGY.md` (Learn from Phase 5 conflicts)
- `docs/COMPONENT-REGISTRY.md` (Component ownership and file reservations)
- `.copilot/copilot-instructions.md` (Workflow: One Issue = One Branch = One PR)

---

## Purpose

Phase 2 will run **3-4 issues in parallel** (#258, #259, #260, #261 with mobile sequence). This guide prevents the coordination conflicts that occurred in Phase 5 (PR #273 with 6 file conflicts).

✅ **BLOCKER STATUS**: Issue #275 (build error) has been RESOLVED in commit 9de8787e48250f224649dc008ad79c81769f15e1.

**Golden Rule**: **"One Issue = One Component = Reserved Files = No Overlap"**

---

## Table of Contents

1. [Quick Start Checklist](#quick-start-checklist)
2. [Component Registry Workflow](#component-registry-workflow)
3. [Branch Synchronization Strategy](#branch-synchronization-strategy)
4. [Dependency Tracking](#dependency-tracking)
5. [Emergency Conflict Resolution](#emergency-conflict-resolution)
6. [Weekly Sync Schedule](#weekly-sync-schedule)

---

## Quick Start Checklist

### Before You Start (Day 1 of Your Issue)

✅ **BLOCKER STATUS**: Issue #275 is RESOLVED (commit 9de8787)  
- [ ] Read `docs/COMPONENT-REGISTRY.md` completely (15 min)
- [ ] Find your issue (#258, #259, #260, or #261) in the registry
- [ ] List all files you'll create/modify
- [ ] Check if any files overlap with other issues
- [ ] Create your feature branch: `git checkout -b feat/issue-#XXX-description`
- [ ] Post in the issue: "Starting work on [list files]"

### During Development (Days 2-5)

- [ ] Every 2-3 days: `git fetch origin && git rebase origin/main`
- [ ] Test for conflicts: `git merge --no-commit --no-ff origin/main`
- [ ] If conflicts found → **communicate immediately** in issue
- [ ] Keep your commits atomic and well-documented

### Before Requesting Review (Day 6-7)

- [ ] Final sync: `git rebase origin/main`
- [ ] Test merge: `git merge --no-commit --no-ff origin/main`
- [ ] Force-push: `git push --force-with-lease origin feat/issue-#XXX-...`
- [ ] In PR description: reference COMPONENT-REGISTRY.md
- [ ] Note any files that might conflict with other issues

---

## Component Registry Workflow

### Step 1: Understand What's Already Built (Phase 5)

**These components are DONE and RESERVED** - Do NOT re-implement:

| Component | Files | Status | Do NOT Create Parallel |
|-----------|-------|--------|----------------------|
| FormInput | `frontend/components/FormComponents/FormInput.tsx` | ✅ Complete | Use existing |
| FormTextarea | `frontend/components/FormComponents/FormTextarea.tsx` | ✅ Complete | Use existing |
| AccessibleTooltip | `frontend/components/FormComponents/AccessibleTooltip.tsx` | ✅ Complete | Use existing |
| StatusBadge | `frontend/components/StatusBadge.tsx` | ✅ Complete | Use existing |
| EmptyState | `frontend/components/EmptyState.tsx` | ✅ Complete | Use existing |

**How to Use**: Simply import them
```typescript
import { FormInput, StatusBadge, EmptyState } from '@/components/...';
```

### Step 2: Identify YOUR Files (Phase 2)

Look up your issue in `docs/COMPONENT-REGISTRY.md`:

**Example for Issue #258 (Dashboard Performance)**:
```markdown
Files Reserved (EXCLUSIVE):
- frontend/app/dashboard/page.tsx (modifications)
- frontend/hooks/useDashboardData.ts (NEW)
- frontend/hooks/__tests__/useDashboardData.test.ts (NEW)

Can Reuse:
- FormComponents/* (do NOT modify)
- StatusBadge.tsx (do NOT modify)
```

### Step 3: Add Your File List to the Issue

Post in your GitHub issue (Day 1):
```markdown
## File Reservations for Issue #258

Exclusive files I'm creating/modifying:
- frontend/hooks/useDashboardData.ts (NEW)
- frontend/hooks/__tests__/useDashboardData.test.ts (NEW)
- frontend/app/dashboard/page.tsx (modifications only)

I will reuse:
- FormComponents/* (import only, no modifications)
- StatusBadge.tsx (import only, no modifications)

I will NOT touch:
- Any files in frontend/components/BuildList.tsx (Issue #259)
- Any files in frontend/components/PartList.tsx (Issue #260)
```

### Step 4: Verify NO Overlaps

**Before you create any files**:

```bash
# Check if your files conflict with others
git log --oneline --all --grep="Issue #259" origin/main | head -5
git log --oneline --all --grep="Issue #260" origin/main | head -5

# If they modify the same files → COMMUNICATE NOW
```

---

## Branch Synchronization Strategy

### The Problem We're Preventing

From PR #273 (Phase 5):
- PR #272 and PR #257 worked on same FormComponents independently
- Neither PR rebased after the other merged
- Conflict discovered only at merge time (too late!)
- Required 725 lines of deletion to clean up

### The Solution: Rebase Every 2-3 Days

**Day 1-2: Create and Start Work**
```bash
git checkout -b feat/issue-#258-dashboard-optimization
# Start implementing...
git add src/...
git commit -m "feat(#258): Initial dashboard hooks structure"
git push -u origin feat/issue-#258-dashboard-optimization
```

**Day 3-4: Sync with Main**
```bash
git fetch origin
git rebase origin/main
# If conflicts → resolve them EARLY and communicate in issue
git push --force-with-lease origin feat/issue-#258-dashboard-optimization
```

**Day 5-6: Sync Again Before Review**
```bash
git fetch origin
git rebase origin/main
git push --force-with-lease origin feat/issue-#258-dashboard-optimization
```

### Pre-Merge Conflict Detection

**Before requesting review**, test for conflicts WITHOUT merging:

```bash
git fetch origin
git merge --no-commit --no-ff origin/main
# This shows what WOULD happen if we merged

# Check for conflicts:
git status

# If no conflicts:
git merge --abort  # Undo the test merge
# You're good to push

# If conflicts:
git merge --abort
# Fix them and commit:
git rebase origin/main
# THEN resolve conflicts
git push --force-with-lease origin feat/issue-#258-...
```

### Why This Works

1. **Early detection**: See conflicts after 2-3 days, not at merge
2. **Small fixes**: Easier to fix one conflict than 6 like PR #273
3. **Communication**: Time to coordinate with other issues
4. **No surprises**: PR merge is smooth and quick

---

## Dependency Tracking

### Phase 2 Dependencies

```
✅ Issue #275: RESOLVED (commit 9de8787)
   │
   └─→ Issue #258: Dashboard Performance
       ↓ (dependency: provides useDashboardData hook)
       
       Issue #259: BuildList Component
       ↓ (uses hooks from #258)
       
       Issue #260: PartList Component
       ↓ (independent, but similar patterns to #259)
       
       Issue #261: Responsive Table
       ↓ (independent mobile work)
```

### Tracking Template

Add this to your issue description:

```markdown
## Dependencies

### This issue depends on:
- Issue #ABC (must be merged before this)
- Issue #XYZ (can be parallel if no file conflicts)

### This issue blocks:
- Issue #LMN (waiting for feature from this issue)

### Status:
- [ ] All dependencies resolved
- [ ] No file conflicts with parallel issues
- [ ] Ready for Phase 2 consolidation
```

### Dependency Resolution Commands

**Check if a dependency is merged**:
```bash
git log origin/main --oneline | grep "Issue #258"
# Shows: ✅ Issue #258 merged
```

**If you depend on Issue #258, rebase after it merges**:
```bash
git fetch origin
git rebase origin/main
# Now you have #258's features
```

---

## Emergency Conflict Resolution

### If Conflicts Are Discovered Early (During Development)

**1. Stop and assess** (5 min):
```bash
git fetch origin
git merge --no-commit --no-ff origin/main
git status  # See conflicted files
```

**2. Communicate immediately** in the GitHub issue:
```markdown
⚠️ Conflict detected with Issue #259!

Conflicted file: frontend/hooks/useDashboardData.ts
Status: Analyzing with Issue #259 developer

Next steps: Coordinate on design to avoid duplication
```

**3. Coordinate with other issue**:
- Post in BOTH issues (#258 and #259)
- Discuss which component should own the code
- Agree on interface/API contract
- One issue provides, other imports

**4. Resolve locally and test**:
```bash
git merge --abort  # Cancel the test merge
git rebase origin/main  # Resolve during rebase if needed
pnpm test  # Verify tests still pass
```

### If Conflicts Are Discovered at Merge Time (Like PR #273)

**Use the Resolution Checklist from CONFLICT-RESOLUTION-STRATEGY.md**:

1. **Investigation Phase** (5-10 min):
   - Identify which files conflict
   - Understand what each PR was building
   - Document the versions

2. **Analysis Phase** (10-15 min):
   - Check test coverage in each version
   - Review code style
   - Assess performance implications

3. **Decision Phase** (5-10 min):
   - Vote: Which version is better?
   - Can we hybrid approach?
   - Document reasoning

4. **Resolution Phase** (10-20 min):
   - Keep chosen version
   - Merge test suites
   - Run full test suite
   - Verify no regressions

5. **Documentation Phase** (5 min):
   - Update COMPONENT-REGISTRY.md
   - Add commit message explaining resolution
   - Comment on PR with summary

---

## Weekly Sync Schedule

### Monday (Team Kickoff)

**Duration**: 30 min  
**Attendees**: Phase 2 developers (#258, #259, #260)

**Agenda**:
- [ ] Review COMPONENT-REGISTRY.md updates
- [ ] Check file reservation status
- [ ] Identify any emerging conflicts
- [ ] Plan rebase timeline for the week

**Output**: Updated tracking document with conflict status

### Wednesday (Mid-Week Check)

**Duration**: 15 min (async in Slack/GitHub)

**Checklist**:
- [ ] All developers: "Rebased today? Yes/No"
- [ ] Any merge conflicts found? Yes → Report
- [ ] All tests passing? Yes/No
- [ ] Dependency status updated

### Friday (Pre-Review Preparation)

**Duration**: 30 min

**Agenda**:
- [ ] Final merge conflict test for each PR
- [ ] Review PR descriptions reference COMPONENT-REGISTRY.md
- [ ] Verify dependency tracking complete
- [ ] Plan consolidation merge for Monday

**Output**: PRs ready for review, no conflict surprises

---

## Template: Issue Kickoff Post

Use this template when you start your Phase 2 issue:

```markdown
## 🚀 Starting Phase 2 Implementation

### Context
✅ Issue #275 (build blocker) has been RESOLVED - Phase 2 is unblocked!
Reference commit: 9de8787e48250f224649dc008ad79c81769f15e1

### File Reservations
I will create/modify these files (exclusive to this issue):
- [ ] List all files here

### Component Reuse
I will reuse (import, no modifications):
- [ ] FormComponents/* (Phase 5)
- [ ] StatusBadge.tsx (Phase 5)
- [ ] Other reused components

### Not Touching (Exclusive to Other Issues)
- [ ] Issue #259 files (list)
- [ ] Issue #260 files (list)
- [ ] Issue #261 files (list)

### Sync Plan
- [ ] Initial branch created from origin/main
- [ ] Will rebase every 2-3 days
- [ ] Will test merge conflicts before requesting review

### Dependencies
- Depends on: [Issue list]
- Blocks: [Issue list]

Reference: `docs/COMPONENT-REGISTRY.md` and `docs/implementation-planning/PHASE-2-COORDINATION-GUIDE.md`
```

---

## Critical Rules for Phase 2

```
1. ✅ DO: Read COMPONENT-REGISTRY.md before starting
2. ✅ DO: Reserve your files explicitly in the issue
3. ✅ DO: Rebase every 2-3 days (git rebase origin/main)
4. ✅ DO: Test merge conflicts before review (git merge --no-commit --no-ff origin/main)
5. ✅ DO: Communicate conflicts immediately

❌ DON'T: Create parallel implementations of FormComponents
❌ DON'T: Modify files reserved for other issues
❌ DON'T: Skip rebasing (causes conflicts at merge time)
❌ DON'T: Create new PRs for conflict fixes (fix in same PR)
❌ DON'T: Wait until merge time to find conflicts
```

---

## Tools & Commands Quick Reference

### Git Commands for Phase 2

```bash
# Create your feature branch (Day 1)
git fetch origin
git checkout -b feat/issue-#258-description

# Sync with main (every 2-3 days)
git fetch origin
git rebase origin/main

# Test for merge conflicts (before requesting review)
git merge --no-commit --no-ff origin/main
git merge --abort  # Don't actually merge

# Force-push safely after rebase
git push --force-with-lease origin feat/issue-#258-...

# Check what's in main
git log origin/main --oneline | head -20

# See which branch you're on
git branch -v
```

### Verification Steps

```bash
# Verify no conflicts
git merge --no-commit --no-ff origin/main
git status
# If no conflicts shown, you're good:
git merge --abort

# Verify tests pass
pnpm test

# Verify linting
pnpm lint

# Verify build
pnpm build
```

---

## Troubleshooting

### "I rebased and now I'm ahead of main"

This is correct! Your feature branch has your commits plus main's commits.

```bash
git branch -v
# Shows: feat/issue-#258-... origin/feat/issue-#258-... [ahead 5]
# This is good ✓
```

### "I see conflicts during rebase"

Stop and communicate in the issue:

```bash
git rebase --abort  # Cancel rebase
# Post in GitHub issue with conflict details
# Coordinate with other issue owner
```

### "Other issue modified the same file I'm using"

1. Determine who should own the file
2. One issue provides, other imports
3. Update COMPONENT-REGISTRY.md with coordination
4. Coordinate in GitHub issues

### "I accidentally made a commit to wrong branch"

```bash
git reset --soft HEAD~1  # Undo commit, keep changes
git stash  # Save changes
git checkout feat/issue-#XXX-correct-branch
git stash pop  # Apply changes to correct branch
git commit -m "..."
```

---

## Interview Talking Points

When discussing Phase 2 coordination:

1. ✅ **"Issue #275 blocker resolved"**: Frontend build error fixed in commit 9de8787, Phase 2 ready to start immediately.

2. **"We documented lessons from Phase 5"**: Reference how PR #273 had 6 file conflicts due to parallel FormComponents work.

3. **"Component registry prevents duplication"**: This guide ensures each issue owns specific files.

4. **"Early conflict detection saves time"**: Rebasing every 2-3 days finds conflicts after days, not at merge.

5. **"Clear ownership prevents stepping on toes"**: Each developer knows exactly which files they own.

6. **"Dependency tracking improves planning"**: Issues explicitly document what they depend on, and blockers are resolved upfront.

---

**Last Updated**: [Today - Post #275 Resolution]  
**Blocker Status**: ✅ CLOSED: Issue #275 (commit 9de8787e48250f224649dc008ad79c81769f15e1)
**Next Update**: After Phase 2 completes (consolidation review)  
**Questions?**: Post in your Phase 2 issue or contact the orchestrator
