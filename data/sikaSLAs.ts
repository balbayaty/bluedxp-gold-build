// SIKA Customer SLAs and KPIs Configuration
// Based on SLA document between Flex Logistics and SIKA

import { CustomerSLA, KPI } from '@/types/asn'
import { initializeInternalSLAs } from './internalSLAs'
import { initializeInternalKPIs } from './internalKPIs'

// SIKA Customer Information
export const SIKA_CUSTOMER = {
  customerNumber: 'CUST-SIKA-001',
  customerName: 'SIKA',
  entity: 'K-SIKA',
  description: 'SIKA represented by Kanoo Logistics',
}

// SIKA Service Level Agreements
export const sikaSLAs: CustomerSLA[] = [
  {
    id: 'sla-sika-grn-001',
    customerNumber: SIKA_CUSTOMER.customerNumber,
    customerName: SIKA_CUSTOMER.customerName,
    name: 'GRN Issuance SLA',
    description: 'Goods Receipt Note (GRN) must be issued within 4 working hours of receiving',
    targetDuration: 4 * 60 * 60, // 4 hours in seconds
    warningThreshold: 80, // 80% of target (3.2 hours)
    criticalThreshold: 100, // 100% of target (4 hours)
    metric: 'delivery_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility - we issue GRN
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-1',
        field: 'customerNumber',
        operator: 'equals',
        value: SIKA_CUSTOMER.customerNumber,
      },
    ],
  },
  {
    id: 'sla-sika-relabeling-001',
    customerNumber: SIKA_CUSTOMER.customerNumber,
    customerName: SIKA_CUSTOMER.customerName,
    name: 'Relabeling Completion SLA',
    description: 'Relabeling of inbound goods must be completed within 24-48 hours of receipt',
    targetDuration: 48 * 60 * 60, // 48 hours in seconds
    warningThreshold: 80, // 80% of target (38.4 hours)
    criticalThreshold: 100, // 100% of target (48 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility - we do relabeling
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-2',
        field: 'customerNumber',
        operator: 'equals',
        value: SIKA_CUSTOMER.customerNumber,
      },
      {
        id: 'cond-3',
        field: 'category',
        operator: 'equals',
        value: 'relabeling',
      },
    ],
  },
  {
    id: 'sla-sika-dispatch-001',
    customerNumber: SIKA_CUSTOMER.customerNumber,
    customerName: SIKA_CUSTOMER.customerName,
    name: 'Order Dispatch Compliance SLA',
    description: 'Orders received before 12 PM must be dispatched next working day before 10 AM (Eastern Region) or 2:30 PM (Outside Eastern Region)',
    targetDuration: 24 * 60 * 60, // 24 hours in seconds (next day dispatch)
    warningThreshold: 90, // 90% of target
    criticalThreshold: 98, // 98% compliance target
    metric: 'delivery_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility - we dispatch orders
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-4',
        field: 'customerNumber',
        operator: 'equals',
        value: SIKA_CUSTOMER.customerNumber,
      },
      {
        id: 'cond-5',
        field: 'category',
        operator: 'equals',
        value: 'dispatch',
      },
    ],
  },
  {
    id: 'sla-sika-return-001',
    customerNumber: SIKA_CUSTOMER.customerNumber,
    customerName: SIKA_CUSTOMER.customerName,
    name: 'Return Handling SLA',
    description: 'Return Receiving Report (RRR) must be issued within 4 working hours of receiving return goods',
    targetDuration: 4 * 60 * 60, // 4 hours in seconds
    warningThreshold: 80, // 80% of target (3.2 hours)
    criticalThreshold: 100, // 100% of target (4 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility - we issue RRR
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-6',
        field: 'customerNumber',
        operator: 'equals',
        value: SIKA_CUSTOMER.customerNumber,
      },
      {
        id: 'cond-7',
        field: 'category',
        operator: 'equals',
        value: 'return',
      },
    ],
  },
  {
    id: 'sla-sika-asn-001',
    customerNumber: SIKA_CUSTOMER.customerNumber,
    customerName: SIKA_CUSTOMER.customerName,
    name: 'ASN Pre-Alert SLA',
    description: 'Shipment Notice and ASN must be received 24 hours (factory) or 48 hours (supplier) prior to arrival',
    targetDuration: 24 * 60 * 60, // 24 hours in seconds (minimum for factory)
    warningThreshold: 80, // 80% of target
    criticalThreshold: 100, // 100% of target
    metric: 'delivery_time',
    responsibility: 'CUSTOMER', // Customer responsibility - customer must send ASN on time
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-8',
        field: 'customerNumber',
        operator: 'equals',
        value: SIKA_CUSTOMER.customerNumber,
      },
    ],
  },
]

