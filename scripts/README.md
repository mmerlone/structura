# Scripts Directory

Development and build scripts for the Structura project.

## 📁 **Available Scripts**

### **🔧 Type Generation Scripts**

#### **generateSupabaseTypes.ts**

Generates TypeScript types from your Supabase database schema.

```bash
# Run via npm script
pnpm run gen:types

# Or run directly
npx ts-node scripts/generateSupabaseTypes.ts
```

**What it does:**

- Connects to your Supabase project using the project ID
- Fetches the database schema for the 'public' schema
- Generates TypeScript types matching your database structure
- Writes types to `src/types/supabase.ts`

**Requirements:**

- `NEXT_PUBLIC_SUPABASE_PROJECT_ID` in `.env.local`
- Supabase CLI installed globally (`npm install -g supabase`)

**Output:**

```
src/types/supabase.ts
├── Database interface
├── Table types
├── Function types
└── Generated timestamp
```

#### **generate-i18n-types.ts**

Generates TypeScript types from i18n translation files.

```bash
# Run via npm script
pnpm run generate:i18n-types

# Or run directly
npx ts-node scripts/generate-i18n-types.ts
```

**What it does:**

- Reads English translations as the source of truth
- Converts JSON structure to TypeScript types
- Formats output with Prettier
- Writes types to `src/types/generated/i18n.types.ts`

**Requirements:**

- `src/locales/en/common.json` must exist
- Prettier for formatting

**Output:**

```typescript
// src/types/generated/i18n.types.ts
export type CommonTranslations = {
  welcome: string
  navigation: {
    home: string
    about: string
  }
  // ... more types
}
```

#### **watch-i18n.ts**

Watches for changes in translation files and auto-regenerates types.

```bash
# Run via npm script
pnpm run watch:i18n

# Or run directly
npx ts-node scripts/watch-i18n.ts
```

**What it does:**

- Monitors all JSON files in `src/locales/`
- Automatically regenerates types on file changes
- Prevents process conflicts by killing previous builds
- Provides real-time feedback

**Features:**

- 🔍 Watches for add, change, and unlink events
- ⚡ Automatic type regeneration
- 🛡️ Process conflict prevention
- 📝 Detailed logging

**Usage:**

```bash
# Start the watcher
pnpm run watch:i18n

# Make changes to any translation file
# Types are automatically regenerated!
```

### **💾 Database Management Scripts**

#### **backup-database.ts**

Creates backups of your Supabase database schema and/or data.

```bash
# Backup schema only (structure)
pnpm run db:backup:structure

# Backup full database with data
pnpm run db:backup:full

# Or run directly
npx ts-node scripts/backup-database.ts --schema-only
npx ts-node scripts/backup-database.ts --with-data
```

**What it does:**

- Connects to your Supabase project using direct database connection
- Uses pg_dump to create SQL backup files with proper filtering
- Generates backup metadata and summaries
- Stores backups in organized directory structure

**Requirements:**

- `SUPABASE_PROJECT_ID` or `NEXT_PUBLIC_SUPABASE_PROJECT_ID` in `.env.local`
- `NEXT_PUBLIC_SUPABASE_URL` in `.env.local
- `SUPABASE_DB_PASSWORD` in `.env.local`
- PostgreSQL client tools (pg_dump) compatible with your Supabase server version

#### **wipe-database.ts**

Completely wipes all database objects from your Supabase project.

```bash
# Wipe database completely (requires confirmation)
pnpm run db:wipe

# Or run directly
npx ts-node scripts/wipe-database.ts
```

**What it does:**

- Drops all tables in public schema
- Drops all custom functions and triggers
- Clears migration history
- Resets sequences
- Offers to create backup before wiping (default: Yes)

**Safety Features:**

- Requires `WIPE_DATABASE_CONFIRM` confirmation
- Offers backup creation before wiping (defaults to Yes)
- Aborts if backup creation fails
- Comprehensive error handling

**Requirements:**

- Same as backup-database.ts
- PostgreSQL client tools (psql)

#### **restore-database.ts**

Restores database from a schema backup file.

```bash
# Restore from latest schema backup (auto-detected)
pnpm run db:restore

# Restore from specific backup file
pnpm run db:restore --backup-file backups/my_backup.sql

# Or run directly
npx ts-node scripts/restore-database.ts
npx ts-node scripts/restore-database.ts --backup-file backups/my_backup.sql
```

**What it does:**

- Validates backup file integrity
- Prepares database for restoration
- Executes schema restoration
- Verifies restoration success
- Auto-finds latest schema backup if none specified

**Requirements:**

- Same as backup-database.ts
- PostgreSQL client tools (psql)
- Valid schema backup file in backups/ directory

#### **sync-migrations.ts**

Synchronizes migration history with actual migration files.

```bash
# Sync migration history
pnpm run db:migrations:sync

# Or run directly
npx ts-node scripts/sync-migrations.ts
```

**What it does:**

- Ensures migration history table exists
- Syncs migrations from `supabase/migrations/` directory
- Updates database to match codebase
- Handles missing/outdated migrations
- Provides verification of sync status

**Use Cases:**

- After database restoration from backup
- After manual database changes
- When migration history gets out of sync
- Before generating new types

**Requirements:**

- Same as backup-database.ts
- PostgreSQL client tools (psql)
- Migration files in `supabase/migrations/` directory

### **PostgreSQL Version Compatibility**

⚠️ **Important**: Your pg_dump version must match your Supabase PostgreSQL server version.

```bash
# Check your pg_dump version
pg_dump --version

