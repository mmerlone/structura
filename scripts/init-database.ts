/**
 * @fileoverview Script to initialize Supabase database from bootstrap SQL script.
 *
 * This script initializes a fresh Supabase database with the schema defined in
 * `supabase/init/init.sql`. It will NOT overwrite existing data unless --force is used.
 *
 * @example
 * ```bash
 * # Initialize database (safe, won't overwrite existing data)
 * pnpm run db:init
 *
 * # Force initialization (will drop and recreate everything)
 * pnpm run db:init --force
 * ```
 *
 * @requires NEXT_PUBLIC_SUPABASE_URL in .env.local
 * @requires SUPABASE_PROJECT_ID or NEXT_PUBLIC_SUPABASE_PROJECT_ID in .env.local
 * @requires SUPABASE_DB_PASSWORD in .env.local
 * @requires psql to be available (comes with PostgreSQL client tools)
 *
 * @author Structura Team
 * @since 1.0.0
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { parseArgs } from 'util'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') })

// Parse command line arguments
const args = parseArgs({
  args: process.argv.slice(2),
  options: {
    force: { type: 'boolean', default: false },
    'init-file': { type: 'string', default: 'supabase/init/init.sql' },
  },
  allowPositionals: true,
})

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const PROJECT_ID = process.env.SUPABASE_PROJECT_ID || process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set in .env.local')
  process.exit(1)
}

if (!PROJECT_ID) {
  console.error('❌ Error: SUPABASE_PROJECT_ID or NEXT_PUBLIC_SUPABASE_PROJECT_ID is not set in .env.local')
  process.exit(1)
}

if (!DB_PASSWORD) {
  console.error('❌ Error: SUPABASE_DB_PASSWORD is not set in .env.local')
  process.exit(1)
}

// Extract database connection details from Supabase URL
const dbHost = `${PROJECT_ID}.supabase.co`
const dbPort = '5432'
const dbName = 'postgres'
const dbUser = 'postgres'

// Path to init SQL file
const initFilePath = join(process.cwd(), args.values['init-file'] as string)

// Check if init file exists
if (!existsSync(initFilePath)) {
  console.error(`❌ Error: Init file not found at ${initFilePath}`)
  console.error('   Make sure the init.sql file exists in supabase/init/')
  process.exit(1)
}

console.log('🚀 Initializing Supabase database...')
console.log(`   Host: ${dbHost}`)
console.log(`   Database: ${dbName}`)
console.log(`   Init file: ${initFilePath}`)
console.log(`   Force mode: ${args.values.force ? 'YES (will overwrite existing data)' : 'NO (safe mode)'}`)
console.log('')

// Check if database has existing tables (unless force mode)
if (!args.values.force) {
  try {
    console.log('🔍 Checking for existing database objects...')
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      AND table_schema NOT LIKE 'pg_%'
    `

    const checkCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -t -c "${checkQuery}"`

    const result = execSync(checkCommand, { encoding: 'utf-8', stdio: 'pipe' })
    const tableCount = parseInt(result.trim(), 10)

    if (tableCount > 0) {
      console.error('❌ Error: Database already contains tables.')
      console.error(`   Found ${tableCount} existing table(s).`)
      console.error('')
      console.error('   To initialize anyway (this will overwrite existing data), use:')
      console.error('   pnpm run db:init --force')
      console.error('')
      console.error('   ⚠️  WARNING: --force will drop all existing data!')
      process.exit(1)
    }

    console.log('✅ Database appears to be empty. Proceeding with initialization...')
    console.log('')
  } catch (error) {
    console.error('❌ Error checking database state:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
} else {
  console.log('⚠️  FORCE MODE: Will attempt to initialize even if tables exist.')
  console.log('   Note: The init script should handle existing objects gracefully.')
  console.log('')
}

// Read the init SQL file
let initSql: string
try {
  initSql = readFileSync(initFilePath, 'utf-8')
  console.log(`✅ Read init file (${initSql.length} characters)`)
} catch (error) {
  console.error(`❌ Error reading init file: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

// Execute the init SQL
try {
  console.log('📝 Executing initialization script...')

  // Use psql to execute the SQL file
  const psqlCommand = `PGPASSWORD="${DB_PASSWORD}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${initFilePath}"`

  execSync(psqlCommand, {
    stdio: 'inherit',
    encoding: 'utf-8',
  })

  console.log('')
  console.log('✅ Database initialization completed successfully!')
  console.log('')
  console.log('📋 Next steps:')
  console.log('   1. Run migrations: pnpm run db:migrations:sync')
  console.log('   2. Generate types: pnpm run gen:types')
  console.log('')
} catch (error) {
  console.error('')
  console.error('❌ Error during database initialization:')
  console.error(error instanceof Error ? error.message : String(error))
  console.error('')
  console.error('💡 Tips:')
  console.error('   - Verify your database credentials in .env.local')
  console.error('   - Check that psql is installed and in your PATH')
  console.error('   - Ensure your Supabase project is accessible')
  console.error('   - Check the init.sql file for syntax errors')
  process.exit(1)
}
