'use client'

import { useMemo } from 'react'
import type { ReactNode, ReactElement } from 'react'
import { ApolloProvider } from '@apollo/client/react'
import { makeClient } from '@/lib/apollo-client'
import { useSSEEvents } from '@/lib/use-sse-events'

function SSEInitializer(): ReactElement | null {
  useSSEEvents()
  return null
}

export function ApolloWrapper({ children }: { children: ReactNode }): ReactElement {
  const client = useMemo(() => makeClient(), [])

  return (
    <ApolloProvider client={client}>
      <SSEInitializer />
      {children}
    </ApolloProvider>
  )
}
