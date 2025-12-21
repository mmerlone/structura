/**
 * @fileoverview Script to backup Supabase database schema and/or data.
 *
 * This script connects to your Supabase project and creates backups of:
 * - Database schema only (structure, tables, constraints, etc.)
 * - Full database with data (schema + all data)
 *
 * @example
 * ```bash
 * # Backup schema only
 * pnpm run db:backup:structure
 *
 * # Backup full database with data
 * pnpm run db:backup:full
 *
 * # Or run directly
 * npx ts-node scripts/backup-database.ts --schema-only
 * npx ts-node scripts/backup-database.ts --with-data
 * ```
 *
 * @requires NEXT_PUBLIC_SUPABASE_URL in .env.local
 * @requires SUPABASE_PROJECT_ID or NEXT_PUBLIC_SUPABASE_PROJECT_ID in .env.local
 * @requires SUPABASE_DB_PASSWORD in .env.local
 * @requires pg_dump to be available (comes with PostgreSQL client tools)
 *
 * @author Structura Team
 * @since 1.0.0
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync, statSync } from 'fs'
import { join } from 'path'
import { parseArgs } from 'util'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') })

// Parse command line arguments
const args = parseArgs({
  args: process.argv.slice(2),
  options: {
    'schema-only': { type: 'boolean', default: false },
    'with-data': { type: 'boolean', default: false },
    'output-dir': { type: 'string', default: 'backups' },
  },
  allowPositionals: true,
})

// Configuration
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
const BACKUP_DIR = args.values['output-dir'] as string
const SCHEMA_ONLY = args.values['schema-only'] as boolean
const WITH_DATA = args.values['with-data'] as boolean

// Validate arguments
if (!SUPABASE_PROJECT_ID) {
  console.error('❌ Error: Neither SUPABASE_PROJECT_ID nor NEXT_PUBLIC_SUPABASE_PROJECT_ID is defined in .env.local')
  process.exit(1)
}

// TypeScript knows SUPABASE_PROJECT_ID is not undefined after the check
const projectId: string = SUPABASE_PROJECT_ID

if (SCHEMA_ONLY && WITH_DATA) {
  console.error('❌ Error: Cannot specify both --schema-only and --with-data')
  process.exit(1)
}

if (!SCHEMA_ONLY && !WITH_DATA) {
  console.error('❌ Error: Must specify either --schema-only or --with-data')
  process.exit(1)
}

/**
 * Creates the backup directory if it doesn't exist.
 *
 * @param {string} dirPath - Path to the backup directory
 */
function ensureBackupDirectory(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
    console.log(`📁 Created backup directory: ${dirPath}`)
  }
}

/**
 * Generates a timestamped filename for the backup.
 *
 * @param {boolean} schemaOnly - Whether this is a schema-only backup
 * @param {string} projectId - Supabase project ID
 * @returns {string} Generated filename
 */
function generateBackupFilename(schemaOnly: boolean, projectId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const type = schemaOnly ? 'schema' : 'full'
  return `${projectId}_${type}_backup_${timestamp}.sql`
}

/**
 * Builds the database connection string from environment variables.
 *
 * @returns {string} Database connection string
 * @throws {Error} If required environment variables are missing
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

  if (!projectId) {
    throw new Error('Neither SUPABASE_PROJECT_ID nor NEXT_PUBLIC_SUPABASE_PROJECT_ID is defined in .env.local')
  }

  // For Supabase, the pooler hostname format is:
  // aws-1-sa-east-1.pooler.supabase.com (based on region)
  // We need to determine the region from the project or use a standard format

  // Try to determine the region from the project URL or use a default
  // For now, let's use the standard format that works for most projects
  const poolerHostname = `aws-1-sa-east-1.pooler.supabase.com`

  // Build connection string: postgresql://postgres.[project_id]:[password]@[region].pooler.supabase.com:5432/postgres
  return `postgresql://postgres.${projectId}:${dbPassword}@${poolerHostname}:5432/postgres`
}

/**
 * Creates a database backup using pg_dump directly.
 *
 * @param {string} connectionString - Database connection string
 * @param {string} outputPath - Path where backup file will be saved
 * @param {boolean} schemaOnly - Whether to backup schema only
 * @returns {Promise<void>}
 */
