/**
 * 🚀 VERIFY USER MANAGEMENT TABLES
 * 
 * Checks if all user management tables exist in the database
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

const prisma = new PrismaClient()

// Tables that should exist
const REQUIRED_TABLES = [
  'users', // User model
  'roles', // Role model
  'api_keys', // APIKey model
  'customer_users', // CustomerUser model
  'permission_templates', // PermissionTemplate model
  'role_assignments', // RoleAssignment model
  'usage_metrics', // UsageMetric model
  'agent_usage', // AgentUsage model
  'sessions', // Session model
  'device_sessions', // DeviceSession model
]

async function checkTable(tableName: string): Promise<boolean> {
  try {
    // Try to query the table
    await prisma.$queryRawUnsafe(`SELECT 1 FROM "${tableName}" LIMIT 1`)
    return true
  } catch (error: any) {
    // Check if it's a "does not exist" error
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      return false
    }
    // Other errors might mean table exists but has issues
    console.warn(`Warning checking ${tableName}:`, error.message)
    return false
  }
}

async function main() {
  console.log('\n🔍 VERIFYING USER MANAGEMENT TABLES\n')
  console.log('='.repeat(60) + '\n')

  const results: { table: string; exists: boolean }[] = []

  for (const table of REQUIRED_TABLES) {
    const exists = await checkTable(table)
    results.push({ table, exists })
    console.log(`${exists ? '✅' : '❌'} ${table}`)
  }

  console.log('\n' + '='.repeat(60))
  
  const missing = results.filter(r => !r.exists)
  if (missing.length === 0) {
    console.log('✅ ALL TABLES EXIST!')
  } else {
    console.log(`\n⚠️  ${missing.length} TABLE(S) MISSING:`)
    missing.forEach(m => console.log(`   - ${m.table}`))
    console.log('\n💡 Run the migration to create missing tables:')
    console.log('   npx prisma migrate deploy')
    console.log('   OR')
    console.log('   psql $DATABASE_URL -f prisma/migrations/007_add_user_management_models.sql')
  }

  console.log('\n')
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })













