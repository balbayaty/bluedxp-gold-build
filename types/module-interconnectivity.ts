/**
 * Module Interconnectivity Types
 * Defines connections between all modules in the system
 */

// Cross-Module Data Types
export interface CrossModuleReference {
  sourceModule: ModuleId
  targetModule: ModuleId
  referenceType: ReferenceType
  referenceId: string
  metadata?: Record<string, any>
}

export type ModuleId = 
  | 'proposals-rfq'
  | 'wms'
  | 'tms'
  | 'iso-ims'
  | 'qhse'
  | 'ai-vision'
  | 'customs'
  | 'erp'

export type ReferenceType =
  | 'CUSTOMER'
  | 'SHIPMENT'
  | 'WAREHOUSE'
  | 'CARRIER'
  | 'DOCUMENT'
  | 'PRODUCT'
  | 'ORDER'
  | 'INVOICE'
  | 'COMPLIANCE'
  | 'AUDIT'

// Module Integration Points
export interface ModuleIntegrationPoint {
  module: ModuleId
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  dataType: string
  description: string
}

// Proposals-RFQ Module Integrations
export const PROPOSALS_INTEGRATIONS: ModuleIntegrationPoint[] = [
  // WMS Integrations
  {
    module: 'wms',
    endpoint: '/api/wms/inventory',
    method: 'GET',
    dataType: 'InventoryData',
    description: 'Get current inventory levels for proposal capacity planning'
  },
  {
    module: 'wms',
    endpoint: '/api/wms/warehouse-capacity',
    method: 'GET',
    dataType: 'CapacityData',
    description: 'Get warehouse capacity for storage proposals'
  },
  {
    module: 'wms',
    endpoint: '/api/wms/handling-rates',
    method: 'GET',
    dataType: 'RateData',
    description: 'Get handling rates for pricing'
  },
  
  // TMS Integrations
  {
    module: 'tms',
    endpoint: '/api/transportation/carriers',
    method: 'GET',
    dataType: 'CarrierData',
    description: 'Get available carriers for transport proposals'
  },
  {
    module: 'tms',
    endpoint: '/api/transportation/quotes',
    method: 'POST',
    dataType: 'QuoteRequest',
    description: 'Request transport quotes for proposal pricing'
  },
  {
    module: 'tms',
    endpoint: '/api/transportation/routes',
    method: 'GET',
    dataType: 'RouteData',
    description: 'Get route options for logistics proposals'
  },
  
  // Customs Integrations
  {
    module: 'customs',
    endpoint: '/api/transportation/customs/rates',
    method: 'GET',
    dataType: 'CustomsRateData',
    description: 'Get customs clearance rates'
  },
  {
    module: 'customs',
    endpoint: '/api/transportation/customs/requirements',
    method: 'GET',
    dataType: 'CustomsRequirements',
    description: 'Get customs requirements by route'
  },
  
  // ISO-IMS Integrations
  {
    module: 'iso-ims',
    endpoint: '/api/compliance/certifications',
    method: 'GET',
    dataType: 'CertificationData',
    description: 'Get company certifications for proposals'
  },
  {
    module: 'iso-ims',
    endpoint: '/api/compliance/sla-templates',
    method: 'GET',
    dataType: 'SLATemplate',
    description: 'Get SLA templates for proposals'
  },
  
  // ERP Integrations
  {
    module: 'erp',
    endpoint: '/api/erp/customers',
    method: 'GET',
    dataType: 'CustomerData',
    description: 'Get customer data from ERP'
  },
  {
    module: 'erp',
    endpoint: '/api/erp/pricing-rules',
    method: 'GET',
    dataType: 'PricingRules',
    description: 'Get pricing rules from ERP'
  },
  {
    module: 'erp',
    endpoint: '/api/erp/quotations',
    method: 'POST',
    dataType: 'ERPQuotation',
    description: 'Create quotation in ERP'
  }
]

// Event Types for Module Communication
export interface ModuleEvent {
  type: ModuleEventType
  sourceModule: ModuleId
  timestamp: string
  data: Record<string, any>
}

