// Modern Industry-Standard SLA Framework
// Based on latest 3PL, logistics, and supply chain best practices
// Aligned with ISO 9001, ISO 14001, and industry-leading standards

import { CustomerSLA, KPI } from '@/types/asn'

/**
 * MODERN SLA FRAMEWORK
 * 
 * This document defines a comprehensive, industry-leading Service Level Agreement framework
 * that incorporates:
 * - Real-time visibility and tracking
 * - Predictive analytics and AI-driven insights
 * - Digital transformation and automation
 * - Sustainability and ESG compliance
 * - Risk management and business continuity
 * - Customer-centric service excellence
 */

// ============================================================================
// SECTION 1: SERVICE CATEGORIES & DEFINITIONS
// ============================================================================

export type ServiceCategory = 
  | 'DIGITAL_FULFILLMENT'      // E-commerce and digital order processing
  | 'INBOUND_LOGISTICS'        // Receiving, validation, and intake
  | 'WAREHOUSE_OPERATIONS'     // Storage, inventory management, value-added services
  | 'OUTBOUND_FULFILLMENT'     // Order processing, picking, packing, shipping
  | 'REVERSE_LOGISTICS'        // Returns, exchanges, refurbishment
  | 'VALUE_ADDED_SERVICES'     // Kitting, labeling, customization
  | 'CUSTOMS_CLEARANCE'        // Customs documentation, clearance, and compliance
  | 'TRANSPORTATION'           // Local FCL, LCL, and freight services
  | 'FREIGHT_FORWARDING'       // International freight forwarding and logistics
  | 'DATA_ANALYTICS'           // Reporting, insights, predictive analytics
  | 'SUSTAINABILITY'           // ESG compliance, carbon footprint reduction

export type PerformanceTier = 
  | 'PLATINUM'    // 99.5%+ compliance - Premium service tier
  | 'GOLD'        // 98%+ compliance - Standard service tier
  | 'SILVER'      // 95%+ compliance - Basic service tier
  | 'BRONZE'      // 90%+ compliance - Economy service tier

export type EscalationLevel = 
  | 'INFORMATIONAL'    // Status update, no action required
  | 'WARNING'          // Performance below target, monitoring required
  | 'CRITICAL'         // Immediate action required, escalation to management
  | 'BREACH'           // SLA violation, formal remediation process

// ============================================================================
// SECTION 2: MODERN SLA METRICS & KPIs
// ============================================================================

/**
 * INBOUND LOGISTICS EXCELLENCE
 * 
 * Focus: Speed, accuracy, and visibility of inbound operations
 */
export const inboundLogisticsSLAs: CustomerSLA[] = [
  {
    id: 'sla-modern-advance-shipping-notice',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Advanced Shipping Notice (ASN) Receipt Window',
    description: 'ASN must be received and validated through digital channels (EDI, API, or email) at least 24 hours prior to physical arrival for standard shipments, or 48 hours for international/consolidated shipments. Real-time ASN validation ensures accurate receiving planning and resource allocation.',
    targetDuration: 24 * 60 * 60, // 24 hours in seconds
    warningThreshold: 85, // 85% of target (20.4 hours)
    criticalThreshold: 95, // 95% of target (22.8 hours)
    metric: 'delivery_time',
    responsibility: 'CUSTOMER', // Customer must send ASN on time
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-asn-1',
        field: 'documentType',
        operator: 'equals',
        value: 'ASN',
      },
    ],
  },
  {
    id: 'sla-modern-dock-to-stock',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Dock-to-Stock Cycle Time',
    description: 'Complete physical receiving, quality inspection, and inventory putaway within 4 business hours of vehicle arrival. This includes: vehicle check-in, unloading, receiving validation, quality control sampling (if required), and final putaway to designated storage locations. Real-time tracking through WMS integration.',
    targetDuration: 4 * 60 * 60, // 4 hours in seconds
    warningThreshold: 80, // 80% of target (3.2 hours)
    criticalThreshold: 100, // 100% of target (4 hours)
    metric: 'total',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-dock-1',
        field: 'processType',
        operator: 'equals',
        value: 'INBOUND',
      },
    ],
  },
  {
    id: 'sla-modern-inventory-accuracy',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Inventory Record Accuracy',
    description: 'Maintain 99.5%+ inventory record accuracy through cycle counting, real-time WMS updates, and automated reconciliation. Measured monthly through systematic cycle counts and annual comprehensive physical inventory. Discrepancies resolved within 24 hours with root cause analysis.',
    targetDuration: 99.5, // Percentage
    warningThreshold: 99.0, // 99.0% warning threshold
    criticalThreshold: 98.5, // 98.5% critical threshold
    metric: 'custom',
    customFormula: '(receivedQuantity / totalQuantity) * 100',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [],
  },
]

