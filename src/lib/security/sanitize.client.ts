/**
 * Client-side Input Sanitization Utilities
 *
 * Client-safe sanitization functions that don't require Node.js dependencies.
 * This file can be safely imported in both client and server code.
 */

import { SECURITY_CONFIG } from '@/config/security'
import type {
  InputSanitizeOptions,
  FileValidationOptions,
  FileValidationResult,
  FileMetadata,
} from '@/types/security.types'

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(input: string): string {
  const entityMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  }

  return input.replace(/[&<>"'`=/]/g, (char) => entityMap[char] || char)
}

/**
 * Sanitize general text input
 */
export function sanitizeInput(input: string, options: InputSanitizeOptions = {}): string {
  try {
    const {
      maxLength = SECURITY_CONFIG.validation.strings.maxLength,
      allowHtml = false,
      trimWhitespace = true,
      removeControlChars = true,
    } = options

    let sanitized = input

    // Trim whitespace
    if (trimWhitespace) {
      sanitized = sanitized.trim()
    }

    // Remove control characters (except newlines and tabs)
    if (removeControlChars) {
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    }

    // Handle HTML content - escape since we can't use DOMPurify on client
    if (!allowHtml) {
      sanitized = escapeHtml(sanitized)
    }

    // Enforce length limit
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength)
    }

    return sanitized
  } catch {
    // Return empty string on error for security
    return ''
  }
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  try {
    // Remove path traversal attempts
    let sanitized = filename.replace(/[\/\\:*?"<>|]/g, '_')

    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '')

    // Limit length
    const maxLength = 255
    if (sanitized.length > maxLength) {
      const extension = sanitized.includes('.') ? sanitized.split('.').pop() || '' : ''
      const nameWithoutExt = sanitized.includes('.') ? sanitized.substring(0, sanitized.lastIndexOf('.')) : sanitized
      const maxNameLength = maxLength - extension.length - (extension ? 1 : 0)
      sanitized = nameWithoutExt.substring(0, maxNameLength) + (extension ? '.' + extension : '')
    }

    // Ensure filename is not empty
    if (!sanitized || sanitized === '.') {
      sanitized = 'file'
    }

    // Add timestamp if filename is too generic
    const genericNames = ['file', 'document', 'image', 'upload']
    const baseName = sanitized.toLowerCase().split('.')[0] || ''
    if (genericNames.includes(baseName)) {
      const timestamp = Date.now()
      const extension = sanitized.includes('.') ? '.' + (sanitized.split('.').pop() || '') : ''
      sanitized = `file_${timestamp}${extension}`
    }

    return sanitized
  } catch {
    return `file_${Date.now()}`
  }
}

/**
 * Perform additional security checks on files
 */
function performFileSecurityChecks(file: File): FileValidationResult {
  try {
    // Check for suspicious filenames
    const suspiciousPatterns = [
      /\.php$/i,
      /\.jsp$/i,
      /\.asp$/i,
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i, // Restrict JavaScript files
      /\.html$/i, // Restrict HTML files
      /\.htm$/i,
    ]

    const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(file.name))

    if (isSuspicious) {
      return {
        isValid: false,
        error: 'File type not allowed for security reasons',
      }
    }

    // Check for double extensions
    const parts = file.name.split('.')
    if (parts.length > 2) {
      const secondLastExt = parts[parts.length - 2]?.toLowerCase()
      const dangerousSecondExts = ['php', 'asp', 'jsp', 'exe', 'bat', 'cmd']

      if (secondLastExt && dangerousSecondExts.includes(secondLastExt)) {
        return {
          isValid: false,
          error: 'Double file extensions not allowed',
        }
      }
    }

    // Check filename length
    if (file.name.length > 255) {
      return {
        isValid: false,
        error: 'Filename too long',
      }
    }

    return { isValid: true }
  } catch {
    return {
      isValid: false,
      error: 'Security check failed',
    }
  }
}

/**
 * Validate and sanitize file upload
 */
export function validateAndSanitizeFile(file: File, options: FileValidationOptions = {}): FileValidationResult {
  try {
    const config = SECURITY_CONFIG.validation.files
    const {
      maxSize = config.maxSize,
      allowedTypes = config.allowedTypes,
      allowedExtensions = config.allowedExtensions,
    } = options

    // Extract file information
    const originalName = file.name
    const size = file.size
    const type = file.type
    const extension = originalName.includes('.') ? '.' + originalName.split('.').pop()?.toLowerCase() : ''

    // Validate file size
    if (size > maxSize) {
      return {
        isValid: false,
        error: `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
      }
    }

    // Validate file type
    const isValidType = allowedTypes.some((allowedType) => allowedType === type)
    if (type && !isValidType) {
      return {
        isValid: false,
        error: `File type '${type}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      }
    }

    // Validate file extension
    const isValidExtension = allowedExtensions.some((allowedExt) => allowedExt === extension)
    if (extension && !isValidExtension) {
      return {
        isValid: false,
        error: `File extension '${extension}' is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
      }
    }

    // Sanitize filename
    const sanitizedName = sanitizeFilename(originalName)

    // Additional security checks
    const securityChecks = performFileSecurityChecks(file)
    if (!securityChecks.isValid) {
      return securityChecks
    }

    const metadata: FileMetadata = {
      originalName,
      size,
      type,
      extension,
    }

    return {
      isValid: true,
      sanitizedName,
      metadata,
    }
  } catch {
    return {
      isValid: false,
      error: 'File validation failed',
    }
  }
}

/**
 * Sanitize URL to prevent open redirect attacks
 */
export function sanitizeUrl(url: string, allowedDomains: string[] = []): string | null {
  try {
    // Remove whitespace
    const cleanUrl = url.trim()

    // Check for empty URL
    if (!cleanUrl) {
      return null
    }

    // Allow relative URLs
    if (cleanUrl.startsWith('/') && !cleanUrl.startsWith('//')) {
      return cleanUrl
    }

    // Parse absolute URLs
    const parsedUrl = new URL(cleanUrl)

    // Check protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null
    }

    // Check domain if allowedDomains is specified
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(
        (domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
      )

      if (!isAllowed) {
        return null
      }
    }

    return parsedUrl.toString()
  } catch {
    return null
  }
}

/**
 * Sanitize JSON input to prevent prototype pollution
 */
export function sanitizeJson(jsonString: string): unknown {
  try {
    const parsed = JSON.parse(jsonString)

    // Remove dangerous properties
    const dangerousKeys = ['__proto__', 'constructor', 'prototype']

    function removeDangerousKeys(obj: unknown): unknown {
      if (obj === null || typeof obj !== 'object') {
        return obj
      }

      if (Array.isArray(obj)) {
        return obj.map(removeDangerousKeys)
      }

      const cleaned: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (!dangerousKeys.includes(key)) {
          cleaned[key] = removeDangerousKeys(value)
        }
      }

      return cleaned
    }

    return removeDangerousKeys(parsed)
  } catch {
    return null
  }
}
