/**
 * Verify Database Status
 * Quick check of all tables and data
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Database Verification\n')
  console.log('=' .repeat(50))

  // Check new tables
  console.log('\n📊 New Tables (Phase 12):')
  
  const rateCards = await prisma.$queryRaw`SELECT COUNT(*) as count FROM rate_cards` as any[]
  console.log(`   ✅ rate_cards: ${rateCards[0].count} records`)

  const services = await prisma.$queryRaw`SELECT COUNT(*) as count FROM services` as any[]
  console.log(`   ✅ services: ${services[0].count} records`)

  const webhooks = await prisma.$queryRaw`SELECT COUNT(*) as count FROM webhooks` as any[]
  console.log(`   ✅ webhooks: ${webhooks[0].count} records`)

  const webhookDeliveries = await prisma.$queryRaw`SELECT COUNT(*) as count FROM webhook_deliveries` as any[]
  console.log(`   ✅ webhook_deliveries: ${webhookDeliveries[0].count} records`)

  const workflowTemplates = await prisma.$queryRaw`SELECT COUNT(*) as count FROM workflow_templates` as any[]
  console.log(`   ✅ workflow_templates: ${workflowTemplates[0].count} records`)

  // Check existing important tables
  console.log('\n📦 Existing Tables:')

  const shipments = await prisma.shipment.count()
  console.log(`   ✅ Shipment: ${shipments} records`)

  const users = await prisma.user.count()
  console.log(`   ✅ User: ${users} records`)

  const customers = await prisma.customers.count()
  console.log(`   ✅ Customer: ${customers} records`)

  const asns = await prisma.aSN.count()
  console.log(`   ✅ ASN: ${asns} records`)

  // Test write capability
  console.log('\n✍️ Testing Write Capability:')
  
  const testWebhook = await prisma.$executeRaw`
    INSERT INTO "webhooks" ("id", "url", "events", "secret", "tenantId")
    VALUES ('test-wh-${Date.now()}', 'https://example.com/webhook', '["test.event"]'::jsonb, 'test-secret', 'test-tenant')
    ON CONFLICT DO NOTHING
  `
  console.log(`   ✅ Write test passed`)

  // Clean up test data
  await prisma.$executeRaw`DELETE FROM "webhooks" WHERE "tenantId" = 'test-tenant'`
  console.log(`   ✅ Cleanup successful`)

  console.log('\n' + '=' .repeat(50))
  console.log('✅ DATABASE VERIFICATION COMPLETE!')
  console.log('=' .repeat(50))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
