# Server Actions Audit & Implementation Plan

## Current Server Actions Inventory

### Authentication Actions (/src/lib/auth/actions/server.ts)

- signInWithEmail - User login with email/password
- signUpWithEmail - User registration with validation
- signOut - User logout/session termination
- requestPasswordReset - Send password reset email
- updateUserPassword - Password update (BROKEN for reset flow)

### Location Actions (/src/lib/actions/location.ts)

- detectCountry - IP geolocation with caching

### API Routes

- /api/auth/confirm - Email verification
- /api/sentry-example-api - Error testing

## Organization Recommendation

YES - Centralize in /src/lib/actions

Current structure is scattered:

- /src/lib/auth/actions/server.ts
- /src/lib/actions/location.ts

Proposed structure:
src/lib/actions/

## Actionable Steps Plan

### 1. Create Missing completePasswordReset

```typescript
// src/lib/actions/auth.ts
export const completePasswordReset = withServerActionErrorHandling(
  async (newPassword: string): Promise<AuthResponse> => {
    // No currentPassword validation needed
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return createServerActionSuccess(undefined, 'Password reset completed')
  }
)
```

### 2. Profile/Avatar Server Actions vs Client Context

Current: Client-side context with direct Supabase calls
Recommendation: Hybrid approach - Server actions with React Query

#### Hybrid Architecture Benefits:

- **Server actions** for security, validation, and data operations
- **React Query** for caching, optimistic updates, and client state
- **Best of both worlds**: Security + UX

#### Proposed Implementation:

```typescript
// Server actions (/src/lib/actions/profile.ts)
export const updateProfile = withServerActionErrorHandling(
  async (userId: string, updates: Partial<Profile>): Promise<ProfileResponse> => {
    // Server-side validation and update
  }
)

// Client hook (modified useProfile.ts)
const { mutateAsync: updateProfile } = useMutation({
  mutationFn: async (updates: Partial<Profile>) => {
    return updateProfileAction(userId, updates) // Call server action
  },
  // Keep React Query benefits: optimistic updates, caching, etc.
})
```

### 3. Email Validation Resend

```typescript
export const resendVerificationEmail = withServerActionErrorHandling(async (email: string): Promise<AuthResponse> => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })
  return createServerActionSuccess(undefined, 'Verification email sent')
})
```

## Priority Order

1. **High**: completePasswordReset (blocks password reset flow)
2. **Medium**: Profile/avatar server actions (consistency)
3. **Low**: Email resend (nice-to-have)

## Benefits

### Hybrid Approach Advantages:

- **Security**: Server-side validation prevents client tampering
- **Performance**: React Query caching reduces server requests
- **UX**: Optimistic updates provide immediate feedback
- **Consistency**: Unified error handling with auth actions
- **Maintainability**: Clear separation of concerns
- **Type Safety**: End-to-end type safety from server to client

### Migration Strategy:

1. **Phase 1**: Create server actions alongside existing client code
2. **Phase -2**: Update useProfile hook to call server actions
3. **Phase 3**: Remove direct Supabase client calls
4. **Phase 4**: Optimize and add advanced features

### Implementation Details:

- Keep existing React Query infrastructure
- Replace `ProfileClientService` calls with server action calls
- Maintain optimistic updates and error handling
- Add server-side validation for all operations
- Preserve loading states and error boundaries
