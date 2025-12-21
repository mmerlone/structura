'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { useDatadogUser } from '@/components/providers/DatadogProvider'
import type { AuthContextType } from '@/types/auth.types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const auth = useAuth()
  const { setUserContext, clearUserContext } = useDatadogUser()

  // Update Datadog user context when auth state changes
  useEffect(() => {
    if (auth.authUser) {
      // Set user context in Datadog when user is authenticated
      setUserContext({
        id: auth.authUser.id,
        email: auth.authUser.email || undefined,
        // Add any other user properties you want to track
        provider: auth.authUser.app_metadata?.provider,
        created_at: auth.authUser.created_at,
      })
    } else {
      // Clear user context when user signs out
      clearUserContext()
    }
  }, [auth.authUser, setUserContext, clearUserContext])

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
