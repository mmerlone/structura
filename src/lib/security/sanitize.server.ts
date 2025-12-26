/**
 * Server-side Input Sanitization Utilities
 *
 * Server-only sanitization functions that require Node.js dependencies.
 * This file should only be imported in server-side code.
 */

import { JSDOM } from 'jsdom'
import createDOMPurify from 'dompurify'
import { buildLogger } from '@/lib/logger/server'
import type { HtmlSanitizeOptions, SanitizationReport } from '@/types/security.types'

const logger = buildLogger('security-sanitize-server')

/**
 * Sanitize HTML content to prevent XSS attacks
 * SERVER-ONLY: Requires jsdom which is not available in the browser
 */
export function sanitizeHtml(input: string, options: HtmlSanitizeOptions = {}): string {
  try {
    const {
      allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      allowedAttributes = ['href', 'title'],
      stripTags = false,
      allowLinks = false,
    } = options

    if (stripTags) {
      // Strip all HTML tags
      return input.replace(/<[^>]*>/g, '')
    }

    // Create DOMPurify instance for server-side use
    const window = new JSDOM('').window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DOMPurify = createDOMPurify(window as any)

    const config = {
      ALLOWED_TAGS: allowLinks ? [...allowedTags, 'a'] : allowedTags,
      ALLOWED_ATTR: allowedAttributes,
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_TRUSTED_TYPE: false,
    }

    const sanitized = DOMPurify.sanitize(input, config) || ''

    logger.debug(
      {
        inputLength: input.length,
        outputLength: sanitized.length,
        allowedTags: allowedTags.length,
        stripped: input.length !== sanitized.length,
      },
      'HTML sanitized'
    )

    return sanitized
  } catch (error) {
    logger.error({ error, inputLength: input.length }, 'Error sanitizing HTML')
    // Return empty string on error for security
    return ''
  }
}

/**
 * Create a sanitization report for debugging
 */
export function createSanitizationReport(
  input: string,
  output: string,
  type: 'html' | 'text' | 'filename' | 'url'
): SanitizationReport {
  const securityIssuesFound: string[] = []

  // Check for common security issues in input
  if (input.includes('<script')) {
    securityIssuesFound.push('Script tag detected')
  }
  if (input.includes('javascript:')) {
    securityIssuesFound.push('JavaScript protocol detected')
  }
  if (input.includes('data:')) {
    securityIssuesFound.push('Data URL detected')
  }
  if (input.includes('../')) {
    securityIssuesFound.push('Path traversal attempt detected')
  }
  if (input.includes('<?php')) {
    securityIssuesFound.push('PHP code detected')
  }

  return {
    inputLength: input.length,
    outputLength: output.length,
    changed: input !== output,
    type,
    securityIssuesFound,
  }
}
