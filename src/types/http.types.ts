/**
 * Standard HTTP status codes
 * Based on https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 */
export type HttpStatus =
  // Client errors
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 405 // Method Not Allowed
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  // Server errors
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503 // Service Unavailable
  | 504 // Gateway Timeout

/**
 * Type for non-retryable HTTP status codes
 * These are client errors that won't succeed on retry
 */
export type NonRetryableHttpStatus = 400 | 401 | 403 | 404

/**
 * Array of non-retryable HTTP status codes
 */
export const NON_RETRYABLE_STATUS_CODES = [400, 401, 403, 404] as const satisfies readonly NonRetryableHttpStatus[]

/**
 * Type guard to check if a status code is non-retryable
 */
export function isNonRetryableStatus(statusCode: number | undefined | null): statusCode is NonRetryableHttpStatus {
  if (statusCode === undefined || statusCode === null) return false
  return NON_RETRYABLE_STATUS_CODES.includes(statusCode as NonRetryableHttpStatus)
}
