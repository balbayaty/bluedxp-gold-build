/**
 * Real-Time Data Simulator
 * 
 * Provides utilities for simulating real-time data updates across all WMS modules.
 * This makes the system feel alive and showcases enterprise capabilities.
 */

// Simulate real-time updates with configurable intervals
export class RealtimeDataSimulator {
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private subscribers: Map<string, Set<(data: any) => void>> = new Map()

  /**
   * Subscribe to real-time updates for a specific data type
   */
  subscribe<T>(dataType: string, callback: (data: T) => void): () => void {
    if (!this.subscribers.has(dataType)) {
      this.subscribers.set(dataType, new Set())
    }
    this.subscribers.get(dataType)!.add(callback)

    // Return unsubscribe function
    return () => {
      this.subscribers.get(dataType)?.delete(callback)
    }
  }

  /**
   * Start simulating real-time updates
   */
  start<T>(
    dataType: string,
    generator: () => T,
    intervalMs: number = 5000,
    immediate: boolean = true
  ): () => void {
    // Clear existing interval if any
    this.stop(dataType)

    // Generate initial data if immediate
    if (immediate) {
      const data = generator()
      this.notify(dataType, data)
    }

    // Set up interval
    const interval = setInterval(() => {
      const data = generator()
      this.notify(dataType, data)
    }, intervalMs)

    this.intervals.set(dataType, interval)

    // Return stop function
    return () => this.stop(dataType)
  }

  /**
   * Stop simulating updates for a data type
   */
  stop(dataType: string): void {
    const interval = this.intervals.get(dataType)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(dataType)
    }
  }

  /**
   * Stop all simulations
   */
  stopAll(): void {
    this.intervals.forEach((interval) => clearInterval(interval))
    this.intervals.clear()
    this.subscribers.clear()
  }

  /**
   * Notify all subscribers of new data
   */
  private notify<T>(dataType: string, data: T): void {
    const subscribers = this.subscribers.get(dataType)
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in subscriber for ${dataType}:`, error)
        }
      })
    }
  }
}

// Global simulator instance
export const realtimeSimulator = new RealtimeDataSimulator()

/**
 * Simulate real-time KPI updates
 */
export function simulateKPIUpdates(
  baseValue: number,
  variance: number = 0.1,
  trend: 'up' | 'down' | 'neutral' = 'neutral'
): number {
  const randomChange = (Math.random() - 0.5) * variance * 2
  const trendMultiplier = trend === 'up' ? 1.02 : trend === 'down' ? 0.98 : 1.0
  return Math.max(0, baseValue * trendMultiplier + randomChange)
}

/**
 * Simulate real-time status changes
 */
export function simulateStatusChange(
  currentStatus: string,
  possibleStatuses: string[],
  changeProbability: number = 0.05
): string {
  if (Math.random() < changeProbability && possibleStatuses.length > 0) {
    const availableStatuses = possibleStatuses.filter((s) => s !== currentStatus)
    if (availableStatuses.length > 0) {
      return availableStatuses[Math.floor(Math.random() * availableStatuses.length)]
    }
  }
  return currentStatus
}

/**
 * Simulate real-time count updates
 */
export function simulateCountUpdate(
  currentCount: number,
  minChange: number = -5,
  maxChange: number = 10
): number {
  const change = Math.floor(Math.random() * (maxChange - minChange + 1)) + minChange
  return Math.max(0, currentCount + change)
}

/**
 * Simulate real-time percentage updates
 */
export function simulatePercentageUpdate(
  currentPercentage: number,
  variance: number = 2
): number {
  const change = (Math.random() - 0.5) * variance * 2
  return Math.max(0, Math.min(100, currentPercentage + change))
}

/**
 * Simulate real-time location updates (for tracking)
 */
export function simulateLocationUpdate(
  currentLocation: { lat: number; lng: number },
  speed: number = 0.001
): { lat: number; lng: number } {
  return {
    lat: currentLocation.lat + (Math.random() - 0.5) * speed,
    lng: currentLocation.lng + (Math.random() - 0.5) * speed,
  }
}

/**
 * Simulate real-time timestamp updates
 */
export function simulateTimestampUpdate(baseDate: Date, forward: boolean = true): Date {
  const minutes = forward ? Math.random() * 60 : -Math.random() * 60
  return new Date(baseDate.getTime() + minutes * 60 * 1000)
}

/**
 * Simulate real-time metric updates with trend
 */
export function simulateMetricWithTrend(
  baseValue: number,
  trend: 'up' | 'down' | 'stable',
  variance: number = 0.05
): { value: number; trend: 'up' | 'down' | 'stable'; change: number } {
  const randomFactor = 1 + (Math.random() - 0.5) * variance * 2
  let trendFactor = 1
  let change = 0

  switch (trend) {
    case 'up':
      trendFactor = 1.01
      change = baseValue * 0.01 * randomFactor
      break
    case 'down':
      trendFactor = 0.99
      change = -baseValue * 0.01 * randomFactor
      break
    case 'stable':
      trendFactor = 1.0
      change = baseValue * (Math.random() - 0.5) * variance
      break
  }

  const newValue = baseValue * trendFactor * randomFactor
  return {
    value: Math.max(0, newValue),
    trend: change > 0.01 ? 'up' : change < -0.01 ? 'down' : 'stable',
    change: Math.abs(change),
  }
}

/**
 * Simulate real-time alerts/notifications
 */
export function simulateAlert(
  alertTypes: string[],
  probability: number = 0.02
): { type: string; message: string; severity: 'info' | 'warning' | 'error' } | null {
  if (Math.random() < probability && alertTypes.length > 0) {
    const type = alertTypes[Math.floor(Math.random() * alertTypes.length)]
    const severities: Array<'info' | 'warning' | 'error'> = ['info', 'warning', 'error']
    const severity = severities[Math.floor(Math.random() * severities.length)]

    const messages: Record<string, string> = {
      delay: 'Shipment delay detected',
      damage: 'Damage reported on incoming shipment',
      shortage: 'Quantity shortage detected',
      quality: 'Quality issue identified',
      exception: 'Exception requires attention',
      completion: 'Task completed successfully',
      update: 'Status update available',
    }

    return {
      type,
      message: messages[type] || 'New alert',
      severity,
    }
  }
  return null
}

/**
 * Hook for React components to use real-time simulation
 * 
 * Usage in components:
 * 
 * import { useState, useEffect } from 'react'
 * import { realtimeSimulator } from '@/utils/realtimeDataSimulator'
 * 
 * function MyComponent() {
 *   const [data, setData] = useState<T | null>(null)
 *   
 *   useEffect(() => {
 *     const unsubscribe = realtimeSimulator.subscribe<T>('myDataType', (newData) => {
 *       setData(newData)
 *     })
 *     
 *     const stop = realtimeSimulator.start('myDataType', generator, 5000, true)
 *     
 *     return () => {
 *       unsubscribe()
 *       stop()
 *     }
 *   }, [])
 *   
 *   return <div>Use data here</div>
 * }
 */