# Check your Supabase server version in Dashboard > Settings > Database

# Common version mismatches and solutions:
# - Supabase server 17.x + pg_dump 16.x = ❌ Version mismatch
# - Solutions:
#   1. Upgrade PostgreSQL client tools (if available)
#   2. Use Supabase Dashboard SQL Editor for manual backups
#   3. Use Supabase CLI with Docker (requires Docker installation)
```

**Backup Organization:**

```
backups/
├── your_project_id_schema_backup_2025-01-15T10-30-00-000Z.sql
├── your_project_id_schema_backup_2025-01-15T10-30-00-000Z_summary.json
├── your_project_id_full_backup_2025-01-15T10-30-00-000Z.sql
└── your_project_id_full_backup_2025-01-15T10-30-00-000Z_summary.json
```

**Backup Types:**

- **Schema Only**: Database structure, tables, constraints, indexes
- **Full with Data**: Complete database including all data

**Restoring Backups:**

```bash
# Using psql
psql "postgresql://user:pass@host:port/dbname" < backup_file.sql

# Using Supabase CLI
supabase db shell
\i backup_file.sql
```

## 🛠️ **Development Workflow**

### **Initial Setup**

1. **Generate Supabase Types**

   ```bash
   pnpm run gen:types
   ```

2. **Generate i18n Types**
   ```bash
   pnpm run generate:i18n-types
   ```

### **During Development**

1. **Start i18n Watcher** (for translation work)

   ```bash
   # Terminal 1
   pnpm run watch:i18n
   ```

2. **Regenerate Supabase Types** (after schema changes)

   ```bash
   # Terminal 2 (run as needed)
   pnpm run gen:types
   ```

3. **Database Management** (backup, restore, wipe)

   ```bash
   # Create backups before major changes
   pnpm run db:backup:structure  # Schema only
   pnpm run db:backup:full       # With data

   # Complete database recreation (advanced)
   pnpm run db:wipe              # Wipe everything (with backup option)
   pnpm run db:restore           # Restore from backup
   pnpm run db:migrations:sync   # Sync migration history

   # One-command recreation
   pnpm run db:wipe && pnpm run db:restore && pnpm run db:migrations:sync && pnpm run gen:types
   ```

### **Before Commit**

```bash
# Ensure all types are up to date
pnpm run gen:types
pnpm run generate:i18n-types
pnpm run type-check

# Optional: Create backup before major changes
pnpm run db:backup:structure
```

## 📋 **Environment Requirements**

### **Supabase Type Generation**

```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your_project_id

# Required tools
npm install -g supabase
```

### **Database Backup**

```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PROJECT_ID=your_project_id
# OR
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your_project_id
SUPABASE_DB_PASSWORD=your_database_password

# Required tools
# PostgreSQL client tools compatible with your Supabase server version
pg_dump --version  # Should match your Supabase PostgreSQL version
```

### **i18n Type Generation**

```bash
# Required file structure
src/
├── locales/
│   └── en/
│       └── common.json
└── types/
    └── generated/
        └── i18n.types.ts
```

## 🔧 **Adding New Scripts**

### **Script Template**

````typescript
/**
 * @fileoverview Brief description of what the script does.
 *
 * Detailed description of the script's purpose and functionality.
 *
 * @example
 * ```bash
 * # Run the script
 * pnpm run script-name
 * ```
 *
 * @author Structura Team
 * @since 1.0.0
 */

import {} from /* your imports */ 'your-dependencies'

/**
 * Main function that performs the script's primary task.
 *
 * @async
 * @function mainFunction
 * @returns {Promise<void>} Promise that resolves when complete
 * @throws {Error} If something goes wrong
 *
 * @example
 * ```typescript
 * await mainFunction();
 * console.log('Script completed successfully!');
 * ```
 */
async function mainFunction(): Promise<void> {
  try {
    // Your implementation here
    console.log('✅ Script completed successfully')
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

// Run the script
mainFunction().catch(console.error)
````

### **Adding to package.json**

```json
{
  "scripts": {
    "script-name": "npx ts-node scripts/your-script.ts"
  }
}
```

## 🚀 **Best Practices**

### **Error Handling**

- Always include proper error handling
- Use clear console messages with emojis
- Exit with error code on failure

### **Type Safety**

- Use TypeScript for all scripts
- Include proper JSDoc documentation
- Use environment variables with validation

### **File Operations**

- Check if files exist before reading
- Create directories if they don't exist
- Use proper file permissions

### **Process Management**

- Handle process cleanup properly
- Use appropriate exit codes
- Provide clear feedback to users

## 🔗 **Related Documentation**

- **[Project Structure](../docs/structure.md)** - Overall project organization
- **[Main README](../README.md)** - Project overview and setup
- **[Type Safety](../src/types/README.md)** - Type system documentation

---

**All scripts are designed to be run independently or as part of the development workflow.**
