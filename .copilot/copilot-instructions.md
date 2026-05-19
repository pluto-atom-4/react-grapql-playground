# ⚠️ DEPRECATED - Copilot Instructions

This file has been **migrated to the official GitHub Copilot instructions pattern**.

## 🔄 New Locations

Please use these locations instead:

### Root Instructions (Navigation & Quick Reference)
- **File**: `.github/copilot-instructions.md`
- **Purpose**: High-level workflow overview, quick navigation, core principles
- **Size**: 75 lines (TOC and quick reference)

### Layer-Specific Guidance
All layer-specific instructions are now in `.github/instructions/`:
- **`frontend.instructions.md`** — React, Next.js, Apollo Client, Tailwind
- **`backend-graphql.instructions.md`** — Apollo Server, resolvers, DataLoader
- **`backend-express.instructions.md`** — Express, file uploads, webhooks, SSE
- **`shared.instructions.md`** — Monorepo, build, test, lint, package management
- **`workflow-phases.instructions.md`** — Detailed 30-phase workflow reference

### Agent Configurations
All agent definitions are now in `.github/copilot/agents/`:
- `orchestrator.md` — Coordinates multi-layer development
- `developer.md` — Implements features and fixes
- `reviewer.md` — Reviews code and validates architecture
- `tester.md` — Tests and validates coverage
- `product-manager.md` — Defines requirements and acceptance criteria
- `quality-assurance.md` — Ensures quality standards

---

## 📖 How to Use

1. **Quick Start** → Read `.github/copilot-instructions.md` (5 min)
2. **Layer-Specific Work** → Read relevant `.github/instructions/*.md` (10-15 min)
3. **Detailed Reference** → Read `.github/instructions/workflow-phases.instructions.md` (reference)
4. **Agent Details** → Read `.github/copilot/agents/[agent].md` (specific agent)

---

## ⏱️ Backward Compatibility

This file is kept for backwards compatibility with older references. **All new references should use the official GitHub pattern files listed above.**

---

**Last Migrated**: 2026-05-19  
**Migration Status**: Complete ✅  
**Pattern**: Official GitHub Copilot Hybrid Pattern
