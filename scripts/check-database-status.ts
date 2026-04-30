/**
 * Quick database status check
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('\n=== DATABASE STATUS CHECK ===\n')
    
    const tenants = await prisma.tenant.count()
    const users = await prisma.user.count()
    const roles = await prisma.role.count()
    const customers = await prisma.customer.count()
    const apiKeys = await prisma.aPIKey.count()
    
    console.log('📊 Record Counts:')
    console.log(`   Tenants:   ${tenants}`)
    console.log(`   Users:     ${users}`)
    console.log(`   Roles:     ${roles}`)
    console.log(`   Customers: ${customers}`)
    console.log(`   API Keys:  ${apiKeys}`)
    console.log('')
    
    if (tenants === 0 && users === 0) {
      console.log('⚠️  No seed data found')
      console.log('   Run: npm run seed:user-management')
      console.log('')
    } else {
      console.log('✅ Database has data')
      
      // Show sample tenant
      const tenant = await prisma.tenant.findFirst()
      if (tenant) {
        console.log(`\n📁 Sample Tenant: ${tenant.name} (${tenant.status})`)
      }
      
      // Show sample user
      const user = await prisma.user.findFirst()
      if (user) {
        console.log(`👤 Sample User: ${user.name} <${user.email}> - ${user.role}`)
      }
    }
    
    console.log('\n=============================\n')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()










