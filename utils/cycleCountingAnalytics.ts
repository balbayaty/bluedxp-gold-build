// World-Class Cycle Counting Analytics Engine
// Advanced analytics and performance metrics
// Industry-leading insights and reporting

import { 
  CycleCount, 
  CountAnalytics, 
  CountingMethod,
  Counter,
  VarianceSeverity,
  RootCauseCategory
} from '@/types/cycleCounting'

// Calculate comprehensive cycle counting analytics
export function calculateCycleCountingAnalytics(
  counts: CycleCount[],
  counters: Counter[] = []
): CountAnalytics {
  const completedCounts = counts.filter(c => c.status === 'COMPLETED' || c.status === 'ADJUSTED')
  const inProgressCounts = counts.filter(c => c.status === 'IN_PROGRESS')
  
  // Performance metrics
  const totalCountTime = completedCounts.reduce((sum, count) => {
    if (count.startedAt && count.completedAt) {
      return sum + (new Date(count.completedAt).getTime() - new Date(count.startedAt).getTime()) / (1000 * 60)
    }
    return sum
  }, 0)
  
  const averageCountTime = completedCounts.length > 0 
    ? totalCountTime / completedCounts.length 
    : 0
  
  const totalItems = completedCounts.reduce((sum, count) => sum + count.totalItems, 0)
  const totalCountedItems = completedCounts.reduce((sum, count) => sum + count.countedItems, 0)
  const totalHours = totalCountTime / 60
  const averageItemsPerHour = totalHours > 0 
    ? totalCountedItems / totalHours 
    : 0
  
  const averageCountDuration = totalCountedItems > 0 
    ? totalCountTime / totalCountedItems 
    : 0
  
  // Accuracy metrics
  const totalAccuracy = completedCounts.reduce((sum, count) => 
    sum + (count.results.accuracyRate || 0), 0
  )
  const averageAccuracy = completedCounts.length > 0 
    ? totalAccuracy / completedCounts.length 
    : 0
  
  const totalVariance = completedCounts.reduce((sum, count) => 
    sum + Math.abs(count.results.averageVariance || 0), 0
  )
  const averageVariance = completedCounts.length > 0 
    ? totalVariance / completedCounts.length 
    : 0
  
  // Variance metrics
  const totalVarianceValue = completedCounts.reduce((sum, count) => 
    sum + Math.abs(count.results.totalVarianceValue || 0), 0
  )
  const averageVarianceValue = completedCounts.length > 0 
    ? totalVarianceValue / completedCounts.length 
    : 0
  
  // Variance by severity
  const varianceBySeverity: Record<VarianceSeverity, number> = {
    NONE: 0,
    MINOR: 0,
    MODERATE: 0,
    MAJOR: 0,
    CRITICAL: 0,
  }
  
  completedCounts.forEach(count => {
    count.items.forEach(item => {
      if (item.varianceSeverity) {
        varianceBySeverity[item.varianceSeverity]++
      }
    })
  })
  
  // Root cause distribution
  const rootCauseDistribution: Record<RootCauseCategory, number> = {
    COUNTING_ERROR: 0,
    DATA_ENTRY_ERROR: 0,
    THEFT: 0,
    DAMAGE: 0,
    EXPIRY: 0,
    LOCATION_ERROR: 0,
    SYSTEM_ERROR: 0,
    RECEIVING_ERROR: 0,
    SHIPPING_ERROR: 0,
    PUTAWAY_ERROR: 0,
    PICKING_ERROR: 0,
    UNKNOWN: 0,
  }
  
  completedCounts.forEach(count => {
    if (count.rootCauseAnalysis) {
      count.rootCauseAnalysis.forEach(rca => {
        rootCauseDistribution[rca.category]++
      })
    }
  })
  
  // Method performance
  const methodPerformance: Record<CountingMethod, {
    averageAccuracy: number
    averageVariance: number
    countTime: number
    countCount: number
  }> = {} as any
  
  const methods: CountingMethod[] = [
    'ABC_ANALYSIS', 'RANDOM', 'LOCATION_BASED', 'FREQUENCY_BASED',
    'VALUE_BASED', 'CONTROL_GROUP', 'BLIND_COUNT', 'OPEN_COUNT',
    'SPOT_CHECK', 'FULL_PHYSICAL', 'CONTINUOUS', 'AI_OPTIMIZED'
  ]
  
  methods.forEach(method => {
    const methodCounts = completedCounts.filter(c => c.countType === method)
    const methodCount = methodCounts.length
    
    if (methodCount > 0) {
      const avgAccuracy = methodCounts.reduce((sum, c) => 
        sum + (c.results.accuracyRate || 0), 0
      ) / methodCount
      
      const avgVariance = methodCounts.reduce((sum, c) => 
        sum + Math.abs(c.results.averageVariance || 0), 0
      ) / methodCount
      
      const avgTime = methodCounts.reduce((sum, c) => {
        if (c.startedAt && c.completedAt) {
          return sum + (new Date(c.completedAt).getTime() - new Date(c.startedAt).getTime()) / (1000 * 60)
        }
        return sum
      }, 0) / methodCount
      
      methodPerformance[method] = {
        averageAccuracy: avgAccuracy,
        averageVariance: avgVariance,
        countTime: avgTime,
        countCount: methodCount,
      }
    } else {
      methodPerformance[method] = {
        averageAccuracy: 0,
        averageVariance: 0,
        countTime: 0,
        countCount: 0,
      }
    }
  })
  
  // Daily performance
  const dailyPerformance = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    const dateStr = date.toISOString().split('T')[0]
    
    const dayCounts = completedCounts.filter(c => {
      if (!c.completedAt) return false
      const countDate = new Date(c.completedAt).toISOString().split('T')[0]
      return countDate === dateStr
    })
    
    const dayCount = dayCounts.length
    const dayAccuracy = dayCounts.length > 0
      ? dayCounts.reduce((sum, c) => sum + (c.results.accuracyRate || 0), 0) / dayCounts.length
      : 0
    const dayVariance = dayCounts.length > 0
      ? dayCounts.reduce((sum, c) => sum + Math.abs(c.results.averageVariance || 0), 0) / dayCounts.length
      : 0
    
    return {
      date: dateStr,
      counts: dayCount,
      accuracy: dayAccuracy,
      variance: dayVariance,
    }
  })
  
  // Top performers
  const counterStats = new Map<string, {
    counts: number
    accuracy: number
    speed: number
    name: string
  }>()
  
  completedCounts.forEach(count => {
    if (count.assignedTo) {
      const counter = counters.find(c => c.id === count.assignedTo)
      const stats = counterStats.get(count.assignedTo) || {
        counts: 0,
        accuracy: 0,
        speed: 0,
        name: counter?.name || count.assignedToName || 'Unknown',
      }
      
      stats.counts++
      stats.accuracy = (stats.accuracy + (count.results.accuracyRate || 0)) / 2
      
      if (count.startedAt && count.completedAt) {
        const duration = (new Date(count.completedAt).getTime() - new Date(count.startedAt).getTime()) / (1000 * 60)
        const speed = count.countedItems / (duration / 60)
        stats.speed = (stats.speed + speed) / 2
      }
      
      counterStats.set(count.assignedTo, stats)
    }
  })
  
  const topCounters = Array.from(counterStats.entries())
    .map(([counterId, stats]) => ({
      counterId,
      counterName: stats.name,
      countsCompleted: stats.counts,
      averageAccuracy: stats.accuracy,
      averageSpeed: stats.speed,
    }))
    .sort((a, b) => b.countsCompleted - a.countsCompleted)
    .slice(0, 10)
  
  // Problem locations
  const locationStats = new Map<string, {
    varianceCount: number
    totalVariance: number
    lastCountDate: Date
  }>()
  
  completedCounts.forEach(count => {
    count.items.forEach(item => {
      if (item.variance && Math.abs(item.variance) > 0.01) {
        const stats = locationStats.get(item.location.locationCode) || {
          varianceCount: 0,
          totalVariance: 0,
          lastCountDate: count.completedAt || new Date(),
        }
        
        stats.varianceCount++
        stats.totalVariance += Math.abs(item.variance)
        if (count.completedAt && count.completedAt > stats.lastCountDate) {
          stats.lastCountDate = count.completedAt
        }
        
        locationStats.set(item.location.locationCode, stats)
      }
    })
  })
  
  const problemLocations = Array.from(locationStats.entries())
    .map(([location, stats]) => ({
      location,
      varianceCount: stats.varianceCount,
      averageVariance: stats.totalVariance / stats.varianceCount,
      lastCountDate: stats.lastCountDate,
    }))
    .sort((a, b) => b.varianceCount - a.varianceCount)
    .slice(0, 10)
  
  // Tolerance metrics
  const itemsWithinTolerance = completedCounts.reduce((sum, count) => 
    sum + count.results.itemsWithinTolerance, 0
  )
  const itemsOutsideTolerance = completedCounts.reduce((sum, count) => 
    sum + count.results.itemsOutsideTolerance, 0
  )
  const totalItemsCounted = itemsWithinTolerance + itemsOutsideTolerance
  const toleranceRate = totalItemsCounted > 0
    ? (itemsWithinTolerance / totalItemsCounted) * 100
    : 100
  
  return {
    totalCounts: counts.length,
    completedCounts: completedCounts.length,
    inProgressCounts: inProgressCounts.length,
    averageAccuracy,
    averageVariance,
    averageCountTime,
    averageItemsPerHour,
    averageCountDuration,
    accuracyRate: averageAccuracy,
    itemsWithinTolerance,
    itemsOutsideTolerance,
    toleranceRate,
    totalVarianceValue,
    averageVarianceValue,
    varianceBySeverity,
    rootCauseDistribution,
    methodPerformance,
    dailyPerformance,
    topCounters,
    problemLocations,
  }
}




