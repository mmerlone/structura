import { ErrorCodes } from '@/lib/error/codes'
import { BusinessError } from '@/lib/error/errors'
import { handleClientError as handleError } from '@/lib/error'
import type { DatabaseErrorContext, ValidationErrorContext } from '@/types/error.types'
import { ProfileClientService } from '@/lib/supabase/services/database/profiles/profile.client'
import type { Profile } from '@/types/database'
import { ProfileOperationEnum } from '@/types/enums'

/**
 * Create proper database error context for profile operations
 */
function createDatabaseContext(
  userId: string,
  operation: ProfileOperationEnum,
  additional?: Record<string, unknown>
): DatabaseErrorContext {
  return {
    operation,
    userId,
    table: 'profiles',
    ...additional,
  }
}

/**
 * Create validation error context for file operations
 */
function createValidationContext(
  userId: string,
  operation: ProfileOperationEnum,
  fileContext: Record<string, unknown>
): ValidationErrorContext {
  return {
    operation,
    userId,
    field: 'avatar',
    validationErrors: [fileContext],
    validationDetails: fileContext,
  }
}

/**
 * Handle validation errors for missing required inputs
 */
function validateRequiredInput(condition: boolean, fieldName: string, operation: ProfileOperationEnum): void {
  if (!condition) {
    throw new BusinessError({
      code: ErrorCodes.validation.invalidInput(),
      message: `${fieldName} is required for ${operation}`,
      statusCode: 400,
      context: { operation },
    })
  }
}

/**
 * Load a profile for the provided user id.
 * @param {string|undefined} userId
 * @returns {Promise<Profile | null>}
 */
export async function loadProfile(userId?: string): Promise<Profile | null> {
  if (userId === null || userId === undefined) return null

  const profileService = new ProfileClientService()
  try {
    const profile = await profileService.getProfile(userId)
    return profile ?? null
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.debug('Profile loading aborted for user:', userId)
      return null
    }

    // Use centralized error handling with proper context
    throw handleError(err, createDatabaseContext(userId, ProfileOperationEnum.LOAD))
  }
}

/**
 * Update a user's profile.
 */
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
  validateRequiredInput(!!userId, 'User ID', ProfileOperationEnum.UPDATE)

  const profileService = new ProfileClientService()
  try {
    const updated = await profileService.updateProfile(userId, updates)
    return updated
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.debug('Profile update aborted for user:', userId)
      throw err
    }

    // Use centralized error handling with proper context
    throw handleError(err, createDatabaseContext(userId, ProfileOperationEnum.UPDATE, { updates }))
  }
}

/**
 * Upload an avatar file for the user and return the avatar URL.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  validateRequiredInput(!!userId, 'User ID', ProfileOperationEnum.UPLOAD)

  const profileService = new ProfileClientService()
  try {
    const url = await profileService.uploadAvatar(userId, file)
    return url
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.debug('Avatar upload aborted for user:', userId)
      throw err
    }

    // Use centralized error handling with proper validation context for file errors
    const fileContext = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    }

    throw handleError(err, createValidationContext(userId, ProfileOperationEnum.UPLOAD, fileContext))
  }
}

/**
 * Create a profile if it doesn't exist (helper used by server/middleware flows).
 */
export async function createProfileIfMissing(userId: string, data: Partial<Profile>): Promise<Profile> {
  validateRequiredInput(!!userId, 'User ID', ProfileOperationEnum.CREATE_IF_MISSING)

  const profileService = new ProfileClientService()

  try {
    const existing = await profileService.getProfile(userId)
    if (existing) return existing

    const created = await profileService.createProfile(userId, data)
    return created
  } catch (err) {
    // Use centralized error handling with proper context
    throw handleError(err, createDatabaseContext(userId, ProfileOperationEnum.CREATE_IF_MISSING, { data }))
  }
}
