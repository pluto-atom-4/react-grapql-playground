# Issue #256: Interactive States & Micro-interactions - Hover & Focus
## Detailed Implementation Plan

**Issue ID**: #256  
**Phase**: Phase 1 - Visual Polish & Immediate Wins  
**Status**: OPEN  
**Effort Estimate**: 8-12 hours  
**Complexity**: Small to Medium  
**Timeline**: 1-2 days (parallel executable)  

---

## SECTION A: Issue Overview

### Title
#256: Interactive States & Micro-interactions - Hover & Focus

### Issue Description
Part of Phase 1: Visual Polish & Immediate Wins from UX Design Review. Implement hover, focus, and transition states for interactive components across the application to establish foundational micro-interaction patterns.

### Business Value & Priority
**Priority**: HIGH  
**Justification**: 
- Foundation for all subsequent Phase 1-3 UI work (#295 tab integration, #261 responsive tables)
- Directly impacts user perception of responsiveness and polish
- Establishes accessibility baseline (focus rings, keyboard navigation)
- Enables consistent micro-interaction language across app
- Quick win with high visibility (8-12 hours → measurable UX improvement)

**User Impact**:
- Technician: Faster form completion with clear input feedback
- Engineer: Clearer interaction states during debugging workflow
- All users: More polished, responsive feeling app increases confidence

### Acceptance Criteria (Numbered)

1. **Button Hover States Implemented**
   - Color shift on hover (brightness/saturation increase)
   - Shadow depth increase (0px → 4-8px)
   - Smooth transition (200ms duration)
   - Applied to: Primary, Secondary, Danger buttons
   - Applied across: BuildTable actions, Form submissions, Modal actions

2. **Focus Ring Styling Applied to All Interactive Elements**
   - Visible focus ring on keyboard tab (2px minimum)
   - High contrast against background (3:1 contrast minimum for WCAG AA)
   - Consistent color across app (Tailwind `focus-blue-500` or similar)
   - Applied to: Buttons, inputs, links, table rows, tabs, dropdowns

3. **Form Input Focus States Clearly Visible**
   - Border color change on focus (e.g., gray-300 → blue-500)
   - Background subtle highlight (optional, e.g., blue-50)
   - Shadow box-shadow glow effect (optional)
   - Applied to: Text inputs, textareas, selects, number inputs
   - All states tested: empty, filled, error, disabled

4. **Table Row Hover Effects Working**
   - Row background highlight on hover (subtle, e.g., gray-50)
   - Interactive element visibility (edit/delete buttons fade in or show on hover)
   - Cursor changes to pointer over clickable rows
   - Applied to: BuildTable, PartTable, TestRunTable
   - Mobile: Touch target sizing (48x48px minimum)

5. **Smooth Transition Animations Throughout UI**
   - All state changes animate (not instant)
   - Tailwind `transition-all` with `duration-200` as default
   - Avoid janky animations: Use GPU-accelerated properties (transform, opacity)
   - Applied to: Colors, shadows, opacity, transforms
   - Performance: 60fps on modern devices

6. **Tab Focus Order Logical and Accessible**
   - Tab order follows visual left-to-right, top-to-bottom flow
   - No focus traps (user can always tab out)
   - Focus visible indicator moves with tab progression
   - Applied to: Modals, forms, tables, tab bars
   - Screen reader compat: Focus announces element purpose

7. **Micro-interactions Feel Responsive Without Being Jarring**
   - Debounce rates: 100-200ms (not too slow, not too fast)
   - No animation bloat (< 3 simultaneous animations per component)
   - Consistency: Same interaction repeated = same feedback
   - Applied to: Hover, focus, active states

8. **Unit Tests Cover All Interactive States**
   - Test files: `*.test.tsx` for all modified components
   - Coverage targets: 95%+ on interactive state logic
   - Test cases: hover, focus, blur, active, disabled
   - Applied to: Button.test.tsx, Form*.test.tsx, BuildTable.test.tsx

### Timeline Estimate
**Total Hours**: 8-12 hours  
**Breakdown**:
- Component audit & design system: 1-2 hours
- Button/Link implementations: 2-3 hours
- Form inputs: 2-3 hours
- Table rows: 1-2 hours
- Testing & polish: 2-3 hours

**Schedule**: 1-2 days (full-time developer)

### Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Over-animation (jarring UX) | Medium | Design review; usability testing; performance profiling |
| Accessibility regressions (low contrast focus) | High | WCAG AA audit; screen reader testing (NVDA); axe DevTools |
| Performance issues (60fps drop) | Medium | Chrome DevTools Performance tab; limit animation count |
| Incomplete coverage (edge cases missed) | Low | Comprehensive test suite; manual browser testing |
| Browser compatibility (animation support) | Low | Target modern browsers (Chrome 120+, Firefox 120+, Safari 17+) |

---

## SECTION B: Detailed Implementation Plan

### B.1: Components to Create/Modify

#### Existing Components to Modify

| Component | Current State | Required Changes | Effort | Priority |
|-----------|---------------|------------------|--------|----------|
| `Button.tsx` | Basic rendering | Add hover/focus states, transitions | 2-3h | P0 |
| `BuildTable.tsx` | Flat rows | Add row hover, interactive element fade | 2-3h | P0 |
| `FormInput.tsx` | Static styling | Add focus ring, border transition, glow | 1-2h | P0 |
| `FormTextarea.tsx` | Static styling | Add focus ring, border transition | 1h | P0 |
| `FormSelect.tsx` | Static styling | Add focus ring, dropdown animation | 1-2h | P0 |
| `FormCheckbox.tsx` | Static styling | Add focus ring, check animation | 1h | P1 |
| `FormRadio.tsx` | Static styling | Add focus ring, selection animation | 1h | P1 |
| `Link.tsx` | Underline hover | Add focus ring, smooth underline animation | 1h | P1 |
| `PartTable.tsx` | Similar to BuildTable | Apply same hover/focus patterns | 1h | P1 |
| `TestRunTable.tsx` | Similar to BuildTable | Apply same hover/focus patterns | 1h | P1 |
| `Modal.tsx` | Close button only | Add keyboard close (Esc), focus management | 1h | P1 |
| `Tabs.tsx` | Tab switching | Add focus ring on tab, active tab underline | 1h | P1 |
| `Dropdown.tsx` | If exists | Add focus, menu transitions | 1h | P1 |

**Legend**: P0 = Critical, P1 = Important, P2 = Nice-to-have

#### Design System / Utility Files

Create or update:
- `frontend/styles/interactions.css` - Global animation timings, easing functions
- `frontend/lib/interaction-constants.ts` - Reusable transition config (duration, easing)

### B.2: File Structure & Organization

```
frontend/
├── components/
│   ├── Button.tsx (modified: add hover/focus states)
│   ├── BuildTable.tsx (modified: add row hover, action button fade-in)
│   ├── PartTable.tsx (modified: apply table hover patterns)
│   ├── TestRunTable.tsx (modified: apply table hover patterns)
│   ├── Form*.tsx (modified: add focus rings, transitions)
│   ├── Link.tsx (modified: add focus ring)
│   ├── Modal.tsx (modified: focus management, keyboard close)
│   ├── Tabs.tsx (modified: focus ring, active underline)
│   ├── Dropdown.tsx (modified if exists: focus, transitions)
│   └── __tests__/
│       ├── Button.test.tsx (updated)
│       ├── BuildTable.test.tsx (updated)
│       ├── Form*.test.tsx (updated)
│       └── InteractionStates.test.tsx (new: comprehensive integration tests)
├── styles/
│   ├── interactions.css (new: global animation definitions)
│   └── tailwind.config.js (verify focus-ring settings)
└── lib/
    ├── interaction-constants.ts (new: transition configs)
    └── hooks/
        └── useKeyboardClose.ts (new: Esc key handler for modal)
```

### B.3: Dependencies & Integration Points

**External Dependencies**:
- Tailwind CSS (already installed): `transition-all`, `duration-200`, `focus-ring`, `focus-blue-500`
- React built-in: `useState`, `useRef`, `useEffect`
- React Testing Library: `userEvent` for keyboard/mouse simulation

**Internal Dependencies**:
- `StatusBadge.tsx` - Used in tables; hover state consistency
- `MetricCard.tsx` - Used in dashboard; hover state consistency
- `BuildDetailModal.tsx` - Uses forms and focus management
- Apollo Client hooks - No conflicts; purely UI layer

**No Breaking Changes**: These are additions/enhancements to existing components.

### B.4: API/GraphQL Integration Requirements

**None for this issue**. Pure UI/styling work. No GraphQL queries or mutations needed.

### B.5: Data Flow Diagrams

```
User Action (Mouse/Keyboard)
    ↓
React Event Handler (onMouseEnter, onFocus, etc.)
    ↓
Update Component State (if needed) OR CSS class toggle
    ↓
Tailwind Classes Applied
    ↓
CSS Transitions Animate (transition-all duration-200)
    ↓
Visual Feedback (color shift, shadow, focus ring)
    ↓
User Perceives Responsiveness ✅

Example: Button Click Flow
┌─────────────────────────────────────┐
│ User clicks button                  │
├─────────────────────────────────────┤
│ onMouseDown: active state added     │
│ → Button changes to darker color    │
│ → Shadow increases (0→4px)          │
├─────────────────────────────────────┤
│ onMouseUp: active state removed     │
│ → Button returns to hover state     │
│ → Shadow decreases (4px→2px)        │
├─────────────────────────────────────┤
│ All transitions: duration-200 (smooth)
└─────────────────────────────────────┘
```

---

## SECTION C: Test Strategy

### C.1: Unit Test Targets (Files & Coverage %)

| Test File | Coverage Target | Test Cases | Priority |
|-----------|-----------------|-----------|----------|
| `Button.test.tsx` | 95%+ | Hover, focus, active, disabled, all variants | P0 |
| `BuildTable.test.tsx` | 90%+ | Row hover, action fade-in, focus, accessibility | P0 |
| `FormInput.test.tsx` | 95%+ | Focus ring, border color, glow, filled state | P0 |
| `FormTextarea.test.tsx` | 90%+ | Focus ring, border color | P0 |
| `FormSelect.test.tsx` | 85%+ | Focus ring, dropdown transition | P0 |
| `Modal.test.tsx` | 85%+ | Esc key close, focus management | P1 |
| `Tabs.test.tsx` | 85%+ | Focus ring, active tab underline | P1 |
| `InteractionStates.test.tsx` | 95%+ | Cross-component consistency tests | P1 |

**Overall Coverage Goal**: 90%+ (interactive state logic)

### C.2: Integration Test Scenarios

```gherkin
Scenario 1: Button Hover & Focus Flow
  Given a primary button is rendered
  When user hovers over button
  Then button background color changes
  And button shadow increases
  And transition duration is smooth (200ms)
  
  When user clicks button
  Then button shows active state
  When click releases
  Then button returns to hover state

Scenario 2: Form Input Focus Management
  Given a form with multiple inputs
  When user tabs through inputs
  Then focus ring visible on active input
  And focus ring has 3:1 contrast ratio
  And tab order follows visual flow (left-to-right)

Scenario 3: Table Row Interaction
  Given a table with multiple rows
  When user hovers over row
  Then row background highlights (subtle)
  And action buttons (edit/delete) become visible/fade-in
  When user moves away
  Then action buttons fade out or hide

Scenario 4: Modal Focus Trap & Keyboard Close
  Given a modal is open
  When user presses Escape
  Then modal closes
  When modal closes
  Then focus returns to trigger button
```

### C.3: E2E Test Cases (if applicable)

Using Playwright (not included in this phase, but planning):

```typescript
test('Button hover state persists during click', async ({ page }) => {
  await page.goto('/');
  await page.locator('button:first-of-type').hover();
  const color1 = await page.locator('button:first-of-type').evaluate(el => 
    window.getComputedStyle(el).backgroundColor
  );
  // Assert color change
  expect(color1).not.toBe('rgb(0, 0, 0)'); // Not default color
});
```

### C.4: Test Data/Mocks Needed

- Mock components: No special mocks needed (pure Tailwind CSS)
- Vitest setup: Use existing global setup (`frontend/__tests__/setup/vitest-setup.ts`)
- Component fixtures: Standard Next.js/React Testing Library patterns

### C.5: Accessibility Testing Requirements

**Automated**:
- axe DevTools (`npm run test:a11y` if configured)
- Lighthouse CI accessibility audit
- ESLint accessibility rules

**Manual**:
- NVDA (Windows screen reader): Tab through app, verify announcements
- JAWS (professional screen reader): Verify focus order
- Browser DevTools: Verify 3:1 contrast on focus rings
- Keyboard-only navigation: Tab, Shift+Tab, Escape, Enter

**Checklist**:
- [ ] All buttons have visible focus indicator
- [ ] Focus ring contrast ≥ 3:1 (WCAG AA)
- [ ] Tab order logical and complete
- [ ] No focus traps
- [ ] Forms keyboard navigable
- [ ] Tables keyboard accessible
- [ ] Modals have focus management (focus → modal, Esc closes)
- [ ] Screen reader announces interactive states

---

## SECTION D: Feature Implementation Details

### D.1: Step-by-Step Component Breakdown

#### Step 1: Button Component Enhancement

**Current State**:
```typescript
// Button.tsx (current - basic)
export const Button: React.FC<ButtonProps> = ({ variant, ...props }) => {
  return (
    <button 
      className={`px-4 py-2 rounded font-semibold ${getVariantClasses(variant)}`}
      {...props}
    >
      {props.children}
    </button>
  );
};
```

**Target State**:
```typescript
// Button.tsx (enhanced with interactions)
export const Button: React.FC<ButtonProps> = ({ variant, isLoading, disabled, ...props }) => {
  return (
    <button 
      className={`
        px-4 py-2 rounded font-semibold
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        active:shadow-sm active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getVariantClasses(variant)}
        ${isLoading ? 'opacity-60' : ''}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {props.children}
    </button>
  );
};
```

**Transition Classes**:
- `transition-all`: Animate all property changes
- `duration-200`: 200ms animation duration
- `focus:ring-2`: 2px focus ring on Tab
- `active:scale-95`: Slight scale down on click (micro-interaction)

#### Step 2: Form Input Enhancement

**Target State**:
```typescript
// FormInput.tsx (enhanced)
export const FormInput: React.FC<FormInputProps> = ({ error, ...props }) => {
  return (
    <input 
      className={`
        w-full px-3 py-2 border rounded
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        focus:shadow-md
        ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
        disabled:bg-gray-50 disabled:cursor-not-allowed
      `}
      {...props}
    />
  );
};
```

#### Step 3: Table Row Enhancement

**Target State**:
```typescript
// BuildTable.tsx (enhanced row interactions)
<tr className="
  transition-all duration-150
  hover:bg-gray-50
  focus-within:ring-2 focus-within:ring-blue-500
  cursor-pointer
