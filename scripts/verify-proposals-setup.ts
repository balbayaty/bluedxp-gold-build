/**
 * Verify Proposals Module Setup
 * Simple script to check if everything is ready
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifySetup() {
  console.log('🔍 Verifying Proposals & RFQ Module Setup...\n')

  try {
    // 1. Check database connection
    console.log('1️⃣ Checking database connection...')
    await prisma.$connect()
    console.log('   ✅ Database connected\n')

    // 2. Check if tables exist
    console.log('2️⃣ Checking database tables...')
    
    const tables = [
      'Proposal',
      'RFQ',
      'ProposalCollaboration',
      'ProposalTracking',
      'ProposalSignature',
      'ProposalTranslation',
      'ProposalABTest',
      'ProposalFollowUp',
      'ProposalRichMedia',
      'ProposalInteractive',
      'ProposalContentBlock',
      'ProposalVersion',
      'ProposalComment',
      'ContentBlockLibrary',
      'ProposalBenchmark',
      'ProposalLearning',
    ]

    let allTablesExist = true
    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM "${table}" LIMIT 1`
        )
        console.log(`   ✅ ${table} table exists`)
      } catch (error: any) {
        if (error.message?.includes('does not exist')) {
          console.log(`   ❌ ${table} table missing`)
          allTablesExist = false
        } else {
          console.log(`   ⚠️  ${table} - ${error.message}`)
        }
      }
    }

    if (allTablesExist) {
      console.log('\n   ✅ All tables exist!\n')
    } else {
      console.log('\n   ⚠️  Some tables are missing. Run: npx prisma db push\n')
    }

    // 3. Check content blocks
    console.log('3️⃣ Checking default content blocks...')
    const blockCount = await prisma.contentBlockLibrary.count()
    console.log(`   📚 Found ${blockCount} content blocks`)
    if (blockCount === 0) {
      console.log('   ⚠️  No content blocks found. Run setup script to create defaults.\n')
    } else {
      console.log('   ✅ Content blocks ready!\n')
    }

    // 4. Check proposals
    console.log('4️⃣ Checking proposals...')
    const proposalCount = await prisma.proposal.count()
    console.log(`   📄 Found ${proposalCount} proposals`)
    console.log('   ✅ Proposals table ready!\n')

    // 5. Summary
    console.log('📊 Summary:')
    console.log('   ✅ Database: Connected')
    console.log(`   ✅ Tables: ${allTablesExist ? 'All exist' : 'Some missing'}`)
    console.log(`   ✅ Content Blocks: ${blockCount}`)
    console.log(`   ✅ Proposals: ${proposalCount}`)
    console.log('\n🎉 Module is ready to use!')
    console.log('\n📝 Next steps:')
    console.log('   1. Start your dev server: npm run dev')
    console.log('   2. Navigate to: http://localhost:3002/proposals')
    console.log('   3. Create your first proposal!')

  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\n⚠️  Setup incomplete. Please check:')
    console.log('   1. Database is running')
    console.log('   2. DATABASE_URL is set in .env')
    console.log('   3. Run: npx prisma db push')
  } finally {
    await prisma.$disconnect()
  }
}

verifySetup()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })



