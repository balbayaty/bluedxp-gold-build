/**
 * Add missing columns to database tables
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n🔧 Adding missing columns...\n')
  
  const columns = [
    { table: 'users', column: 'deleted_at', type: 'TIMESTAMP' },
    { table: 'tenants', column: 'feature_flags', type: 'JSONB' },
    { table: 'tenants', column: 'quotas', type: 'JSONB' },
    { table: 'tenants', column: 'billing_info', type: 'JSONB' },
    { table: 'tenants', column: 'compliance_requirements', type: 'JSONB' },
  ]
  
  for (const col of columns) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE ${col.table} ADD COLUMN IF NOT EXISTS ${col.column} ${col.type}`)
      console.log(`  ✅ ${col.table}.${col.column}`)
    } catch (e: any) {
      console.log(`  ⚠️ ${col.table}.${col.column}: ${e.message.substring(0, 40)}`)
    }
  }
  
  console.log('\n✅ Done!\n')
  await prisma.$disconnect()
}

main()










