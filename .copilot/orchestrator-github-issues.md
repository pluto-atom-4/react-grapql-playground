# Orchestrator: Multi-Agent GitHub Issue Workflow

**Purpose:** Enable orchestrator to coordinate multiple developers across independent GitHub issues using feature branching and parallel execution.

**Scope:** Phase 4 (Issues #34, #35, #39, #40) and beyond

---

## 🎯 Orchestrator Responsibilities

### Pre-Execution Phase

1. **Issue Analysis & Dependency Mapping**
   - Fetch all open GitHub issues for a phase
   - Analyze dependencies between issues
   - Create dependency graph (blocking vs non-blocking)
   - Identify parallelizable issues (zero blocking dependencies)

2. **Team & Resource Allocation**
   - Assign one agent per independent issue
   - Match issue complexity to agent capability
   - Define success criteria and acceptance criteria per issue
   - Document handoff points between agents

3. **Setup Git Worktree Infrastructure**
   ```bash
   # Create isolated worktrees for parallel execution
   git branch feat/issue-#34-pagination origin/main
   git branch feat/issue-#35-skeletons origin/main
   git branch feat/issue-#39-tailwind origin/main
   git branch feat/issue-#40-accessibility origin/main
   
   # Create worktrees for agents to work in parallel
   git worktree add ../feat-34 feat/issue-#34-pagination
   git worktree add ../feat-35 feat/issue-#35-skeletons
   git worktree add ../feat-39 feat/issue-#39-tailwind
   git worktree add ../feat-40 feat/issue-#40-accessibility
   ```

4. **Create GitHub Project Board**
   - Create GitHub Project for the phase (e.g., "Phase 4: UX Features")
   - Link all issues to the project
   - Set up columns: To Do, In Progress, In Review, Done

---

## 🔄 Agent Workflow (Per Developer)

### Step 1: Check Out Feature Branch

Each agent starts by switching to their issue-specific feature branch:

```bash
# Agent 1: Pagination
git branch feat/issue-#34-pagination origin/main
git switch feat/issue-#34-pagination

# Agent 2: Skeletons
git branch feat/issue-#35-skeletons origin/main
git switch feat/issue-#35-skeletons

# Agent 3: Tailwind
git branch feat/issue-#39-tailwind origin/main
git switch feat/issue-#39-tailwind

# Agent 4: Accessibility
git branch feat/issue-#40-accessibility origin/main
git switch feat/issue-#40-accessibility
```

### Step 2: Implement Issue Solution

- Follow the implementation plan from phase documentation
- Commit changes locally (message format: `fix: #34 description`)
- Keep commits atomic and clean
- Reference issue in commit messages

```bash
# Example commits
git commit -m "feat: #34 add pagination component

- Add <Pagination /> component with prev/next buttons
- Update GET_BUILDS query with limit/offset params
- Add useBuilds hook with page state management

Closes #34"
```

### Step 3: Create Pull Request

```bash
# Push feature branch to remote
git push -u origin feat/issue-#34-pagination

# Create PR via GitHub CLI
gh pr create \
  --title "feat: #34 - Implement Pagination UI" \
  --body "## Summary

Adds pagination to the builds dashboard.

## Changes
- New <Pagination /> component
- Updated GET_BUILDS query with limit/offset
- Added useBuilds() hook

## Testing
- Unit tests for Pagination component
- Integration tests with MockedProvider
- Visual regression tests pass

Closes #34" \
  --base main
```

### Step 4: Request Code Review

- Tag orchestrator and reviewer agents
- Reference acceptance criteria from issue
- Link to implementation plan

---

## 🎭 Orchestrator Coordination Pattern

### Multi-Agent Dispatch (Parallel Execution)

**Prerequisite:** All issues must have zero blocking dependencies

```
Orchestrator: "Dispatch 4 agents in parallel"
  ├─ Agent 1 → Issue #34 (Pagination) in ../feat-34
  │   └─ Duration: ~1.75 hours
  │   └─ Success: PR created, all tests passing
  │
  ├─ Agent 2 → Issue #35 (Skeletons) in ../feat-35
  │   └─ Duration: ~2.25 hours
  │   └─ Success: PR created, CLS verified
  │
  ├─ Agent 3 → Issue #39 (Tailwind) in ../feat-39
  │   └─ Duration: ~1.5 hours
  │   └─ Success: PR created, visual regression pass
  │
  └─ Agent 4 → Issue #40 (Accessibility) in ../feat-40
      └─ Duration: ~3.5 hours
      └─ Success: PR created, axe DevTools 0 violations
```

### Progress Monitoring

The orchestrator monitors:
1. **Issue Status** - GitHub project board updates
2. **Branch Status** - `git log main..` for each feature branch
3. **PR Status** - Code review progress via `gh pr view`
4. **Blockers** - Any test failures or merge conflicts
5. **Integration** - Cross-issue dependencies after merges

```bash
# Check progress
gh pr list --state open --search "is:draft\|is:ready"
git worktree list  # Verify all worktrees active

# Monitor individual agent progress
cd ../feat-34 && git log main.. --oneline  # Agent 1 commits
cd ../feat-35 && git log main.. --oneline  # Agent 2 commits
cd ../feat-39 && git log main.. --oneline  # Agent 3 commits
cd ../feat-40 && git log main.. --oneline  # Agent 4 commits
```

---

## 🔍 Reviewer Agent: Multi-PR Review Workflow

When multiple PRs are in review, the Reviewer Agent can create a **review consolidation branch** to:

1. Merge all feature branches locally
2. Verify no conflicts
3. Run full test suite
4. Check cross-issue integration
5. Approve or request changes

### Reviewer Setup (Optional)

```bash
# Create review branch to merge all feature branches
git branch feat/phase-4-integration-review origin/main
git switch feat/phase-4-integration-review

# Merge all feature branches into review branch
git merge feat/issue-#34-pagination
git merge feat/issue-#35-skeletons
git merge feat/issue-#39-tailwind
git merge feat/issue-#40-accessibility

# Run full test suite
pnpm install
pnpm test

# If successful, approve PRs
# If conflicts, notify orchestrator for resolution
```

### Reviewer Decision Matrix

| Scenario | Action |
|----------|--------|
| All features merge cleanly | Approve all PRs |
| One feature has conflict | Request changes on that PR |
| Test suite fails | Identify failing issue PR |
| Performance regression | Request optimization |
| Accessibility violation | Fail #40 (Accessibility) PR |

---

## 🌳 Git Workflow Summary

### Feature Branch Naming Convention

**Pattern:** `feat/issue-#<issue-number>-<kebab-case-description>`

**Examples:**
```
feat/issue-#34-pagination
feat/issue-#35-skeletons
feat/issue-#39-tailwind
feat/issue-#40-accessibility
feat/issue-#121-jwt-auth
feat/issue-#212-remove-useeffect-setstate
```

### Commit Message Convention

**Pattern:** `<type>: #<issue> <description>`

**Examples:**
```
feat: #34 add pagination component with GraphQL support
fix: #35 prevent CLS on skeleton animations
refactor: #39 migrate custom CSS to Tailwind
feat: #40 add ARIA labels and keyboard navigation
```

### Branch Lifecycle

```
1. Create:    git branch feat/issue-#34-pagination origin/main
2. Switch:    git switch feat/issue-#34-pagination
3. Work:      (implement, test, commit)
4. Push:      git push -u origin feat/issue-#34-pagination
5. PR:        gh pr create --base main
6. Review:    Reviewer agent reviews
7. Merge:     gh pr merge (when approved)
8. Cleanup:   git worktree remove ../feat-34
```

---

## 🚀 Orchestrator Command Reference

### Phase Initialization

```bash
# Step 1: Fetch open issues
gh issue list --state open --json number,title,body,labels

# Step 2: Analyze dependencies
# (Manual step: review PHASE-4-DEPENDENCIES.md)

# Step 3: Create feature branches
for issue in 34 35 39 40; do
  git branch feat/issue-#$issue-<name> origin/main
done

# Step 4: Create worktrees
git worktree add ../feat-34 feat/issue-#34-pagination
git worktree add ../feat-35 feat/issue-#35-skeletons
git worktree add ../feat-39 feat/issue-#39-tailwind
git worktree add ../feat-40 feat/issue-#40-accessibility

# Step 5: Verify setup
git worktree list
```

### Progress Tracking

```bash
# View all feature branches
git branch -a | grep feat/issue

# Check PRs
gh pr list --state open

# Monitor test status
gh pr view <pr-number> --json commits,checks

# List worktrees
git worktree list

# Remove worktree after merge
git worktree remove ../feat-34
```

### Blocker Resolution

If an agent is blocked:

```bash
# Orchestrator investigates
cd ../feat-34  # Go to agent's worktree

# Check git status
git status

# Review commits
git log main..

# Check test failures
pnpm test --run

# Communicate with agent
# Resolution: Either unblock or escalate
```

---

## ⚠️ Safety Checks

### Pre-Merge Verification

Before merging any PR:

```bash
# 1. Verify no conflicts
git merge --no-commit --no-ff feat/issue-#34-pagination

# 2. Run full test suite
pnpm test --run

# 3. Check linting
pnpm lint

# 4. Verify acceptance criteria from issue
# (Link to issue: https://github.com/org/repo/issues/#34)

# 5. Cancel dry-run merge
git merge --abort
```

### Parallel Merge Strategy

All PRs can merge **in any order** (since they're independent):

```bash
# Option 1: Sequential merge (safest)
gh pr merge 34 --merge
gh pr merge 35 --merge
gh pr merge 39 --merge
gh pr merge 40 --merge

# Option 2: Random order (verify no dependencies)
gh pr merge 40 --merge
gh pr merge 34 --merge
gh pr merge 39 --merge
gh pr merge 35 --merge

# Option 3: Batch merge (all at once)
gh pr list --state open --json number | jq -r '.[] | .number' | \
  xargs -I {} gh pr merge {} --merge
```

---

## 🎯 Success Criteria

### Per Agent

- ✅ Feature branch created with correct naming
- ✅ Issue-specific implementation complete
- ✅ All tests passing locally
- ✅ Commit messages reference issue number
- ✅ PR created with comprehensive description
- ✅ Code review requested from Reviewer agent

### Phase Completion

- ✅ All 4 issues have PRs (open or merged)
- ✅ All tests passing (741+ for Phase 4)
- ✅ Zero blockers or merge conflicts
- ✅ Acceptance criteria met for each issue
- ✅ PRs merged to main
- ✅ Worktrees cleaned up

---

## 📋 Orchestrator Checklist

### Before Dispatch (Day 0)
- [ ] Read issue breakdowns (PHASE-4-ISSUE-BREAKDOWN.md)
- [ ] Verify dependencies (PHASE-4-DEPENDENCIES.md)
- [ ] Assign agents to issues
- [ ] Create feature branches (git branch)
- [ ] Create worktrees (git worktree add)
- [ ] Notify agents of assignment

### During Execution (Days 1-4)
- [ ] Daily standup with agents
- [ ] Monitor PR creation progress
- [ ] Check test status
- [ ] Resolve blockers immediately
- [ ] Update GitHub project board

### End-of-Phase (Day 5)
- [ ] All PRs reviewed
- [ ] All PRs merged (or approved)
- [ ] Full test suite passing
- [ ] Worktrees removed
- [ ] Transition to next phase

---

## 🔗 Related Resources

- `.copilot/agents/orchestrator.md` - Orchestrator role definition
- `.copilot/PARALLEL-EXECUTION-GUIDE.md` - Git worktree coordination guide
- `docs/implementation-planning/PHASE-4-DEPENDENCIES.md` - Dependency analysis
- `docs/implementation-planning/PHASE-4-ISSUE-BREAKDOWN.md` - Issue details
- `CLAUDE.md` - Development practices

---

**Last Updated:** May 7, 2026  
**Status:** Ready for Phase 4 Execution
