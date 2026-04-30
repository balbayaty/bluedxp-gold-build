'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ViewContext, createViewContext, ViewContextPreset, DEFAULT_VIEW_CONTEXTS } from '@/types/viewContext'
import { User, UserRole } from '@/types/user'
import { viewContextService } from '@/lib/services/user/viewContextService'

interface ViewContextProviderProps {
  children: React.ReactNode
  user: User
}

interface ViewContextContextType {
  context: ViewContext
  updateContext: (updates: Partial<ViewContext>) => void
  resetContext: () => void
  savePreset: (name: string, description?: string) => void
  loadPreset: (preset: ViewContextPreset) => void
  presets: ViewContextPreset[]
  setCustomerFilter: (type: 'ALL' | 'SINGLE' | 'MULTIPLE' | 'ASSIGNED', customerIds?: string[]) => void
  setWarehouseFilter: (type: 'ALL' | 'SINGLE' | 'MULTIPLE' | 'ASSIGNED', warehouseIds?: string[]) => void
  setDateRange: (type: string, startDate?: Date, endDate?: Date) => void
  getContextDescription: () => string
}

const ViewContextContext = createContext<ViewContextContextType | undefined>(undefined)

export function ViewContextProvider({ children, user }: ViewContextProviderProps) {
  const [context, setContext] = useState<ViewContext>(() => {
    // Use enhanced ViewContext service if available
    if (typeof window !== 'undefined') {
      // Build context asynchronously on mount
      viewContextService.buildViewContext(user.id).then(ctx => {
        setContext(ctx)
      }).catch(() => {
        // Fallback to basic context
        return createViewContext(user.id, user.role, user.tenantId, {
          customerFilter: user.assignedCustomers && user.assignedCustomers.length > 0
            ? { type: 'ASSIGNED', customerIds: user.assignedCustomers, includeSubCustomers: true }
            : { type: 'ALL' },
          warehouseFilter: user.assignedWarehouses && user.assignedWarehouses.length > 0
            ? { type: 'ASSIGNED', warehouseIds: user.assignedWarehouses }
            : { type: 'ALL' },
        })
      })
    }

    // Initial context (will be updated async)
    return createViewContext(user.id, user.role, user.tenantId, {
      customerFilter: user.assignedCustomers && user.assignedCustomers.length > 0
        ? { type: 'ASSIGNED', customerIds: user.assignedCustomers, includeSubCustomers: true }
        : { type: 'ALL' },
      warehouseFilter: user.assignedWarehouses && user.assignedWarehouses.length > 0
        ? { type: 'ASSIGNED', warehouseIds: user.assignedWarehouses }
        : { type: 'ALL' },
    })
  })
  
  const [presets, setPresets] = useState<ViewContextPreset[]>(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`view-context-presets-${user.id}`)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          return []
        }
      }
    }
    return []
  })

  // Save presets to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`view-context-presets-${user.id}`, JSON.stringify(presets))
    }
  }, [presets, user.id])

  const updateContext = useCallback((updates: Partial<ViewContext>) => {
    setContext(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date(),
    }))
  }, [])

  const resetContext = useCallback(() => {
    // Use enhanced service if available
    if (typeof window !== 'undefined') {
      viewContextService.refreshViewContext(user.id, context)
        .then(ctx => {
          setContext(ctx)
        })
        .catch(() => {
          // Fallback to basic context
          setContext(createViewContext(user.id, user.role, user.tenantId, {
            customerFilter: user.assignedCustomers && user.assignedCustomers.length > 0
              ? { type: 'ASSIGNED', customerIds: user.assignedCustomers, includeSubCustomers: true }
              : { type: 'ALL' },
            warehouseFilter: user.assignedWarehouses && user.assignedWarehouses.length > 0
              ? { type: 'ASSIGNED', warehouseIds: user.assignedWarehouses }
              : { type: 'ALL' },
          }))
        })
    } else {
      setContext(createViewContext(user.id, user.role, user.tenantId, {
        customerFilter: user.assignedCustomers && user.assignedCustomers.length > 0
          ? { type: 'ASSIGNED', customerIds: user.assignedCustomers, includeSubCustomers: true }
          : { type: 'ALL' },
        warehouseFilter: user.assignedWarehouses && user.assignedWarehouses.length > 0
          ? { type: 'ASSIGNED', warehouseIds: user.assignedWarehouses }
          : { type: 'ALL' },
      }))
    }
  }, [user, context])

  const savePreset = useCallback((name: string, description?: string) => {
    const preset: ViewContextPreset = {
      id: `preset-${Date.now()}`,
      name,
      description: description || '',
      context: {
        customerFilter: context.customerFilter,
        warehouseFilter: context.warehouseFilter,
        dateRange: context.dateRange,
        level: context.level,
        scope: context.scope,
        groupBy: context.groupBy,
        sortBy: context.sortBy,
      },
      role: user.role,
    }
    setPresets(prev => [...prev, preset])
  }, [context, user.role])

  const loadPreset = useCallback((preset: ViewContextPreset) => {
    if (preset.context) {
      updateContext(preset.context)
    }
  }, [updateContext])

  const setCustomerFilter = useCallback((
    type: 'ALL' | 'SINGLE' | 'MULTIPLE' | 'ASSIGNED',
    customerIds?: string[]
  ) => {
    updateContext({
      customerFilter: {
        type,
        customerIds: type === 'ASSIGNED' ? user.assignedCustomers : customerIds,
      },
    })
  }, [updateContext, user.assignedCustomers])

  const setWarehouseFilter = useCallback((
    type: 'ALL' | 'SINGLE' | 'MULTIPLE' | 'ASSIGNED',
    warehouseIds?: string[]
  ) => {
    updateContext({
      warehouseFilter: {
        type,
        warehouseIds: type === 'ASSIGNED' ? user.assignedWarehouses : warehouseIds,
      },
    })
  }, [updateContext, user.assignedWarehouses])

  const setDateRange = useCallback((
    type: string,
    startDate?: Date,
    endDate?: Date
  ) => {
    updateContext({
      dateRange: {
        type: type as any,
        startDate,
        endDate,
      },
    })
  }, [updateContext])

  const getContextDescription = useCallback(() => {
    const parts: string[] = []
    
    // Customer filter
    switch (context.customerFilter.type) {
      case 'ALL':
        parts.push('All Customers')
        break
      case 'SINGLE':
        parts.push(`Customer: ${context.customerFilter.customerIds?.[0] || 'N/A'}`)
        break
      case 'MULTIPLE':
        parts.push(`${context.customerFilter.customerIds?.length || 0} Customers`)
        break
      case 'ASSIGNED':
        parts.push('Assigned Customers')
        break
    }
    
    // Warehouse filter
    switch (context.warehouseFilter.type) {
      case 'ALL':
        parts.push('All Warehouses')
        break
      case 'SINGLE':
        parts.push(`Warehouse: ${context.warehouseFilter.warehouseIds?.[0] || 'N/A'}`)
        break
      case 'MULTIPLE':
        parts.push(`${context.warehouseFilter.warehouseIds?.length || 0} Warehouses`)
        break
      case 'ASSIGNED':
        parts.push('Assigned Warehouses')
        break
    }
    
    // Date range
    if (context.dateRange) {
      parts.push(`Date: ${context.dateRange.type}`)
    }
    
    return parts.join(' • ')
  }, [context])

  const value: ViewContextContextType = {
    context,
    updateContext,
    resetContext,
    savePreset,
    loadPreset,
    presets,
    setCustomerFilter,
    setWarehouseFilter,
    setDateRange,
    getContextDescription,
  }

  return (
    <ViewContextContext.Provider value={value}>
      {children}
    </ViewContextContext.Provider>
  )
}

export function useViewContext() {
  const context = useContext(ViewContextContext)
  if (context === undefined) {
    throw new Error('useViewContext must be used within a ViewContextProvider')
  }
  return context
}

