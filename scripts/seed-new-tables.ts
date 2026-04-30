/**
 * Seed Data for New Tables (using raw SQL)
 * Seeds initial data for rate cards, services, webhooks, and workflow templates
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding new tables...\n')

  // Seed Rate Cards
  console.log('📊 Seeding rate cards...')
  await prisma.$executeRawUnsafe(`
    INSERT INTO "rate_cards" ("id", "name", "code", "category", "effectiveDate", "expiryDate", "currency", "status", "rates", "volumeDiscounts", "tenantId")
    VALUES 
      ('rc-001', 'Standard Warehousing 2025', 'WH-STD-2025', 'WAREHOUSING', '2025-01-01', '2025-12-31', 'SAR', 'ACTIVE', 
       '[{"id": "r1", "service": "Pallet Storage", "unit": "Pallet/Month", "baseRate": 50}]'::jsonb,
       '[{"minVolume": 500, "discountPercent": 5}]'::jsonb, 'default'),
      ('rc-002', 'Transportation FTL/LTL 2025', 'TR-STD-2025', 'TRANSPORTATION', '2025-01-01', '2025-12-31', 'SAR', 'ACTIVE',
       '[{"id": "r1", "service": "Full Truck Load", "unit": "Trip", "baseRate": 2500}]'::jsonb,
       '[{"minVolume": 10, "discountPercent": 10}]'::jsonb, 'default')
    ON CONFLICT ("code", "tenantId") DO NOTHING
  `)
  console.log('   ✅ Rate cards seeded')

  // Seed Services
  console.log('📦 Seeding services...')
  await prisma.$executeRawUnsafe(`
    INSERT INTO "services" ("id", "code", "name", "category", "description", "basePrice", "unit", "features", "active", "tenantId")
    VALUES 
      ('svc-001', 'WH-STORAGE-STD', 'Standard Storage', 'WAREHOUSING', 'Ambient temperature warehouse storage', 50, 'Pallet/Month', '["24/7 Access", "Inventory Tracking"]'::jsonb, true, 'default'),
      ('svc-002', 'WH-STORAGE-COLD', 'Cold Storage', 'WAREHOUSING', 'Temperature-controlled cold chain storage', 150, 'Pallet/Month', '["Temperature Monitoring", "FEFO Management"]'::jsonb, true, 'default'),
      ('svc-003', 'TR-FTL', 'Full Truck Load', 'TRANSPORTATION', 'Dedicated full truck shipment', 2500, 'Trip', '["GPS Tracking", "POD Capture"]'::jsonb, true, 'default')
    ON CONFLICT ("code", "tenantId") DO NOTHING
  `)
  console.log('   ✅ Services seeded')

  // Seed Workflow Templates
  console.log('🔄 Seeding workflow templates...')
  await prisma.$executeRawUnsafe(`
    INSERT INTO "workflow_templates" ("id", "name", "description", "category", "version", "stages", "transitions", "configuration", "tags", "isPublic", "createdBy", "usageCount", "tenantId")
    VALUES 
      ('wft-001', 'Standard Inbound Process', 'Standard receiving workflow for inbound shipments', 'INBOUND', '1.0', 
       '[{"id": "s1", "name": "ASN Receipt", "type": "start"}, {"id": "s2", "name": "Receiving", "type": "process"}, {"id": "s3", "name": "QC Check", "type": "decision"}, {"id": "s4", "name": "Putaway", "type": "process"}, {"id": "s5", "name": "Complete", "type": "end"}]'::jsonb,
       '[{"from": "s1", "to": "s2"}, {"from": "s2", "to": "s3"}, {"from": "s3", "to": "s4", "condition": "passed"}, {"from": "s4", "to": "s5"}]'::jsonb,
       '{}'::jsonb, '["inbound", "standard", "wms"]'::jsonb, true, 'system', 0, 'default')
    ON CONFLICT DO NOTHING
  `)
  console.log('   ✅ Workflow templates seeded')

  console.log('\n✅ Seeding complete!')

  // Verify data
  console.log('\n📊 Verification:')
  const rateCards = await prisma.$queryRaw`SELECT COUNT(*) as count FROM rate_cards`
  const services = await prisma.$queryRaw`SELECT COUNT(*) as count FROM services`
  const templates = await prisma.$queryRaw`SELECT COUNT(*) as count FROM workflow_templates`

  console.log(`   Rate Cards: ${(rateCards as any)[0].count}`)
  console.log(`   Services: ${(services as any)[0].count}`)
  console.log(`   Workflow Templates: ${(templates as any)[0].count}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
