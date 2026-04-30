/**
 * Vision Integration Types
 * Types for cross-module vision integration
 */

export interface VisionIntegrationContext {
  module: 'wms' | 'qhse' | 'iso-ims' | 'tms' | 'hr' | 'facility'
  entityType: string
  entityId: string
  photo?: File | string
  metadata?: Record<string, any>
  tenantId?: string
  userId?: string
}

export interface IntegrationAction {
  type: 'create_ncr' | 'create_incident' | 'create_capa' | 'update_inventory' | 
        'notify_customer' | 'calculate_liability' | 'generate_claim' | 
        'update_carrier_score' | 'update_supplier_score' | 'store_knowledge'
  module: string
  entityType: string
  parameters: Record<string, any>
  priority: 'low' | 'medium' | 'high' | 'urgent'
  autoExecute: boolean
}

export interface IntegrationResult {
  integrationId: string
  context: VisionIntegrationContext
  actions: IntegrationAction[]
  executedActions: Array<{
    action: IntegrationAction
    status: 'success' | 'failed' | 'pending' | 'skipped'
    result?: any
    error?: string
  }>
  recommendations: string[]
  createdAt: Date | string
}








