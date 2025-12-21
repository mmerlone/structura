/**
 * Next.js Middleware
 *
 * Applies security headers and session management to all requests.
 * Uses centralized security configuration from @/config/security.ts
 */

import { NextRequest, NextResponse } from 'next/server'

import { applySecurityHeaders } from '@/lib/security/headers'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Create initial response
  let response = NextResponse.next()

  // Apply security headers to all responses
  response = applySecurityHeaders(response, {
    generateNonce: true,
    strictCSP: process.env.NODE_ENV === 'production',
  })

  // Update Supabase session
  response = await updateSession(request, response)

  return response
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
