'use client'

import { Alert, Button, CircularProgress, Snackbar } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'

import { SITE_CONFIG } from '@/config/site'
import { logger } from '@/lib/logger/client'
import { createClient } from '@/lib/supabase/client'

type VerificationStatusProps = {
  userId: string
  email: string
}

type Status = 'idle' | 'checking' | 'unverified' | 'verified'

export function VerificationStatus({ userId, email }: VerificationStatusProps): JSX.Element | null {
  const [status, setStatus] = useState<Status>('checking')
  const [isLoading, setIsLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const checkVerification = useCallback(async (): Promise<void> => {
    setStatus('checking')
    try {
      const supabase = createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) throw error

      if (user?.email_confirmed_at) {
        setStatus('verified')
      } else {
        setStatus('unverified')
      }
    } catch (error) {
      logger.error({ error, userId }, 'Error checking verification status')
      setStatus('unverified')
    }
  }, [userId])

  const handleResendVerification = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${SITE_CONFIG.url}/auth/confirm`,
        },
      })

      if (error) {
        logger.error({ error, email }, 'Failed to resend verification email')
        throw error
      }

      setSnackbar({
        open: true,
        message: 'Verification email sent. Please check your inbox.',
        severity: 'success',
      })
    } catch (error) {
      logger.error({ error, email }, 'Error resending verification email')
      setSnackbar({
        open: true,
        message: 'Failed to send verification email. Please try again.',
        severity: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }, [email])

  useEffect(() => {
    checkVerification()
    // Check verification status every 30 seconds
    const interval = setInterval(checkVerification, 30000)
    return (): void => clearInterval(interval)
  }, [checkVerification, userId])

  // Don't show anything if email is verified
  if (status === 'verified') {
    return null
  }

  // Show loading state while checking verification status
  if (status === 'checking') {
    return (
      <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mb: 2 }}>
        Verifying your email status...
      </Alert>
    )
  }

  // Show verification banner for unverified/idle states
  return (
    <>
      <Alert
        severity="warning"
        action={
          <Button color="inherit" size="small" onClick={handleResendVerification} disabled={isLoading}>
            {isLoading ? <CircularProgress size={20} /> : 'Resend Email'}
          </Button>
        }
        sx={{ mb: 2 }}>
        Please verify your email address to access all features.
      </Alert>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  )
}