/**
 * OUTBOUND FULFILLMENT EXCELLENCE
 * 
 * Focus: Order accuracy, speed, and customer experience
 */
export const outboundFulfillmentSLAs: CustomerSLA[] = [
  {
    id: 'sla-modern-order-to-ship',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Order-to-Ship Cycle Time',
    description: 'Complete order processing from order receipt to shipment dispatch within SLA-defined timeframes. Same-day orders (received before 12:00 PM) ship same day. Next-day orders ship within 24 hours. Includes: order validation, allocation, picking, packing, quality check, and carrier handoff. Real-time order status tracking available via API/dashboard.',
    targetDuration: 24 * 60 * 60, // 24 hours in seconds
    warningThreshold: 90, // 90% of target (21.6 hours)
    criticalThreshold: 100, // 100% of target (24 hours)
    metric: 'total',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-order-1',
        field: 'processType',
        operator: 'equals',
        value: 'OUTBOUND',
      },
    ],
  },
  {
    id: 'sla-modern-pick-accuracy',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Pick Accuracy Rate',
    description: 'Achieve 99.8%+ pick accuracy through barcode scanning, voice picking, or RFID validation. Measured through order accuracy audits, customer feedback, and returns analysis. Zero tolerance for critical errors (wrong product, wrong quantity, wrong customer).',
    targetDuration: 99.8, // Percentage
    warningThreshold: 99.5, // 99.5% warning threshold
    criticalThreshold: 99.0, // 99.0% critical threshold
    metric: 'custom',
    customFormula: '(correctPicks / totalPicks) * 100',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [],
  },
  {
    id: 'sla-modern-shipment-notification',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Automated Shipment Notification',
    description: 'Automated shipment notifications (ASN) sent to customer and end recipients within 15 minutes of carrier pickup. Includes: tracking number, carrier information, estimated delivery date, and digital proof of delivery when available. Delivered via API, email, or SMS based on customer preference.',
    targetDuration: 15 * 60, // 15 minutes in seconds
    warningThreshold: 80, // 80% of target (12 minutes)
    criticalThreshold: 100, // 100% of target (15 minutes)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [],
  },
]

/**
 * VALUE-ADDED SERVICES
 * 
 * Focus: Customization, kitting, and specialized services
 */
export const valueAddedServicesSLAs: CustomerSLA[] = [
  {
    id: 'sla-modern-kitting-assembly',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Kitting and Assembly Turnaround',
    description: 'Complete kitting, assembly, or value-added services within 48 business hours of order receipt. Includes: product bundling, custom packaging, labeling, gift wrapping, or product customization. Quality inspection included in process.',
    targetDuration: 48 * 60 * 60, // 48 hours in seconds
    warningThreshold: 85, // 85% of target (40.8 hours)
    criticalThreshold: 100, // 100% of target (48 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-kit-1',
        field: 'category',
        operator: 'equals',
        value: 'kitting',
      },
    ],
  },
  {
    id: 'sla-modern-relabeling-repackaging',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Relabeling and Repackaging Service',
    description: 'Complete relabeling, repackaging, or repackaging within 24-48 business hours of receipt, depending on complexity and volume. Includes: label removal, new label application, package redesign, and quality validation. Real-time status updates available.',
    targetDuration: 48 * 60 * 60, // 48 hours in seconds
    warningThreshold: 85, // 85% of target (40.8 hours)
    criticalThreshold: 100, // 100% of target (48 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
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
]

