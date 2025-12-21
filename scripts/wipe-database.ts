#!/usr/bin/env tsx

/**
 * @fileoverview Script to completely wipe Supabase database.
 *
 * This script connects to your Supabase project and drops ALL objects including:
 * - All tables in public schema
 * - All custom functions
 * - All triggers
 * - All indexes
 * - Resets migration history
 *
 * ⚠️  WARNING: This is a destructive operation that cannot be undone!
 *
 * @example
 * ```bash
 * # Wipe the database completely
 * pnpm run db:wipe
 *
 * # Or run directly
 * npx tsx scripts/wipe-database.ts
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
import { createInterface } from 'readline'
import { writeFileSync, unlinkSync } from 'fs'
import * as dotenv from 'dotenv'

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
 * Generates SQL commands to completely wipe the database.
 */
function generateWipeCommands(): string[] {
  return [
    // Disable foreign key checks temporarily
    'SET session_replication_role = replica;',

    // Drop all tables in public schema (in correct order to avoid FK constraints)
    `DO $$ 
    DECLARE 
        r RECORD;
    BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename DESC) LOOP
            EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
    END $$;`,

    // Drop all custom functions in public schema
    `DO $$ 
    DECLARE 
        r RECORD;
    BEGIN
        FOR r IN (SELECT proname, oidvectortypes(pro.proargtypes) as args FROM pg_proc pro JOIN pg_namespace nsp ON pro.pronamespace = nsp.oid WHERE nsp.nspname = 'public' AND pro.proname NOT LIKE 'pg_%') LOOP
            EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
        END LOOP;
    END $$;`,

    // Drop all triggers in public schema
    `DO $$ 
    DECLARE 
        r RECORD;
    BEGIN
        FOR r IN (SELECT tgname FROM pg_trigger tg JOIN pg_class t ON tg.tgrelid = t.oid JOIN pg_namespace nsp ON t.relnamespace = nsp.oid WHERE nsp.nspname = 'public') LOOP
            EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON ALL TABLES IN SCHEMA public CASCADE';
        END LOOP;
    END $$;`,

    // Clear migration history
    'DELETE FROM supabase_migrations.schema_migrations WHERE true;',

    // Reset sequences
    `DO $$ 
    DECLARE 
        r RECORD;
    BEGIN
        FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
            EXECUTE 'ALTER SEQUENCE public.' || quote_ident(r.sequence_name) || ' RESTART WITH 1';
        END LOOP;
    END $$;`,

    // Re-enable foreign key checks
    'SET session_replication_role = DEFAULT;',
  ]
}

/**
 * Main wipe function.
 */
async function main(): Promise<void> {
  try {
    console.log('🔧 Starting Supabase database wipe...')
    console.log(`📋 Project ID: ${SUPABASE_PROJECT_ID}`)
    console.log('⚠️  WARNING: This will completely destroy all data in the database!')

    // Ask for confirmation
    console.log('\n🛑 To proceed, type: WIPE_DATABASE_CONFIRM')
    process.stdout.write('Confirmation: ')

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const confirmation = await new Promise<string>((resolve) => {
      rl.question('', (answer: string) => resolve(answer.trim()))
    })
    rl.close()

    if (confirmation !== 'WIPE_DATABASE_CONFIRM') {
      console.log('❌ Confirmation failed. Operation cancelled.')
      process.exit(1)
    }

    console.log('✅ Confirmation received.')

    // Ask if user wants to create a backup first
    console.log('\n💾 This will erase all your data! Would you like me to make a backup first?')
    process.stdout.write('Create backup? (Y/n): ')

    const rl2 = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const backupConfirmation = await new Promise<string>((resolve) => {
      rl2.question('', (answer: string) => resolve(answer.trim().toLowerCase()))
    })
    rl2.close()

    // Default to Yes unless user explicitly says no
    if (backupConfirmation === '' || backupConfirmation === 'y' || backupConfirmation === 'yes') {
      console.log('🔧 Creating backup before wiping...')

      try {
        // Execute the backup script
        const backupCommand = 'npx tsx scripts/backup-database.ts --schema-only'

        console.log(`📝 Executing: ${backupCommand}`)
        execSync(backupCommand, {
          stdio: 'inherit',
          cwd: process.cwd(),
        })

        console.log('✅ Backup created successfully!')
        console.log('📁 Check the backups/ directory for the backup file')
      } catch (backupError) {
        console.error('❌ Backup creation failed:', backupError)
        console.log('🛑 Aborting wipe operation due to backup failure')
        process.exit(1)
      }
    } else {
      console.log('⚠️  Skipping backup (user choice)')
    }

    console.log('🗑️  Proceeding with database wipe...')

    // Build database connection string
    const connectionString = buildDatabaseConnectionString()

    // Generate wipe commands
    const wipeCommands = generateWipeCommands()
    const wipeSQL = wipeCommands.join('\n')

    // Write commands to temporary file
    const tempFile = join(process.cwd(), '.temp-wipe.sql')
    writeFileSync(tempFile, wipeSQL)

    try {
      console.log('🗑️  Dropping all database objects...')

      // Execute wipe commands
      execSync(`psql "${connectionString}" < "${tempFile}"`, { stdio: 'inherit' })

      console.log('✅ Database wiped successfully!')
      console.log('📊 All tables, functions, triggers, and migration history have been removed.')
    } finally {
      // Clean up temporary file
      try {
        unlinkSync(tempFile)
      } catch {
        // Ignore cleanup errors
      }
    }

    console.log('\n🎉 Database is now clean and ready for restoration!')
  } catch (error) {
    console.error('❌ Database wipe failed:', error)
    process.exit(1)
  }
}

// Run the wipe
main().catch(console.error)
