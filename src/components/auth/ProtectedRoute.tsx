'use client'

import React, { useEffect } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/components/providers'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactElement
  /**
   * If true, will redirect to login when not authenticated
   * @default true
   */
  redirectUnauthenticated?: boolean
  /**
   * Path to redirect to when not authenticated
   * @default "/auth"
   */
  loginPath?: string
}

export function ProtectedRoute({
  children,
  fallback,
  redirectUnauthenticated = true,
  loginPath = '/auth',
}: ProtectedRouteProps): JSX.Element {
  const { authUser, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !authUser && redirectUnauthenticated) {
      router.push(loginPath)
    }
  }, [authUser, isLoading, router, redirectUnauthenticated, loginPath])

  if (isLoading || (redirectUnauthenticated && !authUser)) {
    return (
      fallback || (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      )
    )
  }

  return <>{children}</>
}
