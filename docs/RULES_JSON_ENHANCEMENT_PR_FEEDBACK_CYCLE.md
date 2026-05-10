# 🔄 rules.json Enhancement: PR Feedback Cycle

**Date**: 2026-05-10  
**Status**: ✅ Complete & Validated  
**Purpose**: Handle PR review feedback while reusing existing feature branches (NO new branch creation)

---

## 📋 Overview

Enhanced `.copilot/rules.json` to add explicit workflow steps for handling PR review feedback. The key improvement: **fixes go to the EXISTING feature branch linked to the PR**, preventing the merge complexity of multiple branches per issue.

### Problem Solved
```
❌ OLD PATTERN (creates merge complexity):
   PR #245 from feat/issue-#35-... 
   → Reviewer finds flaws
   → Developer creates NEW branch: fix/pull-request-245-skeleton
   → Creates NEW PR #250 for fixes
   → Now merging: feat/issue-#35-... + fix/pull-request-245-...
   → Complex cherry-pick or rebase needed
   → Messy commit history

✅ NEW PATTERN (clean merge):
   PR #245 from feat/issue-#35-...
   → Reviewer finds flaws
   → Developer tracks EXISTING feat/issue-#35-... branch
   → Fixes on SAME branch
   → Pushes to SAME branch
   → PR #245 auto-updates
   → Single branch per issue = clean merge
```

---

## 📝 Sections Enhanced

### 1️⃣ `single_terminal_sequential_delegation`

**Added**: New subsection `pr_review_feedback_cycle`

**Content**:
- Description of the feedback handling workflow
- When it's triggered (PR created, reviewer provides feedback)
- Workflow sequence (phases 3A through 3F)
- Details for each phase:
  - **Phase 3B**: Reviewer examines PR, documents findings
  - **Phase 3C**: Developer fixes flaws in EXISTING feature branch (WITH STEPS)
  - **Phase 3D**: Push fixes to same branch (PR auto-updates)
  - **Phase 3E**: Reviewer re-reviews
  - **Phase 3F**: Approval and next steps

**Key Addition**: **Phase 3C detailed steps** (critical rule emphasized):
```
"phase_3c_developer_feedback_cycle": {
  "critical_rule": "TRACK feature branch from PR; DO NOT create new branch",
  "steps": [
    "1. Get PR number from reviewer feedback",
    "2. Identify feature branch: gh pr view <PR-NUMBER> --json headRefName",
    "3. Verify current branch: git branch",
    "4. Check out EXISTING feature branch: git switch feat/issue-#<N>-...",
    "5. Implement fixes based on reviewer feedback",
    ...
    "10. Push to SAME branch: git push origin feat/issue-#<N>-...",
    "11. Validate: PR auto-updates with new commits",
    "12. Update execution plan: Log Phase 3C completion"
  ],
  "branch_handling": {
    "create_new_branch": "❌ NEVER",
    "reuse_existing": "✅ YES"
  }
}
```

---

### 2️⃣ `execution_plan_structure_for_orchestrator`

**Added**: New subsections for tracking PR feedback

**Content**:
- `optional_sections_for_feedback_tracking`: Sections to include in execution plans
  - PR Review Feedback Cycles
  - Feature Branch Registry
  - Feedback Resolution Log

- `pr_feedback_tracking_format`: How to structure PR feedback in execution plans
  ```markdown
  ### PR #245: feat/issue-#35-add-skeleton-loading
  
  #### Cycle 1: Initial Review
  **Findings:**
  - FAILED: components/Modal.tsx - Missing aria-label - Severity: major
  
  #### Cycle 2: Feedback Fix (REUSE feat/issue-#35-add-skeleton-loading)
  **Fixes Applied:**
  - components/Modal.tsx (MODIFY): Added aria-label
  
  #### Cycle 3: Re-Review
  **Result**: APPROVED ✅
  ```

- `feature_branch_registry`: Quick lookup table
  ```
  | PR # | Feature Branch | Issue | Cycle Status | Next Action |
  |------|---|---|---|---|
  | 245 | feat/issue-#35-add-skeleton-loading | #35 | Cycle 2 | Push to same branch |
  ```

- `orchestrator_uses_this_to`: How orchestrator leverages the tracking
  - Identify PR numbers
  - Map to feature branches
  - Delegate developer with EXPLICIT instruction to reuse branch

---

### 3️⃣ `developer_agent_git_workflow`

**Added**: New subsection `pr_review_feedback_handling` with 13 steps (11-23)

**Complete Workflow**:

