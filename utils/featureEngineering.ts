// Feature Engineering for Data Mining
// Extracts features from timestamps and operational data for analytics and ML

import { ASNData } from '@/types/asn'

export interface TimeBasedFeatures {
  // Time of Day Features
  hourOfDay: number              // 0-23
  dayOfWeek: number              // 0-6 (Sunday = 0)
  dayOfMonth: number             // 1-31
  month: number                  // 1-12
  quarter: number                // 1-4
  isWeekend: boolean
  isBusinessHours: boolean       // 8 AM - 5 PM
  isPeakHours: boolean           // 9 AM - 12 PM, 2 PM - 4 PM
  
  // Duration Features
  duration1: number              // seconds
  duration2: number              // seconds
  totalDuration: number          // seconds
  duration1Minutes: number
  duration2Minutes: number
  totalDurationMinutes: number
  duration1Hours: number
  duration2Hours: number
  totalDurationHours: number
  
  // Time Difference Features
  timeToGR: number | null        // Time from ASN to GR (seconds)
  timeToDispatch: number | null  // Time from order to dispatch (seconds)
  processingDelay: number | null // Delay in processing (seconds)
  onTimePerformance: number | null // Percentage on-time
  
  // Operational Features
  isSameDayProcessing: boolean
  isNextDayDispatch: boolean
  processingEfficiency: number | null // Duration vs expected
  throughputRate: number | null      // Items per hour
  
  // SLA Compliance Features
  slaComplianceScore: number | null
  slaBreachRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null
  timeToSLAThreshold: number | null  // Seconds until SLA breach
  slaBufferTime: number | null        // Remaining time before SLA
  
  // Seasonal Features
  isHoliday: boolean
  isMonthEnd: boolean
  isQuarterEnd: boolean
  isYearEnd: boolean
  
  // Performance Features
  processingSpeed: number | null     // Items per minute
  averageProcessingTime: number | null
  deviationFromAverage: number | null
}

export interface OperationalFeatures {
  // Volume Features
  dailyVolume: number
  weeklyVolume: number
  monthlyVolume: number
  
  // Personnel Features
  personnelCount: number
  personnelEfficiency: number | null
  
  // Asset Features
  assetUtilization: number | null
  assetTurnover: number | null
  
  // Location Features
  locationDistance: number | null
  locationType: string | null
  
  // Category Features
  categoryFrequency: number
  categoryEfficiency: number | null
}

/**
 * Extract time-based features from ASN data
 */
export function extractTimeFeatures(asn: ASNData): TimeBasedFeatures {
  const createdAt = new Date(asn.createdAt)
  const expectedDate = asn.expectedDeliveryDate ? new Date(asn.expectedDeliveryDate) : null
  const actualDate = asn.actualDeliveryDate ? new Date(asn.actualDeliveryDate) : null
  const grDate = asn.goodsReceiptDate ? new Date(asn.goodsReceiptDate) : null
  
  // Time of Day Features
  const hourOfDay = createdAt.getHours()
  const dayOfWeek = createdAt.getDay()
  const dayOfMonth = createdAt.getDate()
  const month = createdAt.getMonth() + 1
  const quarter = Math.ceil(month / 3)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isBusinessHours = hourOfDay >= 8 && hourOfDay < 17
  const isPeakHours = (hourOfDay >= 9 && hourOfDay < 12) || (hourOfDay >= 14 && hourOfDay < 16)
  
  // Duration Features
  const duration1 = asn.duration1 || 0
  const duration2 = asn.duration2 || 0
  const totalDuration = duration1 + duration2
  
  // Time Difference Features
  const timeToGR = grDate && expectedDate
    ? Math.abs(grDate.getTime() - expectedDate.getTime()) / 1000
    : null
  
  const processingDelay = expectedDate && actualDate
    ? Math.abs(actualDate.getTime() - expectedDate.getTime()) / 1000
    : null
  
  const onTimePerformance = expectedDate && actualDate
    ? actualDate <= expectedDate ? 100 : Math.max(0, 100 - ((actualDate.getTime() - expectedDate.getTime()) / 1000 / 3600) * 10)
    : null
  
  // Operational Features
  const isSameDayProcessing = expectedDate && actualDate
    ? expectedDate.toDateString() === actualDate.toDateString()
    : false
  
  const isNextDayDispatch = expectedDate && actualDate
    ? actualDate.getTime() - expectedDate.getTime() <= 24 * 60 * 60 * 1000
    : false
  
  const processingEfficiency = asn.slaTargetDuration && asn.slaActualDuration
    ? (asn.slaTargetDuration / asn.slaActualDuration) * 100
    : null
  
  const throughputRate = totalDuration > 0 && asn.totalQuantity
    ? (asn.totalQuantity / totalDuration) * 3600 // items per hour
    : null
  
  // SLA Compliance Features
  const slaComplianceScore = asn.slaCompliancePercentage || null
  const slaBreachRisk = asn.slaComplianceStatus === 'CRITICAL' ? 'CRITICAL'
    : asn.slaComplianceStatus === 'WARNING' ? 'HIGH'
    : asn.slaComplianceStatus === 'COMPLIANT' ? 'LOW'
    : null
  
  const timeToSLAThreshold = asn.slaTargetDuration && asn.slaActualDuration
    ? asn.slaTargetDuration - asn.slaActualDuration
    : null
  
  const slaBufferTime = timeToSLAThreshold !== null && timeToSLAThreshold > 0
    ? timeToSLAThreshold
    : null
  
  // Seasonal Features
  const isMonthEnd = dayOfMonth >= 28
  const isQuarterEnd = month % 3 === 0 && dayOfMonth >= 25
  const isYearEnd = month === 12 && dayOfMonth >= 25
  const isHoliday = false // Can be enhanced with holiday calendar
  
  // Performance Features
  const processingSpeed = totalDuration > 0 && asn.totalQuantity
    ? asn.totalQuantity / (totalDuration / 60) // items per minute
    : null
  
  return {
    hourOfDay,
    dayOfWeek,
    dayOfMonth,
    month,
    quarter,
    isWeekend,
    isBusinessHours,
    isPeakHours,
    duration1,
    duration2,
    totalDuration,
    duration1Minutes: duration1 / 60,
    duration2Minutes: duration2 / 60,
    totalDurationMinutes: totalDuration / 60,
    duration1Hours: duration1 / 3600,
    duration2Hours: duration2 / 3600,
    totalDurationHours: totalDuration / 3600,
    timeToGR,
    timeToDispatch: null, // Can be calculated for orders
    processingDelay,
    onTimePerformance,
    isSameDayProcessing,
    isNextDayDispatch,
    processingEfficiency,
    throughputRate,
    slaComplianceScore,
    slaBreachRisk,
    timeToSLAThreshold,
    slaBufferTime,
    isHoliday,
    isMonthEnd,
    isQuarterEnd,
    isYearEnd,
    processingSpeed,
    averageProcessingTime: null, // Requires aggregation
    deviationFromAverage: null,   // Requires aggregation
  }
}

/**
 * Extract operational features from ASN data
 */
export function extractOperationalFeatures(asn: ASNData, aggregatedData?: any): OperationalFeatures {
  return {
    dailyVolume: 1, // Requires aggregation
    weeklyVolume: 1, // Requires aggregation
    monthlyVolume: 1, // Requires aggregation
    personnelCount: 1, // Requires aggregation
    personnelEfficiency: null, // Requires aggregation
    assetUtilization: null, // Requires aggregation
    assetTurnover: null, // Requires aggregation
    locationDistance: null,
    locationType: asn.locationName || null,
    categoryFrequency: 1, // Requires aggregation
    categoryEfficiency: null, // Requires aggregation
  }
}

/**
 * Aggregate features across multiple ASNs for data mining
 */
