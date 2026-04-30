// World-Class Picking Analytics Engine
// Advanced analytics and performance metrics
// Industry-leading insights and reporting

import { 
  PickingTask, 
  PickingAnalytics, 
  PickingStrategy,
  Picker 
} from '@/types/picking'

// Calculate comprehensive picking analytics
export function calculatePickingAnalytics(
  tasks: PickingTask[],
  pickers: Picker[] = []
): PickingAnalytics {
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED')
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS')
  
  // Performance metrics
  const totalPickTime = completedTasks.reduce((sum, task) => 
    sum + (task.actualDuration || task.estimatedDuration || 0), 0
  )
  const averagePickTime = completedTasks.length > 0 
    ? totalPickTime / completedTasks.length 
    : 0
  
  const totalPicks = completedTasks.reduce((sum, task) => 
    sum + task.pickedItems, 0
  )
  const totalHours = totalPickTime / 3600
  const averagePicksPerHour = totalHours > 0 
    ? totalPicks / totalHours 
    : 0
  
  const totalAccuracy = completedTasks.reduce((sum, task) => 
    sum + (task.accuracyRate || 0), 0
  )
  const averageAccuracy = completedTasks.length > 0 
    ? totalAccuracy / completedTasks.length 
    : 0
  
  // Efficiency metrics
  const totalDistance = completedTasks.reduce((sum, task) => 
    sum + (task.actualDistance || task.estimatedDistance || 0), 0
  )
  const averageDistancePerPick = totalPicks > 0 
    ? totalDistance / totalPicks 
    : 0
  
  const averageTimePerPick = totalPicks > 0 
    ? totalPickTime / totalPicks 
    : 0
  
  const totalRouteEfficiency = completedTasks.reduce((sum, task) => {
    const efficiency = task.actualDistance && task.estimatedDistance
      ? ((task.estimatedDistance - task.actualDistance) / task.estimatedDistance) * 100
      : 0
    return sum + Math.max(0, efficiency)
  }, 0)
  const routeEfficiency = completedTasks.length > 0 
    ? totalRouteEfficiency / completedTasks.length 
    : 0
  
  const utilizationRate = tasks.length > 0
    ? (completedTasks.length / tasks.length) * 100
    : 0
  
  // Quality metrics
  const qualityChecks = completedTasks.flatMap(t => t.qualityChecks)
  const passedChecks = qualityChecks.filter(q => q.status === 'PASSED').length
  const qualityPassRate = qualityChecks.length > 0
    ? (passedChecks / qualityChecks.length) * 100
    : 100
  
  const totalErrors = completedTasks.reduce((sum, task) => 
    sum + (task.errorCount || 0), 0
  )
  const errorRate = totalPicks > 0
    ? (totalErrors / totalPicks) * 100
    : 0
  
  const reworkTasks = completedTasks.filter(t => 
    t.qualityChecks.some(q => q.status === 'FAILED')
  ).length
  const reworkRate = completedTasks.length > 0
    ? (reworkTasks / completedTasks.length) * 100
    : 0
  
  // Sustainability metrics
  const totalCarbonFootprint = completedTasks.reduce((sum, task) => 
    sum + (task.carbonFootprint || 0), 0
  )
  const totalEnergyConsumed = completedTasks.reduce((sum, task) => 
    sum + (task.energyConsumed || 0), 0
  )
  const carbonPerPick = totalPicks > 0
    ? totalCarbonFootprint / totalPicks
    : 0
  const energyPerPick = totalPicks > 0
    ? totalEnergyConsumed / totalPicks
    : 0
  
  // Strategy performance
  const strategyPerformance: Record<PickingStrategy, {
    averageTime: number
    averageAccuracy: number
    averageEfficiency: number
    taskCount: number
  }> = {} as any
  
  const strategies: PickingStrategy[] = [
    'DISCRETE', 'BATCH', 'WAVE', 'ZONE', 'CLUSTER',
    'PICK_TO_CART', 'PICK_TO_LIGHT', 'VOICE', 'VISION', 'AUTO'
  ]
  
  strategies.forEach(strategy => {
    const strategyTasks = completedTasks.filter(t => t.strategy === strategy)
    const strategyCount = strategyTasks.length
    
    if (strategyCount > 0) {
      const avgTime = strategyTasks.reduce((sum, t) => 
        sum + (t.actualDuration || t.estimatedDuration || 0), 0
      ) / strategyCount
      
      const avgAccuracy = strategyTasks.reduce((sum, t) => 
        sum + (t.accuracyRate || 0), 0
      ) / strategyCount
      
      const avgEfficiency = strategyTasks.reduce((sum, t) => {
        const eff = t.actualDistance && t.estimatedDistance
          ? ((t.estimatedDistance - t.actualDistance) / t.estimatedDistance) * 100
          : 0
        return sum + Math.max(0, eff)
      }, 0) / strategyCount
      
      strategyPerformance[strategy] = {
        averageTime: avgTime,
        averageAccuracy: avgAccuracy,
        averageEfficiency: avgEfficiency,
        taskCount: strategyCount,
      }
    } else {
      strategyPerformance[strategy] = {
        averageTime: 0,
        averageAccuracy: 0,
        averageEfficiency: 0,
        taskCount: 0,
      }
    }
  })
  
  // Hourly performance
  const hourlyPerformance = Array.from({ length: 24 }, (_, hour) => {
    const hourTasks = completedTasks.filter(t => {
      if (!t.completedAt) return false
      const taskHour = new Date(t.completedAt).getHours()
      return taskHour === hour
    })
    
    const hourPicks = hourTasks.reduce((sum, t) => sum + t.pickedItems, 0)
    const hourAccuracy = hourTasks.length > 0
      ? hourTasks.reduce((sum, t) => sum + (t.accuracyRate || 0), 0) / hourTasks.length
      : 0
    const hourEfficiency = hourTasks.length > 0
      ? hourTasks.reduce((sum, t) => {
          const eff = t.actualDistance && t.estimatedDistance
            ? ((t.estimatedDistance - t.actualDistance) / t.estimatedDistance) * 100
            : 0
          return sum + Math.max(0, eff)
        }, 0) / hourTasks.length
      : 0
    
    return {
      hour,
      picks: hourPicks,
      accuracy: hourAccuracy,
      efficiency: hourEfficiency,
    }
  })
  
  // Top performers
  const pickerStats = new Map<string, {
    picks: number
    accuracy: number
    qualityScore: number
    name: string
  }>()
  
  completedTasks.forEach(task => {
    if (task.assignedTo) {
      const picker = pickers.find(p => p.id === task.assignedTo)
      const stats = pickerStats.get(task.assignedTo) || {
        picks: 0,
        accuracy: 0,
        qualityScore: 0,
        name: picker?.name || task.assignedToName || 'Unknown',
      }
      
      stats.picks += task.pickedItems
      stats.accuracy = (stats.accuracy + (task.accuracyRate || 0)) / 2
      stats.qualityScore = (stats.qualityScore + (task.qualityScore || 0)) / 2
      
      pickerStats.set(task.assignedTo, stats)
    }
  })
  
  const topPerformers = Array.from(pickerStats.entries())
    .map(([pickerId, stats]) => ({
      pickerId,
      pickerName: stats.name,
      picksPerHour: stats.picks / (totalHours / pickerStats.size || 1),
      accuracy: stats.accuracy,
      qualityScore: stats.qualityScore,
    }))
    .sort((a, b) => b.picksPerHour - a.picksPerHour)
    .slice(0, 10)
  
  return {
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    inProgressTasks: inProgressTasks.length,
    averagePickTime,
    averagePicksPerHour,
    averageAccuracy,
    averageDistancePerPick,
    averageTimePerPick,
    routeEfficiency,
    utilizationRate,
    qualityPassRate,
    errorRate,
    reworkRate,
    totalCarbonFootprint,
    totalEnergyConsumed,
    carbonPerPick,
    energyPerPick,
    strategyPerformance,
    hourlyPerformance,
    topPerformers,
  }
}

