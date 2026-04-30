/**
 * Warehouse Locations Hook
 * React hook for managing warehouse locations
 * BlueDXP Platform
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { warehouseLocationService } from '@/lib/services/wms/locationService'
import type { StorageLocation, StorageLocationFilters } from '@/types/warehouseLocation'

export function useWarehouseLocations(filters?: StorageLocationFilters) {
  const [locations, setLocations] = useState<StorageLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await warehouseLocationService.listLocations(filters || {})
      setLocations(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch locations'))
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const createLocation = useCallback(async (data: any) => {
    try {
      const newLocation = await warehouseLocationService.createLocation(data)
      setLocations(prev => [...prev, newLocation])
      return newLocation
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create location'))
      throw err
    }
  }, [])

  const updateLocation = useCallback(async (id: string, data: any) => {
    try {
      const updated = await warehouseLocationService.updateLocation(id, data)
      setLocations(prev => prev.map(loc => loc.id === id ? updated : loc))
      return updated
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update location'))
      throw err
    }
  }, [])

  const deleteLocation = useCallback(async (id: string) => {
    try {
      await warehouseLocationService.deleteLocation(id)
      setLocations(prev => prev.filter(loc => loc.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete location'))
      throw err
    }
  }, [])

  return {
    locations,
    loading,
    error,
    refetch: fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation
  }
}











