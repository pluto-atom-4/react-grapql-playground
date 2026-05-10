# 🚀 GitHub Copilot CLI - Project Workflow Instructions

**Last Updated**: 2026-05-10  
**Scope**: Multi-agent orchestration, PR feedback cycles, feature implementation  
**Repository**: Stoke Full Stack React/GraphQL Playground

---

## 🎯 Core Principles

### One Issue = One Branch = One PR

- **Feature Branch**: `feat/issue-#<N>-<description>` (created at project start)
- **PR Number**: Single PR per issue, auto-updates with feedback fixes
- **Feedback Handling**: All fixes go to the EXISTING feature branch (NO new branches)
- **Result**: Clean merge history, no complex rebasing

### Multi-Agent Orchestration

The orchestrator agent coordinates specialized agents:
- **Orchestrator**: Analyzes requirements, creates execution plans, delegates work
- **Developer**: Implements features and feedback fixes on feature branches
- **Reviewer**: Examines PRs, provides detailed feedback, approves when ready
- **Tester**: Runs consolidation tests, validates merged code
- **Product Manager**: Validates alignment with business requirements (optional)

Agents work in sequence within phases but phases run in parallel across issues.

---

## 📋 Workflow Phases

### Phase 1: Planning
**Who**: Orchestrator  
**Input**: GitHub issues, execution plan requirements  
**Output**: Execution plan with PR registry, multi-agent delegation strategy  
**Key Task**: Identify which issues can be parallelized

### Phase 2: Delegation
**Who**: Orchestrator  
**Input**: Execution plan with multi-agent delegation  
**Output**: Feature branches created, developers assigned  
**Key Commands**:
```bash
git branch feat/issue-#<N>-<description> origin/main
git push -u origin feat/issue-#<N>-<description>
```

### Phase 3A: Initial Implementation
**Who**: Developer agents  
**Input**: Issue requirements, execution plan  
**Output**: Feature implemented on feature branch, PR created  
**Steps**:
1. Switch to feature branch: `git switch feat/issue-#<N>-...`
2. Implement based on execution plan
3. Track files: `git status`, `git diff`
4. Commit atomically: `git commit -m "feat(#N): ..."`
5. Push: `git push origin feat/issue-#<N>-...`
6. Create PR: `gh pr create --title "..." --body "..."`

### Phase 3B: Reviewer Examines PR
**Who**: Reviewer agent  
**Input**: PR #<N> with implementation  
**Output**: Detailed findings document with issues and severity levels  
**Key Actions**:
- Review code against project standards
- Test functionality
- Document findings with specific file/line references
- Comment on PR with feedback

### Phase 3C: Developer Handles Feedback
**Who**: Developer agent  
**Input**: Reviewer feedback on PR #<N>  
**Output**: Fixes applied to EXISTING feature branch, pushed  
**Critical Rule**: 🔴 **REUSE EXISTING feature branch - DO NOT create new branch**

**Steps (from rules.json steps 11-23)**:

**Step 1: Identify Feature Branch**
```bash
gh pr view <PR-NUMBER> --json headRefName
# Output: feat/issue-#35-add-skeleton-loading (example)
```

**Step 2: Switch to Existing Branch**
```bash
git switch feat/issue-#35-add-skeleton-loading
# ✅ CORRECT: Use existing branch
# ❌ WRONG: Create new branch like fix/pull-request-245-skeleton
```

**Step 3: Implement Fixes**
- Edit only files mentioned in reviewer feedback
- Don't refactor unrelated code
- Don't introduce new features

**Step 4: Stage Feedback Fixes**
```bash
git add [file1.tsx] [file2.ts]
git diff --cached  # Verify before committing
```

**Step 5: Commit**
```bash
git commit -m "fix(#<N>): Address review feedback

- Fixed [specific item 1]
- Fixed [specific item 2]

Co-Authored-By: @reviewer-name"
```
**Type**: Use `fix` (not `feat`, not `refactor`)

**Step 6: Push to Same Branch**
```bash
git push origin feat/issue-#<N>-add-skeleton-loading
# ✅ Push to SAME branch - PR auto-updates
# ❌ DO NOT create new PR
```

### Phase 3D: PR Auto-Updates
**Who**: GitHub (automatic)  
**Input**: New commits on feature branch  
**Output**: PR #<N> shows updated commits, reviewer notified  
**Note**: No manual action needed - GitHub handles this automatically

### Phase 3E: Reviewer Re-Reviews
**Who**: Reviewer agent  
**Input**: Updated PR #<N> with feedback fixes  
**Output**: Either approved or more feedback  
**Loop Condition**:
- If all feedback addressed → Approve (move to Phase 3F)
- If more fixes needed → Provide feedback, loop back to Phase 3C

### Phase 3F: Approval & Ready for Consolidation
**Who**: Orchestrator + Reviewer  
**Input**: PR approved  
**Output**: PR marked as consolidation-ready  
**Preconditions**: All feedback cycles complete, all code reviewed and approved

### Phase 4: Consolidation
**Who**: Reviewer agent + Tester  
**Input**: All approved PRs (from phases 3A-3F)  
**Output**: work/phase-<N>-consolidation branch with all features merged, tests passing  
**Key Steps**:
1. Create consolidation branch: `git branch work/phase-<N>-consolidation origin/main`
2. Merge all approved feature branches into consolidation branch
3. Run full test suite: `pnpm test`
4. Fix any consolidation issues (dependency conflicts, test failures)
5. Update execution plan with consolidation status
6. Clean up: `git branch -d work/phase-<N>-consolidation` (after merge to main)

