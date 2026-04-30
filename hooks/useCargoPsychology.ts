/**
 * React Hook for Cargo Psychology
 * 
 * Provides easy access to psychology state in React components
 * 
 * @module hooks
 */

import { useState, useEffect, useCallback } from 'react'
import { cargoPsychologyService } from '@/lib/services/cargo-psychology'
import type { ShipmentPsychologyState, InterventionAction } from '@/lib/services/cargo-psychology/types'

export interface UseCargoPsychologyResult {
  psychologyState: ShipmentPsychologyState | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  executeIntervention: (action: InterventionAction, channel?: string) => Promise<void>
}

/**
 * Hook to get and manage cargo psychology state
 */
export function useCargoPsychology(shipmentId: string | null): UseCargoPsychologyResult {
  const [psychologyState, setPsychologyState] = useState<ShipmentPsychologyState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadPsychologyState = useCallback(async () => {
    if (!shipmentId) {
      setPsychologyState(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      let state = await cargoPsychologyService.getPsychologyState(shipmentId)
      
      // If not found, analyze
      if (!state) {
        state = await cargoPsychologyService.analyzeShipment(shipmentId)
      }
      
      setPsychologyState(state)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load psychology state'))
      setPsychologyState(null)
    } finally {
      setLoading(false)
    }
  }, [shipmentId])

  useEffect(() => {
    loadPsychologyState()
  }, [shipmentId, loadPsychologyState])

  const executeIntervention = useCallback(async (action: InterventionAction, channel?: string) => {
    if (!shipmentId) return

    try {
      await cargoPsychologyService.executeIntervention(shipmentId, action, channel)
      // Refresh state after intervention
      await loadPsychologyState()
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to execute intervention'))
    }
  }, [shipmentId, loadPsychologyState])

  return {
    psychologyState,
    loading,
    error,
    refresh: loadPsychologyState,
    executeIntervention,
  }
}

