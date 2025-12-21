# Structura

[![Next.js](https://img.shields.io/badge/Next.js-15.5.6-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MUI](https://img.shields.io/badge/MUI-7.3.4-007FFF?style=flat&logo=mui)](https://mui.com/)
[![Supabase](https://img.shields.io/badge/Supabase-0.7.0-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready Next.js 15 application template with **clean architecture**, authentication, Material UI, and TypeScript. Built for developers who want to ship fast with best practices.

## TODO before launch:

- Google Analytics
- Google reCaptcha
- Meta assets (og, etc from site.ts)
- i18n
- RBAC (https://www.npmjs.com/package/@rbac/rbac?)
- Google Geolocation (https://developers.google.com/maps/documentation/geolocation/overview)

## 📑 **Table of Contents**

- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Using Structure as a Starting Point](#-using-structure-as-a-starting-point)
- [Core Dependencies](#core-dependencies)
- [Deployment](#-deployment)
- [Available Scripts](#-available-scripts)
- [Security Features](#️-security-features)
- [Contributing](#-contributing)

## 🎯 **Key Features**

### **🏗️ Clean Architecture**

- **Layered Architecture** - Components → Services → Database
- **Explicit Dependencies** - No magic, clear client injection
- **KISS Principle** - Clean, maintainable code
- **Service Layer** - Clean database operations with error handling

### **🔐 Authentication**

- Email/password auth with Supabase
- Email verification and password recovery
- Protected routes and middleware
- Session management

### **🎨 UI/UX**

- Material UI v7 with theming
- Light/dark mode support
- Responsive design
- WCAG 2.1 accessibility

### **⚡ Performance**

- Next.js 15 App Router
- React Server Components
- Code splitting and lazy loading
- Optimized builds

### **🔧 Developer Experience**

- Full TypeScript support
- ESLint + Prettier + Husky
- Pre-configured CI/CD
- Sentry error tracking

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 18+
- pnpm 8+
- Supabase account

### **Installation**

```bash
# 1. Clone the template
git clone https://github.com/mmerlone/structura.git your-project
cd your-project

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.sample .env.local
# Edit .env.local with your API keys (see detailed setup below)

# 4. Start development
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) → Your app is running!

> **📋 Next Steps**: After cloning, follow the detailed environment setup guide below to configure your API keys.

## 📁 **Project Structure**

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes
│   ├── api/               # API endpoints
│   └── [pages]/           # App pages
├── src/
│   ├── components/        # UI components
│   ├── hooks/            # Custom React hooks with React Query
│   ├── lib/              # Core libraries
│   │   ├── supabase/     # Supabase integration
│   │   │   ├── client.ts  # Browser client
│   │   │   ├── server.ts  # Server client
│   │   │   └── services/ # Service layer
│   │   └── ...
│   ├── middleware/       # Next.js middleware
│   └── types/           # TypeScript types
├── public/              # Static assets
└── supabase/           # Database configuration
    ├── init/          # Database initialization scripts
    │   └── init.sql   # Bootstrap SQL script for fresh database
    └── migrations/    # Database migrations
```

### **🏗️ Architecture Pattern**

```
Components → Services → Database
```

**Key Principles:**

- **Explicit Injection**: Services require explicit Supabase client
- **Direct Instantiation**: No factories or magic patterns
- **Clear Boundaries**: Server vs client code separation
- **Optional Hooks**: Use custom hooks for client state management when needed

## 📚 **Documentation**

### **🏗️ Core Architecture**

- **[Architecture Guide](./docs/architecture.md)** - Clean architecture patterns
- **[Project Structure](./docs/structure.md)** - Directory layout and conventions
- **[API Documentation](./docs/api.md)** - Complete API endpoint reference
- **[Library Architecture](./src/lib/README.md)** - Core libraries and utilities
- **[Hooks Library](./src/hooks/README.md)** - Custom React hooks

### **🔧 Library Documentation**

- **[Logger System](./src/lib/logger/README.md)** - Structured logging with Pino
- **[Supabase Integration](./src/lib/supabase/README.md)** - Database and auth layer
- **[Utils Library](./src/lib/utils/README.md)** - Common utility functions
- **[Validators Library](./src/lib/validators/README.md)** - Zod validation schemas
- **[Middleware Library](./src/middleware/README.md)** - Application middleware

### **🛠️ Development Tools**

- **[Scripts Directory](./scripts/README.md)** - Type generation and build scripts
- **[Database Migrations](./supabase/README.md)** - Database schema migrations

### **📋 Development Guides**

- **[Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute
- **[Error Handling](./src/lib/error/README.md)** - Error management patterns
- **[Database Recreation](./docs/DATABASE-RECREATION.md)** - Database recreation workflow
- **[Rate Limiting Setup](./docs/rate-limiting.md)** - Production rate limiting configuration

## 🎯 **Using Structure as a Starting Point**

### **1. Clone and Customize**

```bash
# Clone the template
git clone https://github.com/mmerlone/structura.git your-project
cd your-project

# Update package.json with your project info
npm pkg set name="your-project-name"
npm pkg set description="Your project description"
npm pkg set repository="https://github.com/your-name/your-project"

# Install dependencies
pnpm install
```

### **2. Set Up Environment Variables**

```bash
# Copy the sample environment file
cp .env.sample .env.local

# Edit the file with your actual API keys
nano .env.local  # or use your preferred editor
```

#### **Required: Supabase Setup**

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Sign up and create a new project
   - Choose your database region

2. **Get Supabase Credentials**
   - Go to Project Settings → API
   - Copy **Project URL** and **anon public** key
   - Extract **Project ID** from your URL (e.g., `https://[project_id].supabase.co`)
   - Update your `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your_supabase_project_id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_PROJECT_ID=your_supabase_project_id
   ```

#### **Optional: Sentry Error Tracking**

1. **Initialize Sentry Plugin**

   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

   This will create `.env.sentry-build-plugin` file and configure Sentry for your project.

2. **Create Sentry Project**
   - Go to [sentry.io](https://sentry.io)
   - Create a new organization and project
   - Select "Next.js" as the platform

3. **Get Sentry Credentials**
   - Go to Settings → Client Keys (DSN)
   - Copy the DSN value
   - Go to Settings → Auth Tokens
   - Create a new auth token with required permissions
   - Update your `.env.local`:

   ```env
   SENTRY_DSN=your_sentry_dsn
   SENTRY_AUTH_TOKEN=your_sentry_auth_token
   ```

4. **Complete Setup**
   - The wizard will automatically configure:
     - `sentry.client.config.ts` and `sentry.server.config.ts`
     - `next.config.mjs` with Sentry webpack plugin
     - `instrumentation.ts` for performance monitoring
   - For detailed setup guide, see [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

#### **Optional: IP Geolocation**

1. **Get IPGeolocation API Key**
   - Go to [ipgeolocation.io](https://ipgeolocation.io)
   - Sign up for a free account (30,000 requests/month)
   - Go to Dashboard → API Keys
   - Update your `.env.local`:
   ```env
   IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key
   ```

#### **Security Configuration**

1. **Generate CSRF Secret**
   - Generate a secure random string (32+ characters)
   - Use OpenSSL or similar tool:

   ```bash
   # Generate CSRF secret
   openssl rand -hex 32
   ```

   - Update your `.env.local`:

   ```env
   CSRF_SECRET=your_generated_csrf_secret
   ```

   - **Required in production** - Application will fail to start without it

2. **Configure Rate Limiting (Production)**
   - For production deployments with multiple instances, configure persistent storage
   - **Option 1: Vercel KV** (recommended for Vercel deployments):
     - Go to [Vercel Dashboard → Storage](https://vercel.com/dashboard/stores)
     - Create a new KV database
     - Copy the REST API URL and Token
     - Update your `.env.local`:

     ```env
     KV_REST_API_URL=your_vercel_kv_rest_api_url
     KV_REST_API_TOKEN=your_vercel_kv_rest_api_token
     ```

     - **Package already included** in dependencies

   - **Option 2: Redis** (for other deployments):
     ```env
     REDIS_URL=redis://your-redis-host:6379
     ```
   - **Development**: Uses in-memory storage (no configuration needed)

#### **Complete Environment Setup**

Your `.env.local` should look like this:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your_project_id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_PROJECT_ID=your_project_id

# Optional
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
LOG_LEVEL=info
NODE_ENV=development
IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key
CSRF_SECRET=your_csrf_secret_32_chars_minimum

# Production Rate Limiting (choose one)
# KV_REST_API_URL=your_vercel_kv_rest_api_url
# KV_REST_API_TOKEN=your_vercel_kv_rest_api_token
# REDIS_URL=redis://your-redis-host:6379
```

### **3. Customize the Application**

#### **Update Site Configuration**

```typescript
// src/config/site.ts
export const SITE_CONFIG = {
  name: 'Your App Name',
  description: 'Your app description',
  url: 'https://yourapp.com',
  // ... other config
}
```

#### **Architecture Examples**

**Server Components:**

```typescript
import { createClient } from '@/lib/supabase/server'
import { ProfileService } from '@/lib/supabase/services/database/profiles/profile.service'

export default async function ProfileServerComponent({ userId }: { userId: string }) {
  const profileServerService = await ProfileServerService.create()
  const profile = await profileServerService.getProfile(userId)

  return <div>{profile?.display_name}</div>
}
```

**Client Components:**

```typescript
import { useProfile } from '@/hooks/useProfile'

export default function ProfileClientComponent({ userId }: { userId: string }) {
  const { profile, isLoading, error, updateProfile } = useProfile(userId)

  if (isLoading) return <div>Loading...</div>
  return <div>{profile?.display_name}</div>
}
```

**Server Actions:**

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { ProfileService } from '@/lib/supabase/services/database/profiles/profile.service'

export async function updateProfileAction(userId: string, updates: ProfileUpdate) {
  const profileServerService = await ProfileServerService.create()
  return await profileServerService.updateProfile(userId, updates)
}
```

#### **Add Your Features**

```typescript
// Add new pages in app/
// Add new components in src/components/
// Add new hooks in src/hooks/ - use hooks for client state management
// Add new services in src/lib/supabase/services/
```

### **4. Development Workflow**

```bash
# Development
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Formatting
pnpm format

# Build
pnpm build
```

## **Core Dependencies**

### **Frontend**

- **Next.js 15.5.6** - React framework
- **React 18.3.1** - UI library
- **Material UI 7.3.4** - Component library
- **TypeScript 5.x** - Type safety

### **Backend & Data**

- **Supabase** - Database and auth
- **PostgreSQL** - Database
- **TanStack Query** - Data fetching (in hooks)
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### **Development**

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Sentry** - Error tracking

## 🚀 **Deployment**

### **Vercel (Recommended)**

```bash
# Push to GitHub
git add .
git commit -m "Initial setup"
git push origin main

# Connect to Vercel
# Add environment variables in Vercel dashboard
# Deploy automatically on push
```

### **Environment Variables**

#### **Required Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_PROJECT_ID=your_supabase_project_id
```

#### **Optional Variables**

```bash
# Development
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
LOG_LEVEL=info
NODE_ENV=development

# Sentry (Error Tracking)
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# IP Geolocation
IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key

# Security Configuration
CSRF_SECRET=your_csrf_secret_32_chars_minimum

# Rate Limiting (Production - choose one)
# KV_REST_API_URL=your_vercel_kv_rest_api_url
# KV_REST_API_TOKEN=your_vercel_kv_rest_api_token
# REDIS_URL=redis://your-redis-host:6379

# Supabase Service Role (Server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> **🔧 Setup Guide**: See the detailed environment setup section above for step-by-step instructions on obtaining each API key.

## 🔧 **Available Scripts**

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
pnpm type-check       # Run TypeScript type checking
pnpm format           # Format code with Prettier

# Type Generation
pnpm gen:types        # Generate Supabase database types
pnpm generate:i18n-types  # Generate i18n translation types
pnpm watch:i18n       # Watch i18n files and auto-generate types

# Database Management
pnpm db:init              # Initialize database from bootstrap script
pnpm db:backup:structure  # Backup database schema only
pnpm db:backup:full       # Backup full database with data
pnpm db:wipe              # Wipe database completely (with backup option)
pnpm db:restore           # Restore from schema backup
pnpm db:migrations:sync   # Sync migration history
```

### **Type Generation Scripts**

#### **Supabase Types**

```bash
pnpm run gen:types
```

Generates TypeScript types from your Supabase database schema. Run this after:

- Creating new tables
- Modifying table structures
- Adding new columns

#### **i18n Types**

```bash
pnpm run generate:i18n-types
```

> **⚠️ Note**: This script is currently not implemented and is a placeholder for future functionality.

> **📋 Status**: Internationalization (i18n) features are **not yet implemented** in this project. The i18n infrastructure exists but is not actively used. Translation files and i18n configuration are placeholders for future implementation.

Generates TypeScript types from translation files. Run this after:

- Adding new translation keys
- Modifying translation structure
- Adding new languages

#### **i18n Watcher**

```bash
pnpm run watch:i18n
```

> **⚠️ Note**: i18n features are not yet implemented. This script is a placeholder.

Watches for changes in translation files and auto-generates types. Use during development when working on translations.

### **Database Initialization**

#### **Initialize Database**

```bash
pnpm run db:init
```

Initializes a fresh Supabase database with the schema defined in `supabase/init/init.sql`. This script:

- **Safe by default**: Will NOT overwrite existing data
- **Checks for existing tables**: Prevents accidental data loss
- **Uses bootstrap script**: Loads schema from `supabase/init/init.sql`

**Force Mode** (⚠️ **WARNING**: Will attempt to initialize even if tables exist):

```bash
pnpm run db:init --force
```

> **⚠️ Warning**: Force mode may overwrite existing data. Use with caution.

**Requirements**:

- PostgreSQL client tools (psql) compatible with your Supabase server version
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`
- Init script located at `supabase/init/init.sql`

**Complete Setup Workflow**:

```bash
# 1. Initialize database schema
pnpm run db:init

# 2. Sync migration history
pnpm run db:migrations:sync

# 3. Generate TypeScript types
pnpm run gen:types
```

### **Database Backup Scripts**

#### **Schema Backup**

```bash
pnpm run db:backup:structure
```

Creates a backup of your database schema (tables, constraints, indexes) without data. Use before:

- Making schema changes
- Running migrations
- Major refactoring

**Requirements:**

- PostgreSQL client tools (pg_dump) compatible with your Supabase server version
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`
- A valid `SUPABASE_DB_PASSWORD` environment variable must be set

#### **Full Database Backup**

```bash
pnpm run db:backup:full
```

Creates a complete backup including all data. Use before:

- Data migrations
- Major data changes
- Production deployments

**Requirements:**

- PostgreSQL client tools (pg_dump) compatible with your Supabase server version
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`

**⚠️ Version Compatibility Note**: Your pg_dump version must match your Supabase PostgreSQL server version. If you encounter version mismatch errors, use the Supabase Dashboard SQL Editor for manual backups.

#### **Database Wipe & Restore**

```bash
# Complete database recreation workflow
pnpm run db:wipe              # Wipe everything (offers backup first)
pnpm run db:restore           # Restore from schema backup
pnpm run db:migrations:sync   # Sync migration history
pnpm run gen:types            # Regenerate TypeScript types
```

**Database Wipe (`db:wipe`)**

Completely wipes all database objects with safety features:

- **Confirmation Required**: Must type `WIPE_DATABASE_CONFIRM`
- **Backup First**: Offers to create backup (defaults to Yes)
- **Safe Operation**: Aborts if backup creation fails
- **Complete Clean**: Drops all tables, functions, triggers, and migration history

**Database Restore (`db:restore`)**

Restores database from schema backup:

- **Auto-Detect**: Finds latest schema backup if none specified
- **Validation**: Checks backup file integrity
- **Preparation**: Ensures clean database state
- **Verification**: Confirms successful restoration

**Migration Sync (`db:migrations:sync`)**

Synchronizes migration history with codebase:

- **After Restoration**: Essential after restoring from backup
- **Clean State**: Ensures database matches migration files
- **Verification**: Confirms sync status
- **Error Handling**: Handles missing/outdated migrations

**Complete Recreation Workflow**:

```bash
# One-command complete database recreation
pnpm run db:wipe && pnpm run db:restore && pnpm run db:migrations:sync && pnpm run gen:types
```

**Requirements for All Database Scripts**:

- PostgreSQL client tools (psql, pg_dump) compatible with your Supabase server version
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`
- Valid Supabase project access

### **PostgreSQL Client Installation (Ubuntu)**

For optimal compatibility with Supabase, install the latest PostgreSQL client tools from the official repository:

```bash
# Add PostgreSQL official repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import repository signing key
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg

# Update package lists
sudo apt update

# Install PostgreSQL client tools
sudo apt install postgresql-client

# Verify installation
pg_dump --version
```

**Alternative Installation Methods:**

- **macOS**: `brew install libpq` or `brew install postgresql`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Other Linux**: Follow [official PostgreSQL documentation](https://www.postgresql.org/download/linux/)

**Backup Organization:**

```
backups/
├── project_id_schema_backup_2025-01-15T10-30-00-000Z.sql
├── project_id_schema_backup_2025-01-15T10-30-00-000Z_summary.json
├── project_id_full_backup_2025-01-15T10-30-00-000Z.sql
└── project_id_full_backup_2025-01-15T10-30-00-000Z_summary.json
```

## 🛡️ **Security Features**

- **Row Level Security (RLS)** - Database-level access control
- **Session Management** - Secure cookie-based sessions
- **CSRF Protection** - Cross-site request forgery prevention
- **Input Validation** - Zod schema validation
- **Security Headers** - Comprehensive header management

## 🧩 Components

- **[Auth Components](/src/components/auth/README.md)** - Complete authentication system including login, registration, and password reset flows
- **UI Components** - Reusable UI elements built with Material UI
- **Layout Components** - Page layouts and navigation

## 📱 **Responsive Design**

Mobile-first approach with Material UI breakpoints:

- **xs**: 0px and up
- **sm**: 600px and up
- **md**: 900px and up
- **lg**: 1200px and up
- **xl**: 1536px and up

## ♿ **Accessibility**

WCAG 2.1 compliant with:

- Semantic HTML elements
- Proper ARIA attributes
- Keyboard navigation
- Screen reader support
- Color contrast compliance

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Read [Contributing Guidelines](./CONTRIBUTING.md) for details.

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 **Acknowledgments**

- [Next.js](https://nextjs.org/) - The React framework
- [Material UI](https://mui.com/) - React component library
- [Supabase](https://supabase.com/) - Backend as a Service
- [React Hook Form](https://react-hook-form.com/) - Form library
- [Zod](https://zod.dev/) - Schema validation

---

**🎉 Happy coding!**

## 📚 Documentation

For detailed documentation, see the [Documentation](/docs) directory.

### Core Libraries

- [@/lib](/src/lib/README.md) - Core utilities and shared functionality
- [@/lib/auth](/src/lib/auth/README.md) - Authentication and authorization
- [@/lib/supabase](/src/lib/supabase/README.md) - Supabase client and utilities
- [@/lib/utils](/src/lib/utils/README.md) - Shared utility functions
- [@/hooks](/src/hooks/README.md) - Custom React hooks for stateful logic

### Library Documentation

- [React Hook Form](https://react-hook-form.com/) - Form library
- [Zod](https://zod.dev/) - Schema validation
