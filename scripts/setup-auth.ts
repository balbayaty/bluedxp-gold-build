/**
 * Authentication Setup Script
 * 
 * Creates initial admin user and sets up authentication system
 * Run: npm run setup:auth
 */

import { prisma } from '../lib/services/database/prismaClient'
import { hashPassword } from '../lib/services/auth/passwordService'
import { UserRole } from '../types/user'

async function setupAuth() {
  try {
    console.log('🔐 Setting up authentication system...\n')

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@hazalyze.com' },
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists')
      console.log('   Email: admin@hazalyze.com')
      console.log('   ID:', existingAdmin.id)
      return
    }

    // Create or get default tenant
    let tenant = await prisma.tenant.findUnique({
      where: { id: 'default-tenant' },
    })

    if (!tenant) {
      console.log('📦 Creating default tenant...')
      tenant = await prisma.tenant.create({
        data: {
          id: 'default-tenant',
          slug: 'bluedxp-platform',
          name: 'BlueDXP Platform',
          type: '3PL',
          status: 'ACTIVE',
          settings: {
            timezone: 'UTC',
            currency: 'SAR',
            dateFormat: 'MM/dd/yyyy',
            timeFormat: 'HH:mm',
            language: 'en',
            allowCustomerPortal: true,
            allowApiAccess: true,
            dataRetentionDays: 365,
            backupFrequency: 'DAILY',
            subscriptionTier: 'ENTERPRISE',
            subscriptionStartDate: new Date(),
            maxCustomers: 1000,
            maxWarehouses: 50,
            maxUsers: 500,
          } as any,
          billingInfo: {
            monthlyFee: 10000,
            currency: 'SAR',
          } as any,
        },
      })
      console.log('✅ Default tenant created')
    }

    // Create admin user
    const passwordHash = await hashPassword('Admin@1234') // Change this in production!
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@hazalyze.com',
        passwordHash,
        name: 'System Administrator',
        role: 'SYSTEM_ADMIN',
        tenantId: tenant.id,
        status: 'ACTIVE',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        permissions: [
          {
            resource: 'dashboard',
            actions: ['read', 'write', 'delete', 'manage'],
            scope: 'ALL',
          },
          {
            resource: 'settings',
            actions: ['read', 'write', 'delete', 'manage'],
            scope: 'ALL',
          },
          {
            resource: 'users',
            actions: ['read', 'write', 'delete', 'manage'],
            scope: 'ALL',
          },
        ] as any,
        preferences: {
          theme: 'dark',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/dd/yyyy',
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

    console.log('✅ Admin user created successfully!')
    console.log('\n📋 Login Credentials:')
    console.log('   Email: admin@hazalyze.com')
    console.log('   Password: Admin@1234')
    console.log('\n⚠️  IMPORTANT: Change the password immediately after first login!')
    console.log('   User ID:', adminUser.id)
    console.log('   Tenant ID:', adminUser.tenantId)
    console.log('\n🎉 Authentication system ready!')
  } catch (error) {
    console.error('❌ Error setting up authentication:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  setupAuth()
    .then(() => {
      console.log('\n✅ Setup complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error)
      process.exit(1)
    })
}

export { setupAuth }

