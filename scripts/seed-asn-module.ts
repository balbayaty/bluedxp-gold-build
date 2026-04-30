/**
 * Seed ASN Module Data
 * Creates sample ASN data for testing and development
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding ASN Module...\n')

  // Get or create a test tenant
  let tenant = await prisma.tenants.findFirst({
    where: { slug: 'test-tenant' },
  })

  if (!tenant) {
    console.log('Creating test tenant...')
    tenant = await prisma.tenants.create({
      data: {
        id: 'tenant-1',
        name: 'Test Tenant',
        slug: 'test-tenant',
        type: '3PL',
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    })
  }

  const tenantId = tenant.id
  console.log(`Using tenant: ${tenant.name} (${tenantId})\n`)

  // Get or create test users
  let testUser = await prisma.users.findFirst({
    where: { email: 'asn-admin@test.com', tenantId },
  })

  if (!testUser) {
    console.log('Creating test user...')
    testUser = await prisma.users.create({
      data: {
        id: `user-${Date.now()}`,
        email: 'asn-admin@test.com',
        passwordHash: '$2b$10$dummy', // Dummy hash for testing
        name: 'ASN Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        tenantId,
        updatedAt: new Date(),
      },
    })
  }

  const userId = testUser.id
  console.log(`Using user: ${testUser.name} (${userId})\n`)

  // Create sample suppliers
  const suppliers = [
    { id: 'supplier-1', name: 'ABC Logistics Co.' },
    { id: 'supplier-2', name: 'XYZ Shipping Ltd.' },
    { id: 'supplier-3', name: 'Global Freight Inc.' },
  ]

  // Create sample warehouses
  const warehouses = [
    { id: 'warehouse-1', name: 'Main Warehouse' },
    { id: 'warehouse-2', name: 'Distribution Center' },
  ]

  console.log('Creating sample ASNs...\n')

  // Create sample ASNs
  const asns = []

  for (let i = 1; i <= 10; i++) {
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)]
    const warehouse = warehouses[Math.floor(Math.random() * warehouses.length)]
    const expectedDate = new Date()
    expectedDate.setDate(expectedDate.getDate() + Math.floor(Math.random() * 7) - 3) // -3 to +3 days

    const statuses = ['pending', 'in_transit', 'arrived', 'receiving', 'received', 'completed']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const priority = Math.random() > 0.8 ? 'urgent' : Math.random() > 0.5 ? 'high' : 'normal'

    const asn = await prisma.aSN.create({
      data: {
        asnNumber: `ASN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(i).padStart(4, '0')}`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        expectedArrivalDate: expectedDate,
        actualArrivalDate: status !== 'pending' && status !== 'in_transit' ? expectedDate : null,
        status,
        priority,
        source: Math.random() > 0.5 ? 'api' : 'manual',
        totalItems: Math.floor(Math.random() * 20) + 5,
        totalQuantity: Math.floor(Math.random() * 1000) + 100,
        totalValue: Math.floor(Math.random() * 50000) + 10000,
        currency: 'SAR',
        predictedArrivalTime: expectedDate,
        predictedArrivalConfidence: 0.7 + Math.random() * 0.2,
        exceptionProbability: Math.random() * 0.3,
        qualityScore: 70 + Math.random() * 25,
        sustainabilityScore: 60 + Math.random() * 30,
        metadata: {},
        tags: [],
        notes: `Sample ASN ${i} for testing`,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date in last 7 days
        updatedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
        tenantId,
      },
    })

    asns.push(asn)

    // Create items for each ASN
    const itemCount = Math.floor(Math.random() * 10) + 3
    for (let j = 1; j <= itemCount; j++) {
      const quantity = Math.floor(Math.random() * 100) + 10
      const unitPrice = Math.floor(Math.random() * 500) + 50

      await prisma.aSNItem.create({
        data: {
          asnId: asn.id,
          lineNumber: j,
          sku: `SKU-${i}-${j}`,
          description: `Item ${j} for ASN ${i}`,
          quantity,
          receivedQuantity: status === 'received' || status === 'completed' ? quantity : null,
          unitPrice,
          totalPrice: quantity * unitPrice,
          unitOfMeasure: 'PCS',
          status: status === 'completed' ? 'completed' : status === 'received' ? 'received' : 'pending',
          metadata: {},
          tenantId,
        },
      })
    }

    // Create some exceptions for some ASNs
    if (Math.random() > 0.7) {
      const exceptionTypes = ['late_arrival', 'quantity_mismatch', 'quality_issue', 'damage']
      const exceptionType = exceptionTypes[Math.floor(Math.random() * exceptionTypes.length)]
      const severities = ['low', 'medium', 'high']
      const severity = severities[Math.floor(Math.random() * severities.length)]

      await prisma.aSNException.create({
        data: {
          asnId: asn.id,
          type: exceptionType,
          severity,
          description: `Sample ${exceptionType} exception for testing`,
          detectedAt: new Date(),
          detectedBy: userId,
          status: Math.random() > 0.5 ? 'open' : 'resolved',
          metadata: {},
          tenantId,
        },
      })
    }

    // Create tracking events
    const eventTypes = ['created', 'in_transit', 'arrived', 'receiving_started']
    for (const eventType of eventTypes.slice(0, Math.floor(Math.random() * eventTypes.length) + 1)) {
      await prisma.aSNTrackingEvent.create({
        data: {
          asnId: asn.id,
          eventType,
          description: `ASN ${eventType}`,
          timestamp: new Date(),
          userId,
          metadata: {},
          tenantId,
        },
      })
    }

    console.log(`  ✅ Created ASN ${asn.asnNumber} (${status})`)
  }

  // Create some templates
  console.log('\nCreating sample templates...\n')

  const templates = [
    {
      name: 'Standard ASN Template',
      description: 'Standard template for regular ASN processing',
      type: 'asn_template',
      category: 'standard',
      structure: {
        fields: [
          { name: 'supplierId', label: 'Supplier', type: 'select', required: true },
          { name: 'warehouseId', label: 'Warehouse', type: 'select', required: true },
          { name: 'expectedArrivalDate', label: 'Expected Arrival', type: 'date', required: true },
        ],
      },
      isDefault: true,
      isPublic: true,
    },
    {
      name: 'Fast-Track ASN Workflow',
      description: 'Workflow for urgent ASN processing',
      type: 'workflow_template',
      category: 'workflow',
      structure: {
        workflow: [
          { id: '1', name: 'Quick Approval', type: 'approval', order: 1, required: true },
          { id: '2', name: 'Fast Receiving', type: 'inspection', order: 2, required: true },
        ],
      },
      isDefault: false,
      isPublic: true,
    },
  ]

  for (const template of templates) {
    await prisma.aSNTemplate.create({
      data: {
        ...template,
        createdBy: userId,
        tenantId,
      },
    })
    console.log(`  ✅ Created template: ${template.name}`)
  }

  console.log('\n✨ ASN Module seeding complete!')
  console.log('\n📊 Summary:')
  console.log(`   - Created ${asns.length} ASNs`)
  console.log(`   - Created ${templates.length} templates`)
  console.log(`   - Tenant: ${tenant.name}`)
  console.log('\n🔗 Next Steps:')
  console.log('  1. View ASN dashboard: /asn')
  console.log('  2. View ASN processing: /asn/processing')
  console.log('  3. View ASN analytics: /asn/dashboard?tab=analytical')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding ASN module:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

