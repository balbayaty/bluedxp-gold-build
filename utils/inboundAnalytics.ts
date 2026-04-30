// World-Class Inbound Operations Analytics Engine
// Advanced analytics and performance metrics for inbound operations
// Industry-leading insights and reporting

import { ASNData, ASNStatus } from '@/types/asn'

export interface InboundAnalytics {
  totalASNs: number
  completedASNs: number
  inProgressASNs: number
  pendingASNs: number
  averageProcessingTime: number
  averageOffloadingTime: number
  averagePutawayTime: number
  onTimeArrivalRate: number
  slaComplianceRate: number
  damageRate: number
  accuracyRate: number
  throughput: number // ASNs per hour
  vendorPerformance: Map<string, {
    asnCount: number
    onTimeRate: number
    damageRate: number
    averageProcessingTime: number
  }>
  statusDistribution: Map<string, number>
  hourlyPerformance: Array<{
    hour: number
    arrivals: number
    completions: number
    averageProcessingTime: number
  }>
  modalPerformance: {
    truck: { count: number; avgTime: number }
    air: { count: number; avgTime: number }
    sea: { count: number; avgTime: number }
    rail: { count: number; avgTime: number }
  }
  topVendors: Array<{
    vendorNumber: string
    vendorName: string
    asnCount: number
    onTimeRate: number
    performanceScore: number
  }>
}

