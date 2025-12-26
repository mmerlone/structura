import moment from 'moment-timezone'

import { Timezone } from '@/types/timezone.types'

// Note: This utility can be used in both client and server environments
// Since this is a shared utility, we don't import logger here to avoid client/server issues
// Callers should handle logging if needed

/**
 * Gets all available IANA timezones with their current offsets using moment-timezone
 * @returns Array of Timezone objects sorted by offset and name
 */
export function getTimezones(): Timezone[] {
  const timezoneNames = moment.tz.names()
  const now = moment()

  const timezones = timezoneNames.map((name: string) => {
    const zone = moment.tz.zone(name)
    const timestamp = now.valueOf()
    const offsetInMinutes = zone?.utcOffset(timestamp) ?? 0
    const offsetInHours = offsetInMinutes / 60
    const offsetFormatted = `UTC${offsetInHours < 0 ? '+' : '-'}${offsetInHours}`
    const displayName = name.replace(/_/g, ' ')

    return {
      value: name,
      label: `${displayName} (${offsetFormatted})`,
      offset: offsetInHours,
    }
  })

  return timezones.sort((a, b) => {
    return a.value.localeCompare(b.value)
  })
}

/**
 * Gets the user's current timezone using moment-timezone
 * @returns The IANA timezone string (e.g., 'America/New_York')
 */
export function getCurrentTimezone(): string {
  try {
    const guessedTz = moment.tz.guess()

    if (!guessedTz) {
      const timezone = Intl?.DateTimeFormat().resolvedOptions().timeZone
      return timezone || 'UTC'
    }

    return guessedTz
  } catch (e) {
    // Note: We use console.warn here because this is a shared utility
    // that can be called from both client and server, and we don't want
    // to introduce logger dependencies that could cause bundling issues
    console.warn('Could not determine timezone, using UTC as fallback:', e)
    return 'UTC'
  }
}
