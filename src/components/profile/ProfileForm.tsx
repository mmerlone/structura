'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, CircularProgress, Grid, Paper } from '@mui/material'
import { type User } from '@supabase/supabase-js'
import { useCallback, useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { AccountDetails } from './sections/AccountDetails'
import { AvatarSection } from './sections/AvatarSection'
import { ContactInfo } from './sections/ContactInfo'
import { LocationInfo } from './sections/LocationInfo'
import { PersonalInfo } from './sections/PersonalInfo'
import { ProfessionalInfo } from './sections/ProfessionalInfo'

import { SITE_CONFIG } from '@/config/site'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { useProfile } from '@/hooks/useProfile'
import { logger } from '@/lib/logger/client'
import { ProfileFormValues, profileFormSchema } from '@/lib/validators'
import { GenderPreference } from '@/types'
import { Profile, ProfileUpdate } from '@/types/database'

interface ProfileFormProps {
  user: User | null
  profile: Profile | null
}

export function ProfileForm({ user, profile: initialProfile }: ProfileFormProps): JSX.Element {
  const { showError, showSuccess } = useSnackbar()
  const { profile, updateProfile } = useProfile(user?.id, initialProfile)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: 'onChange',
    defaultValues: {
      email: user?.email ?? '',
      display_name: '',
      first_name: '',
      last_name: '',
      bio: '',
      company: '',
      job_title: '',
      website: '',
      phone: '',
      timezone: '',
      country_code: '',
      state: '',
      city: '',
      locale: '',
      birth_date: null,
      gender: null,
    },
  })

  const { reset, handleSubmit, formState } = form
  const { errors, isDirty, isSubmitting, isValid } = formState

  // Transform profile data to match ProfileFormValues type
  const transformToFormValues = useCallback(
    (profile: Profile | null): ProfileFormValues | null => {
      if (!profile) return null

      return {
        email: user?.email ?? '',
        display_name: profile.display_name || '',
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        bio: profile.bio ?? '',
        company: profile.company ?? '',
        job_title: profile.job_title ?? '',
        website: profile.website ?? '',
        phone: profile.phone ?? '',
        timezone: profile.timezone ?? '',
        country_code: profile.country_code ?? '',
        state: profile.state ?? '',
        city: profile.city ?? '',
        locale: profile.locale ?? '',
        birth_date: profile.birth_date ?? null,
        gender: (profile.gender as GenderPreference) || null,
      }
    },
    [user?.email]
  )

  // Reset form when profile data loads (only if form is not dirty)
  useEffect(() => {
    if (profile && !isDirty && !isSubmitting) {
      const formValues = transformToFormValues(profile)
      if (formValues) {
        form.reset(formValues, { keepDirty: false, keepErrors: false })
      }
    }
  }, [profile, form, transformToFormValues, isDirty, isSubmitting])

  const onSubmit = useCallback(
    async (data: ProfileFormValues, event?: React.BaseSyntheticEvent) => {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }

      if (user?.id == null) return

      try {
        const updates: ProfileUpdate = {
          first_name: data.first_name ?? null,
          last_name: data.last_name ?? null,
          display_name: data.display_name ?? '',
          bio: data.bio ?? null,
          company: data.company ?? null,
          job_title: data.job_title ?? null,
          website: data.website ?? null,
          phone: data.phone ?? null,
          timezone: data.timezone ?? null,
          country_code: data.country_code ?? null,
          state: data.state ?? null,
          city: data.city ?? null,
          locale: data.locale ?? null,
          birth_date: data.birth_date ?? null,
          gender: data.gender || null,
        }

        await updateProfile(updates)
        showSuccess('Profile updated successfully!')
        // Reset form with submitted data to mark it as clean (not dirty)
        // This disables the submit button until user makes changes
        // Reset form with submitted data to mark it as clean (not dirty)
        // This disables the submit button until user makes changes
        reset(data, { keepDirty: false, keepErrors: false })
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
        logger.error(
          {
            error: errorMessage,
            component: 'ProfileForm',
            action: 'updateProfile',
            stack: error instanceof Error ? error.stack : undefined,
          },
          'Profile update error'
        )
        showError('Failed to update profile. Please try again.')
      }
    },
    [user?.id, updateProfile, showSuccess, showError, reset]
  )

  return (
    <Box sx={{ mt: 1, width: '100%' }}>
      <Grid container spacing={3} sx={{ position: 'relative' }}>
        {/* Left Column - Avatar and Basic Info */}
        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{
            position: { xs: 'static', md: 'sticky' },
            top: (theme) => (SITE_CONFIG.fixedHeader ? theme.mixins.toolbar.minHeight : 0),
            height: 'fit-content',
            transition: 'top 0.3s',
            alignSelf: 'flex-start',
            zIndex: 1,
          }}>
          <Paper
            id="profile-avatar"
            sx={{
              p: 3,
              position: 'relative',
              overflow: 'visible',
            }}>
            <AvatarSection />
          </Paper>
        </Grid>

        {/* Right Column - Form Sections */}
        <Grid size={{ xs: 12, md: 8 }}>
          <FormProvider {...form}>
            <Paper sx={{ p: 4 }}>
              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void handleSubmit(onSubmit)(e)
                }}
                noValidate
                sx={{ width: '100%' }}>
                <AccountDetails errors={errors} disabled={isSubmitting} />
                <PersonalInfo errors={errors} disabled={isSubmitting} />
                <ContactInfo errors={errors} disabled={isSubmitting} />
                <LocationInfo disabled={isSubmitting} />
                <ProfessionalInfo errors={errors} disabled={isSubmitting} />

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
                  <Button
                    fullWidth
                    type="button"
                    variant="outlined"
                    onClick={() => reset()}
                    disabled={!isDirty || isSubmitting}
                    sx={{ mt: 3, mb: 2 }}>
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    disabled={!isDirty || isSubmitting || !isValid}
                    sx={{ mt: 3, mb: 2 }}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : undefined}>
                    {isSubmitting ? 'Updating...' : 'Update Profile'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </FormProvider>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ProfileForm
