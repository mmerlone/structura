import LabelledToggle from '@/components/layout/LabelledToggle'
import type { LabelledToggleOption } from '@/types'
import { AuthOperationsEnum } from '@/types/enums'

interface AuthOperationSelectorProps {
  currentOperation: AuthOperationsEnum
  onOperationChange: (operation: AuthOperationsEnum) => void
  disabled?: boolean
}

/**
 * Segmented control for switching between authentication operations.
 * Renders the reusable `LabelledToggle` to ensure WCAG 2.2 semantics using native radios.
 * Controlled via `currentOperation`/`onOperationChange`; supports `disabled` and full-width layout.
 */
export function AuthOperationSelector({
  currentOperation,
  onOperationChange,
  disabled = false,
}: AuthOperationSelectorProps): JSX.Element {
  // Define the operations that users can switch between
  const operations: ReadonlyArray<LabelledToggleOption<AuthOperationsEnum>> = [
    { value: AuthOperationsEnum.LOGIN, label: 'Sign In' },
    { value: AuthOperationsEnum.REGISTER, label: 'Sign Up' },
    // { value: AuthOperationsEnum.FORGOT_PASSWORD, label: "Forgot Password" },
  ]

  return (
    <LabelledToggle
      ariaLabel="authentication operation selector"
      options={operations}
      value={currentOperation}
      onChange={onOperationChange}
      disabled={disabled}
      fullWidth
    />
  )
}
