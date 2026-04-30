/**
 * Update Existing Users with Enhanced Profile Fields
 * 
 * Adds fullName, kunya, firstName, lastName to existing test users
 * 
 * Run: npx ts-node --project tsconfig.scripts.json scripts/update-user-profiles.ts
 */

import { prisma } from '../lib/services/database/prismaClient'

interface UserProfileUpdate {
  email: string
  fullName: string
  firstName: string
  lastName: string
  kunya: string
  displayName: string
  title?: string
}

const USER_PROFILES: UserProfileUpdate[] = [
  {
    email: 'superadmin@hazalyze.com',
    fullName: 'Basheer Albayaty',
    firstName: 'Basheer',
    lastName: 'Albayaty',
    kunya: 'Abu Khalid',
    displayName: 'Basheer',
    title: 'Eng.',
  },
  {
    email: 'bdm@hazalyze.com',
    fullName: 'Mohammed Al-Rashid',
    firstName: 'Mohammed',
    lastName: 'Al-Rashid',
    kunya: 'Abu Omar',
    displayName: 'Mohammed',
  },
  {
    email: 'tgm@hazalyze.com',
    fullName: 'Khalid Al-Mansour',
    firstName: 'Khalid',
    lastName: 'Al-Mansour',
    kunya: 'Abu Fahad',
    displayName: 'Khalid',
  },
  {
    email: 'warehouse.head@hazalyze.com',
    fullName: 'Ahmed Al-Saud',
    firstName: 'Ahmed',
    lastName: 'Al-Saud',
    kunya: 'Abu Nasser',
    displayName: 'Ahmed',
  },
  {
    email: 'ops.manager@hazalyze.com',
    fullName: 'Fatima Al-Zahrani',
    firstName: 'Fatima',
    lastName: 'Al-Zahrani',
    kunya: 'Um Youssef',
    displayName: 'Fatima',
  },
  {
    email: 'cam@hazalyze.com',
    fullName: 'Sultan Al-Qahtani',
    firstName: 'Sultan',
    lastName: 'Al-Qahtani',
    kunya: 'Abu Turki',
    displayName: 'Sultan',
  },
  {
    email: 'warehouse.supervisor@hazalyze.com',
    fullName: 'Nasser Al-Dosari',
    firstName: 'Nasser',
    lastName: 'Al-Dosari',
    kunya: 'Abu Faisal',
    displayName: 'Nasser',
  },
  {
    email: 'warehouse.operator@hazalyze.com',
    fullName: 'Ali Al-Harbi',
    firstName: 'Ali',
    lastName: 'Al-Harbi',
    kunya: 'Abu Hamza',
    displayName: 'Ali',
  },
  {
    email: 'quality.manager@hazalyze.com',
    fullName: 'Sarah Al-Ghamdi',
    firstName: 'Sarah',
    lastName: 'Al-Ghamdi',
    kunya: 'Um Layla',
    displayName: 'Sarah',
  },
  {
    email: 'inventory.specialist@hazalyze.com',
    fullName: 'Omar Al-Shehri',
    firstName: 'Omar',
    lastName: 'Al-Shehri',
    kunya: 'Abu Rayan',
    displayName: 'Omar',
  },
  {
    email: 'customer.user@hazalyze.com',
    fullName: 'Youssef Al-Otaibi',
    firstName: 'Youssef',
    lastName: 'Al-Otaibi',
    kunya: 'Abu Abdullah',
    displayName: 'Youssef',
  },
  {
    email: 'customer.admin@hazalyze.com',
    fullName: 'Noura Al-Fayez',
    firstName: 'Noura',
    lastName: 'Al-Fayez',
    kunya: 'Um Sara',
    displayName: 'Noura',
  },
]

async function updateUserProfiles() {
  try {
    console.log('🔄 Updating user profiles with enhanced fields...\n')

    let updated = 0
    let notFound = 0

    for (const profile of USER_PROFILES) {
      const user = await prisma.user.findUnique({
        where: { email: profile.email },
      })

      if (!user) {
        console.log(`⚠️  User not found: ${profile.email}`)
        notFound++
        continue
      }

      await prisma.user.update({
        where: { email: profile.email },
        data: {
          fullName: profile.fullName,
          firstName: profile.firstName,
          lastName: profile.lastName,
          kunya: profile.kunya,
          displayName: profile.displayName,
          title: profile.title,
        },
      })

      console.log(`✅ Updated: ${profile.fullName} (${profile.kunya})`)
      updated++
    }

    console.log('\n📋 Summary:')
    console.log(`   Updated: ${updated} users`)
    console.log(`   Not found: ${notFound} users`)

    console.log('\n🎉 User profiles updated successfully!')
    console.log('\n✨ Users now have:')
    console.log('   • Full name (e.g., "Basheer Albayaty")')
    console.log('   • Kunya/Arabic honorific (e.g., "Abu Khalid")')
    console.log('   • First name, Last name')
    console.log('   • Display name')
  } catch (error) {
    console.error('❌ Error updating user profiles:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  updateUserProfiles()
    .then(() => {
      console.log('\n✅ Update complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Update failed:', error)
      process.exit(1)
    })
}

export { updateUserProfiles }
