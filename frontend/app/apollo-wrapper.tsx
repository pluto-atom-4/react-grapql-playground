'use client'

import { useMemo } from 'react'
import { ApolloProvider } from '@apollo/client/react'
import { makeClient } from '@/lib/apollo-client'
import { useSSEEvents } from '@/lib/use-sse-events'

function SSEInitializer() {
  useSSEEvents()
  return null
}

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => makeClient(), [])

  return (
    <ApolloProvider client={client}>
      <SSEInitializer />
      {children}
    </ApolloProvider>
  )
}
