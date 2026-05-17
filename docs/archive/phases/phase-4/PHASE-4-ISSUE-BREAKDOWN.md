# 📋 PHASE 4: Detailed Issue Breakdown

**Created:** 2026-05-05  
**Status:** All issues scoped and ready for implementation  
**Total Effort:** 9.5 hours (1+ developers)

---

## 🎯 Issue #33: FileUploader Component

**Status:** ✅ **COMPLETE** (Closed May 5, 2026)  
**GitHub URL:** https://github.com/pluto-atom-4/react-grapql-playground/issues/33  
**Effort:** 2 hours (complete)

### Scope
Create a reusable FileUploader component with drag-and-drop, file validation, and progress tracking for uploading test reports to Express backend.

### Acceptance Criteria (ALL MET ✅)
- ✅ Drag-and-drop UI implemented
- ✅ Click to select file working
- ✅ File size validation (50MB max) enforced
- ✅ MIME type validation (PDF, CSV, JSON) working
- ✅ Upload progress bar displayed
- ✅ Success toast on completion
- ✅ Error toast on failure
- ✅ Disabled during upload
- ✅ Integrated in BuildDetailModal
- ✅ All tests passing (741 tests)

### Implementation Details

**Component Location:** `frontend/components/FileUploader/`

**Key Files:**
- `FileUploader.tsx` - Main component
- `useUploadFile.ts` - Custom hook for upload logic
- `__tests__/FileUploader.test.tsx` - Unit tests
- `__tests__/useUploadFile.test.ts` - Hook tests

**Features Implemented:**
```typescript
// Drag-and-drop + file input
// File validation:
//   - Max 50MB
//   - MIME types: application/pdf, text/csv, application/json
// Progress tracking with XMLHttpRequest
// Toast notifications (success/error)
// Disabled state during upload
```

**Backend Integration:**
- Endpoint: `POST http://localhost:5000/upload`
- Request: FormData with `file` field
- Response: `{ fileUrl: string }`

### Related PRs
- None directly; integrated as part of Phase 3

### Testing Summary
- Unit tests: 17 passing
- Integration tests: 4 passing
- No regressions

### Dependency Status
- ✅ Depends on #31 (Toast notifications) - Complete
- ✅ Depends on #5 (Backend file uploads) - Complete

### Lessons Learned
- XMLHttpRequest progress events require careful mock handling in tests
- Drag-and-drop UX needs visual feedback (cursor changes)
- File validation should happen before upload attempt

---

## 🔵 Issue #34: Implement Pagination UI

**Status:** 🟠 **OPEN - Ready to Start**  
**GitHub URL:** https://github.com/pluto-atom-4/react-grapql-playground/issues/34  
**Effort:** 1.75 hours estimated

### Scope
Add pagination controls to BuildDashboard to load 10 builds per page instead of all at once. Includes GraphQL query update and new Pagination component.

### Acceptance Criteria
- [ ] Builds query accepts `limit` and `offset` parameters
- [ ] Pagination component created and reusable
- [ ] Page state managed in BuildDashboard
- [ ] Prev/next buttons work correctly
- [ ] Total count displayed ("Page X of Y")
- [ ] Buttons disabled appropriately (no prev on page 1, no next on last)
- [ ] URL params optional (can add to search params later)
- [ ] Unit tests pass
- [ ] Integration tests pass (Apollo + React Testing Library)
- [ ] No performance regression

### Technical Approach

**Step 1: Update GraphQL Query**
```graphql
# backend-graphql/src/schema.graphql
type Query {
  builds(limit: Int, offset: Int): [Build!]!
}
```

**Step 2: Update Apollo Hook**
```typescript
// frontend/lib/hooks/useBuilds.ts
export function useBuilds(limit: number = 10, offset: number = 0) {
  return useQuery(GET_BUILDS, {
    variables: { limit, offset }
  })
}
```

**Step 3: Create Pagination Component**
```typescript
// frontend/components/Pagination.tsx
export function Pagination({
  currentPage,
  totalPages,
  onNext,
  onPrev
}: PaginationProps) {
  // Component implementation
}
```

**Step 4: Integrate in Dashboard**
```typescript
// frontend/components/BuildDashboard.tsx
const [page, setPage] = useState(1)
const limit = 10
const { data } = useBuilds(limit, (page - 1) * limit)
```

