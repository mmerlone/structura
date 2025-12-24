import { BaseService } from '../../base.service'
import { convertAppProfileForInsert, convertAppProfileForUpdate, convertDbProfile } from '@/lib/utils/profile-utils'
import { validateAndSanitizeFile } from '@/lib/security/sanitize'
import type { Profile, ProfileUpdate } from '@/types/profile.types'

const PROFILE_BUCKET = 'avatars'

// Avatar validation constraints
const AVATAR_VALIDATION = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
} as const

/**
 * Abstract base profile service with shared business logic
 * Contains all profile-related operations that work the same on client and server
 * Must be extended by concrete implementations (ProfileClientService, ProfileServerService)
 */
export abstract class ProfileService extends BaseService {
  /**
   * Get a user's profile by ID
   * @param userId - The ID of the user
   * @returns The user's profile or null if not found
   */
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      this.logger.debug({ userId }, 'Fetching user profile')
      const { data, error } = await this.client.from('profiles').select('*').eq('id', userId).single()

      if (error) throw error

      this.logger.info({ userId, profileId: data?.id }, 'Profile retrieved successfully')
      return convertDbProfile(data)
    } catch (error) {
      return this.handleError(error, 'fetch profile', { userId })
    }
  }

  /**
   * Create a new profile for a user
   * @param userId - The ID of the user
   * @param profileData - The profile data (can be partial, missing fields will get defaults)
   * @returns The created profile
   */
  async createProfile(userId: string, profileData: Partial<Profile>): Promise<Profile> {
    try {
      this.logger.debug({ userId, profileData }, 'Creating user profile')
      const dbData = convertAppProfileForInsert(profileData)

      const { data, error } = await this.client
        .from('profiles')
        .insert({ id: userId, ...dbData })
        .select()
        .single()

      if (error) throw error

      this.logger.info({ userId, profileId: data.id }, 'Profile created successfully')
      return convertDbProfile(data)
    } catch (error) {
      return this.handleError(error, 'create profile', { userId })
    }
  }

  /**
   * Update an existing profile
   * @param userId - The ID of the user
   * @param updates - The fields to update (all optional)
   * @returns The updated profile
   */
  async updateProfile(userId: string, updates: Partial<ProfileUpdate>): Promise<Profile> {
    try {
      this.logger.debug({ userId, updates }, 'Updating profile')
      const dbData = convertAppProfileForUpdate(updates)

      const { data, error } = await this.client.from('profiles').update(dbData).eq('id', userId).select().single()

      if (error) throw error

      this.logger.info({ userId, profileId: data.id }, 'Profile updated successfully')
      return convertDbProfile(data)
    } catch (error) {
      return this.handleError(error, 'update profile', { userId })
    }
  }

  /**
   * Upload a profile avatar
   * @param userId - The ID of the user
   * @param file - The image file to upload
   * @returns The URL of the uploaded avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      this.logger.debug({ userId, fileName: file.name }, 'Uploading avatar')

      // Server-side validation
      const validation = validateAndSanitizeFile(file, AVATAR_VALIDATION)
      
      if (!validation.isValid) {
        this.logger.warn(
          { userId, fileName: file.name, error: validation.error },
          'Avatar validation failed'
        )
        throw new Error(validation.error || 'Invalid file')
      }

      const fileExt = file.name.split('.').pop()
      // Use crypto.randomUUID() to prevent filename collisions
      const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const fileName = validation.sanitizedName || `${userId}-${uniqueId}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      // Upload file to storage
      const { error: uploadError } = await this.client.storage.from(PROFILE_BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = this.client.storage.from(PROFILE_BUCKET).getPublicUrl(filePath)

      // Transaction-like behavior: Update profile with new avatar URL
      // If this fails, the uploaded file remains in storage (orphaned)
      // Consider implementing cleanup job for orphaned files
      try {
        await this.updateProfile(userId, { avatar_url: publicUrl })
      } catch (updateError) {
        // Attempt to clean up uploaded file on profile update failure
        await this.client.storage.from(PROFILE_BUCKET).remove([filePath])
        throw updateError
      }

      this.logger.info({ userId, publicUrl }, 'Avatar uploaded successfully')
      return publicUrl
    } catch (error) {
      return this.handleError(error, 'upload avatar', { userId })
    }
  }
}
