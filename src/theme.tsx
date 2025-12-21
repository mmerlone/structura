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
            paper: '#fefdfdff',
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
        styleOverrides: {
          elevation1: {
            '.light &': {
              boxShadow: '-5px -5px 10px rgba(255, 255, 255, 0.75), 5px 5px 10px rgba(0, 0, 0, 0.25)',
            },
            '.dark &': {
              boxShadow: '-5px -5px 10px rgba(255, 255, 255, 0.2), 5px 5px 10px rgba(0, 0, 0, 0.50)',
            },
          },
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
