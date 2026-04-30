/**
 * Project Management Types
 * REFERENCES WMS tasks and Facility work orders (NO DUPLICATION)
 * Only creates new types for project-specific functionality
 */

import type { WorkOrder } from '@/types/facility'

// ============================================================================
// REFERENCED TYPES (No Duplication)
// ============================================================================

// Reference Facility work orders (no duplication)
export type { WorkOrder }

// WMS Task type would be referenced (need to find it)
// For now, using a generic reference

// ============================================================================
// NEW TYPES (Only for New Functionality)
// ============================================================================

export interface Project {
  id: string
  tenantId: string
  name: string
  description?: string
  projectType: 'OPERATIONAL' | 'STRATEGIC' | 'IMPROVEMENT' | 'MAINTENANCE' | 'EXPANSION'
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  
  // References to existing tasks/work orders (no duplication)
  taskIds: string[] // References WMS tasks
  workOrderIds: string[] // References Facility work orders
  
  // Project-specific fields
  startDate: Date | string
  endDate?: Date | string
  actualStartDate?: Date | string
  actualEndDate?: Date | string
  
  // Budget (links to Finance budget)
  budgetId?: string
  budgetedCost: number
  actualCost: number
  currency: string
  
  // Resources (references HR employees, WMS resources, Facility assets)
  resourceIds: {
    employees: string[] // References HR employees
    wmsResources: string[] // References WMS resources
    facilityAssets: string[] // References Facility assets
  }
  
  // Milestones
  milestones: Milestone[]
  
  // Dependencies
  dependencies: ProjectDependency[]
  
  // Project team
  projectManagerId?: string
  teamMembers: string[] // User IDs
  
  createdAt: Date | string
  createdBy: string
  updatedAt: Date | string
}

export interface Milestone {
  id: string
  projectId: string
  name: string
  description?: string
  targetDate: Date | string
  actualDate?: Date | string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED'
  dependencies: string[] // Other milestone IDs
}

export interface ProjectDependency {
  id: string
  fromProjectId?: string
  fromTaskId?: string
  fromWorkOrderId?: string
  toProjectId?: string
  toTaskId?: string
  toWorkOrderId?: string
  type: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH'
  lag?: number // days
}

export interface GanttTask {
  id: string
  name: string
  startDate: Date | string
  endDate: Date | string
  duration: number // days
  progress: number // 0-100
  dependencies: string[] // Task IDs
  resourceIds: string[]
  type: 'WMS_TASK' | 'FACILITY_WORK_ORDER' | 'PROJECT_TASK'
  sourceId: string // References WMS task ID or Facility work order ID
}

export interface ResourceAllocation {
  id: string
  projectId: string
  resourceType: 'EMPLOYEE' | 'WMS_RESOURCE' | 'FACILITY_ASSET'
  resourceId: string
  allocation: number // percentage (0-100)
  startDate: Date | string
  endDate: Date | string
  conflicts: ResourceConflict[]
}

export interface ResourceConflict {
  id: string
  conflictingProjectId: string
  conflictingTaskId?: string
  conflictingWorkOrderId?: string
  conflictType: 'OVERALLOCATION' | 'SCHEDULE_OVERLAP'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface ProjectBudget {
  id: string
  projectId: string
  budgetId: string // References Finance budget
  budgetItems: Array<{
    category: string
    budgetedAmount: number
    actualAmount: number
    variance: number
  }>
  totalBudgeted: number
  totalActual: number
  totalVariance: number
  currency: string
}

// ============================================================================
// PROJECT INTEGRATION TYPES
// ============================================================================

export interface ProjectIntegration {
  module: 'WMS' | 'FACILITY' | 'HR' | 'FINANCE'
  enabled: boolean
  syncDirection: 'BIDIRECTIONAL' | 'PROJECT_TO_MODULE' | 'MODULE_TO_PROJECT'
  lastSyncAt?: Date | string
}

export interface UnifiedProjectData {
  project: Project
  tasks: any[] // WMS tasks (read-only, no duplication)
  workOrders: WorkOrder[] // Facility work orders (read-only, no duplication)
  resources: {
    employees: any[] // HR employees (read-only)
    wmsResources: any[] // WMS resources (read-only)
    facilityAssets: any[] // Facility assets (read-only)
  }
  budget: ProjectBudget | null
  ganttData: GanttTask[]
}





