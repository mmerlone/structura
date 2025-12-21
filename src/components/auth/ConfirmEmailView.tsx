'use client'

import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material'
import type { EmailOtpType } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export function ConfirmEmailView(): JSX.Element {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')

  // Check for missing tokens
  const token_hash = searchParams && searchParams.get('token_hash')
  const type = searchParams && (searchParams.get('type') as EmailOtpType | null)
  const hasInvalidToken = !token_hash || !type

  useEffect(() => {
    const token_hash = searchParams && searchParams.get('token_hash')
    const type = searchParams && (searchParams.get('type') as EmailOtpType | null)

    if (!token_hash || !type) {
      return
    }

    const verify = async (): Promise<void> => {
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type,
        })
        if (error) {
          setStatus('error')
          setMessage(error.message || 'Failed to confirm email.')
        } else {
          setStatus('success')
          setMessage('Email confirmed! You can now log in.')
        }
      } catch {
        setStatus('error')
        setMessage('Unexpected error during confirmation.')
      }
    }
    verify()
  }, [searchParams])

  return (
    <Paper sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 8, textAlign: 'center' }}>
      <Typography variant="h5" gutterBottom>
        Email Confirmation
      </Typography>
      {hasInvalidToken ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Invalid or missing confirmation token.
        </Alert>
      ) : (
        <>
          {status === 'loading' && (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <CircularProgress />
              <Typography>Confirming your email...</Typography>
            </Box>
          )}
          {status !== 'loading' && (
            <Alert severity={status} sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}
          {status === 'success' && (
            <Button variant="contained" color="primary" onClick={() => router.push('/auth')}>
              Go to Login
            </Button>
          )}
        </>
      )}
    </Paper>
  )
}
