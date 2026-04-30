// Internal Warehouse KPIs (3PL Provider)
// Operational KPIs for warehouse staff - must be stricter than customer KPIs
// Based on global 3PL best practices (DHL, FedEx, UPS, Kuehne+Nagel standards)

import { KPI } from '@/types/asn'

// Internal Warehouse KPIs
// These must be LOWER (stricter) than customer KPIs to ensure customer SLAs are met
export const internalWarehouseKPIs: KPI[] = [
  // RECEIVING OPERATIONS
  {
    id: 'kpi-internal-receiving-asn-001',
    name: 'ASN Receiving Window (Internal)',
    description: 'Internal target: ASN must be received and processed within 1.5 hours (stricter than customer 2-hour requirement)',
    formula: 'AVG(duration1)',
    target: 1.5, // hours (stricter than customer 2 hours)
    unit: 'hours',
    category: 'performance',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kpi-internal-receiving-offload-001',
    name: 'Offloading Time (Internal)',
    description: 'Internal target: Complete offloading within 25 minutes (stricter than customer 30-minute requirement)',
    formula: 'AVG(offloadingDuration)',
    target: 25, // minutes (stricter than customer 30 minutes)
    unit: 'minutes',
    category: 'efficiency',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kpi-internal-receiving-grn-001',
    name: 'GRN Issuance (Internal)',
    description: 'Internal target: GRN must be issued within 3 hours (stricter than customer 4-hour requirement)',
    formula: 'AVG(duration1)',
    target: 3, // hours (stricter than customer 4 hours)
    unit: 'hours',
    category: 'performance',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // PUTAWAY OPERATIONS
  {
    id: 'kpi-internal-putaway-001',
    name: 'Putaway Completion (Internal)',
    description: 'Internal target: All received goods must be put away within 6 hours (stricter than customer 8-hour requirement)',
    formula: 'AVG(putawayDuration)',
    target: 6, // hours (stricter than customer 8 hours)
    unit: 'hours',
    category: 'efficiency',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // QUALITY INSPECTION
  {
    id: 'kpi-internal-quality-inspection-001',
    name: 'Quality Inspection (Internal)',
    description: 'Internal target: Quality Inspection must be completed within 1.5 hours (stricter than customer 2-hour requirement)',
    formula: 'AVG(qcDuration)',
    target: 1.5, // hours (stricter than customer 2 hours)
    unit: 'hours',
    category: 'quality',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // RELABELING OPERATIONS
  {
    id: 'kpi-internal-relabeling-001',
    name: 'Relabeling Completion (Internal)',
    description: 'Internal target: Relabeling must be completed within 40 hours (stricter than customer 48-hour requirement)',
    formula: 'AVG(putawayDuration)',
    target: 40, // hours (stricter than customer 48 hours)
    unit: 'hours',
    category: 'efficiency',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // SAMPLING OPERATIONS
  {
    id: 'kpi-internal-sampling-001',
    name: 'Sampling Completion (Internal)',
    description: 'Internal target: Sampling must be completed within 50 minutes (stricter than customer 1-hour requirement)',
    formula: 'AVG(qcDuration)',
    target: 50, // minutes (stricter than customer 60 minutes)
    unit: 'minutes',
    category: 'efficiency',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // ORDER PICKING
  {
    id: 'kpi-internal-picking-001',
    name: 'Order Picking (Internal)',
    description: 'Internal target: Order picking must be completed within 3 hours (stricter than customer 4-hour requirement)',
    formula: 'AVG(pickingDuration)',
    target: 3, // hours (stricter than customer 4 hours)
    unit: 'hours',
    category: 'performance',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // ORDER PACKING
  {
    id: 'kpi-internal-packing-001',
    name: 'Order Packing (Internal)',
    description: 'Internal target: Order packing must be completed within 1.5 hours (stricter than customer 2-hour requirement)',
    formula: 'AVG(dispatchingDuration)',
    target: 1.5, // hours (stricter than customer 2 hours)
    unit: 'hours',
    category: 'efficiency',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // STAGING AND DISPATCH
  {
    id: 'kpi-internal-staging-001',
    name: 'Staging Completion (Internal)',
    description: 'Internal target: Staging must be completed within 50 minutes (stricter than customer 1-hour requirement)',
    formula: 'AVG(duration2)',
    target: 50, // minutes (stricter than customer 60 minutes)
    unit: 'minutes',
    category: 'efficiency',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // DISPATCH READINESS
  {
    id: 'kpi-internal-dispatch-readiness-001',
    name: 'Dispatch Readiness Confirmation (Internal)',
    description: 'Internal target: Dispatch readiness confirmation must be sent by 1:30 PM (stricter than customer 2 PM requirement)',
    formula: 'AVG(dispatchingDuration)',
    target: 13.5, // hours (1:30 PM) (stricter than customer 2 PM)
    unit: 'hours',
    category: 'performance',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // RETURN PROCESSING
  {
    id: 'kpi-internal-return-processing-001',
    name: 'Return Processing (Internal)',
    description: 'Internal target: Return Receiving Report (RRR) must be issued within 3 hours (stricter than customer 4-hour requirement)',
    formula: 'AVG(duration1)',
    target: 3, // hours (stricter than customer 4 hours)
    unit: 'hours',
    category: 'performance',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // DAMAGE REPORTING
  {
    id: 'kpi-internal-damage-reporting-001',
    name: 'Damage Reporting (Internal)',
    description: 'Internal target: Damage reporting must be completed within 20 hours (stricter than customer 24-hour requirement)',
    formula: 'AVG(duration1)',
    target: 20, // hours (stricter than customer 24 hours)
    unit: 'hours',
    category: 'compliance',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // DAILY REPORTING
  {
    id: 'kpi-internal-daily-report-001',
    name: 'Daily Dispatch Report (Internal)',
    description: 'Internal target: Daily dispatch report must be sent before 7:00 AM (stricter than customer 7:30 AM requirement)',
    formula: 'AVG(duration1)',
    target: 7, // hours (7:00 AM) (stricter than customer 7:30 AM)
    unit: 'hours',
    category: 'compliance',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // INVENTORY ACCURACY
  {
    id: 'kpi-internal-inventory-accuracy-001',
    name: 'Inventory Accuracy (Internal)',
    description: 'Internal target: Inventory accuracy must be maintained at ≥99.7% (stricter than customer ≥99.5% requirement)',
    formula: '(receivedQuantity / totalQuantity) * 100',
    target: 99.7, // percentage (stricter than customer 99.5%)
    unit: '%',
    category: 'quality',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // DOCUMENTATION PROCESSING
  {
    id: 'kpi-internal-documentation-001',
    name: 'Documentation Processing (Internal)',
    description: 'Internal target: Documentation must be processed within 1.5 hours (stricter than customer 2-hour requirement)',
    formula: 'AVG(duration1)',
    target: 1.5, // hours (stricter than customer 2 hours)
    unit: 'hours',
    category: 'efficiency',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // FIFO COMPLIANCE
  {
    id: 'kpi-internal-fifo-001',
    name: 'FIFO Compliance (Internal)',
    description: 'Internal target: FIFO compliance must be maintained at 100% (same as customer requirement)',
    formula: '(receivedItems / totalItems) * 100',
    target: 100, // percentage (same as customer)
    unit: '%',
    category: 'quality',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // TRUCK ARRIVAL WINDOW
  {
    id: 'kpi-internal-truck-arrival-001',
    name: 'Truck Arrival Window (Internal)',
    description: 'Internal target: Trucks must arrive before 2:30 PM (stricter than customer 3 PM requirement)',
    formula: 'AVG(duration1)',
    target: 14.5, // hours (2:30 PM) (stricter than customer 3 PM)
    unit: 'hours',
    category: 'performance',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // PROCESSING EFFICIENCY
  {
    id: 'kpi-internal-processing-efficiency-001',
    name: 'Processing Efficiency (Internal)',
    description: 'Internal target: Processing efficiency must be ≥95% (to ensure customer SLAs are met)',
    formula: '(slaTargetDuration / slaActualDuration) * 100',
    target: 95, // percentage
    unit: '%',
    category: 'efficiency',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // ON-TIME PERFORMANCE
  {
    id: 'kpi-internal-on-time-001',
    name: 'On-Time Performance (Internal)',
    description: 'Internal target: On-time performance must be ≥99% (stricter than customer ≥98% requirement)',
    formula: '(COUNT(status="COMPLETED") / COUNT(status)) * 100',
    target: 99, // percentage (stricter than customer 98%)
    unit: '%',
    category: 'performance',
    responsibility: 'WAREHOUSE', // All internal KPIs are warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Initialize internal KPIs in localStorage
export function initializeInternalKPIs() {
  if (typeof window === 'undefined') return

  const existingKPIs = localStorage.getItem('asn-kpis')
  if (existingKPIs) {
    try {
      const kpis: KPI[] = JSON.parse(existingKPIs)
      // Check if internal KPIs already exist
      const hasInternalKPIs = kpis.some((kpi) => kpi.id.startsWith('kpi-internal-'))
      if (!hasInternalKPIs) {
        // Add internal KPIs to existing ones
        localStorage.setItem('asn-kpis', JSON.stringify([...kpis, ...internalWarehouseKPIs]))
      }
    } catch (error) {
      console.error('Error parsing existing KPIs:', error)
      // If parsing fails, just set internal KPIs
      localStorage.setItem('asn-kpis', JSON.stringify(internalWarehouseKPIs))
    }
  } else {
    // No existing KPIs, set internal KPIs
    localStorage.setItem('asn-kpis', JSON.stringify(internalWarehouseKPIs))
  }
}

