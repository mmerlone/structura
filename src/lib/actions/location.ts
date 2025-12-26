'use server'

import { buildLogger } from '@/lib/logger/server'
import { getCountryByCode } from '@/lib/utils/location-utils'

const logger = buildLogger('location-actions')

// In-memory cache for geolocation results
// Note: This is a simple in-memory cache suitable for single-instance deployments.
// In production with multiple serverless instances, consider using:
// - Redis for distributed caching
// - Vercel KV for Vercel deployments
// - Or accept potential cache misses across instances (still reduces API calls)
const geoLocationCache = new Map<string, { country: string; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHE_SIZE = 1000 // Prevent unbounded memory growth
const CACHE_EVICTION_RATIO = 0.1 // Remove 10% of oldest entries when cache is full

/**
 * Get country from cache if available and not expired
 */
function getCachedCountry(cacheKey: string): string | null {
  const cached = geoLocationCache.get(cacheKey)
  
  if (!cached) return null
  
  // Check if cache entry is expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    geoLocationCache.delete(cacheKey)
    return null
  }
  
  return cached.country
}

/**
 * Store country in cache with LRU eviction
 */
function cacheCountry(cacheKey: string, country: string): void {
  // Improved LRU: if cache is full, remove oldest entries based on CACHE_EVICTION_RATIO
  if (geoLocationCache.size >= MAX_CACHE_SIZE) {
    const entriesToRemove = Math.max(1, Math.floor(MAX_CACHE_SIZE * CACHE_EVICTION_RATIO))
    const sortedEntries = Array.from(geoLocationCache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    )
    
    for (let i = 0; i < entriesToRemove && i < sortedEntries.length; i++) {
      geoLocationCache.delete(sortedEntries[i][0])
    }
  }
  
  geoLocationCache.set(cacheKey, {
    country,
    timestamp: Date.now(),
  })
}

/**
 * Server Action to detect the user's country using IP geolocation.
 * Replaces the legacy /api/location/country API route.
 * 
 * Implements caching to prevent API quota exhaustion:
 * - Results cached for 24 hours per IP
 * - Maximum 1000 cached entries (LRU eviction)
 */
export async function detectCountry(ipAddress?: string): Promise<string | null> {
  try {
    // Generate cache key (use provided IP or 'auto-detect' for auto-detection)
    const cacheKey = ipAddress || 'auto-detect'
    
    // Check cache first
    const cachedCountry = getCachedCountry(cacheKey)
    if (cachedCountry) {
      logger.debug({ cacheKey }, 'Returning cached country')
      return cachedCountry
    }

    // Get API key from server-side environment variable
    const apiKey = process.env.IPGEOLOCATION_API_KEY
    if (apiKey === null || apiKey === undefined) {
      logger.error({}, 'IPGEOLOCATION_API_KEY not found in server environment variables')
      return null
    }

    logger.debug({ ipAddress }, 'Fetching country using IP geolocation API (Server Action)')

    // Build API URL with optional IP parameter
    const apiUrl = ipAddress
      ? `https://api.ipgeolocation.io/v2/ipgeo?fields=location&apiKey=${apiKey}&ip=${ipAddress}`
      : `https://api.ipgeolocation.io/v2/ipgeo?fields=location&apiKey=${apiKey}`

    // Call IP geolocation API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      logger.warn(
        {
          status: response.status,
          statusText: response.statusText,
        },
        'Failed to fetch country from IP geolocation API (Server Action)'
      )
      return null
    }

    interface IpGeolocationResponse {
      location?: {
        country_code2?: string
      }
    }

    const data = (await response.json()) as IpGeolocationResponse
    const countryCode = data.location?.country_code2

    if (countryCode === null || countryCode === undefined) {
      logger.warn({ data }, 'No country code found in IP geolocation response')
      return null
    }

    // Validate country code with country-state-city module
    const country = getCountryByCode(countryCode)
    if (!country) {
      logger.warn({ countryCode }, 'Invalid country code received from API')
      return null
    }

    logger.info(
      {
        countryCode,
        countryName: country.name,
        cached: false,
      },
      'Successfully detected country from IP geolocation (Server Action)'
    )

    // Cache the result
    cacheCountry(cacheKey, country.isoCode)

    return country.isoCode
  } catch (error) {
    // Handle timeout errors specifically
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn({ error: 'Request timeout' }, 'IP geolocation API timeout')
      return null
    }

    logger.error({ error }, 'Unexpected error in IP geolocation API (Server Action)')
    return null
  }
}
