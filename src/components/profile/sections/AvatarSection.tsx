import { CameraAlt, Delete } from '@mui/icons-material'
import { Avatar, Box, CircularProgress, IconButton, Tooltip } from '@mui/material'
import { useCallback, useRef, useState } from 'react'

import { useAuthContext } from '@/components/providers'
import { useProfile } from '@/hooks/useProfile'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function AvatarSection(): JSX.Element {
  const { authUser } = useAuthContext()
  const { profile, uploadAvatar, updateProfile } = useProfile(authUser?.id)
  const [isUploading, setIsUploading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      event.preventDefault() // Prevent any form submission
      event.stopPropagation() // Stop event bubbling

      const file = event.target.files?.[0]
      if (!file) return

      if (!VALID_FILE_TYPES.includes(file.type)) {
        console.warn('Invalid file type for avatar upload:', file.type)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        console.warn('File size too large for avatar upload:', file.size)
        return
      }

      try {
        setIsUploading(true)
        console.log('Starting avatar upload:', { fileName: file.name, fileSize: file.size })

        const uploadedUrl = await uploadAvatar(file)
        if (uploadedUrl) {
          await updateProfile({ avatar_url: uploadedUrl })
          console.log('Avatar upload completed successfully:', { uploadedUrl })
        }
      } catch (error) {
        console.error('Failed to update avatar:', error)
      } finally {
        setIsUploading(false)
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [uploadAvatar, updateProfile]
  )

  const handleRemoveAvatar = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault() // Prevent any form submission
      event.stopPropagation() // Stop event bubbling

      try {
        setIsUploading(true)
        console.log('Starting avatar removal')
        await updateProfile({ avatar_url: null })
        console.log('Avatar removal completed successfully')
      } catch (error) {
        console.error('Failed to remove avatar:', error)
      } finally {
        setIsUploading(false)
      }
    },
    [updateProfile]
  )

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 2,
      }}>
      <Box
        sx={{
          position: 'relative',
          width: { xs: 150, sm: 180, md: 200 },
          height: { xs: 150, sm: 180, md: 200 },
          '&:hover .avatar-overlay': {
            opacity: 1,
          },
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <Avatar
          src={profile?.avatar_url ?? ''}
          alt={profile?.display_name ?? 'User'}
          sx={{
            width: '100%',
            height: '100%',
            fontSize: '4rem',
            transition: 'opacity 0.3s ease',
            opacity: isHovered ? 0.8 : 1,
          }}
        />

        {isHovered && (
          <Box
            className="avatar-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'end',
              justifyContent: 'space-between',
              gap: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
              opacity: 0,
              transition: 'opacity 0.3s ease',
            }}>
            <Tooltip title="Change photo">
              <IconButton
                color="primary"
                component="label"
                disabled={isUploading}
                sx={{
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}>
                <CameraAlt />
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept={VALID_FILE_TYPES.join(',')}
                  onChange={handleFileChange}
                />
              </IconButton>
            </Tooltip>

            {profile?.avatar_url != null && (
              <Tooltip title="Remove photo">
                <IconButton
                  color="error"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  sx={{
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      backgroundColor: 'error.light',
                      color: 'error.contrastText',
                    },
                  }}>
                  <Delete />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {isUploading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
            }}>
            <CircularProgress color="primary" />
          </Box>
        )}
      </Box>
    </Box>
  )
}
