/**
 * Warehouse Areas Hook
 * React hook for managing warehouse areas
 * BlueDXP Platform
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { warehouseAreaService } from '@/lib/services/wms/areaService'
import type { WarehouseArea, WarehouseAreaFilters } from '@/types/warehouseArea'

export function useWarehouseAreas(filters?: WarehouseAreaFilters) {
  const [areas, setAreas] = useState<WarehouseArea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAreas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await warehouseAreaService.listAreas(filters || {})
      setAreas(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch areas'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchAreas()
  }, [fetchAreas])

  const createArea = useCallback(async (data: any) => {
    try {
      const newArea = await warehouseAreaService.createArea(data)
      setAreas(prev => [...prev, newArea])
      return newArea
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create area'))
      throw err
    }
  }, [])

  const updateArea = useCallback(async (id: string, data: any) => {
    try {
      const updated = await warehouseAreaService.updateArea(id, data)
      setAreas(prev => prev.map(area => area.id === id ? updated : area))
      return updated
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update area'))
      throw err
    }
  }, [])

  const deleteArea = useCallback(async (id: string) => {
    try {
      await warehouseAreaService.deleteArea(id)
      setAreas(prev => prev.filter(area => area.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete area'))
      throw err
    }
  }, [])

  return {
    areas,
    loading,
    error,
    refetch: fetchAreas,
    createArea,
    updateArea,
    deleteArea
  }
}











