# 🔄 PR Feedback Cycle - Quick Reference

**When**: Reviewer provides feedback on your PR  
**Goal**: Fix flaws in the EXISTING feature branch (NO new branches)  
**Time**: 10-20 minutes per feedback cycle

---

## 🚀 Quick Workflow (13 Steps)

### Step 1: Get PR Number
```
Source: Reviewer's feedback comment
Example: "I found issues in PR #245"
Note: Keep this number handy
```

### Step 2: Identify Feature Branch
```bash
# Command to find the exact branch name
gh pr view <PR-NUMBER> --json headRefName

# Example
gh pr view 245 --json headRefName
# Output: feat/issue-#35-add-skeleton-loading

# Copy the branch name for step 4
```

### Step 3: Check Your Current Branch
```bash
git branch
# Shows current branch (with asterisk *)
```

### Step 4: Switch to EXISTING Feature Branch
```bash
# Use branch name from step 2
git switch feat/issue-#<N>-<description>

# Example
git switch feat/issue-#35-add-skeleton-loading

# Verify you switched correctly
git branch  # Should show *feat/issue-#35-add-skeleton-loading
```

### ⚠️ CRITICAL
```
❌ DO NOT create new branch
❌ DO NOT use: git branch fix/pull-request-245-...
✅ DO switch to existing branch from step 2
```

---

## 🔧 Fix the Issues

### Step 5: Implement Fixes
```
Edit the files mentioned in reviewer feedback
Only fix what the reviewer asked for
Don't refactor unrelated code
```

### Step 6: List Files You Changed
```bash
git status
# Shows which files you modified
# Keep this list for step 7
```

### Step 7: Stage Only Fix Files
```bash
# Stage the files from step 6
git add [file1.tsx] [file2.ts] [file3.css]

# Example
git add components/Modal.tsx hooks/useKeyboard.ts

# Verify what you're staging
git diff --cached
# Review the changes - should only show feedback fixes
```

---

## 📝 Commit & Push

### Step 8: Commit with Issue Reference
```bash
git commit -m "fix(#35): Address review feedback

- Fixed missing aria-label on skeleton
- Fixed tab order in keyboard navigation

Co-Authored-By: @reviewer-name"
```

**Format**:
- Type: `fix` (not `feat`, not `refactor`)
- Issue: Same issue number (e.g., `#35`)
- Description: What you fixed
- Co-Author: Reviewer's name (optional but encouraged)

### Step 9: Push to SAME Branch
```bash
# Push to the same branch from step 4
git push origin feat/issue-#<N>-<description>

# Example
git push origin feat/issue-#35-add-skeleton-loading

# Verify push was successful
git branch -v
# Should show "feat/issue-#35-add-skeleton-loading ... origin/feat/issue-#35-add-skeleton-loading [ahead 1]"
```

---

## ✅ What Happens Next

### PR Auto-Updates
```
✅ Your PR #245 automatically updates with new commits
✅ Reviewer is notified of new commits
✅ Same PR number (no new PR created)
✅ Clean commit history
```

### Reviewer Re-Reviews
```
Reviewer will check if all feedback was addressed

Outcome 1: All good → PR approved ✅
Outcome 2: More fixes needed → Loop back to Step 1
```

---

## 📋 Checklist (For Each Feedback Cycle)

- [ ] Step 2: Get exact branch name from `gh pr view`
- [ ] Step 4: Switch to EXISTING branch (verify with `git branch`)
- [ ] Step 5: Implement only the requested fixes
- [ ] Step 6: Run `git status` to see changed files
- [ ] Step 7: Stage ONLY the fix files (use `git diff --cached` to verify)
- [ ] Step 8: Commit with `fix(#N):` type and issue reference
- [ ] Step 9: Push to SAME branch
- [ ] Optional: Update execution plan with what you fixed
- [ ] Wait: Reviewer re-reviews PR #245

---

## 🚨 Common Mistakes (AVOID)

### ❌ Mistake 1: Creating New Branch
```bash
# WRONG
git branch fix/pull-request-245-skeleton
git switch fix/pull-request-245-skeleton
# This creates merge complexity! Don't do this.

# RIGHT
git switch feat/issue-#35-add-skeleton-loading  # From step 2
```

### ❌ Mistake 2: Staging Wrong Files
```bash
# WRONG
git add .
git add -A
# This stages unrelated files!

# RIGHT
git add [file1] [file2] [file3]
# Only files you modified for feedback fixes
```

### ❌ Mistake 3: Forgetting to Verify
```bash
# WRONG
git add [files]
git commit -m "..."
git push

# RIGHT
git add [files]
git diff --cached  # VERIFY before committing
git commit -m "..."
git push
```

### ❌ Mistake 4: Wrong Commit Type
```bash
# WRONG
git commit -m "feat(#35): ..." (Don't use feat for fixes)
git commit -m "refactor(#35): ..." (Don't refactor in feedback cycle)

# RIGHT
git commit -m "fix(#35): ..." (Use fix for feedback fixes)
```

---

## 📚 Full Reference

For complete details with all 13 steps, see:
```
Rules: .copilot/rules.json
  Section: developer_agent_git_workflow.pr_review_feedback_handling
  Steps: 11-23 (detailed explanations)

Documentation: docs/RULES_JSON_ENHANCEMENT_PR_FEEDBACK_CYCLE.md
  Complete workflow with examples
```

---

## 💡 Tips

1. **Slow is smooth**: Take time to verify each step
2. **Verify before push**: Use `git diff --cached` to confirm changes
3. **One cycle at a time**: Complete all feedback before pushing again
4. **Keep feedback focused**: Only fix what reviewer asked for
5. **Update execution plan**: Log what you fixed (helps others track progress)

---

## 🔑 Remember

```
GOLDEN RULE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
One issue = One feature branch = One PR
Feedback fixes go to the SAME branch
No new branches, no new PRs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESULT:
✅ Clean merge history
✅ Simple PR tracking
✅ No merge complexity
```

---

**Version**: 1.0  
**Date**: 2026-05-10  
**Status**: Quick Reference for PR Feedback Cycles
