# Phase 2 Block 3 - Quick Start Guide

**Use this if you're a developer starting Block 3 today.**

---

## 30-Second Summary

**What**: Build responsive table (Issue #261) then adaptive modal (Issue #262)  
**Why**: Mobile users see card layouts instead of cramped tables  
**Timeline**: ~14 hours total (2-3 days), sequential (one after the other)  
**Risk**: Medium (sequential dependency), **Mitigated**: Fast merge cycles  
**Status**: ✅ Ready to start NOW

---

## Get Started in 5 Minutes

### 1. Read the Full Plan (10 min)
```bash
cat docs/implementation-planning/PHASE-2-BLOCK-3-INDEX.md
# Or in your editor: code docs/implementation-planning/PHASE-2-BLOCK-3-INDEX.md
```

### 2. Review Block 2 Comparison (5 min)
```bash
# See what worked last block
cat docs/implementation-planning/PHASE-2-BLOCK-2-INDEX.md | head -100
```

### 3. Run Baseline Tests (5 min)
```bash
# Ensure test infrastructure is working
cd frontend && pnpm test:frontend -- --run | tail -20
```

### 4. Check Component Files (5 min)
```bash
# Verify no conflicts for Issue #261
ls frontend/components/ | grep -i table
ls frontend/components/ | grep -i card

# Verify no conflicts for Issue #262
ls frontend/components/ | grep -i modal
```

### 5. You're Ready! (Start with #261)

---

## Issue #261: Responsive Table (3-4h Implementation)

### What You're Building

**Before**: Table always shows 6+ columns (cramped on mobile)  
**After**: 
- Desktop (>1024px): Full table with all columns
- Tablet (640-1024px): 2-column card grid
- Mobile (<640px): Single-column card stack

### Files You'll Create/Modify

**NEW**:
- `frontend/components/BuildCard.tsx` (displays build in card format)
- `frontend/components/__tests__/BuildCard.test.tsx` (15-20 tests)

**MODIFY**:
- `frontend/components/BuildTable.tsx` (add responsive layout logic)
- `frontend/components/__tests__/BuildTable.test.tsx` (update tests)

### Quick Acceptance Criteria Checklist

- [ ] Desktop: Table view with 6+ columns
- [ ] Tablet: 2-column card grid layout
- [ ] Mobile: Single-column card stack
- [ ] Card header: Shows build name + status badge
- [ ] Card body: Shows key properties (date, progress, etc.)
- [ ] Touch targets: All buttons/links are 48px × 48px minimum
- [ ] Responsive breakpoints: Use Tailwind sm/md/lg/xl/2xl
- [ ] Real device testing: Tested on iPhone + Android
- [ ] Tests: 30+ new tests, all passing
- [ ] No errors: Zero TS, zero ESLint

### Component API (BuildCard.tsx)

```typescript
interface BuildCard {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  progress: number; // 0-100
  startDate: Date;
  endDate?: Date;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BuildCard(props: BuildCard) {
  // Card header: name + status badge
  // Card body: date + progress + metadata
  // Touch actions: edit/delete buttons (48px targets)
}
```

### Implementation Phases

**Phase 1: Setup (0.5h)**
- Create BuildCard.tsx with basic structure
- Create test file with 3-5 placeholder tests
- Commit: "feat: Add BuildCard component skeleton"

**Phase 2: Implementation (2-2.5h)**
- BuildCard: Card layout with header/body/footer
- BuildTable: Conditional rendering (table vs cards)
- Responsive CSS: sm/md/lg breakpoints
- Commit: "feat: Implement BuildCard and responsive layout"

**Phase 3: Testing (0.5-1h)**
- 25+ new tests for responsive breakpoints
- Tests for touch targets, card rendering
- Commit: "test: Add BuildCard and responsive layout tests"

**Phase 4: Review & Fixes (1-1.5h)**
- Address code review feedback
- Additional accessibility tests if needed
- Commit: "fix: Address review feedback from #261"

### Testing Command

```bash
# Run tests for this issue
cd frontend && pnpm test:frontend -- BuildCard BuildTable --run

# Check coverage
cd frontend && pnpm test:frontend -- --coverage BuildCard BuildTable

# Run all tests to verify no regressions
cd frontend && pnpm test:frontend -- --run
```

### Linting Check

```bash
# Check for TS errors
pnpm -F frontend lint

# If errors, fix with:
pnpm -F frontend lint:fix
```

### When You're Done with #261

1. Commit your final changes
2. Create PR to main branch
3. Request review
4. **Wait for merge** (don't move to #262 yet)
5. **Notify coordinator** when merged

---

## Issue #262: Adaptive Modal (2-3h Implementation)

⚠️ **START THIS ONLY AFTER #261 IS MERGED TO MAIN**

### What You're Building

**Modal adapts to screen size**:
- Desktop (>1024px): Overlay modal (current behavior)
- Tablet (640-1024px): Side drawer from right
- Mobile (<640px): Bottom sheet (iOS-style slide from bottom)

### Files You'll Create/Modify

**NEW**:
- `frontend/components/BottomSheet.tsx` (mobile modal)
- `frontend/components/DrawerModal.tsx` (tablet modal)
- `frontend/components/__tests__/BottomSheet.test.tsx` (15-20 tests)
- `frontend/components/__tests__/DrawerModal.test.tsx` (10-15 tests)

**MODIFY**:
- `frontend/components/Modal.tsx` (add responsive wrapper)
- `frontend/components/__tests__/Modal.test.tsx` (update tests)

### Quick Acceptance Criteria Checklist

- [ ] Desktop: Overlay modal (existing behavior)
- [ ] Tablet: Side drawer modal
- [ ] Mobile: Bottom sheet modal
- [ ] Swipe down to close: Working on mobile
- [ ] Drag handle visible: Mobile bottom sheet
- [ ] Smooth transitions: All state changes animated
- [ ] Focus management: Focus trap working, Escape to close
- [ ] Keyboard support: Escape key closes modal
- [ ] Tested on iOS: Safari mobile
- [ ] Tested on Android: Chrome mobile

### Component API (BottomSheet.tsx)

```typescript
interface BottomSheet {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: {
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary' | 'destructive';
  }[];
  dragHandle?: boolean; // Show iOS-style drag handle
}

export function BottomSheet(props: BottomSheet) {
  // Slide in from bottom
  // Swipe down to close gesture
  // Touch handle at top
}
```

### Implementation Phases

**Phase 1: Setup (0.5h)**
- Create BottomSheet.tsx skeleton
- Create DrawerModal.tsx skeleton
- Create test files
- Commit: "feat: Add BottomSheet and DrawerModal skeletons"

**Phase 2: Implementation (1.5-2h)**
- BottomSheet: Slide animation, swipe detection, drag handle
- DrawerModal: Side drawer animation
- Modal.tsx wrapper: Responsive selection logic
- Commit: "feat: Implement adaptive modal components"

**Phase 3: Testing (0.5-1h)**
- 20+ tests for animations, swipe gestures
- Focus management tests
- Keyboard tests (Escape key)
- Commit: "test: Add gesture and focus tests"

**Phase 4: Real Device Testing (0.5h)**
- Test swipe gesture on real iPhone
- Test swipe gesture on real Android device
- Verify animations smooth
- Commit: "test: Verify real device testing"

### Testing Command

```bash
# Run tests for this issue
cd frontend && pnpm test:frontend -- BottomSheet DrawerModal Modal --run

# Check coverage
cd frontend && pnpm test:frontend -- --coverage BottomSheet DrawerModal

# Run all tests to verify no regressions
cd frontend && pnpm test:frontend -- --run
```

### When You're Done with #262

1. Real device testing (iOS + Android)
2. Commit final changes
3. Create PR to main branch
4. Request review
5. Merge when approved

---

## Git Workflow (Both Issues)

### For Issue #261

```bash
# Create feature branch
git checkout -b feat/261-responsive-table

# Make changes, commit often
git add frontend/components/BuildCard.tsx
git commit -m "feat: Add BuildCard component

- Mobile card layout for Build entity
- Responsive design with 48px touch targets
- Integrated with BuildTable for breakpoint switching

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

# When ready, push and create PR
git push -u origin feat/261-responsive-table
# Then create PR in GitHub UI
```

### For Issue #262 (After #261 Merges)

```bash
# Create feature branch (from main after #261 merges)
git checkout main
git pull origin main
git checkout -b feat/262-adaptive-modal

# Same commit workflow as #261
# Then push and create PR
```

---

## Testing Best Practices (From Block 2)

### Global Test Setup (Already Available)

```typescript
// Uses global setup from frontend/__tests__/setup/
// No need to manually mock localStorage or cleanup - it's automatic

describe('BuildCard', () => {
  it('should render card layout', () => {
    render(<BuildCard {...props} />);
    // Test runs with clean localStorage, automatic cleanup
  });
});
```

### Responsive Testing

```typescript
import { render } from '@testing-library/react';

describe('BuildTable responsive', () => {
  it('should show table on desktop', () => {
    // Mock window.matchMedia for desktop
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(min-width: 1024px)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<BuildTable builds={[]} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('should show cards on mobile', () => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(max-width: 640px)',
      // ... rest of mock
    }));

    render(<BuildTable builds={[]} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});
```

### Touch Target Testing

```typescript
import { render } from '@testing-library/react';

it('should have 48px touch targets', () => {
  render(<BuildCard {...props} />);
  
  const buttons = screen.getAllByRole('button');
  buttons.forEach(button => {
    const rect = button.getBoundingClientRect();
    expect(rect.width).toBeGreaterThanOrEqual(48);
    expect(rect.height).toBeGreaterThanOrEqual(48);
  });
});
```

---

## Accessibility Checklist

Before submitting PR, verify:

- [ ] **Keyboard Navigation**: Tab through all interactive elements
- [ ] **Touch Targets**: All buttons/links are 48px × 48px (use browser DevTools)
- [ ] **Color Contrast**: WCAG AA (4.5:1 for text)
- [ ] **Screen Reader**: Test with nvda/VoiceOver (or test in CI)
- [ ] **Focus Management**: Focus visible on all interactive elements
- [ ] **Labels**: All form inputs have labels (for/id matching)

**Automated Check**:
```bash
# Run accessibility tests (if available)
pnpm test:frontend -- a11y --run
```

---

## Troubleshooting

### Tests Not Running
```bash
# Clear node_modules and reinstall
cd frontend && rm -rf node_modules && pnpm install
pnpm test:frontend -- --run
```

### Git Conflicts (After #261 Merges)
```bash
# When starting #262, rebase on latest main
git checkout main
git pull origin main
git checkout feat/262-adaptive-modal
git rebase main

# If conflicts, resolve and:
git add .
git rebase --continue
```

### Linting Errors
```bash
# Auto-fix most issues
pnpm -F frontend lint:fix

# Check what remains
pnpm -F frontend lint
```

### TypeScript Errors
```bash
# Check all TS errors
cd frontend && pnpm tsc --noEmit

# Some IDE extensions auto-fix, otherwise:
# 1. Review error message
# 2. Update type annotations
# 3. Re-run tsc
```

---

## Review Criteria

Your PR will be reviewed against:

1. **All acceptance criteria met**: 100% must pass
2. **Tests**: 30+ for #261, 20+ for #262, all passing
3. **Code quality**: Zero TS errors, zero ESLint errors
4. **Accessibility**: Touch targets, keyboard nav, color contrast
5. **Mobile responsiveness**: Verified on real devices
6. **No file conflicts**: Only your assigned files modified
7. **Clean git history**: Logical commits with good messages

---

## Questions?

Check these docs in order:
1. **PHASE-2-BLOCK-3-INDEX.md** - Full detailed plan
2. **PHASE-2-ORCHESTRATION-ANALYSIS.md** - Block 3 context
3. **PHASE-2-BLOCK-2-INDEX.md** - What worked in previous block

Or ask the **Orchestration Coordinator** for clarification.

---

## Success Indicators

**Issue #261 Success**:
- ✅ BuildCard renders correctly on all screen sizes
- ✅ 30+ tests, all passing
- ✅ No TS/ESLint errors
- ✅ Merged to main within 1 day

**Issue #262 Success**:
- ✅ BottomSheet/DrawerModal working on real devices
- ✅ 20+ tests, all passing
- ✅ Swipe gestures smooth
- ✅ Merged to main within 2 days

**Block 3 Success**:
- ✅ Both issues merged
- ✅ 50+ total tests passing
- ✅ Mobile responsiveness validated
- ✅ Component patterns ready for Block 4

---

**Ready?** Start with Issue #261: `git checkout -b feat/261-responsive-table` 🚀