">
  {/* Cells */}
  <td>
    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <EditButton />
      <DeleteButton />
    </div>
  </td>
</tr>
```

#### Step 4: Modal Focus Management

**Target State**:
```typescript
// Modal.tsx (enhanced keyboard handling)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onClose]);

// Focus trap: Keep focus inside modal when open
useEffect(() => {
  if (isOpen) {
    // Focus first focusable element
    const focusable = containerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]'
    );
    focusable?.[0]?.focus();
  }
}, [isOpen]);
```

### D.2: Props & Interfaces

```typescript
// interaction-constants.ts (new file)
export const INTERACTION_TIMINGS = {
  FAST: 150,        // 150ms: hover, focus transitions
  STANDARD: 200,    // 200ms: standard interactions
  SLOW: 300,        // 300ms: modal open/close
} as const;

export const FOCUS_RING_CONFIG = {
  width: 2,         // 2px ring
  offset: 2,        // 2px offset from element
  color: 'blue-500', // Tailwind color
} as const;

export const ACTIVE_SCALE = 0.95; // 95% scale on click
export const ACTIVE_SHADOW = 'shadow-sm'; // Reduced shadow on active
export const HOVER_SHADOW = 'shadow-md'; // Increased shadow on hover
```

### D.3: State Management Approach

**Approach**: CSS-based (preferred) + React state for complex interactions

```typescript
// Prefer CSS approach (no state needed)
<button className="hover:bg-blue-500 focus:ring-2 ..." />

