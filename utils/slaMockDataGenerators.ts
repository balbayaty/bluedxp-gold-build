/**
 * SLA/KPI Mock Data Generators
 * 
 * Generates comprehensive mock data for:
 * - Multi-party SLAs (new format)
 * - Legacy Customer SLAs (old format)
 * - KPIs (internal and customer)
 * - SLA Compliance Results
 * - KPI Results
 * 
 * Integrates old SLA data with new multi-party format
 */

import { 
  SupplyChainSLA, 
  SupplyChainKPI, 
  SupplyChainSLAComplianceResult, 
  SupplyChainKPIResult,
  SupplyChainPartyType,
  SupplyChainServiceCategory,
  SLACondition,
  KPICondition
} from '@/types/supplyChainSLA'
import { CustomerSLA, KPI } from '@/types/asn'
import { 
  inboundLogisticsSLAs, 
  outboundFulfillmentSLAs, 
  valueAddedServicesSLAs,
  reverseLogisticsSLAs,
  dataAnalyticsSLAs,
  customsClearanceSLAs,
  transportationSLAs,
  freightForwardingSLAs,
  qualityComplianceSLAs,
  allModernSLAs,
  modernKPIs
} from '@/data/modernSLAStandard'
import { internalWarehouseKPIs } from '@/data/internalKPIs'
import { sikaSLAs, sikaKPIs } from '@/data/sikaSLAs'
import { internalWarehouseSLAs } from '@/data/internalSLAs'
import { Customer, Warehouse } from '@/types/tenant'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min: number, max: number, decimals = 2) => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}
const randomBoolean = () => Math.random() > 0.5

// ============================================================================
// CONVERT OLD SLA FORMAT TO NEW MULTI-PARTY FORMAT
// ============================================================================

/**
 * Convert legacy CustomerSLA to new SupplyChainSLA format
 */
export function convertLegacySLAToMultiParty(
  legacySLA: CustomerSLA,
  partyType: SupplyChainPartyType = 'CUSTOMER',
  partyId?: string,
  partyName?: string
): SupplyChainSLA {
  // Determine service category from SLA name/description
  let serviceCategory: SupplyChainServiceCategory = 'OUTBOUND_FULFILLMENT'
  const nameLower = legacySLA.name.toLowerCase()
  const descLower = legacySLA.description.toLowerCase()
  
  if (nameLower.includes('asn') || nameLower.includes('receiving') || nameLower.includes('inbound') || descLower.includes('inbound')) {
    serviceCategory = 'INBOUND_LOGISTICS'
  } else if (nameLower.includes('order') || nameLower.includes('ship') || nameLower.includes('outbound') || descLower.includes('outbound')) {
    serviceCategory = 'OUTBOUND_FULFILLMENT'
  } else if (nameLower.includes('warehouse') || nameLower.includes('storage') || nameLower.includes('inventory')) {
    serviceCategory = 'WAREHOUSE_OPERATIONS'
  } else if (nameLower.includes('return') || descLower.includes('return')) {
    serviceCategory = 'REVERSE_LOGISTICS'
  } else if (nameLower.includes('kitting') || nameLower.includes('labeling') || nameLower.includes('value')) {
    serviceCategory = 'VALUE_ADDED_SERVICES'
  } else if (nameLower.includes('customs') || descLower.includes('customs')) {
    serviceCategory = 'CUSTOMS_CLEARANCE'
  } else if (nameLower.includes('transport') || nameLower.includes('carrier') || nameLower.includes('delivery')) {
    serviceCategory = 'TRANSPORTATION'
  } else if (nameLower.includes('freight') || descLower.includes('freight')) {
    serviceCategory = 'FREIGHT_FORWARDING'
  } else if (nameLower.includes('report') || nameLower.includes('data') || nameLower.includes('analytics')) {
    serviceCategory = 'DATA_ANALYTICS'
  } else if (nameLower.includes('quality') || nameLower.includes('compliance')) {
    serviceCategory = 'QUALITY_ASSURANCE'
  }

  // Determine metric type
  let metric: 'duration' | 'percentage' | 'count' | 'custom' = 'duration'
  if (legacySLA.metric === 'custom' || legacySLA.customFormula) {
    metric = 'custom'
  } else if (legacySLA.targetDuration > 1000 && legacySLA.targetDuration < 100) {
    // Likely a percentage (e.g., 99.5)
    metric = 'percentage'
  } else {
    metric = 'duration'
  }

  return {
    id: legacySLA.id.replace('sla-', 'sla-multi-'),
    name: legacySLA.name,
    description: legacySLA.description,
    partyType,
    partyId: partyId || legacySLA.customerNumber || 'UNKNOWN',
    partyName: partyName || legacySLA.customerName || 'Unknown Party',
    partyRole: legacySLA.responsibility === 'CUSTOMER' ? 'RECIPIENT' : 'PROVIDER',
    serviceCategory,
    serviceType: legacySLA.name, // Use name as service type
    targetDuration: legacySLA.targetDuration,
    warningThreshold: legacySLA.warningThreshold,
    criticalThreshold: legacySLA.criticalThreshold,
    metric,
    customFormula: legacySLA.customFormula,
    conditions: legacySLA.conditions?.map(cond => ({
      id: cond.id,
      field: cond.field,
      operator: cond.operator,
      value: cond.value,
    })),
    responsibleParty: legacySLA.responsibility === 'CUSTOMER' ? 'CUSTOMER' : 'WAREHOUSE',
    responsiblePartyId: legacySLA.responsibility === 'CUSTOMER' ? legacySLA.customerNumber : 'WAREHOUSE-001',
    isActive: legacySLA.isActive,
    isTemplate: false,
    createdAt: legacySLA.createdAt,
    updatedAt: legacySLA.updatedAt,
    createdBy: legacySLA.createdBy || 'SYSTEM',
    updatedBy: legacySLA.updatedBy || 'SYSTEM',
  }
}

/**
 * Convert legacy KPI to new SupplyChainKPI format
 */
export function convertLegacyKPIToMultiParty(
  legacyKPI: KPI,
  partyType: SupplyChainPartyType = 'WAREHOUSE',
  partyId?: string,
  partyName?: string
): SupplyChainKPI {
  return {
    id: legacyKPI.id.replace('kpi-', 'kpi-multi-'),
    name: legacyKPI.name,
    description: legacyKPI.description,
    partyType,
    partyId: partyId || legacyKPI.customerNumber || 'UNKNOWN',
    partyName: partyName || legacyKPI.customerName || 'Unknown Party',
    partyRole: legacyKPI.responsibility === 'CUSTOMER' ? 'RECIPIENT' : 'PROVIDER',
    formula: legacyKPI.formula,
    target: legacyKPI.target,
    unit: legacyKPI.unit,
    category: legacyKPI.category as SupplyChainKPI['category'],
    calculationMethod: 'REAL_TIME',
    calculationFrequency: 'HOURLY',
    aggregationMethod: 'AVG',
    responsibleParty: (legacyKPI.responsibility === 'CUSTOMER' ? 'CUSTOMER' : 'WAREHOUSE') as SupplyChainPartyType,
    responsiblePartyId: legacyKPI.responsibility === 'CUSTOMER' ? legacyKPI.customerNumber || 'CUSTOMER-001' : 'WAREHOUSE-001',
    isActive: legacyKPI.isActive,
    isTemplate: false,
    createdAt: legacyKPI.createdAt,
    updatedAt: legacyKPI.updatedAt,
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
  }
}

// ============================================================================
// GENERATE MULTI-PARTY SLAs FROM EXISTING DATA
// ============================================================================

/**
 * Generate multi-party SLAs from all existing SLA data
 */
export function generateMultiPartySLAsFromLegacy(
  customers: Customer[],
  warehouses: Warehouse[]
): SupplyChainSLA[] {
  const multiPartySLAs: SupplyChainSLA[] = []

  // Convert all modern SLAs for customers
  allModernSLAs.forEach(legacySLA => {
    // Create for each customer
    customers.forEach(customer => {
      const multiPartySLA = convertLegacySLAToMultiParty(
        legacySLA,
        'CUSTOMER',
        customer.id,
        customer.customerName
      )
      multiPartySLAs.push(multiPartySLA)
    })
  })

  // Convert Sika SLAs
  sikaSLAs.forEach(legacySLA => {
    const customer = customers.find(c => c.customerNumber === legacySLA.customerNumber)
    if (customer) {
      const multiPartySLA = convertLegacySLAToMultiParty(
        legacySLA,
        'CUSTOMER',
        customer.id,
        customer.customerName
      )
      multiPartySLAs.push(multiPartySLA)
    }
  })

  // Convert internal warehouse SLAs
  internalWarehouseSLAs.forEach(legacySLA => {
    warehouses.forEach(warehouse => {
      const multiPartySLA = convertLegacySLAToMultiParty(
        legacySLA,
        'WAREHOUSE',
        warehouse.id,
        warehouse.warehouseName
      )
      multiPartySLAs.push(multiPartySLA)
    })
  })

  // Generate SLAs for other party types
  const carriers = ['Carrier-001', 'Carrier-002', 'Carrier-003']
  const vendors = ['Vendor-001', 'Vendor-002', 'Vendor-003']
  
  // Carrier SLAs
  carriers.forEach((carrierId, index) => {
    multiPartySLAs.push({
      id: `sla-carrier-${carrierId}-on-time-delivery`,
      name: 'On-Time Delivery',
      description: 'Deliver shipments within agreed delivery window',
      partyType: 'CARRIER',
      partyId: carrierId,
      partyName: `Carrier ${index + 1}`,
      partyRole: 'PROVIDER',
      serviceCategory: 'TRANSPORTATION',
      serviceType: 'On-Time Delivery',
      targetDuration: 98.0, // Percentage
      warningThreshold: 95.0,
      criticalThreshold: 90.0,
      metric: 'percentage',
      responsibleParty: 'CARRIER',
      responsiblePartyId: carrierId,
      isActive: true,
      isTemplate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'SYSTEM',
      updatedBy: 'SYSTEM',
    })
  })

  // Vendor SLAs
  vendors.forEach((vendorId, index) => {
    multiPartySLAs.push({
      id: `sla-vendor-${vendorId}-asn-notice`,
      name: 'ASN Advance Notice',
      description: 'Send ASN before shipment arrival',
      partyType: 'VENDOR',
      partyId: vendorId,
      partyName: `Vendor ${index + 1}`,
      partyRole: 'PROVIDER',
      serviceCategory: 'INBOUND_LOGISTICS',
      serviceType: 'ASN Notice',
      targetDuration: 24 * 60 * 60, // 24 hours
      warningThreshold: 85,
      criticalThreshold: 100,
      metric: 'duration',
      responsibleParty: 'VENDOR',
      responsiblePartyId: vendorId,
      isActive: true,
      isTemplate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'SYSTEM',
      updatedBy: 'SYSTEM',
    })
  })

  return multiPartySLAs
}

/**
 * Generate multi-party KPIs from all existing KPI data
 */
export function generateMultiPartyKPIsFromLegacy(
  customers: Customer[],
  warehouses: Warehouse[]
): SupplyChainKPI[] {
  const multiPartyKPIs: SupplyChainKPI[] = []

  // Convert internal warehouse KPIs
  internalWarehouseKPIs.forEach(legacyKPI => {
    warehouses.forEach(warehouse => {
      const multiPartyKPI = convertLegacyKPIToMultiParty(
        legacyKPI,
        'WAREHOUSE',
        warehouse.id,
        warehouse.warehouseName
      )
      multiPartyKPIs.push(multiPartyKPI)
    })
  })

  // Convert modern KPIs
  modernKPIs.forEach(legacyKPI => {
    warehouses.forEach(warehouse => {
      const multiPartyKPI = convertLegacyKPIToMultiParty(
        legacyKPI,
        'WAREHOUSE',
        warehouse.id,
        warehouse.warehouseName
      )
      multiPartyKPIs.push(multiPartyKPI)
    })
  })

  // Convert Sika KPIs
  sikaKPIs.forEach(legacyKPI => {
    const customer = customers.find(c => c.customerNumber === legacyKPI.customerNumber)
    if (customer) {
      const multiPartyKPI = convertLegacyKPIToMultiParty(
        legacyKPI,
        'CUSTOMER',
        customer.id,
        customer.customerName
      )
      multiPartyKPIs.push(multiPartyKPI)
    }
  })

  return multiPartyKPIs
}

