# .copilot/ Directory Index

**Purpose:** Orchestration configuration and multi-agent GitHub Copilot workflows  
**Last Updated:** May 7, 2026  
**Status:** Ready for Phase 4 Execution

---

## 📁 Directory Structure

```
.copilot/
├── INDEX.md (this file)
├── config.json (Core orchestration configuration)
├── rules.json (Agent rule enforcement)
├── ENFORCEMENT.md (Rule enforcement policy)
├── DOCUMENTATION-POLICY.md (Documentation standards)
├── PARALLEL-EXECUTION-GUIDE.md (Git worktree coordination)
│
├── GitHub Issue Orchestration (NEW - Phase 4)
│   ├── orchestrator-github-issues.md (Complete workflow guide)
│   ├── phase-4-orchestration-quick-reference.md (Quick execution steps)
│   └── GITHUB-ISSUE-ORCHESTRATION-SUMMARY.md (Overview & links)
│
└── agents/ (Agent role definitions)
    ├── README.md (Agent system overview)
    ├── orchestrator.md (Main coordinator)
    ├── developer.md (Implementation layer)
    ├── reviewer.md (Code quality & architecture)
    ├── tester.md (Testing & quality assurance)
    ├── product-manager.md (Requirements & scope)
    └── quality-assurance.md (QA & verification)
```

---

## 🎯 Quick Navigation by Use Case

### I'm an Orchestrator Executing Phase 4

**Start Here:** 
1. `.copilot/phase-4-orchestration-quick-reference.md` (5-10 min read)
2. Execute the "EXECUTE NOW" section (5 min)
3. Send agents their issue-specific instructions
4. Monitor with the provided commands

**Reference:** `.copilot/orchestrator-github-issues.md` for details

---

### I'm a Developer/Agent Working on an Issue

