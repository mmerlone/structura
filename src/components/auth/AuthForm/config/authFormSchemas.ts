import {
  forgotPasswordEmailSchema,
  forgotPasswordPassSchema,
  loginSchema,
  registerSchema,
  updatePasswordSchema,
  type LoginFormInput,
  type RegisterFormInput,
  type ResetPasswordEmailFormInput,
  type ResetPasswordPassFormInput,
  type UpdatePasswordFormInput,
} from '@/lib/validators'
import { AuthOperationsEnum } from '@/types/enums'

/**
 * Integration layer that maps existing validation schemas to auth operations
 * Reuses existing validators from @/lib/validators.ts to avoid duplication
 */

// Re-export existing schemas for consistency
export const authFormSchemas = {
  [AuthOperationsEnum.LOGIN]: loginSchema,
  [AuthOperationsEnum.REGISTER]: registerSchema,
  [AuthOperationsEnum.FORGOT_PASSWORD]: forgotPasswordEmailSchema,
  [AuthOperationsEnum.RESET_PASSWORD]: forgotPasswordPassSchema,
  [AuthOperationsEnum.UPDATE_PASSWORD]: updatePasswordSchema,
} as const

// Union type for all form data using original type names
export type AuthFormData =
  | LoginFormInput
  | RegisterFormInput
  | ResetPasswordEmailFormInput
  | ResetPasswordPassFormInput
  | UpdatePasswordFormInput
