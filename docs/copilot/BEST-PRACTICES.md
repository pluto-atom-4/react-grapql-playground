# Parallel Multi-Agent Workflows: Best Practices Quick Reference

**Target Audience**: Developers, orchestrators, reviewers using parallel multi-agent workflows  
**Purpose**: Quick lookup for patterns, don't-dos, and decision frameworks  
**Based On**: Industry best practices + academic research (2025-2026)

---

## 1. Specialist Agents: Who Does What?

| Agent | Responsibility | Looks For | Ignores | Duration |
|-------|-----------------|-----------|---------|----------|
| **Implementer** | Generate code | Logic, types, patterns | Security, perf, docs | 30-60 min |
| **Security** | Audit vulnerabilities | Injection, secrets, auth | Style, performance | 15-30 min |
| **Performance** | Detect inefficiencies | N+1, loops, memory | Correctness, docs | 10-20 min |
| **Test Writer** | Coverage & edge cases | Branch coverage, edges | Implementation details | 20-40 min |
| **Architecture** | Design compliance | SOLID, patterns, coupling | Security, style | 10-20 min |
| **Docs** | Documentation | Docstrings, examples, README | Code correctness | 10-15 min |
| **Coordinator** | Synthesize findings | Deduplication, severity | (Reads all others) | 5-10 min |

**Pattern**: Don't use 1 agent for everything. Specialist roles = better quality.

---

## 2. File Ownership: Prevent 90% of Conflicts

### ❌ Don't Do This

```bash
# No planning, hope agents don't conflict
git worktree add ../feat-1
git worktree add ../feat-2
git worktree add ../feat-3
# 💥 Merge conflicts everywhere
```

### ✅ Do This (5 Minutes Planning)

```markdown
## File Ownership Matrix

| Directory | Owner | Handoff |
|-----------|-------|---------|
| backend/ | Backend Agent | ✓ Documented |
| frontend/ | Frontend Agent | ✓ Documented |
| __tests__/ | Test Agent | ✓ Documented |
| docs/ | Docs Agent | ✓ Documented |
| config/ | Config Agent | ✓ Documented |

## Cross-Agent Handoff

If backend agent needs to update shared type:
1. Create handoff in spec: "Update UserType in types/User.ts"
2. Type agent validates + incorporates
3. Backend agent waits for confirmation
```

**Impact**: 5 min planning saves 2+ hours of merge conflict resolution.

---

## 3. Spec-Driven Development: Single Source of Truth

### ❌ Don't Do This

```
User specifies verbally → Implementer interprets → Frontend agent interprets differently
💥 Implementer: "We need User ID in response"
💥 Frontend: "We need User ID as object"
💥 Rework and conflicts
```

### ✅ Do This

Create `docs/implementation-planning/EXECUTION-PLAN-*.md`:

```markdown
# Specification

## Build Feature (Top-Level)
- **id**: string, UUID
- **status**: enum (PENDING, RUNNING, COMPLETE, FAILED)
- **parts**: Part[] (relationships)
- **testRuns**: TestRun[]

## Part (Component)
- **id**: string
- **buildId**: string (foreign key)
- **name**: string

## Agent Assignments
- Implementer: Backend resolvers for Build, Part queries
- Test Writer: Integration tests for relationships
- Security: Validate input types, test injection

## Progress Log
(Updated by agents as they work)
- 10:00 - Spec approved
- 10:15 - Implementer started
- 10:45 - Test Writer started
- ...
```

**Benefit**: All agents reading same spec = no drift = less rework.

---

## 4. Parallel Execution: When & When NOT

### ✅ Use Parallel When

- [ ] 3+ independent tasks (each takes >15 min)
- [ ] Zero blocking dependencies between tasks
- [ ] Different files modified by each agent
- [ ] Time-critical delivery (save >30 min)
- [ ] Sequential would take >90 min

**Example**: 3 tasks × 45 min sequential = 135 min → 45 min parallel = **70% speedup**

### ❌ Avoid Parallel When

- [ ] Tasks have dependencies (task B needs task A to complete first)
- [ ] Same files modified by multiple agents
- [ ] Uncertain about isolation
- [ ] Each task takes <15 min (overhead > savings)
- [ ] High integration risk