/**
 * REVERSE LOGISTICS
 * 
 * Focus: Returns processing, refurbishment, and disposition
 */
export const reverseLogisticsSLAs: CustomerSLA[] = [
  {
    id: 'sla-modern-return-processing',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Return Receipt and Processing',
    description: 'Process returned goods within 4 business hours of receipt. Includes: physical inspection, condition assessment, RMA validation, inventory update, and disposition decision (restock, refurbish, dispose, or return to vendor). Digital return receipt (RRR) issued immediately upon receipt.',
    targetDuration: 4 * 60 * 60, // 4 hours in seconds
    warningThreshold: 80, // 80% of target (3.2 hours)
    criticalThreshold: 100, // 100% of target (4 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-return-1',
        field: 'category',
        operator: 'equals',
        value: 'return',
      },
    ],
  },
]

/**
 * DATA & ANALYTICS
 * 
 * Focus: Real-time visibility, reporting, and insights
 */
export const dataAnalyticsSLAs: CustomerSLA[] = [
  {
    id: 'sla-modern-daily-reporting',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Daily Operations Report Delivery',
    description: 'Comprehensive daily operations report delivered via email/API by 7:00 AM each business day. Includes: previous day shipment summary, inventory movements, exception reports, performance metrics, and actionable insights. Real-time dashboard available 24/7 with live data feeds.',
    targetDuration: 7 * 60 * 60, // 7 hours (7:00 AM) in seconds from midnight
    warningThreshold: 90, // 90% of target (6.3 hours = 6:18 AM)
    criticalThreshold: 100, // 100% of target (7:00 AM)
    metric: 'custom',
    customFormula: 'reportDeliveryTime',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [],
  },
  {
    id: 'sla-modern-api-availability',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'API and System Availability',
    description: 'Maintain 99.9% uptime for API endpoints, WMS integration, and customer portal. Real-time order tracking, inventory visibility, and data synchronization available 24/7. Scheduled maintenance communicated 48 hours in advance. Emergency support available 24/7.',
    targetDuration: 99.9, // Percentage
    warningThreshold: 99.5, // 99.5% warning threshold
    criticalThreshold: 99.0, // 99.0% critical threshold
    metric: 'custom',
    customFormula: '(uptimeHours / totalHours) * 100',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [],
  },
]

/**
 * CUSTOMS CLEARANCE
 * 
 * Focus: Customs documentation, clearance processing, and regulatory compliance
 */
