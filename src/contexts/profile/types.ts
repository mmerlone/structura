import type { Profile } from '@/types/database'

/** Options accepted by controller methods. */
export interface ControllerOptions {
  signal?: AbortSignal
}

export type LoadProfileResult = Profile | null

export interface ProfileController {
  loadProfile(userId?: string, opts?: ControllerOptions): Promise<LoadProfileResult>
  updateProfile(userId: string, updates: Partial<Profile>, opts?: ControllerOptions): Promise<Profile>
  uploadAvatar(userId: string, file: File, opts?: ControllerOptions): Promise<string>
  createProfileIfMissing(userId: string, data: Partial<Profile>, opts?: ControllerOptions): Promise<Profile>
}