// ============================================================================
// GENERATE SLA COMPLIANCE RESULTS
// ============================================================================

/**
 * Generate SLA compliance results for demonstration
 */
export function generateSLAComplianceResults(
  slas: SupplyChainSLA[],
  transactionIds: string[] = []
): SupplyChainSLAComplianceResult[] {
  const results: SupplyChainSLAComplianceResult[] = []
  const now = new Date()

  slas.filter(sla => sla.isActive).forEach(sla => {
    // Generate 5-10 compliance results per SLA
    const resultCount = randomInt(5, 10)
    
    for (let i = 0; i < resultCount; i++) {
      const transactionId = transactionIds[randomInt(0, transactionIds.length - 1)] || generateId('TXN')
      const startTime = randomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now)
      
      // Calculate actual duration (may be better or worse than target)
      let actualDuration = 0
      let compliancePercentage = 0
      let status: 'MET' | 'WARNING' | 'CRITICAL' | 'BREACH' = 'MET'
      
      if (sla.metric === 'percentage') {
        // For percentage metrics, actual is the percentage value
        actualDuration = randomFloat(sla.targetDuration * 0.85, sla.targetDuration * 1.15)
        compliancePercentage = actualDuration
        
        if (compliancePercentage < sla.criticalThreshold) {
          status = 'BREACH'
        } else if (compliancePercentage < sla.warningThreshold) {
          status = 'CRITICAL'
        } else if (compliancePercentage < sla.targetDuration) {
          status = 'WARNING'
        } else {
          status = 'MET'
        }
      } else {
        // For duration metrics, calculate based on target
        const targetSeconds = sla.targetDuration
        const variance = randomFloat(-0.3, 0.3) // -30% to +30% variance
        actualDuration = targetSeconds * (1 + variance)
        
        compliancePercentage = (targetSeconds / actualDuration) * 100
        
        if (compliancePercentage < sla.criticalThreshold) {
          status = 'BREACH'
        } else if (compliancePercentage < sla.warningThreshold) {
          status = 'CRITICAL'
        } else if (compliancePercentage < 100) {
          status = 'WARNING'
        } else {
          status = 'MET'
        }
      }

      const endTime = new Date(startTime.getTime() + actualDuration * 1000)
      const targetEndTime = new Date(startTime.getTime() + sla.targetDuration * 1000)

      results.push({
        id: generateId('SLA-COMP'),
        slaId: sla.id,
        slaName: sla.name,
        partyType: sla.partyType,
        partyId: sla.partyId,
        partyName: sla.partyName,
        transactionId,
        transactionType: 'ORDER',
        targetDuration: sla.targetDuration,
        actualDuration,
        compliancePercentage,
        status,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        targetEndTime: targetEndTime.toISOString(),
        actualEndTime: endTime.toISOString(),
        breachReason: status === 'BREACH' || status === 'CRITICAL' 
          ? `Actual ${sla.metric === 'percentage' ? `${actualDuration.toFixed(1)}%` : `${(actualDuration / 3600).toFixed(1)}h`} ${status === 'BREACH' ? 'exceeds' : 'approaches'} critical threshold`
          : undefined,
        calculatedAt: now.toISOString(),
      })
    }
  })

  return results
}

// ============================================================================
// GENERATE KPI RESULTS
// ============================================================================

/**
 * Generate KPI results for demonstration
 */
