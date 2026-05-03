# Issue #28 Quick Reference: Error Boundaries Implementation

**Purpose**: Quick lookup for error boundary patterns and code snippets  
**Audience**: Implementation phase (copy-paste ready code)  
**Status**: April 2026

---

## Error Boundary Component Pattern

### Basic Implementation

```typescript
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    console.error('Error caught by boundary:', error)
    console.error('Component stack:', errorInfo.componentStack)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!, this.handleReset) || (
          <div className="error-boundary-fallback">
            <h1>Something went wrong</h1>
            <p>{this.state.error?.message}</p>
            <button onClick={this.handleReset} className="btn-primary">
              Try Again
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
```

---

## Next.js Error Page

### error.tsx Implementation

```typescript
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}): React.ReactElement {
  return (
    <div className="error-page-container">
      <div className="error-content">
        <h1>Oops! Something went wrong</h1>
        <p className="error-message">{error.message}</p>
        {error.digest && (
          <p className="error-id">Error ID: {error.digest}</p>
        )}
        <button onClick={reset} className="btn-primary">
          Try Again
        </button>
      </div>
    </div>
  )
}
```

### CSS for Error Pages

```css
.error-boundary-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f9fafb;
}

.error-boundary-fallback h1 {
  color: #dc2626;
  font-size: 24px;
  margin-bottom: 10px;
}

.error-boundary-fallback p {
  color: #6b7280;
  margin-bottom: 20px;
  max-width: 500px;
  text-align: center;
}

.error-page-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.error-content {
  background: white;
  padding: 40px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.error-content h1 {
  color: #dc2626;
  margin-bottom: 15px;
}

.error-message {
  color: #6b7280;
  margin-bottom: 15px;
  line-height: 1.6;
}

.error-id {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 20px;
  word-break: break-all;
}

button {
  padding: 10px 20px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

button:hover {
  background-color: #5568d3;
}
```

---

## Apollo Error Link Pattern

### Error Link Implementation

```typescript
import { onError } from '@apollo/client/link/error'
import { extractErrorMessage, extractErrorDetails } from './graphql-error-handler'
import { createToast } from '@/components/toast-notification'

const errorLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    // Handle GraphQL errors
    if (graphQLErrors && graphQLErrors.length > 0) {
      graphQLErrors.forEach((graphQLError) => {
        const message = extractErrorMessage({ graphQLErrors: [graphQLError] })
        const errorDetails = extractErrorDetails({ graphQLErrors: [graphQLError] })

        // Log for debugging
        console.error(`[GraphQL Error] (${operation.operationName}):`, {
          message,
          errorType: errorDetails.errorType,
          timestamp: new Date().toISOString(),
          details: graphQLError,
        })

        // Display to user
        createToast(message, 'error', 7000)
      })
    }

    // Handle network errors
    if (networkError) {
      const message = extractErrorMessage(networkError)

      console.error(`[Network Error] (${operation.operationName}):`, {
        message,
        timestamp: new Date().toISOString(),
        error: networkError,
      })

      createToast(message, 'error', 7000)
    }

    // Continue the chain (critical for RetryLink integration in Issue #32)
    return forward(operation)
  }
)
```

### Updated makeClient() Function

```typescript
export function makeClient(): ApolloClient {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'

  const httpLink = new HttpLink({
    uri: graphqlUrl,
    credentials: 'include',
  })

  const authLink = setContext((_, context) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''
    const { headers } = context as { headers: Record<string, string> }
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    }
  })

  // NEW: Add error link before authLink
  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    cache: new InMemoryCache(),
    link: errorLink.concat(authLink).concat(httpLink), // errorLink first!
  })
}
```

---

## Layout Wrapper Update

### Updated layout.tsx

```typescript
import type { Metadata } from 'next'
import type { ReactNode, ReactElement } from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { ApolloWrapper } from './apollo-wrapper'
import { ToastContainer } from '@/components/toast-notification'
import { ErrorBoundary } from '@/components/error-boundary'
import './globals.css'

export const metadata: Metadata = {
  title: 'Boltline Test Dashboard',
  description: 'Hardware test workflow management for Stoke Space manufacturing',
}

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AuthProvider>
            <ApolloWrapper>{children}</ApolloWrapper>
            <ToastContainer />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

---

## Testing Patterns

### Test: ErrorBoundary Catches Errors

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '@/components/error-boundary'

it('should catch errors and display fallback', () => {
  const ThrowError = () => {
    throw new Error('Test error message')
  }

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  )

  expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  expect(screen.getByText('Test error message')).toBeInTheDocument()
})

it('should reset error state when button clicked', async () => {
  const user = userEvent.setup()
  let shouldThrow = true

  const ConditionalThrow = () => {
    if (shouldThrow) {
      throw new Error('Test error')
    }
    return <div>Recovered!</div>
  }

  const { rerender } = render(
    <ErrorBoundary>
      <ConditionalThrow />
    </ErrorBoundary>
  )

  expect(screen.getByText('Something went wrong')).toBeInTheDocument()

  shouldThrow = false
  const button = screen.getByRole('button', { name: /try again/i })
  await user.click(button)

  expect(screen.getByText('Recovered!')).toBeInTheDocument()
})
```

