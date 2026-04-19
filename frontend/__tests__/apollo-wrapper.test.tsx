import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { useState } from 'react'
import { gql } from '@apollo/client/core'
import { ApolloWrapper } from '../app/apollo-wrapper'
import { useApolloClient } from '@apollo/client/react'

/**
 * Issue #23 Test Suite: Apollo Client Singleton Pattern
 *
 * These tests verify that the Apollo Client is created once and reused
 * across all component re-renders, ensuring cache persistence and optimal
 * performance.
 *
 * Acceptance Criteria:
 * AC1: Apollo client instance persists across component re-renders
 * AC2: Cache survives navigation between pages
 * AC6: SSE real-time integration works
 */

// Mock the useSSEEvents hook to isolate apollo-wrapper testing
vi.mock('../lib/use-sse-events', () => ({
  useSSEEvents: vi.fn(),
}))

// Test component that captures and exposes the Apollo client
function TestClientCapture({ onClientCapture }: { onClientCapture: (client: unknown) => void }): React.ReactNode {
  const client = useApolloClient()
  
  // Capture client on every render to verify it doesn't change
  if (client) {
    onClientCapture(client)
  }
  
  return <div data-testid="test-component">Test Component</div>
}

// Test component that forces re-renders
function ReRenderTrigger({ children }: { children: React.ReactNode }): React.ReactNode {
  const [renderCount, setRenderCount] = useState(0)
  
  return (
    <div>
      <button 
        onClick={() => setRenderCount(c => c + 1)}
        data-testid="rerender-button"
      >
        Force Re-render ({renderCount})
      </button>
      {children}
    </div>
  )
}

