/**
 * Seed Unified SLA/KPI Service with Templates
 * 
 * Populates the unified service with industry-standard SLA/KPI templates
 * from data/multiPartySLAFramework.ts and data/modernSLAStandard.ts
 * 
 * Usage:
 *   npx tsx scripts/seed-unified-sla-kpi.ts [tenantId]
 */

import { unifiedSlaKpiService } from '../lib/services/sla-kpi/unifiedSlaKpiService'
import { slaTemplatesByParty } from '../data/multiPartySLAFramework'
import type { SupplyChainSLA, SupplyChainKPI } from '../types/supplyChainSLA'

const tenantId = process.argv[2] || 'default'

// ============================================================================
// SLA TEMPLATES
// ============================================================================

const defaultSLATemplates: Array<Omit<SupplyChainSLA, 'id' | 'createdAt' | 'updatedAt'>> = [
  // Transportation SLAs
  {
    name: 'On-Time Delivery - Standard',
    description: 'Carrier must deliver shipments within agreed time window',
    partyType: 'CARRIER',
    partyId: 'default',
    partyName: 'Default Carrier',
    partyRole: 'PROVIDER',
    serviceCategory: 'TRANSPORTATION',
    serviceType: 'On-Time Delivery',
    targetDuration: 48 * 3600, // 48 hours in seconds
    warningThreshold: 80,
    criticalThreshold: 100,
    metric: 'duration',
    responsibleParty: 'CARRIER',
    responsiblePartyId: 'default',
    isActive: true,
    isTemplate: true,
  },
  {
    name: 'Transit Time - Express',
    description: 'Express delivery within 24 hours',
    partyType: 'CARRIER',
    partyId: 'default',
    partyName: 'Default Carrier',
    partyRole: 'PROVIDER',
    serviceCategory: 'TRANSPORTATION',
    serviceType: 'Transit Time',
    targetDuration: 24 * 3600, // 24 hours
    warningThreshold: 80,
    criticalThreshold: 100,
    metric: 'duration',
    responsibleParty: 'CARRIER',
    responsiblePartyId: 'default',
    isActive: true,
    isTemplate: true,
  },
  // WMS SLAs
  {
    name: 'Dock-to-Stock Time',
    description: 'Time from dock arrival to stock putaway completion',
    partyType: 'WAREHOUSE',
    partyId: 'default',
    partyName: 'Default Warehouse',
    partyRole: 'PROVIDER',
    serviceCategory: 'INBOUND_LOGISTICS',
    serviceType: 'Dock-to-Stock',
    targetDuration: 4 * 3600, // 4 hours
    warningThreshold: 80,
    criticalThreshold: 100,
    metric: 'duration',
    responsibleParty: 'WAREHOUSE',
    responsiblePartyId: 'default',
    isActive: true,
    isTemplate: true,
  },
  {
    name: 'Order-to-Ship Time',
    description: 'Time from order received to shipment dispatched',
    partyType: 'WAREHOUSE',
    partyId: 'default',
    partyName: 'Default Warehouse',
    partyRole: 'PROVIDER',
    serviceCategory: 'OUTBOUND_LOGISTICS',
    serviceType: 'Order-to-Ship',
    targetDuration: 24 * 3600, // 24 hours
    warningThreshold: 80,
    criticalThreshold: 100,
    metric: 'duration',
    responsibleParty: 'WAREHOUSE',
    responsiblePartyId: 'default',
    isActive: true,
    isTemplate: true,
  },
  // Customs SLAs
  {
    name: 'Customs Clearance Time',
    description: 'Time from declaration submission to clearance',
    partyType: 'CUSTOMS_BROKER',
    partyId: 'default',
    partyName: 'Default Customs Broker',
    partyRole: 'PROVIDER',
    serviceCategory: 'CUSTOMS_CLEARANCE',
    serviceType: 'Clearance Time',
    targetDuration: 48 * 3600, // 48 hours
    warningThreshold: 80,
    criticalThreshold: 100,
    metric: 'duration',
    responsibleParty: 'CUSTOMS_BROKER',
    responsiblePartyId: 'default',
    isActive: true,
    isTemplate: true,
  },
  // Geofence SLAs
  {
    name: 'Border Crossing Dwell Time',
    description: 'Maximum time allowed at border crossing point',
    partyType: 'CARRIER',
    partyId: 'default',
    partyName: 'Default Carrier',
    partyRole: 'PROVIDER',
    serviceCategory: 'TRANSPORTATION',
    serviceType: 'Dwell Time',
    targetDuration: 2 * 3600, // 2 hours
    warningThreshold: 80,
    criticalThreshold: 100,
    metric: 'duration',
    responsibleParty: 'CARRIER',
    responsiblePartyId: 'default',
    isActive: true,
    isTemplate: true,
  },
]

// ============================================================================
// KPI TEMPLATES
// ============================================================================

