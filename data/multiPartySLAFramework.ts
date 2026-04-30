/**
 * Multi-Party Supply Chain SLA Framework
 * 
 * Comprehensive SLA templates for all parties in the supply chain
 * Based on industry best practices and SCOR model
 */

import { SupplyChainSLA, SupplyChainSLATemplate, SupplyChainPartyType, SupplyChainServiceCategory } from '@/types/supplyChainSLA'

// ============================================================================
// SLA TEMPLATES BY PARTY TYPE
// ============================================================================

export const slaTemplatesByParty: Record<SupplyChainPartyType, SupplyChainSLATemplate[]> = {
  CUSTOMER: [
    {
      id: 'template-customer-order-fulfillment',
      name: 'Order Fulfillment SLA',
      description: 'Complete order fulfillment within agreed timeframe',
      partyType: 'CUSTOMER',
      serviceCategory: 'OUTBOUND_FULFILLMENT',
      serviceType: 'Order-to-Ship',
      defaultTargetDuration: 24 * 60 * 60, // 24 hours
      defaultWarningThreshold: 90,
      defaultCriticalThreshold: 100,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'template-customer-inventory-accuracy',
      name: 'Inventory Accuracy SLA',
      description: 'Maintain inventory record accuracy',
      partyType: 'CUSTOMER',
      serviceCategory: 'WAREHOUSE_OPERATIONS',
      serviceType: 'Inventory Accuracy',
      defaultTargetDuration: 99.5, // Percentage
      defaultWarningThreshold: 99.0,
      defaultCriticalThreshold: 98.5,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  
  WAREHOUSE: [
    {
      id: 'template-warehouse-dock-to-stock',
      name: 'Dock-to-Stock Cycle Time',
      description: 'Complete receiving and putaway within target time',
      partyType: 'WAREHOUSE',
      serviceCategory: 'INBOUND_LOGISTICS',
      serviceType: 'Dock-to-Stock',
      defaultTargetDuration: 4 * 60 * 60, // 4 hours
      defaultWarningThreshold: 80,
      defaultCriticalThreshold: 100,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'template-warehouse-pick-accuracy',
      name: 'Pick Accuracy Rate',
      description: 'Maintain high pick accuracy',
      partyType: 'WAREHOUSE',
      serviceCategory: 'OUTBOUND_FULFILLMENT',
      serviceType: 'Pick Accuracy',
      defaultTargetDuration: 99.8, // Percentage
      defaultWarningThreshold: 99.5,
      defaultCriticalThreshold: 99.0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  
  CARRIER: [
    {
      id: 'template-carrier-on-time-delivery',
      name: 'On-Time Delivery',
      description: 'Deliver shipments within agreed delivery window',
      partyType: 'CARRIER',
      serviceCategory: 'TRANSPORTATION',
      serviceType: 'On-Time Delivery',
      defaultTargetDuration: 98.0, // Percentage
      defaultWarningThreshold: 95.0,
      defaultCriticalThreshold: 90.0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'template-carrier-pickup-window',
      name: 'Pickup Window Compliance',
      description: 'Pick up shipments within agreed window',
      partyType: 'CARRIER',
      serviceCategory: 'TRANSPORTATION',
      serviceType: 'Pickup Window',
      defaultTargetDuration: 2 * 60 * 60, // 2 hours window
      defaultWarningThreshold: 85,
      defaultCriticalThreshold: 100,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'template-carrier-damage-free',
      name: 'Damage-Free Delivery',
      description: 'Deliver shipments without damage',
      partyType: 'CARRIER',
      serviceCategory: 'TRANSPORTATION',
      serviceType: 'Damage-Free',
      defaultTargetDuration: 99.5, // Percentage
      defaultWarningThreshold: 99.0,
      defaultCriticalThreshold: 98.0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  
  VENDOR: [
    {
      id: 'template-vendor-on-time-delivery',
      name: 'On-Time Delivery',
      description: 'Deliver goods to warehouse on time',
      partyType: 'VENDOR',
      serviceCategory: 'INBOUND_LOGISTICS',
      serviceType: 'On-Time Delivery',
      defaultTargetDuration: 95.0, // Percentage
      defaultWarningThreshold: 90.0,
      defaultCriticalThreshold: 85.0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'template-vendor-asn-advance-notice',
      name: 'ASN Advance Notice',
      description: 'Send ASN before shipment arrival',
      partyType: 'VENDOR',
      serviceCategory: 'INBOUND_LOGISTICS',
      serviceType: 'ASN Notice',
      defaultTargetDuration: 24 * 60 * 60, // 24 hours advance
      defaultWarningThreshold: 85,
      defaultCriticalThreshold: 100,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'template-vendor-quality-compliance',
      name: 'Quality Compliance',
      description: 'Deliver goods meeting quality standards',
      partyType: 'VENDOR',
      serviceCategory: 'QUALITY_ASSURANCE',
      serviceType: 'Quality Compliance',
      defaultTargetDuration: 98.0, // Percentage
      defaultWarningThreshold: 95.0,
      defaultCriticalThreshold: 90.0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  
  CUSTOMS_BROKER: [
    {
      id: 'template-customs-clearance-time',
      name: 'Customs Clearance Time',
      description: 'Complete customs clearance within target time',
      partyType: 'CUSTOMS_BROKER',
      serviceCategory: 'CUSTOMS_CLEARANCE',
      serviceType: 'Clearance Time',
      defaultTargetDuration: 48 * 60 * 60, // 48 hours
      defaultWarningThreshold: 90,
      defaultCriticalThreshold: 100,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'template-customs-documentation-accuracy',
      name: 'Documentation Accuracy',
      description: 'Submit accurate customs documentation',
      partyType: 'CUSTOMS_BROKER',
      serviceCategory: 'CUSTOMS_CLEARANCE',
      serviceType: 'Documentation Accuracy',
      defaultTargetDuration: 99.0, // Percentage
      defaultWarningThreshold: 98.0,
      defaultCriticalThreshold: 95.0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  
  FREIGHT_FORWARDER: [
    {
      id: 'template-freight-forwarder-booking-time',
      name: 'Booking Confirmation Time',
      description: 'Confirm freight booking within target time',
      partyType: 'FREIGHT_FORWARDER',
      serviceCategory: 'FREIGHT_FORWARDING',
      serviceType: 'Booking Confirmation',
      defaultTargetDuration: 4 * 60 * 60, // 4 hours
      defaultWarningThreshold: 85,
      defaultCriticalThreshold: 100,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'template-freight-forwarder-transit-time',
      name: 'Transit Time Compliance',
      description: 'Meet agreed transit times',
      partyType: 'FREIGHT_FORWARDER',
      serviceCategory: 'FREIGHT_FORWARDING',
      serviceType: 'Transit Time',
      defaultTargetDuration: 95.0, // Percentage
      defaultWarningThreshold: 90.0,
      defaultCriticalThreshold: 85.0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  
  END_RECIPIENT: [
    {
      id: 'template-end-recipient-delivery-window',
      name: 'Delivery Window Compliance',
      description: 'Accept deliveries within agreed window',
      partyType: 'END_RECIPIENT',
      serviceCategory: 'TRANSPORTATION',
      serviceType: 'Delivery Window',
      defaultTargetDuration: 2 * 60 * 60, // 2 hours window
      defaultWarningThreshold: 85,
      defaultCriticalThreshold: 100,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  
  // Placeholder for other party types
  '3PL_PROVIDER': [],
  '4PL_PROVIDER': [],
  'BROKER': [],
  'CONSOLIDATOR': [],
  'DISTRIBUTION_CENTER': [],
  'CROSS_DOCK': [],
  'VALUE_ADDED_SERVICE': [],
  'QUALITY_LAB': [],
  'CERTIFICATION_BODY': [],
  'INSURANCE_PROVIDER': [],
  'BANK': [],
  'CUSTOM': [],
}

// ============================================================================
// INTELLIGENT SLA DETECTION ENGINE
// ============================================================================

export function detectApplicableSLAs(context: {
  transactionType: string
  partyType: SupplyChainPartyType
  partyId: string
  serviceCategory: SupplyChainServiceCategory
  attributes: Record<string, any>
}): SupplyChainSLATemplate[] {
  const templates = slaTemplatesByParty[context.partyType] || []
  
  // Filter by service category
  const filtered = templates.filter(t => t.serviceCategory === context.serviceCategory)
  
  // Apply intelligent matching based on attributes
  // For example, if priority is HIGH, suggest stricter SLAs
  if (context.attributes.priority === 'HIGH' || context.attributes.priority === 'URGENT') {
    return filtered.map(t => ({
      ...t,
      defaultTargetDuration: t.defaultTargetDuration * 0.8, // 20% stricter
      defaultWarningThreshold: Math.min(95, t.defaultWarningThreshold + 5),
    }))
  }
  
  return filtered
}

// ============================================================================
// SLA COMPLIANCE CALCULATION ENGINE
// ============================================================================

export function calculateSLACompliance(
  sla: SupplyChainSLA,
  actualDuration: number,
  startTime: Date,
  endTime?: Date
): {
  compliancePercentage: number
  status: 'MET' | 'WARNING' | 'CRITICAL' | 'BREACH'
  breachReason?: string
} {
  let compliancePercentage = 0
  
  if (sla.metric === 'percentage') {
    // For percentage-based metrics (e.g., accuracy)
    compliancePercentage = actualDuration // actualDuration is the percentage value
  } else {
    // For duration-based metrics
    const targetDuration = sla.targetDuration
    compliancePercentage = (targetDuration / actualDuration) * 100
  }
  
  let status: 'MET' | 'WARNING' | 'CRITICAL' | 'BREACH' = 'MET'
  let breachReason: string | undefined
  
  if (sla.metric === 'percentage') {
    // For percentage: higher is better
    if (compliancePercentage < sla.criticalThreshold) {
      status = 'BREACH'
      breachReason = `Actual ${compliancePercentage.toFixed(1)}% is below critical threshold ${sla.criticalThreshold}%`
    } else if (compliancePercentage < sla.warningThreshold) {
      status = 'CRITICAL'
      breachReason = `Actual ${compliancePercentage.toFixed(1)}% is below warning threshold ${sla.warningThreshold}%`
    } else if (compliancePercentage < sla.targetDuration) {
      status = 'WARNING'
    }
  } else {
    // For duration: lower is better (faster is better)
    if (compliancePercentage < sla.criticalThreshold) {
      status = 'BREACH'
      breachReason = `Actual duration ${(actualDuration / 3600).toFixed(1)}h exceeds critical threshold ${(sla.targetDuration * (sla.criticalThreshold / 100) / 3600).toFixed(1)}h`
    } else if (compliancePercentage < sla.warningThreshold) {
      status = 'CRITICAL'
      breachReason = `Actual duration ${(actualDuration / 3600).toFixed(1)}h exceeds warning threshold ${(sla.targetDuration * (sla.warningThreshold / 100) / 3600).toFixed(1)}h`
    } else if (compliancePercentage < 100) {
      status = 'WARNING'
    }
  }
  
  return {
    compliancePercentage,
    status,
    breachReason,
  }
}

// ============================================================================
// PREDICTIVE SLA BREACH RISK
// ============================================================================

export function predictBreachRisk(
  sla: SupplyChainSLA,
  currentProgress: number,
  elapsedTime: number
): {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  probability: number
  recommendedActions: string[]
} {
  const targetDuration = sla.targetDuration
  const expectedProgress = (elapsedTime / targetDuration) * 100
  const progressGap = expectedProgress - currentProgress
  
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW'
  let probability = 0
  const recommendedActions: string[] = []
  
  if (progressGap > 30) {
    riskLevel = 'CRITICAL'
    probability = 0.9
    recommendedActions.push('Immediate escalation to management')
    recommendedActions.push('Allocate additional resources')
    recommendedActions.push('Notify all stakeholders')
  } else if (progressGap > 20) {
    riskLevel = 'HIGH'
    probability = 0.7
    recommendedActions.push('Escalate to supervisor')
    recommendedActions.push('Review resource allocation')
    recommendedActions.push('Monitor closely')
  } else if (progressGap > 10) {
    riskLevel = 'MEDIUM'
    probability = 0.4
    recommendedActions.push('Increase monitoring frequency')
    recommendedActions.push('Review process bottlenecks')
  } else {
    riskLevel = 'LOW'
    probability = 0.1
    recommendedActions.push('Continue normal operations')
  }
  
  return {
    riskLevel,
    probability,
    recommendedActions,
  }
}