export type ModuleEventType =
  | 'RFQ_CREATED'
  | 'RFQ_UPDATED'
  | 'RFQ_SUBMITTED'
  | 'PROPOSAL_CREATED'
  | 'PROPOSAL_APPROVED'
  | 'PROPOSAL_SENT'
  | 'PROPOSAL_ACCEPTED'
  | 'SHIPMENT_CREATED'
  | 'SHIPMENT_COMPLETED'
  | 'INVENTORY_UPDATED'
  | 'CARRIER_ASSIGNED'
  | 'CUSTOMS_CLEARED'
  | 'DOCUMENT_UPLOADED'

// Data Sync Configuration
export interface SyncConfiguration {
  sourceModule: ModuleId
  targetModule: ModuleId
  dataType: string
  syncFrequency: 'REALTIME' | 'HOURLY' | 'DAILY' | 'ON_DEMAND'
  direction: 'ONE_WAY' | 'BIDIRECTIONAL'
  transformations?: DataTransformation[]
}

export interface DataTransformation {
  sourceField: string
  targetField: string
  transform?: (value: any) => any
}

// Default Sync Configurations
export const DEFAULT_SYNC_CONFIGS: SyncConfiguration[] = [
  {
    sourceModule: 'erp',
    targetModule: 'proposals-rfq',
    dataType: 'Customer',
    syncFrequency: 'REALTIME',
    direction: 'ONE_WAY'
  },
  {
    sourceModule: 'proposals-rfq',
    targetModule: 'tms',
    dataType: 'Shipment',
    syncFrequency: 'REALTIME',
    direction: 'ONE_WAY'
  },
  {
    sourceModule: 'proposals-rfq',
    targetModule: 'wms',
    dataType: 'StorageBooking',
    syncFrequency: 'REALTIME',
    direction: 'ONE_WAY'
  },
  {
    sourceModule: 'proposals-rfq',
    targetModule: 'erp',
    dataType: 'Quotation',
    syncFrequency: 'REALTIME',
    direction: 'BIDIRECTIONAL'
  }
]

// Module Interconnection Helper
export function getModuleIntegrations(moduleId: ModuleId): ModuleIntegrationPoint[] {
  return PROPOSALS_INTEGRATIONS.filter(i => i.module === moduleId || moduleId === 'proposals-rfq')
}

// Data Aggregation Types
export interface AggregatedProposalData {
  rfq: any
  warehouseCapacity?: any
  transportQuotes?: any[]
  customsRequirements?: any
  customerHistory?: any
  pricingRules?: any
}

// Workflow Orchestration
export interface WorkflowStep {
  id: string
  name: string
  module: ModuleId
  action: string
  dependsOn?: string[]
  parallel?: boolean
}

export interface ProposalWorkflow {
  id: string
  name: string
  steps: WorkflowStep[]
}

export const PROPOSAL_GENERATION_WORKFLOW: ProposalWorkflow = {
  id: 'proposal-gen',
  name: 'Proposal Generation Workflow',
  steps: [
    {
      id: 'fetch-customer',
      name: 'Fetch Customer Data',
      module: 'erp',
      action: 'GET_CUSTOMER'
    },
    {
      id: 'fetch-capacity',
      name: 'Check Warehouse Capacity',
      module: 'wms',
      action: 'GET_CAPACITY',
      parallel: true
    },
    {
      id: 'get-transport-quotes',
      name: 'Get Transport Quotes',
      module: 'tms',
      action: 'GET_QUOTES',
      parallel: true
    },
    {
      id: 'get-customs-requirements',
      name: 'Get Customs Requirements',
      module: 'customs',
      action: 'GET_REQUIREMENTS',
      dependsOn: ['fetch-customer']
    },
    {
      id: 'calculate-pricing',
      name: 'Calculate Pricing',
      module: 'proposals-rfq',
      action: 'CALCULATE_PRICE',
      dependsOn: ['fetch-capacity', 'get-transport-quotes', 'get-customs-requirements']
    },
    {
      id: 'generate-proposal',
      name: 'Generate Proposal Document',
      module: 'proposals-rfq',
      action: 'GENERATE_DOCUMENT',
      dependsOn: ['calculate-pricing']
    }
  ]
}


