import { Box, Button, Container, Typography } from '@mui/material'
import Link from 'next/link'

export function CTASection(): JSX.Element {
  return (
    <Container maxWidth="md">
      <Box textAlign="center" sx={{ p: 2, m: 4, mb: 8 }}>
        <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          Ready to get started?
        </Typography>
        <Typography variant="h6" color="text.secondary" component="p" sx={{ mb: 4 }}>
          Join thousands of developers building amazing applications with Structura
        </Typography>
        <Button component={Link} href="/register" variant="contained" size="large">
          Create an account
        </Button>
      </Box>
    </Container>
  )
}
