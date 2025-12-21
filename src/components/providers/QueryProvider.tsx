'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type React from 'react'
import { useState } from 'react'

interface ErrorWithStatus {
  status: number
  [key: string]: unknown
}

function isErrorWithStatus(error: unknown): error is ErrorWithStatus {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as ErrorWithStatus).status === 'number'
  )
}

export function QueryProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 10 * 60 * 1000, // gcTime instead of cacheTime in v5
            retry: (failureCount: number, error: unknown): boolean => {
              if (isErrorWithStatus(error)) {
                if (error.status >= 400 && error.status < 500) {
                  return false
                }
              }
              return failureCount < 3
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