export function aggregateFeatures(asns: ASNData[]): {
  averageDuration1: number
  averageDuration2: number
  averageTotalDuration: number
  averageProcessingTime: number
  averageThroughput: number
  complianceRate: number
  onTimeRate: number
  peakHourVolume: number
  weekendVolume: number
  personnelEfficiency: Record<string, number>
  assetEfficiency: Record<string, number>
  categoryEfficiency: Record<string, number>
  locationEfficiency: Record<string, number>
} {
  const features = asns.map(extractTimeFeatures)
  
  const durations1 = features.map(f => f.duration1).filter(d => d > 0)
  const durations2 = features.map(f => f.duration2).filter(d => d > 0)
  const totalDurations = features.map(f => f.totalDuration).filter(d => d > 0)
  
  const averageDuration1 = durations1.length > 0
    ? durations1.reduce((a, b) => a + b, 0) / durations1.length
    : 0
  
  const averageDuration2 = durations2.length > 0
    ? durations2.reduce((a, b) => a + b, 0) / durations2.length
    : 0
  
  const averageTotalDuration = totalDurations.length > 0
    ? totalDurations.reduce((a, b) => a + b, 0) / totalDurations.length
    : 0
  
  const averageProcessingTime = averageTotalDuration
  
  const throughputs = features
    .map(f => f.throughputRate)
    .filter(t => t !== null) as number[]
  const averageThroughput = throughputs.length > 0
    ? throughputs.reduce((a, b) => a + b, 0) / throughputs.length
    : 0
  
  const compliant = asns.filter(a => a.slaComplianceStatus === 'COMPLIANT').length
  const complianceRate = asns.length > 0 ? (compliant / asns.length) * 100 : 0
  
  const onTime = features.filter(f => f.onTimePerformance !== null && f.onTimePerformance >= 100).length
  const onTimeRate = features.length > 0 ? (onTime / features.length) * 100 : 0
  
  const peakHourVolume = features.filter(f => f.isPeakHours).length
  const weekendVolume = features.filter(f => f.isWeekend).length
  
  // Personnel efficiency
  const personnelEfficiency: Record<string, number> = {}
  asns.forEach(asn => {
    if (asn.personnel) {
      if (!personnelEfficiency[asn.personnel]) {
        personnelEfficiency[asn.personnel] = 0
      }
      const features = extractTimeFeatures(asn)
      if (features.processingEfficiency) {
        personnelEfficiency[asn.personnel] += features.processingEfficiency
      }
    }
  })
  
  // Asset efficiency
  const assetEfficiency: Record<string, number> = {}
  asns.forEach(asn => {
    if (asn.assetId) {
      if (!assetEfficiency[asn.assetId]) {
        assetEfficiency[asn.assetId] = 0
      }
      const features = extractTimeFeatures(asn)
      if (features.processingEfficiency) {
        assetEfficiency[asn.assetId] += features.processingEfficiency
      }
    }
  })
  
  // Category efficiency
  const categoryEfficiency: Record<string, number> = {}
  asns.forEach(asn => {
    if (asn.category) {
      if (!categoryEfficiency[asn.category]) {
        categoryEfficiency[asn.category] = 0
      }
      const features = extractTimeFeatures(asn)
      if (features.processingEfficiency) {
        categoryEfficiency[asn.category] += features.processingEfficiency
      }
    }
  })
  
  // Location efficiency
  const locationEfficiency: Record<string, number> = {}
  asns.forEach(asn => {
    if (asn.locationName) {
      if (!locationEfficiency[asn.locationName]) {
        locationEfficiency[asn.locationName] = 0
      }
      const features = extractTimeFeatures(asn)
      if (features.processingEfficiency) {
        locationEfficiency[asn.locationName] += features.processingEfficiency
      }
    }
  })
  
  return {
    averageDuration1,
    averageDuration2,
    averageTotalDuration,
    averageProcessingTime,
    averageThroughput,
    complianceRate,
    onTimeRate,
    peakHourVolume,
    weekendVolume,
    personnelEfficiency,
    assetEfficiency,
    categoryEfficiency,
    locationEfficiency,
  }
}

/**
 * Generate features for ML/Analytics
 */
export function generateMLFeatures(asn: ASNData, aggregatedData?: any): Record<string, number | boolean | string | null> {
  const timeFeatures = extractTimeFeatures(asn)
  const operationalFeatures = extractOperationalFeatures(asn, aggregatedData)
  
  return {
    // Time features
    hourOfDay: timeFeatures.hourOfDay,
    dayOfWeek: timeFeatures.dayOfWeek,
    dayOfMonth: timeFeatures.dayOfMonth,
    month: timeFeatures.month,
    quarter: timeFeatures.quarter,
    isWeekend: timeFeatures.isWeekend ? 1 : 0,
    isBusinessHours: timeFeatures.isBusinessHours ? 1 : 0,
    isPeakHours: timeFeatures.isPeakHours ? 1 : 0,
    
    // Duration features
    duration1: timeFeatures.duration1,
    duration2: timeFeatures.duration2,
    totalDuration: timeFeatures.totalDuration,
    duration1Minutes: timeFeatures.duration1Minutes,
    duration2Minutes: timeFeatures.duration2Minutes,
    totalDurationMinutes: timeFeatures.totalDurationMinutes,
    
    // Performance features
    processingEfficiency: timeFeatures.processingEfficiency || 0,
    throughputRate: timeFeatures.throughputRate || 0,
    processingSpeed: timeFeatures.processingSpeed || 0,
    
    // SLA features
    slaComplianceScore: timeFeatures.slaComplianceScore || 0,
    slaBreachRisk: timeFeatures.slaBreachRisk === 'CRITICAL' ? 3
      : timeFeatures.slaBreachRisk === 'HIGH' ? 2
      : timeFeatures.slaBreachRisk === 'MEDIUM' ? 1
      : 0,
    timeToSLAThreshold: timeFeatures.timeToSLAThreshold || 0,
    
    // Operational features
    quantity: asn.totalQuantity || 0,
    weight: asn.totalWeight || 0,
    items: asn.totalItems || 0,
    
    // Categorical features (encoded)
    entity: asn.entity || '',
    customerNumber: asn.customerNumber || '',
    vendorNumber: asn.vendorNumber || '',
    location: asn.locationName || '',
    assetType: asn.assetType || '',
    category: asn.category || '',
    status: asn.status || '',
  }
}

