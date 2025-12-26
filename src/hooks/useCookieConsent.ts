'use client'

import { useState, useEffect, useCallback } from 'react'

import { logger } from '@/lib/logger/client'
import { ensureCookiePreferences } from '@/lib/utils/cookie-utils'
import type { CookiePreferences } from '@/types/cookie.types'

/**
 * Internal state type for cookie consent management.
 * @interface CookieConsentState
 * @internal
 */
interface CookieConsentState {
  /** Whether the user has given consent (true), denied (false), or not decided yet (null) */
  hasConsent: boolean | null
  /** Current cookie preferences for each category */
  preferences: CookiePreferences
}

/**
 * Key used to store cookie consent status in localStorage
 */
const COOKIE_CONSENT_KEY = 'cookie-consent'

/**
 * Key used to store cookie preferences in localStorage
 */
const COOKIE_PREFERENCES_KEY = 'cookie-preferences'

/**
 * Default cookie preferences
 * - Necessary cookies are enabled by default as they're required for basic functionality
 * - All other cookie types are disabled by default
 */
const defaultPreferences: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
}

/**
 * Return type for the useCookieConsent hook.
 * Provides cookie consent state and management functions.
 * @interface UseCookieConsentReturn
 */
type UseCookieConsentReturn = {
  /** Whether the user has given consent (true), denied (false), or not decided yet (null) */
  hasConsent: boolean | null
  /** Current cookie preferences */
  preferences: CookiePreferences
  /** Whether the consent banner is currently visible */
  isBannerOpen: boolean
  /** Accept all cookie types */
  acceptAll: () => Promise<void>
  /** Accept only selected cookie types */
  acceptSelected: (prefs: Partial<CookiePreferences>) => Promise<void>
  /** Decline all non-essential cookies */
  decline: () => Promise<void>
  /** Show the cookie consent banner */
  showBanner: () => void
  /** Hide the cookie consent banner */
  hideBanner: () => void
}

/**
 * Cookie consent management hook for GDPR/privacy compliance.
 *
 * This hook manages user cookie preferences and consent state, providing a complete
 * solution for cookie consent banners and preference management. It handles localStorage
 * persistence, hydration safety, and provides methods for accepting, declining, or
 * customizing cookie preferences.
 *
 * @returns {UseCookieConsentReturn} Object containing:
 * - `hasConsent`: Current consent status (true/false/null)
 * - `preferences`: Current cookie preferences for each category
 * - `isBannerOpen`: Whether the consent banner is visible
 * - `acceptAll`: Accept all cookie categories
 * - `acceptSelected`: Accept only selected cookie categories
 * - `decline`: Decline all non-essential cookies
 * - `showBanner`: Show the consent banner
 * - `hideBanner`: Hide the consent banner
 *
 * @example
 * ```tsx
 * function CookieBanner() {
 *   const { hasConsent, acceptAll, decline, hideBanner, isBannerOpen } = useCookieConsent();
 *
 *   if (!isBannerOpen) return null;
 *
 *   return (
 *     <div className="cookie-banner">
 *       <p>This website uses cookies to enhance your experience.</p>
 *       <button onClick={acceptAll}>Accept All</button>
 *       <button onClick={decline}>Decline</button>
 *       <button onClick={hideBanner}>Customize</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function CookieSettings() {
 *   const { preferences, acceptSelected } = useCookieConsent();
 *
 *   const handleSave = (newPrefs: Partial<CookiePreferences>) => {
 *     acceptSelected(newPrefs);
 *   };
 *
 *   return (
 *     <div>
 *       <label>
 *         <input
 *           type="checkbox"
 *           checked={preferences.analytics}
 *           onChange={(e) => handleSave({ analytics: e.target.checked })}
 *         />
 *         Analytics Cookies
 *       </label>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCookieConsent(): UseCookieConsentReturn {
  // Split state to avoid cyclic dependencies and complex updates
  const [isBannerOpen, setIsBannerOpen] = useState(false)

  const [state, setState] = useState<CookieConsentState>(() => {
    if (typeof window === 'undefined') {
      return {
        preferences: { ...defaultPreferences },
        hasConsent: null,
      }
    }

    try {
      const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY)

      const hasConsent = savedConsent !== null && savedConsent !== undefined ? Boolean(JSON.parse(savedConsent)) : null

      const parsedPrefs = ((): CookiePreferences => {
        if (savedPrefs === null || savedPrefs === undefined) return { ...defaultPreferences }
        try {
          const raw = JSON.parse(savedPrefs) as CookiePreferences
          return ensureCookiePreferences(raw)
        } catch (err) {
          logger.error({ err }, 'Failed to parse saved cookie preferences')
          return { ...defaultPreferences }
        }
      })()

      return {
        hasConsent,
        preferences: parsedPrefs,
      }
    } catch (error) {
      logger.error({ error }, 'Error loading cookie preferences from localStorage')
      return {
        preferences: { ...defaultPreferences },
        hasConsent: null,
      }
    }
  })

  // Initialize banner state based on consent status after mount
  useEffect(() => {
    // If no decision has been made yet, show banner
    if (state.hasConsent === null) {
      // Use setTimeout to avoid 'set-state-in-effect' lint error and ensure
      // the update happens after the current render cycle.
      const timer = setTimeout(() => setIsBannerOpen(true), 100)
      return () => clearTimeout(timer)
    }
  }, [state.hasConsent])

  const savePreferences = useCallback(async (preferences: CookiePreferences, consent: boolean) => {
    try {
      const validPrefs = ensureCookiePreferences(preferences)

      if (typeof window !== 'undefined') {
        localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(validPrefs))
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))
      }

      setState((prev) => ({
        ...prev,
        preferences: validPrefs,
        hasConsent: consent,
      }))
      setIsBannerOpen(false)

      logger.debug({ preferences: validPrefs, consent }, 'Cookie preferences saved')
    } catch (error) {
      logger.error({ error }, 'Failed to save cookie preferences')
      throw error
    }
  }, [])

  const acceptAll = useCallback(async () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    }
    await savePreferences(allAccepted, true)
  }, [savePreferences])

  // Accept selected cookie categories
  const acceptSelected = useCallback(
    async (prefs: Partial<CookiePreferences>) => {
      const newPreferences = {
        ...state.preferences,
        ...prefs,
        necessary: true, // Always keep necessary cookies enabled
      }
      await savePreferences(newPreferences, true)
    },
    [savePreferences, state.preferences]
  )

  const decline = useCallback(async () => {
    await savePreferences(
      {
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false,
      },
      false
    )
  }, [savePreferences])

  // Show/hide banner
  const showBanner = useCallback(() => {
    setIsBannerOpen(true)
  }, [])

  const hideBanner = useCallback(() => {
    setIsBannerOpen(false)
  }, [])

  return {
    ...state,
    isBannerOpen,
    acceptAll,
    acceptSelected,
    decline,
    showBanner,
    hideBanner,
  }
}