export function generateKPIResultsData(
  kpis: SupplyChainKPI[],
  periodDays: number = 30
): SupplyChainKPIResult[] {
  const results: SupplyChainKPIResult[] = []
  const now = new Date()
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

  kpis.filter(kpi => kpi.isActive).forEach(kpi => {
    // Calculate actual value (may be better or worse than target)
    const variance = randomFloat(-0.2, 0.2) // -20% to +20% variance
    let actualValue = kpi.target * (1 + variance)
    
    // For percentage KPIs, ensure value is between 0-100
    if (kpi.unit === '%' || kpi.category === 'quality' || kpi.category === 'compliance') {
      actualValue = Math.max(0, Math.min(100, actualValue))
    }

    let status: 'MET' | 'WARNING' | 'CRITICAL' | 'BELOW_TARGET' = 'MET'
    
    // Determine status based on KPI type
    if (kpi.unit === '%' || kpi.category === 'quality' || kpi.category === 'compliance') {
      // Higher is better
      if (actualValue < kpi.target * 0.9) {
        status = 'CRITICAL'
      } else if (actualValue < kpi.target * 0.95) {
        status = 'WARNING'
      } else if (actualValue < kpi.target) {
        status = 'BELOW_TARGET'
      } else {
        status = 'MET'
      }
    } else if (kpi.unit.includes('hour') || kpi.unit.includes('minute') || kpi.unit.includes('day')) {
      // Lower is better (time-based)
      if (actualValue > kpi.target * 1.1) {
        status = 'CRITICAL'
      } else if (actualValue > kpi.target * 1.05) {
        status = 'WARNING'
      } else if (actualValue > kpi.target) {
        status = 'BELOW_TARGET'
      } else {
        status = 'MET'
      }
    } else {
      // Default: higher is better
      if (actualValue < kpi.target * 0.9) {
        status = 'CRITICAL'
      } else if (actualValue < kpi.target * 0.95) {
        status = 'WARNING'
      } else if (actualValue < kpi.target) {
        status = 'BELOW_TARGET'
      } else {
        status = 'MET'
      }
    }

    results.push({
      id: generateId('KPI-RESULT'),
      kpiId: kpi.id,
      kpiName: kpi.name,
      partyType: kpi.partyType,
      partyId: kpi.partyId,
      partyName: kpi.partyName,
      value: actualValue,
      target: kpi.target,
      unit: kpi.unit,
      status,
      vsBaseline: kpi.baseline ? actualValue - kpi.baseline : undefined,
      vsIndustryBenchmark: kpi.industryBenchmark ? actualValue - kpi.industryBenchmark : undefined,
      vsBestInClass: kpi.bestInClass ? actualValue - kpi.bestInClass : undefined,
      periodStart: periodStart.toISOString(),
      periodEnd: now.toISOString(),
      calculatedAt: now.toISOString(),
    })
  })

  return results
}

// ============================================================================
// COMPREHENSIVE MOCK DATA GENERATOR
// ============================================================================

/**
 * Generate comprehensive SLA/KPI mock data for demonstration
 */
export function generateComprehensiveSLAMockData(
  customers: Customer[],
  warehouses: Warehouse[],
  options: {
    includeLegacySLAs?: boolean
    includeLegacyKPIs?: boolean
    generateComplianceResults?: boolean
    generateKPIResults?: boolean
    transactionIds?: string[]
  } = {}
): {
  multiPartySLAs: SupplyChainSLA[]
  multiPartyKPIs: SupplyChainKPI[]
  legacySLAs: CustomerSLA[]
  legacyKPIs: KPI[]
  complianceResults: SupplyChainSLAComplianceResult[]
  kpiResults: SupplyChainKPIResult[]
} {
  const {
    includeLegacySLAs = true,
    includeLegacyKPIs = true,
    generateComplianceResults = true,
    generateKPIResults = true,
    transactionIds = [],
  } = options

  // Generate multi-party SLAs
  const multiPartySLAs = generateMultiPartySLAsFromLegacy(customers, warehouses)
  
  // Generate multi-party KPIs
  const multiPartyKPIs = generateMultiPartyKPIsFromLegacy(customers, warehouses)

  // Include legacy data
  const legacySLAs: CustomerSLA[] = includeLegacySLAs ? [
    ...allModernSLAs,
    ...sikaSLAs,
    ...internalWarehouseSLAs,
  ] : []

  const legacyKPIs: KPI[] = includeLegacyKPIs ? [
    ...internalWarehouseKPIs,
    ...modernKPIs,
    ...sikaKPIs,
  ] : []

  // Generate compliance results
  const complianceResults = generateComplianceResults 
    ? generateSLAComplianceResults(multiPartySLAs, transactionIds)
    : []

  // Generate KPI results
  const kpiResults = generateKPIResults
    ? generateKPIResultsData(multiPartyKPIs)
    : []

  return {
    multiPartySLAs,
    multiPartyKPIs,
    legacySLAs,
    legacyKPIs,
    complianceResults,
    kpiResults,
  }
}