**Example**: If merging 3 tasks together always has conflicts, don't parallelize.

---

## 5. Sequential Merging: Preserve Intent

### ❌ Don't Do This (Simultaneous Merge)

```bash
git merge feat-141        # Merges, knows about main
git merge feat-143        # Merges agent-141 changes, but 143 doesn't know about 141
git merge feat-144        # Merges 141 & 143, creates merge conflicts matrix
💥 N² conflicts (hard to resolve)
```

### ✅ Do This (Sequential + Rebase)

```bash
# Merge agent 1 (knows about main)
git merge --no-ff feat-141 -m "feat: Implementation #141"

# Rebase agent 2 (now knows about agent 1)
git switch feat-143 && git rebase origin/main
# Resolve conflicts with full context

# Merge agent 2
git switch main && git merge --no-ff feat-143 -m "feat: Tests #143"

# Rebase agent 3
git switch feat-144 && git rebase origin/main
# Resolve conflicts with full context

# Merge agent 3
git switch main && git merge --no-ff feat-144 -m "feat: Docs #144"
```

**Impact**: Resolves N conflicts instead of N² conflicts.

---

## 6. Error Recovery: Classify & Recover

### Error Classification

```
Syntax Error:
  → Implementer retries with improved prompt
  → Max 3 attempts; escalate if still fails

Test Failure:
  → Implementer debugs + fixes
  → Max 3 attempts; escalate if still fails

Type Mismatch:
  → Type checker catches → Implementer fixes

Security Issue:
  → ESCALATE TO HUMAN (blocker)
  → Not something to retry automatically

Performance Issue:
  → Suggestion only (non-blocking)
  → Implementer decides if worth optimizing
```

### Self-Healing Example

```typescript
// Agent generates code
const code = implementer.generateCode(spec);

// Agent validates against success criteria
const validation = {
  compiles: await checkTypeScript(code),      // ✓
  syntaxValid: await checkSyntax(code),       // ✓
  hasErrors: checkForCommonErrors(code),      // ❌ (N+1 detected)
  testCoverage: calculateCoverage(code),      // 60% (below 80%)
};

// If validation fails, classify error
if (!validation.compiles) {
  return { status: 'syntax_error', action: 'retry', attempt: 1 };
}

// Retry up to 3 times with exponential backoff
for (let attempt = 1; attempt <= 3; attempt++) {
  const improved = await implementer.generateCode(spec, {
    feedback: `Your code had [specific error]. Review [guidance].`,
    previousAttempt: lastCode,
  });
  
  if (validate(improved).success) {
    return { status: 'recovered', result: improved };
  }
  
  if (attempt === 3) {
    return { status: 'escalate_to_human', evidence: validation };
  }
  
  await sleep(Math.pow(2, attempt) * 1000);  // Exponential backoff
}
```

---

## 7. State Management: Token Efficiency

### ❌ Don't Do This (20k tokens)

```typescript
agent.chat([
  ...allConversations,           // 15k tokens
  ...allCodeFiles,               // 5k tokens
  newMessage                     // 100 tokens
])
// Slow, expensive, cache misses
```

### ✅ Do This (500 tokens)

```typescript
const agentContext = {
  specification: state.specification,        // 1-2k tokens
  relevantFiles: ['file1.ts', 'file2.tsx'],  // 100 tokens
  roleInstructions: agent.systemPrompt,      // 200 tokens
  recentErrors: state.errorLog.slice(-5),    // 100 tokens
  // Total: ~500 tokens
};

agent.chat(agentContext);
// Fast, efficient, good cache hits
```

**Impact**: 40x token reduction, faster execution, better cache hits.

---

## 8. Preconditions Checklist: Before Dispatch

```
Before delegating parallel agents, verify:

CRITICAL:
  ☐ Zero blocking dependencies (list all; mark blocking/informational)
  ☐ File ownership mapped (no overlap between agents)

HIGH:
  ☐ Context isolated (each agent <1k tokens shared state)
  ☐ Spec is single source of truth (agents read spec, not repeated prompts)
  ☐ Task duration justified (each >15 min saves >30 min parallel?)

MEDIUM:
  ☐ Agents assigned to specialists (not generalist agents)
  ☐ Success criteria documented (how do we know each agent succeeded?)
  ☐ Integration plan clear (how do we merge results?)

NICE-TO-HAVE:
  ☐ Estimated duration per agent
  ☐ Risk assessment (what could go wrong?)
  ☐ Rollback plan (what if parallel fails?)

All CRITICAL checks pass? → Safe to dispatch
Any CRITICAL fails? → Fix before starting
```

