/**
 * Seed Data for New Tables
 * Seeds initial data for process mining, webhooks, templates, rate cards, and services
 * 
 * USAGE: npx ts-node prisma/seed-new-tables.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding new tables...\n')

  // Seed Rate Cards
  console.log('📊 Seeding rate cards...')
  await prisma.rateCard.upsert({
    where: { code_tenantId: { code: 'WH-STD-2025', tenantId: 'default' } },
    update: {},
    create: {
      id: 'rc-001',
      name: 'Standard Warehousing 2025',
      code: 'WH-STD-2025',
      category: 'WAREHOUSING',
      effectiveDate: '2025-01-01',
      expiryDate: '2025-12-31',
      currency: 'SAR',
      status: 'ACTIVE',
      rates: [
        { id: 'r1', service: 'Pallet Storage', description: 'Standard pallet storage (ambient)', unit: 'Pallet/Month', baseRate: 50, minCharge: 500 },
        { id: 'r2', service: 'Pick & Pack', description: 'Order picking and packing', unit: 'Order', baseRate: 5, minCharge: 50 },
      ],
      volumeDiscounts: [
        { minVolume: 500, maxVolume: 999, discountPercent: 5, unit: 'Pallets' },
        { minVolume: 1000, discountPercent: 10, unit: 'Pallets' },
      ],
      tenantId: 'default',
    },
  })

  await prisma.rateCard.upsert({
    where: { code_tenantId: { code: 'TR-STD-2025', tenantId: 'default' } },
    update: {},
    create: {
      id: 'rc-002',
      name: 'Transportation FTL/LTL 2025',
      code: 'TR-STD-2025',
      category: 'TRANSPORTATION',
      effectiveDate: '2025-01-01',
      expiryDate: '2025-12-31',
      currency: 'SAR',
      status: 'ACTIVE',
      rates: [
        { id: 'r1', service: 'FTL - Local', description: 'Full truck within city', unit: 'Trip', baseRate: 800 },
        { id: 'r2', service: 'LTL - Per Pallet', description: 'Less than truckload', unit: 'Pallet', baseRate: 150 },
      ],
      tenantId: 'default',
    },
  })

  console.log('✅ Rate cards seeded')

  // Seed Service Catalog
  console.log('📦 Seeding service catalog...')
  const services = [
    { id: 'wh-001', code: 'WH-STD', name: 'Standard Storage', category: 'WAREHOUSING', description: 'General cargo storage', basePrice: 50, unit: 'pallet/month', features: ['24/7 Security', 'WMS'] },
    { id: 'wh-002', code: 'WH-COLD', name: 'Cold Storage', category: 'WAREHOUSING', description: 'Temperature-controlled storage', basePrice: 150, unit: 'pallet/month', features: ['Temperature Monitoring', 'HACCP'] },
    { id: 'tr-001', code: 'TR-FTL', name: 'Full Truck Load', category: 'TRANSPORTATION', description: 'Dedicated truck', basePrice: 2500, unit: 'trip', features: ['GPS Tracking', 'Direct Delivery'] },
  ]

  for (const service of services) {
    await prisma.serviceCatalog.upsert({
      where: { code_tenantId: { code: service.code, tenantId: 'default' } },
      update: {},
      create: { ...service, tenantId: 'default' },
    })
  }

  console.log('✅ Service catalog seeded')

  // Seed Workflow Templates
  console.log('📝 Seeding workflow templates...')
  await prisma.workflowTemplate.create({
    data: {
      id: 'wf-template-001',
      name: 'Standard Inbound Process',
      description: 'Standard receiving and putaway workflow',
      category: 'INBOUND',
      version: '1.0',
      stages: [
        { id: 'stage-1', name: 'Receive', order: 1 },
        { id: 'stage-2', name: 'Quality Check', order: 2 },
        { id: 'stage-3', name: 'Putaway', order: 3 },
      ],
      transitions: [
        { from: 'stage-1', to: 'stage-2' },
        { from: 'stage-2', to: 'stage-3' },
      ],
      tags: ['inbound', 'standard', 'wms'],
      createdBy: 'system',
      tenantId: 'default',
    },
  }).catch(() => console.log('  Template already exists'))

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
