// Internal Warehouse SLAs (3PL Provider)
// Operational SLAs for warehouse staff and internal operations
// Based on global 3PL best practices (DHL, FedEx, UPS, Kuehne+Nagel standards)

import { CustomerSLA } from '@/types/asn'

// Internal Warehouse SLA Categories
export type InternalSLACategory = 
  | 'RECEIVING'           // Inbound receiving operations
  | 'PUTAWAY'             // Storage and putaway
  | 'PICKING'              // Order picking
  | 'PACKING'              // Order packing
  | 'QUALITY_INSPECTION'   // Quality checks
  | 'DISPATCH'             // Outbound dispatch
  | 'INVENTORY'            // Inventory management
  | 'DOCUMENTATION'        // Documentation processing
  | 'RELABELING'           // Relabeling operations
  | 'SAMPLING'             // Sampling operations
  | 'RETURN_PROCESSING'    // Return handling

// Internal Warehouse SLAs
export const internalWarehouseSLAs: CustomerSLA[] = [
  // RECEIVING OPERATIONS
  {
    id: 'internal-receiving-asn-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'ASN Receiving Window',
    description: 'Time window for receiving ASN and preparing for offloading. Target: ASN must be received and processed within 2 hours of arrival',
    targetDuration: 2 * 60 * 60, // 2 hours in seconds
    warningThreshold: 80, // 80% of target (1.6 hours)
    criticalThreshold: 100, // 100% of target (2 hours)
    metric: 'duration1',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-receiving-1',
        field: 'documentType',
        operator: 'equals',
        value: 'ASN',
      },
    ],
  },
  {
    id: 'internal-receiving-offload-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'Offloading Time SLA',
    description: 'Time to offload goods from vehicle to receiving dock. Target: Complete offloading within 30 minutes per vehicle',
    targetDuration: 30 * 60, // 30 minutes in seconds
    warningThreshold: 85, // 85% of target (25.5 minutes)
    criticalThreshold: 100, // 100% of target (30 minutes)
    metric: 'duration1',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-offload-1',
        field: 'category',
        operator: 'contains',
        value: 'offload',
      },
    ],
  },
  {
    id: 'internal-receiving-grn-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'GRN Issuance SLA',
    description: 'Goods Receipt Note (GRN) must be issued within 4 working hours of receiving. This is critical for inventory accuracy and customer visibility',
    targetDuration: 4 * 60 * 60, // 4 hours in seconds
    warningThreshold: 80, // 80% of target (3.2 hours)
    criticalThreshold: 100, // 100% of target (4 hours)
    metric: 'duration1',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-grn-1',
        field: 'documentType',
        operator: 'equals',
        value: 'GR',
      },
    ],
  },
  
  // PUTAWAY OPERATIONS
  {
    id: 'internal-putaway-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'Putaway Completion SLA',
    description: 'Time to complete putaway after receiving. Target: All received goods must be put away within 8 working hours',
    targetDuration: 8 * 60 * 60, // 8 hours in seconds
    warningThreshold: 75, // 75% of target (6 hours)
    criticalThreshold: 100, // 100% of target (8 hours)
    metric: 'duration2',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-putaway-1',
        field: 'action',
        operator: 'contains',
        value: 'putaway',
      },
    ],
  },
  
  // QUALITY INSPECTION
  {
    id: 'internal-quality-inspection-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'Quality Inspection SLA',
    description: 'Quality Inspection (QI) must be completed within 2 hours of receiving for inbound, and within 1 hour for outbound orders',
    targetDuration: 2 * 60 * 60, // 2 hours in seconds
    warningThreshold: 80, // 80% of target (1.6 hours)
    criticalThreshold: 100, // 100% of target (2 hours)
    metric: 'duration1',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-qi-1',
        field: 'category',
        operator: 'contains',
        value: 'quality',
      },
    ],
  },
  
  // RELABELING OPERATIONS
  {
    id: 'internal-relabeling-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'Relabeling Completion SLA',
    description: 'Relabeling of inbound goods must be completed within 24-48 hours of receipt. Target: 48 hours maximum',
    targetDuration: 48 * 60 * 60, // 48 hours in seconds
    warningThreshold: 80, // 80% of target (38.4 hours)
    criticalThreshold: 100, // 100% of target (48 hours)
    metric: 'total',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-relabel-1',
        field: 'category',
        operator: 'equals',
        value: 'relabeling',
      },
    ],
  },
  
  // SAMPLING OPERATIONS
  {
    id: 'internal-sampling-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'Sampling Completion SLA',
    description: 'Sampling must be completed during receiving and samples handed to shuttle drivers within 1 hour of receiving',
    targetDuration: 1 * 60 * 60, // 1 hour in seconds
    warningThreshold: 85, // 85% of target (51 minutes)
    criticalThreshold: 100, // 100% of target (1 hour)
    metric: 'duration1',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-sampling-1',
        field: 'category',
        operator: 'contains',
        value: 'sampling',
      },
    ],
  },
  
  // ORDER PICKING
  {
    id: 'internal-picking-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'Order Picking SLA',
    description: 'Order picking must be completed within 4 hours of order receipt for same-day dispatch, or within 8 hours for next-day dispatch',
    targetDuration: 4 * 60 * 60, // 4 hours in seconds
    warningThreshold: 80, // 80% of target (3.2 hours)
    criticalThreshold: 100, // 100% of target (4 hours)
    metric: 'duration1',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-picking-1',
        field: 'documentType',
        operator: 'equals',
        value: 'ORDER',
      },
      {
        id: 'cond-picking-2',
        field: 'action',
        operator: 'contains',
        value: 'picking',
      },
    ],
  },
  
  // ORDER PACKING
  {
    id: 'internal-packing-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'Order Packing SLA',
    description: 'Order packing must be completed within 2 hours of picking completion',
    targetDuration: 2 * 60 * 60, // 2 hours in seconds
    warningThreshold: 80, // 80% of target (1.6 hours)
    criticalThreshold: 100, // 100% of target (2 hours)
    metric: 'duration2',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-packing-1',
        field: 'action',
        operator: 'contains',
        value: 'packing',
      },
    ],
  },
  
  // STAGING AND DISPATCH
  {
    id: 'internal-staging-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'Staging Completion SLA',
    description: 'Staging and dispatch preparation must be completed within 1 hour of packing completion',
    targetDuration: 1 * 60 * 60, // 1 hour in seconds
    warningThreshold: 85, // 85% of target (51 minutes)
    criticalThreshold: 100, // 100% of target (1 hour)
    metric: 'duration2',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-staging-1',
        field: 'action',
        operator: 'contains',
        value: 'staging',
      },
    ],
  },
  
  // DISPATCH READINESS
  {
    id: 'internal-dispatch-readiness-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'Dispatch Readiness Confirmation SLA',
    description: 'Dispatch readiness confirmation must be sent by 2 PM for next-day dispatch. This ensures carrier scheduling',
    targetDuration: 14 * 60 * 60, // 14 hours (2 PM) in seconds from midnight
    warningThreshold: 90, // 90% of target (12.6 hours = 12:36 PM)
    criticalThreshold: 100, // 100% of target (2 PM)
    metric: 'processing_time',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-dispatch-1',
        field: 'documentType',
        operator: 'equals',
        value: 'ORDER',
      },
    ],
  },
  
  // RETURN PROCESSING
  {
    id: 'internal-return-processing-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'Return Receiving Report (RRR) SLA',
    description: 'Return Receiving Report (RRR) must be issued within 4 working hours of receiving return goods',
    targetDuration: 4 * 60 * 60, // 4 hours in seconds
    warningThreshold: 80, // 80% of target (3.2 hours)
    criticalThreshold: 100, // 100% of target (4 hours)
    metric: 'duration1',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-return-1',
        field: 'documentType',
        operator: 'equals',
        value: 'RETURN',
      },
    ],
  },
  
  // DAMAGE REPORTING
  {
    id: 'internal-damage-reporting-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'Damage Reporting SLA',
    description: 'Damaged or short-dated items must be reported within 1 working day for action',
    targetDuration: 24 * 60 * 60, // 24 hours in seconds
    warningThreshold: 85, // 85% of target (20.4 hours)
    criticalThreshold: 100, // 100% of target (24 hours)
    metric: 'processing_time',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-damage-1',
        field: 'outcome',
        operator: 'contains',
        value: 'damage',
      },
    ],
  },
  
  // DAILY REPORTING
  {
    id: 'internal-daily-report-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'Daily Dispatch Report SLA',
    description: 'Daily dispatch report must be sent before 7:30 AM next day. This is critical for customer visibility and operations planning',
    targetDuration: 7.5 * 60 * 60, // 7.5 hours (7:30 AM) in seconds from midnight
    warningThreshold: 90, // 90% of target (6.75 hours = 6:45 AM)
    criticalThreshold: 100, // 100% of target (7:30 AM)
    metric: 'processing_time',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-report-1',
        field: 'category',
        operator: 'contains',
        value: 'report',
      },
    ],
  },
  
  // INVENTORY ACCURACY
  {
    id: 'internal-inventory-accuracy-001',
    customerNumber: 'INTERNAL-3PL',
    customerName: 'Internal Warehouse Operations',
    responsibility: 'WAREHOUSE', // All internal SLAs are warehouse responsibility
    name: 'Inventory Accuracy SLA',
    description: 'Inventory accuracy must be maintained at ≥99.5%. This is measured monthly through cycle counts and stocktaking',
    targetDuration: 99.5, // Percentage target
    warningThreshold: 99.0, // 99.0% warning threshold
    criticalThreshold: 98.5, // 98.5% critical threshold
    metric: 'custom',
    customFormula: '(receivedQuantity / totalQuantity) * 100',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-inventory-1',
        field: 'category',
        operator: 'contains',
        value: 'inventory',
      },
    ],
  },
]

// Initialize internal SLAs in localStorage
export function initializeInternalSLAs() {
  if (typeof window === 'undefined') return

  const existingSLAs = localStorage.getItem('customer-slas')
  if (existingSLAs) {
    try {
      const slas: CustomerSLA[] = JSON.parse(existingSLAs)
      // Check if internal SLAs already exist
      const hasInternalSLAs = slas.some((sla) => sla.customerNumber === 'INTERNAL-3PL')
      if (!hasInternalSLAs) {
        // Add internal SLAs to existing ones
        localStorage.setItem('customer-slas', JSON.stringify([...slas, ...internalWarehouseSLAs]))
      }
    } catch (error) {
      console.error('Error parsing existing SLAs:', error)
      // If parsing fails, just set internal SLAs
      localStorage.setItem('customer-slas', JSON.stringify(internalWarehouseSLAs))
    }
  } else {
    // No existing SLAs, set internal SLAs
    localStorage.setItem('customer-slas', JSON.stringify(internalWarehouseSLAs))
  }
}

