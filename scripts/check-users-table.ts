/**
 * Check users table structure
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const columns = await prisma.$queryRaw<{column_name: string, data_type: string}[]>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `
    
    console.log('\n📋 USERS TABLE STRUCTURE:\n')
    for (const col of columns) {
      console.log(`   ${col.column_name}: ${col.data_type}`)
    }
    console.log('')
  } catch (e: any) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()










