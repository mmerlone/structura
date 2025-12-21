'use client'

import { CssBaseline } from '@mui/material'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { ReactNode } from 'react'

import { simpleTheme } from '@/theme'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  return (
    <MuiThemeProvider theme={simpleTheme} modeStorageKey="mui-mode" forceThemeRerender>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}
