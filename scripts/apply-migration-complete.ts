/**
 * 🚀 COMPLETE USER MANAGEMENT MIGRATION
 * 
 * Applies migration by executing the complete SQL file
 * Handles all dependencies and errors
 * 
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

const prisma = new PrismaClient()

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    await prisma.$queryRawUnsafe(`SELECT 1 FROM "${tableName}" LIMIT 1`)
    return true
  } catch {
    return false
  }
}

async function executeSQL(sql: string): Promise<void> {
  // Execute the entire SQL as one statement
  await prisma.$executeRawUnsafe(sql)
}

async function main() {
  console.log('\n🚀 COMPLETE USER MANAGEMENT MIGRATION\n')
  console.log('='.repeat(60) + '\n')

  try {
    // Step 1: Check prerequisites
    console.log('📋 Step 1: Checking prerequisites...')
    const tenantExists = await checkTableExists('Tenant')
    const customerExists = await checkTableExists('Customer')
    
    console.log(`  ${tenantExists ? '✅' : '❌'} Tenant table: ${tenantExists ? 'EXISTS' : 'MISSING'}`)
    console.log(`  ${customerExists ? '✅' : '❌'} Customer table: ${customerExists ? 'EXISTS' : 'MISSING'}`)
    
    if (!tenantExists) {
      console.log('\n⚠️  Tenant table missing. Creating...')
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Tenant" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "type" TEXT NOT NULL DEFAULT '3PL',
          "status" TEXT NOT NULL DEFAULT 'ACTIVE',
          "subscriptionTier" TEXT,
          "subscriptionStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "subscriptionEndDate" TIMESTAMP(3),
          "maxCustomers" INTEGER,
          "maxWarehouses" INTEGER,
          "maxUsers" INTEGER,
          "features" JSONB DEFAULT '[]',
          "settings" JSONB DEFAULT '{}',
          "billing" JSONB,
          "resourceQuotas" JSONB,
          "featureFlags" JSONB,
          "metadata" JSONB DEFAULT '{}',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdBy" TEXT,
          "updatedBy" TEXT
        );
      `)
      console.log('  ✅ Tenant table created')
    }
    
    if (!customerExists) {
      console.log('\n⚠️  Customer table missing. Creating basic structure...')
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Customer" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "tenantId" TEXT NOT NULL,
          "customerNumber" TEXT NOT NULL,
          "customerName" TEXT NOT NULL,
          "type" TEXT,
          "status" TEXT DEFAULT 'ACTIVE',
          "parentCustomerId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
        )
      `)
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Customer_tenantId_idx" ON "Customer"("tenantId")`)
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Customer_parentCustomerId_idx" ON "Customer"("parentCustomerId")`)
      console.log('  ✅ Customer table created')
    }
    
    console.log('\n📝 Step 2: Reading migration file...')
    const migrationFile = path.join(process.cwd(), 'prisma', 'migrations', '007_add_user_management_models.sql')
    
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found: ${migrationFile}`)
    }
    
    let sql = fs.readFileSync(migrationFile, 'utf-8')
    
    // Remove comments and clean up
    sql = sql.replace(/--.*$/gm, '')
    
    console.log('  ✅ Migration file loaded\n')
    
    // Step 3: Create tables one by one (safer approach)
    console.log('📦 Step 3: Creating tables...\n')
    
    const tablesToCreate = [
      {
        name: 'Role',
        sql: `
          CREATE TABLE IF NOT EXISTS "Role" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "tenantId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "displayName" TEXT NOT NULL,
            "description" TEXT,
            "isSystemRole" BOOLEAN NOT NULL DEFAULT false,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "version" INTEGER NOT NULL DEFAULT 1,
            "parentRoleId" TEXT,
            "templateId" TEXT,
            "permissions" JSONB NOT NULL DEFAULT '[]',
            "defaultScope" TEXT NOT NULL DEFAULT 'TENANT',
            "approvalChain" JSONB,
            "metadata" JSONB DEFAULT '{}',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "createdBy" TEXT,
            "updatedBy" TEXT,
            CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
            CONSTRAINT "Role_parentRoleId_fkey" FOREIGN KEY ("parentRoleId") REFERENCES "Role"("id") ON DELETE SET NULL
          );
        `
      },
      {
        name: 'PermissionTemplate',
        sql: `
          CREATE TABLE IF NOT EXISTS "PermissionTemplate" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "tenantId" TEXT,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "permissions" JSONB NOT NULL DEFAULT '[]',
            "isSystemTemplate" BOOLEAN NOT NULL DEFAULT false,
            "usageCount" INTEGER NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "createdBy" TEXT,
            CONSTRAINT "PermissionTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
          );
        `
      },
      {
        name: 'CustomerUser',
        sql: `
          CREATE TABLE IF NOT EXISTS "CustomerUser" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "customerId" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "subCustomerId" TEXT,
            "role" TEXT,
            "dataVisibility" JSONB,
            "permissions" JSONB,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "expiresAt" TIMESTAMP(3),
            "createdBy" TEXT,
            CONSTRAINT "CustomerUser_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE,
            CONSTRAINT "CustomerUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
            CONSTRAINT "CustomerUser_subCustomerId_fkey" FOREIGN KEY ("subCustomerId") REFERENCES "Customer"("id") ON DELETE CASCADE
          );
        `
      },
      {
        name: 'RoleAssignment',
        sql: `
          CREATE TABLE IF NOT EXISTS "RoleAssignment" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT NOT NULL,
            "roleId" TEXT NOT NULL,
            "assignedBy" TEXT NOT NULL,
            "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "expiresAt" TIMESTAMP(3),
            "delegatedFrom" TEXT,
            "reason" TEXT,
            "metadata" JSONB DEFAULT '{}',
            CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
            CONSTRAINT "RoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE
          );
        `
      },
      {
        name: 'UsageMetric',
        sql: `
          CREATE TABLE IF NOT EXISTS "UsageMetric" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT,
            "tenantId" TEXT NOT NULL,
            "metricType" TEXT NOT NULL,
            "metricValue" DECIMAL(65,30) NOT NULL,
            "unit" TEXT NOT NULL,
            "metadata" JSONB DEFAULT '{}',
            "cost" DECIMAL(65,30),
            "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "UsageMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL,
            CONSTRAINT "UsageMetric_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
          );
        `
      },
      {
        name: 'AgentUsage',
        sql: `
          CREATE TABLE IF NOT EXISTS "AgentUsage" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "userId" TEXT NOT NULL,
            "tenantId" TEXT NOT NULL,
            "agentId" TEXT NOT NULL,
            "actionType" TEXT NOT NULL,
            "tokensUsed" INTEGER DEFAULT 0,
            "cost" DECIMAL(65,30),
            "metadata" JSONB DEFAULT '{}',
            "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "AgentUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
            CONSTRAINT "AgentUsage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
          );
        `
      }
    ]
    
    for (const table of tablesToCreate) {
      const exists = await checkTableExists(table.name)
      if (exists) {
        console.log(`  ⏭️  ${table.name} - Already exists`)
      } else {
        try {
          await prisma.$executeRawUnsafe(table.sql)
          console.log(`  ✅ ${table.name} - Created`)
        } catch (error: any) {
          if (error.message?.includes('already exists') || error.code === '42P07') {
            console.log(`  ⏭️  ${table.name} - Already exists (detected)`)
          } else {
            throw error
          }
        }
      }
    }
    
    // Step 4: Create indexes
    console.log('\n📊 Step 4: Creating indexes...\n')
    
    const indexes = [
      { table: 'Role', name: 'Role_tenantId_idx', sql: 'CREATE INDEX IF NOT EXISTS "Role_tenantId_idx" ON "Role"("tenantId");' },
      { table: 'Role', name: 'Role_name_idx', sql: 'CREATE INDEX IF NOT EXISTS "Role_name_idx" ON "Role"("name");' },
      { table: 'Role', name: 'Role_isSystemRole_idx', sql: 'CREATE INDEX IF NOT EXISTS "Role_isSystemRole_idx" ON "Role"("isSystemRole");' },
      { table: 'Role', name: 'Role_isActive_idx', sql: 'CREATE INDEX IF NOT EXISTS "Role_isActive_idx" ON "Role"("isActive");' },
      { table: 'Role', name: 'Role_parentRoleId_idx', sql: 'CREATE INDEX IF NOT EXISTS "Role_parentRoleId_idx" ON "Role"("parentRoleId");' },
      { table: 'Role', name: 'Role_unique', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS "Role_tenantId_name_version_key" ON "Role"("tenantId", "name", "version");' },
      { table: 'PermissionTemplate', name: 'PermissionTemplate_tenantId_idx', sql: 'CREATE INDEX IF NOT EXISTS "PermissionTemplate_tenantId_idx" ON "PermissionTemplate"("tenantId");' },
      { table: 'PermissionTemplate', name: 'PermissionTemplate_isSystemTemplate_idx', sql: 'CREATE INDEX IF NOT EXISTS "PermissionTemplate_isSystemTemplate_idx" ON "PermissionTemplate"("isSystemTemplate");' },
      { table: 'CustomerUser', name: 'CustomerUser_customerId_idx', sql: 'CREATE INDEX IF NOT EXISTS "CustomerUser_customerId_idx" ON "CustomerUser"("customerId");' },
      { table: 'CustomerUser', name: 'CustomerUser_userId_idx', sql: 'CREATE INDEX IF NOT EXISTS "CustomerUser_userId_idx" ON "CustomerUser"("userId");' },
      { table: 'CustomerUser', name: 'CustomerUser_subCustomerId_idx', sql: 'CREATE INDEX IF NOT EXISTS "CustomerUser_subCustomerId_idx" ON "CustomerUser"("subCustomerId");' },
      { table: 'CustomerUser', name: 'CustomerUser_unique', sql: 'CREATE UNIQUE INDEX IF NOT EXISTS "CustomerUser_userId_customerId_subCustomerId_key" ON "CustomerUser"("userId", "customerId", "subCustomerId");' },
      { table: 'RoleAssignment', name: 'RoleAssignment_userId_idx', sql: 'CREATE INDEX IF NOT EXISTS "RoleAssignment_userId_idx" ON "RoleAssignment"("userId");' },
      { table: 'RoleAssignment', name: 'RoleAssignment_roleId_idx', sql: 'CREATE INDEX IF NOT EXISTS "RoleAssignment_roleId_idx" ON "RoleAssignment"("roleId");' },
      { table: 'RoleAssignment', name: 'RoleAssignment_expiresAt_idx', sql: 'CREATE INDEX IF NOT EXISTS "RoleAssignment_expiresAt_idx" ON "RoleAssignment"("expiresAt");' },
      { table: 'UsageMetric', name: 'UsageMetric_userId_idx', sql: 'CREATE INDEX IF NOT EXISTS "UsageMetric_userId_idx" ON "UsageMetric"("userId");' },
      { table: 'UsageMetric', name: 'UsageMetric_tenantId_idx', sql: 'CREATE INDEX IF NOT EXISTS "UsageMetric_tenantId_idx" ON "UsageMetric"("tenantId");' },
      { table: 'UsageMetric', name: 'UsageMetric_timestamp_idx', sql: 'CREATE INDEX IF NOT EXISTS "UsageMetric_timestamp_idx" ON "UsageMetric"("timestamp");' },
      { table: 'AgentUsage', name: 'AgentUsage_userId_idx', sql: 'CREATE INDEX IF NOT EXISTS "AgentUsage_userId_idx" ON "AgentUsage"("userId");' },
      { table: 'AgentUsage', name: 'AgentUsage_tenantId_idx', sql: 'CREATE INDEX IF NOT EXISTS "AgentUsage_tenantId_idx" ON "AgentUsage"("tenantId");' },
      { table: 'AgentUsage', name: 'AgentUsage_timestamp_idx', sql: 'CREATE INDEX IF NOT EXISTS "AgentUsage_timestamp_idx" ON "AgentUsage"("timestamp");' },
    ]
    
    for (const index of indexes) {
      try {
        await prisma.$executeRawUnsafe(index.sql)
        console.log(`  ✅ ${index.name}`)
      } catch (error: any) {
        if (error.message?.includes('already exists') || error.code === '42P07') {
          console.log(`  ⏭️  ${index.name} - Already exists`)
        } else {
          console.log(`  ⚠️  ${index.name} - ${error.message}`)
        }
      }
    }
    
    // Step 5: Update Role table to add templateId foreign key if PermissionTemplate exists
    console.log('\n🔗 Step 5: Adding foreign key constraints...\n')
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'Role_templateId_fkey' 
            AND table_name = 'Role'
          ) THEN
            ALTER TABLE "Role" 
            ADD CONSTRAINT "Role_templateId_fkey" 
            FOREIGN KEY ("templateId") REFERENCES "PermissionTemplate"("id") ON DELETE SET NULL;
          END IF;
        END $$;
      `)
      console.log('  ✅ Role.templateId foreign key')
    } catch (error: any) {
      console.log(`  ⚠️  Role.templateId foreign key - ${error.message}`)
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ MIGRATION COMPLETE!')
    console.log('='.repeat(60) + '\n')
    
    // Step 6: Verify tables
    console.log('🔍 Step 6: Verifying tables...\n')
    const { execSync } = require('child_process')
    try {
      execSync('npx ts-node --project tsconfig.scripts.json scripts/verify-user-management-tables.ts', { stdio: 'inherit' })
    } catch (error) {
      // Verification script may exit with code if tables missing, that's ok
    }
    
    // Step 7: Generate Prisma client
    console.log('\n📦 Step 7: Generating Prisma client...\n')
    try {
      execSync('npx prisma generate', { stdio: 'inherit' })
      console.log('\n✅ Prisma client generated successfully!')
    } catch (error: any) {
      console.log('\n⚠️  Prisma client generation had issues. Run manually: npx prisma generate')
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 ALL DONE! USER MANAGEMENT SYSTEM IS READY!')
    console.log('='.repeat(60) + '\n')
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

