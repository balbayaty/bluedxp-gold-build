/**
 * React Hook for Quantum State
 * 
 * Provides easy access to quantum state in React components
 * Handles real-time updates via subscriptions
 * 
 * @module hooks
 */

import { useState, useEffect, useCallback } from 'react'
import { schrodingersTruckService } from '@/lib/services/schrodingers-truck'
import type { ShipmentQuantumState } from '@/lib/services/schrodingers-truck/types'

export interface UseQuantumStateResult {
  quantumState: ShipmentQuantumState | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  collapse: (trigger: string, triggerData?: Record<string, any>) => Promise<void>
}

/**
 * Hook to get and subscribe to quantum state updates
 */
export function useQuantumState(shipmentId: string | null): UseQuantumStateResult {
  const [quantumState, setQuantumState] = useState<ShipmentQuantumState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadQuantumState = useCallback(async () => {
    if (!shipmentId) {
      setQuantumState(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const state = await schrodingersTruckService.getQuantumState(shipmentId)
      setQuantumState(state)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load quantum state'))
      setQuantumState(null)
    } finally {
      setLoading(false)
    }
  }, [shipmentId])

  useEffect(() => {
    loadQuantumState()

    // Subscribe to updates
    if (shipmentId) {
      const unsubscribe = schrodingersTruckService.subscribeToUpdates(
        shipmentId,
        (updatedState) => {
          setQuantumState(updatedState)
        }
      )

      return () => {
        unsubscribe()
      }
    }
  }, [shipmentId, loadQuantumState])

  const collapse = useCallback(async (trigger: string, triggerData?: Record<string, any>) => {
    if (!shipmentId) return

    try {
      await schrodingersTruckService.updateQuantumState(
        shipmentId,
        trigger as any,
        triggerData
      )
      // State will be updated via subscription
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to collapse quantum state'))
    }
  }, [shipmentId])

  return {
    quantumState,
    loading,
    error,
    refresh: loadQuantumState,
    collapse,
  }
}