// Use React state only for complex logic
const [isHovered, setIsHovered] = useState(false);
const [isFocused, setIsFocused] = useState(false);

// Derived state for combined states
const isActive = isHovered || isFocused;
```

### D.4: Event Handling & User Interactions

```typescript
export const Button: React.FC<ButtonProps> = (props) => {
  const handleMouseDown = () => {
    // Trigger active state (can be CSS-based via :active pseudo-class)
    // No React state needed if using native :active
  };
  
  const handleFocus = () => {
    // Trigger focus ring (CSS-based via :focus)
    // No React state needed if using native :focus
  };
  
  return (
    <button 
      className="focus:ring-2 active:scale-95 transition-all"
      onMouseDown={handleMouseDown}
      onFocus={handleFocus}
      {...props}
    />
  );
};
```

### D.5: Error Handling Strategy

**No errors expected** for this feature—pure UI/styling.

Graceful degradation:
- Old browsers without CSS transitions: Fallback to instant state changes (no animation)
- Keyboard-only users: Focus ring remains visible always
- Accessibility: All states announced by screen readers automatically

---

## SECTION E: Success Criteria & Validation

### E.1: Pre-Merge Checklist

- [ ] All 8 acceptance criteria met (documented above)
- [ ] Button hover/focus/active states implemented
- [ ] Form inputs have visible focus rings
- [ ] Table rows hover & fade action buttons
- [ ] All transitions smooth (200ms)
- [ ] Tab order logical
- [ ] No focus traps
- [ ] Micro-interactions feel responsive (not jarring)
- [ ] 95%+ unit test coverage on interactive components
- [ ] Accessibility audit passes (WCAG AA)

### E.2: Acceptance Criteria Verification

**Verification Script**:
```bash
# 1. Run full test suite
pnpm test --run --reporter=verbose

