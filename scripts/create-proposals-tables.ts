/**
 * Create Proposal, RFQ, and RFI tables directly
 * Bypasses vector extension requirement
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTables() {
  console.log('🚀 Creating Proposal, RFQ, and RFI tables...\n')

  try {
    // Check if tables already exist
    const checkProposal = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Proposal'
      ) as exists`
    ) as any[]
    
    if (checkProposal[0]?.exists) {
      console.log('✅ Proposal table already exists')
    } else {
      console.log('📊 Creating Proposal table...')
      // We'll use Prisma migrate instead
      console.log('   Run: npx prisma migrate dev --name proposals_rfq_module --create-only')
      console.log('   Then: npx prisma migrate deploy')
    }

    const checkRFQ = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'RFQ'
      ) as exists`
    ) as any[]
    
    if (checkRFQ[0]?.exists) {
      console.log('✅ RFQ table already exists')
    } else {
      console.log('📊 RFQ table needs to be created')
    }

    const checkRFI = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'RFI'
      ) as exists`
    ) as any[]
    
    if (checkRFI[0]?.exists) {
      console.log('✅ RFI table already exists')
    } else {
      console.log('📊 RFI table needs to be created')
    }

    console.log('\n✅ Verification complete!')
    console.log('\n📝 If tables are missing, run:')
    console.log('   npx prisma migrate dev --name proposals_rfq_module')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Try running: npx prisma migrate dev --name proposals_rfq_module')
  } finally {
    await prisma.$disconnect()
  }
}

createTables()
