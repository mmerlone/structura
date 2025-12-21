#!/usr/bin/env tsx

/**
 * @fileoverview Script to sync migration history after database restoration.
 *
 * This script updates the supabase_migrations.schema_migrations table
 * to reflect the actual migration files in the project, ensuring the
 * database state is in sync with the codebase.
 *
 * @example
 * ```bash
 * # Sync migration history
 * pnpm run db:migrations:sync
 *
 * # Or run directly
 * npx tsx scripts/sync-migrations.ts
 * ```
 *
 * @requires NEXT_PUBLIC_SUPABASE_URL in .env.local
 * @requires SUPABASE_PROJECT_ID or NEXT_PUBLIC_SUPABASE_PROJECT_ID in .env.local
 * @requires SUPABASE_DB_PASSWORD in .env.local
 *
 * @author Structura Team
 * @since 1.0.0
 */

import { execSync } from 'child_process'
import { existsSync, readdirSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') })

// Configuration
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID

// Validate environment
if (!SUPABASE_PROJECT_ID) {
  console.error('❌ Error: Neither SUPABASE_PROJECT_ID nor NEXT_PUBLIC_SUPABASE_PROJECT_ID is defined in .env.local')
  process.exit(1)
}

/**
 * Builds the database connection string from environment variables.
 */
function buildDatabaseConnectionString(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const dbPassword = process.env.SUPABASE_DB_PASSWORD
  const projectId = process.env.SUPABASE_PROJECT_ID || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined in .env.local')
  }

  if (!dbPassword) {
    throw new Error('SUPABASE_DB_PASSWORD is not defined in .env.local')
  }

  // For Supabase, the pooler hostname format is:
  const poolerHostname = `aws-1-sa-east-1.pooler.supabase.com`

  return `postgresql://postgres.${projectId}:${dbPassword}@${poolerHostname}:5432/postgres`
}

/**
 * Gets all migration files from the supabase/migrations directory.
 */