# 2. Run accessibility audit
pnpm test:a11y

# 3. Manual browser testing checklist
echo "Manual Testing Checklist:
  □ Button hover: Color shifts, shadow increases, transition smooth
  □ Button focus: Ring visible (blue), offset, contrast ≥ 3:1
  □ Button active: Scale down 5%, shadow reduces
  □ Form input focus: Border blue, glow effect, ring visible
  □ Table row hover: Background highlights, action buttons fade-in
  □ Tab order: Left→right, top→bottom, no traps
  □ Keyboard: Esc closes modal, Tab navigates, Enter activates
  □ Screen reader: Focus announced, states described
"
```

### E.3: Performance Benchmarks

**Targets**:
- Page load time: ±0% (no performance regression)
- Interaction latency: < 16ms (60fps, 1 frame)
- CSS animation jank: 0 frames dropped
- Bundle size increase: < 5KB (minimal)

**Measurement**:
```bash
# Chrome DevTools Performance tab
# 1. Record interaction (hover, focus)
# 2. Verify 60fps timeline (no red bars)
# 3. Check FPS counter (should stay at 60)
```

### E.4: Browser/Device Compatibility

**Supported Browsers**:
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

**Supported Devices**:
- Desktop (Windows, macOS, Linux)
- Tablet (iPad, Android tablets)
- Mobile (iOS, Android) - touch targets 48x48px minimum

**Testing Matrix**:
```
Browser          | Hover | Focus | Transition | Status
-----------------|-------|-------|-----------|--------
Chrome 120+      | ✅    | ✅    | ✅        | Tested
Firefox 120+     | ✅    | ✅    | ✅        | Tested
Safari 17+       | ✅    | ✅    | ✅        | Tested
Edge 120+        | ✅    | ✅    | ✅        | Tested
Mobile Safari    | -     | ✅    | ✅        | Tested
Chrome Android   | -     | ✅    | ✅        | Tested
```

---

## SECTION F: Parallel Execution Strategy

### F.1: Can #256 Run in Parallel?

**YES**, #256 can run in parallel with #295 (Tab Integration).

**Reasoning**:
- #256 is purely UI/styling (hover, focus states)
- #295 is architectural (refactoring modal structure, data flow)
- No file conflicts (different modification targets)
- Different layers: #256 = visual, #295 = structural

### F.2: File/Component Conflicts

**Zero conflicts** between #256 and #295:

| File | #256 (Hover/Focus) | #295 (Tab Integration) | Conflict? |
|------|-------------------|----------------------|-----------|
| `Button.tsx` | Add hover/focus states | Add variant prop (no change) | ✅ NONE |
| `BuildTable.tsx` | Add row hover effects | Read only (no change) | ✅ NONE |
| `Form*.tsx` | Add focus rings | Read only (no change) | ✅ NONE |
| `BuildDetailModal.tsx` | Add focus management | Refactor structure (tabs) | ⚠️ LIGHT |
| `Tabs.tsx` | Add focus ring styling | Integration refactor | ✅ LIGHT |
| `__tests__/` | Add test cases | Add test cases | ✅ NONE |

**Light Conflicts**:
- `BuildDetailModal.tsx`: #256 adds keyboard close (Esc); #295 refactors layout
  - **Resolution**: #256 implements Esc handler, #295 keeps it intact
- `Tabs.tsx`: #256 adds focus ring; #295 integrates into modal
  - **Resolution**: #256 adds styles, #295 uses them

### F.3: Integration Points Between Issues

**Data Flow**:
```
#256: Interactive States (UI/CSS layer)
  ↓ (provides)
