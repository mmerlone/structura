'use client'

import { Box, Checkbox, FormControlLabel, Link, TextField, Typography } from '@mui/material'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useFormContext } from 'react-hook-form'

import { AuthOperationsEnum } from '@/types/enums'

type AuthFormFieldsProps = {
  operation: AuthOperationsEnum
  isLoading?: boolean
}

export function AuthFormFields({ operation, isLoading = false }: AuthFormFieldsProps): JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const renderEmailField = (): JSX.Element => (
    <motion.div
      layout
      key="email-field"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.68 }}>
      <TextField
        label="Email"
        type="email"
        {...register('email')}
        error={!!errors.email}
        helperText={errors.email?.message as string}
        fullWidth
        margin="normal"
        disabled={isLoading}
      />
    </motion.div>
  )

  const renderPasswordField = (name: string, label: string): JSX.Element => (
    <motion.div
      layout
      key={`${name}-field`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.68 }}>
      <TextField
        label={label}
        type="password"
        {...register(name)}
        error={!!errors[name]}
        helperText={errors[name]?.message as string}
        fullWidth
        margin="normal"
        disabled={isLoading}
      />
    </motion.div>
  )

  const renderNameField = (): JSX.Element => (
    <motion.div
      layout
      key="name-field"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.68 }}>
      <TextField
        label="Full Name"
        {...register('name')}
        error={!!errors.name}
        helperText={errors.name?.message as string}
        fullWidth
        margin="normal"
        disabled={isLoading}
      />
    </motion.div>
  )

  const renderTermsCheckbox = (): JSX.Element => (
    <motion.div
      layout
      key="terms-checkbox"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.68 }}>
      <FormControlLabel
        control={<Checkbox {...register('acceptTerms')} disabled={isLoading} />}
        label={
          <Typography variant="body2">
            I agree to the{' '}
            <Link href="/terms" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
          </Typography>
        }
      />
    </motion.div>
  )

  return (
    <Box component="div">
      <LayoutGroup>
        <motion.div layout transition={{ layout: { duration: 0.25, ease: [0.2, 0, 0.2, 1] } }}>
          <AnimatePresence mode="wait" initial={false}>
            {operation !== AuthOperationsEnum.RESET_PASSWORD && operation !== AuthOperationsEnum.UPDATE_PASSWORD && (
              <>
                {renderEmailField()}
                {operation !== AuthOperationsEnum.FORGOT_PASSWORD && (
                  <>
                    {renderPasswordField('password', 'Password')}

                    {operation === AuthOperationsEnum.REGISTER && (
                      <>
                        {renderPasswordField('confirmPassword', 'Confirm Password')}
                        {renderNameField()}
                        {renderTermsCheckbox()}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {operation === AuthOperationsEnum.RESET_PASSWORD && (
              <>
                {renderPasswordField('password', 'New Password')}
                {renderPasswordField('confirmPassword', 'Confirm New Password')}
              </>
            )}

            {operation === AuthOperationsEnum.UPDATE_PASSWORD && (
              <>
                {renderPasswordField('currentPassword', 'Current Password')}
                {renderPasswordField('newPassword', 'New Password')}
                {renderPasswordField('confirmPassword', 'Confirm New Password')}
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
    </Box>
  )
}
