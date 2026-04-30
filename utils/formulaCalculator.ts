// Formula Calculator - Calculates actual durations from start/end times
// Used for KPI and SLA calculations

import { ASNData } from '@/types/asn'

/**
 * Calculate actual duration from start and end times
 */
export function calculateDuration(startTime: Date | string | undefined, endTime: Date | string | undefined): number {
  if (!startTime || !endTime) return 0
  
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
  
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000)) // Return in seconds
}

/**
 * Calculate offloading duration from start/end times
 */
export function calculateOffloadingDuration(asn: ASNData): number {
  if (asn.offloadingDuration !== undefined) {
    return asn.offloadingDuration
  }
  return calculateDuration(asn.offloadingStartTime, asn.offloadingEndTime)
}

/**
 * Calculate putaway duration from start/end times
 */
export function calculatePutawayDuration(asn: ASNData): number {
  if (asn.putawayDuration !== undefined) {
    return asn.putawayDuration
  }
  return calculateDuration(asn.putawayStartTime, asn.putawayEndTime)
}

/**
 * Calculate picking duration from start/end times
 */
export function calculatePickingDuration(asn: ASNData): number {
  if (asn.pickingDuration !== undefined) {
    return asn.pickingDuration
  }
  return calculateDuration(asn.pickingStartTime, asn.pickingEndTime)
}

/**
 * Calculate QC duration from start/end times
 */
export function calculateQCDuration(asn: ASNData): number {
  if (asn.qcDuration !== undefined) {
    return asn.qcDuration
  }
  return calculateDuration(asn.qcStartTime, asn.qcEndTime)
}

/**
 * Calculate dispatching duration from start/end times
 */
export function calculateDispatchingDuration(asn: ASNData): number {
  if (asn.dispatchingDuration !== undefined) {
    return asn.dispatchingDuration
  }
  return calculateDuration(asn.dispatchingStartDate, asn.dispatchingEndTime)
}

/**
 * Calculate duration1 (ASN→GR or Order→Picking) from actual times
 */
export function calculateDuration1(asn: ASNData): number {
  if (asn.duration1 !== undefined) {
    return asn.duration1
  }
  
  // For inbound: ASN email time to GR time
  if (asn.processType === 'INBOUND') {
    if (asn.emailTime2 && asn.goodsReceiptDate) {
      return calculateDuration(asn.emailTime2, asn.goodsReceiptDate)
    }
    // Fallback: offloading duration
    return calculateOffloadingDuration(asn)
  }
  
  // For outbound: Order email time to picking start time
  if (asn.processType === 'OUTBOUND') {
    if (asn.plEmailDateTime && asn.pickingStartTime) {
      return calculateDuration(asn.plEmailDateTime, asn.pickingStartTime)
    }
    return 0
  }
  
  return 0
}

/**
 * Calculate duration2 (GR→Putaway or Picking→Dispatch) from actual times
 */
export function calculateDuration2(asn: ASNData): number {
  if (asn.duration2 !== undefined) {
    return asn.duration2
  }
  
  // For inbound: GR time to putaway completion
  if (asn.processType === 'INBOUND') {
    if (asn.goodsReceiptDate && asn.putawayEndTime) {
      return calculateDuration(asn.goodsReceiptDate, asn.putawayEndTime)
    }
    // Fallback: putaway duration
    return calculatePutawayDuration(asn)
  }
  
  // For outbound: Picking end to dispatching end
  if (asn.processType === 'OUTBOUND') {
    if (asn.pickingEndTime && asn.dispatchingEndTime) {
      return calculateDuration(asn.pickingEndTime, asn.dispatchingEndTime)
    }
    return 0
  }
  
  return 0
}

/**
 * Calculate total processing time from all activities
 */
export function calculateTotalProcessingTime(asn: ASNData): number {
  const duration1 = calculateDuration1(asn)
  const duration2 = calculateDuration2(asn)
  return duration1 + duration2
}

/**
 * Calculate delivery time (expected vs actual)
 */
export function calculateDeliveryTime(asn: ASNData): number {
  if (!asn.expectedDeliveryDate || !asn.actualDeliveryDate) return 0
  return calculateDuration(asn.expectedDeliveryDate, asn.actualDeliveryDate)
}

