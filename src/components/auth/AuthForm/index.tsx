'use client'

import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography, useTheme } from '@mui/material'
import { motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { FormProvider } from 'react-hook-form'

import { PasswordMeter } from '../PasswordMeter'

import { AuthFormFields } from './AuthFormFields'
import { AuthOperationSelector } from './AuthOperationSelector'
import { authFormDefaults } from './config/authFormDefaults'
import { uiText } from './config/uiText'
import { LoginButtons } from './LoginButtons'

import { useAuthContext } from '@/components/providers/AuthProvider'
import { useAuthForm } from '@/hooks/useAuthForm'
import { signInWithEmail, signUpWithEmail, requestPasswordReset, updateUserPassword } from '@/lib/auth/actions/server'
import { handleClientError as handleError } from '@/lib/error'
import type { AppError } from '@/types/error.types'
import {
  LoginFormInput,
  RegisterFormInput,
  ResetPasswordEmailFormInput,
  ResetPasswordPassFormInput,
  UpdatePasswordFormInput,
} from '@/types/auth.types'
import { AuthOperationsEnum } from '@/types/enums'

interface AuthFormProps {
  initialOperation?: AuthOperationsEnum
}

export default function AuthForm({ initialOperation = AuthOperationsEnum.LOGIN }: AuthFormProps): JSX.Element {
  const [operation, setOperation] = useState<AuthOperationsEnum>(initialOperation)
  const [error, setError] = useState<AppError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const searchParams = useSearchParams()
  const formMethods = useAuthForm(operation)
  const { reset } = formMethods
  // We only need updatePassword (for recovery), and clearError from context now
  // other operations are handled by server actions
  const { updatePassword, clearError } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    const checkSignOutReason = (): void => {
      const signOutReason = document.cookie
        .split('; ')
        .find((row) => row.startsWith('signout-reason='))
        ?.split('=')[1]

      switch (signOutReason) {
        case 'user-not-found': {
          const userNotFoundError = handleError(new Error('User not found'), {
            operation: 'authCheck',
            originalError: new Error(`Sign out reason: ${signOutReason}`),
          })
          setError(userNotFoundError)

          // Remove the cookie
          document.cookie = 'signout-reason=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          break
        }
      }
    }
    checkSignOutReason()
  }, [])

  // Handle operation changes and form reset
  useEffect((): void => {
    const op = searchParams.get('op')?.toLowerCase() ?? null
    const newOperation = ((): AuthOperationsEnum => {
      switch (op) {
        case AuthOperationsEnum.LOGIN:
          return AuthOperationsEnum.LOGIN
        case AuthOperationsEnum.REGISTER:
          return AuthOperationsEnum.REGISTER
        case AuthOperationsEnum.FORGOT_PASSWORD:
          return AuthOperationsEnum.FORGOT_PASSWORD
        case AuthOperationsEnum.RESET_PASSWORD:
          return AuthOperationsEnum.RESET_PASSWORD
        case AuthOperationsEnum.UPDATE_PASSWORD:
          return AuthOperationsEnum.UPDATE_PASSWORD
        default:
          return AuthOperationsEnum.LOGIN
      }
    })()

    if (newOperation !== operation) {
      setOperation(newOperation)
      const newConfig = authFormDefaults[newOperation]
      reset(newConfig)
      setError(null)
      setEmailSent(false)
    }
  }, [searchParams, operation, reset])

  const handleOperationChange = useCallback(
    (newOperation: AuthOperationsEnum): void => {
      // Update the URL using Next.js router so useSearchParams reacts
      const url = new URL(window.location.href)
      url.searchParams.set('op', newOperation)
      router.replace(`${url.pathname}${url.search}${url.hash}`)
    },
    [router]
  )

  const getErrorMessage = (error: AppError): string => {
    switch (error.code) {
      case 'AUTH/INVALID_CREDENTIALS':
        return 'Invalid email or password. Please check your credentials and try again.'
      case 'AUTH/EMAIL_ALREADY_IN_USE':
        return 'This email is already registered. Please sign in instead.'
      default:
        return error.message
    }
  }

  const handleFormSubmit = async (
    data:
      | LoginFormInput
      | RegisterFormInput
      | ResetPasswordEmailFormInput
      | ResetPasswordPassFormInput
      | UpdatePasswordFormInput
  ): Promise<void> => {
    try {
      setIsLoading(true)
      setIsRedirecting(false)
      setError(null)
      clearError() // Clear any auth context errors

      switch (operation) {
        case AuthOperationsEnum.LOGIN: {
          const { email, password } = data as LoginFormInput
          const result = await signInWithEmail({ email, password })

          if (!result.success) {
            // Extract error message from AppError or use fallback
            const errorMessage =
              typeof result.error === 'string' ? result.error : result.error?.message || 'Login failed'

            const errorCode = errorMessage.includes('Invalid email') ? 'AUTH/INVALID_CREDENTIALS' : 'AUTH/UNKNOWN'

            const appError = handleError(new Error(errorMessage), {
              operation: 'login',
              code: errorCode,
            })

            if (result.error) {
              // Since we can't mutate appError.message (it's likely readonly on Error too? No, Error.message is usually mutable in JS but AppError interface might define it readonly.
              // Actually AppError extends Error. In TS Error.message is string.
              // But looking at AppError definition path...
              // Safest to just rely on the error passed to handleError constructor if possible, OR
              // handleError logic. Providing message in options if supported?
              // handleError(error, context).
              // We passed new Error(result.error) so message should be set correctly.
            }

            setError(appError)
            return
          }
          setIsRedirecting(true)
          router.push('/profile')
          break
        }
        case AuthOperationsEnum.REGISTER: {
          const { email, password, name, acceptTerms } = data as RegisterFormInput
          const result = await signUpWithEmail({ email, password, name, confirmPassword: password, acceptTerms })

          if (!result.success) {
            let errorCode = 'AUTH/UNKNOWN'
            let errorContext = {}

            // Extract error message from AppError or use fallback
            const errorMessage =
              typeof result.error === 'string' ? result.error : result.error?.message || 'Registration failed'

            // Check for "already registered" based on message content
            if (
              errorMessage.toLowerCase().includes('already registered') ||
              errorMessage.toLowerCase().includes('already in use')
            ) {
              errorCode = 'AUTH/EMAIL_ALREADY_IN_USE'
              errorContext = { shouldSwitchToLogin: true }
            }

            const appError = handleError(new Error(errorMessage), {
              operation: 'signup',
              code: errorCode,
              ...errorContext,
            })

            // Check if error suggests switching to login (e.g., user already exists)
            // accessing strongly typed context if possible
            // We know context structure from AppError definition, but TS might not infer strict union narrowing easily here
            if (appError.context && 'shouldSwitchToLogin' in appError.context && appError.context.shouldSwitchToLogin) {
              // Switch to login mode using existing operation change handler
              handleOperationChange(AuthOperationsEnum.LOGIN)
              return
            }
            setError(appError)
            return
          }

          // New server actions don't return redirectTo, so handle redirect manually
          setIsRedirecting(true)
          router.push('/auth/confirm')
          break
        }
        case AuthOperationsEnum.FORGOT_PASSWORD: {
          const { email } = data as ResetPasswordEmailFormInput
          const result = await requestPasswordReset({ email })

          if (!result.success) {
            // Extract error message from AppError or use fallback
            const errorMessage =
              typeof result.error === 'string' ? result.error : result.error?.message || 'Password reset failed'

            const appError = handleError(new Error(errorMessage), { operation: 'resetPassword' })
            setError(appError)
            return
          }
          setEmailSent(true)
          break
        }
        case AuthOperationsEnum.RESET_PASSWORD: {
          // This case usually happens when user clicks email link and lands on page with token
          // The form collects new password.
          // Server action 'updatePassword' takes 'currentPassword', 'newPassword', 'confirmPassword'
          // BUT ResetPasswordPassFormInput usually only has 'password' and 'confirmPassword'.
          // The 'updatePassword' action in actions.ts seems designed for LOGGED IN users changing password (requires currentPassword).
          // For Reset Password (recovery), Supabase usually handles it via `supabase.auth.updateUser` AFTER verifying the token hash on the server.
          // Wait, `actions.ts` `updatePassword` implementation:
          // 1. getUser() 2. signIn() 3. updatePassword().
          // This is definitely for "Change Password".
          // It is NOT for "Reset Password" (recovery flow).
          // The recovery flow usually involves the user being signed in implicitly by the link (exchange code for session)
          // and then just calling updateUser.
          // If the user lands on /auth/reset-password, allow them to set new password.

          // Current client code: `await updatePassword(password)` from context.
          // Context `updatePassword`: calling `authService.updatePassword(newPassword)`.
          // AuthService `updatePassword`: `supabase.auth.updateUser({ password })`.

          // The Server Action `updatePassword` requires `currentPassword`.
          // This means the existing Server Action is NOT suitable for the Reset Password flow (recovery).
          // We need a separate `completePasswordReset` action or similar that doesn't ask for current password.
          // However, `updateUser` is secure because the user holds the session via the recovery link.

          // I should stick to client-side for this specific operation OR create a new action.
          // Since I'm refactoring, I'll stick to client-side for RESET_PASSWORD for now to avoid breakage,
          // OR I need to modify `actions.ts` to allow update without current password (if user is recovering).
          // But `actions.ts` explicitly checks current password.

          // FOR NOW: I will revert to using `useAuthContext`'s `updatePassword` for this specific case?
          // "The existing src/lib/auth/actions.ts file is currently unused".
          // Using the client context for RESET_PASSWORD is likely safer than breaking it with the wrong server action.

          // I will add `updatePassword` back to the destructured context for this case.
          const { password } = data as ResetPasswordPassFormInput
          // Using context function for recovery flow
          const { error } = await updatePassword(password)
          if (error) {
            setError(error)
            return
          }
          setIsRedirecting(true)
          router.push('/profile')
          break
        }
        case AuthOperationsEnum.UPDATE_PASSWORD: {
          const { currentPassword, newPassword, confirmPassword } = data as UpdatePasswordFormInput
          const result = await updateUserPassword({ currentPassword, newPassword, confirmPassword })

          if (!result.success) {
            // Extract error message from AppError or use fallback
            const errorMessage =
              typeof result.error === 'string' ? result.error : result.error?.message || 'Password update failed'

            const appError = handleError(new Error(errorMessage), { operation: 'updatePassword' })
            setError(appError)
            return
          }
          setIsRedirecting(true)
          router.push('/profile')
          break
        }
      }
    } catch (error) {
      // Handle any unexpected errors with structured error handling
      const unexpectedError = handleError(error, {
        operation,
        originalError: error,
      })
      setError(unexpectedError)
    } finally {
      setIsLoading(false)
    }
  }

  const theme = useTheme()

  if (emailSent) {
    return (
      <Paper
        elevation={3}
        sx={{
          maxWidth: 600,
          mx: 'auto',
          p: 4,
          textAlign: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: theme.shadows[4],
        }}>
        <Typography variant="h6" component="h2" gutterBottom color="text.primary">
          Check your email
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          We&apos;ve sent you a password reset link. Please check your email.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => {
            setEmailSent(false)
            handleOperationChange(AuthOperationsEnum.LOGIN)
          }}
          sx={{ mt: 2 }}>
          Back to Login
        </Button>
      </Paper>
    )
  }

  return (
    <Paper
      elevation={3}
      sx={{
        width: '100%',
        mx: 'auto',
        p: 4,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: theme.shadows[4],
      }}>
      <Typography variant="h5" component="h1" align="center" gutterBottom color="text.primary" sx={{ fontWeight: 600 }}>
        {uiText.titles[operation]}
      </Typography>
      {error && (
        <Alert
          severity="error"
          action={
            <Button
              size="small"
              color="inherit"
              onClick={() => {
                setError(null)
                clearError()
              }}
              sx={{ textTransform: 'none' }}>
              Dismiss
            </Button>
          }
          sx={{
            mt: 1,
            '& .MuiAlert-message': {
              width: '100%',
              textAlign: 'left',
            },
          }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {getErrorMessage(error)}
            </Typography>
          </Box>
        </Alert>
      )}

      {operation !== AuthOperationsEnum.RESET_PASSWORD && operation !== AuthOperationsEnum.UPDATE_PASSWORD && (
        <Box sx={{ mb: 3, mt: 2 }}>
          <AuthOperationSelector
            currentOperation={operation}
            onOperationChange={handleOperationChange}
            disabled={isLoading}
          />
        </Box>
      )}

      {operation === AuthOperationsEnum.UPDATE_PASSWORD && (
        <Box sx={{ mb: 2, mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="text"
            size="small"
            onClick={() => handleOperationChange(AuthOperationsEnum.LOGIN)}
            disabled={isLoading}
            sx={{ textTransform: 'none' }}>
            Back to login
          </Button>
        </Box>
      )}

      <FormProvider {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(handleFormSubmit)}>
          <Stack direction="row" spacing={4} justifyContent="space-between" alignItems="center" mb={2}>
            <Stack
              spacing={3}
              component={motion.div}
              layout
              sx={{ flex: 1, minWidth: 0 }}
              transition={{ layout: { duration: 0.28, ease: [0.2, 0, 0.2, 1] } }}>
              <AuthFormFields operation={operation} isLoading={isLoading} />

              {operation !== AuthOperationsEnum.FORGOT_PASSWORD && operation !== AuthOperationsEnum.LOGIN && (
                <motion.div layout>
                  {operation === AuthOperationsEnum.UPDATE_PASSWORD ? (
                    <PasswordMeter
                      password={formMethods.watch('newPassword')}
                      confirmPassword={formMethods.watch('confirmPassword')}
                    />
                  ) : (
                    <PasswordMeter
                      password={formMethods.watch('password')}
                      confirmPassword={formMethods.watch('confirmPassword')}
                    />
                  )}
                </motion.div>
              )}

              {(operation === AuthOperationsEnum.LOGIN || operation === AuthOperationsEnum.REGISTER) && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => handleOperationChange(AuthOperationsEnum.FORGOT_PASSWORD)}
                    disabled={isLoading}
                    sx={{ textTransform: 'none' }}>
                    Forgot password
                  </Button>
                </Box>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={!formMethods.formState.isValid || isLoading || isRedirecting}
                sx={{ mt: 2, mb: 2 }}>
                {isLoading || isRedirecting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  uiText.buttons[operation]
                )}
              </Button>
            </Stack>
            {(operation === AuthOperationsEnum.LOGIN || operation === AuthOperationsEnum.REGISTER) && (
              <>
                <Paper
                  sx={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '16px',
                  }}>
                  <Stack sx={{ width: '100%' }}>
                    <Typography
                      variant="h6"
                      component="h1"
                      align="center"
                      gutterBottom
                      color="text.primary"
                      sx={{ fontWeight: 600 }}>
                      OR
                    </Typography>
                    <LoginButtons disabled={isLoading} />
                  </Stack>
                </Paper>
              </>
            )}
          </Stack>
        </form>
      </FormProvider>
    </Paper>
  )
}
