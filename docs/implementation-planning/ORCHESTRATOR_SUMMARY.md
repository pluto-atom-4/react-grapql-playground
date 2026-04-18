# ESLint v9 Monorepo Migration - Orchestrator Summary

## Overview

The Orchestrator Agent has created a comprehensive, detailed implementation plan to migrate the react-grapql-playground monorepo from ESLint v8 (`.eslintrc.json`) to ESLint v9 (flat config `eslint.config.js`).

## Problem Statement

**Current Issue**:
```
ESLint: 9.39.4
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
From ESLint v9.0.0, the default configuration file is now eslint.config.js
```

**Impact**: The `pnpm lint` command is broken across all 4 packages (root, frontend, backend-graphql, backend-express).

**Scope**: Full monorepo migration covering:
- TypeScript + ESLint base rules
- React + React Hooks + Next.js (frontend)
- GraphQL Apollo Server rules (backend)
- Express.js rules (backend)

---

## Deliverables

### 1. **Detailed Implementation Plan** 
📄 **File**: `docs/implementation-planning/ESLINT-V9-MIGRATION.md` (20KB)

**Contains**:
- Complete problem analysis and current state documentation
- Migration strategy and architecture decisions
- 17 actionable todos organized in 5 phases
- Risk analysis and mitigation strategies
- Timeline estimates (~3-3.5 hours total)
- Rollback procedures
- Success criteria
- Useful resource links

### 2. **Todo Tracking Database**
A SQL database with full dependency tracking:
- **17 todos** organized in kebab-case IDs for clarity
- **5 distinct phases** with explicit dependencies
- **Parallel execution** opportunities identified (Phase 1, Phase 3)
- **Critical path** clearly marked for sequential execution

---

## Implementation Phases

### ✅ Phase 1: Investigation (5 todos, 30-45 min)
**Goal**: Analyze current state and plan configurations

**Parallel todos**:
1. `investigate-eslint-v9-state` - Check versions, existing configs
2. `analyze-root-eslintrc` - Extract root ESLint rules
3. `analyze-frontend-eslintrc` - Extract frontend React/Next.js rules
4. `analyze-backend-graphql-eslint` - Document GraphQL backend needs
5. `analyze-backend-express-eslint` - Document Express backend needs

**Deliverable**: Detailed rule mapping documents for each package

---

### ✅ Phase 2: Configuration Creation (4 todos, 1-1.5 hours)
**Goal**: Create new `eslint.config.js` files for each package

**Sequential todos** (depend on Phase 1):
1. `create-root-eslint-config-js` - Root flat config (baseline)
2. `create-frontend-eslint-config-js` - React + Next.js specific config
3. `create-backend-graphql-eslint-config-js` - GraphQL backend config
4. `create-backend-express-eslint-config-js` - Express backend config

**Deliverable**: 4 new `eslint.config.js` files following ESLint v9 flat config format

---

### ✅ Phase 3: Dependencies (1 todo, 15-20 min)
**Goal**: Ensure all ESLint v9 plugins are installed

**Todo**:
1. `install-missing-eslint-packages` - Verify and install missing packages

**Deliverable**: Updated `pnpm-lock.yaml` with all v9-compatible dependencies

---

### ✅ Phase 4: Testing (5 todos, 30-45 min)
**Goal**: Verify each package's linting passes individually and together

**Sequential todos** (depend on Phase 2 & 3):
1. `test-root-lint` - Root package linting
2. `test-frontend-lint` - Frontend package linting
3. `test-backend-graphql-lint` - GraphQL backend linting
4. `test-backend-express-lint` - Express backend linting
5. `test-full-monorepo-lint` - Full `pnpm lint` command

**Deliverable**: All linting passes; linting command restored to working state

---

### ✅ Phase 5: Documentation & Cleanup (2 todos, 20-30 min)
**Goal**: Document changes and remove deprecated configs

**Sequential todos** (depend on Phase 4 success):
1. `document-migration-notes` - Update CLAUDE.md with migration details
2. `remove-old-eslintrc-files` - Delete deprecated `.eslintrc.json` files

**Deliverable**: Cleaned codebase, updated development guide

---

## Architecture Decisions

### Config Per Package (Recommended ✅)

Each package has its own `eslint.config.js`:

```
Root ESLint Config
├─ typescript + eslint base rules
├─ shared custom rules
└─ ignore patterns (dist, build, .next, node_modules, coverage)

Frontend ESLint Config (extends root)
├─ + React plugin
├─ + React Hooks plugin
├─ + Next.js plugin
└─ + React 19 specific rules

Backend GraphQL ESLint Config (extends root)
└─ (no additional plugins needed)

Backend Express ESLint Config (extends root)
└─ (no additional plugins needed)
```

**Benefits**:
- Independent configuration per package
- Easier to maintain and extend
- Clear separation of concerns
- Flexibility for future package-specific rules

---

## Success Metrics

All of the following must be true:

1. ✅ **4 new `eslint.config.js` files** created (root, frontend, graphql, express)
2. ✅ **`pnpm lint`** runs without errors
3. ✅ **No ESLint v9 errors** ("couldn't find eslint.config.js" resolved)
4. ✅ **All existing rules preserved** (same strictness as v8)
5. ✅ **`pnpm lint:fix`** works to auto-fix issues
6. ✅ **Old `.eslintrc.json` files removed**
7. ✅ **Documentation updated** with migration details
8. ✅ **Zero test regressions** (all existing tests pass)

---

## Timeline

| Phase | Duration | Can Run in Parallel? |
|-------|----------|---|
| Phase 1: Investigation | 30-45 min | ✅ Yes (5 parallel tasks) |
| Phase 2: Configuration | 1-1.5 hr | ❌ No (sequential) |
| Phase 3: Dependencies | 15-20 min | ✅ Yes (1 task) |
| Phase 4: Testing | 30-45 min | ❌ No (sequential) |
| Phase 5: Cleanup | 20-30 min | ❌ No (sequential) |
| **Total** | **~3-3.5 hours** | |

**Optimized Critical Path**:
1. Run Phase 1 tasks in parallel (30-45 min)
2. Phase 3 in parallel with Phase 2 (after Phase 1)
3. Phase 2 → Phase 4 → Phase 5 sequential

---

## Risk Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| ESLint v9 breaking changes | High | Follow official migration guide; test incrementally |
| Plugin incompatibility | Medium | Verify all plugins support v9; check GitHub issues |
| TypeScript parser issues | Medium | Use matching `@typescript-eslint/*` versions |
| Prettier formatting conflicts | Low | Run `pnpm format:check` after migration |
| Monorepo config issues | Medium | Test each package independently first |
| Configuration mistakes | Medium | Peer review config files before deletion of old files |

**Rollback Plan**: If anything fails, restore from git: `git restore .eslintrc.json && rm eslint.config.js`

---

## Key Resources

The implementation plan includes:

1. **ESLint v9 Flat Config Template** - Ready-to-use boilerplate for each package
2. **Rule Mapping Guide** - Step-by-step conversion for all existing rules
3. **Testing Checklist** - Verification steps for each phase
4. **Troubleshooting Guide** - Common issues and solutions
5. **Resource Links** - Official ESLint v9 migration documentation

---

## Next Steps for Implementation Team

1. **Read the full plan**: `docs/implementation-planning/ESLINT-V9-MIGRATION.md`
2. **Start Phase 1**: Begin investigation tasks in parallel
3. **Track progress**: Use the SQL database for status updates
4. **Execute Phase 2**: Create eslint.config.js files (follow templates provided)
5. **Run Phase 3-5**: Test and verify migration success

---

## Questions Answered in the Plan

- ✅ What's the current ESLint configuration?
- ✅ Why is the lint command broken?
- ✅ What needs to change for ESLint v9?
- ✅ Which packages are affected?
- ✅ Should we have one shared config or per-package configs?
- ✅ What are the ESLint v9 flat config differences?
- ✅ How do we maintain existing linting rules?
- ✅ What's the migration timeline?
- ✅ How do we handle React/Next.js specific rules in v9?
- ✅ What if something breaks?

---

**Created**: April 17, 2026  
**Creator**: Orchestrator Agent  
**Status**: ✅ Ready for Implementation  
**Complexity**: Medium (17 todos, cross-cutting monorepo concern)  
**Estimated Time**: 3-3.5 hours total  
**Priority**: Medium (quality gate, not blocking features)