```
Step 11: Receive Feedback
  Input: Reviewer feedback/comments on PR #<PR-NUMBER>

Step 12: Identify Feature Branch  
  Command: gh pr view <PR-NUMBER> --json headRefName
  Purpose: Get EXACT feature branch name from PR
  Example: gh pr view 245 → returns feat/issue-#35-add-skeleton-loading

Step 13: Check Current State
  Command: git branch
  Purpose: Verify which branch you're on

Step 14: Switch to EXISTING Feature Branch
  Command: git switch feat/issue-#<N>-<description> (from step 12)
  🔴 CRITICAL: Do NOT create new branch
  ✅ ONLY switch to existing

Step 15: Implement Feedback Fixes
  Task: Implement fixes based on reviewer feedback
  Scope: ONLY changes to address feedback

Step 16: Track Feedback Files
  Method: Document in execution plan
  Format: - [File.tsx] (MODIFY): Fixed [specific feedback item]

Step 17: Stage Feedback Fixes
  Command: git add [file1 file2 ...]
  🔴 CRITICAL: ONLY add files from step 16

Step 18: Verify Feedback Fixes
  Command: git diff --cached
  Check: Do these changes address the reviewer feedback?

Step 19: Commit Feedback Fixes
  Format: fix(#<N>): Address review feedback\n\n- Fixed: [item 1]\n- Fixed: [item 2]
  Type: fix (not feat, not refactor)
  Co-Author: Reviewer name (optional but encouraged)

Step 20: Push Feedback Fixes
  Command: git push origin feat/issue-#<N>-... (SAME branch)
  🔴 CRITICAL: Push to EXISTING branch
  Result: PR auto-updates with new commits

Step 21: Validate Push
  Command: git branch -v
  Check: Verify upstream tracking shows origin/feat/issue-#<N>-...

Step 22: Update Execution Plan
  Format: Log Cycle 2 results in plan
  Purpose: Track progress for next review

Step 23: Await Reviewer Re-Review
  Outcome 1: All addressed → Approve (consolidation)
  Outcome 2: More fixes needed → Loop to step 11
```

**Also Added**: `pr_review_feedback_summary`
- Complete workflow sequence
- Key constraints (what to do/not do)
- Benefits of this approach

---

### 4️⃣ `github_copilot_cowork_workflow` - Phases

**Enhanced Phase Descriptions**:

**Phase 3B (NEW)**: Reviewer examines PR, documents findings

**Phase 3C (NEW)**: Developer implements fixes
- In EXISTING feature branch
- NO new branches
- Reference to complete steps 11-23

**Phase 3D (NEW)**: Push and auto-update
- Push to same branch
- PR auto-updates

**Phase 3E (NEW)**: Reviewer re-reviews
- Loop until approved

**Phase 4 (UPDATED)**: Consolidation
- Changed consolidation branch to `work/phase-<N>-consolidation` (work/ prefix for clarity)
- Added step 9: Delete consolidation branch
- Made explicit: ONLY start after all PRs approved from feedback cycles

---

## 🎯 Key Enhancements Summary

| Aspect | What Was Added | Why |
|--------|---|---|
| **PR Feedback Cycle** | Complete phases 3B-3F workflow | Guide for handling review feedback |
| **Developer Steps** | 13 new steps (11-23) for feedback handling | Explicit, repeatable process |
| **Feature Branch Tracking** | `gh pr view` command to identify branch | Prevents "which branch?" confusion |
| **Execution Plan Tracking** | PR registry, cycle tracking | Clear progress visibility |
| **Critical Rules** | Emphasized REUSE existing, NO new branches | Prevent merge complexity |
| **Commit Pattern** | `fix(#N)` type for feedback fixes | Clear semantic meaning |
| **Co-Author** | Encourage reviewer co-author | Credit feedback provider |
| **Loop Condition** | Re-review cycle defined | Guide for repeating feedback cycles |
| **Consolidation Update** | work/ prefix, explicit cleanup | Clearer temporary branch intent |

---

## ✅ Validation

**JSON Syntax**: ✅ Valid  
**Structure**: ✅ Hierarchical, consistent  
**Completeness**: ✅ All sections enhanced  
**Clarity**: ✅ Critical rules emphasized  
**Backward Compatibility**: ✅ No breaking changes

---

## 📚 Usage Example

### Scenario: Developer Handling PR #245 Feedback

