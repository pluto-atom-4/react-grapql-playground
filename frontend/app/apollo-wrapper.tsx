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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return
  const client = useMemo(() => makeClient(), [])

  return (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    <ApolloProvider client={client}>
      <SSEInitializer />
      {children}
    </ApolloProvider>
  )
}