### Files to Create/Modify
- **Create:** `frontend/components/Pagination.tsx`
- **Create:** `frontend/components/Pagination.test.tsx`
- **Modify:** `frontend/lib/graphql/queries.ts` (update GET_BUILDS)
- **Modify:** `frontend/lib/hooks/useBuilds.ts` (add parameters)
- **Modify:** `frontend/components/BuildDashboard.tsx` (add pagination state)
- **Modify:** `backend-graphql/src/schema.graphql` (add limit/offset)
- **Modify:** `backend-graphql/src/resolvers/Query.ts` (implement limit/offset)

### Testing Strategy

**Unit Tests:**
```typescript
// Test pagination component
- Render with page 1 of 5
- Previous button disabled
- Next button enabled
- Click next → onNext() called
- Click previous → onPrev() called
```

**Integration Tests:**
```typescript
// Test with MockedProvider
- Query with limit/offset variables
- Cache invalidates on page change
- Data updates when page changes
```

**Manual Testing:**
1. Dashboard loads page 1 (10 builds)
2. Click next → loads page 2
3. Click prev → loads page 1
4. Click next on last page → disabled

### Dependencies
- ✅ Phase 3 (Event bus, Apollo working)
- ✅ Issue #25 (TypeScript types)
- No blocking dependencies within Phase 4

### Effort Breakdown
- GraphQL schema/resolver: 20 min
- Pagination component: 25 min
- Hook update: 15 min
- Dashboard integration: 20 min
- Testing: 30 min
- **Total: 1h 50m** (1.75h estimate includes review)

### Risk Factors
- **Apollo cache invalidation:** May need explicit refetchQueries if offset param not recognized
- **Page calculation:** Edge case if total count changes during pagination
- **Performance:** Ensure 10 builds per page doesn't cause lag

### Interview Talking Points
- "Pagination improves performance by limiting payload and rendering"
- "Apollo client cache handles pagination state efficiently"
- "Offset-based pagination is simple; cursor-based (relay) is more robust"

---

## 🔵 Issue #35: Add Loading Skeletons

**Status:** 🟠 **OPEN - Ready to Start**  
**GitHub URL:** https://github.com/pluto-atom-4/react-grapql-playground/issues/35  
**Effort:** 2.25 hours estimated

### Scope
Replace generic "Loading builds..." text with skeleton placeholders that match the table and modal structure. Includes shimmer animation for smooth UX.

### Acceptance Criteria
- [ ] TableSkeleton component matches real table (5 rows, 3 columns)
- [ ] ModalSkeleton component matches BuildDetailModal structure
- [ ] Shimmer animation smooth and professional (1.5s loop)
- [ ] Skeleton disappears instantly when data loads
- [ ] Works on mobile (responsive, no layout shift)
- [ ] No accessibility violations
- [ ] Tests verify skeleton render/disappear logic
- [ ] Lighthouse score maintained (no CLS regression)

### Technical Approach

**Step 1: Create Skeleton Components**
```typescript
// frontend/components/SkeletonLoader/TableSkeleton.tsx
export function TableSkeleton() {
  return (
    <table className="w-full">
      <tbody>
        {[...Array(5)].map((_, i) => (
          <tr key={i}>
            <td className="py-3 px-4"><div className="skeleton h-4 w-24" /></td>
            <td className="py-3 px-4"><div className="skeleton h-4 w-32" /></td>
            <td className="py-3 px-4"><div className="skeleton h-4 w-20" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

**Step 2: Create Shimmer Animation**
```css
/* frontend/components/SkeletonLoader/skeleton.module.css */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Step 3: Integrate in Dashboard**
```typescript
// frontend/components/BuildDashboard.tsx
if (loading) return <TableSkeleton />
return <BuildsTable data={builds} />
```

**Step 4: Integrate in Modal**
```typescript
// frontend/components/BuildDetailModal.tsx
if (loadingBuild) return <ModalSkeleton />
return <BuildDetails build={build} />
```

