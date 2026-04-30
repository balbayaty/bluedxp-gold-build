/**
 * Proposals & RFQ Types Index
 * Re-exports all proposal-related types
 */

// RFQ Types
export * from './rfq'

// Service Catalog Types
export * from './service-catalog'

// Train Schedule Types
export * from './train-schedules'

// Journey Analysis Types
export * from './journey-analysis'

// Module Interconnectivity
export * from './module-interconnectivity'

// Re-export key types for convenience
export type {
  RFQ,
  RFQStatus,
  RFQPriority,
  RFQCustomer,
  ServiceRequirement,
  RouteRequirement,
  RFQWorkflow
} from './rfq'

export type {
  ServiceCatalog,
  CatalogService,
  RateCard,
  ServiceBundle
} from './service-catalog'

export type {
  TrainSchedule,
  TrainStation,
  TrainRoute,
  TrainScheduleSystem
} from './train-schedules'

export type {
  JourneyTouchpoint,
  JourneyAnalysis,
  OptimizationOpportunity
} from './journey-analysis'

export type {
  ModuleIntegrationPoint,
  CrossModuleReference,
  ModuleEvent
} from './module-interconnectivity'