### Phase 5: Merge
**Who**: GitHub Actions (automated)  
**Input**: Consolidated feature branches ready to merge  
**Output**: Features merged to main, GitHub Actions runs final tests  
**Command** (automatic):
```bash
gh pr merge --squash --delete-branch
```

---

## 🔧 Developer Workflow: Handling PR Feedback

When you receive feedback on PR #<N>:

### Quick Reference (13 Steps)

1. **Get PR number** from reviewer's feedback comment
2. **Identify feature branch**: `gh pr view <PR> --json headRefName`
3. **Check current branch**: `git branch`
4. **Switch to existing branch**: `git switch feat/issue-#<N>-...`
5. **Implement fixes** based on reviewer feedback
6. **List changed files**: `git status`
7. **Stage fix files**: `git add [file1] [file2]`
8. **Verify staging**: `git diff --cached`
9. **Commit with issue reference**: `git commit -m "fix(#<N>): ..."`
10. **Push to same branch**: `git push origin feat/issue-#<N>-...`
11. **Verify push**: `git branch -v`
12. **Wait**: Reviewer re-reviews
13. **Loop or Approve**: Feedback resolved or more fixes needed?

### Critical Reminders

❌ **DO NOT**:
- Create new branch for fixes: `git branch fix/pull-request-245-...`
- Create new PR for feedback fixes
- Use `git add .` or `git add -A` (must track specific files)
- Refactor unrelated code during feedback cycle

✅ **DO**:
- Reuse feature branch from step 2
- Identify exact branch with `gh pr view`
- Stage only feedback-related files
- Verify with `git diff --cached` before commit
- Push to same branch (PR auto-updates)
- Document fixes in execution plan

---

## 📚 Reference Files

| File | Purpose |
|------|---------|
| `.copilot/rules.json` | Detailed implementation steps for all phases (steps 1-23+) |
| `.copilot/PR_FEEDBACK_QUICK_REFERENCE.md` | 9-step quick guide for PR feedback handling |
| `.copilot/agents/` | Agent definitions (orchestrator, developer, reviewer, tester, product-manager) |
| `.github/copilot/settings.json` | GitHub Copilot CLI settings and configuration |
| `docs/implementation-planning/` | Execution plans with PR registry and feedback tracking |

---

## 🚀 Running the Workflow

### Start a Session

```bash
# Terminal 1: Start GitHub Copilot CLI with orchestrator
copilot

# In copilot CLI:
@orchestrator Analyze the execution plan for Phase 3 implementation
```

### Delegate to Developer

```bash
@orchestrator Delegate @developer to implement feat/issue-#35-add-skeleton-loading
# Orchestrator will:
# - Analyze execution plan
# - Create feature branch
# - Provide context to developer
```

### Handle Feedback

```bash
@developer I received feedback on PR #245: missing aria-label on skeleton
# Developer will:
# - Identify feature branch using gh pr view
# - Switch to existing branch
# - Implement fixes
# - Push to same branch
# - PR auto-updates
```

---

## 💡 Tips & Best Practices

1. **Keep Feedback Focused**: Only fix what reviewer asked for
2. **Verify Before Push**: Use `git diff --cached` to review staging
3. **One Cycle at a Time**: Complete all feedback fixes before pushing again
4. **Update Execution Plan**: Log feedback cycles and fixes (helps orchestrator track progress)
5. **Use co-author flag**: Credit the reviewer with `Co-Authored-By` trailer
6. **Document in PR**: Add detailed comments explaining fixes

---

## 🔗 Integration Points

### GitHub Copilot CLI ↔ This Project

- **Settings**: `.github/copilot/settings.json` (GitHub Copilot CLI standard)
- **Instructions**: `.copilot/copilot-instructions.md` (this file)
- **Agents**: `.copilot/agents/*.md` (custom agent definitions)
- **Rules**: `.copilot/rules.json` (detailed implementation rules - reference only)
- **Execution Plans**: `docs/implementation-planning/` (orchestrator's playbook)

### Execution Plan Registry

Every execution plan includes:
```markdown
### PR Registry
| PR # | Feature Branch | Issue | Cycle Status | Next Action |
|------|---|---|---|---|
| 245 | feat/issue-#35-add-skeleton-loading | #35 | Cycle 2 | Re-review Phase 3C |
| 246 | feat/issue-#36-keyboard-navigation | #36 | Cycle 1 | Initial implementation |
```

This registry is the single source of truth for:
- Which PR maps to which feature branch
- Current feedback cycle status
- What action is needed next

---

## 🆘 Troubleshooting

### "I don't know which branch to fix"

Use the `gh pr view` command:
```bash
gh pr view 245 --json headRefName
# Returns: feat/issue-#35-add-skeleton-loading
```

### "I accidentally created a new branch"

Delete it and switch to the correct one:
```bash
git branch -d fix/pull-request-245-wrong-branch
git switch feat/issue-#35-add-skeleton-loading
```

### "My changes aren't showing in the PR"

Verify you pushed to the correct branch:
```bash
git branch -v
# Should show: feat/issue-#35-... origin/feat/issue-#35-... [ahead 1]
```

### "I staged too many files"

Reset staging and redo it:
```bash
git reset HEAD
git add [correct-files-only]
git diff --cached  # Verify
```

---

## 🔐 Golden Rules

```
1. One issue = One feature branch = One PR = Clean merge
2. Feedback fixes go to the EXISTING feature branch (NEVER create new branch)
3. Always identify feature branch first: gh pr view <PR> --json headRefName
4. Always verify staging: git diff --cached
5. Always push to same branch (PR auto-updates automatically)
6. Always update execution plan with cycle progress
```

---

**Last Updated**: 2026-05-10  
**Status**: Production-ready for GitHub Copilot CLI  
**Compatibility**: GitHub Copilot CLI v1.0+
