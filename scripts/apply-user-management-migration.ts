/**
 * 🚀 APPLY USER MANAGEMENT MIGRATION
 * 
 * Applies the user management migration SQL file directly
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

const prisma = new PrismaClient()

async function applyMigration() {
  console.log('\n🚀 APPLYING USER MANAGEMENT MIGRATION\n')
  console.log('='.repeat(60) + '\n')

  try {
    // Read the SQL migration file
    const migrationFile = path.join(process.cwd(), 'prisma', 'migrations', '007_add_user_management_models.sql')
    
    if (!fs.existsSync(migrationFile)) {
      console.error('❌ Migration file not found:', migrationFile)
      process.exit(1)
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8')
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements\n`)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip empty statements and comments
      if (!statement || statement.startsWith('--')) {
        continue
      }

      try {
        // Execute the statement
        await prisma.$executeRawUnsafe(statement)
        successCount++
        
        // Show progress for CREATE TABLE statements
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          const tableMatch = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?"?(\w+)"?/i)
          if (tableMatch) {
            console.log(`  ✅ Created table: ${tableMatch[1]}`)
          }
        }
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate') ||
            error.code === '42P07') {
          console.log(`  ⏭️  Table already exists (skipped)`)
          successCount++
        } else {
          errorCount++
          console.error(`  ❌ Error in statement ${i + 1}:`, error.message)
          // Don't fail on index errors if table doesn't exist yet
          if (!error.message?.includes('does not exist')) {
            console.error(`     Statement: ${statement.substring(0, 100)}...`)
          }
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Migration applied: ${successCount} statements succeeded`)
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} statements had errors (may be expected)`)
    }
    console.log('='.repeat(60) + '\n')

    // Generate Prisma client
    console.log('📦 Generating Prisma client...')
    const { execSync } = require('child_process')
    try {
      execSync('npx prisma generate', { stdio: 'inherit' })
      console.log('✅ Prisma client generated\n')
    } catch (error) {
      console.error('⚠️  Failed to generate Prisma client. Run manually: npx prisma generate')
    }

    // Verify tables
    console.log('🔍 Verifying tables...')
    try {
      execSync('npx ts-node --project tsconfig.scripts.json scripts/verify-user-management-tables.ts', { stdio: 'inherit' })
    } catch (error) {
      console.error('⚠️  Verification script failed')
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

