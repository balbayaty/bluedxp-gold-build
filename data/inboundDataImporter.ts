// Inbound Data Importer - Processes raw inbound/outbound data
// Integrates with enhanced data cleaner and maps to ASN/GR/ORDER structures

import { RawInboundData, cleanInboundData, groupCleanedData, CleanedInboundData } from './enhancedDataCleaner'
import { ASNData, ASNStatus, ProcessStatus, DocumentType, Priority } from '@/types/asn'
import { CustomerSLA } from '@/types/asn'
import { calculateOvertime, calculateTotalOvertime } from '@/utils/overtimeCalculator'
import {
  calculateOffloadingDuration,
  calculatePutawayDuration,
  calculatePickingDuration,
  calculateQCDuration,
  calculateDispatchingDuration,
  calculateDuration1,
  calculateDuration2,
  calculateTotalProcessingTime,
  calculateDeliveryTime,
} from '@/utils/formulaCalculator'

/**
 * Convert cleaned inbound data to ASN format
 */
export function convertToASNData(cleaned: CleanedInboundData, index: number): ASNData {
  // Map status
  const status = mapStatus(cleaned.status, cleaned.documentType)
  
  // Determine if GR has been posted
  const hasGR = cleaned.documentType === 'GR' || cleaned.goodsReceiptDate !== undefined
  
  return {
    // Document Identification
    id: cleaned.id,
    documentNumber: cleaned.documentNumber,
    externalReference: cleaned.externalReference,
    purchaseOrderNumber: cleaned.documentType === 'ORDER' ? cleaned.orderNumber : `PO-${String(index + 1).padStart(10, '0')}`,
    materialDocumentNumber: cleaned.documentType === 'GR' ? cleaned.goodsReceiptNumber : undefined,
    
    // Entity Information
    entity: cleaned.entity,
    plant: 'PLANT-001',
    storageLocation: 'SL-001',
    costCenter: 'CC-001',
    
    // Vendor/Supplier Information
    vendorNumber: `VND-${String(index + 1).padStart(8, '0')}`,
    vendorName: cleaned.personnel || cleaned.entity || 'Unknown Vendor',
    
    // Customer Information
    customerNumber: cleaned.customerNumber,
    customerName: cleaned.customerName,
    
    // Shipment Information
    shipmentNumber: cleaned.documentNumber,
    carrier: cleaned.personnel || 'Unknown Carrier',
    trackingNumber: cleaned.externalReference || cleaned.id,
    expectedDeliveryDate: cleaned.expectedDate || cleaned.eventDateStart,
    actualDeliveryDate: cleaned.actualDate || (hasGR ? cleaned.goodsReceiptDate : undefined),
    plannedGoodsReceiptDate: cleaned.expectedDate,
    
    // Goods Receipt Information
    goodsReceiptDate: cleaned.goodsReceiptDate || (hasGR ? cleaned.actualDate : undefined),
    goodsReceiptNumber: cleaned.goodsReceiptNumber || (hasGR ? `GR-${cleaned.id}` : undefined),
    receivedBy: cleaned.receivedBy || (hasGR ? cleaned.personnel : undefined),
    receivedQuantity: cleaned.quantity,
    receivedWeight: cleaned.quantity ? cleaned.quantity * 10 : undefined, // Estimate
    receivedItems: cleaned.quantity,
    
    // Status and Workflow
    status,
    priority: determinePriority(cleaned),
    complianceStatus: cleaned.confirmation ? 'COMPLIANT' : 'UNDER_REVIEW',
    processStatus: mapProcessStatus(cleaned.processStatus),
    
    // Dates and Timestamps
    createdAt: cleaned.createdAt,
    createdBy: cleaned.personnel || 'SYSTEM',
    lastUpdate: cleaned.lastUpdate,
    changedBy: cleaned.personnel || 'SYSTEM',
    
    // Location Information
    destination: cleaned.locationName || cleaned.location || 'Unknown',
    locationName: cleaned.location || 'Unknown',
    
    // Material Information
    totalItems: cleaned.quantity || 0,
    totalQuantity: cleaned.quantity || 0,
    totalWeight: cleaned.quantity ? cleaned.quantity * 10 : 0,
    
    // Processing Information (will be calculated from actual start/end times in processInboundData)
    duration1: undefined, // Will be calculated from actual times
    duration2: undefined, // Will be calculated from actual times
    code: cleaned.externalReference,
    personnel: cleaned.personnel,
    assetType: cleaned.assetType as any,
    assetId: cleaned.assetId,
    action: cleaned.action,
    outcome: cleaned.outcome,
    category: cleaned.category,
    confirmation: cleaned.confirmation,
    
    // Additional ERP Fields
    transactionCode: cleaned.documentType === 'GR' ? 'GR01' : cleaned.documentType === 'ORDER' ? 'ORD01' : 'ASN01',
    workCenter: 'WC-001',
    
    // Process Type Metadata
    processType: cleaned.processType,
    documentType: cleaned.documentType as DocumentType,
    
    // Calculate durations and overtime for inbound operations
    ...(cleaned.processType === 'INBOUND' ? calculateInboundOvertime(cleaned) : {}),
    
    // Calculate durations and overtime for outbound operations
    ...(cleaned.processType === 'OUTBOUND' ? calculateOutboundOvertime(cleaned) : {}),
  }
}

/**
 * Calculate overtime for inbound operations (offloading, putaway)
 */
function calculateInboundOvertime(cleaned: CleanedInboundData): Partial<ASNData> {
  const result: Partial<ASNData> = {}
  const timePeriods: Array<{ startTime: Date | string; endTime: Date | string }> = []
  
  // Offloading overtime
  if (cleaned.offloadingStartTime && cleaned.offloadingEndTime) {
    result.offloadingStartTime = cleaned.offloadingStartTime
    result.offloadingEndTime = cleaned.offloadingEndTime
    const offloadingDuration = new Date(cleaned.offloadingEndTime).getTime() - new Date(cleaned.offloadingStartTime).getTime()
    result.offloadingDuration = Math.max(0, Math.floor(offloadingDuration / 1000))
    
    if (cleaned.offloadingForkliftDriver) {
      timePeriods.push({
        startTime: cleaned.offloadingStartTime,
        endTime: cleaned.offloadingEndTime,
      })
    }
  }
  
  // Putaway overtime
  if (cleaned.putawayStartTime && cleaned.putawayEndTime) {
    result.putawayStartTime = cleaned.putawayStartTime
    result.putawayEndTime = cleaned.putawayEndTime
    const putawayDuration = new Date(cleaned.putawayEndTime).getTime() - new Date(cleaned.putawayStartTime).getTime()
    result.putawayDuration = Math.max(0, Math.floor(putawayDuration / 1000))
    
    if (cleaned.putawayForkliftDriver) {
      timePeriods.push({
        startTime: cleaned.putawayStartTime,
        endTime: cleaned.putawayEndTime,
      })
    }
  }
  
  // Calculate employee overtime if we have time periods
  if (timePeriods.length > 0 && cleaned.offloadingForkliftDriver) {
    const overtime = calculateTotalOvertime(timePeriods)
    result.employeeStandardHours = overtime.standardHours
    result.employeeOvertimeHours = overtime.overtimeHours
    result.employeeBreakHours = overtime.breakHours
    result.employeePreShiftHours = overtime.preShiftHours
  }
  
  // Calculate equipment overtime
  const equipmentPeriods: Array<{ startTime: Date | string; endTime: Date | string }> = []
  if (cleaned.offloadingStartTime && cleaned.offloadingEndTime && cleaned.forklift1) {
    equipmentPeriods.push({
      startTime: cleaned.offloadingStartTime,
      endTime: cleaned.offloadingEndTime,
    })
  }
  if (cleaned.putawayStartTime && cleaned.putawayEndTime && cleaned.putawayForklift1) {
    equipmentPeriods.push({
      startTime: cleaned.putawayStartTime,
      endTime: cleaned.putawayEndTime,
    })
  }
  
  if (equipmentPeriods.length > 0) {
    const equipmentOvertime = calculateTotalOvertime(equipmentPeriods)
    result.equipmentStandardHours = equipmentOvertime.standardHours
    result.equipmentOvertimeHours = equipmentOvertime.overtimeHours
    result.equipmentBreakHours = equipmentOvertime.breakHours
    result.equipmentPreShiftHours = equipmentOvertime.preShiftHours
  }
  
  return result
}

/**
 * Calculate overtime for outbound operations (picking, QC, dispatching)
 */
function calculateOutboundOvertime(cleaned: CleanedInboundData): Partial<ASNData> {
  const result: Partial<ASNData> = {}
  const timePeriods: Array<{ startTime: Date | string; endTime: Date | string }> = []
  
  // Picking overtime
  if (cleaned.pickingStartTime && cleaned.pickingEndTime) {
    result.pickingStartTime = cleaned.pickingStartTime
    result.pickingEndTime = cleaned.pickingEndTime
    const pickingDuration = new Date(cleaned.pickingEndTime).getTime() - new Date(cleaned.pickingStartTime).getTime()
    result.pickingDuration = Math.max(0, Math.floor(pickingDuration / 1000))
    result.plTime = result.pickingDuration
    
    if (cleaned.assignedPerson) {
      timePeriods.push({
        startTime: cleaned.pickingStartTime,
        endTime: cleaned.pickingEndTime,
      })
    }
  }
  
  // QC overtime
  if (cleaned.qcStartTime && cleaned.qcEndTime) {
    result.qcStartTime = cleaned.qcStartTime
    result.qcEndTime = cleaned.qcEndTime
    const qcDuration = new Date(cleaned.qcEndTime).getTime() - new Date(cleaned.qcStartTime).getTime()
    result.qcDuration = Math.max(0, Math.floor(qcDuration / 1000))
    
    if (cleaned.operationOfficerName) {
      timePeriods.push({
        startTime: cleaned.qcStartTime,
        endTime: cleaned.qcEndTime,
      })
    }
  }
  
  // Dispatching overtime
  if (cleaned.dispatchingStartDate && cleaned.dispatchingEndTime) {
    result.dispatchingStartDate = cleaned.dispatchingStartDate
    result.dispatchingEndTime = cleaned.dispatchingEndTime
    const dispatchingDuration = new Date(cleaned.dispatchingEndTime).getTime() - new Date(cleaned.dispatchingStartDate).getTime()
    result.dispatchingDuration = Math.max(0, Math.floor(dispatchingDuration / 1000))
    
    if (cleaned.assignedPerson) {
      timePeriods.push({
        startTime: cleaned.dispatchingStartDate,
        endTime: cleaned.dispatchingEndTime,
      })
    }
  }
  
  // Calculate employee overtime if we have time periods
  if (timePeriods.length > 0 && cleaned.assignedPerson) {
    const overtime = calculateTotalOvertime(timePeriods)
    result.employeeStandardHours = overtime.standardHours
    result.employeeOvertimeHours = overtime.overtimeHours
    result.employeeBreakHours = overtime.breakHours
    result.employeePreShiftHours = overtime.preShiftHours
  }
  
  // Calculate equipment overtime for outbound
  const equipmentPeriods: Array<{ startTime: Date | string; endTime: Date | string }> = []
  if (cleaned.pickingStartTime && cleaned.pickingEndTime && cleaned.forklift1) {
    equipmentPeriods.push({
      startTime: cleaned.pickingStartTime,
      endTime: cleaned.pickingEndTime,
    })
  }
  
  if (equipmentPeriods.length > 0) {
    const equipmentOvertime = calculateTotalOvertime(equipmentPeriods)
    result.equipmentStandardHours = equipmentOvertime.standardHours
    result.equipmentOvertimeHours = equipmentOvertime.overtimeHours
    result.equipmentBreakHours = equipmentOvertime.breakHours
    result.equipmentPreShiftHours = equipmentOvertime.preShiftHours
  }
  
  return result
}

/**
 * Map status based on document type and raw status
 */
function mapStatus(rawStatus: string, documentType: string): ASNStatus {
  const statusLower = rawStatus.toLowerCase()
  
  if (documentType === 'GR') {
    if (statusLower.includes('completed') || statusLower.includes('posted')) {
      return 'GR_POSTED'
    }
    if (statusLower.includes('partial')) {
      return 'PARTIAL_GR'
    }
    return 'ARRIVED'
  }
  
  if (documentType === 'ORDER') {
    if (statusLower.includes('dispatched') || statusLower.includes('shipped')) {
      return 'COMPLETED'
    }
    if (statusLower.includes('in progress') || statusLower.includes('processing')) {
      return 'IN_TRANSIT'
    }
    return 'CREATED'
  }
  
  // ASN status mapping
  if (statusLower.includes('completed') || statusLower.includes('delivered')) {
    return 'GR_POSTED'
  }
  if (statusLower.includes('in progress') || statusLower.includes('processing')) {
    return 'IN_TRANSIT'
  }
  if (statusLower.includes('arrived') || statusLower.includes('received')) {
    return 'ARRIVED'
  }
  if (statusLower.includes('acknowledged')) {
    return 'ACKNOWLEDGED'
  }
  if (statusLower.includes('sent')) {
    return 'SENT'
  }
  if (statusLower.includes('cancelled')) {
    return 'CANCELLED'
  }
  if (statusLower.includes('blocked')) {
    return 'BLOCKED'
  }
  
  return 'CREATED'
}

/**
 * Map process status
 */
function mapProcessStatus(status?: string): ProcessStatus {
  if (!status) return 'PENDING'
  
  const statusLower = status.toLowerCase()
  if (statusLower.includes('completed')) return 'COMPLETED'
  if (statusLower.includes('in progress') || statusLower.includes('processing')) return 'IN_PROGRESS'
  if (statusLower.includes('error') || statusLower.includes('failed')) return 'ERROR'
  return 'PENDING'
}

/**
 * Determine priority based on data
 */
function determinePriority(cleaned: CleanedInboundData): Priority {
  // Check for urgent keywords
  const urgentKeywords = ['urgent', 'rush', 'priority', 'asap']
  const category = String(cleaned.category || '').toLowerCase()
  const action = String(cleaned.action || '').toLowerCase()
  
  if (urgentKeywords.some(keyword => category.includes(keyword) || action.includes(keyword))) {
    return 'URGENT'
  }
  
  // Check duration - if very short, might be urgent
  if (cleaned.duration1 && cleaned.duration1 < 300) { // Less than 5 minutes
    return 'HIGH'
  }
  
  return 'MEDIUM'
}

/**
 * Calculate SLA compliance for ASN data
 */
export function calculateSLACompliance(
  asn: ASNData,
  slas: CustomerSLA[]
): {
  slaComplianceStatus?: ASNData['slaComplianceStatus']
  slaId?: string
  slaTargetDuration?: number
  slaActualDuration?: number
  slaCompliancePercentage?: number
  slaBreachReason?: string
} {
  if (!asn.customerNumber) {
    return {}
  }
  
  // Find relevant SLAs for this customer
  const relevantSLAs = slas.filter(
    (sla) => sla.customerNumber === asn.customerNumber && sla.isActive
  )
  
  if (relevantSLAs.length === 0) {
    return {}
  }
  
  // Try to match SLA based on metric and conditions
  let matchedSLA: CustomerSLA | null = null
  let actualDuration: number | undefined
  
  for (const sla of relevantSLAs) {
    // Check conditions
    if (sla.conditions && sla.conditions.length > 0) {
      const matchesConditions = sla.conditions.every((condition) => {
        const fieldValue = (asn as any)[condition.field]
        const conditionValue = condition.value
        
        switch (condition.operator) {
          case 'equals':
            return String(fieldValue) === String(conditionValue)
          case 'not_equals':
            return String(fieldValue) !== String(conditionValue)
          case 'contains':
            return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase())
          case 'greater_than':
            return Number(fieldValue) > Number(conditionValue)
          case 'less_than':
            return Number(fieldValue) < Number(conditionValue)
          default:
            return true
        }
      })
      
      if (!matchesConditions) continue
    }
    
    // Calculate actual duration based on metric using actual start/end times
    if (sla.metric === 'duration1') {
      actualDuration = calculateDuration1(asn)
      if (actualDuration > 0) {
        matchedSLA = sla
        break
      }
    } else if (sla.metric === 'duration2') {
      actualDuration = calculateDuration2(asn)
      if (actualDuration > 0) {
        matchedSLA = sla
        break
      }
    } else if (sla.metric === 'total') {
      actualDuration = calculateTotalProcessingTime(asn)
      if (actualDuration > 0) {
        matchedSLA = sla
        break
      }
    } else if (sla.metric === 'delivery_time') {
      actualDuration = calculateDeliveryTime(asn)
      if (actualDuration > 0) {
        matchedSLA = sla
        break
      }
    } else if (sla.metric === 'processing_time') {
      actualDuration = calculateDuration1(asn)
      if (actualDuration > 0) {
        matchedSLA = sla
        break
      }
    } else if (sla.metric === 'custom' && sla.customFormula) {
      // Parse custom formula and calculate
      // For now, try to match common patterns
      if (sla.customFormula.includes('offloadingDuration')) {
        actualDuration = calculateOffloadingDuration(asn)
      } else if (sla.customFormula.includes('putawayDuration')) {
        actualDuration = calculatePutawayDuration(asn)
      } else if (sla.customFormula.includes('pickingDuration')) {
        actualDuration = calculatePickingDuration(asn)
      } else if (sla.customFormula.includes('qcDuration')) {
        actualDuration = calculateQCDuration(asn)
      } else if (sla.customFormula.includes('dispatchingDuration')) {
        actualDuration = calculateDispatchingDuration(asn)
      } else {
        // Try to calculate from formula
        actualDuration = calculateDuration1(asn)
      }
      if (actualDuration > 0) {
        matchedSLA = sla
        break
      }
    }
  }
  
  if (!matchedSLA || actualDuration === undefined) {
    return {}
  }
  
  // Calculate compliance
  const targetDuration = matchedSLA.targetDuration
  const compliancePercentage = (targetDuration / actualDuration) * 100
  
  let slaComplianceStatus: ASNData['slaComplianceStatus'] = 'NOT_APPLICABLE'
  let breachReason: string | undefined
  
  if (compliancePercentage >= 100) {
    slaComplianceStatus = 'COMPLIANT'
  } else if (compliancePercentage >= matchedSLA.warningThreshold) {
    slaComplianceStatus = 'WARNING'
    breachReason = `Actual duration (${formatDuration(actualDuration)}) exceeded ${matchedSLA.warningThreshold}% of target (${formatDuration(targetDuration)})`
  } else {
    slaComplianceStatus = 'CRITICAL'
    breachReason = `Actual duration (${formatDuration(actualDuration)}) exceeded target (${formatDuration(targetDuration)})`
  }
  
  return {
    slaComplianceStatus,
    slaId: matchedSLA.id,
    slaTargetDuration: targetDuration,
    slaActualDuration: actualDuration,
    slaCompliancePercentage: compliancePercentage,
    slaBreachReason: breachReason,
  }
}

/**
 * Format duration in seconds to readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

/**
 * Process raw inbound data and convert to ASN format with SLA compliance
 */
export function processInboundData(
  rawData: RawInboundData[],
  slas: CustomerSLA[] = []
): ASNData[] {
  // Clean the data
  const cleanedData = cleanInboundData(rawData)
  
  // Convert to ASN format
  const asnData = cleanedData.map((cleaned, index) => {
    const asn = convertToASNData(cleaned, index)
    
    // Calculate actual durations from start/end times
    asn.duration1 = calculateDuration1(asn)
    asn.duration2 = calculateDuration2(asn)
    
    // Calculate SLA compliance using actual durations
    const compliance = calculateSLACompliance(asn, slas)
    
    return {
      ...asn,
      ...compliance,
    }
  })
  
  return asnData
}

/**
 * Group ASN data by process type and document type
 */
export function groupASNData(data: ASNData[]) {
  const inbound = data.filter(d => (d as any).processType === 'INBOUND')
  const outbound = data.filter(d => (d as any).processType === 'OUTBOUND')
  
  const asns = data.filter(d => (d as any).documentType === 'ASN' || !(d as any).documentType)
  const grs = data.filter(d => (d as any).documentType === 'GR')
  const orders = data.filter(d => (d as any).documentType === 'ORDER')
  const returns = data.filter(d => (d as any).documentType === 'RETURN')
  
  return {
    all: data,
    inbound,
    outbound,
    asns,
    grs,
    orders,
    returns,
  }
}