---

## 9. Coordinator Agent: Deduplication Pattern

### How Multiple Specialists Report Findings

```
Security Agent finds:
  ❌ Line 42: Hardcoded API key

Performance Agent finds:
  ❌ Line 95: N+1 query in loop

Docs Agent finds:
  ❌ Missing docstring for setupAuth()

Coordinator Agent receives ALL findings and:
  ✓ Deduplicates (if same finding from 2 agents, keep highest severity)
  ✓ Judges severity (over-reporting check: are "minor" issues really issues?)
  ✓ Synthesizes into single comment:

--- GITHUB COMMENT ---

**Blockers** (must fix before merge):
- Line 42: Remove hardcoded API key; use env var SECRET_KEY (Security)

**Major Issues** (should fix):
- Line 95: N+1 query detected. Use DataLoader or batch query (Performance)

**Minor Issues** (nice to have):
- Missing docstring for setupAuth() function (Docs)

---
```

**Pattern**: Single consolidated comment instead of 6 separate noisy comments.

---

## 10. Real-World Decision Framework

### Scenario 1: "We have 4 independent GitHub issues, each takes 45 min"

```
Sequential: 4 × 45 min = 180 min (3 hours)
Parallel:  max(45) min = 45 min (with setup overhead: ~50 min)
Savings:   130 min (72% reduction) ✅ USE PARALLEL

Checklist:
  ✓ Zero dependencies
  ✓ Different files
  ✓ Each 45 min (>15 min threshold)
  ✓ Saves >30 min
→ VERDICT: Dispatch 4 agents in parallel
```

### Scenario 2: "Bug fix takes 20 min; QA takes 15 min; docs take 10 min"

```
Sequential: 20 + 15 + 10 = 45 min
Parallel:   max(20) = 20 min (with setup: ~25 min)
Savings:    20 min (44% reduction) ✅ MARGINAL, but OK

Precondition check:
  ✓ Zero dependencies
  ✓ Different files
  ✓ Total >30 min savings
→ VERDICT: Can parallelize if team available; sequential OK too
```

### Scenario 3: "Feature A (backend + frontend + tests) depends on Feature B"

```
Sequential: Feature B (60 min) → Feature A (90 min) = 150 min
Parallel: Feature B (60 min) → [then] Feature A parallel (90 min) = 150 min
Savings: 0 min ❌ DON'T PARALLELIZE

Blockers:
  ✗ Feature A depends on Feature B
→ VERDICT: Sequential is only option; Feature B must complete first
```

### Scenario 4: "Review 5 PRs from 5 different agents"

```
Do I parallelize?
  ✓ 5 independent PRs (zero dependencies)
  ✓ Each review takes ~30 min
  ✓ Sequential: 150 min vs parallel: 30 min
  ✓ Massive savings (80% reduction)

Specialist review:
  • Security reviewer → All 5 PRs in parallel
  • Performance reviewer → All 5 PRs in parallel
  • Test coverage reviewer → All 5 PRs in parallel
  • Coordinator → Synthesize findings from all 3

→ VERDICT: Parallelize reviews by specialist (5 PRs across 3 specialists)
```

---

## 11. When Things Go Wrong

### Merge Conflict After Clean Setup

**Symptom**: Thought zero overlap, but got conflict

**Diagnosis**:
```bash
git diff feat-141...feat-143
# Shows which files conflict
```

**Fix**:
1. Identify conflicting file
2. Review file ownership plan (was it violated?)
3. If planning error: document for next time
4. If false positive: use git to inspect actual changes
5. Resolve conflict manually or with orchestrator's help

### Test Failures in Parallel But Pass Sequential

**Symptom**: Test suite passes in feat-141, fails in feat-143

**Cause**: One of:
- State leakage (test A modifies global state, test B sees it)
- Timing dependency (test order matters)
- Shared resource (database, file system)

