/**
 * 🚀 FIX TABLE NAMES
 * 
 * Renames tables from PascalCase to lowercase to match Prisma schema
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

const prisma = new PrismaClient()

async function renameTable(oldName: string, newName: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${oldName}" RENAME TO "${newName}"`)
    console.log(`  ✅ Renamed ${oldName} → ${newName}`)
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      console.log(`  ⏭️  ${oldName} - Table doesn't exist (may already be renamed)`)
    } else if (error.message?.includes('already exists')) {
      console.log(`  ⏭️  ${newName} - Already exists`)
    } else {
      throw error
    }
  }
}

async function main() {
  console.log('\n🔧 FIXING TABLE NAMES\n')
  console.log('='.repeat(60) + '\n')

  const renames = [
    { old: 'Role', new: 'roles' },
    { old: 'CustomerUser', new: 'customer_users' },
    { old: 'PermissionTemplate', new: 'permission_templates' },
    { old: 'RoleAssignment', new: 'role_assignments' },
    { old: 'UsageMetric', new: 'usage_metrics' },
    { old: 'AgentUsage', new: 'agent_usage' },
  ]

  for (const rename of renames) {
    await renameTable(rename.old, rename.new)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ TABLE NAMES FIXED!')
  console.log('='.repeat(60) + '\n')

  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})













