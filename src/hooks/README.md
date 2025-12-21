# Hooks Library

This directory contains custom React hooks that provide reusable stateful logic for components. Each hook is designed to be composable and follows React best practices.

## 🏗️ **Available Hooks**

### Authentication Hooks

- `useAuth` - Authentication state and methods
- `useAuthForm` - Form handling for auth flows
- `useSession` - Current user session
- `useSignIn` - Sign in functionality
- `useSignUp` - User registration
- `useSignOut` - Sign out functionality

### UI/UX Hooks

- `useCookieConsent` - GDPR cookie management
- `useIsMobile` - Viewport detection
- `useProfile` - User profile data
- `useTheme` - Theme management

### Data Hooks

- `useQuery` - Data fetching
- `useMutation` - Data modification

## 🚀 **Basic Usage**

```typescript
import { useAuth, useProfile } from '@/hooks'

function UserProfile() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  // ...
}
```

## 🛠️ **Creating Hooks**

1. **Basic Hook Structure**:

```typescript
// src/hooks/useFeature.ts
import { useState, useCallback } from 'react'

export function useFeature(initialValue = '') {
  const [state, setState] = useState(initialValue)
  const update = useCallback((value: string) => setState(value), [])
  return { state, update }
}
```

2. **With Logging**:

```typescript
import { createLogger } from '@/lib/logger'

const logger = createLogger({ name: 'useFeature' })

export function useFeature(initialValue = '') {
  const [state, setState] = useState(initialValue)
  const update = useCallback((value: string) => {
    logger.debug('Updating state', { value })
    setState(value)
  }, [])
  return { state, update }
}
```

3. **Documentation Example**:

```typescript
/**
 * Manages feature state with logging
 * @param initialValue - Initial state value (default: '')
 * @returns State and update function
 *
 * @example
 * const { state, update } = useFeature('initial')
 */
```

## 📚 **Hook Guides**

### **useAuth** (`useAuth.ts`)

Manages authentication state and provides auth operations.

**What it does**: Handles user sessions, sign in/out, password management

**How to use**:

```typescript
const { authUser, signIn, signOut, isLoading, error } = useAuth()

// Sign in user
await signIn('user@example.com', 'password')

// Check authentication status
if (authUser) {
  // User is authenticated
}
```

### **useAuthForm** (`useAuthForm.ts`)

Form validation for authentication operations using React Hook Form.

**What it does**: Integrates form validation with Zod schemas

**How to use**:

```typescript
import { AuthOperationsEnum } from '@/types/enums'

function LoginForm() {
  const form = useAuthForm(AuthOperationsEnum.LOGIN)

  const onSubmit = form.handleSubmit(async (data) => {
    // data is typed as { email: string, password: string }
    console.log('Login data:', data)
  })

  return (
    <form onSubmit={onSubmit}>
      <input {...form.register('email')} />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}
    </form>
  )
}
```

### **useCookieConsent** (`useCookieConsent.ts`)

Manages GDPR cookie consent state and preferences.

**What it does**: Handles cookie banner, preferences, and localStorage

**How to use**:

```typescript
const {
  hasConsent,
  preferences,
  acceptAll,
  decline
} = useCookieConsent()

// Show cookie banner
if (hasConsent === null) {
  return <CookieBanner onAccept={acceptAll} onDecline={decline} />
}
```

### **useIsMobile** (`useIsMobile.ts`)

Detects if the current viewport is mobile-sized.

**What it does**: Responsive design helper with SSR safety

**How to use**:

```typescript
const isMobile = useIsMobile()

if (isMobile) {
  return <MobileNavigation />
} else {
  return <DesktopNavigation />
}
```

### **useProfile** (`useProfile.ts`)

Manages user profile data with React Query.

**What it does**: Fetches, updates, and caches profile data

**How to use**:

```typescript
const { profile, isLoading, updateProfile, uploadAvatar } = useProfile(userId)

// Update profile
await updateProfile({ display_name: 'New Name' })

// Upload avatar
await uploadAvatar(file)
```

## 🛠️ **Development Patterns**

### **Hook Structure**

```typescript
// Follow this pattern for new hooks
import { useState, useCallback, useEffect } from 'react'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ name: 'useYourHook' })

export function useYourHook(param: string) {
  const [state, setState] = useState(null)

  // Use useCallback for stable references
  const handleAction = useCallback(async (data: any) => {
    try {
      logger.debug({ data }, 'Performing action')
      // Your logic here
      setState(result)
    } catch (error) {
      logger.error({ error, data }, 'Action failed')
      throw error
    }
  }, [])

  // Use useEffect for side effects
  useEffect(() => {
    if (param) {
      // Your effect logic
    }
  }, [param])

  return {
    state,
    handleAction,
  }
}
```

### **Error Handling**

```typescript
// Use proper error handling in hooks
const [error, setError] = useState<Error | null>(null)

const performAction = useCallback(async () => {
  try {
    setError(null)
    // Your logic
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error({ error }, 'Action failed')
    setError(error)
    throw error
  }
}, [])
```

### **Performance Optimization**

```typescript
// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

// Use useCallback for stable function references
const handleClick = useCallback(
  (id: string) => {
    onItemClick(id)
  },
  [onItemClick]
)
```

## 🔧 **Common Hook Patterns**

### **Data Fetching Hook**

```typescript
export function useData<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(url)
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [url])

  return { data, loading, error }
}
```

### **Local Storage Hook**

```typescript
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      logger.error({ error, key }, 'Failed to read localStorage')
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        logger.error({ error, key }, 'Failed to set localStorage')
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue] as const
}
```

### **Debounce Hook**

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

## 📋 **Hook Development Checklist**

- [ ] Start with `use` prefix
- [ ] Add comprehensive JSDoc with examples
- [ ] Use proper TypeScript types
- [ ] Handle errors gracefully
- [ ] Add logging for debugging
- [ ] Optimize performance with useCallback/useMemo
- [ ] Handle SSR edge cases
- [ ] Write unit tests
- [ ] Follow React hooks rules

## 🔗 **Integration Examples**

### **Combining Hooks**

```typescript
function UserProfile() {
  const { authUser } = useAuth()
  const { profile, updateProfile } = useProfile(authUser?.id)
  const isMobile = useIsMobile()

  if (!authUser || !profile) return <div>Loading...</div>

  return (
    <div>
      <h1>{profile.display_name}</h1>
      {isMobile ? <MobileProfile /> : <DesktopProfile />}
      <button onClick={() => updateProfile({ bio: 'New bio' })}>
        Update Bio
      </button>
    </div>
  )
}
```

### **Custom Hook with Existing Services**

```typescript
export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState([])
  const { client } = useSupabase() // Assuming you have this hook

  useEffect(() => {
    if (!userId) return

    const channel = client
      .channel(`notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev])
      })
      .subscribe()

    return () => channel.unsubscribe()
  }, [userId, client])

  return notifications
}
```

## 🚨 **Best Practices**

### **Do's**

- ✅ Start with `use` prefix
- ✅ Add comprehensive JSDoc documentation
- ✅ Use TypeScript properly
- ✅ Handle loading and error states
- ✅ Use useCallback for functions passed to children
- ✅ Use useMemo for expensive calculations
- ✅ Handle SSR edge cases
- ✅ Follow React hooks rules

### **Don'ts**

- ❌ Call hooks conditionally
- ❌ Use hooks in regular functions
- ❌ Forget dependency arrays
- ❌ Mutate props directly
- ❌ Create hooks that return JSX
- ❌ Ignore error handling

---

**This is a starter template. Create hooks based on your application needs.**