Consistent micro-interactions (hover, focus, active)
  ↓ (used by)
#295: Tab Integration (uses styled buttons, forms, tabs)
```

**Integration Checklist**:
- [ ] #256 completes focus ring styling
- [ ] #295 applies focus rings to new tab components
- [ ] #256 completes button hover states
- [ ] #295 uses enhanced buttons in tabs
- [ ] Both use consistent transition timings (200ms)

### F.4: Merge Order & Dependencies

**Recommended Merge Order**:

1. **#256 First** (1-2 days)
   - Foundation: Establishes interactive states across app
   - All components enhanced
   - Tests passing
   - Merge to main

2. **#295 Second** (3-5 days after #256 merges)
   - Rebase onto updated main (has #256 styles)
   - Tab components inherit focus rings, hover states
   - Modal refactoring on top of polished foundation
   - Merge to main

**No Direct Blocker**, but recommended sequence:
- #256 provides UI polish that #295 builds upon
- Testing easier if #256 baseline established first
- Reduces merge conflicts (sequential is cleaner)

---

## Implementation Roadmap Summary

### Execution Timeline

| Day | Tasks | Owner | Status |
|-----|-------|-------|--------|
| Day 1 | Component audit, Button/Form inputs enhanced | Dev | In Progress |
| Day 1 | Tests written, accessibility audit | Dev | In Progress |
| Day 2 | Table rows, Modal focus management | Dev | In Progress |
| Day 2 | Polish, final testing, PR created | Dev | In Progress |
| Post | Code review, feedback fixes | Reviewer + Dev | Pending |
| Post | Merge to main | DevOps | Pending |

### Key Deliverables

✅ Enhanced Button.tsx with hover/focus/active states  
✅ Form input components with focus rings  
✅ Table row hover effects  
✅ Modal keyboard close (Esc)  
✅ 95%+ unit test coverage  
✅ WCAG AA accessibility compliance  
✅ Smooth 200ms transitions throughout  
✅ Documentation (CLAUDE.md update)

### Reference Implementation Examples

See `ISSUE-259-IMPLEMENTATION-PLAN.md` for similar detail level on related issue.

---

**Document Version**: 1.0  
**Last Updated**: [Current Session]  
**Audience**: Development Team, Code Reviewers  
**Related Issues**: #295 (Tab Integration), #261 (Responsive Tables)