export const customsClearanceSLAs: CustomerSLA[] = [
  {
    id: 'sla-modern-customs-documentation',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Customs Documentation Preparation',
    description: 'Complete customs documentation (commercial invoice, packing list, certificate of origin, etc.) within 24 hours of shipment receipt. Includes: HS code classification, customs value declaration, origin certification, and all required regulatory documents. Digital submission via customs portal or EDI integration.',
    targetDuration: 24 * 60 * 60, // 24 hours in seconds
    warningThreshold: 85, // 85% of target (20.4 hours)
    criticalThreshold: 100, // 100% of target (24 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-customs-1',
        field: 'category',
        operator: 'equals',
        value: 'customs',
      },
    ],
  },
  {
    id: 'sla-modern-customs-clearance',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Customs Clearance Processing',
    description: 'Complete customs clearance within 48-72 business hours of document submission (depending on customs authority and shipment complexity). Includes: customs declaration filing, duty/tax calculation, payment processing, and release notification. Real-time status tracking available via customs portal integration.',
    targetDuration: 72 * 60 * 60, // 72 hours in seconds
    warningThreshold: 90, // 90% of target (64.8 hours)
    criticalThreshold: 100, // 100% of target (72 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-clearance-1',
        field: 'category',
        operator: 'equals',
        value: 'clearance',
      },
    ],
  },
  {
    id: 'sla-modern-customs-compliance',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Customs Compliance Rate',
    description: 'Maintain 99.5%+ customs compliance rate with zero critical violations. Includes: accurate HS code classification, proper valuation, correct origin declaration, and adherence to all import/export regulations. Compliance audits conducted monthly with corrective action plans for any discrepancies.',
    targetDuration: 99.5, // Percentage
    warningThreshold: 99.0, // 99.0% warning threshold
    criticalThreshold: 98.5, // 98.5% critical threshold
    metric: 'custom',
    customFormula: '(compliantShipments / totalShipments) * 100',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [],
  },
  {
    id: 'sla-modern-customs-duty-payment',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Customs Duty & Tax Payment Processing',
    description: 'Process customs duty and tax payments within 24 hours of customs assessment. Includes: duty/tax calculation verification, payment authorization, payment execution, and receipt confirmation. Automated payment processing via customs portal or bank integration. Real-time payment status tracking available.',
    targetDuration: 24 * 60 * 60, // 24 hours in seconds
    warningThreshold: 90, // 90% of target (21.6 hours)
    criticalThreshold: 100, // 100% of target (24 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [],
  },
  {
    id: 'sla-modern-customs-release',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Customs Release Notification',
    description: 'Notify customer of customs release within 2 hours of receiving release confirmation from customs authority. Includes: release notification via email/SMS/API, release certificate, and next steps for cargo pickup or delivery. Automated notifications integrated with customs portal for instant updates.',
    targetDuration: 2 * 60 * 60, // 2 hours in seconds
    warningThreshold: 85, // 85% of target (1.7 hours)
    criticalThreshold: 100, // 100% of target (2 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [],
  },
]

/**
 * TRANSPORTATION (FCL & LCL)
 * 
 * Focus: Local transportation, container management, and freight services
 */
export const transportationSLAs: CustomerSLA[] = [
  {
    id: 'sla-modern-fcl-transportation',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'FCL (Full Container Load) Transportation',
    description: 'Complete FCL transportation from origin to destination within SLA-defined transit times. Includes: container booking, pickup coordination, transit tracking, and delivery confirmation. Standard transit: 2-5 business days for local, 7-14 days for regional. Real-time GPS tracking available for all shipments.',
    targetDuration: 5 * 24 * 60 * 60, // 5 days in seconds (local)
    warningThreshold: 90, // 90% of target (4.5 days)
    criticalThreshold: 100, // 100% of target (5 days)
    metric: 'delivery_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-fcl-1',
        field: 'containerType',
        operator: 'equals',
        value: 'FCL',
      },
    ],
  },
  {
    id: 'sla-modern-lcl-transportation',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'LCL (Less than Container Load) Transportation',
    description: 'Complete LCL consolidation and transportation within SLA-defined transit times. Includes: cargo consolidation, container stuffing, transit tracking, and deconsolidation at destination. Standard transit: 3-7 business days for local, 10-21 days for regional. Cargo tracking by shipment reference number.',
    targetDuration: 7 * 24 * 60 * 60, // 7 days in seconds (local)
    warningThreshold: 90, // 90% of target (6.3 days)
    criticalThreshold: 100, // 100% of target (7 days)
    metric: 'delivery_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-lcl-1',
        field: 'containerType',
        operator: 'equals',
        value: 'LCL',
      },
    ],
  },
  {
    id: 'sla-modern-container-management',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Container Management & Tracking',
    description: 'Maintain 100% container visibility and tracking throughout the transportation lifecycle. Includes: container booking confirmation, pickup notification, transit updates (minimum 3 updates per day), and delivery confirmation. Digital container tracking via API, SMS, or email notifications.',
    targetDuration: 100, // Percentage
    warningThreshold: 95, // 95% warning threshold
    criticalThreshold: 90, // 90% critical threshold
    metric: 'custom',
    customFormula: '(trackedContainers / totalContainers) * 100',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [],
  },
  {
    id: 'sla-modern-transportation-on-time',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Transportation On-Time Delivery Rate',
    description: 'Achieve 98%+ on-time delivery rate for all FCL and LCL shipments. On-time defined as delivery within SLA-defined transit window. Includes: proactive delay notifications (minimum 24 hours advance notice), alternative routing when necessary, and delivery confirmation with proof of delivery (POD).',
    targetDuration: 98, // Percentage
    warningThreshold: 95, // 95% warning threshold
    criticalThreshold: 92, // 92% critical threshold
    metric: 'custom',
    customFormula: '(onTimeDeliveries / totalDeliveries) * 100',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [],
  },
  {
    id: 'sla-modern-container-pickup',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Container Pickup & Delivery Window',
    description: 'Complete container pickup within 4 hours of customer request or scheduled pickup time. Includes: driver dispatch, container pickup confirmation, and transit initiation. Delivery window: within 2-hour window of scheduled delivery time. Real-time driver tracking and ETA updates provided to customer.',
    targetDuration: 4 * 60 * 60, // 4 hours in seconds
    warningThreshold: 90, // 90% of target (3.6 hours)
    criticalThreshold: 100, // 100% of target (4 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [],
  },
  {
    id: 'sla-modern-lcl-consolidation',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'LCL Consolidation & Deconsolidation',
    description: 'Complete LCL cargo consolidation within 48 hours of cargo receipt at origin warehouse. Includes: cargo sorting, container stuffing optimization, and consolidation documentation. Deconsolidation at destination within 24 hours of container arrival. Cargo separation and individual shipment identification with tracking.',
    targetDuration: 48 * 60 * 60, // 48 hours in seconds
    warningThreshold: 90, // 90% of target (43.2 hours)
    criticalThreshold: 100, // 100% of target (48 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-lcl-consolidation-1',
        field: 'containerType',
        operator: 'equals',
        value: 'LCL',
      },
    ],
  },
]

