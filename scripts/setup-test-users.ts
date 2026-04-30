/**
 * Test Users Setup Script
 * 
 * Creates comprehensive test users with different roles and permissions
 * for testing the authentication and permission management system
 * 
 * Run: npm run setup:test-users
 */

import { prisma } from '../lib/services/database/prismaClient'
import { hashPassword } from '../lib/services/auth/passwordService'
import { UserRole, getDefaultPermissions } from '../types/user'

interface TestUser {
  email: string
  password: string
  name: string
  role: UserRole
  tenantId: string
  description: string
  permissions?: any[]
  assignedCustomers?: string[]
  assignedWarehouses?: string[]
  // Enhanced profile fields for localization
  fullName?: string           // Full formal name
  kunya?: string              // Arabic honorific nickname (e.g., "Abu Khalid", "Um Ahmed")
  displayName?: string        // Preferred display name
  firstName?: string          // First name
  lastName?: string           // Last name / Family name
  title?: string              // Mr., Mrs., Dr., Eng., etc.
}

const TEST_USERS: TestUser[] = [
  {
    email: 'superadmin@hazalyze.com',
    password: 'SuperAdmin@2024!',
    name: 'Super Administrator',
    fullName: 'Basheer Albayaty',
    firstName: 'Basheer',
    lastName: 'Albayaty',
    kunya: 'Abu Khalid',  // Arabic honorific - "Father of Khalid"
    displayName: 'Basheer',
    title: 'Eng.',
    role: 'SYSTEM_ADMIN',
    tenantId: 'default-tenant',
    description: 'Full system access - can see and manage everything',
    permissions: [
      {
        resource: '*',
        actions: ['*'],
        scope: 'ALL',
      },
    ],
  },
  {
    email: 'bdm@hazalyze.com',
    password: 'BDM@2024!',
    name: 'Business Development Manager',
    fullName: 'Mohammed Al-Rashid',
    firstName: 'Mohammed',
    lastName: 'Al-Rashid',
    kunya: 'Abu Omar',
    displayName: 'Mohammed',
    role: 'BUSINESS_DEVELOPMENT_MANAGER',
    tenantId: 'default-tenant',
    description: 'Business development and customer management',
    assignedCustomers: ['customer-1', 'customer-2'],
  },
  {
    email: 'tgm@hazalyze.com',
    password: 'TGM@2024!',
    name: 'Transport General Manager',
    fullName: 'Khalid Al-Mansour',
    firstName: 'Khalid',
    lastName: 'Al-Mansour',
    kunya: 'Abu Fahad',
    displayName: 'Khalid',
    role: 'TRANSPORT_GENERAL_MANAGER',
    tenantId: 'default-tenant',
    description: 'Transportation operations management',
  },
  {
    email: 'warehouse.head@hazalyze.com',
    password: 'WH@2024!',
    name: 'Warehouse Head',
    fullName: 'Ahmed Al-Saud',
    firstName: 'Ahmed',
    lastName: 'Al-Saud',
    kunya: 'Abu Nasser',
    displayName: 'Ahmed',
    role: 'WAREHOUSE_HEAD',
    tenantId: 'default-tenant',
    description: 'Warehouse operations oversight',
    assignedWarehouses: ['warehouse-1', 'warehouse-2'],
  },
  {
    email: 'ops.manager@hazalyze.com',
    password: 'OPS@2024!',
    name: 'Operations Manager',
    fullName: 'Fatima Al-Zahrani',
    firstName: 'Fatima',
    lastName: 'Al-Zahrani',
    kunya: 'Um Youssef',  // Arabic honorific - "Mother of Youssef"
    displayName: 'Fatima',
    role: 'OPERATIONS_MANAGER',
    tenantId: 'default-tenant',
    description: 'Day-to-day operations management',
  },
  {
    email: 'cam@hazalyze.com',
    password: 'CAM@2024!',
    name: 'Customer Account Manager',
    fullName: 'Sultan Al-Qahtani',
    firstName: 'Sultan',
    lastName: 'Al-Qahtani',
    kunya: 'Abu Turki',
    displayName: 'Sultan',
    role: 'CUSTOMER_ACCOUNT_MANAGER',
    tenantId: 'default-tenant',
    description: 'Customer relationship management',
    assignedCustomers: ['customer-1', 'customer-2', 'customer-3'],
  },
  {
    email: 'warehouse.supervisor@hazalyze.com',
    password: 'WS@2024!',
    name: 'Warehouse Supervisor',
    fullName: 'Nasser Al-Dosari',
    firstName: 'Nasser',
    lastName: 'Al-Dosari',
    kunya: 'Abu Faisal',
    displayName: 'Nasser',
    role: 'WAREHOUSE_SUPERVISOR',
    tenantId: 'default-tenant',
    description: 'Warehouse supervision and coordination',
    assignedWarehouses: ['warehouse-1'],
  },
  {
    email: 'warehouse.operator@hazalyze.com',
    password: 'WO@2024!',
    name: 'Warehouse Operator',
    fullName: 'Ali Al-Harbi',
    firstName: 'Ali',
    lastName: 'Al-Harbi',
    kunya: 'Abu Hamza',
    displayName: 'Ali',
    role: 'WAREHOUSE_OPERATOR',
    tenantId: 'default-tenant',
    description: 'Warehouse operational tasks',
    assignedWarehouses: ['warehouse-1'],
  },
  {
    email: 'quality.manager@hazalyze.com',
    password: 'QM@2024!',
    name: 'Quality Manager',
    fullName: 'Sarah Al-Ghamdi',
    firstName: 'Sarah',
    lastName: 'Al-Ghamdi',
    kunya: 'Um Layla',
    displayName: 'Sarah',
    role: 'QUALITY_MANAGER',
    tenantId: 'default-tenant',
    description: 'Quality assurance and compliance',
  },
  {
    email: 'inventory.specialist@hazalyze.com',
    password: 'IS@2024!',
    name: 'Inventory Specialist',
    fullName: 'Omar Al-Shehri',
    firstName: 'Omar',
    lastName: 'Al-Shehri',
    kunya: 'Abu Rayan',
    displayName: 'Omar',
    role: 'INVENTORY_SPECIALIST',
    tenantId: 'default-tenant',
    description: 'Inventory management and tracking',
    assignedWarehouses: ['warehouse-1', 'warehouse-2'],
  },
  {
    email: 'customer.user@hazalyze.com',
    password: 'CU@2024!',
    name: 'Customer User',
    fullName: 'Youssef Al-Otaibi',
    firstName: 'Youssef',
    lastName: 'Al-Otaibi',
    kunya: 'Abu Abdullah',
    displayName: 'Youssef',
    role: 'CUSTOMER_USER',
    tenantId: 'default-tenant',
    description: 'Customer portal access - limited view',
    assignedCustomers: ['customer-1'],
  },
  {
    email: 'customer.admin@hazalyze.com',
    password: 'CA@2024!',
    name: 'Customer Admin',
    fullName: 'Noura Al-Fayez',
    firstName: 'Noura',
    lastName: 'Al-Fayez',
    kunya: 'Um Sara',
    displayName: 'Noura',
    role: 'CUSTOMER_ADMIN',
    tenantId: 'default-tenant',
    description: 'Customer portal administration',
    assignedCustomers: ['customer-1'],
  },
]

