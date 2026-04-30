/**
 * 🚀 USER MANAGEMENT MIGRATION SCRIPT
 * 
 * Run this script to apply the user management system migration
 * 
 * Usage:
 *   npx tsx scripts/run-user-management-migration.ts
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function runMigration() {
  try {
    console.log('🚀 Starting User Management System Migration...\n')

    // Read migration SQL file
    const migrationPath = join(process.cwd(), 'prisma/migrations/007_add_user_management_models.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim().length === 0) continue

      try {
        console.log(`[${i + 1}/${statements.length}] Executing statement...`)
        await prisma.$executeRawUnsafe(statement)
        console.log(`✅ Statement ${i + 1} executed successfully\n`)
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)\n`)
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message)
          throw error
        }
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('\n📊 Next steps:')
    console.log('   1. Run: npx prisma generate')
    console.log('   2. Verify models in Prisma Studio: npx prisma studio')
    console.log('   3. Test the user management system')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
runMigration()