// Calculate comprehensive inbound analytics
export function calculateInboundAnalytics(asns: ASNData[]): InboundAnalytics {
  const completedASNs = asns.filter(a => a.status === 'COMPLETED' || a.status === 'GR_POSTED')
  const inProgressASNs = asns.filter(a => 
    a.status === 'IN_TRANSIT' || 
    a.status === 'ARRIVED' || 
    a.status === 'PARTIAL_GR'
  )
  const pendingASNs = asns.filter(a => 
    a.status === 'CREATED' || 
    a.status === 'SENT' || 
    a.status === 'ACKNOWLEDGED'
  )

  // Calculate processing times
  const processingTimes = completedASNs
    .filter(a => a.goodsReceiptDate && a.expectedDeliveryDate)
    .map(a => {
      const start = new Date(a.expectedDeliveryDate).getTime()
      const end = new Date(a.goodsReceiptDate!).getTime()
      return (end - start) / 1000 // in seconds
    })
    .filter(t => t > 0)

  const averageProcessingTime = processingTimes.length > 0
    ? processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length
    : 0

  // Calculate offloading times (arrival to offloading completion)
  const offloadingTimes = completedASNs
    .filter(a => a.vehicleArrivalDate && a.offloadingEndTime)
    .map(a => {
      const start = new Date(a.vehicleArrivalDate!).getTime()
      const end = new Date(a.offloadingEndTime!).getTime()
      return (end - start) / 1000
    })
    .filter(t => t > 0)

  const averageOffloadingTime = offloadingTimes.length > 0
    ? offloadingTimes.reduce((sum, t) => sum + t, 0) / offloadingTimes.length
    : 0

  // Calculate putaway times
  const putawayTimes = completedASNs
    .filter(a => a.offloadingEndTime && a.putawayEndTime)
    .map(a => {
      const start = new Date(a.offloadingEndTime!).getTime()
      const end = new Date(a.putawayEndTime!).getTime()
      return (end - start) / 1000
    })
    .filter(t => t > 0)

  const averagePutawayTime = putawayTimes.length > 0
    ? putawayTimes.reduce((sum, t) => sum + t, 0) / putawayTimes.length
    : 0

  // On-time arrival rate
  const onTimeArrivals = completedASNs.filter(a => a.arrivedOnTime === true).length
  const onTimeArrivalRate = completedASNs.length > 0
    ? (onTimeArrivals / completedASNs.length) * 100
    : 0

  // SLA compliance rate
  const compliantASNs = completedASNs.filter(a => {
    if (!a.slaCompliancePercentage) return false
    return a.slaCompliancePercentage <= 100
  }).length
  const slaComplianceRate = completedASNs.length > 0
    ? (compliantASNs / completedASNs.length) * 100
    : 0

  // Damage rate (simplified - based on quality status)
  // Check for damage based on quality status
  const damagedASNs = asns.filter(a => {
    // Check if quality status indicates issues
    return a.qualityStatus && (a.qualityStatus.includes('REJECTED') || a.qualityStatus.includes('DAMAGE'))
  }).length
  const damageRate = asns.length > 0
    ? (damagedASNs / asns.length) * 100
    : 0

  // Accuracy rate (based on quantity variance)
  const accurateASNs = completedASNs.filter(a => {
    if (!a.receivedQuantity || !a.totalQuantity) return false
    const variance = Math.abs((a.receivedQuantity / a.totalQuantity) * 100 - 100)
    return variance <= 2 // 2% tolerance
  }).length
  const accuracyRate = completedASNs.length > 0
    ? (accurateASNs / completedASNs.length) * 100
    : 0

  // Throughput (ASNs per hour)
  const totalHours = processingTimes.length > 0
    ? processingTimes.reduce((sum, t) => sum + t, 0) / 3600
    : 1
  const throughput = totalHours > 0 ? completedASNs.length / totalHours : 0

  // Vendor performance
  const vendorStats = new Map<string, {
    asnCount: number
    onTimeCount: number
    damagedCount: number
    totalProcessingTime: number
    vendorName: string
  }>()

  asns.forEach(asn => {
    const vendor = vendorStats.get(asn.vendorNumber) || {
      asnCount: 0,
      onTimeCount: 0,
      damagedCount: 0,
      totalProcessingTime: 0,
      vendorName: asn.vendorName,
    }
    vendor.asnCount++
    if (asn.arrivedOnTime === true) vendor.onTimeCount++
    if (asn.qualityStatus && (asn.qualityStatus.includes('REJECTED') || asn.qualityStatus.includes('DAMAGE'))) {
      vendor.damagedCount++
    }
    if (asn.goodsReceiptDate && asn.expectedDeliveryDate) {
      const time = (new Date(asn.goodsReceiptDate).getTime() - new Date(asn.expectedDeliveryDate).getTime()) / 1000
      if (time > 0) vendor.totalProcessingTime += time
    }
    vendorStats.set(asn.vendorNumber, vendor)
  })

  const vendorPerformance = new Map<string, {
    asnCount: number
    onTimeRate: number
    damageRate: number
    averageProcessingTime: number
  }>()

  vendorStats.forEach((stats, vendorNumber) => {
    vendorPerformance.set(vendorNumber, {
      asnCount: stats.asnCount,
      onTimeRate: stats.asnCount > 0 ? (stats.onTimeCount / stats.asnCount) * 100 : 0,
      damageRate: stats.asnCount > 0 ? (stats.damagedCount / stats.asnCount) * 100 : 0,
      averageProcessingTime: stats.asnCount > 0 ? stats.totalProcessingTime / stats.asnCount : 0,
    })
  })

  // Status distribution
  const statusDistribution = new Map<string, number>()
  asns.forEach(asn => {
    const status = asn.status as string
    statusDistribution.set(status, (statusDistribution.get(status) || 0) + 1)
  })

  // Hourly performance
  const hourlyPerformance = Array.from({ length: 24 }, (_, hour) => {
    const hourArrivals = asns.filter(a => {
      if (!a.vehicleArrivalDate) return false
      const arrivalHour = new Date(a.vehicleArrivalDate).getHours()
      return arrivalHour === hour
    }).length

    const hourCompletions = completedASNs.filter(a => {
      if (!a.goodsReceiptDate) return false
      const completionHour = new Date(a.goodsReceiptDate).getHours()
      return completionHour === hour
    }).length

    const hourProcessingTimes = completedASNs
      .filter(a => {
        if (!a.goodsReceiptDate) return false
        const completionHour = new Date(a.goodsReceiptDate).getHours()
        return completionHour === hour
      })
      .map(a => {
        if (!a.goodsReceiptDate || !a.expectedDeliveryDate) return 0
        return (new Date(a.goodsReceiptDate).getTime() - new Date(a.expectedDeliveryDate).getTime()) / 1000
      })
      .filter(t => t > 0)

    const averageProcessingTime = hourProcessingTimes.length > 0
      ? hourProcessingTimes.reduce((sum, t) => sum + t, 0) / hourProcessingTimes.length
      : 0

    return {
      hour,
      arrivals: hourArrivals,
      completions: hourCompletions,
      averageProcessingTime,
    }
  })

  // Modal performance (transportation mode)
  // Infer mode from carrier or default to truck
  const modalStats = {
    truck: { count: 0, totalTime: 0 },
    air: { count: 0, totalTime: 0 },
    sea: { count: 0, totalTime: 0 },
    rail: { count: 0, totalTime: 0 },
  }

  completedASNs.forEach(asn => {
    // Infer transport mode from carrier name or default to truck
    let mode = 'truck'
    const carrier = asn.carrier?.toLowerCase() || ''
    if (carrier.includes('air') || carrier.includes('cargo') || carrier.includes('express')) {
      mode = 'air'
    } else if (carrier.includes('sea') || carrier.includes('shipping') || carrier.includes('maritime')) {
      mode = 'sea'
    } else if (carrier.includes('rail') || carrier.includes('train')) {
      mode = 'rail'
    }
    
    if (mode in modalStats) {
      modalStats[mode as keyof typeof modalStats].count++
      if (asn.goodsReceiptDate && asn.expectedDeliveryDate) {
        const time = (new Date(asn.goodsReceiptDate).getTime() - new Date(asn.expectedDeliveryDate).getTime()) / 1000
        if (time > 0) {
          modalStats[mode as keyof typeof modalStats].totalTime += time
        }
      }
    }
  })

  const modalPerformance = {
    truck: {
      count: modalStats.truck.count,
      avgTime: modalStats.truck.count > 0 ? modalStats.truck.totalTime / modalStats.truck.count : 0,
    },
    air: {
      count: modalStats.air.count,
      avgTime: modalStats.air.count > 0 ? modalStats.air.totalTime / modalStats.air.count : 0,
    },
    sea: {
      count: modalStats.sea.count,
      avgTime: modalStats.sea.count > 0 ? modalStats.sea.totalTime / modalStats.sea.count : 0,
    },
    rail: {
      count: modalStats.rail.count,
      avgTime: modalStats.rail.count > 0 ? modalStats.rail.totalTime / modalStats.rail.count : 0,
    },
  }

  // Top vendors
  const topVendors = Array.from(vendorPerformance.entries())
    .map(([vendorNumber, perf]) => {
      const vendorInfo = vendorStats.get(vendorNumber)
      const performanceScore = (
        perf.onTimeRate * 0.4 +
        (100 - perf.damageRate) * 0.3 +
        (perf.averageProcessingTime > 0 ? Math.max(0, 100 - (perf.averageProcessingTime / 3600) * 10) : 50) * 0.3
      )
      return {
        vendorNumber,
        vendorName: vendorInfo?.vendorName || vendorNumber,
        asnCount: perf.asnCount,
        onTimeRate: perf.onTimeRate,
        performanceScore,
      }
    })
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 10)

  return {
    totalASNs: asns.length,
    completedASNs: completedASNs.length,
    inProgressASNs: inProgressASNs.length,
    pendingASNs: pendingASNs.length,
    averageProcessingTime,
    averageOffloadingTime,
    averagePutawayTime,
    onTimeArrivalRate,
    slaComplianceRate,
    damageRate,
    accuracyRate,
    throughput,
    vendorPerformance,
    statusDistribution,
    hourlyPerformance,
    modalPerformance,
    topVendors,
  }
}