async function setupTestUsers() {
  try {
    console.log('🔐 Setting up test users...\n')

    const createdUsers: string[] = []
    const skippedUsers: string[] = []

    for (const userData of TEST_USERS) {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (existing) {
        console.log(`⏭️  Skipping ${userData.email} (already exists)`)
        skippedUsers.push(userData.email)
        continue
      }

      // Hash password
      const passwordHash = await hashPassword(userData.password)

      // Get default permissions for role
      const defaultPermissions = getDefaultPermissions(userData.role)

      // Create user with enhanced profile fields
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          name: userData.name,
          role: userData.role,
          tenantId: userData.tenantId,
          status: 'ACTIVE',
          emailVerified: true,
          emailVerifiedAt: new Date(),
          permissions: (userData.permissions || defaultPermissions) as any,
          assignedCustomers: userData.assignedCustomers || [],
          assignedWarehouses: userData.assignedWarehouses || [],
          // Enhanced profile fields for localization (Arabic culture support)
          fullName: userData.fullName,
          firstName: userData.firstName,
          lastName: userData.lastName,
          kunya: userData.kunya,       // Arabic honorific (Abu/Um + child's name)
          displayName: userData.displayName,
          title: userData.title,
          preferences: {
            theme: 'dark',
            language: 'en',
            timezone: 'Asia/Riyadh',  // Saudi Arabia timezone
            dateFormat: 'dd/MM/yyyy',  // Common in Middle East
            timeFormat: 'HH:mm',
            defaultView: 'table',
            notifications: {
              email: true,
              sms: false,
              push: true,
              desktop: true,
            },
            dashboard: {
              widgets: [],
              layout: 'grid',
            },
          } as any,
          lastPasswordChange: new Date(),
        },
      })

      createdUsers.push(userData.email)
      console.log(`✅ Created ${userData.name} (${userData.email})`)
    }

    console.log('\n📋 Summary:')
    console.log(`   Created: ${createdUsers.length} users`)
    console.log(`   Skipped: ${skippedUsers.length} users`)

    console.log('\n🔑 Login Credentials:\n')
    TEST_USERS.forEach(user => {
      if (createdUsers.includes(user.email) || skippedUsers.includes(user.email)) {
        console.log(`   👤 ${user.fullName || user.name}`)
        if (user.kunya) {
          console.log(`   🌟 Kunya: ${user.kunya}`)
        }
        console.log(`   📧 Email: ${user.email}`)
        console.log(`   🔐 Password: ${user.password}`)
        console.log(`   🎭 Role: ${user.role}`)
        console.log(`   📋 Description: ${user.description}`)
        console.log('')
      }
    })

    console.log('🎉 Test users setup complete!')
    console.log('\n💡 Super Admin Login:')
    console.log('   Email: superadmin@hazalyze.com')
    console.log('   Password: SuperAdmin@2024!')
    console.log('\n⚠️  IMPORTANT: Change passwords after first login!')
  } catch (error) {
    console.error('❌ Error setting up test users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  setupTestUsers()
    .then(() => {
      console.log('\n✅ Setup complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error)
      process.exit(1)
    })
}

export { setupTestUsers }

