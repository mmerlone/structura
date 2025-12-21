import type {
  LoginFormInput,
  RegisterFormInput,
  ResetPasswordEmailFormInput,
  ResetPasswordPassFormInput,
  UpdatePasswordFormInput,
} from '@/types/auth.types'
import { AuthOperationsEnum } from '@/types/enums'

/**
 * Default values for each authentication operation
 * Provides clean form state and proper typing for form resets
 * Reuses existing types from @/types/auth.types.ts
 */

export const authFormDefaults = {
  [AuthOperationsEnum.LOGIN]: {
    email: '',
    password: '',
  } satisfies LoginFormInput,

  [AuthOperationsEnum.REGISTER]: {
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    acceptTerms: false,
  } satisfies RegisterFormInput,

  [AuthOperationsEnum.FORGOT_PASSWORD]: {
    email: '',
  } satisfies ResetPasswordEmailFormInput,

  [AuthOperationsEnum.RESET_PASSWORD]: {
    password: '',
    confirmPassword: '',
  } satisfies ResetPasswordPassFormInput,

  [AuthOperationsEnum.UPDATE_PASSWORD]: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  } satisfies UpdatePasswordFormInput,
} as const
