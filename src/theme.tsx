'use client'

import { createTheme, responsiveFontSizes } from '@mui/material/styles'

export const simpleTheme = responsiveFontSizes(
  createTheme({
    modularCssLayers: '@layer theme, base, mui, components, utilities;',
    cssVariables: {
      colorSchemeSelector: 'class',
    },
    colorSchemes: {
      light: {
        palette: {
          mode: 'light',
          background: {
            default: '#e9e7e7ff',
            paper: '#f5f6f6ff',
          },
        },
      },
      dark: {
        palette: {
          mode: 'dark',
          background: {
            default: '#39393bff',
            paper: '#414040ff',
          },
        },
      },
    },
    typography: {
      fontFamily: 'var(--font-Inter)',
    },
    components: {
      MuiPaper: {
        defaultProps: {
          elevation: 1,
        },
      },
      MuiAppBar: {
        defaultProps: {
          color: 'default',
          enableColorOnDark: true,
        },
      },
    },
  })
)

// Export the theme for use in the app
export default simpleTheme