// Calculate real-time performance metrics
export function calculateRealTimeMetrics(tasks: PickingTask[]): {
  activePickers: number
  averageProgress: number
  estimatedCompletion: Date | null
  bottleneckZones: string[]
  efficiencyTrend: 'UP' | 'DOWN' | 'STABLE'
} {
  const activeTasks = tasks.filter(t => 
    t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED'
  )
  
  const activePickers = new Set(
    activeTasks.map(t => t.assignedTo).filter(Boolean)
  ).size
  
  const averageProgress = activeTasks.length > 0
    ? activeTasks.reduce((sum, t) => sum + t.completionPercentage, 0) / activeTasks.length
    : 0
  
  // Estimate completion time
  const remainingTime = activeTasks.reduce((sum, task) => {
    const remaining = (100 - task.completionPercentage) / 100
    const estimated = task.estimatedDuration || 0
    return sum + (estimated * remaining)
  }, 0)
  
  const estimatedCompletion = remainingTime > 0
    ? new Date(Date.now() + remainingTime * 1000)
    : null
  
  // Identify bottleneck zones
  const zoneTasks = new Map<string, number>()
  activeTasks.forEach(task => {
    task.items.forEach(item => {
      const zone = item.fromLocation.zone
      zoneTasks.set(zone, (zoneTasks.get(zone) || 0) + 1)
    })
  })
  
  const bottleneckZones = Array.from(zoneTasks.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([zone]) => zone)
  
  // Calculate efficiency trend (simplified)
  const recentTasks = tasks
    .filter(t => t.status === 'COMPLETED' && t.completedAt)
    .sort((a, b) => {
      const dateA = new Date(a.completedAt!).getTime()
      const dateB = new Date(b.completedAt!).getTime()
      return dateB - dateA
    })
    .slice(0, 10)
  
  if (recentTasks.length < 2) {
    return {
      activePickers,
      averageProgress,
      estimatedCompletion,
      bottleneckZones,
      efficiencyTrend: 'STABLE',
    }
  }
  
  const recentEfficiency = recentTasks.slice(0, 5).reduce((sum, t) => {
    const eff = t.actualDistance && t.estimatedDistance
      ? ((t.estimatedDistance - t.actualDistance) / t.estimatedDistance) * 100
      : 0
    return sum + Math.max(0, eff)
  }, 0) / Math.min(5, recentTasks.length)
  
  const olderEfficiency = recentTasks.slice(5, 10).reduce((sum, t) => {
    const eff = t.actualDistance && t.estimatedDistance
      ? ((t.estimatedDistance - t.actualDistance) / t.estimatedDistance) * 100
      : 0
    return sum + Math.max(0, eff)
  }, 0) / Math.min(5, recentTasks.length - 5)
  
  const efficiencyTrend = recentEfficiency > olderEfficiency * 1.05
    ? 'UP'
    : recentEfficiency < olderEfficiency * 0.95
    ? 'DOWN'
    : 'STABLE'
  
  return {
    activePickers,
    averageProgress,
    estimatedCompletion,
    bottleneckZones,
    efficiencyTrend,
  }
}




