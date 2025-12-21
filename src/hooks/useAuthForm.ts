import { zodResolver } from '@hookform/resolvers/zod'
import type { DefaultValues, UseFormReturn } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { ZodType } from 'zod'

import {
  forgotPasswordEmailSchema,
  forgotPasswordPassSchema,
  loginSchema,
  registerSchema,
  updatePasswordSchema,
} from '@/lib/validators'
import type { FormTypeMap } from '@/types/auth.types'
import { AuthOperationsEnum } from '@/types/enums'

const schemaMap = {
  [AuthOperationsEnum.LOGIN]: loginSchema,
  [AuthOperationsEnum.REGISTER]: registerSchema,
  [AuthOperationsEnum.FORGOT_PASSWORD]: forgotPasswordEmailSchema,
  [AuthOperationsEnum.RESET_PASSWORD]: forgotPasswordPassSchema,
  [AuthOperationsEnum.UPDATE_PASSWORD]: updatePasswordSchema,
} satisfies Record<AuthOperationsEnum, ZodType<unknown>>

const defaultValuesMap: { [K in AuthOperationsEnum]: FormTypeMap[K] } = {
  [AuthOperationsEnum.LOGIN]: {
    email: '',
    password: '',
  },
  [AuthOperationsEnum.REGISTER]: {
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    acceptTerms: false,
  },
  [AuthOperationsEnum.FORGOT_PASSWORD]: {
    email: '',
  },
  [AuthOperationsEnum.RESET_PASSWORD]: {
    password: '',
    confirmPassword: '',
  },
  [AuthOperationsEnum.UPDATE_PASSWORD]: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
}

/**
 * Authentication form hook that provides form management with validation for different auth operations.
 *
 * This hook integrates React Hook Form with Zod validation schemas to provide
 * type-safe form handling for authentication operations including login, registration,
 * password reset, and password update forms.
 *
 * @template {AuthOperationsEnum} T - The authentication operation type
 * @param {T} operation - The authentication operation type (login, register, etc.)
 * @returns {UseFormReturn<FormTypeMap[T]>} React Hook Form instance with:
 * - Form state and validation
 * - Form methods (register, handleSubmit, etc.)
 * - Error handling
 * - Form submission capabilities
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const form = useAuthForm(AuthOperationsEnum.LOGIN);
 *
 *   const onSubmit = form.handleSubmit(async (data) => {
 *     // data is typed as { email: string, password: string }
 *     console.log('Login data:', data);
 *   });
 *
 *   return (
 *     <form onSubmit={onSubmit}>
 *       <input {...form.register('email')} />
 *       {form.formState.errors.email && (
 *         <span>{form.formState.errors.email.message}</span>
 *       )}
 *       <button type="submit">Login</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function RegisterForm() {
 *   const form = useAuthForm(AuthOperationsEnum.REGISTER);
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <input {...form.register('email')} />
 *       <input {...form.register('password')} />
 *       <input {...form.register('confirmPassword')} />
 *       <input {...form.register('name')} />
 *       <input {...form.register('acceptTerms')} type="checkbox" />
 *       <button type="submit">Register</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useAuthForm<T extends AuthOperationsEnum>(operation: T): UseFormReturn<FormTypeMap[T]> {
  const schema = schemaMap[operation]
  const defaultValues = defaultValuesMap[operation]

  return useForm<FormTypeMap[T]>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: defaultValues as DefaultValues<FormTypeMap[T]>,
  })
}
