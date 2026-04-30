/**
 * React Hook for Evidence Packets
 * 
 * Provides easy access to evidence packet operations in React components
 * 
 * @module hooks
 */

import { useState, useCallback } from 'react'
import { evidencePacketService } from '@/lib/services/evidence/packet-service'
import type { EvidencePacket, EvidencePacketRequest, Actor, CourtReadyPacket } from '@/lib/services/evidence/packet-types'

export interface UseEvidencePacketResult {
  packet: EvidencePacket | null
  loading: boolean
  error: Error | null
  generate: (request: EvidencePacketRequest, actor: Actor) => Promise<void>
  verify: (packetId: string) => Promise<any>
  generateCourtReady: (packetId: string, caseNumber?: string) => Promise<CourtReadyPacket | null>
  reset: () => void
}

/**
 * Hook to manage evidence packets
 */
export function useEvidencePacket(): UseEvidencePacketResult {
  const [packet, setPacket] = useState<EvidencePacket | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const generate = useCallback(async (request: EvidencePacketRequest, actor: Actor) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await evidencePacketService.generatePacket(request, actor)
      setPacket(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate evidence packet'))
      setPacket(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const verify = useCallback(async (packetId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      return await evidencePacketService.verifyPacket(packetId)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to verify packet'))
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const generateCourtReady = useCallback(async (packetId: string, caseNumber?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      return await evidencePacketService.generateCourtReadyPacket(packetId, caseNumber)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate court-ready packet'))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setPacket(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    packet,
    loading,
    error,
    generate,
    verify,
    generateCourtReady,
    reset,
  }
}

