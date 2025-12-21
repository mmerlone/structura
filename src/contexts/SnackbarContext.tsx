import { Alert, AlertColor, Snackbar } from '@mui/material'
import { createContext, useCallback, useContext, useState } from 'react'

type SnackbarContextType = {
  showMessage: (message: string, severity?: AlertColor) => void
  showError: (message: string) => void
  showSuccess: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined)

export function SnackbarProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<AlertColor>('info')

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string): void => {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
  }

  const showMessage = useCallback((msg: string, sev: AlertColor = 'info'): void => {
    setMessage(msg)
    setSeverity(sev)
    setOpen(true)
  }, [])

  const showError = useCallback((msg: string): void => showMessage(msg, 'error'), [showMessage])
  const showSuccess = useCallback((msg: string): void => showMessage(msg, 'success'), [showMessage])
  const showWarning = useCallback((msg: string): void => showMessage(msg, 'warning'), [showMessage])
  const showInfo = useCallback((msg: string): void => showMessage(msg, 'info'), [showMessage])

  return (
    <SnackbarContext.Provider value={{ showMessage, showError, showSuccess, showWarning, showInfo }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }} variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}

export function useSnackbar(): SnackbarContextType {
  const context = useContext(SnackbarContext)
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider')
  }
  return context
}
