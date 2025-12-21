'use client'

import { Box, useTheme } from '@mui/material'
import type React from 'react'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps): JSX.Element {
  const theme = useTheme()
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box
        component="main"
        id="main-layout-content"
        sx={{
          flex: 1, // This will make the content expand to fill available space
          pt: '56px', // Fixed padding for header
          pb: 3,
          // Smooth transition when padding changes
          transition: theme.transitions.create('padding', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}>
        {children}
      </Box>
    </Box>
  )
}
