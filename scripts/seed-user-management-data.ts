/**
 * 🚀 USER MANAGEMENT SYSTEM - SEED DATA
 * 
 * Seeds initial data for the user management system:
 * - System permission templates
 * - Default roles
 * - Sample tenant (if needed)
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

const prisma = new PrismaClient()

// ============================================================================
// PERMISSION TEMPLATES
// ============================================================================

const SYSTEM_PERMISSION_TEMPLATES = [
  {
    name: 'Full Access',
    description: 'Full access to all modules and features',
    isSystemTemplate: true,
    permissions: {
      modules: ['*'],
      features: ['*'],
      tabs: ['*'],
      actions: ['*'],
      fields: ['*'],
    },
  },
  {
    name: 'Read Only',
    description: 'Read-only access to all modules',
    isSystemTemplate: true,
    permissions: {
      modules: ['*'],
      features: ['*'],
      tabs: ['*'],
      actions: ['read', 'read_only'],
      fields: ['*'],
    },
  },
  {
    name: 'WMS Manager',
    description: 'Full access to WMS module',
    isSystemTemplate: true,
    permissions: {
      modules: ['wms'],
      features: ['*'],
      tabs: ['*'],
      actions: ['*'],
      fields: ['*'],
    },
  },
  {
    name: 'TMS Manager',
    description: 'Full access to TMS module',
    isSystemTemplate: true,
    permissions: {
      modules: ['tms'],
      features: ['*'],
      tabs: ['*'],
      actions: ['*'],
      fields: ['*'],
    },
  },
  {
    name: 'Customer User',
    description: 'Limited access for customer users',
    isSystemTemplate: true,
    permissions: {
      modules: ['wms', 'tms'],
      features: ['wms.inventory', 'tms.shipments'],
      tabs: ['*'],
      actions: ['read', 'read_write'],
      fields: ['*'],
    },
  },
]

// ============================================================================
// DEFAULT ROLES
// ============================================================================

const DEFAULT_ROLES = [
  {
    name: 'SYSTEM_ADMIN',
    displayName: 'System Administrator',
    description: 'Full system access with all permissions',
    isSystemRole: true,
    isActive: true,
    defaultScope: 'ALL',
    permissions: {
      modules: ['*'],
      features: ['*'],
      tabs: ['*'],
      actions: ['*'],
      fields: ['*'],
    },
  },
  {
    name: 'WAREHOUSE_MANAGER',
    displayName: 'Warehouse Manager',
    description: 'Full access to warehouse operations',
    isSystemRole: true,
    isActive: true,
    defaultScope: 'ASSIGNED_WAREHOUSES',
    permissions: {
      modules: ['wms'],
      features: ['*'],
      tabs: ['*'],
      actions: ['*'],
      fields: ['*'],
    },
  },
  {
    name: 'CUSTOMER_USER',
    displayName: 'Customer User',
    description: 'Limited access for customer users',
    isSystemRole: true,
    isActive: true,
    defaultScope: 'ASSIGNED_CUSTOMERS',
    permissions: {
      modules: ['wms', 'tms'],
      features: ['wms.inventory', 'tms.shipments'],
      tabs: ['*'],
      actions: ['read', 'read_write'],
      fields: ['*'],
    },
  },
]

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedPermissionTemplates() {
  console.log('📋 Seeding permission templates...')

  for (const template of SYSTEM_PERMISSION_TEMPLATES) {
    const existing = await prisma.$queryRawUnsafe(
      `SELECT * FROM "permission_templates" WHERE "name" = $1 AND "isSystemTemplate" = true LIMIT 1`,
      template.name
    ) as any[]

    if (!existing || existing.length === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "permission_templates" ("id", "name", "description", "permissions", "isSystemTemplate", "usageCount", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3::jsonb, true, 0, NOW(), NOW())`,
        template.name,
        template.description || null,
        JSON.stringify(template.permissions)
      )
      console.log(`  ✅ Created template: ${template.name}`)
    } else {
      console.log(`  ⏭️  Template already exists: ${template.name}`)
    }
  }
}

async function seedDefaultRoles(tenantId: string) {
  console.log('👥 Seeding default roles...')

  for (const role of DEFAULT_ROLES) {
    const existing = await prisma.$queryRawUnsafe(
      `SELECT * FROM "roles" WHERE "tenantId" = $1 AND "name" = $2 AND "isSystemRole" = true LIMIT 1`,
      tenantId,
      role.name
    ) as any[]

    if (!existing || existing.length === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "roles" ("id", "tenantId", "name", "displayName", "description", "isSystemRole", "isActive", "version", "defaultScope", "permissions", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, true, 1, $5, $6::jsonb, NOW(), NOW())`,
        tenantId,
        role.name,
        role.displayName,
        role.description || null,
        role.defaultScope,
        JSON.stringify(role.permissions)
      )
      console.log(`  ✅ Created role: ${role.name}`)
    } else {
      console.log(`  ⏭️  Role already exists: ${role.name}`)
    }
  }
}

async function getOrCreateDefaultTenant() {
  console.log('🏢 Checking for default tenant...')

  // Try to find an existing tenant
  const existingTenants = await prisma.$queryRawUnsafe(
    `SELECT * FROM "tenants" ORDER BY "createdAt" ASC LIMIT 1`
  ) as any[]

  if (existingTenants && existingTenants.length > 0) {
    console.log(`  ✅ Using existing tenant: ${existingTenants[0].id}`)
    return existingTenants[0].id
  }

  // Create a default tenant if none exists
  console.log('  📝 Creating default tenant...')
  await prisma.$executeRawUnsafe(
    `INSERT INTO "tenants" ("id", "name", "slug", "type", "status", "subscriptionTier", "subscriptionStartDate", "features", "settings", "metadata", "createdAt", "updatedAt") VALUES ('default-tenant', 'Default Tenant', 'default-tenant', '3PL', 'ACTIVE', 'ENTERPRISE', NOW(), '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, NOW(), NOW())`
  )
  const tenant = { id: 'default-tenant' }

  console.log(`  ✅ Created default tenant: ${tenant.id}`)
  return tenant.id
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log('\n🚀 USER MANAGEMENT SYSTEM - SEED DATA\n')
  console.log('='.repeat(60) + '\n')

  try {
    // Step 1: Get or create default tenant
    const tenantId = await getOrCreateDefaultTenant()
    console.log()

    // Step 2: Seed permission templates
    await seedPermissionTemplates()
    console.log()

    // Step 3: Seed default roles
    await seedDefaultRoles(tenantId)
    console.log()

    // Success!
    console.log('='.repeat(60))
    console.log('✅ SEED DATA COMPLETE!')
    console.log('='.repeat(60))
    console.log('\nNext steps:')
    console.log('  1. Start your application: npm run dev')
    console.log('  2. Visit: http://localhost:3002/settings/users')
    console.log('  3. Create your first user!\n')

  } catch (error: any) {
    console.error('❌ Seed failed:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run seed
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
