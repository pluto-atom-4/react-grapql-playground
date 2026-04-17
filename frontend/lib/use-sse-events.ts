/**
 * useSSEEvents: Client-side hook for real-time SSE event listening
 *
 * Pattern:
 * - Opens EventSource connection to Express /events endpoint
 * - Listens for real-time events (buildCreated, buildStatusChanged, testRunSubmitted)
 * - Updates Apollo Client cache via cache eviction/modification
 * - Handles automatic reconnection on disconnect
 */

'use client'

import { useApolloClient } from '@apollo/client/react'
import { useEffect, useRef } from 'react'

export function useSSEEvents() {
  const client = useApolloClient()
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const expressUrl = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'
    const eventsUrl = `${expressUrl}/events`

    try {
      const eventSource = new EventSource(eventsUrl, { withCredentials: true })

      eventSource.addEventListener('buildCreated', () => {
        client.cache.evict({ fieldName: 'builds' })
        client.cache.gc()
      })

      eventSource.addEventListener('buildStatusChanged', () => {
        client.cache.evict({ fieldName: 'build' })
        client.cache.gc()
      })

      eventSource.addEventListener('testRunSubmitted', () => {
        client.cache.evict({ fieldName: 'testRuns' })
        client.cache.gc()
      })

      eventSource.addEventListener('error', () => {
        console.warn('SSE disconnected, will reconnect...')
        eventSource.close()
      })

      eventSourceRef.current = eventSource
    } catch (error) {
      console.error('Failed to connect to SSE:', error)
    }

    return () => {
      eventSourceRef.current?.close()
    }
  }, [client])
}