```
Initial State:
- PR #245 created from feat/issue-#35-add-skeleton-loading
- Reviewer provides feedback: "Missing aria-label on skeleton"

Developer Workflow:

Step 12: Identify branch
  $ gh pr view 245 --json headRefName
  feat/issue-#35-add-skeleton-loading

Step 14: Switch to existing branch
  $ git switch feat/issue-#35-add-skeleton-loading
  ✅ (NOT creating new branch)

Step 15: Fix the issue
  - Edit components/Skeleton.tsx
  - Add: aria-label="Loading..."

Step 17: Stage fix
  $ git add components/Skeleton.tsx

Step 19: Commit
  $ git commit -m "fix(#35): Address review feedback
  
  - Added aria-label on skeleton loading component
  
  Co-Authored-By: @reviewer-name"

Step 20: Push to SAME branch
  $ git push origin feat/issue-#35-add-skeleton-loading
  ✅ PR #245 auto-updates with new commit

Result:
- Single branch: feat/issue-#35-add-skeleton-loading
- Single PR: #245
- Clean merge history
- No merge complexity
```

---

## 🚀 Implementation Checklist

When using enhanced rules.json:

### For Orchestrator
- [ ] Read execution plan at start
- [ ] Note PR numbers and feature branches (from registry)
- [ ] Delegate @developer with explicit instruction to "track feature branch from PR"
- [ ] Monitor feedback cycles in execution plan updates

### For Developer (First Implementation)
- [ ] Follow steps 1-10 normally (initial implementation)
- [ ] Create PR
- [ ] Await reviewer feedback

### For Developer (Feedback Cycles)
- [ ] Receive reviewer feedback
- [ ] Follow steps 11-23 (feedback cycle)
- [ ] Use `gh pr view` to identify feature branch
- [ ] Switch to EXISTING branch (step 14)
- [ ] Never create new branch
- [ ] Push to same branch (step 20)
- [ ] Loop until approved

### For Reviewer
- [ ] Examine PR
- [ ] Document feedback
- [ ] Provide clear file/issue pointers
- [ ] Re-review when developer pushes fixes
- [ ] Approve when complete

### For Execution Plan
- [ ] Include PR registry section
- [ ] Track feedback cycles per PR
- [ ] Update after each cycle
- [ ] Show which flaws were fixed

---

## 🔑 Critical Points (Emphasized in Enhancement)

**🔴 NEVER DO**:
```json
❌ Create new branch: fix/pull-request-245-skeleton
❌ Create new PR: for fixes to same issue
❌ Use git add . or git add -A (must track files)
❌ Refactor unrelated code in feedback cycle
```

**✅ ALWAYS DO**:
```json
✅ Reuse: feat/issue-#<N>-... branch from PR
✅ Identify: gh pr view <PR> --json headRefName
✅ Track: files changed for feedback fixes
✅ Stage: Only feedback-related files
✅ Push: To same branch (PR auto-updates)
✅ Document: Cycle progress in execution plan
✅ Co-author: Reviewer who provided feedback
```

---

## 📊 Workflow Comparison

### Before Enhancement
```
Phase 1: Initial Implementation
  Branch: feat/issue-#35-...
  PR: #245

Phase 2: Feedback → Fix
  New Branch: fix/pull-request-245-skeleton ❌
  New PR: #250 ❌
  Now merging: 2 branches for 1 issue ❌
  Merge complexity ⬆️
```

### After Enhancement
```
Phase 1: Initial Implementation
  Branch: feat/issue-#35-...
  PR: #245

Phase 2: Feedback → Fix (Steps 11-23)
  Use Existing: feat/issue-#35-... ✅
  Same PR: #245 (auto-updated) ✅
  One branch for one issue ✅
  Clean merge ⬇️

Phase 3 (if needed): More Feedback
  Same branch: feat/issue-#35-... ✅
  Same PR: #245 ✅
  Loop repeats (steps 11-23)
```

---

## 🔗 Related Documentation

- **PR Review Enhancement Doc**: `docs/PARALLEL_PR_REVIEW_ENHANCEMENT.md`
- **Developer Workflow**: `docs/PARALLEL_WORKFLOW_QUICK_START.md` (Phase 2 details)
- **Implementation Plan**: `docs/PARALLEL_WORKFLOW_IMPLEMENTATION_ROADMAP.md`

---

## 📝 Summary

The enhancement adds **13 explicit steps** (11-23) to the developer workflow for handling PR review feedback while maintaining a single feature branch per issue. This eliminates the complexity of managing multiple branches (`feat/issue-#X-...` + `fix/pull-request-XXX-...`) that must be merged to main.

**Key Innovation**: Explicit instruction to track the feature branch from the PR using `gh pr view`, preventing developers from creating new branches.

**Result**: Clean, single-PR-per-issue workflow with:
- ✅ Simpler merges
- ✅ Clearer commit history
- ✅ Fewer integration conflicts
- ✅ Better PR tracking

---

**File**: `.copilot/rules.json` (v2.1 enhanced)  
**Status**: ✅ Valid & Production Ready  
**Date**: 2026-05-10
