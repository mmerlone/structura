/**
 * Hook for accessing optimized avatar URLs
 *
 * Provides easy access to different sizes of avatar images using
 * Supabase's image transformation API.
 */

import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getOptimizedImageUrl,
  parseSupabaseStorageUrl,
  AVATAR_SIZES,
  type ImageTransformOptions,
} from '@/lib/utils/image-utils'

/**
 * Hook to get optimized avatar URLs for different sizes
 *
 * @param avatarUrl - The stored avatar URL from the profile
 * @returns Object with optimized URLs for different sizes
 *
 * @example
 * ```typescript
 * function UserAvatar({ profile }) {
 *   const avatarUrls = useOptimizedAvatar(profile.avatar_url)
 *
 *   return (
 *     <img
 *       src={avatarUrls.medium}
 *       srcSet={`${avatarUrls.small} 1x, ${avatarUrls.medium} 2x`}
 *       alt="User avatar"
 *     />
 *   )
 * }
 * ```
 */
export function useOptimizedAvatar(avatarUrl: string | null) {
  // Memoize the client to prevent recreation on every render
  const client = useMemo(() => createClient(), [])

  return useMemo(() => {
    const pathInfo = parseSupabaseStorageUrl(avatarUrl)

    if (!pathInfo) {
      // Return original URL for all sizes if we can't extract the path
      return {
        thumbnail: avatarUrl || '',
        small: avatarUrl || '',
        medium: avatarUrl || '',
        large: avatarUrl || '',
        original: avatarUrl || '',
      }
    }

    const { bucket, filePath } = pathInfo

    return {
      thumbnail: getOptimizedImageUrl(client, bucket, filePath, AVATAR_SIZES.thumbnail),
      small: getOptimizedImageUrl(client, bucket, filePath, AVATAR_SIZES.small),
      medium: getOptimizedImageUrl(client, bucket, filePath, AVATAR_SIZES.medium),
      large: getOptimizedImageUrl(client, bucket, filePath, AVATAR_SIZES.large),
      original: avatarUrl || '',
    }
  }, [avatarUrl, client])
}

/**
 * Hook to get a single optimized avatar URL with custom options
 *
 * @param avatarUrl - The stored avatar URL from the profile
 * @param options - Custom transformation options
 * @returns Optimized image URL
 *
 * @example
 * ```typescript
 * function LargeAvatar({ profile }) {
 *   const avatarUrl = useOptimizedAvatarUrl(profile.avatar_url, {
 *     width: 500,
 *     height: 500,
 *     quality: 90,
 *   })
 *
 *   return <img src={avatarUrl} alt="User avatar" />
 * }
 * ```
 */
export function useOptimizedAvatarUrl(avatarUrl: string | null, options: ImageTransformOptions = AVATAR_SIZES.medium) {
  // Memoize the client to prevent recreation on every render
  const client = useMemo(() => createClient(), [])

  return useMemo(() => {
    const pathInfo = parseSupabaseStorageUrl(avatarUrl)

    if (!pathInfo) {
      return avatarUrl || ''
    }

    const { bucket, filePath } = pathInfo
    return getOptimizedImageUrl(client, bucket, filePath, options)
  }, [avatarUrl, options, client])
}
