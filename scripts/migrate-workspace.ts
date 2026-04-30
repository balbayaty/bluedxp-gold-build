/**
 * Workspace Module Migration Script
 * 
 * Run this after schema changes to migrate database
 */

import { execSync } from 'child_process'

console.log('🚀 Running workspace module migration...')

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })

  // Create and apply migration
  console.log('📝 Creating migration...')
  execSync('npx prisma migrate dev --name add_workspace_module', { stdio: 'inherit' })

  // Seed default categories
  console.log('🌱 Seeding default categories...')
  const { seedWorkspaceCategories } = await import('../prisma/seed/workspaceCategories')
  await seedWorkspaceCategories()

  console.log('✅ Workspace module migration complete!')
} catch (error) {
  console.error('❌ Migration failed:', error)
  process.exit(1)
}