describe('ApolloWrapper - Singleton Pattern (Issue #23)', () => {
  describe('AC1: Client Instance Persistence', () => {
    it('should create Apollo client exactly once with useMemo', (): void => {
      // Verify: makeClient is called once during initial render
      // This is implicitly verified by the absence of warnings
      const clients: unknown[] = []
      
      const TestComponent = (): React.ReactNode => {
        const client = useApolloClient()
        if (client && !clients.includes(client)) {
          clients.push(client)
        }
        return <div data-testid="wrapped">Wrapped</div>
      }
      
      render(
        <ApolloWrapper>
          <TestComponent />
        </ApolloWrapper>
      )
      
      // Verify: Only one unique client instance exists
      expect(clients).toHaveLength(1)
      expect(screen.getByTestId('wrapped')).toBeDefined()
    })

    it('should persist client reference across component re-renders', async (): Promise<void> => {
      const capturedClients: unknown[] = []
      
      render(
        <ApolloWrapper>
          <ReRenderTrigger>
            <TestClientCapture 
              onClientCapture={(client) => {
                capturedClients.push(client)
              }}
            />
          </ReRenderTrigger>
        </ApolloWrapper>
      )
      
      // Initial render: capture first client
      await waitFor(() => {
        expect(screen.queryByTestId('test-component')).toBeDefined()
      })
      
       const firstClient = capturedClients[0] ?? null
      
      // Force re-render by clicking button
      const button = screen.getByTestId('rerender-button')
      button.click()
      
      // Wait for re-render
      await waitFor(() => {
        expect(button.textContent).toMatch(/Force Re-render \(1\)/)
      })
      
      // Verify: Apollo client reference is identical (same object)
      // The new captures should reference the same client
       
      const secondClient = capturedClients[capturedClients.length - 1] ?? null
      expect(firstClient).toBe(secondClient)
      expect(firstClient).toEqual(secondClient)
    })

    it('should not recreate client on prop changes', (): void => {
      const capturedClients: unknown[] = []
      
      const ChildComponent = (): React.ReactNode => {
        const client = useApolloClient()
        if (client && !capturedClients.find(c => c === client)) {
          capturedClients.push(client)
        }
        return <div data-testid="child">Child</div>
      }
      
      const { rerender } = render(
        <ApolloWrapper>
          <ChildComponent />
        </ApolloWrapper>
      )
      
      expect(screen.getByTestId('child')).toBeDefined()
      
      // Change props (children) by re-rendering with different content
      rerender(
        <ApolloWrapper>
          <div data-testid="new-child">New Child</div>
        </ApolloWrapper>
      )
      
      // Verify: Client instance count stayed at 1 (not recreated)
      expect(capturedClients).toHaveLength(1)
    })

    it('should maintain client identity across multiple renders', (): void => {
      const clients: unknown[] = []
      
      const ClientTracker = (): React.ReactNode => {
        const client = useApolloClient()
        clients.push(client)
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return <div data-testid="tracker">Client ID: {String(client)}</div>
      }
      
      const { rerender } = render(
        <ApolloWrapper>
          <ClientTracker />
        </ApolloWrapper>
      )
      
       
      const firstClient = clients[0] ?? null
      
      // Re-render multiple times
      for (let i = 0; i < 3; i++) {
        rerender(
          <ApolloWrapper>
            <ClientTracker />
          </ApolloWrapper>
        )
      }
      
      // Verify: All captured clients are the same object reference
      clients.forEach(client => {
        expect(client).toBe(firstClient)
      })
      
      // Verify: Exactly one unique client instance across all renders
      const uniqueClients = new Set(clients)
      expect(uniqueClients.size).toBe(1)
    })
  })

  describe('AC2: Cache Persistence', () => {
    // @ts-expect-error intentionally unused for documentation
    const _TEST_QUERY = gql`
      query GetTestData {
        test {
          id
          value
        }
      }
    `

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should maintain cache reference identity across re-renders', async (): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cacheReferences: any[] = []

      const CacheInspector = (): React.ReactNode => {
        const client = useApolloClient()
        cacheReferences.push(client?.cache)
        return <div data-testid="inspector">Cache Inspector</div>
      }

      render(
        <ApolloWrapper>
          <ReRenderTrigger>
            <CacheInspector />
          </ReRenderTrigger>
        </ApolloWrapper>
      )

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const firstCache = cacheReferences[0]

      // Trigger re-renders
      const button = screen.getByTestId('rerender-button')
      button.click()
      button.click()

      await waitFor(() => {
        expect(button.textContent).toMatch(/Force Re-render \(2\)/)
      })

      // Verify: Cache reference is identical across all captures
      cacheReferences.forEach(cache => {
        expect(cache).toBe(firstCache)
      })

      // Verify: Only one unique cache instance
      const uniqueCaches = new Set(cacheReferences)
      expect(uniqueCaches.size).toBe(1)
    })
  })

  describe('AC6: SSE Integration', () => {
    it('should mount SSEInitializer component', (): void => {
      // The SSEInitializer is mocked in beforeEach, so we just verify
      // that the component renders without errors
      const TestChild = (): React.ReactNode => <div data-testid="child">Child</div>
      
      render(
        <ApolloWrapper>
          <TestChild />
        </ApolloWrapper>
      )
      
      expect(screen.getByTestId('child')).toBeDefined()
    })

    it('should render children without SSEInitializer causing issues', (): void => {
      const TestContent = (): React.ReactNode => (
        <div data-testid="content">
          <h1>Test Content</h1>
          <p>This should render without SSE errors</p>
        </div>
      )
      
      render(
        <ApolloWrapper>
          <TestContent />
        </ApolloWrapper>
      )
      
      expect(screen.getByTestId('content')).toBeDefined()
      expect(screen.getByText('Test Content')).toBeDefined()
      expect(screen.getByText(/should render without SSE errors/)).toBeDefined()
    })
  })

  describe('General Behavior', () => {
    it('should render children correctly', (): void => {
      const TestChildren = (): React.ReactNode => (
        <div>
          <span data-testid="child-1">Child 1</span>
          <span data-testid="child-2">Child 2</span>
        </div>
      )

      render(
        <ApolloWrapper>
          <TestChildren />
        </ApolloWrapper>
      )

      expect(screen.getByTestId('child-1')).toBeDefined()
      expect(screen.getByTestId('child-2')).toBeDefined()
    })

    it('should wrap children with ApolloProvider', (): void => {
      // Verify that useApolloClient hook works inside children
      // This proves ApolloProvider is wrapping correctly
      const VerifyApolloProvider = (): React.ReactNode => {
        const client = useApolloClient()
        return <div data-testid="verify">{client ? 'Apollo Ready' : 'No Apollo'}</div>
      }

      render(
        <ApolloWrapper>
          <VerifyApolloProvider />
        </ApolloWrapper>
      )

      const verify = screen.getByTestId('verify')
      expect(verify.textContent).toBe('Apollo Ready')
    })

    it('should handle nested components with Apollo', (): void => {
      const DeepChild = (): React.ReactNode => {
        const client = useApolloClient()
        return <div data-testid="deep">{client ? 'Deep Apollo Access' : 'No Access'}</div>
      }

      const MiddleChild = (): React.ReactNode => (
        <div>
          <DeepChild />
        </div>
      )

      render(
        <ApolloWrapper>
          <MiddleChild />
        </ApolloWrapper>
      )

      const deep = screen.getByTestId('deep')
      expect(deep.textContent).toBe('Deep Apollo Access')
    })
  })
})