**Steps:**
1. Receive assignment from orchestrator (e.g., Issue #34)
2. Go to your worktree: `cd ../feat-34/`
3. Find your section in `.copilot/phase-4-orchestration-quick-reference.md`
4. Follow the executable bash commands
5. Reference `docs/implementation-planning/PHASE-4-ISSUE-BREAKDOWN.md` for detailed AC

**Need Help?**
- Git workflow: `.copilot/orchestrator-github-issues.md` → "Agent Workflow" section
- Issue details: `docs/implementation-planning/PHASE-4-ISSUE-BREAKDOWN.md`

---

### I'm Reviewing Multiple PRs

**Pattern:** `.copilot/orchestrator-github-issues.md` → "Reviewer Agent: Multi-PR Review Workflow"

**Optional Integration Review:**
```bash
git branch feat/phase-4-integration-review origin/main
git merge feat/issue-#34-*
git merge feat/issue-#35-*
git merge feat/issue-#39-*
git merge feat/issue-#40-*
pnpm test --run
```

---

### I Want to Understand the Full System

**Reading Order:**
1. `.copilot/GITHUB-ISSUE-ORCHESTRATION-SUMMARY.md` (overview)
2. `.copilot/agents/orchestrator.md` (orchestrator role)
3. `.copilot/orchestrator-github-issues.md` (detailed workflow)
4. `.copilot/PARALLEL-EXECUTION-GUIDE.md` (git worktree details)
5. `.copilot/agents/developer.md` (developer responsibilities)

---

## 📚 File Descriptions

### Configuration Files

#### `config.json`
- Core orchestration settings
- Model selection (Claude Haiku 4.5)
- Parallel execution config
- **NEW:** GitHub issue orchestration settings
- Safety checks (dependency-analysis, file-overlap-detection)
- Documentation references

#### `rules.json`
- Agent rule enforcement
- Specific rules per agent
- Escalation criteria
- Code review requirements

#### `ENFORCEMENT.md`
- How rules are enforced
- Violations and consequences
- Escalation process
- Audit trail

---

### Orchestration Guides

#### `PARALLEL-EXECUTION-GUIDE.md`
- Git worktree fundamentals
- Parallel development patterns
- Parallel test execution
- Workflow coordination
- **When to use:** General parallel work across multiple features

#### `orchestrator-github-issues.md` ✨ **NEW - Phase 4**
- GitHub issue-specific orchestration
- Multi-agent dispatch workflow
- Feature branch naming convention
- Commit message convention
- Agent step-by-step instructions
- Orchestrator monitoring commands
- Reviewer multi-PR pattern
- Git workflow lifecycle
- Safety checks before merge

#### `phase-4-orchestration-quick-reference.md` ✨ **NEW - Phase 4**
- Immediate execution guide
- Setup steps (5 min total)
- Agent instructions for Issues #34, #35, #39, #40
- Executable bash commands (copy-paste ready)
- Success criteria per agent
- Monitoring commands
- Cleanup instructions
- Timeline estimate
- **When to use:** Actually executing Phase 4

#### `GITHUB-ISSUE-ORCHESTRATION-SUMMARY.md` ✨ **NEW - Phase 4**
- Overview of new enhancements
- What's new in .copilot/
- How to use the configuration
- Key features explained
- Phase 4 quick stats
- Pre-execution checklist
- **When to use:** Understanding the new system

---

### Policy Files

#### `DOCUMENTATION-POLICY.md`
- Documentation standards
- Code comments policy
- PR template requirements
- Commit message guidelines
- README maintenance

---

### Agent Definitions

#### `agents/README.md`
- Agent system overview
- When to use each agent
- Collaboration patterns
- Cross-agent communication

#### `agents/orchestrator.md`
- Orchestrator responsibilities
- Coordination commands
- Project structure understanding
- Decision-making framework
- **NEW:** GitHub issue orchestration section
- Parallel tester coordination
- Model override guidance
- Escalation criteria

#### `agents/developer.md`
- Development responsibilities
- Three-layer architecture
- Integration points
- Testing approach
- Code style guide
- **Related:** Parallel development patterns

#### `agents/reviewer.md`
- Code review responsibilities
- Architectural decisions
- Code quality standards
- Performance verification
- **Related:** Multi-PR consolidation pattern

#### `agents/tester.md`
- Test responsibilities
- Test isolation patterns
- Parallel test execution
- Test coverage metrics
- **Related:** Layer-specific testing

#### `agents/product-manager.md`
- Requirements management
- Acceptance criteria definition
- Priority and scope
- Stakeholder communication

#### `agents/quality-assurance.md`
- QA responsibilities
- Acceptance verification
- Release criteria
- Risk assessment

---

## 🎯 Phase 4 Execution Workflow

```
┌─ Read Quick Reference (5 min)
│  .copilot/phase-4-orchestration-quick-reference.md
│
├─ Execute Setup (5 min)
│  ├─ Create feature branches
│  ├─ Create git worktrees
│  └─ Assign developers
│
├─ Send Agent Instructions (per issue)
│  ├─ Issue #34 (Pagination) → Developer 1
│  ├─ Issue #35 (Skeletons) → Developer 2
│  ├─ Issue #39 (Tailwind) → Developer 3
│  └─ Issue #40 (Accessibility) → Developer 4
│
├─ Monitor Progress (every 30 min)
│  └─ Check PR creation, test status, blockers
│
├─ Code Review & Merge
│  └─ Optional: Use integration review pattern
│
└─ Cleanup & Next Phase
   ├─ Remove worktrees
   └─ Start Phase 5
```

**Total Duration:** 3-4 hours (vs 9.5 sequential)

---

## 🔧 Common Commands

### Setup (Orchestrator)
```bash
# Create feature branches
git branch feat/issue-#34-pagination origin/main
git branch feat/issue-#35-skeletons origin/main
git branch feat/issue-#39-tailwind origin/main
git branch feat/issue-#40-accessibility origin/main

# Create worktrees
git worktree add ../feat-34 feat/issue-#34-pagination
git worktree add ../feat-35 feat/issue-#35-skeletons
git worktree add ../feat-39 feat/issue-#39-tailwind
git worktree add ../feat-40 feat/issue-#40-accessibility
```

### Agent Workflow (Per Developer)
```bash
# Switch to worktree
cd ../feat-<N>
git switch feat/issue-#<N>-<name>

# Work and commit
git commit -m "feat: #<N> description"
git push -u origin feat/issue-#<N>-<name>

# Create PR
gh pr create --base main --title "feat: #<N> - Description"
```

### Monitor (Orchestrator)
```bash
# Check PR status
gh pr list --state open

# Monitor agent commits
git log main..feat/issue-#34-* --oneline
git log main..feat/issue-#35-* --oneline
git log main..feat/issue-#39-* --oneline
git log main..feat/issue-#40-* --oneline

# Verify worktrees
git worktree list
```

### Merge (Orchestrator)
```bash
# Merge PRs (any order)
gh pr merge 34 --merge
gh pr merge 35 --merge
gh pr merge 39 --merge
gh pr merge 40 --merge

# Remove worktrees
git worktree remove ../feat-34
git worktree remove ../feat-35
git worktree remove ../feat-39
git worktree remove ../feat-40
```

---

## 📊 Agent Responsibilities Matrix

| Agent | Primary Role | Key Skills | Phase 4 Role |
|-------|--------------|-----------|--------------|
| **Orchestrator** | Coordinate multi-agent work | Planning, git, GitHub CLI | Dispatch agents, monitor PRs, merge |
| **Developer** | Implement features | Coding, testing | Implement issue solutions |
| **Reviewer** | Code quality & architecture | Analysis, best practices | Review PRs, optional integration review |
| **Tester** | Test coverage | Testing frameworks, quality | Test issue implementations |
| **QA** | Acceptance verification | Requirements, user perspective | Verify acceptance criteria |
| **PM** | Requirements & scope | Communication, prioritization | Define issue acceptance criteria |

---

## ✅ Phase 4 Success Checklist

### Before Execution
- [ ] Read `.copilot/phase-4-orchestration-quick-reference.md`
- [ ] Read `docs/implementation-planning/PHASE-4-ISSUE-BREAKDOWN.md`
- [ ] Create feature branches (git branch)
- [ ] Create worktrees (git worktree add)

### During Execution
- [ ] All 4 agents dispatched to worktrees
- [ ] All 4 agents making progress
- [ ] PRs created as work completes
- [ ] Monitor progress every 30 minutes

### After Merge
- [ ] All 4 PRs merged to main
- [ ] 741+ tests passing
- [ ] Worktrees removed
- [ ] Phase 5 ready to start

---

## 🎓 Learning Path

**New to orchestration?**
1. Start: `.copilot/GITHUB-ISSUE-ORCHESTRATION-SUMMARY.md`
2. Quick execution: `.copilot/phase-4-orchestration-quick-reference.md`
3. Detailed reference: `.copilot/orchestrator-github-issues.md`

**Want to understand git worktrees?**
1. Start: `.copilot/PARALLEL-EXECUTION-GUIDE.md`
2. Application: `.copilot/orchestrator-github-issues.md`

**Want to understand agent roles?**
1. Start: `.copilot/agents/README.md`
2. Orchestrator: `.copilot/agents/orchestrator.md`
3. Developer: `.copilot/agents/developer.md`

---

## 🚀 Ready to Start?

1. Open `.copilot/phase-4-orchestration-quick-reference.md`
2. Execute the "EXECUTE NOW" section (5 minutes)
3. Send agents their issue-specific instructions
4. Sit back and monitor progress

**Expected Outcome:** Phase 4 complete in 3-4 hours (vs 9.5 sequential)

---

## 📞 File Quick Reference

| File | Purpose | When to Use |
|------|---------|------------|
| `config.json` | Core configuration | Reference for settings |
| `orchestrator-github-issues.md` | Complete workflow guide | Detailed questions |
| `phase-4-orchestration-quick-reference.md` | Actionable steps | Executing Phase 4 NOW |
| `GITHUB-ISSUE-ORCHESTRATION-SUMMARY.md` | Overview & summary | Understanding what's new |
| `agents/orchestrator.md` | Orchestrator role | Understanding responsibilities |
| `agents/developer.md` | Developer responsibilities | Understanding agent workflow |
| `agents/reviewer.md` | Reviewer pattern | Understanding multi-PR review |
| `PARALLEL-EXECUTION-GUIDE.md` | Git worktree guide | Understanding parallel execution |

---

## 📌 Key Takeaways

✅ **Feature Branch Convention:** `feat/issue-#<N>-<kebab-description>`  
✅ **Commit Convention:** `<type>: #<N> description`  
✅ **Agent Workflow:** Branch → Switch → Implement → Commit → Push → PR  
✅ **Orchestrator Role:** Dispatch → Monitor → Merge → Cleanup  
✅ **Success:** 4 independent PRs, 741+ tests, phase complete  
✅ **Duration:** 3-4 hours parallel (vs 9.5 sequential)  

---

**Last Updated:** May 7, 2026  
**Status:** 🟢 Ready for Phase 4  
**Next Step:** Read `phase-4-orchestration-quick-reference.md`
