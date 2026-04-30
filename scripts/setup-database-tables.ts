/**
 * Setup Database Tables for User Management System
 * Creates missing tables if they don't exist
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n🔧 USER MANAGEMENT DATABASE SETUP\n')
  
  try {
    // Check existing tables
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    const tableNames = tables.map(t => t.table_name)
    console.log('📋 Existing tables:', tableNames.length)
    
    // Check for required tables
    const requiredTables = ['tenants', 'customers', 'roles', 'usage_metrics', 'role_assignments', 'permission_templates', 'approval_requests', 'security_events']
    const missingTables = requiredTables.filter(t => !tableNames.includes(t))
    
    if (missingTables.length === 0) {
      console.log('✅ All user management tables exist!\n')
    } else {
      console.log(`⚠️  Missing tables: ${missingTables.join(', ')}\n`)
      console.log('Creating missing tables...\n')
      
      // Create tenants if missing
      if (missingTables.includes('tenants')) {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS tenants (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            type TEXT DEFAULT '3PL',
            status TEXT DEFAULT 'ACTIVE',
            settings JSONB,
            quotas JSONB,
            feature_flags JSONB,
            billing_info JSONB,
            compliance_requirements JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            deleted_at TIMESTAMP
          )
        `
        console.log('  ✅ Created: tenants')
      }
      
      // Create customers if missing
      if (missingTables.includes('customers')) {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id TEXT NOT NULL,
            parent_id TEXT,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            type TEXT DEFAULT 'DIRECT',
            status TEXT DEFAULT 'ACTIVE',
            settings JSONB,
            contact_info JSONB,
            billing_info JSONB,
            assigned_users JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            deleted_at TIMESTAMP,
            UNIQUE(tenant_id, code)
          )
        `
        console.log('  ✅ Created: customers')
      }
      
      // Create roles if missing
      if (missingTables.includes('roles')) {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS roles (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id TEXT NOT NULL,
            name TEXT NOT NULL,
            display_name TEXT NOT NULL,
            description TEXT,
            type TEXT DEFAULT 'CUSTOM',
            level INTEGER DEFAULT 0,
            permissions JSONB NOT NULL,
            parent_role_id TEXT,
            is_default BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            deleted_at TIMESTAMP,
            UNIQUE(tenant_id, name)
          )
        `
        console.log('  ✅ Created: roles')
      }
      
      // Create usage_metrics if missing
      if (missingTables.includes('usage_metrics')) {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS usage_metrics (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            user_id TEXT NOT NULL,
            tenant_id TEXT NOT NULL,
            metric_type TEXT NOT NULL,
            resource TEXT NOT NULL,
            quantity FLOAT DEFAULT 1,
            unit TEXT NOT NULL,
            unit_cost FLOAT DEFAULT 0,
            total_cost FLOAT DEFAULT 0,
            metadata JSONB,
            timestamp TIMESTAMP DEFAULT NOW(),
            billing_month TEXT NOT NULL
          )
        `
        console.log('  ✅ Created: usage_metrics')
      }
      
      // Create role_assignments if missing
      if (missingTables.includes('role_assignments')) {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS role_assignments (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            user_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            tenant_id TEXT NOT NULL,
            scope JSONB,
            conditions JSONB,
            expires_at TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            granted_by TEXT,
            granted_at TIMESTAMP DEFAULT NOW(),
            revoked_at TIMESTAMP,
            revoked_by TEXT,
            UNIQUE(user_id, role_id)
          )
        `
        console.log('  ✅ Created: role_assignments')
      }
      
      // Create permission_templates if missing
      if (missingTables.includes('permission_templates')) {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS permission_templates (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'ROLE_BASED',
            permissions JSONB NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            is_global BOOLEAN DEFAULT TRUE,
            tenant_id TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
        console.log('  ✅ Created: permission_templates')
      }
      
      // Create approval_requests if missing
      if (missingTables.includes('approval_requests')) {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS approval_requests (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id TEXT NOT NULL,
            type TEXT NOT NULL,
            requester_id TEXT NOT NULL,
            target_user_id TEXT,
            current_state JSONB,
            requested_state JSONB NOT NULL,
            status TEXT DEFAULT 'PENDING',
            priority TEXT DEFAULT 'NORMAL',
            approvers JSONB NOT NULL,
            approval_chain JSONB,
            comments JSONB,
            approved_by TEXT,
            approved_at TIMESTAMP,
            rejected_by TEXT,
            rejected_at TIMESTAMP,
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
        console.log('  ✅ Created: approval_requests')
      }
      
      // Create security_events if missing
      if (missingTables.includes('security_events')) {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS security_events (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            user_id TEXT,
            tenant_id TEXT,
            event_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            description TEXT NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            location JSONB,
            metadata JSONB,
            resolved BOOLEAN DEFAULT FALSE,
            resolved_by TEXT,
            resolved_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
        console.log('  ✅ Created: security_events')
      }
      
      console.log('\n✅ All tables created!')
    }
    
    // Seed initial data if tenants is empty
    const tenantCount = await prisma.$queryRaw<{count: string}[]>`SELECT COUNT(*) as count FROM tenants`
    
    if (parseInt(tenantCount[0]?.count || '0') === 0) {
      console.log('\n📦 Seeding initial data...\n')
      
      // Create default tenant
      await prisma.$executeRaw`
        INSERT INTO tenants (id, name, slug, type, status) 
        VALUES ('tenant-default', 'Default Organization', 'default-org', '3PL', 'ACTIVE')
        ON CONFLICT DO NOTHING
      `
      console.log('  ✅ Created default tenant')
      
      // Create default roles
      const roles = [
        { id: 'role-admin', name: 'SYSTEM_ADMIN', displayName: 'System Administrator' },
        { id: 'role-manager', name: 'WAREHOUSE_MANAGER', displayName: 'Warehouse Manager' },
        { id: 'role-operator', name: 'WAREHOUSE_OPERATOR', displayName: 'Warehouse Operator' },
        { id: 'role-viewer', name: 'VIEWER', displayName: 'Viewer' },
      ]
      
      for (const role of roles) {
        await prisma.$executeRaw`
          INSERT INTO roles (id, tenant_id, name, display_name, permissions, type, is_default)
          VALUES (${role.id}, 'tenant-default', ${role.name}, ${role.displayName}, '[]'::jsonb, 'SYSTEM', true)
          ON CONFLICT DO NOTHING
        `
      }
      console.log('  ✅ Created default roles')
      
      console.log('\n✅ Seed data created!')
    } else {
      console.log('\n✅ Database already has data')
    }
    
    // Final check
    console.log('\n📊 FINAL DATABASE STATUS:\n')
    
    const finalTables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tenants', 'customers', 'roles', 'users', 'api_keys', 'usage_metrics')
      ORDER BY table_name
    `
    
    for (const t of finalTables) {
      const count = await prisma.$queryRawUnsafe<{count: string}[]>(`SELECT COUNT(*) as count FROM ${t.table_name}`)
      console.log(`   ${t.table_name}: ${count[0]?.count || 0} records`)
    }
    
    console.log('\n✅ DATABASE SETUP COMPLETE!\n')
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    if (error.message.includes('does not exist')) {
      console.log('\n💡 Tip: The database may need manual setup. Check connection settings.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()










