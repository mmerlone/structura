import { Box, Container, Skeleton } from '@mui/material'

export function PageSkeleton(): JSX.Element {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Page title */}
        <Skeleton variant="text" width="40%" height={48} sx={{ mb: 2 }} />

        {/* Subtitle */}
        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 4 }} />

        {/* Content cards */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>
    </Container>
  )
}