const defaultKPITemplates: Array<Omit<SupplyChainKPI, 'id' | 'createdAt' | 'updatedAt'>> = [
  // Transportation KPIs
  {
    name: 'On-Time Delivery Rate',
    description: 'Percentage of deliveries made on time',
    partyType: 'CARRIER',
    partyId: 'default',
    partyName: 'Default Carrier',
    partyRole: 'PROVIDER',
    formula: '(onTimeDeliveries / totalDeliveries) * 100',
    target: 95,
    unit: 'percentage',
    category: 'performance',
    calculationMethod: 'REAL_TIME',
    responsibleParty: 'CARRIER',
    responsiblePartyId: 'default',
    industryBenchmark: 92,
    bestInClass: 98,
    baseline: 85,
    isActive: true,
    isTemplate: true,
  },
  {
    name: 'Average Transit Time',
    description: 'Average time from pickup to delivery',
    partyType: 'CARRIER',
    partyId: 'default',
    partyName: 'Default Carrier',
    partyRole: 'PROVIDER',
    formula: 'AVG(transitTime)',
    target: 48,
    unit: 'hours',
    category: 'performance',
    calculationMethod: 'BATCH',
    calculationFrequency: 'DAILY',
    responsibleParty: 'CARRIER',
    responsiblePartyId: 'default',
    isActive: true,
    isTemplate: true,
  },
  // WMS KPIs
  {
    name: 'Picking Accuracy',
    description: 'Percentage of correct picks',
    partyType: 'WAREHOUSE',
    partyId: 'default',
    partyName: 'Default Warehouse',
    partyRole: 'PROVIDER',
    formula: '(correctPicks / totalPicks) * 100',
    target: 99.5,
    unit: 'percentage',
    category: 'quality',
    calculationMethod: 'REAL_TIME',
    responsibleParty: 'WAREHOUSE',
    responsiblePartyId: 'default',
    industryBenchmark: 98,
    bestInClass: 99.9,
    baseline: 95,
    isActive: true,
    isTemplate: true,
  },
  {
    name: 'Order Fulfillment Rate',
    description: 'Percentage of orders fulfilled on time',
    partyType: 'WAREHOUSE',
    partyId: 'default',
    partyName: 'Default Warehouse',
    partyRole: 'PROVIDER',
    formula: '(fulfilledOrders / totalOrders) * 100',
    target: 98,
    unit: 'percentage',
    category: 'performance',
    calculationMethod: 'BATCH',
    calculationFrequency: 'DAILY',
    responsibleParty: 'WAREHOUSE',
    responsiblePartyId: 'default',
    isActive: true,
    isTemplate: true,
  },
  {
    name: 'Inventory Accuracy',
    description: 'Percentage of accurate inventory counts',
    partyType: 'WAREHOUSE',
    partyId: 'default',
    partyName: 'Default Warehouse',
    partyRole: 'PROVIDER',
    formula: '(accurateCounts / totalCounts) * 100',
    target: 99,
    unit: 'percentage',
    category: 'quality',
    calculationMethod: 'BATCH',
    calculationFrequency: 'WEEKLY',
    responsibleParty: 'WAREHOUSE',
    responsiblePartyId: 'default',
    isActive: true,
    isTemplate: true,
  },
  // Customs KPIs
  {
    name: 'Clearance Success Rate',
    description: 'Percentage of successful clearances',
    partyType: 'CUSTOMS_BROKER',
    partyId: 'default',
    partyName: 'Default Customs Broker',
    partyRole: 'PROVIDER',
    formula: '(successfulClearances / totalDeclarations) * 100',
    target: 95,
    unit: 'percentage',
    category: 'performance',
    calculationMethod: 'BATCH',
    calculationFrequency: 'DAILY',
    responsibleParty: 'CUSTOMS_BROKER',
    responsiblePartyId: 'default',
    isActive: true,
    isTemplate: true,
  },
]

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seedUnifiedSlaKpi() {
  console.log(`🌱 Seeding Unified SLA/KPI Service for tenant: ${tenantId}`)
  console.log('')

  try {
    // Initialize service
    console.log('🔧 Initializing service...')
    await unifiedSlaKpiService.initialize(tenantId)
    console.log('✅ Service initialized')
    console.log('')

    // Seed SLAs
    console.log('📋 Seeding SLA templates...')
    let slaCount = 0
    for (const slaTemplate of defaultSLATemplates) {
      try {
        const sla = await unifiedSlaKpiService.createSLA(slaTemplate, tenantId)
        console.log(`  ✅ Created SLA: ${sla.name}`)
        slaCount++
      } catch (error) {
        console.warn(`  ⚠️  Failed to create SLA ${slaTemplate.name}:`, error instanceof Error ? error.message : error)
      }
    }
    console.log(`✅ Created ${slaCount} SLA templates`)
    console.log('')

    // Seed KPIs
    console.log('📊 Seeding KPI templates...')
    let kpiCount = 0
    for (const kpiTemplate of defaultKPITemplates) {
      try {
        const kpi = await unifiedSlaKpiService.createKPI(kpiTemplate, tenantId)
        console.log(`  ✅ Created KPI: ${kpi.name}`)
        kpiCount++
      } catch (error) {
        console.warn(`  ⚠️  Failed to create KPI ${kpiTemplate.name}:`, error instanceof Error ? error.message : error)
      }
    }
    console.log(`✅ Created ${kpiCount} KPI templates`)
    console.log('')

    // Summary
    console.log('')
    console.log('📊 Summary:')
    console.log(`  ✅ SLAs created: ${slaCount}`)
    console.log(`  ✅ KPIs created: ${kpiCount}`)
    console.log(`  ✅ Tenant: ${tenantId}`)
    console.log('')
    console.log('🎉 Seeding completed successfully!')
    console.log('')
    console.log('Next steps:')
    console.log('  1. View dashboard: /sla-kpi/dashboard')
    console.log('  2. Use adapters in your code')
    console.log('  3. Create custom SLAs/KPIs as needed')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  seedUnifiedSlaKpi()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { seedUnifiedSlaKpi }


