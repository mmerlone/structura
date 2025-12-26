'use client'

import type { AuthUser, Session } from '@supabase/supabase-js'
import { serialize } from 'cookie'
import { useCallback, useEffect, useState } from 'react'

import { AuthContextType } from '../types'

import { authService } from '@/lib/auth/actions/client'
import { handleClientError as handleError, AuthErrorTypeEnum, isAppError } from '@/lib/error'
import { logger } from '@/lib/logger/client'
import type { AppError } from '@/types/error.types'
import { AuthProvidersEnum, SignOutReasonEnum } from '@/types/enums'
import type { SignOutReason } from '@/types/auth.types'

/**
 * Authentication hook that provides comprehensive auth state management and operations.
 *
 * This hook handles authentication state, user sessions, and provides methods for
 * all authentication operations including sign in, sign up, password management, and
 * session handling. It integrates with the centralized error handling system and
 * provides structured error information.
 *
 * @returns {AuthContextType} Authentication context containing:
 * - `authUser`: Current authenticated user or null
 * - `session`: Current session or null
 * - `isLoading`: Loading state for auth operations
 * - `error`: Structured error information or null
 * - `signIn`: Sign in with email and password
 * - `signInWithProvider`: Sign in with OAuth provider
 * - `signUpWithEmail`: Sign up with email and password
 * - `resetPassword`: Send password reset email
 * - `updatePassword`: Update user password
 * - `signOut`: Sign out current user (optional reason parameter)
 * - `refreshSession`: Refresh current session
 * - `hasRole`: Check user role (placeholder for RBAC)
 * - `isCurrentUser`: Check if user ID matches current user
 * - `clearError`: Clear current error state
 * - `getErrorForDisplay`: Get user-friendly error information
 * - `getErrorCode`: Get current error code
 * - `isAuthError`: Check if error is auth-related
 * - `isValidationError`: Check if error is validation-related
 * - `isNetworkError`: Check if error is network-related
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { signIn, isLoading, error } = useAuth();
 *
 *   const handleSubmit = async (email: string, password: string) => {
 *     const result = await signIn(email, password);
 *     if (result.error) {
 *       console.error('Sign in failed:', result.error.message);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={(e) => handleSubmit(/ * form data * /)}>
 *       {/* Form fields * /}
 *       {error && <div>{error.message}</div>}
 *       <button disabled={isLoading}>Sign In</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { authUser, signOut, isCurrentUser } = useAuth();
 *
 *   if (!authUser) return <div>Please sign in</div>;
 *
 *   return (
 *     <div>
 *       <h1>Welcome {authUser.email}</h1>
 *       <button onClick={() => signOut()}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAuth = (): AuthContextType => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)

  // Handle auth state changes
  useEffect(() => {
    let isMounted = true

    const checkSession = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const session = await authService.getSession()

        if (!isMounted) return

        if (session?.user) {
          const authUser = await authService.getUser()

          if (!authUser) {
            logger.warn({ userId: session.user?.id }, 'User not found in database, signing out')
            await authService.signOut(SignOutReasonEnum.USER_NOT_FOUND)
            if (isMounted) {
              setSession(null)
              setAuthUser(null)
            }
            document.cookie = serialize('signout-reason', 'user-not-found', {
              path: '/',
              maxAge: 5,
              sameSite: 'strict',
            })
            return
          }
        }

        if (isMounted && session !== null && session !== undefined) {
          setSession(session)
          setAuthUser(session?.user ?? null)

          const user = session?.user
          logger.info(
            {
              hasSession: true,
              hasUser: user !== null && user !== undefined,
              provider: user?.app_metadata?.provider,
            },
            'Session check completed'
          )
        }
      } catch (error) {
        // Enhanced error handling for refresh token scenarios
        const isRefreshTokenError =
          error instanceof Error &&
          (error.message.includes('refresh_token') ||
            error.message.includes('Refresh Token') ||
            error.message.includes('Invalid Refresh Token'))

        if (isRefreshTokenError) {
          logger.warn(
            {
              error: error instanceof Error ? error.stack : error,
              authErrorType: AuthErrorTypeEnum.REFRESH_TOKEN,
              timestamp: new Date().toISOString(),
            },
            'Refresh token error detected in useAuth'
          )

          // For refresh token errors, clear auth state and let user sign in again
          if (isMounted) {
            setSession(null)
            setAuthUser(null)
            setError(null) // Don't show error for refresh token issues
          }
        } else {
          const appError = handleError(error, {
            operation: 'checkSession',
            hook: 'useAuth',
            authErrorType: isRefreshTokenError ? AuthErrorTypeEnum.REFRESH_TOKEN : undefined,
          } as const)
          if (isMounted) {
            setError(appError)
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    const unsubscribe = authService.onAuthStateChange((event: string, session: Session | null): void => {
      logger.debug({ event }, 'Auth state changed')
      if (isMounted) {
        setSession(session)
        setAuthUser(session?.user ?? null)
        setIsLoading(false)
      }
    })

    checkSession()

    return (): void => {
      isMounted = false
      unsubscribe()
    }
  }, []) // Remove session dependency to prevent infinite loop

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string): Promise<{ error: AppError | null }> => {
    try {
      setIsLoading(true)
      setError(null) // Clear previous errors

      const response = await authService.signIn({ email, password })

      // Handle structured error responses
      if (response?.error) {
        let appError: AppError

        if (isAppError(response.error)) {
          // Already a structured error
          appError = response.error as AppError
        } else {
          // Convert regular Error to AppError
          appError = handleError(response.error, {
            operation: 'signIn',
            email,
            hook: 'useAuth',
          })
        }

        return { error: appError }
      }

      return { error: null }
    } catch (error) {
      const appError = handleError(error, {
        operation: 'signIn',
        email,
        unexpected: true,
        hook: 'useAuth',
      })
      return { error: appError }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sign in with OAuth provider
  const signInWithProvider = useCallback(async (provider: AuthProvidersEnum): Promise<{ error: AppError | null }> => {
    try {
      setIsLoading(true)
      setError(null) // Clear previous errors

      const { error } = await authService.signInWithProvider(provider)

      if (error) {
        const appError = handleError(error, {
          operation: 'signInWithProvider',
          provider,
          hook: 'useAuth',
        })
        return { error: appError }
      }

      return { error: null }
    } catch (error) {
      const appError = handleError(error, {
        operation: 'signInWithProvider',
        provider,
        unexpected: true,
        hook: 'useAuth',
      })
      return { error: appError }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sign up with email and password
  const signUpWithEmail = useCallback(
    async (email: string, password: string, options?: { name: string }): Promise<{ error: AppError | null }> => {
      try {
        setIsLoading(true)
        setError(null) // Clear previous errors

        const { error } = await authService.signUpWithEmail(email, password, options || { name: '' })

        if (error) {
          const appError = handleError(error, {
            operation: 'signUpWithEmail',
            email,
            hook: 'useAuth',
          })
          return { error: appError }
        }

        return { error: null }
      } catch (error) {
        const appError = handleError(error, {
          operation: 'signUpWithEmail',
          email,
          unexpected: true,
          hook: 'useAuth',
        })
        return { error: appError }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Reset password
  const resetPassword = useCallback(async (email: string): Promise<{ error: AppError | null }> => {
    try {
      setIsLoading(true)
      setError(null) // Clear previous errors

      const { error } = await authService.resetPassword(email)

      if (error) {
        const appError = handleError(error, {
          operation: 'resetPassword',
          email,
          hook: 'useAuth',
        })
        return { error: appError }
      }

      return { error: null }
    } catch (error) {
      const appError = handleError(error, {
        operation: 'resetPassword',
        email,
        unexpected: true,
        hook: 'useAuth',
      })
      return { error: appError }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update password
  const updatePassword = useCallback(async (newPassword: string): Promise<{ error: AppError | null }> => {
    try {
      setIsLoading(true)
      setError(null) // Clear previous errors

      const { error } = await authService.updatePassword(newPassword)

      if (error) {
        const appError = handleError(error, {
          operation: 'updatePassword',
          hook: 'useAuth',
        })
        return { error: appError }
      }

      return { error: null }
    } catch (error) {
      const appError = handleError(error, {
        operation: 'updatePassword',
        unexpected: true,
        hook: 'useAuth',
      })
      return { error: appError }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sign out
  const signOut = useCallback(async (reason?: SignOutReason): Promise<{ error: AppError | null }> => {
    try {
      setIsLoading(true)
      setError(null) // Clear previous errors

      const { error } = await authService.signOut(reason)

      if (error) {
        const appError = handleError(error, {
          operation: 'signOut',
          hook: 'useAuth',
        })
        return { error: appError }
      }

      return { error: null }
    } catch (error) {
      const appError = handleError(error, {
        operation: 'signOut',
        unexpected: true,
        hook: 'useAuth',
      })
      return { error: appError }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh session
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null) // Clear previous errors

      const session = await authService.getSession()
      setSession(session)
      setAuthUser(session?.user ?? null)
    } catch (error) {
      const appError = handleError(error, {
        operation: 'refreshSession',
        unexpected: true,
        hook: 'useAuth',
      })
      setError(appError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const hasRole = useCallback((role: string): boolean => {
    // Role-based access control is not yet implemented
    // This is a placeholder for future RBAC functionality
    return !!role
  }, [])

  const isCurrentUser = useCallback(
    (userId: string): boolean => {
      return authUser?.id === userId
    },
    [authUser?.id]
  )

  // Error boundary integration utilities
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getErrorForDisplay = useCallback(() => {
    if (!error) return null

    // Return user-friendly error information for UI display
    return {
      message: error.message,
      code: error.code,
      context: error.context,
      isOperational: error.isOperational,
      statusCode: error.statusCode,
    }
  }, [error])

  const getErrorCode = useCallback(() => {
    return error?.code ?? null
  }, [error])

  const isAuthError = useCallback(() => {
    return error?.code?.startsWith('AUTH/') ?? false
  }, [error])

  const isValidationError = useCallback(() => {
    return error?.code?.startsWith('VALIDATION/') ?? false
  }, [error])

  const isNetworkError = useCallback(() => {
    return error?.code?.startsWith('NETWORK/') ?? false
  }, [error])

  return {
    authUser,
    session,
    isLoading,
    error,
    signIn,
    signInWithProvider,
    signUpWithEmail,
    resetPassword,
    updatePassword,
    signOut,
    refreshSession,
    hasRole,
    isCurrentUser,
    clearError,
    getErrorForDisplay,
    getErrorCode,
    isAuthError,
    isValidationError,
    isNetworkError,
  }
}

/**
 * Hook to get the auth service instance directly.
 *
 * Useful for advanced authentication operations that aren't covered by the
 * main useAuth() hook, such as custom authentication flows or direct service access.
 *
 * @returns {typeof authService} The authentication service instance
 *
 * @example
 * ```tsx
 * function CustomAuthComponent() {
 *   const authService = useAuthService();
 *   const [session, setSession] = useState(null);
 *
 *   useEffect(() => {
 *     authService.getSession().then(setSession);
 *   }, [authService]);
 *
 *   return <div>Custom auth logic</div>;
 * }
 * ```
 */
export const useAuthService = (): typeof authService => {
  return authService
}