### Files to Create/Modify
- **Create:** `frontend/components/SkeletonLoader/TableSkeleton.tsx`
- **Create:** `frontend/components/SkeletonLoader/ModalSkeleton.tsx`
- **Create:** `frontend/components/SkeletonLoader/skeleton.module.css`
- **Create:** `frontend/components/SkeletonLoader/__tests__/TableSkeleton.test.tsx`
- **Modify:** `frontend/components/BuildDashboard.tsx` (use skeleton)
- **Modify:** `frontend/components/BuildDetailModal.tsx` (use skeleton)

### Testing Strategy

**Unit Tests:**
```typescript
// Render and verify structure
- TableSkeleton renders 5 rows
- ModalSkeleton renders correct sections
- Animation class applied
```

**Integration Tests:**
```typescript
// Test with Apollo loading state
- When loading=true, show skeleton
- When loading=false, show data
- No delay between skeleton and data
```

**Visual Tests:**
```typescript
// Snapshot tests
- TableSkeleton structure
- ModalSkeleton structure
```

**Performance Tests:**
```
// Lighthouse CLS metric
- Before: 0 CLS
- After: 0 CLS (no layout shift)
```

### Dependencies
- ✅ Phase 3 (Apollo loading states working)
- 🟡 Issue #39 (Tailwind consolidation - should run first for consistent styling)
- No blocking dependencies

### Effort Breakdown
- Skeleton components: 30 min
- CSS animation: 15 min
- Dashboard integration: 20 min
- Modal integration: 15 min
- Testing: 45 min
- **Total: 2h 5m** (2.25h estimate includes review)

### Risk Factors
- **CLS (Cumulative Layout Shift):** Skeleton must match data dimensions exactly
- **Animation performance:** Ensure 60fps on mobile
- **Accessibility:** Ensure loading state announced to screen readers

### Interview Talking Points
- "Skeletons provide perceived performance improvement vs. spinner"
- "CLS metric matters for SEO and UX; skeleton must match final dimensions"
- "Shimmer animation is subtle but professional"

---

## 🟡 Issue #39: Replace Custom CSS with Tailwind

**Status:** 🟠 **OPEN - Ready to Start**  
**GitHub URL:** https://github.com/pluto-atom-4/react-grapql-playground/issues/39  
**Effort:** 1.5 hours estimated

### Scope
Consolidate all custom CSS files into Tailwind utility classes. Removes `.css` files and ensures consistent styling across components.

