/**
 * Business Intelligence Types
 * Unified BI aggregating analytics from all modules (NO DUPLICATION)
 * Only creates new types for BI-specific functionality
 */

// ============================================================================
// REUSED TYPES (No Duplication)
// ============================================================================

// All analytics data comes from existing module services (read-only, no duplication)

// ============================================================================
// NEW TYPES (Only for New Functionality)
// ============================================================================

export interface UnifiedBIData {
  // Aggregated from all modules (read-only, no duplication)
  wms: {
    inventoryMetrics: any
    orderMetrics: any
    warehouseMetrics: any
  }
  hr: {
    employeeMetrics: any
    attendanceMetrics: any
    performanceMetrics: any
  }
  finance: {
    financialMetrics: any
    budgetMetrics: any
    costMetrics: any
  }
  crm: {
    salesMetrics: any
    pipelineMetrics: any
    customerMetrics: any
  }
  qhse: {
    complianceMetrics: any
    safetyMetrics: any
    qualityMetrics: any
  }
  facility: {
    assetMetrics: any
    maintenanceMetrics: any
    spaceMetrics: any
  }
  tms: {
    transportationMetrics: any
    shipmentMetrics: any
    carrierMetrics: any
  }
  project: {
    projectMetrics: any
    resourceMetrics: any
    budgetMetrics: any
  }
}

export interface BIDashboard {
  id: string
  tenantId: string
  name: string
  description?: string
  widgets: BIWidget[]
  layout: 'grid' | 'custom'
  filters: BIFilter[]
  refreshInterval?: number // seconds
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
}

export interface BIWidget {
  id: string
  type: 'KPI' | 'CHART' | 'TABLE' | 'MAP' | 'GAUGE' | 'HEATMAP'
  title: string
  dataSource: {
    module: string
    service: string
    method: string
    params?: Record<string, any>
  }
  config: {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
    timeRange?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
    dimensions?: string[]
    measures?: string[]
  }
  position: { x: number; y: number; w: number; h: number }
  refreshInterval?: number
}

export interface BIFilter {
  id: string
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in'
  value: any
}

export interface DataWarehouseTable {
  id: string
  name: string
  module: string
  schema: DataWarehouseColumn[]
  lastSyncAt?: Date | string
  recordCount: number
}

export interface DataWarehouseColumn {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean' | 'json'
  nullable: boolean
  description?: string
}

export interface ETLJob {
  id: string
  name: string
  source: {
    module: string
    service: string
    method: string
  }
  destination: {
    table: string
    mode: 'append' | 'replace' | 'upsert'
  }
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
    time?: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  status: 'ACTIVE' | 'PAUSED' | 'FAILED'
  lastRunAt?: Date | string
  nextRunAt?: Date | string
  lastRunStatus?: 'SUCCESS' | 'FAILED' | 'PARTIAL'
  lastRunRecords?: number
  createdAt: Date | string
  updatedAt: Date | string
}

export interface BIReport {
  id: string
  tenantId: string
  name: string
  description?: string
  type: 'OPERATIONAL' | 'FINANCIAL' | 'ANALYTICAL' | 'EXECUTIVE'
  modules: string[] // Which modules to include
  format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON' | 'HTML'
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
    time?: string
    recipients?: string[]
  }
  filters?: BIFilter[]
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string
}

// ============================================================================
// BI INTEGRATION TYPES
// ============================================================================

export interface BIIntegration {
  module: string
  enabled: boolean
  syncFrequency: 'realtime' | 'hourly' | 'daily'
  lastSyncAt?: Date | string
  tables: string[]
}

export interface UnifiedBIConfig {
  tenantId: string
  integrations: BIIntegration[]
  dataRetentionDays: number
  enableRealTimeSync: boolean
  enableDataWarehouse: boolean
}