### Test: Apollo Error Link Shows Toast

```typescript
import { onError } from '@apollo/client/link/error'
import { createToast } from '@/components/toast-notification'

vi.mock('@/components/toast-notification')

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors && graphQLErrors.length > 0) {
    createToast('Test error', 'error', 7000)
  }
  return forward(operation)
})

it('should display error toast for GraphQL errors', () => {
  const graphQLErrors = [{ message: 'User not found' }]
  const operation = { operationName: 'GetUser' }
  const forward = vi.fn().mockReturnValue({})

  errorLink.setOperation({ graphQLErrors, networkError: null, operation, forward })

  expect(createToast).toHaveBeenCalledWith('Test error', 'error', 7000)
})
```

---

## Common Error Scenarios

### Scenario 1: Component Render Error

```typescript
// This component will throw
function BadComponent() {
  throw new Error('Render error')
}

// Wrapped by ErrorBoundary
<ErrorBoundary>
  <BadComponent />
</ErrorBoundary>

// Result: ErrorBoundary catches, shows fallback with error message
```

### Scenario 2: GraphQL Query Error

```typescript
// Query with invalid field
const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      invalidField  // ← This causes error
    }
  }
`

// Result: Apollo error link catches, shows toast, logs error
```

### Scenario 3: Network Error (Server Down)

```typescript
// Start app, stop GraphQL server
// Try to fetch data

// Result: Network error caught by error link, toast displays
```

### Scenario 4: Recovery with Retry

```typescript
// Error boundary shows error
// User clicks "Try Again"
// App resets error state
// Component attempts to render again

// Result: If GraphQL server is back up, query succeeds
```

---

## Integration Checklist

- [ ] ErrorBoundary created in `frontend/components/error-boundary.tsx`
- [ ] error.tsx created in `frontend/app/error.tsx`
- [ ] layout.tsx updated with ErrorBoundary wrapper
- [ ] apollo-client.ts updated with error link
- [ ] Error link chain: `errorLink.concat(authLink).concat(httpLink)`
- [ ] Error toast displays with type='error'
- [ ] Error console logs include operation name and type
- [ ] Error link returns `forward(operation)` for chain continuation
- [ ] All tests pass (target > 500)
- [ ] Build succeeds (`pnpm build`)
- [ ] No TypeScript errors

---

## Debugging Tips

### Test Component Error Locally

```bash
# 1. Add throw to a component render
// In any component:
throw new Error('Test error')

# 2. Start app
pnpm dev:frontend

# 3. Navigate to page with error
# → ErrorBoundary should catch it
# → Fallback UI displays
# → "Try Again" button resets
```

### Test GraphQL Error

```bash
# 1. Open GraphiQL IDE
curl http://localhost:4000/graphql

# 2. Query invalid field
query {
  builds {
    id
    invalidField  # ← This will error
  }
}

# 3. Frontend app should:
# → Toast appears with error
# → Console logs error with operation name
# → App continues working
```

### Test Network Error

```bash
# 1. Start app with working server
pnpm dev

# 2. In another terminal, stop GraphQL
# pkill -f "apollo"  (or kill the process)

# 3. In app, trigger query (click button that fetches data)

# 4. Verify:
# → Toast appears "Network error..."
# → Console logs network error
# → App doesn't crash
```

### Monitor Toast Display

```bash
# Open DevTools → Console
# Should see logs like:
[GraphQL Error] (GetUser):
  message: "User not found"
  errorType: "graphql"
  timestamp: "2026-04-18T12:34:56.789Z"
```

---

## Key Differences from Issue #31 (Toast)

**Issue #31** implemented the Toast notification system with:
- Global toast store (toasts array)
- createToast(), dismissToast() functions
- ToastContainer component
- useToast() hook
- Memory leak prevention with timeout tracking

**Issue #28** (this) uses Toast for error display:
- Calls `createToast(message, 'error', 7000)` on errors
- 7000ms duration for errors (longer than success)
- Follows same memory leak prevention patterns
- Integrates with Apollo error link (new)
- Integrates with React error boundary (new)

---

## Preparation for Issue #32 (Retry Logic)

The error link structure supports retry logic injection:

**Currently (Issue #28)**:
```
errorLink → authLink → httpLink
```

**After Issue #32**:
```
errorLink → retryLink → authLink → httpLink
```

**Critical for #32 success**:
1. Error link must call `forward(operation)` ✅
2. Error link must not consume operation ✅
3. Retryable errors must be classifiable ✅ (using isRetryableError())
4. Error link should not block retryLink ✅

**When #32 is implemented**, it will:
1. Import `isRetryableError()` from graphql-error-handler.ts
2. Create RetryLink with exponential backoff
3. Inject before authLink: `errorLink.concat(retryLink).concat(authLink).concat(httpLink)`
4. No changes needed to this error link

---

**Last Updated**: April 2026  
**Status**: Ready for copy-paste implementation  
**Next**: Start with ErrorBoundary component creation
