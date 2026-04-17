# Copilot Agent Enforcement Policy

This project requires **exclusive use of project-specific agents** for all Copilot CLI interactions.

## ✅ Approved Workflow

All interactions must route through one of the 6 specialized agents:

```bash
@developer        → Implementation & coding tasks
@orchestrator     → Cross-layer coordination
@product-manager  → Requirements & feature definition
@reviewer         → Code review & quality
@quality-assurance → Linting, testing, security
@tester           → Test strategy & coverage
```

## 📋 Usage Pattern

**Always prefix requests with agent mentions:**

```bash
# ✅ CORRECT
@developer How do I implement DataLoader?
@orchestrator Help coordinate this feature across layers
@reviewer Review this resolver for N+1 issues

# ❌ INCORRECT (Direct Copilot CLI without agent)
"How do I implement DataLoader?"
```

## 🎯 Interaction Routing Guide

| Task | Agent | Example |
|------|-------|---------|
| **Implement feature** | `@developer` | `@developer Build the file upload handler` |
| **Coordinate layers** | `@orchestrator` | `@orchestrator How do I connect GraphQL to Express?` |
| **Define requirements** | `@product-manager` | `@product-manager What are acceptance criteria?` |
| **Review code** | `@reviewer` | `@reviewer Check this resolver for issues` |
| **Run QA checks** | `@quality-assurance` | `@quality-assurance Run pre-commit checks` |
| **Write tests** | `@tester` | `@tester How do I test this mutation?` |

## 🚨 Escalation Rules

| Situation | Escalate To |
|-----------|------------|
| Blocked on another layer | `@orchestrator` |
| Architectural decision needed | `@orchestrator` |
| Test failures | `@tester` → `@developer` |
| Code quality concerns | `@quality-assurance` → `@reviewer` |
| Feature ambiguity | `@product-manager` |

## 📁 Configuration Files

- **`.copilot/config.json`** — Model config + enforcement flag
- **`.copilot/rules.json`** — Complete enforcement ruleset (6 agents, routing, context)
- **`.copilot/agents/README.md`** — Agent overview & collaboration patterns
- **`.copilot/agents/*.md`** — Individual agent guidance (6 files, ~2600 lines)

## 🔧 Why This Matters

✅ **Consistency** — All tasks routed through appropriate expertise  
✅ **Quality** — Each agent applies domain-specific patterns  
✅ **Coordination** — Cross-layer work explicitly planned  
✅ **Scalability** — Easier to onboard new contributors  
✅ **Interview Prep** — Aligns with manufacturing domain & architecture decisions  

## 📚 Key Concepts Referenced by All Agents

- Dual-backend architecture (GraphQL + Express)
- DataLoader for N+1 prevention
- Optimistic updates with Apollo Client
- Real-time SSE notifications
- Event bus coordination
- Manufacturing domain (Build, Part, TestRun)

---

**Policy Version**: 1.0  
**Effective Date**: April 17, 2026  
**Project**: react-grapql-playground (Full-stack Interview Prep)