/**
 * FREIGHT FORWARDING
 * 
 * Focus: International freight forwarding, multi-modal transportation, and end-to-end logistics
 */
export const freightForwardingSLAs: CustomerSLA[] = [
  {
    id: 'sla-modern-freight-quotation',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Freight Quotation Response Time',
    description: 'Provide comprehensive freight quotations within 4 business hours of request. Includes: ocean freight, air freight, road freight, customs clearance, documentation, and all applicable charges. Quotations valid for 30 days with detailed breakdown of costs and transit times.',
    targetDuration: 4 * 60 * 60, // 4 hours in seconds
    warningThreshold: 85, // 85% of target (3.4 hours)
    criticalThreshold: 100, // 100% of target (4 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-quote-1',
        field: 'category',
        operator: 'equals',
        value: 'quotation',
      },
    ],
  },
  {
    id: 'sla-modern-ocean-freight',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Ocean Freight Booking & Transit',
    description: 'Complete ocean freight booking within 48 hours of order confirmation. Includes: vessel booking, space allocation, documentation preparation, and booking confirmation. Transit times: 14-21 days for regional routes, 21-35 days for intercontinental routes. Real-time vessel tracking and ETA updates provided.',
    targetDuration: 48 * 60 * 60, // 48 hours in seconds
    warningThreshold: 90, // 90% of target (43.2 hours)
    criticalThreshold: 100, // 100% of target (48 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-ocean-1',
        field: 'freightMode',
        operator: 'equals',
        value: 'ocean',
      },
    ],
  },
  {
    id: 'sla-modern-air-freight',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Air Freight Booking & Transit',
    description: 'Complete air freight booking within 24 hours of order confirmation. Includes: flight booking, space allocation, documentation preparation, and booking confirmation. Transit times: 1-3 days for regional routes, 3-7 days for intercontinental routes. Real-time flight tracking and ETA updates provided.',
    targetDuration: 24 * 60 * 60, // 24 hours in seconds
    warningThreshold: 90, // 90% of target (21.6 hours)
    criticalThreshold: 100, // 100% of target (24 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-air-1',
        field: 'freightMode',
        operator: 'equals',
        value: 'air',
      },
    ],
  },
  {
    id: 'sla-modern-multimodal-transportation',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Multi-Modal Transportation Coordination',
    description: 'Seamlessly coordinate multi-modal transportation (ocean-air, road-ocean, rail-road, etc.) with end-to-end visibility and single point of contact. Includes: mode transition tracking, documentation handoff, and unified ETA management. Real-time status updates at each transition point with consolidated tracking dashboard.',
    targetDuration: 100, // Percentage visibility
    warningThreshold: 95, // 95% warning threshold
    criticalThreshold: 90, // 90% critical threshold
    metric: 'custom',
    customFormula: '(successfulTransitions / totalTransitions) * 100',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-multimodal-1',
        field: 'transportationMode',
        operator: 'contains',
        value: 'multimodal',
      },
    ],
  },
  {
    id: 'sla-modern-freight-documentation',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Freight Documentation & Bill of Lading',
    description: 'Issue Bill of Lading (B/L) and all required freight documentation within 24 hours of cargo receipt or booking confirmation. Includes: Master B/L, House B/L, shipping instructions, packing list, and commercial invoice. Digital B/L available via blockchain or secure portal for instant verification.',
    targetDuration: 24 * 60 * 60, // 24 hours in seconds
    warningThreshold: 90, // 90% of target (21.6 hours)
    criticalThreshold: 100, // 100% of target (24 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [],
  },
]

