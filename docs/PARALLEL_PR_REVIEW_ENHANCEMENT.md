# 🔄 Parallel PR Review & Repeated Tasks Enhancement

**Status**: Enhancement for multi-agent orchestration  
**Date**: 2026-05-09  
**Purpose**: Handle repeated implementation tasks across multiple PRs in parallel  
**Key Improvement**: Developer agents track existing feature branches instead of creating new ones; Reviewer agent can create temporary work branches for integration testing without pushing PRs.

---

## 📋 Executive Summary

**Current Flow**:
```
Orchestrator → Developer (create branch, implement, push PR) 
            → Developer (next issue)
            → Reviewer (consolidate PRs)
```

**Enhanced Flow** (for repeated tasks / parallel PR reviews):
```
Orchestrator reads multiple open PRs
    ↓
Developer Agent tracks EXISTING feature branches (no new branch creation)
    ↓
Developer implements fixes on tracked feature branches
    ↓
Developer pushes updates to existing PRs (same branch, force-push if needed)
    ↓
Reviewer Agent creates TEMPORARY work branch for cross-PR testing
    ↓
Reviewer merges all feature branches into work branch (no PR)
    ↓
Reviewer tests, validates, reports findings
    ↓
Developer applies fixes to original feature branches (tracked from PR)
    ↓
Cycle repeats (loop until all PRs approved)
```

---

## 🎯 Key Rules for Enhanced Workflow

### Rule 1: Developer Agent Tracks Existing Feature Branches

**When**: Implementing fixes/changes for an open PR  
**What**: Developer agent IDENTIFIES the original feature branch from PR  
**How**: 
```bash
# Find the PR's feature branch
gh pr view <PR-NUMBER> --json headRefName
# Returns: feat/issue-#<N>-description

# Check out the EXISTING branch (don't create new one)
git branch -v  # List branches
git switch feat/issue-#<N>-description  # Switch to existing feature branch
```

**Why**: Keeps all changes for a PR on one branch, maintains history, simplifies merging.

**✅ Correct Approach**:
```
PR #245: feat/issue-#35-add-skeleton-loading
    ↓
Developer: Checkout existing feat/issue-#35-add-skeleton-loading
Developer: Implement review fixes
Developer: git push origin feat/issue-#35-add-skeleton-loading (updates PR #245)
```

**❌ Incorrect Approach**:
```
PR #245: feat/issue-#35-add-skeleton-loading
    ↓
Developer: Creates NEW branch fix/pull-request-245-skeleton-loading
Developer: Implements fixes
Developer: Creates NEW PR #250 for fixes
Result: Messy, fragmented, hard to track
```

---

### Rule 2: Developer Commits to Tracked Feature Branch

**When**: Fixing issues raised in PR review  
**Command**: 
```bash
# Already on the tracked feature branch
git add [reviewed files only]
git commit -m "fix(#35): Address review feedback

- Fix issue 1 from review
- Fix issue 2 from review

Co-Authored-By: Reviewer <reviewer@example.com>"

git push origin feat/issue-#35-add-skeleton-loading
```

