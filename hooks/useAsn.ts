/**
 * ASN React Hooks
 * Custom hooks for ASN operations
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ASN, ASNListResponse, ASNQueryParams, CreateASNRequest, UpdateASNRequest } from '@/types/asn'

/**
 * Hook for fetching ASN list
 */
export function useAsnList(params?: ASNQueryParams) {
  const [data, setData] = useState<ASNListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAsns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.status) queryParams.append('status', params.status.join(','))
      if (params?.supplierId) queryParams.append('supplierId', params.supplierId)
      if (params?.warehouseId) queryParams.append('warehouseId', params.warehouseId)
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom.toISOString())
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo.toISOString())
      if (params?.search) queryParams.append('search', params.search)
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)
      if (params?.includeItems) queryParams.append('includeItems', 'true')
      if (params?.includeExceptions) queryParams.append('includeExceptions', 'true')
      if (params?.includeDocuments) queryParams.append('includeDocuments', 'true')

      const response = await fetch(`/api/asn?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch ASNs')
      }

      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchAsns()
  }, [fetchAsns])

  return { data, loading, error, refetch: fetchAsns }
}

/**
 * Hook for fetching single ASN
 */
export function useAsn(asnId: string, options?: {
  includeItems?: boolean
  includeExceptions?: boolean
  includeDocuments?: boolean
}) {
  const [data, setData] = useState<ASN | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!asnId) {
      setLoading(false)
      return
    }

    const fetchAsn = async () => {
      try {
        setLoading(true)
        setError(null)

        const queryParams = new URLSearchParams()
        if (options?.includeItems !== false) queryParams.append('includeItems', 'true')
        if (options?.includeExceptions !== false) queryParams.append('includeExceptions', 'true')
        if (options?.includeDocuments !== false) queryParams.append('includeDocuments', 'true')

        const response = await fetch(`/api/asn/${asnId}?${queryParams.toString()}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('ASN not found')
          } else {
            throw new Error('Failed to fetch ASN')
          }
        } else {
          const result = await response.json()
          setData(result)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAsn()
  }, [asnId, options])

  return { data, loading, error }
}

/**
 * Hook for creating ASN
 */
export function useCreateAsn() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createAsn = useCallback(async (request: CreateASNRequest) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/asn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create ASN')
      }

      const result = await response.json()
      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createAsn, loading, error }
}

/**
 * Hook for updating ASN
 */
export function useUpdateAsn() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateAsn = useCallback(async (asnId: string, request: UpdateASNRequest) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/asn/${asnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update ASN')
      }

      const result = await response.json()
      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { updateAsn, loading, error }
}

/**
 * Hook for ASN predictions
 */
export function useAsnPrediction(asnId: string, type: 'arrival' | 'exception' | 'quality' = 'arrival') {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrediction = useCallback(async () => {
    if (!asnId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/asn/${asnId}/predict?type=${type}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch prediction')
      }

      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [asnId, type])

  useEffect(() => {
    fetchPrediction()
  }, [fetchPrediction])

  return { data, loading, error, refetch: fetchPrediction }
}

/**
 * Hook for ASN analytics dashboard
 */
export function useAsnDashboard(type: 'executive' | 'operational' | 'analytical' = 'executive', days: number = 30) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/asn/analytics/dashboard?type=${type}&days=${days}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const result = await response.json()
        setData(result)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [type, days])

  return { data, loading, error }
}