/**
 * QUALITY & COMPLIANCE
 * 
 * Focus: Quality assurance, regulatory compliance, and risk management
 */
export const qualityComplianceSLAs: CustomerSLA[] = [
  {
    id: 'sla-modern-damage-reporting',
    customerNumber: 'STANDARD',
    customerName: 'Standard Customer',
    name: 'Damage and Exception Reporting',
    description: 'Report damaged goods, shortages, or quality exceptions within 2 business hours of discovery. Includes: photographic documentation, root cause analysis, corrective action plan, and customer notification. Critical issues escalated immediately with 24/7 support hotline.',
    targetDuration: 2 * 60 * 60, // 2 hours in seconds
    warningThreshold: 85, // 85% of target (1.7 hours)
    criticalThreshold: 100, // 100% of target (2 hours)
    metric: 'processing_time',
    responsibility: 'WAREHOUSE', // Warehouse responsibility
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
    conditions: [
      {
        id: 'cond-damage-1',
        field: 'category',
        operator: 'equals',
        value: 'damage',
      },
    ],
  },
]

// ============================================================================
// SECTION 3: MODERN KPI FRAMEWORK
// ============================================================================

/**
 * COMPREHENSIVE KPI SET
 * 
 * Modern KPIs aligned with industry best practices and digital transformation
 */
