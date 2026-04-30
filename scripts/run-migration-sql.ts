/**
 * Run Migration SQL directly
 * This script runs the migration SQL for tables not in Prisma schema
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Creating missing tables...\n')

  // Create tables that don't exist in Prisma schema
  const statements = [
    // Webhooks table
    `CREATE TABLE IF NOT EXISTS "webhooks" (
      "id" VARCHAR(255) NOT NULL PRIMARY KEY,
      "url" VARCHAR(2048) NOT NULL,
      "events" JSONB NOT NULL,
      "secret" VARCHAR(500) NOT NULL,
      "active" BOOLEAN DEFAULT true,
      "metadata" JSONB DEFAULT '{}',
      "stats" JSONB DEFAULT '{"totalDeliveries": 0, "successfulDeliveries": 0, "failedDeliveries": 0}',
      "tenantId" VARCHAR(255) NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // Workflow templates table
    `CREATE TABLE IF NOT EXISTS "workflow_templates" (
      "id" VARCHAR(255) NOT NULL PRIMARY KEY,
      "name" VARCHAR(500) NOT NULL,
      "description" TEXT,
      "category" VARCHAR(100) NOT NULL,
      "version" VARCHAR(50) NOT NULL,
      "stages" JSONB NOT NULL,
      "transitions" JSONB NOT NULL,
      "configuration" JSONB DEFAULT '{}',
      "tags" JSONB DEFAULT '[]',
      "isPublic" BOOLEAN DEFAULT false,
      "createdBy" VARCHAR(255) NOT NULL,
      "usageCount" INTEGER DEFAULT 0,
      "rating" NUMERIC(3,2),
      "metadata" JSONB DEFAULT '{}',
      "tenantId" VARCHAR(255) NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )`,

    // Rate cards table
    `CREATE TABLE IF NOT EXISTS "rate_cards" (
      "id" VARCHAR(255) NOT NULL PRIMARY KEY,
      "name" VARCHAR(500) NOT NULL,
      "code" VARCHAR(100) NOT NULL,
      "category" VARCHAR(100) NOT NULL,
      "effectiveDate" DATE NOT NULL,
      "expiryDate" DATE NOT NULL,
      "currency" VARCHAR(10) DEFAULT 'SAR',
      "status" VARCHAR(50) DEFAULT 'ACTIVE',
      "rates" JSONB NOT NULL,
      "volumeDiscounts" JSONB,
      "validFor" JSONB,
      "tenantId" VARCHAR(255) NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      UNIQUE("code", "tenantId")
    )`,

    // Services table
    `CREATE TABLE IF NOT EXISTS "services" (
      "id" VARCHAR(255) NOT NULL PRIMARY KEY,
      "code" VARCHAR(100) NOT NULL,
      "name" VARCHAR(500) NOT NULL,
      "category" VARCHAR(100) NOT NULL,
      "description" TEXT,
      "basePrice" NUMERIC(15,2) NOT NULL,
      "unit" VARCHAR(100) NOT NULL,
      "features" JSONB DEFAULT '[]',
      "active" BOOLEAN DEFAULT true,
      "tenantId" VARCHAR(255) DEFAULT 'default',
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      UNIQUE("code", "tenantId")
    )`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS "idx_webhooks_tenant" ON "webhooks"("tenantId")`,
    `CREATE INDEX IF NOT EXISTS "idx_webhooks_active" ON "webhooks"("active", "tenantId")`,
    `CREATE INDEX IF NOT EXISTS "idx_templates_tenant" ON "workflow_templates"("tenantId")`,
    `CREATE INDEX IF NOT EXISTS "idx_templates_category" ON "workflow_templates"("category", "tenantId")`,
    `CREATE INDEX IF NOT EXISTS "idx_templates_public" ON "workflow_templates"("isPublic", "tenantId")`,
    `CREATE INDEX IF NOT EXISTS "idx_rate_cards_tenant" ON "rate_cards"("tenantId")`,
    `CREATE INDEX IF NOT EXISTS "idx_rate_cards_category" ON "rate_cards"("category", "tenantId")`,
    `CREATE INDEX IF NOT EXISTS "idx_rate_cards_status" ON "rate_cards"("status", "tenantId")`,
    `CREATE INDEX IF NOT EXISTS "idx_services_category" ON "services"("category", "tenantId")`,
    `CREATE INDEX IF NOT EXISTS "idx_services_active" ON "services"("active", "tenantId")`,
  ]

  console.log(`Running ${statements.length} SQL statements\n`)

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ').replace(/\s+/g, ' ')
    console.log(`[${i + 1}/${statements.length}] ${preview}...`)

    try {
      await prisma.$executeRawUnsafe(stmt)
      console.log('   ✅ Success')
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('   ⏭️ Already exists, skipping')
      } else {
        console.log(`   ❌ Error: ${error.message?.substring(0, 100)}`)
      }
    }
  }

  console.log('\n✅ Tables created!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