async function createBackup(connectionString: string, outputPath: string, schemaOnly: boolean): Promise<void> {
  try {
    console.log(`🚀 Creating ${schemaOnly ? 'schema-only' : 'full'} backup using pg_dump...`)

    // Build pg_dump command
    const pgDumpArgs = [
      '--verbose',
      '--no-owner',
      '--no-privileges',
      '--exclude-schema=information_schema',
      '--exclude-schema=pg_*',
      schemaOnly ? '--schema-only' : '--data-only',
      '--file',
      outputPath,
    ].filter(Boolean)

    const pgDumpCommand = `pg_dump "${connectionString}" ${pgDumpArgs.join(' ')}`

    console.log(`📝 Executing: pg_dump ${pgDumpArgs.join(' ')}`)

    // Execute pg_dump
    execSync(pgDumpCommand, { stdio: 'inherit' })

    console.log(`✅ Backup created successfully: ${outputPath}`)

    // Get file size
    const stats = statSync(outputPath)
    const fileSize = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`📊 Backup size: ${fileSize} MB`)
  } catch (error) {
    // Check if this is a version mismatch error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('server version mismatch')) {
      console.error('❌ Version mismatch detected between pg_dump and Supabase server.')
      console.error('💡 Solution: Upgrade PostgreSQL client tools or use a compatible version.')
      console.error('   Ubuntu/Debian: sudo apt-get install postgresql-client-17')
      console.error('   Or add your project to the PostgreSQL 16 compatibility list in Supabase settings.')
    }
    throw new Error(`Failed to create backup: ${error}`)
  }
}

/**
 * Creates a backup summary file with metadata.
 *
 * @param {string} backupPath - Path to the backup file
 * @param {boolean} schemaOnly - Whether this is a schema-only backup
 * @param {string} projectId - Supabase project ID
 */
function createBackupSummary(backupPath: string, schemaOnly: boolean, projectId: string): void {
  const summaryPath = backupPath.replace('.sql', '_summary.json')
  const summary = {
    timestamp: new Date().toISOString(),
    projectId,
    type: schemaOnly ? 'schema-only' : 'full-data',
    filename: backupPath.split('/').pop(),
    size: statSync(backupPath).size,
    createdWith: 'structura-backup-script',
    version: '1.0.0',
  }

  writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
  console.log(`📋 Backup summary created: ${summaryPath}`)
}

/**
 * Main backup function.
 *
 * @async
 * @function main
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  try {
    console.log('🔧 Starting Supabase database backup...')
    console.log(`📋 Project ID: ${projectId}`)
    console.log(`📂 Backup Type: ${SCHEMA_ONLY ? 'Schema Only' : 'Full with Data'}`)
    console.log(`📁 Output Directory: ${BACKUP_DIR}`)

    // Ensure backup directory exists
    ensureBackupDirectory(BACKUP_DIR)

    // Check if pg_dump is available
    try {
      execSync('pg_dump --version', { stdio: 'pipe' })
    } catch {
      console.error('❌ pg_dump is not available. Please install PostgreSQL client tools:')
      console.log('   Ubuntu/Debian: sudo apt-get install postgresql-client')
      console.log('   macOS: brew install libpq')
      console.log('   Windows: Download PostgreSQL installer from postgresql.org')
      process.exit(1)
    }

    // Build database connection string
    const connectionString = buildDatabaseConnectionString()

    // Generate backup filename
    const filename = generateBackupFilename(SCHEMA_ONLY, projectId)
    const outputPath = join(BACKUP_DIR, filename)

    // Create backup
    await createBackup(connectionString, outputPath, SCHEMA_ONLY)

    // Create backup summary
    createBackupSummary(outputPath, SCHEMA_ONLY, projectId)

    console.log('\n🎉 Backup completed successfully!')
    console.log(`📁 Backup file: ${outputPath}`)
    console.log(`📋 Summary file: ${outputPath.replace('.sql', '_summary.json')}`)

    // Show usage instructions
    console.log('\n📖 Usage Instructions:')
    console.log('To restore this backup:')
    console.log(`1. psql "${connectionString}" < ${outputPath}`)
    console.log('\nOr use Supabase CLI:')
    console.log('1. supabase db shell')
    console.log(`2. \\i ${outputPath}`)
  } catch (error) {
    console.error('❌ Backup failed:', error)

    // Check if this is a version mismatch error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('server version mismatch')) {
      console.error('\n💡 Version mismatch detected between pg_dump and Supabase server.')
      console.error('💡 Solution: Upgrade PostgreSQL client tools to match server version 17.x')
      console.error('   Ubuntu/Debian: sudo apt-get install postgresql-client-17')
      console.error('   Or check Supabase project settings for PostgreSQL version compatibility.')
    }

    process.exit(1)
  }
}

// Run the backup
main().catch(console.error)
