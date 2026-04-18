# ESLint v9 Migration - Implementation Planning

## 📋 Overview

This directory contains the complete implementation plan for migrating the react-grapql-playground monorepo from ESLint v8 (`.eslintrc.json`) to ESLint v9 (flat config `eslint.config.js`).

**Problem**: The `pnpm lint` command fails with "ESLint couldn't find an eslint.config.(js|mjs|cjs) file"

**Solution**: Create ESLint v9 flat config files for all 4 packages (root, frontend, backend-graphql, backend-express)

---

## 📂 Files in This Directory

### 1. **ORCHESTRATOR_SUMMARY.md** (Start Here!)
   - High-level overview of the entire migration plan
   - 5-phase breakdown with timelines
   - Success criteria and risk analysis
   - Key takeaways for implementation team
   - **Read this first** (5-10 min read)

### 2. **ESLINT-V9-MIGRATION.md** (Detailed Technical Plan)
   - Complete problem analysis and current state documentation
   - Detailed investigation todos with steps
   - ESLint v9 flat config templates for each package
   - Testing procedures and success criteria
   - Rollback procedures and troubleshooting
   - **Use this as primary implementation guide** (30-40 min read)

### 3. **TODO_STRUCTURE.txt** (Visual Execution Plan)
   - Tree-view diagram of all 17 todos
   - Dependency relationships shown visually
   - Parallel vs. sequential execution marked
   - Optimized critical path for execution
   - Success criteria checklist
   - Risk register with mitigations
   - **Use this for tracking progress** (5 min reference)

---

## 🎯 Quick Facts

| Aspect | Detail |
|--------|--------|
| **Total Todos** | 17 |
| **Implementation Phases** | 5 |
| **Estimated Duration** | 3-3.5 hours |
| **Packages Affected** | 4 (root, frontend, graphql, express) |
| **Files to Create** | 4 new `eslint.config.js` files |
| **Files to Delete** | 2 old `.eslintrc.json` files |
| **Priority** | Medium (quality gate, not blocking) |
| **Complexity** | Medium |

---

## 📊 Implementation Phases

### Phase 1: Investigation (30-45 min)
**Can run in parallel** ✅
- Analyze current ESLint configuration
- Extract rules from `.eslintrc.json` files
- Document package-specific needs

**5 todos**: All can start simultaneously

### Phase 2: Configuration (1-1.5 hours)
**Must run sequentially** ⚠️
- Create root `eslint.config.js` (baseline)
- Create frontend config (React + Next.js)
- Create GraphQL backend config
- Create Express backend config

**4 todos**: Root first, then others can branch off

### Phase 3: Dependencies (15-20 min)
**Can run in parallel with Phase 2** ✅
- Verify and install ESLint v9 plugins
- Update lock file

**1 todo**: Single task

### Phase 4: Testing (30-45 min)
**Must run sequentially** ⚠️
- Test root linting
- Test frontend linting
- Test GraphQL backend linting
- Test Express backend linting
- Test full monorepo linting

**5 todos**: Sequential to identify issues

### Phase 5: Cleanup (20-30 min)
**Must run sequentially** ⚠️
- Document migration in CLAUDE.md
- Remove old `.eslintrc.json` files

**2 todos**: Sequential to ensure nothing breaks

---

## 🚀 How to Get Started

### For Implementation Team:
1. **Read** `ORCHESTRATOR_SUMMARY.md` (10 min)
2. **Review** `ESLINT-V9-MIGRATION.md` (30-40 min)
3. **Check** `TODO_STRUCTURE.txt` for visual overview (5 min)
4. **Execute** Phase 1 tasks in parallel
5. **Track progress** using TODO_STRUCTURE.txt checklist
6. **Follow** Phase 2-5 sequentially as described

