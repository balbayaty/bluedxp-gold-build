/**
 * Database Connection Checker Script
 * 
 * Checks database connectivity and provides detailed status
 * Run with: npx tsx scripts/check-database-connection.ts
 * 
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

import { checkDatabaseHealth } from '../lib/services/system-admin/databaseHealthChecker'

async function main() {
  console.log('🔍 Checking database connection...\n')

  try {
    const health = await checkDatabaseHealth(true) // Force refresh

    console.log('📊 Database Health Status:')
    console.log('─'.repeat(50))
    console.log(`Connected: ${health.connected ? '✅ YES' : '❌ NO'}`)
    
    if (health.connected) {
      console.log(`Connection Time: ${health.connectionTime}ms`)
      
      if (health.queryPerformance) {
        console.log(`Query Performance: ${health.queryPerformance.avgResponseTime}ms`)
      }
      
      if (health.databaseInfo) {
        console.log(`Database: ${health.databaseInfo.name}`)
        if (health.databaseInfo.version) {
          console.log(`Version: ${health.databaseInfo.version.split(' ')[0]}`)
        }
      }
      
      if (health.poolStatus) {
        console.log(`Connection Pool: ${health.poolStatus.active} active, ${health.poolStatus.idle} idle`)
      }
    } else {
      console.log(`Error: ${health.error || 'Unknown error'}`)
    }

    console.log('\n💡 Recommendations:')
    if (!health.connected) {
      console.log('  - Check DATABASE_URL in .env.local')
      console.log('  - Ensure database server is running')
      console.log('  - Verify database credentials')
      console.log('  - Run: npx prisma migrate dev')
    } else {
      console.log('  ✅ Database is connected and ready!')
      console.log('  - Set NODE_ENV=production for production mode')
      console.log('  - Set ENABLE_DEMO_DATA=false to disable demo data')
    }

    process.exit(health.connected ? 0 : 1)
  } catch (error) {
    console.error('❌ Error checking database:', error)
    process.exit(1)
  }
}

main()



