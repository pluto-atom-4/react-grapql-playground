# 📖 GitHub Copilot Instructions

This directory contains official GitHub Copilot instructions following the hybrid pattern (root + path-specific guidance).

## 📁 Files in This Directory

### Workflow & Reference
- **`workflow-phases.instructions.md`** (758 lines)
  - 30 detailed workflow phases for multi-agent orchestration
  - PR feedback cycles and implementation patterns
  - Comprehensive reference for project methodology
  - **When to Use**: Deep dive into workflow, troubleshooting phases, understanding patterns

### Layer-Specific Guidance
- **`frontend.instructions.md`** (206 lines)
  - React, Next.js, Apollo Client, Tailwind CSS
  - Server/Client components, optimistic updates, real-time events
  - Testing with Vitest and React Testing Library
  - **When to Use**: Working in `/frontend` directory

- **`backend-graphql.instructions.md`** (303 lines)
  - Apollo Server, GraphQL resolvers, DataLoader patterns
  - Schema design, event emission, N+1 prevention
  - Integration with Express and real-time events
  - **When to Use**: Working in `/backend-graphql` directory

- **`backend-express.instructions.md`** (367 lines)
  - Express.js server, file uploads, webhook handlers
  - Server-Sent Events (SSE), real-time notifications
  - Event broadcasting and integration with GraphQL
  - **When to Use**: Working in `/backend-express` directory

- **`shared.instructions.md`** (347 lines)
  - Monorepo-wide guidance: pnpm, workspaces
  - Build, test, lint commands (including layer-specific variants)
  - Quality gates and Issue #306 automation
  - **When to Use**: Setting up environment, running multi-layer commands

---

## 🚀 Quick Start

### 1. **First Time?** Start Here
```
Read: .github/copilot-instructions.md (root file, 5 minutes)
Then: Choose your layer-specific file below
```

### 2. **Working on Frontend**
```
Read: frontend.instructions.md (10-15 minutes)
Focus: React patterns, Apollo Client, testing
```

### 3. **Working on GraphQL Backend**
```
Read: backend-graphql.instructions.md (10-15 minutes)
Focus: Schema design, resolvers, DataLoader
```

### 4. **Working on Express Backend**
```
Read: backend-express.instructions.md (10-15 minutes)
Focus: Routes, file uploads, webhooks, SSE
```

### 5. **Monorepo Commands**
```
Read: shared.instructions.md (10-15 minutes)
Focus: Build, test, lint across layers
```

### 6. **Deep Dive into Workflow**
```
Read: workflow-phases.instructions.md (reference)
Focus: 30 phases, patterns, troubleshooting
```

---

## 🎯 Navigation by Task

**"How do I...?"**

| Task | File |
|------|------|
| Set up the project | `shared.instructions.md` |
| Start development | Your layer's file (frontend, backend-*) |
| Create an optimistic update | `frontend.instructions.md` |
| Prevent N+1 queries | `backend-graphql.instructions.md` |
| Handle file uploads | `backend-express.instructions.md` |
| Run all tests | `shared.instructions.md` |
| Understand the workflow | `workflow-phases.instructions.md` |
| Fix a PR feedback issue | `workflow-phases.instructions.md` |

---

## 🏗️ Architecture & Integration

See the root `.github/copilot-instructions.md` for:
- High-level architecture overview
- Core workflow principles
- Quick navigation diagram
- Agent role descriptions

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `.github/copilot-instructions.md` | Root instructions (navigation + quick reference) |
| `.github/copilot/agents/` | Agent configurations (orchestrator, developer, etc.) |
| `.github/copilot/settings.json` | Copilot CLI settings and agent loading config |
| `.copilot/copilot-instructions.md` | **DEPRECATED** — Redirects to this directory |
| `.copilot/rules.json` | Legacy implementation rules (superseded by these instructions) |
| `docs/implementation-planning/` | Execution plans, PR registry, implementation guides |

---

## 🔄 How Files Are Used

1. **GitHub Copilot CLI** loads `.github/copilot-instructions.md` as root
2. Users navigate to path-specific files based on what they're working on
3. Detailed workflow reference (`workflow-phases.instructions.md`) for deep dives
4. All agents (`@orchestrator`, `@developer`, etc.) reference these instructions

---

## 📝 File Sizes

| File | Lines | Size | Purpose |
|------|-------|------|---------|
| `workflow-phases.instructions.md` | 758 | 27K | Comprehensive workflow reference |
| `backend-express.instructions.md` | 367 | 9.8K | Express-specific guidance |
| `shared.instructions.md` | 347 | 9.4K | Monorepo-wide guidance |
| `backend-graphql.instructions.md` | 303 | 8.1K | GraphQL-specific guidance |
| `frontend.instructions.md` | 206 | 6.5K | React/Next.js guidance |
| **Total** | **1,981** | **61K** | Complete instruction set |

---

## ✅ Official GitHub Pattern

This directory follows the **official GitHub Copilot hybrid pattern**:
- ✅ Root file at `.github/copilot-instructions.md`
- ✅ Path-specific files in `.github/instructions/`
- ✅ Agent configs in `.github/copilot/agents/`
- ✅ Settings at `.github/copilot/settings.json`

Adopted by: Microsoft, HashiCorp, Supabase, GitHub's own repositories

---

**Last Updated**: 2026-05-19  
**Pattern**: Official GitHub Copilot Hybrid  
**Status**: Production-ready ✅
