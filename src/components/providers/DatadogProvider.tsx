/**
 * Datadog Provider Component
 *
 * Initializes Datadog RUM and provides context for the application.
 * Follows the same pattern as other providers in the project.
 */

'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { initializeDatadog, setDatadogUser, clearDatadogUser, addDatadogGlobalContext } from '@/lib/datadog/client'
import type { DatadogUserContext } from '@/lib/datadog/datadog.types'

interface DatadogContextValue {
  isInitialized: boolean
  setUser: (user: DatadogUserContext) => void
  clearUser: () => void
  addGlobalContext: (context: Record<string, string | number | boolean>) => void
}

const DatadogContext = createContext<DatadogContextValue | null>(null)

interface DatadogProviderProps {
  children: ReactNode
}

export function DatadogProvider({ children }: DatadogProviderProps): JSX.Element {
  const [isInitialized] = useState(() => {
    // Initialize Datadog during state initialization
    const initialized = initializeDatadog()

    // Add global context for the application
    if (initialized) {
      addDatadogGlobalContext({
        framework: 'Next.js',
        ui_library: 'Material-UI',
        database: 'Supabase',
      })
    }

    return initialized
  })

  const contextValue: DatadogContextValue = {
    isInitialized,
    setUser: setDatadogUser,
    clearUser: clearDatadogUser,
    addGlobalContext: addDatadogGlobalContext,
  }

  return <DatadogContext.Provider value={contextValue}>{children}</DatadogContext.Provider>
}

/**
 * Hook to use Datadog context
 */
export function useDatadog(): DatadogContextValue {
  const context = useContext(DatadogContext)

  if (!context) {
    throw new Error('useDatadog must be used within a DatadogProvider')
  }

  return context
}

/**
 * Hook to set user context when user authenticates
 */
export function useDatadogUser() {
  const { setUser, clearUser, isInitialized } = useDatadog()

  const setUserContext = (user: DatadogUserContext) => {
    if (isInitialized) {
      setUser(user)
    }
  }

  const clearUserContext = () => {
    if (isInitialized) {
      clearUser()
    }
  }

  return { setUserContext, clearUserContext }
}
