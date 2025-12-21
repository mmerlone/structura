import { AuthOperationsEnum } from '@/types/enums'

/**
 * User interface text and labels for authentication forms
 * Centralized text management for consistency and easy localization
 * Follows DRY principles with shared base configuration
 */

// Base operation labels - single source of truth for each context
const baseLabels = {
  [AuthOperationsEnum.LOGIN]: 'Sign In',
  [AuthOperationsEnum.REGISTER]: 'Create Account',
  [AuthOperationsEnum.FORGOT_PASSWORD]: 'Reset Password', // Title: What user is doing
  [AuthOperationsEnum.RESET_PASSWORD]: 'Set New Password', // Title: What user is doing
  [AuthOperationsEnum.UPDATE_PASSWORD]: 'Change Password', // Title: What user is doing
} as const

const buttonLabels = {
  [AuthOperationsEnum.LOGIN]: 'Sign In',
  [AuthOperationsEnum.REGISTER]: 'Create Account',
  [AuthOperationsEnum.FORGOT_PASSWORD]: 'Send Reset Link', // Button: What action they're taking
  [AuthOperationsEnum.RESET_PASSWORD]: 'Reset Password', // Button: What action they're taking
  [AuthOperationsEnum.UPDATE_PASSWORD]: 'Update Password', // Button: What action they're taking
} as const

// Type definitions for proper indexing
type OperationLabels = Record<AuthOperationsEnum, string>

export const uiText = {
  // Page titles - use appropriate title text
  titles: baseLabels as OperationLabels,

  // Button labels - use appropriate button text
  buttons: buttonLabels as OperationLabels,

  // Field labels
  fields: {
    email: 'Email',
    password: 'Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    name: 'Full Name',
    acceptTerms: 'I agree to the Terms of Service and Privacy Policy',
  },

  // Success messages
  success: {
    emailSent: 'Check your email',
    emailSentDescription: "We've sent you a password reset link. Please check your email.",
    passwordUpdated: 'Password updated successfully',
    accountCreated: 'Account created successfully',
    signedIn: 'Signed in successfully',
  },

  // Error messages
  errors: {
    generic: 'An error occurred',
    invalidCredentials: 'Invalid email or password',
    emailNotFound: 'No account found with this email address',
    passwordTooWeak: 'Password does not meet requirements',
    networkError: 'Network error. Please check your connection.',
    sessionExpired: 'Your session has expired. Please sign in again.',
  },

  // Navigation links
  links: {
    forgotPassword: 'Forgot password?',
    signUp: "Don't have an account? Sign up",
    signIn: 'Already have an account? Sign in',
    backToSignIn: 'Back to Sign In',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
  },

  // Loading states
  loading: {
    signingIn: 'Signing in...',
    creatingAccount: 'Creating account...',
    sendingResetLink: 'Sending reset link...',
    resettingPassword: 'Resetting password...',
    updatingPassword: 'Updating password...',
  },

  // Social login
  social: {
    orContinueWith: 'Or continue with',
    signInWithGoogle: 'Sign in with Google',
    signInWithGitHub: 'Sign in with GitHub',
    signInWithMicrosoft: 'Sign in with Microsoft',
  },
} as const
