/**
 * Fix Database Columns and Seed Test Data
 */
import { PrismaClient } from '@prisma/client'
import * as crypto from 'crypto'

// Simple password hashing (for development - use proper hashing in production)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'salt').digest('hex')
}

const prisma = new PrismaClient()

async function main() {
  console.log('\n🔧 FIXING DATABASE AND SEEDING DATA\n')
  
  try {
    // Add missing columns to tenants
    console.log('Adding missing columns...')
    
    try {
      await prisma.$executeRaw`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS feature_flags JSONB`
      await prisma.$executeRaw`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS quotas JSONB`
      await prisma.$executeRaw`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_info JSONB`
      await prisma.$executeRaw`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS compliance_requirements JSONB`
      console.log('  ✅ Tenants columns updated')
    } catch (e: any) {
      console.log('  ⚠️ Tenants:', e.message.substring(0, 50))
    }
    
    // Check users table and create test user
    const userCount = await prisma.user.count()
    console.log(`\n📊 Current users: ${userCount}`)
    
    if (userCount === 0) {
      console.log('\n📦 Creating test user...\n')
      
      // Get tenant
      const tenants = await prisma.$queryRaw<{id: string}[]>`SELECT id FROM tenants LIMIT 1`
      const tenantId = tenants[0]?.id || 'tenant-default'
      
      // Hash password
      const passwordHash = hashPassword('admin123')
      
      // Create users using raw SQL to avoid schema mismatch issues
      const users = [
        { email: 'admin@bluedxp.com', name: 'System Administrator', role: 'SYSTEM_ADMIN' },
        { email: 'manager@bluedxp.com', name: 'Warehouse Manager', role: 'WAREHOUSE_MANAGER' },
        { email: 'operator@bluedxp.com', name: 'Warehouse Operator', role: 'WAREHOUSE_OPERATOR' },
        { email: 'viewer@bluedxp.com', name: 'Report Viewer', role: 'VIEWER' },
      ]
      
      for (const userData of users) {
        try {
          const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
          await prisma.$executeRawUnsafe(`
            INSERT INTO users (
              id, "tenantId", email, "passwordHash", name, role, status, 
              "assignedCustomers", "assignedWarehouses", "assignedRegions",
              permissions, preferences, "createdAt", "updatedAt", "loginCount"
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, 'ACTIVE', 
              '{}'::text[], '{}'::text[], '{}'::text[],
              '[]'::jsonb, '{"theme":"dark","language":"en","timezone":"UTC"}'::jsonb, 
              NOW(), NOW(), 0
            )
            ON CONFLICT (email) DO NOTHING
          `, userId, tenantId, userData.email, passwordHash, userData.name, userData.role)
          console.log(`  ✅ Created user: ${userData.email} (${userData.role})`)
        } catch (e: any) {
          console.log(`  ⚠️ ${userData.email}: ${e.message.substring(0, 100)}`)
        }
      }
      
      console.log('\n✅ Test users created!')
    } else {
      console.log('✅ Users already exist')
    }
    
    // Final status
    console.log('\n📊 FINAL DATABASE STATUS:\n')
    
    const finalCounts = {
      tenants: await prisma.$queryRaw<{count: string}[]>`SELECT COUNT(*) as count FROM tenants`,
      users: await prisma.user.count(),
      roles: await prisma.$queryRaw<{count: string}[]>`SELECT COUNT(*) as count FROM roles`,
      customers: await prisma.$queryRaw<{count: string}[]>`SELECT COUNT(*) as count FROM customers`,
      apiKeys: await prisma.aPIKey.count(),
    }
    
    console.log(`   Tenants:   ${finalCounts.tenants[0]?.count || 0}`)
    console.log(`   Users:     ${finalCounts.users}`)
    console.log(`   Roles:     ${finalCounts.roles[0]?.count || 0}`)
    console.log(`   Customers: ${finalCounts.customers[0]?.count || 0}`)
    console.log(`   API Keys:  ${finalCounts.apiKeys}`)
    
    console.log('\n✅ DATABASE SETUP COMPLETE!\n')
    console.log('🔑 Test Login Credentials:')
    console.log('   Email: admin@bluedxp.com')
    console.log('   Password: admin123')
    console.log('')
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

