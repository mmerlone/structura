import { NON_RETRYABLE_STATUS_CODES } from '@/types/http.types'

/**
 * React Query Configuration
 *
 * Centralized configuration for React Query caching, retries, and timeouts.
 * Extracted from magic numbers in hooks to improve maintainability.
 */

export const QUERY_CONFIG = {
  /**
   * Default stale time for queries (5 minutes)
   * Data is considered fresh for this duration
   */
  defaultStaleTime: 5 * 60 * 1000, // 5 minutes

  /**
   * Default garbage collection time (10 minutes)
   * Unused data is kept in cache for this duration
   */
  defaultGcTime: 10 * 60 * 1000, // 10 minutes

  /**
   * Profile-specific cache times
   */
  profile: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },

  /**
   * Auth-specific cache times
   */
  auth: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  },

  /**
   * Default retry configuration
   */
  retry: {
    /**
     * Maximum number of retry attempts
     */
    maxAttempts: 3,

    /**
     * HTTP status codes that should not be retried
     * 400: Bad Request - client error, won't succeed on retry
     * 401: Unauthorized - needs authentication
     * 403: Forbidden - needs authorization
     * 404: Not Found - resource doesn't exist
     */
    nonRetryableStatusCodes: NON_RETRYABLE_STATUS_CODES,
  },

  /**
   * Request timeouts
   */
  timeouts: {
    /**
     * Default query timeout (30 seconds)
     */
    default: 30 * 1000,

    /**
     * File upload timeout (2 minutes)
     */
    upload: 2 * 60 * 1000,

    /**
     * Long-running operation timeout (5 minutes)
     */
    longRunning: 5 * 60 * 1000,
  },
} as const

/**
 * Query keys for consistent cache management
 */
export const QUERY_KEYS = {
  profile: (userId?: string) => ['profile', userId] as const,
  auth: ['auth'] as const,
  session: ['session'] as const,
  geoLocation: (ip?: string) => ['geoLocation', ip] as const,
} as const

// Type exports
export type QueryConfig = typeof QUERY_CONFIG
export type QueryKeys = typeof QUERY_KEYS
