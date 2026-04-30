/**
 * Seed Workspace Data
 * Seeds categories and widgets
 */

import { seedWorkspaceCategories } from '../prisma/seed/workspaceCategories.js'
import { seedWorkspaceWidgets } from '../prisma/seed/workspaceWidgets.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding workspace data...\n')

  try {
    // Seed categories
    console.log('📁 Seeding categories...')
    await seedWorkspaceCategories()
    console.log('✅ Categories seeded\n')

    // Seed widgets
    console.log('📦 Seeding widgets...')
    await seedWorkspaceWidgets()
    console.log('✅ Widgets seeded\n')

    // Verify
    const categoryCount = await prisma.widgetCategory.count({ where: { isSystem: true } })
    const widgetCount = await prisma.widgetDefinition.count({ where: { isActive: true } })

    console.log('📊 Verification:')
    console.log(`   Categories: ${categoryCount}`)
    console.log(`   Widgets: ${widgetCount}\n`)

    console.log('✅ Workspace seeding complete!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seed()

