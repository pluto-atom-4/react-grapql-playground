# Issue #31: Toast Notifications - Quick Reference

**Last Updated**: April 17, 2026  
**Status**: Implementation Ready

---

## Component Structure Overview

```
RootLayout (frontend/app/layout.tsx)
│
└── <ToastContainer /> [FIXED POSITION: bottom-right, z-index: 9999]
    │
    ├── <Toast type="success" />  [Green, auto-dismiss: 5s]
    ├── <Toast type="error" />    [Red, auto-dismiss: 7s]
    └── <Toast type="info" />     [Blue, auto-dismiss: 5s]

BuildDetailModal (frontend/components/build-detail-modal.tsx)
│
├── useToast() Hook
│   ├── toast.success(message)
│   ├── toast.error(message)
│   ├── toast.warning(message)
│   └── toast.info(message)
│
├── handleStatusChange()
│   ├── On Success → toast.success("Build status updated to X")
│   └── On Error → toast.error("Failed to update status: {details}")
│
├── handleAddPart()
│   ├── On Success → toast.success("Part added successfully")
│   └── On Error → toast.error("Failed to add part: {details}")
│
└── handleSubmitTestRun()
    ├── On Success → toast.success("Test run submitted successfully")
    └── On Error → toast.error("Failed to submit test run: {details}")
```

---

## Toast Types & Styling

