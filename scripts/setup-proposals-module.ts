/**
 * Proposals & RFQ Module Setup Script
 * Run this to initialize the module and apply database migrations
 */

import { PrismaClient } from '@prisma/client'
import { initializeProposalsModule } from '@/lib/services/proposals/initialize'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function setupProposalsModule() {
  console.log('🚀 Setting up Proposals & RFQ Module...\n')

  try {
    // 1. Apply database migration
    console.log('📊 Applying database migration...')
    const migrationPath = join(process.cwd(), 'lib/database/migrations/004_proposals_rfq_module.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement)
      } catch (error: any) {
        // Ignore "already exists" errors
        if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
          console.warn(`Warning: ${error.message}`)
        }
      }
    }
    console.log('✅ Database migration applied\n')

    // 2. Initialize module
    console.log('🔧 Initializing module...')
    await initializeProposalsModule('default')
    console.log('✅ Module initialized\n')

    // 3. Create default content blocks
    console.log('📚 Creating default content blocks...')
    const defaultBlocks = [
      {
        id: `block-${Date.now()}-1`,
        tenantId: 'default',
        title: 'Executive Summary Template',
        content: 'This proposal outlines our comprehensive logistics solution designed to optimize your supply chain operations, reduce costs, and improve delivery performance.',
        category: 'EXECUTIVE_SUMMARY',
        tags: ['template', 'executive', 'summary'],
        type: 'TEXT',
        status: 'APPROVED',
        createdBy: 'system',
        updatedAt: new Date(),
      },
      {
        id: `block-${Date.now()}-2`,
        tenantId: 'default',
        title: 'Service Overview',
        content: 'Our comprehensive service portfolio includes warehousing, transportation, customs clearance, and value-added services tailored to your business needs.',
        category: 'SERVICES',
        tags: ['services', 'overview'],
        type: 'TEXT',
        status: 'APPROVED',
        createdBy: 'system',
        updatedAt: new Date(),
      },
      {
        id: `block-${Date.now()}-3`,
        tenantId: 'default',
        title: 'Pricing Section',
        content: 'Competitive pricing structure with volume discounts and flexible payment terms designed to maximize value for your organization.',
        category: 'PRICING',
        tags: ['pricing', 'commercial'],
        type: 'TEXT',
        status: 'APPROVED',
        createdBy: 'system',
        updatedAt: new Date(),
      },
    ]

    for (const block of defaultBlocks) {
      try {
        await prisma.contentBlockLibrary.create({
          data: block,
        })
      } catch (error: any) {
        if (!error.message?.includes('Unique constraint')) {
          console.warn(`Warning creating block: ${error.message}`)
        }
      }
    }
    console.log('✅ Default content blocks created\n')

    // 4. Verify setup
    console.log('✅ Verification...')
    const proposalCount = await prisma.proposal.count()
    const rfqCount = await prisma.rFQ.count()
    const blockCount = await prisma.contentBlockLibrary.count()
    
    console.log(`📊 Database Status:`)
    console.log(`   - Proposals: ${proposalCount}`)
    console.log(`   - RFQs: ${rfqCount}`)
    console.log(`   - Content Blocks: ${blockCount}\n`)

    console.log('🎉 Proposals & RFQ Module setup complete!')
    console.log('\n📝 Next Steps:')
    console.log('   1. Start your development server')
    console.log('   2. Navigate to /proposals to access the module')
    console.log('   3. Create your first proposal using the world-class builder')
    console.log('\n✨ Ready to use!')

  } catch (error) {
    console.error('❌ Error setting up module:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  setupProposalsModule()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default setupProposalsModule



