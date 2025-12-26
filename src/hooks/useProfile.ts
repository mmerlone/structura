'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useEffect } from 'react'

import { QUERY_CONFIG, QUERY_KEYS } from '@/config/query'
import { ErrorCodes } from '@/lib/error/codes'
import { BusinessError } from '@/lib/error/errors'
import { logger } from '@/lib/logger/client'
import { ProfileClientService } from '@/lib/supabase/services/database/profiles/profile.client'
import type { Profile } from '@/types/database'
import { ThemePreference } from '@/types/theme.types'

/**
 * User profile management hook with React Query integration.
 *
 * This hook provides comprehensive profile data management including fetching, updating,
 * theme preferences, and avatar uploads. It uses React Query for caching, deduplication,
 * optimistic updates, and proper error handling with the centralized error system.
 *
 * @param {string} [userId] - The user ID to fetch profile for. If undefined, the query is disabled
 * @param {Profile | null} [initialData] - Optional initial data for hydration (e.g. from Server Components)
 * @returns {UseProfileReturn} Object containing:
 * - `profile`: User profile data or null
 * - `isLoading`: Loading state for fetch operations
 * - `isUpdating`: Loading state for update operations
 * - `isUploadingAvatar`: Loading state for avatar uploads
 * - `error`: Any error that occurred or null
 * - `updateProfile`: Function to update profile fields with optimistic updates
 * - `updateThemePreference`: Function to update theme preference
 * - `uploadAvatar`: Function to upload avatar image
 * - `refetch`: Function to manually refetch profile data
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { profile, isLoading, error, updateProfile } = useProfile('user-123');
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   const handleUpdate = async (updates) => {
 *     try {
 *       await updateProfile(updates);
 *       // Handle success (e.g., show toast notification)
 *     } catch (err) {
 *       // Handle error (e.g., show error message)
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <h1>{profile?.display_name}</h1>
 *       <button onClick={() => handleUpdate({ bio: 'New bio' })}>
 *         Update Bio
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { profile, updateThemePreference } = useProfile('user-123');
 *
 *   const toggleTheme = () => {
 *     const newTheme = profile?.theme === 'dark' ? 'light' : 'dark';
 *     updateThemePreference(newTheme);
 *   };
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current theme: {profile?.theme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useProfile(userId?: string, initialData?: Profile | null) {
  const queryClient = useQueryClient()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort any pending requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery<Profile | null>({
    queryKey: QUERY_KEYS.profile(userId),
    initialData: initialData || undefined,
    queryFn: async () => {
      if (userId === null || userId === undefined) return null
      try {
        const service = new ProfileClientService()
        return await service.getProfile(userId)
      } catch (error) {
        const errorContext = {
          userId,
          operation: 'loadProfile',
          ...(error instanceof Error ? { stack: error.stack } : {}),
        }

        logger.error(
          {
            error,
            ...errorContext,
          },
          'Failed to load profile'
        )

        throw error
      }
    },
    enabled: userId !== null && userId !== undefined,
    staleTime: QUERY_CONFIG.profile.staleTime,
    gcTime: QUERY_CONFIG.profile.gcTime,
    refetchOnWindowFocus: false, // Prevent refetch on window focus to avoid unnecessary reloads
    refetchOnMount: false, // Only refetch if data is stale
    retry: (failureCount, error) => {
      if (
        error instanceof BusinessError &&
        error.statusCode !== null &&
        error.statusCode !== undefined &&
        QUERY_CONFIG.retry.nonRetryableStatusCodes.includes(error.statusCode)
      ) {
        return false
      }
      return failureCount < QUERY_CONFIG.retry.maxAttempts
    },
  })

  type MutationContext = { previousProfile: Profile | null | undefined } | undefined

  const { mutateAsync: updateProfile, isPending: isUpdating } = useMutation<
    Profile,
    Error,
    Partial<Profile>,
    MutationContext
  >({
    mutationKey: [...QUERY_KEYS.profile(userId), 'update'],
    mutationFn: async (updates: Partial<Profile>) => {
      if (userId === null || userId === undefined) {
        throw new BusinessError({
          code: ErrorCodes.validation.invalidInput(),
          message: 'User ID is required',
          statusCode: 400,
          context: { operation: 'updateProfile' },
        })
      }
      const service = new ProfileClientService()
      return await service.updateProfile(userId, updates)
    },
    onMutate: async (updates) => {
      if (userId === null || userId === undefined) return

      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.profile(userId) })

      const previousProfile = queryClient.getQueryData<Profile | null>(QUERY_KEYS.profile(userId))

      if (previousProfile) {
        queryClient.setQueryData(QUERY_KEYS.profile(userId), {
          ...previousProfile,
          ...updates,
        })
      }

      return { previousProfile }
    },
    onError: (error, _, context) => {
      const errorContext = {
        userId,
        operation: 'updateProfile',
        ...(error instanceof BusinessError
          ? {
              code: error.code,
              statusCode: error.statusCode,
              isOperational: error.isOperational,
            }
          : {}),
      }

      logger.error(
        {
          error,
          ...errorContext,
        },
        'Profile update failed'
      )

      if (context?.previousProfile) {
        queryClient.setQueryData(QUERY_KEYS.profile(userId), context.previousProfile)
      }
    },
    onSettled: () => {
      // Invalidate queries to trigger refetch, but use refetchType: 'active' to only refetch active queries
      // This prevents unnecessary refetches that could cause component remounts
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile(userId),
        refetchType: 'active', // Only refetch if the query is currently being used
      })
    },
  })

  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } = useMutation<string, Error, File, undefined>({
    mutationKey: [...QUERY_KEYS.profile(userId), 'avatar'],
    mutationFn: async (file: File) => {
      if (userId === null || userId === undefined) {
        throw new BusinessError({
          code: ErrorCodes.validation.invalidInput(),
          message: 'User ID is required for avatar upload',
          statusCode: 400,
          context: { operation: 'uploadAvatar' },
        })
      }

      // Create new AbortController for this operation
      abortControllerRef.current = new AbortController()

      try {
        const service = new ProfileClientService()
        const result = await service.uploadAvatar(userId, file)
        return result
      } finally {
        // Clear the abort controller after operation completes
        abortControllerRef.current = null
      }
    },
    onSuccess: (avatarUrl) => {
      queryClient.setQueryData(QUERY_KEYS.profile(userId), (old: Profile | null) => {
        if (!old) return old
        // Use Object.assign for single property update (more efficient than spread)
        return Object.assign({}, old, { avatar_url: avatarUrl })
      })
    },
    onError: (error) => {
      logger.error(
        {
          error,
          userId,
          operation: 'uploadAvatar',
        },
        'Avatar upload failed'
      )
    },
    onSettled: () => {
      // Invalidate queries to trigger refetch, but use refetchType: 'active' to only refetch active queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile(userId),
        refetchType: 'active',
      })
    },
  })

  const updateThemePreference = useCallback(
    async (theme: ThemePreference) => {
      if (userId === null || userId === undefined) {
        throw new BusinessError({
          code: ErrorCodes.validation.invalidInput(),
          message: 'User ID is required to update theme preference',
          statusCode: 400,
          context: { operation: 'updateThemePreference' },
        })
      }

      try {
        await updateProfile({ theme })
      } catch (error) {
        logger.error({ error, userId, theme }, 'Failed to update theme preference')
        throw error
      }
    },
    [userId, updateProfile]
  )

  return {
    /** The user's profile data, or null if not loaded/found */
    profile: profile || null,
    /** True if the initial profile load is in progress (not background refetching) */
    isLoading: isLoading,
    /** True if a profile update mutation is in progress */
    isUpdating,
    /** True if an avatar upload is in progress */
    isUploadingAvatar,
    /** Any error that occurred during fetching or updating, or null if no error */
    error: error || null,
    /** Function to update profile fields with optimistic updates */
    updateProfile,
    /** Function to update the user's theme preference */
    updateThemePreference,
    /** Function to upload avatar image */
    uploadAvatar,
    /** Function to manually refetch the profile data */
    refetch,
  }
}