// ============================================================================
// INITIALIZE MOCK DATA IN LOCALSTORAGE
// ============================================================================

/**
 * Initialize mock SLA/KPI data in localStorage for demonstration
 */
export function initializeSLAMockData(
  customers: Customer[],
  warehouses: Warehouse[]
): void {
  if (typeof window === 'undefined') return

  const mockData = generateComprehensiveSLAMockData(customers, warehouses, {
    includeLegacySLAs: true,
    includeLegacyKPIs: true,
    generateComplianceResults: true,
    generateKPIResults: true,
  })

  // Store multi-party SLAs
  const existingMultiPartySLAs = localStorage.getItem('supply-chain-slas')
  if (!existingMultiPartySLAs || JSON.parse(existingMultiPartySLAs).length === 0) {
    localStorage.setItem('supply-chain-slas', JSON.stringify(mockData.multiPartySLAs))
  }

  // Store legacy SLAs (for backward compatibility)
  const existingLegacySLAs = localStorage.getItem('customer-slas')
  if (!existingLegacySLAs || JSON.parse(existingLegacySLAs).length === 0) {
    localStorage.setItem('customer-slas', JSON.stringify(mockData.legacySLAs))
  }

  // Store multi-party KPIs
  const existingMultiPartyKPIs = localStorage.getItem('supply-chain-kpis')
  if (!existingMultiPartyKPIs || JSON.parse(existingMultiPartyKPIs).length === 0) {
    localStorage.setItem('supply-chain-kpis', JSON.stringify(mockData.multiPartyKPIs))
  }

  // Store legacy KPIs (for backward compatibility)
  const existingLegacyKPIs = localStorage.getItem('asn-kpis')
  if (!existingLegacyKPIs || JSON.parse(existingLegacyKPIs).length === 0) {
    localStorage.setItem('asn-kpis', JSON.stringify(mockData.legacyKPIs))
  }

  // Store compliance results
  localStorage.setItem('sla-compliance-results', JSON.stringify(mockData.complianceResults))
  
  // Store KPI results
  localStorage.setItem('kpi-results', JSON.stringify(mockData.kpiResults))
}

// ============================================================================
// GET MOCK DATA FOR DISPLAY
// ============================================================================

/**
 * Get all SLA/KPI mock data for display
 */
export function getSLAMockData(): {
  multiPartySLAs: SupplyChainSLA[]
  multiPartyKPIs: SupplyChainKPI[]
  legacySLAs: CustomerSLA[]
  legacyKPIs: KPI[]
  complianceResults: SupplyChainSLAComplianceResult[]
  kpiResults: SupplyChainKPIResult[]
} {
  if (typeof window === 'undefined') {
    return {
      multiPartySLAs: [],
      multiPartyKPIs: [],
      legacySLAs: [],
      legacyKPIs: [],
      complianceResults: [],
      kpiResults: [],
    }
  }

  return {
    multiPartySLAs: JSON.parse(localStorage.getItem('supply-chain-slas') || '[]'),
    multiPartyKPIs: JSON.parse(localStorage.getItem('supply-chain-kpis') || '[]'),
    legacySLAs: JSON.parse(localStorage.getItem('customer-slas') || '[]'),
    legacyKPIs: JSON.parse(localStorage.getItem('asn-kpis') || '[]'),
    complianceResults: JSON.parse(localStorage.getItem('sla-compliance-results') || '[]'),
    kpiResults: JSON.parse(localStorage.getItem('kpi-results') || '[]'),
  }
}

