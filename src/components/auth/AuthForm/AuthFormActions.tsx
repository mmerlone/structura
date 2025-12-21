import { Button, CircularProgress } from '@mui/material'

import { uiText } from './config/uiText'
import { LoginButtons } from './LoginButtons'

import { AuthOperationsEnum } from '@/types/enums'

/**
 * Form actions component that renders submit button and social login options
 * Dynamically adjusts based on the current operation
 */

interface AuthFormActionsProps {
  operation: AuthOperationsEnum
  isLoading: boolean
}

export function AuthFormActions({ operation, isLoading }: AuthFormActionsProps): JSX.Element {
  const buttonText = uiText.buttons[operation]

  return (
    <>
      <Button type="submit" fullWidth variant="contained" color="primary" disabled={isLoading} sx={{ mt: 3, mb: 2 }}>
        {isLoading ? <CircularProgress size={24} /> : buttonText}
      </Button>

      {/* Show social login for login and register operations */}
      {(operation === AuthOperationsEnum.LOGIN || operation === AuthOperationsEnum.REGISTER) && (
        <LoginButtons disabled={isLoading} />
      )}
    </>
  )
}