### For Reviewers:
1. **Understand** the problem: `.eslintrc.json` → `eslint.config.js` migration
2. **Verify** each package has a new config file
3. **Check** that `pnpm lint` passes end-to-end
4. **Confirm** old files are deleted only after full testing
5. **Review** documentation updates for accuracy

### For Project Managers:
- **Timeline**: 3-3.5 hours total
- **Effort**: 1 developer for focused time block
- **Risk**: Low-medium with proper testing
- **Blockers**: None identified
- **Dependencies**: None on other tasks

---

## ✅ Success Criteria

All of the following must be true:

1. ✅ 4 new `eslint.config.js` files created (root, frontend, graphql, express)
2. ✅ `pnpm lint` runs without errors
3. ✅ No ESLint v9 errors ("couldn't find eslint.config.js" resolved)
4. ✅ All existing linting rules preserved (same strictness)
5. ✅ `pnpm lint:fix` works to auto-fix issues
6. ✅ Old `.eslintrc.json` files removed
7. ✅ Documentation updated in CLAUDE.md
8. ✅ Zero test regressions

---

## 🛠️ Key Deliverables

### Phase 1 Deliverable
- Detailed rule mapping document for each package
- List of missing packages to install

### Phase 2 Deliverable
- `/eslint.config.js` (root)
- `/frontend/eslint.config.js`
- `/backend-graphql/eslint.config.js`
- `/backend-express/eslint.config.js`

### Phase 3 Deliverable
- Updated `pnpm-lock.yaml` with v9-compatible dependencies

### Phase 4 Deliverable
- Working `pnpm lint` command across all packages
- All linting passes

### Phase 5 Deliverable
- Updated development guide (CLAUDE.md)
- Cleaned codebase (old config files removed)

---

## 🔍 Key Decisions

### Architecture: Per-Package Configs ✅ Recommended
Each package has its own `eslint.config.js`:
- **Root**: TypeScript + base rules
- **Frontend**: Root + React + React Hooks + Next.js
- **GraphQL**: Root + GraphQL-specific (if needed)
- **Express**: Root + Express-specific (if needed)

**Benefits**:
- Independent configuration per package
- Easier to maintain and extend
- Clear separation of concerns
- Flexibility for future rules

---

## 🚨 Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| ESLint v9 breaking changes | HIGH | Follow official migration guide; test incrementally |
| Plugin incompatibility | MEDIUM | Verify all plugins support v9; check GitHub issues |
| TypeScript parser issues | MEDIUM | Use matching `@typescript-eslint/*` versions |
| Prettier conflicts | LOW | Run `pnpm format:check` after migration |
| Monorepo config issues | MEDIUM | Test each package independently first |

### Rollback Plan
If anything fails:
```bash
git restore .eslintrc.json frontend/.eslintrc.json
rm eslint.config.js frontend/eslint.config.js backend-graphql/eslint.config.js backend-express/eslint.config.js
git restore package.json
pnpm install
pnpm lint  # Should use old .eslintrc.json files again
```

---

## 📚 Resources

- [ESLint v9 Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [ESLint Flat Config Format](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [@typescript-eslint v9 Compatibility](https://typescript-eslint.io/getting-started)
- [Next.js ESLint Plugin](https://nextjs.org/docs/app/building-your-application/configuring/eslint)

---

## 📝 Notes

- **Created**: April 17, 2026
- **Creator**: Orchestrator Agent
- **Status**: ✅ Ready for Implementation
- **Last Updated**: April 17, 2026

---

## 🤝 Questions?

Refer to the detailed sections in `ESLINT-V9-MIGRATION.md`:
- **"What is the current state?"** → Current State Analysis section
- **"How do I migrate?"** → Implementation Plan section
- **"What could go wrong?"** → Risk Analysis section
- **"How do I verify it worked?"** → Success Criteria section

---

**Start with**: `ORCHESTRATOR_SUMMARY.md` → `ESLINT-V9-MIGRATION.md` → `TODO_STRUCTURE.txt`
