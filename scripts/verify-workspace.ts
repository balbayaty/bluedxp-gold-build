/**
 * Verify Workspace Module Setup
 * Checks database tables and seed data
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function verifyWorkspace() {
  console.log('🔍 Verifying Workspace Module Setup...\n')

  try {
    // Check tables exist by querying them
    console.log('📊 Checking Database Tables...')
    
    const categories = await prisma.widgetCategory.count()
    const widgets = await prisma.widgetDefinition.count()
    const layouts = await prisma.workspaceLayout.count()
    const userWidgets = await prisma.userWidget.count()
    const googleIntegrations = await prisma.googleWorkspaceIntegration.count()
    const emailIntegrations = await prisma.emailIntegration.count()
    const analytics = await prisma.workspaceAnalytics.count()

    console.log('✅ Database Tables Status:')
    console.log(`   - Widget Categories: ${categories}`)
    console.log(`   - Widget Definitions: ${widgets}`)
    console.log(`   - Workspace Layouts: ${layouts}`)
    console.log(`   - User Widgets: ${userWidgets}`)
    console.log(`   - Google Integrations: ${googleIntegrations}`)
    console.log(`   - Email Integrations: ${emailIntegrations}`)
    console.log(`   - Analytics Records: ${analytics}\n`)

    // Check seed data
    console.log('🌱 Checking Seed Data...')
    const systemCategories = await prisma.widgetCategory.findMany({
      where: { isSystem: true },
      orderBy: { order: 'asc' },
    })

    console.log(`✅ System Categories: ${systemCategories.length}`)
    if (systemCategories.length > 0) {
      console.log('   Categories found:')
      systemCategories.slice(0, 5).forEach(cat => {
        console.log(`   - ${cat.name} (${cat.slug})`)
      })
      if (systemCategories.length > 5) {
        console.log(`   ... and ${systemCategories.length - 5} more`)
      }
    }

    const activeWidgets = await prisma.widgetDefinition.findMany({
      where: { isActive: true },
      take: 5,
    })

    console.log(`\n✅ Active Widgets: ${await prisma.widgetDefinition.count({ where: { isActive: true } })}`)
    if (activeWidgets.length > 0) {
      console.log('   Sample widgets:')
      activeWidgets.forEach(w => {
        console.log(`   - ${w.name} (${w.type})`)
      })
    }

    console.log('\n✅ Verification Complete!')
    console.log('\n📋 Summary:')
    console.log(`   - Tables: ✅ All 7 tables exist`)
    console.log(`   - Categories: ${categories > 0 ? '✅' : '⚠️'} ${categories} categories`)
    console.log(`   - Widgets: ${widgets > 0 ? '✅' : '⚠️'} ${widgets} widgets`)
    console.log(`   - Seed Data: ${systemCategories.length > 0 ? '✅' : '⚠️'} ${systemCategories.length} system categories`)

    if (categories === 0 || widgets === 0) {
      console.log('\n⚠️  WARNING: Seed data not loaded!')
      console.log('   Run: npx ts-node prisma/seed/workspaceCategories.ts')
      console.log('   Run: npx ts-node prisma/seed/workspaceWidgets.ts')
    } else {
      console.log('\n🎉 Workspace Module is READY!')
    }

  } catch (error: any) {
    console.error('❌ Verification Error:', error.message)
    if (error.message.includes('does not exist')) {
      console.error('\n⚠️  Database tables not found!')
      console.error('   Run migration: npm run migrate:workspace')
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyWorkspace()

