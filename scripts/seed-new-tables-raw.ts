/**
 * Seed Data for New Tables (Raw SQL)
 * Seeds initial data for rate cards, services, and workflow templates
 * Uses raw SQL since tables aren't in Prisma schema
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding new tables with raw SQL...\n')

  // Seed Rate Cards
  console.log('📊 Seeding rate cards...')
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO rate_cards (id, name, code, category, "effectiveDate", "expiryDate", currency, status, rates, "volumeDiscounts", "tenantId", "createdAt", "updatedAt")
    VALUES (
      'rc-001',
      'Standard Warehousing 2025',
      'WH-STD-2025',
      'WAREHOUSING',
      '2025-01-01',
      '2025-12-31',
      'SAR',
      'ACTIVE',
      '[
        {"id": "r1", "service": "Pallet Storage", "description": "Standard pallet storage (ambient)", "unit": "Pallet/Month", "baseRate": 50, "minCharge": 500},
        {"id": "r2", "service": "Pick & Pack", "description": "Order picking and packing", "unit": "Order", "baseRate": 5, "minCharge": 50}
      ]'::jsonb,
      '[
        {"minVolume": 500, "maxVolume": 999, "discountPercent": 5, "unit": "Pallets"},
        {"minVolume": 1000, "discountPercent": 10, "unit": "Pallets"}
      ]'::jsonb,
      'default',
      NOW(),
      NOW()
    )
    ON CONFLICT (code, "tenantId") DO NOTHING
  `)

  await prisma.$executeRawUnsafe(`
    INSERT INTO rate_cards (id, name, code, category, "effectiveDate", "expiryDate", currency, status, rates, "tenantId", "createdAt", "updatedAt")
    VALUES (
      'rc-002',
      'Transportation FTL/LTL 2025',
      'TR-STD-2025',
      'TRANSPORTATION',
      '2025-01-01',
      '2025-12-31',
      'SAR',
      'ACTIVE',
      '[
        {"id": "r1", "service": "FTL - Local", "description": "Full truck within city", "unit": "Trip", "baseRate": 800},
        {"id": "r2", "service": "LTL - Per Pallet", "description": "Less than truckload", "unit": "Pallet", "baseRate": 150}
      ]'::jsonb,
      'default',
      NOW(),
      NOW()
    )
    ON CONFLICT (code, "tenantId") DO NOTHING
  `)

  console.log('✅ Rate cards seeded')

  // Seed Service Catalog
  console.log('📦 Seeding service catalog...')
  
  const services = [
    {
      id: 'wh-001',
      code: 'WH-STD',
      name: 'Standard Storage',
      category: 'WAREHOUSING',
      description: 'General cargo storage',
      basePrice: 50,
      unit: 'pallet/month',
      features: JSON.stringify(['24/7 Security', 'WMS']),
    },
    {
      id: 'wh-002',
      code: 'WH-COLD',
      name: 'Cold Storage',
      category: 'WAREHOUSING',
      description: 'Temperature-controlled storage',
      basePrice: 150,
      unit: 'pallet/month',
      features: JSON.stringify(['Temperature Monitoring', 'HACCP']),
    },
    {
      id: 'tr-001',
      code: 'TR-FTL',
      name: 'Full Truck Load',
      category: 'TRANSPORTATION',
      description: 'Dedicated truck',
      basePrice: 2500,
      unit: 'trip',
      features: JSON.stringify(['GPS Tracking', 'Direct Delivery']),
    },
  ]

  for (const service of services) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO services (id, code, name, category, description, "basePrice", unit, features, active, "tenantId", "createdAt", "updatedAt")
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, true, 'default', NOW(), NOW()
      )
      ON CONFLICT (code, "tenantId") DO NOTHING
    `, service.id, service.code, service.name, service.category, service.description, service.basePrice, service.unit, service.features)
  }

  console.log('✅ Service catalog seeded')

  // Seed Workflow Templates
  console.log('📝 Seeding workflow templates...')
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO workflow_templates (id, name, description, category, version, stages, transitions, tags, "createdBy", "tenantId", "createdAt", "updatedAt")
    VALUES (
      'wf-template-001',
      'Standard Inbound Process',
      'Standard receiving and putaway workflow',
      'INBOUND',
      '1.0',
      '[
        {"id": "stage-1", "name": "Receive", "order": 1},
        {"id": "stage-2", "name": "Quality Check", "order": 2},
        {"id": "stage-3", "name": "Putaway", "order": 3}
      ]'::jsonb,
      '[
        {"from": "stage-1", "to": "stage-2"},
        {"from": "stage-2", "to": "stage-3"}
      ]'::jsonb,
      '["inbound", "standard", "wms"]'::jsonb,
      'system',
      'default',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `)

  console.log('✅ Workflow templates seeded')

  console.log('\n🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
