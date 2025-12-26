import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { handleApiError, withApiErrorHandler } from '@/lib/error/server'
import { applySecurityHeaders } from '@/lib/security/headers'
import { logSecurityEvent, extractSecurityContext } from '@/lib/security/audit'
import { withRateLimit } from '@/lib/security/rate-limit'
import { createClient } from '@/lib/supabase/server'

export const GET = withRateLimit('emailVerification', withApiErrorHandler(async (request: NextRequest): Promise<NextResponse> => {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') || '/profile'

  // Enhanced logging for verification attempt using centralized security audit
  const securityContext = extractSecurityContext(request, {
    details: { type, hasToken: !!token_hash },
  })

  logSecurityEvent('email_verification', securityContext, 'Email verification attempt')

  // Create redirect link without the secret token
  const redirectTo = new URL(next, origin)
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = await createClient()

    try {
      const { error, data } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      if (!error) {
        // Log successful verification using centralized security audit
        logSecurityEvent(
          'email_verification',
          extractSecurityContext(request, {
            userId: data.user?.id,
            details: { type, success: true },
          }),
          'Email verification successful'
        )

        // Successful verification
        redirectTo.searchParams.set('verified', 'true')
        return applySecurityHeaders(NextResponse.redirect(redirectTo))
      }

      // Log verification failure using centralized security audit
      logSecurityEvent(
        'authentication_failure',
        extractSecurityContext(request, {
          details: { type, error: error.message, reason: 'email_verification_failed' },
          severity: 'medium',
        }),
        'Email verification failed'
      )

      // Handle verification error with structured logging
      return handleApiError(error, request, {
        operation: 'email-verification',
        tokenHashPresent: true,
        type,
      })
    } catch (error) {
      // Log error using centralized security audit
      logSecurityEvent(
        'suspicious_activity',
        extractSecurityContext(request, {
          details: {
            type,
            error: error instanceof Error ? error.message : 'Unknown error',
            reason: 'email_verification_error',
          },
          severity: 'high',
        }),
        'Email verification error'
      )
      throw error // Let withApiErrorHandler handle it
    }
  }

  // Log missing or invalid parameters using centralized security audit
  logSecurityEvent(
    'suspicious_activity',
    extractSecurityContext(request, {
      details: {
        hasToken: !!token_hash,
        hasType: !!type,
        reason: 'invalid_verification_request',
      },
      severity: 'medium',
    }),
    'Invalid verification request'
  )

  // Return to error page with instructions
  const errorUrl = new URL('/auth/auth-code-error', origin)
  errorUrl.searchParams.set('code', 'invalid_verification_link')
  return applySecurityHeaders(NextResponse.redirect(errorUrl))
}))
