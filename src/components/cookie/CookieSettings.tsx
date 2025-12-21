'use client'

import { Cookie as CookieIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import {
  CircularProgress,
  Box,
  Button,
  Divider,
  FormControlLabel,
  FormGroup,
  Paper,
  Switch,
  Typography,
} from '@mui/material'
import type React from 'react'
import { useEffect, useState } from 'react'

import { useSnackbar } from '@/contexts/SnackbarContext'
import { useCookieConsent } from '@/hooks/useCookieConsent'
import { CookiePreferences } from '@/types/cookie.types'

export function CookieSettings(): JSX.Element {
  const { hasConsent, preferences, acceptSelected, decline } = useCookieConsent()
  const [isClient, setIsClient] = useState(false)
  const [localPreferences, setLocalPreferences] = useState(preferences)
  const { showSuccess, showError } = useSnackbar()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    setLocalPreferences(preferences)
  }, [preferences])

  const handleSavePreferences = async (): Promise<void> => {
    try {
      await acceptSelected(localPreferences)
      showSuccess('Cookie preferences saved successfully')
    } catch {
      showError('Failed to save cookie preferences')
    }
  }

  const handlePreferenceChange =
    (category: keyof CookiePreferences) =>
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      if (category === 'necessary') return // Cannot disable necessary cookies
      setLocalPreferences((prev) => ({
        ...prev,
        [category]: event.target.checked,
      }))
    }

  const handleResetConsent = (): void => {
    try {
      decline()
      // Reset local preferences to default values (all false except necessary)
      setLocalPreferences({
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
      })
      showSuccess('Cookie preferences have been reset.')
    } catch {
      showError('Failed to reset cookie preferences.')
    }
  }

  // Cleaned up unused code

  // // Prevent hydration mismatch by only rendering on client
  // if (!isClient) {
  //   return (
  //     <Paper sx={{ p: 4 }}>
  //       <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
  //         <CookieIcon color="primary" />
  //         <Typography variant="h5" component="h2">
  //           Cookie Settings
  //         </Typography>
  //       </Box>
  //       <Typography variant="body1" color="text.secondary">
  //         Loading cookie preferences...
  //       </Typography>
  //     </Paper>
  //   )
  // }

  return (
    <Paper sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <CookieIcon color="primary" />
        <Typography variant="h5" component="h2">
          Cookie Settings
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your cookie preferences below. You can enable or disable different types of cookies based on your
        preferences. Note that disabling some cookies may affect your experience on our website.
      </Typography>

      {isClient ? (
        <>
          <Typography variant="h6" gutterBottom>
            Current Status
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Cookies are currently <strong>{hasConsent ? 'accepted' : 'declined'}</strong>.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Cookie Categories
          </Typography>

          <FormGroup sx={{ mb: 3 }}>
            <FormControlLabel
              control={<Switch checked={localPreferences.necessary} disabled />}
              label={
                <Box>
                  <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                    Necessary Cookies
                  </Typography>
                  <Typography variant="body2" display="block" color="text.secondary">
                    These cookies are essential for the website to function properly and cannot be disabled. They are
                    usually only set in response to actions made by you which amount to a request for services, such as
                    setting your privacy preferences, logging in, or filling in forms.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 2 }}
            />

            <FormControlLabel
              control={<Switch checked={localPreferences.analytics} onChange={handlePreferenceChange('analytics')} />}
              label={
                <Box>
                  <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                    Analytics Cookies
                  </Typography>
                  <Typography variant="body2" display="block" color="text.secondary">
                    These cookies allow us to count visits and traffic sources so we can measure and improve the
                    performance of our site. They help us to know which pages are the most and least popular and see how
                    visitors move around the site.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 2 }}
            />

            <FormControlLabel
              control={<Switch checked={localPreferences.marketing} onChange={handlePreferenceChange('marketing')} />}
              label={
                <Box>
                  <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                    Marketing Cookies
                  </Typography>
                  <Typography variant="body2" display="block" color="text.secondary">
                    These cookies may be set through our site by our advertising partners. They may be used by those
                    companies to build a profile of your interests and show you relevant adverts on other sites.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 2 }}
            />

            <FormControlLabel
              control={<Switch checked={localPreferences.functional} onChange={handlePreferenceChange('functional')} />}
              label={
                <Box>
                  <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                    Functional Cookies
                  </Typography>
                  <Typography variant="body2" display="block" color="text.secondary">
                    These cookies enable the website to provide enhanced functionality and personalization. They may be
                    set by us or by third party providers whose services we have added to our pages.
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start' }}
            />
          </FormGroup>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={handleSavePreferences}>
              Save Preferences
            </Button>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleResetConsent}>
              Reset All Cookies
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Changes will take effect immediately. You may need to refresh the page to see some changes.
          </Typography>
        </>
      ) : (
        <Paper sx={{ p: 4 }}>
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        </Paper>
      )}
    </Paper>
  )
}