### Acceptance Criteria
- [ ] All CSS files removed from components/
- [ ] All styles converted to Tailwind classes
- [ ] Responsive classes used (@sm, @md, @lg)
- [ ] Color palette consistent (use Tailwind colors)
- [ ] Spacing consistent (use Tailwind scale: p-1 to p-12)
- [ ] Build succeeds (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Visual appearance unchanged
- [ ] No performance regression

### Technical Approach

**Step 1: Audit CSS Files**
```bash
# Find all .css files in components
find frontend/components -name "*.css" -type f

# Expected:
# frontend/components/build-dashboard.css
# frontend/components/build-detail-modal.css
# (others?)
```

**Step 2: Convert to Tailwind**
```typescript
// BEFORE
// build-dashboard.css
.dashboard-header {
  padding: 20px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

// AFTER
// build-dashboard.tsx
<div className="p-5 bg-gray-50 border-b border-gray-200">
```

**Step 3: Remove CSS Imports**
```typescript
// BEFORE
import './build-dashboard.css'

// AFTER
// (remove line)
```

**Step 4: Verify Responsive Design**
```typescript
// Use Tailwind breakpoints
<div className="p-4 sm:p-6 md:p-8 lg:p-10">
```

### Files to Modify
- **Remove:** `frontend/components/build-dashboard.css`
- **Remove:** `frontend/components/build-detail-modal.css`
- **Modify:** `frontend/components/build-dashboard.tsx` (add Tailwind classes)
- **Modify:** `frontend/components/build-detail-modal.tsx` (add Tailwind classes)
- **Modify:** Any other components using `.css` files

### CSS → Tailwind Mappings

**Common Conversions:**
```
padding: 20px           → p-5
padding-left: 16px      → pl-4
padding-top: 20px       → pt-5
margin-bottom: 12px     → mb-3
background-color: white → bg-white
border: 1px solid gray  → border border-gray-300
border-radius: 8px      → rounded-lg
box-shadow: 0 1px 3px   → shadow
font-size: 16px         → text-base
font-weight: bold       → font-bold
```

### Testing Strategy

**Visual Regression:**
```bash
# Take before/after screenshots
# Verify: colors, spacing, borders, shadows unchanged
```

**Responsive Design:**
```bash
# Test breakpoints
# Mobile (320px), Tablet (768px), Desktop (1024px)
# Verify layout shifts correctly
```

**Build & Lint:**
```bash
pnpm build
pnpm lint
```

### Dependencies
- ✅ Phase 3 (Tailwind already configured)
- No blocking dependencies

### Effort Breakdown
- CSS audit: 15 min
- CSS → Tailwind conversion: 30 min
- Remove imports: 5 min
- Responsive verification: 15 min
- Testing: 20 min
- **Total: 1h 25m** (1.5h estimate includes review)

### Risk Factors
- **Missed CSS rules:** Use browser DevTools to verify all rules applied
- **Mobile responsive:** Test all breakpoints after conversion
- **Performance:** Verify bundle size not increased

### Interview Talking Points
- "Consolidating to Tailwind improves consistency and reduces CSS payload"
- "Utility-first approach scales better than BEM or component CSS"
- "Responsive design becomes declarative with Tailwind breakpoints"

---

## 🟢 Issue #40: Add Accessibility Improvements (WCAG AA)

**Status:** 🟠 **OPEN - Ready to Start**  
**GitHub URL:** https://github.com/pluto-atom-4/react-grapql-playground/issues/40  
**Effort:** 3.5 hours estimated

### Scope
Implement comprehensive WCAG AA accessibility improvements across all components. Includes ARIA labels, keyboard navigation, focus management, screen reader support, and contrast verification.

### Acceptance Criteria
- [ ] All buttons have aria-label or meaningful text
- [ ] Modal has `role="dialog"` and `aria-modal="true"`
- [ ] Keyboard navigation works (Tab through all elements)
- [ ] Escape key closes modal
- [ ] Focus trap in modal (Tab stays inside)
- [ ] Focus indicators visible (outline or ring)
- [ ] axe DevTools finds 0 violations
- [ ] WAVE audit finds 0 errors
- [ ] Tested with screen reader (NVDA/VoiceOver)
- [ ] Lighthouse Accessibility score ≥ 90
- [ ] Contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Tests verify keyboard navigation

### Technical Approach

**Step 1: Add ARIA Labels**
```typescript
// BEFORE
<button>+</button>

// AFTER
<button aria-label="Upload test report">+</button>

// For text buttons, aria-label can be inferred
<button>Delete</button>  // OK, text is label
```

**Step 2: Implement Modal Accessibility**
```typescript
export function BuildDetailModal({ isOpen, onClose }) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    // Focus first interactive element
    const firstButton = modalRef.current?.querySelector('button')
    firstButton?.focus()

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    // Focus trap (keep Tab inside modal)
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusableElements) return

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handleTabKey)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleTabKey)
    }
  }, [isOpen, onClose])

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 id="modal-title" className="text-lg font-bold">Build Details</h2>
        {/* Content */}
      </div>
    </div>
  )
}
```

**Step 3: Semantic HTML**
```typescript
// BEFORE (non-semantic)
<div onClick={onDelete} className="cursor-pointer">Delete</div>

// AFTER (semantic)
<button onClick={onDelete}>Delete</button>

// Use landmarks
<nav>Navigation items</nav>
<main>Main content</main>
<section>Content section</section>
```

**Step 4: Focus Indicators**
```typescript
// Add visible focus outline
<button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Click me
</button>

// CSS
.focus\:ring-2:focus {
  outline: 2px solid blue;
  outline-offset: 2px;
}
```

**Step 5: Color Contrast & Screen Reader**
```typescript
// Verify 4.5:1 contrast (WCAG AA)
// Use tools: WebAIM Contrast Checker

// Add alt text
<img src="build.png" alt="Build #123 status" />

// Add labels to form inputs
<label htmlFor="search">Search builds:</label>
<input id="search" type="text" />

// Add aria-label for icons
<button aria-label="Close modal" onClick={onClose}>
  <XIcon />  {/* icon only */}
</button>
```

### Files to Modify
- **Modify:** `frontend/components/BuildDashboard.tsx` (ARIA labels, semantic HTML)
- **Modify:** `frontend/components/BuildDetailModal.tsx` (modal a11y, focus trap)
- **Modify:** `frontend/components/FileUploader.tsx` (labels, keyboard nav)
- **Modify:** `frontend/components/Pagination.tsx` (labels, keyboard nav)
- **Create:** `frontend/components/__tests__/accessibility.test.tsx` (a11y tests)

### Testing Strategy

**Unit Tests:**
```typescript
// Test keyboard navigation
test('Tab navigates through buttons', () => {
  const { getByRole } = render(<BuildDetailModal isOpen={true} />)
  const buttons = getByRole('button')
  
  // Simulate Tab key
  // Verify focus moves through buttons
})

// Test Escape key
test('Escape closes modal', () => {
  const onClose = vi.fn()
  const { getByRole } = render(
    <BuildDetailModal isOpen={true} onClose={onClose} />
  )

  const modal = getByRole('dialog')
  fireEvent.keyDown(modal, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})
```

**Automated Audits:**
```typescript
// Using axe-playwright (if available)
test('Modal passes accessibility audit', async () => {
  const page = await browser.newPage()
  const results = await axe(page)
  expect(results.violations).toHaveLength(0)
})
```

**Manual Testing:**
```
# 1. Screen Reader Testing
- macOS: VoiceOver (Cmd+F5)
- Windows: NVDA (free download)
- Test: Can screen reader user navigate?

# 2. Keyboard Navigation
- Tab: Navigate through all interactive elements
- Shift+Tab: Navigate backwards
- Enter/Space: Activate buttons
- Escape: Close modal

# 3. Browser Tools
- DevTools → Accessibility tab
- Check: ARIA labels, roles, focus order

# 4. Online Tools
- axe DevTools: https://www.deque.com/axe/devtools/
- WAVE: https://wave.webaim.org/
- Lighthouse: DevTools → Lighthouse → Accessibility
```

### Dependencies
- ✅ Phase 3 (Components exist)
- 🟡 Issue #39 (Tailwind focus rings available)
- No blocking dependencies

### Effort Breakdown
- ARIA labels: 45 min
- Modal focus trap: 45 min
- Semantic HTML: 20 min
- Focus indicators: 15 min
- Screen reader testing: 30 min
- Automated testing (axe): 30 min
- Testing: 40 min
- **Total: 3h 45m** (3.5h estimate includes review)

### Risk Factors
- **Screen reader differences:** VoiceOver, NVDA, JAWS may behave differently
- **Focus trap complexity:** Edge cases with dynamic content
- **Performance impact:** Focus listeners may impact render performance
- **Browser compatibility:** Some ARIA attributes have inconsistent support

### WCAG AA Standards Summary
- **Contrast Ratio:** 4.5:1 for normal text
- **Keyboard Accessible:** All functionality reachable via keyboard
- **Focus Visible:** Focus indicator clear and visible
- **Alt Text:** Images have descriptive alt text
- **Form Labels:** All inputs have associated labels
- **Error Messages:** Clear error messages for form validation
- **Motion:** Avoid autoplay of animations

### Interview Talking Points
1. "Accessibility is not an afterthought; it's built into every component"
2. "WCAG AA compliance ensures 100M+ people with disabilities can use our product"
3. "ARIA labels help screen reader users understand the interface"
4. "Keyboard navigation is essential for power users and accessibility"
5. "Focus management in modals prevents confusion and supports tab order"
6. "Testing with real screen readers (not just automated tools) is crucial"

---

## 📊 Cross-Issue Summary

| Issue | Status | Effort | Priority | Owner | Start | End |
|-------|--------|--------|----------|-------|-------|-----|
| #33 | ✅ DONE | 2h | 🔴 | N/A | 5/5 | 5/5 |
| #34 | 🟠 OPEN | 1.75h | 🟡 | Frontend | 5/6 | 5/7 |
| #35 | 🟠 OPEN | 2.25h | 🟡 | Frontend | 5/6 | 5/8 |
| #39 | 🟠 OPEN | 1.5h | 🟢 | Frontend | 5/6 | 5/7 |
| #40 | 🟠 OPEN | 3.5h | 🟡 | Frontend | 5/7 | 5/9 |

---

**Document Created:** 2026-05-05  
**Last Updated:** 2026-05-05  
**Status:** Ready for Development