**Result**: 
- Original PR (#245) automatically updates with new commits
- No need for separate PR or force-push (unless rebasing)
- Clean commit history on the feature branch

**Branch Protection Consideration**:
- If branch is protected, additional commits from developer may require re-approval
- Reviewer acknowledges this and re-approves after fixes are pushed

---

### Rule 3: Reviewer Agent Creates TEMPORARY Work Branches (No PR)

**When**: Need to test multiple feature branches together BEFORE individual approval  
**What**: Create consolidation branch ONLY for testing/validation  
**Naming Convention**: `work/phase-<N>-consolidation` (NOT `feat/phase-...`)  
**Important**: DO NOT create a PR from work branch

**Workflow**:
```bash
# Step 1: Create work branch from main
git branch work/phase-4-consolidation origin/main

# Step 2: Switch to work branch
git switch work/phase-4-consolidation

# Step 3: Merge all feature branches for testing
git merge feat/issue-#35-add-skeleton-loading
git merge feat/issue-#40-fix-keyboard-nav
git merge feat/issue-#121-improve-modals

# Step 4: Run full test suite
pnpm test --run

# Step 5: Validate integration
pnpm lint
pnpm build

# Step 6: Document findings
# [Create summary of which PRs pass/need fixes]

# Step 7: Report findings to developer
# [Communicate back: "All tests pass except PR #245 needs fix in X"]

# Step 8: Reviewer DELETES work branch (no PR created)
git branch -d work/phase-4-consolidation
git push origin --delete work/phase-4-consolidation  # Clean up remote
```

**Key Constraint**: ✅ Reviewer can create work branch, but NEVER creates PR from it

---

### Rule 4: Repeated Task Cycle for Multiple PRs

**Scenario**: Multiple PRs open; some need fixes based on initial review

**Cycle 1: Initial Review & Fixes Identified**
```
Reviewer: Checkout work/phase-4-consolidation
Reviewer: Merge all feature branches
Reviewer: Run tests
Reviewer: Find issues in PR #245 and #246
Reviewer: Report findings
```

**Cycle 2: Developer Implements Fixes**
```
Developer: Checkout feat/issue-#35-add-skeleton-loading (from PR #245)
Developer: Implement fixes from reviewer feedback
Developer: git push origin feat/issue-#35-add-skeleton-loading
Developer: Repeat for other issues
```

**Cycle 3: Reviewer Re-validates**
```
Reviewer: Checkout work/phase-4-consolidation again
Reviewer: Delete and recreate from origin/main (clean start)
Reviewer: git merge all updated feature branches
Reviewer: Run tests again
Reviewer: All tests pass → Approve individual PRs
```

**Loop Until**: All PRs approved and tested together

---

## 🔧 Configuration Updates

### config.json: Parallel PR Review Section

Add to `.copilot/config.json`:

```json
"parallel_pr_review_with_repeated_tasks": {
  "enabled": true,
  "description": "Handle multiple open PRs with repeated fixes across cycles",
  "use_case": "When multiple feature branches need review and fixes in parallel",
  
  "developer_agent_behavior": {
    "feature_branch_handling": "TRACK existing feature branch from PR, don't create new one",
    "command_pattern": {
      "step_1": "gh pr view <PR-NUMBER> --json headRefName (identify feature branch)",
      "step_2": "git switch <existing-feature-branch> (checkout tracked branch)",
      "step_3": "Implement fixes based on review feedback",
      "step_4": "git add [reviewed files only]",
      "step_5": "git commit -m 'fix(#<N>): Address review feedback'",
      "step_6": "git push origin <existing-feature-branch> (updates original PR)"
    },
    "critical_rule": "NEVER create new branch like 'fix/pull-request-XXX-...'",
    "result": "All fixes committed to original feature branch; PR auto-updates"
  },
  
  "reviewer_agent_behavior": {
    "work_branch_handling": "CREATE temporary work branch for integration testing ONLY",
    "work_branch_naming": "work/phase-<N>-consolidation (use 'work/' prefix, NOT 'feat/')",
    "work_branch_purpose": [
      "Merge multiple feature branches for consolidated testing",
      "Run full test suite to validate integration",
      "Identify which PRs need fixes",
      "Report findings back to developers"
    ],
    "critical_rule": "DO NOT create PR from work branch; delete work branch after review",
    "workflow": {
      "step_1": "git branch work/phase-<N>-consolidation origin/main",
      "step_2": "git switch work/phase-<N>-consolidation",
      "step_3": "git merge feat/issue-#35-... (merge each feature branch)",
      "step_4": "pnpm test --run (validate all together)",
      "step_5": "Document findings and gaps",
      "step_6": "git branch -d work/phase-<N>-consolidation (cleanup)",
      "step_7": "Delete remote work branch: git push origin --delete work/phase-<N>-consolidation"
    },
    "result": "Clean test results; no orphaned branches; no unnecessary PRs"
  },
  
  "repeated_task_cycle": {
    "cycle_1_initial_review": {
      "agent": "reviewer",
      "actions": [
        "Create work/phase-<N>-consolidation",
        "Merge all open feature branches",
        "Run tests and identify failures",
        "Report which PRs need fixes"
      ]
    },
    "cycle_2_developer_fixes": {
      "agent": "developer",
      "actions": [
        "Track feature branch from PR",
        "Implement review feedback",
        "Push to same feature branch (updates PR)",
        "Commit: 'fix(#<N>): Address review feedback'"
      ]
    },
    "cycle_3_reviewer_validation": {
      "agent": "reviewer",
      "actions": [
        "Recreate work/phase-<N>-consolidation from origin/main",
        "Merge updated feature branches",
        "Run tests again",
        "Approve or request more fixes"
      ]
    },
    "loop_condition": "Repeat cycles 2-3 until all PRs approved and integrated"
  },
  
  "key_constraints": {
    "developer_agent": [
      "✅ Track existing feature branch from PR",
      "✅ Commit all fixes to same branch",
      "✅ Push to same branch (updates PR)",
      "❌ Never create new 'fix/pull-request-...' branches",
      "❌ Never create duplicate PRs"
    ],
    "reviewer_agent": [
      "✅ Create work/phase-<N>-consolidation for testing",
      "✅ Merge feature branches into work branch",
      "✅ Run full integration tests",
      "✅ Delete work branch after review",
      "❌ Never create PR from work branch",
      "❌ Never push work branch to remote permanently"
    ]
  }
}
```

### rules.json: Enhanced Sections

Add to `.copilot/rules.json`:

```json
"parallel_pr_review_workflow": {
  "enabled": true,
  "description": "Multiple agents review and fix multiple PRs in parallel cycles",
  "trigger": "Multiple open PRs requiring validation and fixes",
  
  "developer_agent_pr_tracking": {
    "required": true,
    "step_1_identify_branch": {
      "command": "gh pr view <PR-NUMBER> --json headRefName",
      "purpose": "Find the original feature branch for the PR",
      "example": "gh pr view 245 → returns: feat/issue-#35-add-skeleton-loading"
    },
    "step_2_switch_existing_branch": {
      "command": "git switch feat/issue-#<N>-<description>",
      "purpose": "Checkout the EXISTING feature branch (from PR)",
      "critical": "Don't create new branch; reuse existing feature branch",
      "validation": "git branch (should show *feat/issue-#<N>-...)"
    },
    "step_3_implement_review_fixes": {
      "task": "Implement all feedback from reviewer on tracked branch",
      "approach": "Same as initial implementation, just more targeted"
    },
    "step_4_commit_to_tracked_branch": {
      "command": "git add [reviewed files]; git commit -m 'fix(#<N>): Address review feedback'",
      "important": "All fixes go to SAME feature branch",
      "format": "fix(#<N>): [description of fix]\n\n- Point 1\n- Point 2\n\nCo-Authored-By: Reviewer Name"
    },
    "step_5_push_same_branch": {
      "command": "git push origin feat/issue-#<N>-<description>",
      "result": "Original PR (#XXX) automatically updates with new commits",
      "no_new_pr_needed": true
    }
  },
  
  "reviewer_agent_work_branch_pattern": {
    "required": true,
    "purpose": "Create temporary consolidation branch for multi-PR testing without creating a PR",
    
    "work_branch_naming_convention": {
      "pattern": "work/phase-<N>-consolidation (NOT feat/)",
      "prefix_meaning": "work/ indicates temporary work branch (no PR)",
      "examples": [
        "work/phase-4-consolidation",
        "work/hotfix-critical-bugs",
        "work/interview-prep-demo"
      ],
      "contrast": "feat/ = branches that get PRs; work/ = temporary branches for testing"
    },
    
    "work_branch_workflow": {
      "step_1_create": {
        "command": "git branch work/phase-<N>-consolidation origin/main",
        "purpose": "Create clean work branch from main (not from feature branch)"
      },
      "step_2_switch": {
        "command": "git switch work/phase-<N>-consolidation",
        "validation": "git branch (should show *work/phase-<N>-consolidation)"
      },
      "step_3_merge_features": {
        "command": "git merge feat/issue-#35-...; git merge feat/issue-#40-...; ...",
        "purpose": "Merge all feature branches into work branch for consolidated testing",
        "order": "Merge in order of issue numbers or dependency order"
      },
      "step_4_test_integration": {
        "command": "pnpm test --run; pnpm lint; pnpm build",
        "purpose": "Validate that all features work together",
        "document_results": "Note which PRs pass/fail tests"
      },
      "step_5_report_findings": {
        "task": "Create summary of findings for developers",
        "include": [
          "Which features passed integration tests",
          "Which features failed and why",
          "Which PRs need fixes",
          "Specific feedback for each issue"
        ]
      },
      "step_6_cleanup": {
        "command": "git branch -d work/phase-<N>-consolidation",
        "purpose": "Delete local work branch (no longer needed)"
      },
      "step_7_cleanup_remote": {
        "command": "git push origin --delete work/phase-<N>-consolidation",
        "purpose": "Clean up remote (work branch should never be permanent)"
      }
    },
    
    "critical_constraints": [
      "✅ Create work branch for testing",
      "✅ Merge feature branches into work branch",
      "✅ Run tests on consolidated code",
      "✅ Document findings",
      "✅ Delete work branch after review",
      "❌ NEVER create PR from work branch",
      "❌ NEVER commit to work branch yourself",
      "❌ NEVER push work branch as permanent"
    ]
  },
  
  "repeated_task_coordination": {
    "cycle_pattern": "Cycle until all PRs approved",
    
    "orchestrator_role_in_cycles": {
      "cycle_detection": "Monitor if multiple PRs need additional fixes",
      "delegation_pattern": [
        "Cycle 1: Delegate @reviewer to test all PRs together",
        "Report: @reviewer identifies which PRs need fixes",
        "Cycle 2: Delegate @developer to fix identified PRs",
        "Report: @developer pushes fixes to feature branches",
        "Cycle 3: Delegate @reviewer to re-validate",
        "Decision: Approve if all pass, or loop to Cycle 2"
      ]
    },
    
    "developer_role_across_cycles": {
      "cycle_2_onwards": "Implement fixes on SAME feature branch (tracked from original PR)",
      "each_fix_push": "git push origin <feature-branch> (updates PR with new commits)",
      "note": "Each push triggers re-review of PR (if protected branch)"
    },
    
    "reviewer_role_across_cycles": {
      "each_cycle": [
        "Delete previous work/phase-<N>-consolidation",
        "Create fresh work/phase-<N>-consolidation from origin/main",
        "Merge updated feature branches (developers pushed fixes)",
        "Run tests again",
        "Report results"
      ],
      "fresh_start_important": "Always recreate from origin/main to pick up latest fixes"
    }
  }
}
```

---

## 🔍 Execution Plan Integration

When creating execution plans for parallel PR review:

```markdown
# EXECUTION-PLAN-PARALLEL-PR-REVIEW.md

## Overview
Review 4 open PRs in parallel; identify fixes needed; implement and re-validate

## Open PRs to Review
- PR #245: feat/issue-#35-add-skeleton-loading (frontend)
- PR #246: feat/issue-#40-fix-keyboard-nav (frontend)
- PR #247: feat/issue-#121-improve-modals (frontend)
- PR #248: feat/issue-#39-toast-mobile (frontend)

## Multi-Agent Plan

### Cycle 1: Initial Integration Review
- Agent: @reviewer
- Task: Create work/phase-4-consolidation, merge all PRs, test, report
- Expected: Identify which PRs have issues

### Cycle 2: Developer Fixes
- Agent: @developer
- Task: Track feature branches from identified PRs, fix issues, push to same branch
- Expected: All PRs updated with fixes

### Cycle 3: Reviewer Re-Validation
- Agent: @reviewer
- Task: Recreate work branch, merge updated PRs, test again
- Decision: Approve all or loop to Cycle 2

## Feature Branch Tracking
| PR # | Feature Branch | Issue | Status |
|------|---|---|---|
| 245 | feat/issue-#35-add-skeleton-loading | #35 | Initial review |
| 246 | feat/issue-#40-fix-keyboard-nav | #40 | Initial review |
| 247 | feat/issue-#121-improve-modals | #121 | Initial review |
| 248 | feat/issue-#39-toast-mobile | #39 | Initial review |

## Work Branch Convention
- Temporary: work/phase-4-consolidation (created, used for testing, deleted)
- No PR created from work branch
- Clean deletion after each review cycle
```

---

## 📊 Workflow Diagram: Parallel PR Review with Repeated Tasks

```
┌─────────────────────────────────────────────────────────────────┐
│ Initial State: 4 Open PRs Ready for Review                      │
│ PR #245, #246, #247, #248 on feature branches                   │
└─────────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────────┐
│ CYCLE 1: Initial Integration Review                             │
│ @reviewer Agent:                                                │
│  1. Create work/phase-4-consolidation from origin/main          │
│  2. Merge feat/issue-#35-... into work branch                   │
│  3. Merge feat/issue-#40-... into work branch                   │
│  4. Merge feat/issue-#121-... into work branch                  │
│  5. Merge feat/issue-#39-... into work branch                   │
│  6. Run pnpm test --run (full suite)                            │
│  7. Document: "PR #245 and #246 pass; PR #247 fails in X"       │
│  8. Delete work/phase-4-consolidation                           │
│  9. Report findings to @developer                               │
└─────────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────────┐
│ CYCLE 2: Developer Implements Fixes                             │
│ @developer Agent (for each failed PR):                          │
│  1. For PR #247 (feat/issue-#121-improve-modals):               │
│     a. gh pr view 247 --json headRefName                        │
│     b. git switch feat/issue-#121-improve-modals  ← TRACKED!    │
│     c. Implement fix for X                                      │
│     d. git add [files]; git commit -m "fix(#121): ..."          │
│     e. git push origin feat/issue-#121-improve-modals           │
│        ↳ PR #247 auto-updates with new commit                   │
│  2. Repeat for other failed PRs                                 │
│  3. Report when all fixes pushed                                │
└─────────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────────┐
│ CYCLE 3: Reviewer Re-Validates                                  │
│ @reviewer Agent:                                                │
│  1. (DELETE old work/phase-4-consolidation if still exists)     │
│  2. Create NEW work/phase-4-consolidation from origin/main      │
│  3. Merge all updated feature branches:                         │
│     git merge feat/issue-#35-... (has original + new commits)   │
│     git merge feat/issue-#40-... (unchanged)                    │
│     git merge feat/issue-#121-... (has fixes now)               │
│     git merge feat/issue-#39-... (unchanged)                    │
│  4. Run pnpm test --run                                         │
│  5. Result: "All tests pass ✓"                                  │
│  6. Delete work/phase-4-consolidation                           │
│  7. Approve individual PRs: gh pr review 245 --approve          │
└─────────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────────┐
│ FINAL: All PRs Approved & Merged                                │
│ GitHub Actions auto-merges approved PRs to main                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Validation Checklist

### Developer Agent
- [ ] Identified correct feature branch from PR (`gh pr view`)
- [ ] Switched to existing feature branch (not created new one)
- [ ] All fixes committed to tracked feature branch
- [ ] Pushed to same feature branch (PR auto-updates)
- [ ] No new branches created (no `fix/pull-request-...`)
- [ ] No duplicate PRs created

### Reviewer Agent
- [ ] Created work/phase-<N>-consolidation (work/ prefix, not feat/)
- [ ] Merged all feature branches into work branch
- [ ] Ran full test suite on consolidated code
- [ ] Documented findings and which PRs need fixes
- [ ] Did NOT create PR from work branch
- [ ] Deleted work branch after review (both local and remote)

### Orchestrator
- [ ] Detected multiple open PRs needing review
- [ ] Delegated @reviewer for initial consolidation test
- [ ] Received findings and delegated @developer for fixes
- [ ] Delegated @reviewer for re-validation
- [ ] Continued cycles until all PRs approved

---

## 🎯 Key Takeaways

1. **Developer agents**: Track existing feature branches from PRs; never create new ones
2. **Reviewer agents**: Create temporary work branches for testing; never create PRs from them
3. **Repeated cycles**: Loop review → fixes → re-review until approved
4. **Clean branches**: work/ branches are temporary; always delete after use
5. **Single source**: Each PR stays on one feature branch; all fixes on same branch

---

## 📚 Related Documentation

- `.copilot/config.json` — Configuration for parallel PR review
- `.copilot/rules.json` — Detailed agent roles and git workflows
- `docs/MULTI_AGENT_ANALYSIS.md` — Analysis of orchestration patterns
- `DESIGN.md` — Overall system architecture

---

**Status**: ✅ Enhancement Complete  
**Version**: 1.0  
**Date**: 2026-05-09