**Fix**:
```bash
# Run test suite in all three modes
pnpm test --run                            # Sequential
pnpm test --run -- --sequence.shuffle      # Shuffle
pnpm test --run -- --sequence.parallel     # Parallel

# All three pass? Tests are isolated ✓
# One fails? Identify which setup is wrong
```

### Agent Can't Proceed (Blocker)

**Pattern**: Agent needs work done by another agent

**Solution**: Use spec handoff mechanism:

```markdown
## Blockers & Handoffs

- Agent A blocked: Waiting for Types from Type Agent
  - Handoff: Update types/User.ts to include userId field
  - Requesting: Agent A (backend)
  - Owner: Type Agent
  - Priority: BLOCKER
  - Status: [pending] → [in progress] → [complete]
```

Agent waits; Type Agent sees handoff request; Type Agent completes; Agent resumes.

---

## 12. Performance Targets

Track these metrics:

| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| Parallel Speedup | 2.5x | ? | 2.5x faster than sequential |
| Conflict Rate | 15/100 | ? | 15 conflicts per 100 merges |
| Auto-Resolve Rate | 85% | ? | 85% auto-resolvable without human |
| Agent Failure Rate | 5% | ? | 5% of runs need human intervention |
| Auto-Recovery Rate | 90% | ? | 90% of failures self-heal |
| Test Coverage | 85% | ? | Excellent quality bar |
| Defect Rate | 2/KLOC | ? | Issues per 1000 lines of code |

**How to Track**:
- After each parallel dispatch, measure actual metrics
- Compare to targets
- Adjust strategy if missing targets

---

## 13. Anti-Patterns to Avoid

### ❌ Antipattern 1: Agent Reviewing Its Own Work

```typescript
code = implementer.generateCode(spec);
review = implementer.reviewCode(code);  // ❌ Self-bias
```

**Fix**: Different agent reviews:
```typescript
code = implementer.generateCode(spec);
review = reviewerAgent.reviewCode(code);  // ✓ Independent eyes
```

### ❌ Antipattern 2: Broadcasting Full Context

```typescript
agent.chat([...allConversations, ...allFiles, message]);  // ❌ 20k tokens
```

**Fix**: Structured state:
```typescript
agent.chat({
  specification: spec,
  relevantFiles: ['file1', 'file2'],
  instructions: prompt
});  // ✓ 500 tokens
```

### ❌ Antipattern 3: No File Ownership Planning

```bash
# Hope they don't conflict 😂
git worktree add ../feat-1
git worktree add ../feat-2
```

**Fix**: Ownership matrix first (5 min):
```markdown
| backend/ | Backend Agent | ✓ |
| frontend/ | Frontend Agent | ✓ |
```

### ❌ Antipattern 4: Simultaneous Merging

```bash
git merge feat-141 && git merge feat-143 && git merge feat-144  # ❌ N² conflicts
```

**Fix**: Sequential + rebase:
```bash
git merge feat-141 && git rebase (for 143) && git merge feat-143 && git rebase (for 144) && git merge feat-144  # ✓ N conflicts
```

### ❌ Antipattern 5: No Error Classification

```typescript
if (error) retry();  // ❌ Might infinite loop
```

**Fix**: Classify + map to recovery:
```typescript
const strategy = errorStrategy[error.type];
if (attempt < 3) retry(strategy.feedback);
else escalate(human);  // ✓ Structured
```

---

## Quick Links

- **Full Research**: [docs/PARALLEL-MULTI-AGENT-WORKFLOWS.md](../docs/PARALLEL-MULTI-AGENT-WORKFLOWS.md)
- **Enhancements Applied**: [.copilot/RESEARCH-ENHANCEMENTS-APPLIED.md](./.copilot/RESEARCH-ENHANCEMENTS-APPLIED.md)
- **Configuration**: [.copilot/rules.json](./.copilot/rules.json) & [.copilot/config.json](./.copilot/config.json)
- **Execution Plan Template**: [docs/implementation-planning/EXECUTION-PLAN-*.md](../docs/implementation-planning/)

---

**Version**: 1.0  
**Updated**: May 10, 2026  
**Status**: ✅ Production Ready  
**For Questions**: Refer to PARALLEL-MULTI-AGENT-WORKFLOWS.md for deep dives