| Type | Color | Icon | Duration | CSS Class | Use Case |
|------|-------|------|----------|-----------|----------|
| `success` | Green (#10b981) | ✓ | 5s | `.toast-success` | Operation completed |
| `error` | Red (#ef4444) | ✕ | 7s | `.toast-error` | Operation failed |
| `warning` | Yellow (#f59e0b) | ⚠ | 5s | `.toast-warning` | Caution message |
| `info` | Blue (#3b82f6) | ℹ | 5s | `.toast-info` | Informational |

---

## Key Implementation Snippets

### 1. Create Toast Component

**File**: `frontend/components/toast-notification.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import './toast-notification.css'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

const toasts: Toast[] = []
const listeners: Set<(toasts: Toast[]) => void> = new Set()

export function createToast(message: string, type: ToastType = 'info', duration = 5000) {
  const id = Math.random().toString(36).substring(7)
  const toast: Toast = { id, message, type, duration }
  toasts.push(toast)
  notifyListeners()

  if (duration) {
    setTimeout(() => dismissToast(id), duration)
  }
  return id
}

export function dismissToast(id: string) {
  const index = toasts.findIndex((t) => t.id === id)
  if (index !== -1) {
    toasts.splice(index, 1)
    notifyListeners()
  }
}

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]))
}

export function ToastContainer() {
  const [toastList, setToastList] = useState<Toast[]>([])

  useEffect(() => {
    listeners.add(setToastList)
    return () => {
      listeners.delete(setToastList)
    }
  }, [])

  return (
    <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
      {toastList.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  )
}

function Toast({ id, message, type }: Toast) {
  return (
    <div className={`toast toast-${type}`} role="alert">
      <div className="toast-content">
        <span className="toast-icon">
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </span>
        <p className="toast-message">{message}</p>
      </div>
      <button
        className="toast-close"
        onClick={() => dismissToast(id)}
        aria-label="Close notification"
        type="button"
      >
        ×
      </button>
    </div>
  )
}

export function useToast() {
  return {
    success: (message: string) => createToast(message, 'success'),
    error: (message: string) => createToast(message, 'error', 7000),
    warning: (message: string) => createToast(message, 'warning'),
    info: (message: string) => createToast(message, 'info'),
  }
}
```

### 2. CSS Styling

**File**: `frontend/components/toast-notification.css`

```css
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  pointer-events: all;
  font-size: 14px;
  line-height: 1.5;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-success {
  border-left: 4px solid #10b981;
}

.toast-error {
  border-left: 4px solid #ef4444;
}

.toast-warning {
  border-left: 4px solid #f59e0b;
}

.toast-info {
  border-left: 4px solid #3b82f6;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.toast-icon {
  font-weight: bold;
  font-size: 18px;
  min-width: 24px;
  text-align: center;
}

.toast-success .toast-icon {
  color: #10b981;
}

.toast-error .toast-icon {
  color: #ef4444;
}

.toast-warning .toast-icon {
  color: #f59e0b;
}

.toast-info .toast-icon {
  color: #3b82f6;
}

.toast-message {
  margin: 0;
  color: #374151;
  word-break: break-word;
}

.toast-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 24px;
  color: #9ca3af;
  padding: 0;
  margin-left: 12px;
  flex-shrink: 0;
  transition: color 0.2s;
}

.toast-close:hover {
  color: #374151;
}

@media (max-width: 640px) {
  .toast-container {
    bottom: 12px;
    right: 12px;
    left: 12px;
    max-width: none;
  }

  .toast {
    padding: 12px;
    font-size: 13px;
  }
}
```

### 3. Update Layout

**File**: `frontend/app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import type { ReactNode, ReactElement } from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { ApolloWrapper } from './apollo-wrapper'
import { ToastContainer } from '@/components/toast-notification'  // ADD THIS
import './globals.css'

export const metadata: Metadata = {
  title: 'Boltline Test Dashboard',
  description: 'Hardware test workflow management for Stoke Space manufacturing',
}

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ApolloWrapper>{children}</ApolloWrapper>
          <ToastContainer />  {/* ADD THIS */}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 4. Update Build Detail Modal

**File**: `frontend/components/build-detail-modal.tsx`

```typescript
import { useToast } from '@/lib/error-notifier'  // ADD THIS

function BuildDetailContent({ buildId, onClose }: { buildId: string; onClose: () => void }) {
  const toast = useToast()  // ADD THIS
  // ... rest of component

  const handleStatusChange = (newStatus: string): void => {
    const validStatuses = [
      BuildStatus.Pending,
      BuildStatus.Running,
      BuildStatus.Complete,
      BuildStatus.Failed,
    ]
    if (!validStatuses.includes(newStatus as BuildStatus)) {
      toast.warning(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)  // UPDATED
      return
    }

    void (async (): Promise<void> => {
      try {
        setIsUpdatingStatus(true)
        await updateStatus(buildId, newStatus as BuildStatus)
        toast.success(`Build status updated to ${newStatus}`)  // ADD THIS
      } catch (error) {
        const message = typeof error === 'string' ? error : String(error)
        toast.error(`Failed to update status: ${message}`)  // UPDATED
      } finally {
        setIsUpdatingStatus(false)
      }
    })()
  }

  // Similar updates for handleAddPart() and handleSubmitTestRun()
}
```

---

## Usage Examples

### In Components

```typescript
'use client'
import { useToast } from '@/lib/error-notifier'

export function MyComponent() {
  const toast = useToast()

  const handleAction = async () => {
    try {
      await someAsyncOperation()
      toast.success('Operation completed!')
    } catch (error) {
      toast.error(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return <button onClick={handleAction}>Do Something</button>
}
```

### Error Message Formatting

```typescript
// Extract user-friendly message from various error types
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

// In catch block
try {
  await mutation()
} catch (error) {
  toast.error(`Failed to update: ${getErrorMessage(error)}`)
}
```

---

## Testing Examples

### Unit Test: Toast Functions

```typescript
import { createToast, dismissToast, useToast } from '@/components/toast-notification'

describe('Toast System', () => {
  test('createToast adds toast', () => {
    const id = createToast('Hello', 'info')
    expect(id).toBeDefined()
  })

  test('dismissToast removes toast', () => {
    const id = createToast('Hello', 'info')
    dismissToast(id)
    // Verify removal (would need to expose store for testing)
  })

  test('useToast returns all methods', () => {
    const toast = useToast()
    expect(toast.success).toBeDefined()
    expect(toast.error).toBeDefined()
    expect(toast.warning).toBeDefined()
    expect(toast.info).toBeDefined()
  })
})
```

### Integration Test: Mutation Error

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockedProvider } from '@apollo/client/testing'
import BuildDetailModal from '@/components/build-detail-modal'

describe('BuildDetailModal Toasts', () => {
  test('shows error toast on mutation failure', async () => {
    const mocks = [
      {
        request: { query: UPDATE_BUILD_STATUS },
        result: { errors: [{ message: 'GraphQL error' }] },
      },
    ]

    render(
      <MockedProvider mocks={mocks}>
        <BuildDetailModal buildId="123" onClose={() => {}} />
      </MockedProvider>
    )

    await userEvent.click(screen.getByText(/Update/))
    await waitFor(() => {
      expect(screen.getByText(/Failed to update status/)).toBeInTheDocument()
    })
  })
})
```

---

## Toast Lifecycle

```
1. User triggers action (click button)
   └─> Try mutation

2. Mutation fails
   └─> Catch error
   └─> toast.error("Failed to...")
   └─> createToast() called

3. Toast store updated
   └─> Listeners notified
   └─> ToastContainer re-renders

4. Toast appears on screen
   └─> Slide-in animation
   └─> Auto-dismiss timer starts (7s for error)

5. After timeout expires OR user clicks ×
   └─> dismissToast(id) called
   └─> Toast removed from store
   └─> Toast disappears from DOM

[Complete]
```

---

## Checklist for Integration

- [ ] Import `useToast` hook
- [ ] Call `useToast()` in component
- [ ] Replace `alert()` with `toast.error()`
- [ ] Add `toast.success()` on successful mutation
- [ ] Include error context in message
- [ ] Test error scenario (stop GraphQL server)
- [ ] Test success scenario
- [ ] Verify message is readable and helpful

---

## Common Patterns

**Pattern 1: Mutation with Error Handling**
```typescript
const handleSave = async () => {
  try {
    await saveMutation()
    toast.success('Saved successfully')
  } catch (error) {
    toast.error(`Failed to save: ${getErrorMessage(error)}`)
  }
}
```

**Pattern 2: Multiple Operations**
```typescript
const handleBulkAction = async () => {
  let successCount = 0
  for (const item of items) {
    try {
      await process(item)
      successCount++
    } catch (error) {
      toast.error(`Failed to process ${item.id}`)
    }
  }
  toast.success(`Processed ${successCount}/${items.length}`)
}
```

**Pattern 3: Validation Error**
```typescript
const handleSubmit = (data: FormData) => {
  if (!data.name) {
    toast.warning('Name is required')
    return
  }
  // proceed...
}
```

---

## Files Summary

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `toast-notification.tsx` | NEW | 200 | Toast system (store, component, hooks) |
| `toast-notification.css` | NEW | 80 | Styling and animations |
| `error-notifier.ts` | NEW | 30 | Hook re-export and helpers |
| `layout.tsx` | EDIT | +2 | Add ToastContainer |
| `build-detail-modal.tsx` | EDIT | +20 | Use toast in 3 handlers |
| `toast-notification.test.tsx` | NEW | 150 | Unit tests |
| `build-detail-modal-toast.test.tsx` | NEW | 120 | Integration tests |

---

## Troubleshooting

**Issue**: Toast doesn't appear
- [ ] Verify ToastContainer in layout.tsx
- [ ] Check z-index isn't covered by other elements
- [ ] Verify useToast() called in component

**Issue**: Toast doesn't auto-dismiss
- [ ] Check duration parameter in createToast
- [ ] Verify setTimeout is working
- [ ] Check browser console for errors

**Issue**: Multiple toasts don't stack
- [ ] Verify gap: 10px in .toast-container CSS
- [ ] Check flex-direction: column is set
- [ ] Verify position: fixed is correct

**Issue**: Toast blocks interaction
- [ ] Verify pointer-events: all on .toast
- [ ] Check z-index value
- [ ] Verify max-width allows content

---

## Next Steps After Issue #31

After this issue merges:
- **Issue #32**: Add retry button to error toasts
- **Issue #28**: Add Error Boundary integration
- **Issue #29**: CORS & SSE error handling improvements