// Calculate real-time inbound metrics
export function calculateRealTimeInboundMetrics(asns: ASNData[]): {
  activeReceiving: number
  expectedToday: number
  arrivedToday: number
  completedToday: number
  averageWaitTime: number
  bottleneckVendors: string[]
  efficiencyTrend: 'UP' | 'DOWN' | 'STABLE'
} {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const activeReceiving = asns.filter(a =>
    a.status === 'ARRIVED' || a.status === 'PARTIAL_GR'
  ).length

  const expectedToday = asns.filter(a => {
    if (!a.expectedDeliveryDate) return false
    const expected = new Date(a.expectedDeliveryDate)
    return expected >= today && expected < tomorrow
  }).length

  const arrivedToday = asns.filter(a => {
    if (!a.vehicleArrivalDate) return false
    const arrived = new Date(a.vehicleArrivalDate)
    return arrived >= today && arrived < tomorrow
  }).length

  const completedToday = asns.filter(a => {
    if (!a.goodsReceiptDate) return false
    const completed = new Date(a.goodsReceiptDate)
    return completed >= today && completed < tomorrow
  }).length

  // Average wait time (arrival to start of processing)
  const waitTimes = asns
    .filter(a => a.vehicleArrivalDate && a.offloadingStartTime)
    .map(a => {
      const arrival = new Date(a.vehicleArrivalDate!).getTime()
      const start = new Date(a.offloadingStartTime!).getTime()
      return (start - arrival) / 1000 / 60 // in minutes
    })
    .filter(t => t > 0)

  const averageWaitTime = waitTimes.length > 0
    ? waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length
    : 0

  // Bottleneck vendors (vendors with most pending/in-progress ASNs)
  const vendorPendingCounts = new Map<string, number>()
  asns
    .filter(a => a.status === 'IN_TRANSIT' || a.status === 'ARRIVED' || a.status === 'PARTIAL_GR')
    .forEach(a => {
      vendorPendingCounts.set(a.vendorNumber, (vendorPendingCounts.get(a.vendorNumber) || 0) + 1)
    })

  const bottleneckVendors = Array.from(vendorPendingCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([vendor]) => vendor)

  // Efficiency trend (simplified)
  const recentASNs = asns
    .filter(a => a.status === 'COMPLETED' && a.goodsReceiptDate)
    .sort((a, b) => {
      const dateA = new Date(a.goodsReceiptDate!).getTime()
      const dateB = new Date(b.goodsReceiptDate!).getTime()
      return dateB - dateA
    })
    .slice(0, 20)

  if (recentASNs.length < 10) {
    return {
      activeReceiving,
      expectedToday,
      arrivedToday,
      completedToday,
      averageWaitTime,
      bottleneckVendors,
      efficiencyTrend: 'STABLE',
    }
  }

  const recentEfficiency = recentASNs.slice(0, 10)
    .filter(a => a.slaCompliancePercentage !== undefined)
    .map(a => a.slaCompliancePercentage || 100)
    .reduce((sum, p) => sum + p, 0) / 10

  const olderEfficiency = recentASNs.slice(10, 20)
    .filter(a => a.slaCompliancePercentage !== undefined)
    .map(a => a.slaCompliancePercentage || 100)
    .reduce((sum, p) => sum + p, 0) / 10

  const efficiencyTrend = recentEfficiency < olderEfficiency * 0.95
    ? 'UP'
    : recentEfficiency > olderEfficiency * 1.05
    ? 'DOWN'
    : 'STABLE'

  return {
    activeReceiving,
    expectedToday,
    arrivedToday,
    completedToday,
    averageWaitTime,
    bottleneckVendors,
    efficiencyTrend,
  }
}

