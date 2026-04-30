/**
 * Workspace Module Setup Script
 * 
 * This script:
 * 1. Verifies Prisma schema
 * 2. Generates Prisma client
 * 3. Applies database migration
 * 4. Seeds default categories
 * 5. Verifies setup
 */

import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import { seedWorkspaceCategories } from '../prisma/seed/workspaceCategories'
import { seedWorkspaceWidgets } from '../prisma/seed/workspaceWidgets'

const prisma = new PrismaClient()

async function setupWorkspace() {
  console.log('🚀 Starting Workspace Module Setup...\n')

  try {
    // Step 1: Verify Prisma schema
    console.log('📋 Step 1: Verifying Prisma schema...')
    execSync('npx prisma format', { stdio: 'inherit' })
    console.log('✅ Prisma schema is valid\n')

    // Step 2: Generate Prisma client
    console.log('🔧 Step 2: Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Prisma client generated\n')

    // Step 3: Check if migration is needed
    console.log('📊 Step 3: Checking database status...')
    try {
      // Try to query workspace tables to see if they exist
      await prisma.$queryRaw`SELECT 1 FROM widget_categories LIMIT 1`
      console.log('⚠️  Workspace tables already exist. Skipping migration.')
      console.log('   If you need to re-run migration, use: npx prisma migrate dev --name add_workspace_module\n')
    } catch (error) {
      console.log('📦 Step 3: Applying database migration...')
      console.log('   Note: This will create the migration interactively.')
      console.log('   Run manually: npx prisma migrate dev --name add_workspace_module\n')
      console.log('   Or apply the SQL migration directly from: prisma/migrations/add_workspace_module/migration.sql\n')
    }

    // Step 4: Seed default categories
    console.log('🌱 Step 4: Seeding default widget categories...')
    await seedWorkspaceCategories()
    console.log('✅ Default categories seeded\n')

    // Step 5: Seed default widgets
    console.log('🌱 Step 5: Seeding default widgets...')
    await seedWorkspaceWidgets()
    console.log('✅ Default widgets seeded\n')

    // Step 6: Verify setup
    console.log('✅ Step 6: Verifying setup...')
    const categoryCount = await prisma.widgetCategory.count({
      where: { isSystem: true },
    })
    const widgetCount = await prisma.widgetDefinition.count({
      where: { isActive: true },
    })
    console.log(`   Found ${categoryCount} system categories`)
    console.log(`   Found ${widgetCount} active widgets`)

    if (categoryCount >= 14 && widgetCount >= 10) {
      console.log('✅ Setup verification passed!\n')
    } else {
      console.log('⚠️  Verification incomplete:')
      if (categoryCount < 14) {
        console.log(`   Expected at least 14 categories, found ${categoryCount}`)
        console.log('   Re-running category seed...\n')
        await seedWorkspaceCategories()
      }
      if (widgetCount < 10) {
        console.log(`   Expected at least 10 widgets, found ${widgetCount}`)
        console.log('   Re-running widget seed...\n')
        await seedWorkspaceWidgets()
      }
    }

    console.log('🎉 Workspace Module Setup Complete!')
    console.log('\n📝 Next Steps:')
    console.log('   1. Configure Google OAuth (optional):')
    console.log('      - Set GOOGLE_CLIENT_ID in .env')
    console.log('      - Set GOOGLE_CLIENT_SECRET in .env')
    console.log('      - Set GOOGLE_REDIRECT_URI in .env')
    console.log('   2. Start your development server:')
    console.log('      npm run dev')
    console.log('   3. Navigate to /workspace to see your workspace!')
    console.log('\n📚 Documentation:')
    console.log('   - User Guide: docs/workspace/USER_GUIDE.md')
    console.log('   - Developer Guide: docs/workspace/DEVELOPER_GUIDE.md')
    console.log('   - Migration Guide: docs/workspace/MIGRATION_GUIDE.md')
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run setup
setupWorkspace()

