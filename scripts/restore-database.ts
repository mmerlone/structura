#!/usr/bin/env tsx

/**
 * @fileoverview Script to restore Supabase database from schema backup.
 *
 * This script connects to your Supabase project and restores the database
 * from a schema backup file created by the backup script.
 *
 * @example
 * ```bash
 * # Restore from latest schema backup
 * pnpm run db:restore
 *
 * # Restore from specific backup file
 * npx tsx scripts/restore-database.ts --backup-file backups/my_backup.sql
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
import { join } from 'path'
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, unlinkSync } from 'fs'
import { parseArgs } from 'util'
import * as dotenv from 'dotenv'

interface SchemaBackup {
  name: string
  path: string
  mtime: Date
}

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') })

// Parse command line arguments
const args = parseArgs({
  args: process.argv.slice(2),
  options: {
    'backup-file': { type: 'string' },
  },
  allowPositionals: true,
})

// Configuration
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
const BACKUP_FILE = args.values['backup-file'] as string

// Validate environment
if (!SUPABASE_PROJECT_ID) {
  console.error('❌ Error: Neither SUPABASE_PROJECT_ID nor NEXT_PUBLIC_SUPABASE_PROJECT_ID is defined in .env.local')
  process.exit(1)
}

/**
 * Finds the latest schema backup file if none specified.
 */
function findLatestSchemaBackup(): string {
  const backupDir = join(process.cwd(), 'backups')

  if (!existsSync(backupDir)) {
    throw new Error(`Backup directory not found: ${backupDir}`)
  }

  // Read all files in backup directory
  const files = readdirSync(backupDir)

  // Filter and process schema backup files
  const schemaBackups: SchemaBackup[] = files
    .filter((file: string) => file.includes('_schema_backup_') && file.endsWith('.sql'))
    .map((file: string): SchemaBackup | null => {
      try {
        const filePath = join(backupDir, file)
        const stats = statSync(filePath)
        return {
          name: file,
          path: filePath,
          mtime: stats.mtime,
        }
      } catch (error) {
        console.warn(`⚠️ Could not read file stats for ${file}:`, error)
        return null
      }
    })
    .filter((backup): backup is SchemaBackup => backup !== null)
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

  if (schemaBackups.length === 0) {
    throw new Error('No valid schema backup files found in backups directory')
  }

  const latest = schemaBackups[0]
  if (!latest) {
    throw new Error('Failed to determine the latest backup file')
  }

  console.log(`📁 Using latest schema backup: ${latest.name}`)
  return latest.path
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
 * Validates the backup file before restoration.
 */
function validateBackupFile(backupPath: string): void {
  if (!existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`)
  }

  const stats = statSync(backupPath)
  if (stats.size === 0) {
    throw new Error(`Backup file is empty: ${backupPath}`)
  }

  // Check if it looks like a PostgreSQL dump
  const content = readFileSync(backupPath, 'utf8')
  const firstLines = content.split('\n').slice(0, 10).join('\n')

  if (!firstLines.includes('PostgreSQL database dump')) {
    throw new Error(`File does not appear to be a PostgreSQL dump: ${backupPath}`)
  }

  console.log(`✅ Backup file validated: ${backupPath}`)
  console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
}

/**
 * Prepares the database for restoration.
 */
function prepareDatabase(connectionString: string): void {
  console.log('🔧 Preparing database for restoration...')

  // Create a preparation script to ensure clean state
  const prepSQL = `
-- Set session variables for restoration
SET session_replication_role = replica;
SET client_min_messages = warning;

-- Ensure basic schemas exist (they should be created by the dump)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'public') THEN
        CREATE SCHEMA public;
    END IF;
END $$;

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
`

  // Write preparation commands to temporary file
  const tempFile = join(process.cwd(), '.temp-prepare.sql')
  writeFileSync(tempFile, prepSQL)

  try {
    execSync(`psql "${connectionString}" < "${tempFile}"`, { stdio: 'pipe' })
    console.log('✅ Database prepared for restoration')
  } finally {
    // Clean up temporary file
    try {
      unlinkSync(tempFile)
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Restores the database from the backup file.
 */
async function restoreDatabase(connectionString: string, backupPath: string): Promise<void> {
  try {
    console.log(`🚀 Restoring database from: ${backupPath}`)

    // Execute restoration using psql
    const restoreCommand = `psql "${connectionString}" < "${backupPath}"`

    console.log('📝 Executing restoration command...')

    // Run the restoration with output visible
    execSync(restoreCommand, {
      stdio: 'inherit',
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large output
    })

    console.log('✅ Database restored successfully!')
  } catch (error) {
    // Check for common restoration errors
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('server version mismatch')) {
      console.error('❌ Version mismatch detected between backup and Supabase server.')
      console.error('💡 The backup was created with a different PostgreSQL version.')
      console.error('   This may require manual adjustment of the backup file.')
    } else if (errorMessage.includes('permission denied')) {
      console.error('❌ Permission denied during restoration.')
      console.error('💡 Check if the database user has sufficient privileges.')
    } else if (errorMessage.includes('duplicate key')) {
      console.error('❌ Duplicate key error during restoration.')
      console.error('💡 The database may not have been completely wiped before restoration.')
    }

    throw new Error(`Database restoration failed: ${error}`)
  }
}

/**
 * Verifies the restoration was successful.
 */
function verifyRestoration(connectionString: string): void {
  try {
    console.log('🔍 Verifying restoration...')

    // Check if public schema exists and has tables
    const result = execSync(
      `psql "${connectionString}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`,
      { encoding: 'utf8' }
    )
    const tableCount = parseInt(result.trim())

    console.log(`📊 Found ${tableCount} tables in public schema`)

    // Check if profiles table exists (key table for this project)
    try {
      const profilesResult = execSync(
        `psql "${connectionString}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles';"`,
        { encoding: 'utf8' }
      )
      const hasProfiles = parseInt(profilesResult.trim()) > 0

      if (hasProfiles) {
        console.log('✅ Key table "profiles" found')
      } else {
        console.log('⚠️  Key table "profiles" not found - this may be expected')
      }
    } catch {
      console.log('⚠️  Could not verify profiles table')
    }

    console.log('✅ Restoration verification completed')
  } catch (error) {
    console.warn('⚠️  Could not verify restoration:', error)
  }
}

/**
 * Main restore function.
 */
async function main(): Promise<void> {
  try {
    console.log('🔧 Starting Supabase database restoration...')
    console.log(`📋 Project ID: ${SUPABASE_PROJECT_ID}`)

    // Determine backup file to use
    const backupPath = BACKUP_FILE || findLatestSchemaBackup()

    // Validate backup file
    validateBackupFile(backupPath)

    // Build database connection string
    const connectionString = buildDatabaseConnectionString()

    // Prepare database
    prepareDatabase(connectionString)

    // Restore database
    await restoreDatabase(connectionString, backupPath)

    // Verify restoration
    verifyRestoration(connectionString)

    console.log('\n🎉 Database restoration completed successfully!')
    console.log(`📁 Restored from: ${backupPath}`)
    console.log('\n📖 Next Steps:')
    console.log('1. Run: pnpm run db:migrations:sync (to sync migration history)')
    console.log('2. Run: pnpm run gen:types (to regenerate TypeScript types)')
    console.log('3. Test your application functionality')
  } catch (error) {
    console.error('❌ Database restoration failed:', error)
    process.exit(1)
  }
}

// Run the restoration
main().catch(console.error)
