/**
 * Sync User Names - Update the 'name' field to match 'fullName'
 * This ensures all components display the proper full name
 * 
 * Run: npx ts-node --project tsconfig.scripts.json scripts/sync-user-names.ts
 */

import { prisma } from '../lib/services/database/prismaClient'

async function syncUserNames() {
  try {
    console.log('🔄 Syncing user names with fullName...\n')

    // Get all users with fullName set
    const users = await prisma.user.findMany({
      where: { 
        fullName: { not: null }
      }
    })

    let updated = 0

    for (const user of users) {
      if (user.fullName && user.name !== user.fullName) {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: user.fullName }
        })
        console.log(`✅ ${user.email}: "${user.name}" → "${user.fullName}"`)
        updated++
      } else {
        console.log(`⏭️  ${user.email}: Already synced`)
      }
    }

    console.log(`\n📋 Summary: Updated ${updated} users`)
    console.log('🎉 Done! Log out and log back in to see the changes.')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

syncUserNames()
