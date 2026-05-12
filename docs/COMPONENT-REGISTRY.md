# Component Registry & File Reservations

**Last Updated**: May 12, 2026  
**Purpose**: Prevent duplicate implementations and coordination conflicts in Phase 2-4  
**Reference**: See `docs/implementation-planning/CONFLICT-RESOLUTION-STRATEGY.md` for detailed conflict analysis from PR #273

---

## Executive Summary

This registry documents all component ownership and file reservations to prevent the parallel development conflicts that occurred in Phase 5 (PR #273).

**Key Principle**: **"One Issue = One Component Implementation"**

---

## Phase 5 Completed Components (DO NOT DUPLICATE)

### FormComponents Suite
- **Status**: ✅ Complete (Issue #257, PR #273)
- **Owner**: Copilot (Senior Developer)
- **Phase**: Phase 5 (Completed)
- **Files Reserved**:
  - `frontend/components/FormComponents/AccessibleTooltip.tsx`
  - `frontend/components/FormComponents/FormInput.tsx`
  - `frontend/components/FormComponents/FormTextarea.tsx`
  - `frontend/components/FormComponents/__tests__/*.test.tsx`
  - `frontend/components/FormComponents/index.ts`

**Expected API & Behavior**:
- **AccessibleTooltip**: Keyboard-accessible tooltip with Escape key close, `useCallback` memoization, explicit return types
- **FormInput**: Accessible text input component with error/touched states, `aria-describedby` linking to error & help text
- **FormTextarea**: Accessible textarea with character count display and validation states

**Key Implementation Patterns** (Do NOT deviate from):
- Use `useCallback` for all event handlers to prevent unnecessary re-renders
- Explicit return types: `React.ReactElement`, `(): string`, `(): void`
- All form inputs use `aria-describedby` to link error messages and help text
- Use `useState` for stable ID generation (not `useRef`)
- Minimal inline comments; code should be self-documenting
- Focused test suites (minimal redundant test cases)

**DO NOT**:
- Create parallel implementations in different directories
- Duplicate these components for use in other features
- Modify these components without coordinating in the issue
- Re-implement these with different patterns

**If You Need These Components in Phase 2-4**:
1. Import from `frontend/components/FormComponents`
2. Use as-is (they are production-ready)
3. If you need customization, open an issue referencing this registry
4. Do NOT fork or duplicate the components

---

### StatusBadge Component
- **Status**: ✅ Complete (Issue #255, PR #271)
- **Owner**: Copilot (Senior Developer)
- **Phase**: Phase 5 (Completed)
- **Files Reserved**:
  - `frontend/components/StatusBadge.tsx`
  - `frontend/components/__tests__/StatusBadge.test.tsx`

**Expected API & Behavior**:
- Displays build/part status with color-coded badges
- Supports statuses: PENDING, RUNNING, COMPLETE, FAILED
- Keyboard accessible with proper ARIA labels

**DO NOT**: Create parallel status components; use this one

---

### EmptyState Component
- **Status**: ✅ Complete (Issue #255, PR #271)
- **Owner**: Copilot (Senior Developer)
- **Phase**: Phase 5 (Completed)
- **Files Reserved**:
  - `frontend/components/EmptyState.tsx`
  - `frontend/components/__tests__/EmptyState.test.tsx`

**Expected API & Behavior**:
- Displays empty state UI when no data is available
- Accepts icon, title, description, optional action button
- Responsive design for all screen sizes

**DO NOT**: Create parallel empty state components; use this one

---

## Phase 2 Preparation (Issues #258-260)

### Issue #258: Dashboard Performance Optimization
- **Status**: 🟡 In Planning
- **Owner**: TBD (Phase 2 developer)
- **Files Reserved** (EXCLUSIVE):
  - `frontend/app/dashboard/page.tsx` (modifications to existing file)
  - `frontend/hooks/useDashboardData.ts` (NEW - create here)
  - `frontend/hooks/__tests__/useDashboardData.test.ts` (NEW - create here)
  - `frontend/__tests__/setup/performance-mock.ts` (if needed)

**Can Reuse**:
- `FormComponents/*` (import, do NOT modify)
- `StatusBadge.tsx` (import, do NOT modify)
- `EmptyState.tsx` (import, do NOT modify)

**Dependencies**:
- Must not conflict with Issue #259 (BuildList) or #260 (PartList)

**Expected Deliverables**:
- DataLoader batch queries (N+1 prevention)
- Apollo cache optimization
- Memoized component rendering
- Load time target: <2s for dashboard with 100 builds

---

### Issue #259: BuildList Component
- **Status**: 🟡 In Planning
- **Owner**: TBD (Phase 2 developer)
- **Files Reserved** (EXCLUSIVE):
  - `frontend/components/BuildList.tsx` (NEW)
  - `frontend/components/__tests__/BuildList.test.tsx` (NEW)

**Can Reuse**:
- `FormComponents/*` (import, do NOT modify)
- `StatusBadge.tsx` (import, do NOT modify)
- `EmptyState.tsx` (import, do NOT modify)

**Must NOT Reuse** (create your own):
- Dashboard hooks (created by Issue #258)

**Dependencies**:
- Depends on Issue #258 (dashboard performance)
- Must use hooks from `useDashboardData`

---

### Issue #260: PartList Component
- **Status**: 🟡 In Planning
- **Owner**: TBD (Phase 2 developer)
- **Files Reserved** (EXCLUSIVE):
  - `frontend/components/PartList.tsx` (NEW)
  - `frontend/components/__tests__/PartList.test.tsx` (NEW)

**Can Reuse**:
- `FormComponents/*` (import, do NOT modify)
- `StatusBadge.tsx` (import, do NOT modify)
- `EmptyState.tsx` (import, do NOT modify)

**Must NOT Reuse** (create your own):
- Dashboard hooks (created by Issue #258)

**Dependencies**:
- Independent from Issue #258 and #259 (can be parallel)
- Must follow same performance patterns

---

## Phase 3-4 Preparation (Reserved Namespaces)

> These are reserved for Phase 3-4 developers. Namespace reserved for future use.

### Reserved Components (to be determined)

| Component | Issue | Files | Status |
|-----------|-------|-------|--------|
| ErrorBoundary | #XXX | `frontend/components/ErrorBoundary*` | Reserved |
| LoadingState | #XXX | `frontend/components/LoadingState*` | Reserved |
| Toast Notifications | #XXX | `frontend/components/Toast*` | Reserved |
| Modal Dialog | #XXX | `frontend/components/Modal*` | Reserved |

---

## Conflict Resolution Workflow

### When You Start Phase 2 Work

1. **Read this registry first**
2. **Check which components are already implemented** (Phase 5 section)
3. **Import what's available** (don't re-implement)
4. **Reserve your files** by adding your issue to this registry
5. **Comment in the issue** with your file list
6. **Post on GitHub** when work starts

**Command**:
```bash
git fetch origin
git log --oneline origin/main | head -20  # See latest work
```

### When You Discover Conflicts

1. **Stop and communicate immediately** in the GitHub issue
2. **Reference this registry** in your comment
3. **Check if another issue is using the same files**
4. **If yes**: Coordinate with that issue owner
5. **If no**: Update this registry with your reservation

**Emergency Process** (if conflict discovered at merge):
- See `docs/implementation-planning/CONFLICT-RESOLUTION-STRATEGY.md` Section 4: Resolution Checklist
- 5-phase emergency resolution process documented there

### Branch Synchronization Rules for Phase 2-4

**Every 2-3 days during development**:
```bash
git fetch origin
git rebase origin/main
# This detects conflicts EARLY, not at merge time
```

**Before requesting review**:
```bash
git rebase origin/main
git merge --no-commit --no-ff origin/main  # Test for conflicts
git push --force-with-lease origin feat/issue-#XXX
```

---

## Quick Reference: Component Usage

### ✅ DO: Import from FormComponents

```typescript
// frontend/components/MyComponent.tsx
import { FormInput, FormTextarea, AccessibleTooltip } from '@/components/FormComponents';

export function MyComponent() {
  return (
    <FormInput
      id="name"
      label="Name"
      required
      aria-describedby="help-text"
    />
  );
}
```

### ❌ DON'T: Duplicate FormComponents

```typescript
// ❌ WRONG: Don't create parallel implementation
export function FormInputV2() {  // ← DO NOT CREATE THIS
  // ...
}
```

### ✅ DO: Reserve Files in Issues

```markdown
## File Reservations (Phase 2 Issue #258)
- frontend/hooks/useDashboardData.ts (NEW - exclusive)
- frontend/app/dashboard/page.tsx (modifications - exclusive)
- frontend/components/FormComponents/* (reuse - DO NOT MODIFY)
```

---

## Testing & Verification

### Phase 2-4 Component Verification Checklist

- [ ] All new components are in COMPONENT-REGISTRY.md
- [ ] File paths are explicitly reserved (no overlap)
- [ ] Tests are in `__tests__/` subdirectory following Phase 5 pattern
- [ ] `useCallback` used for event handlers (performance)
- [ ] Explicit return types on all functions
- [ ] ARIA labels on interactive components
- [ ] No duplication of Phase 5 components
- [ ] Dependency tracking documented in issue

---

## Interview Talking Points

**When discussing this registry**:

1. **"We learned from PR #273 merge conflicts"**: Explain how parallel development of FormComponents caused 6 files with conflicts.

2. **"Component ownership prevents duplication"**: This registry ensures each issue owns specific files and can't accidentally duplicate work.

3. **"Early conflict detection"**: Branch synchronization every 2-3 days catches conflicts before merge time.

4. **"Performance patterns are standardized"**: All components follow `useCallback` + explicit types pattern for consistency.

5. **"Clear API contracts"**: Each component documents expected behavior so Phase 2-4 developers know not to modify them.

---

## Updates & Changes

To add a component or update this registry:

1. Create issue with Phase and component name
2. Add entry to appropriate section (Phase 2/3/4)
3. List all reserved files
4. Reference this registry in PR description
5. Get approval before implementing

---

**Last Updated**: May 12, 2026  
**Next Review**: Before Phase 2 team briefing  
**Contact**: See GitHub issue for component ownership
