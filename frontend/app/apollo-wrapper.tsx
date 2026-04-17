'use client'

import { ApolloProvider } from '@apollo/client/react'
import { makeClient } from '@/lib/apollo-client'
import { useSSEEvents } from '@/lib/use-sse-events'

function SSEInitializer() {
  useSSEEvents()
  return null
}

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const client = makeClient()
  
  return (
    <ApolloProvider client={client}>
      <SSEInitializer />
      {children}
    </ApolloProvider>
  )
}