// SIKA Key Performance Indicators
export const sikaKPIs: KPI[] = [
  {
    id: 'kpi-sika-grn-001',
    name: 'Inbound GRN Issuance',
    description: 'GRN must be issued within 4 working hours of receiving. Target: ≤4 hours',
    formula: 'duration1', // Single document formula - uses actual duration1 field
    target: 4, // hours
    unit: 'hours',
    category: 'performance',
    customerNumber: SIKA_CUSTOMER.customerNumber,
    customerName: SIKA_CUSTOMER.customerName,
    responsibility: 'WAREHOUSE', // Warehouse responsibility - we issue GRN
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kpi-sika-relabeling-001',
    name: 'Relabeling Completion',
    description: 'Relabeling must be completed within 24-48 hours. Target: ≤48 hours',
    formula: 'putawayDuration', // Single document formula - uses actual putawayDuration field
    target: 48, // hours
    unit: 'hours',
    category: 'efficiency',
    customerNumber: SIKA_CUSTOMER.customerNumber,
    customerName: SIKA_CUSTOMER.customerName,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kpi-sika-inventory-001',
    name: 'Inventory Accuracy',
    description: 'Inventory accuracy must be maintained at ≥99.5%',
    formula: '(receivedQuantity / totalQuantity) * 100', // Single document formula
    target: 99.5, // percentage
    unit: '%',
    category: 'quality',
    customerNumber: SIKA_CUSTOMER.customerNumber,
    customerName: SIKA_CUSTOMER.customerName,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kpi-sika-dispatch-001',
    name: 'Order Dispatch Compliance',
    description: 'Orders must be dispatched within SLA. Target: ≥98% compliance',
    formula: '(slaTargetDuration / slaActualDuration) * 100', // Single document formula - uses SLA compliance
    target: 98, // percentage
    unit: '%',
    category: 'performance',
    customerNumber: SIKA_CUSTOMER.customerNumber,
    customerName: SIKA_CUSTOMER.customerName,
    responsibility: 'WAREHOUSE', // Warehouse responsibility - we issue GRN
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kpi-sika-return-001',
    name: 'Return Handling',
    description: 'Return Receiving Report (RRR) must be issued within 4 working hours. Target: ≤4 hours',
    formula: 'duration1', // Single document formula - uses actual duration1 field
    target: 4, // hours
    unit: 'hours',
    category: 'performance',
    customerNumber: SIKA_CUSTOMER.customerNumber,
    customerName: SIKA_CUSTOMER.customerName,
    responsibility: 'WAREHOUSE', // Warehouse responsibility - we issue GRN
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kpi-sika-damage-001',
    name: 'Damage Reporting',
    description: 'Damaged or short-dated items must be reported within 1 working day',
    formula: 'duration1', // Single document formula - uses actual duration1 field
    target: 1, // working day
    unit: 'days',
    category: 'compliance',
    customerNumber: SIKA_CUSTOMER.customerNumber,
    customerName: SIKA_CUSTOMER.customerName,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kpi-sika-report-001',
    name: 'Daily Dispatch Report',
    description: 'Daily dispatch report must be sent before 7:30 AM next day',
    formula: 'duration1', // Single document formula - uses actual duration1 field
    target: 7.5, // hours (7:30 AM = 7.5 hours from midnight)
    unit: 'hours',
    category: 'compliance',
    customerNumber: SIKA_CUSTOMER.customerNumber,
    customerName: SIKA_CUSTOMER.customerName,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Initialize SIKA SLAs and KPIs in localStorage
export function initializeSikaSLAsAndKPIs() {
  if (typeof window === 'undefined') return

  // Initialize internal SLAs first
  initializeInternalSLAs()
  
  // Initialize internal KPIs first
  initializeInternalKPIs()

  // Initialize SLAs
  const existingSLAs = localStorage.getItem('customer-slas')
  if (existingSLAs) {
    try {
      const slas: CustomerSLA[] = JSON.parse(existingSLAs)
      // Check if SIKA SLAs already exist
      const hasSikaSLAs = slas.some((sla) => sla.customerNumber === SIKA_CUSTOMER.customerNumber)
      if (!hasSikaSLAs) {
        // Add SIKA SLAs to existing ones
        localStorage.setItem('customer-slas', JSON.stringify([...slas, ...sikaSLAs]))
      }
    } catch (error) {
      console.error('Error parsing existing SLAs:', error)
      // If parsing fails, just set SIKA SLAs
      localStorage.setItem('customer-slas', JSON.stringify(sikaSLAs))
    }
  } else {
    // No existing SLAs, set SIKA SLAs
    localStorage.setItem('customer-slas', JSON.stringify(sikaSLAs))
  }

  // Initialize KPIs (using 'asn-kpis' key as per KPIManager)
  const existingKPIs = localStorage.getItem('asn-kpis')
  if (existingKPIs) {
    try {
      const kpis: KPI[] = JSON.parse(existingKPIs)
      // Check if SIKA KPIs already exist
      const hasSikaKPIs = kpis.some((kpi) => kpi.id.startsWith('kpi-sika-'))
      if (!hasSikaKPIs) {
        // Add SIKA KPIs to existing ones
        localStorage.setItem('asn-kpis', JSON.stringify([...kpis, ...sikaKPIs]))
      }
    } catch (error) {
      console.error('Error parsing existing KPIs:', error)
      // If parsing fails, just set SIKA KPIs
      localStorage.setItem('asn-kpis', JSON.stringify(sikaKPIs))
    }
  } else {
    // No existing KPIs, set SIKA KPIs
    localStorage.setItem('asn-kpis', JSON.stringify(sikaKPIs))
  }
}