export const modernKPIs: KPI[] = [
  // OPERATIONAL EXCELLENCE
  {
    id: 'kpi-modern-order-fulfillment-rate',
    name: 'Order Fulfillment Rate',
    description: 'Percentage of orders shipped complete and on-time within SLA-defined windows. Target: ≥98% for standard orders, ≥99% for priority orders.',
    formula: '(ordersShippedOnTime / totalOrders) * 100',
    target: 98,
    unit: '%',
    category: 'performance',
    responsibility: 'WAREHOUSE',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kpi-modern-inventory-turnover',
    name: 'Inventory Turnover Ratio',
    description: 'Measure of inventory efficiency - how quickly inventory is sold and replaced. Higher ratio indicates better inventory management and reduced carrying costs.',
    formula: 'costOfGoodsSold / averageInventory',
    target: 12,
    unit: 'times/year',
    category: 'efficiency',
    responsibility: 'WAREHOUSE',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kpi-modern-perfect-order-rate',
    name: 'Perfect Order Rate',
    description: 'Percentage of orders delivered complete, on-time, damage-free, with accurate documentation. Industry-leading target: ≥99.5%.',
    formula: '(perfectOrders / totalOrders) * 100',
    target: 99.5,
    unit: '%',
    category: 'quality',
    responsibility: 'WAREHOUSE',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // CUSTOMER EXPERIENCE
  {
    id: 'kpi-modern-customer-satisfaction',
    name: 'Customer Satisfaction Score (CSAT)',
    description: 'Customer satisfaction measured through surveys, feedback, and Net Promoter Score (NPS). Target: ≥4.5/5.0 or NPS ≥50.',
    formula: 'AVG(customerSatisfactionRating)',
    target: 4.5,
    unit: 'score',
    category: 'quality',
    responsibility: 'WAREHOUSE',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // COST EFFICIENCY
  {
    id: 'kpi-modern-cost-per-order',
    name: 'Cost per Order Fulfilled',
    description: 'Total fulfillment cost divided by number of orders. Includes: labor, materials, overhead, and value-added services. Target: Continuous improvement with 5% YoY reduction.',
    formula: 'totalFulfillmentCost / totalOrders',
    target: 0, // Will be set based on baseline
    unit: 'currency',
    category: 'efficiency',
    responsibility: 'WAREHOUSE',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // SUSTAINABILITY
  {
    id: 'kpi-modern-carbon-footprint',
    name: 'Carbon Footprint per Order',
    description: 'Total carbon emissions (CO2 equivalent) per order fulfilled. Includes: transportation, warehouse operations, and packaging. Target: 15% reduction YoY aligned with ESG goals.',
    formula: 'totalCarbonEmissions / totalOrders',
    target: 0, // Will be set based on baseline
    unit: 'kg CO2e',
    category: 'compliance',
    responsibility: 'WAREHOUSE',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// ============================================================================
// SECTION 4: SLA PERFORMANCE TIERS
// ============================================================================

export interface SLAPerformanceTier {
  tier: PerformanceTier
  complianceTarget: number // Percentage
  serviceFeatures: string[]
  pricingMultiplier: number
  priorityLevel: number
}

export const performanceTiers: SLAPerformanceTier[] = [
  {
    tier: 'PLATINUM',
    complianceTarget: 99.5,
    serviceFeatures: [
      'Dedicated account manager',
      'Priority processing',
      '24/7 support hotline',
      'Custom reporting and analytics',
      'Expedited receiving and shipping',
      'White-glove service',
    ],
    pricingMultiplier: 1.5,
    priorityLevel: 1,
  },
  {
    tier: 'GOLD',
    complianceTarget: 98.0,
    serviceFeatures: [
      'Assigned account manager',
      'Standard priority processing',
      'Business hours support',
      'Standard reporting',
      'Standard receiving and shipping',
    ],
    pricingMultiplier: 1.2,
    priorityLevel: 2,
  },
  {
    tier: 'SILVER',
    complianceTarget: 95.0,
    serviceFeatures: [
      'Shared account management',
      'Standard processing',
      'Business hours support',
      'Basic reporting',
    ],
    pricingMultiplier: 1.0,
    priorityLevel: 3,
  },
  {
    tier: 'BRONZE',
    complianceTarget: 90.0,
    serviceFeatures: [
      'General support',
      'Standard processing',
      'Email support',
      'Basic reporting',
    ],
    pricingMultiplier: 0.9,
    priorityLevel: 4,
  },
]

// ============================================================================
// SECTION 5: ESCALATION & REMEDIATION
// ============================================================================

export interface EscalationProcedure {
  level: EscalationLevel
  threshold: number // Percentage of SLA target
  actions: string[]
  timeframe: string
  stakeholders: string[]
}

export const escalationProcedures: EscalationProcedure[] = [
  {
    level: 'INFORMATIONAL',
    threshold: 100,
    actions: [
      'Automated status notification',
      'Performance dashboard update',
    ],
    timeframe: 'Real-time',
    stakeholders: ['Operations Team', 'Customer Portal'],
  },
  {
    level: 'WARNING',
    threshold: 85,
    actions: [
      'Immediate notification to operations manager',
      'Root cause analysis initiated',
      'Corrective action plan developed',
      'Customer notification (if applicable)',
    ],
    timeframe: 'Within 2 hours',
    stakeholders: ['Operations Manager', 'Account Manager', 'Customer'],
  },
  {
    level: 'CRITICAL',
    threshold: 75,
    actions: [
      'Escalation to senior management',
      'Emergency response team activated',
      'Immediate corrective actions implemented',
      'Customer notification with remediation plan',
      'Daily status updates until resolved',
    ],
    timeframe: 'Within 1 hour',
    stakeholders: ['Senior Management', 'Operations Director', 'Account Manager', 'Customer'],
  },
  {
    level: 'BREACH',
    threshold: 0,
    actions: [
      'Formal SLA breach notification',
      'Executive escalation',
      'Comprehensive root cause analysis',
      'Remediation plan with timeline',
      'Performance improvement plan',
      'Potential service credit or compensation',
    ],
    timeframe: 'Immediate',
    stakeholders: ['Executive Team', 'Legal/Compliance', 'Account Director', 'Customer Executive'],
  },
]

// ============================================================================
// SECTION 6: MODERN SLA DOCUMENTATION STRUCTURE
// ============================================================================

export interface ModernSLADocument {
  version: string
  effectiveDate: string
  reviewDate: string
  customerInfo: {
    customerNumber: string
    customerName: string
    accountTier: PerformanceTier
  }
  serviceCategories: ServiceCategory[]
  slas: CustomerSLA[]
  kpis: KPI[]
  performanceTiers: SLAPerformanceTier[]
  escalationProcedures: EscalationProcedure[]
  termsAndConditions: {
    measurementPeriod: string // e.g., "Monthly", "Quarterly"
    reportingFrequency: string
    reviewFrequency: string
    amendmentProcess: string
  }
}

/**
 * Generate a comprehensive modern SLA document
 */
export function generateModernSLADocument(
  customerNumber: string,
  customerName: string,
  accountTier: PerformanceTier = 'GOLD'
): ModernSLADocument {
  return {
    version: '2.0',
    effectiveDate: new Date().toISOString(),
    reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    customerInfo: {
      customerNumber,
      customerName,
      accountTier,
    },
    serviceCategories: [
      'DIGITAL_FULFILLMENT',
      'INBOUND_LOGISTICS',
      'WAREHOUSE_OPERATIONS',
      'OUTBOUND_FULFILLMENT',
      'REVERSE_LOGISTICS',
      'VALUE_ADDED_SERVICES',
      'CUSTOMS_CLEARANCE',
      'TRANSPORTATION',
      'FREIGHT_FORWARDING',
      'DATA_ANALYTICS',
    ],
    slas: [
      ...inboundLogisticsSLAs,
      ...outboundFulfillmentSLAs,
      ...valueAddedServicesSLAs,
      ...reverseLogisticsSLAs,
      ...customsClearanceSLAs,
      ...transportationSLAs,
      ...freightForwardingSLAs,
      ...dataAnalyticsSLAs,
      ...qualityComplianceSLAs,
    ],
    kpis: modernKPIs,
    performanceTiers,
    escalationProcedures,
    termsAndConditions: {
      measurementPeriod: 'Monthly',
      reportingFrequency: 'Daily operational reports, Monthly performance reviews',
      reviewFrequency: 'Quarterly business reviews, Annual SLA review',
      amendmentProcess: 'Formal amendment process with 30-day notice and mutual agreement',
    },
  }
}

// ============================================================================
// EXPORT ALL MODERN SLAs
// ============================================================================

export const allModernSLAs: CustomerSLA[] = [
  ...inboundLogisticsSLAs,
  ...outboundFulfillmentSLAs,
  ...valueAddedServicesSLAs,
  ...reverseLogisticsSLAs,
  ...customsClearanceSLAs,
  ...transportationSLAs,
  ...freightForwardingSLAs,
  ...dataAnalyticsSLAs,
  ...qualityComplianceSLAs,
]