function getMigrationFiles(): Array<{ version: string; name: string; filename: string }> {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations')

  if (!existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`)
  }

  const files = readdirSync(migrationsDir)

  // Filter for migration files (timestamp_name.sql format)
  const migrationFiles = files
    .filter((file: string) => file.endsWith('.sql') && !file.startsWith('README'))
    .map((file: string) => {
      const parts = file.replace('.sql', '').split('_')
      const version = parts[0]
      const name = parts.slice(1).join('_')

      // Ensure version exists, otherwise skip this file
      if (!version) {
        return null
      }

      return { version, name, filename: file }
    })
    .filter((item): item is { version: string; name: string; filename: string } => item !== null)
    .sort((a, b) => a.version.localeCompare(b.version))

  console.log(`📁 Found ${migrationFiles.length} migration files`)
  return migrationFiles
}

/**
 * Gets current migration history from the database.
 */
function getCurrentMigrations(connectionString: string): Array<{ version: string; name: string }> {
  try {
    const result = execSync(
      `psql "${connectionString}" -t -c "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;"`,
      { encoding: 'utf8' }
    )

    if (!result.trim()) {
      return []
    }

    return result
      .trim()
      .split('\n')
      .filter((line): line is string => Boolean(line?.trim()))
      .map((line): { version: string; name: string } => {
        const [version, ...nameParts] = line
          .trim()
          .split('|')
          .map((s) => s.trim())

        if (!version) {
          throw new Error('Invalid migration entry: missing version')
        }

        return {
          version,
          name: nameParts.join('|') || '',
        }
      })
  } catch (error) {
    // If table doesn't exist, return empty array
    if (error instanceof Error && error.message.includes('does not exist')) {
      console.log('📝 Migration history table does not exist - will be created')
      return []
    }
    throw error
  }
}

/**
 * Creates the migration history table if it doesn't exist.
 */
function ensureMigrationTable(connectionString: string): void {
  const createTableSQL = `
-- Create migration history table if it doesn't exist
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schema_migrations_version ON supabase_migrations.schema_migrations(version);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON supabase_migrations.schema_migrations(executed_at);
`

  const tempFile = join(process.cwd(), '.temp-create-migrations.sql')
  writeFileSync(tempFile, createTableSQL)

  try {
    execSync(`psql "${connectionString}" < "${tempFile}"`, { stdio: 'pipe' })
    console.log('✅ Migration history table ensured')
  } finally {
    try {
      unlinkSync(tempFile)
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Syncs migration history with actual migration files.
 */
function syncMigrationHistory(
  connectionString: string,
  migrationFiles: Array<{ version: string; name: string; filename: string }>
): void {
  console.log('🔄 Syncing migration history...')

  const currentMigrations = getCurrentMigrations(connectionString)
  const currentVersions = new Set(currentMigrations.map((m) => m.version))
  const fileVersions = new Set(migrationFiles.map((m) => m.version))

  // Find migrations to add (in files but not in database)
  const toAdd = migrationFiles.filter((m) => !currentVersions.has(m.version))

  // Find migrations to remove (in database but not in files)
  const toRemove = currentMigrations.filter((m) => !fileVersions.has(m.version))

  console.log(`📊 Current migrations in database: ${currentMigrations.length}`)
  console.log(`📁 Migration files in codebase: ${migrationFiles.length}`)
  console.log(`➕ Migrations to add: ${toAdd.length}`)
  console.log(`➖ Migrations to remove: ${toRemove.length}`)

  if (toAdd.length === 0 && toRemove.length === 0) {
    console.log('✅ Migration history is already in sync')
    return
  }

  // Remove outdated migrations
  if (toRemove.length > 0) {
    console.log('🗑️  Removing outdated migrations from database...')
    const removeVersions = toRemove.map((m) => `'${m.version}'`).join(', ')
    const removeSQL = `DELETE FROM supabase_migrations.schema_migrations WHERE version IN (${removeVersions});`

    const tempFile = join(process.cwd(), '.temp-remove-migrations.sql')
    writeFileSync(tempFile, removeSQL)

    try {
      execSync(`psql "${connectionString}" < "${tempFile}"`, { stdio: 'pipe' })
      console.log(`✅ Removed ${toRemove.length} outdated migrations`)
    } finally {
      try {
        unlinkSync(tempFile)
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  // Add new migrations
  if (toAdd.length > 0) {
    console.log('➕ Adding new migrations to database...')

    for (const migration of toAdd) {
      console.log(`   Adding: ${migration.version} - ${migration.name}`)

      const addSQL = `INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('${migration.version}', '${migration.name}');`

      const tempFile = join(process.cwd(), '.temp-add-migration.sql')
      writeFileSync(tempFile, addSQL)

      try {
        execSync(`psql "${connectionString}" < "${tempFile}"`, { stdio: 'pipe' })
      } finally {
        try {
          unlinkSync(tempFile)
        } catch {
          // Ignore cleanup errors
        }
      }
    }

    console.log(`✅ Added ${toAdd.length} new migrations`)
  }

  console.log('✅ Migration history synchronized successfully!')
}

/**
 * Verifies the migration sync was successful.
 */
function verifySync(connectionString: string): void {
  try {
    console.log('🔍 Verifying migration sync...')

    const migrationFiles = getMigrationFiles()
    const currentMigrations = getCurrentMigrations(connectionString)

    const fileVersions = new Set(migrationFiles.map((m) => m.version))
    const currentVersions = new Set(currentMigrations.map((m) => m.version))

    const missing = [...fileVersions].filter((v) => !currentVersions.has(v))
    const extra = [...currentVersions].filter((v) => !fileVersions.has(v))

    if (missing.length === 0 && extra.length === 0) {
      console.log('✅ Migration sync verification passed!')
      console.log(`📊 Total migrations: ${migrationFiles.length}`)
    } else {
      console.warn('⚠️  Migration sync verification issues:')
      if (missing.length > 0) {
        console.warn(`   Missing in database: ${missing.join(', ')}`)
      }
      if (extra.length > 0) {
        console.warn(`   Extra in database: ${extra.join(', ')}`)
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not verify migration sync:', error)
  }
}

/**
 * Main sync function.
 */
async function main(): Promise<void> {
  try {
    console.log('🔧 Starting migration history synchronization...')
    console.log(`📋 Project ID: ${SUPABASE_PROJECT_ID}`)

    // Build database connection string
    const connectionString = buildDatabaseConnectionString()

    // Get migration files
    const migrationFiles = getMigrationFiles()

    // Ensure migration table exists
    ensureMigrationTable(connectionString)

    // Sync migration history
    syncMigrationHistory(connectionString, migrationFiles)

    // Verify sync
    verifySync(connectionString)

    console.log('\n🎉 Migration synchronization completed!')
    console.log('\n📖 Next Steps:')
    console.log('1. Run: pnpm run gen:types (to regenerate TypeScript types)')
    console.log('2. Test your application functionality')
  } catch (error) {
    console.error('❌ Migration synchronization failed:', error)
    process.exit(1)
  }
}

// Run the synchronization
main().catch(console.error)
