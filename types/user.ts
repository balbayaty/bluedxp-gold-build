// User Roles and Permissions System
// Comprehensive role-based access control for 3PL/4PL WMS

// ============================================================================
// USER ROLES
// ============================================================================

export type UserRole =
  // Platform Administrators
  | 'SYSTEM_ADMIN'              // Full platform access
  | 'PLATFORM_ADMIN'            // Platform-level management
  | 'TENANT_ADMIN'              // Tenant-level management
  
  // Warehouse Operations
  | 'WAREHOUSE_HEAD'            // Warehouse director
  | 'WAREHOUSE_SUPERVISOR'      // Floor supervisor
  | 'WAREHOUSE_OPERATOR'        // Floor staff
  | 'INVENTORY_SPECIALIST'      // Inventory management
  | 'PICKING_OPERATOR'          // Picking operations
  | 'RECEIVING_CLERK'           // Receiving dock
  | 'SHIPPING_CLERK'            // Shipping dock
  
  // Transport Operations
  | 'TRANSPORT_GENERAL_MANAGER' // Transport department head
  | 'FLEET_MANAGER'             // Fleet operations
  | 'DISPATCHER'                // Dispatch operations
  | 'DRIVER'                    // Individual driver
  | 'ROUTE_PLANNER'             // Route planning
  
  // Customer-Facing
  | 'BUSINESS_DEVELOPMENT_MANAGER' // Sales/BD
  | 'CUSTOMER_ACCOUNT_MANAGER'  // Customer relationship
  | 'CUSTOMER_ADMIN'            // Customer company admin
  | 'CUSTOMER_USER'             // Customer staff
  | 'CUSTOMER_VIEWER'           // Customer read-only
  
  // Carrier & Partner
  | 'CARRIER_ADMIN'             // Carrier company admin
  | 'CARRIER_DISPATCHER'        // Carrier dispatch
  | 'CARRIER_DRIVER'            // Carrier driver
  | 'VENDOR_ADMIN'              // Supplier company admin
  | 'VENDOR_SALES'              // Supplier sales rep
  | 'VENDOR_SUPPORT'            // Supplier support
  
  // 3PL/4PL Partners
  | '3PL_ADMIN'                 // 3PL provider admin
  | '3PL_OPERATOR'              // 3PL staff
  | '4PL_ADMIN'                 // 4PL orchestrator admin
  | 'BROKER_ADMIN'              // Customs broker admin
  | 'BROKER_AGENT'              // Customs broker agent
  | 'FREIGHT_FORWARDER'         // Forwarding agent
  
  // Compliance & Quality
  | 'QUALITY_MANAGER'           // QC/QA head
  | 'QUALITY_INSPECTOR'         // QC staff
  | 'COMPLIANCE_OFFICER'        // Compliance team
  | 'SAFETY_OFFICER'            // HSE officer
  | 'AUDITOR'                   // Internal/external auditor
  | 'CUSTOMS_OFFICER'           // Customs official (external)
  
  // Finance & Commercial
  | 'FINANCE_ADMIN'             // Finance head
  | 'FINANCE_ANALYST'           // Finance team
  | 'BILLING_ADMIN'             // Billing management
  | 'PROCUREMENT_MANAGER'       // Procurement head
  | 'PROCUREMENT_OFFICER'       // Procurement staff
  | 'OPERATIONS_MANAGER'        // Operations head
  
  // Manufacturing
  | 'PRODUCTION_MANAGER'        // Production head
  | 'SHOP_FLOOR_SUPERVISOR'     // Floor supervisor
  | 'MACHINE_OPERATOR'          // Equipment operator
  
  // Technology & Integration
  | 'IT_ADMIN'                  // IT department
  | 'DEVELOPER'                 // API developer
  | 'INTEGRATOR'                // Integration partner
  
  // HR & Admin
  | 'HR_MANAGER'                // HR head
  | 'HR_OFFICER'                // HR staff
  | 'TRAINING_COORDINATOR'      // Training management

// ============================================================================
// PERMISSION SYSTEM - HIERARCHICAL & GRANULAR
// ============================================================================

// Module IDs - Top level (ALL platform modules)
export type ModuleId =
  // Core Operations
  | 'wms'                    // Warehouse Management System
  | 'tms'                    // Transportation Management System
  | 'maas'                   // Manufacturing as a Service
  
  // Compliance & Safety
  | 'iso-ims'                // ISO Integrated Management System
  | 'msds'                   // Material Safety Data Sheets
  | 'qhse'                   // Quality, Health, Safety, Environment
  | 'customs'                // Customs (enterprise module)
  | 'trade-compliance'       // Trade Compliance
  | 'gcc-compliance'         // GCC Compliance (Saudi/Gulf)
  
  // AI & Intelligence
  | 'ai'                     // AI & Intelligent Orchestration
  | 'intelligence-analytics' // Intelligence Analytics
  | 'truth-engine'           // Truth Engine (verification)
  | 'pulse'                  // Pulse Monitoring
  
  // Finance & Commercial
  | 'finance'                // Finance (enterprise module)
  | 'proposals-rfq'          // Proposals & RFQ
  | 'procurement'            // Procurement (enterprise module)
  | 'marketplace'            // Marketplace (enterprise module)
  | 'liability'              // Liability Management
  
  // Enterprise Modules
  | 'crm'                    // CRM (enterprise module)
  | 'hr'                     // HR (enterprise module)
  | 'project-management'     // Project management (enterprise module)
  | 'business-intelligence'  // Business intelligence (enterprise module)
  | 'warehouse-network'      // Warehouse network (enterprise module)
  | 'facility-management'    // Facility management (enterprise module)
  
  // Integration & Infrastructure
  | 'integration'            // Integrations
  | 'external-integrations'  // External Integrations
  | 'digital-signature'      // Digital Signature
  | 'ict-hardware'           // ICT Hardware Ecosystem
  | 'dmarc-monitoring'       // DMARC Monitoring
  
  // Documentation & Export
  | 'export-house'           // Export House
  | 'etw'                    // e-Waybill (ETW)
  
  // System
  | 'settings'               // System Settings
  | 'reports'                // Reports
  | 'analytics'              // Analytics
  | 'business_intelligence'  // Business Intelligence (legacy)
  | 'workspace'              // User Workspace
  | 'chemical'               // Chemical Management

// Feature IDs - Second level (within modules)
export type FeatureId =
  // WMS Features
  | 'wms.inbound' | 'wms.outbound' | 'wms.inventory' | 'wms.orders' | 'wms.picking' | 'wms.putaway'
  | 'wms.cycle_counting' | 'wms.quality' | 'wms.customers' | 'wms.warehouses' | 'wms.materials'
  | 'wms.vendors' | 'wms.storage_locations' | 'wms.bins' | 'wms.batches' | 'wms.serials'
  | 'wms.abc_analysis' | 'wms.cross_docking' | 'wms.replenishment' | 'wms.reservations'
  | 'wms.transfer_posting' | 'wms.valuation' | 'wms.expiry_management' | 'wms.holds'
  | 'wms.goods_receipt' | 'wms.goods_issue' | 'wms.delivery_note' | 'wms.order_confirmation'
  | 'wms.ship_confirmation' | 'wms.pick_release' | 'wms.wave_planning' | 'wms.load_planning'
  | 'wms.return_management' | 'wms.stock_alerts' | 'wms.resources' | 'wms.work_centers'
  | 'wms.overtime' | 'wms.task_management' | 'wms.tasks' | 'wms.my_tasks' | 'wms.approvals'
  // TMS Features
  | 'tms.transportation' | 'tms.shipments' | 'tms.tracking' | 'tms.routes' | 'tms.pod'
  | 'tms.freight' | 'tms.carriers' | 'tms.load_planning' | 'tms.multimodal' | 'tms.sea'
  | 'tms.air' | 'tms.rail' | 'tms.customs' | 'tms.customs_declarations' | 'tms.customs_brokers'
  | 'tms.ports' | 'tms.insurance' | 'tms.analytics' | 'tms.integration'
  | 'tms.documents' | 'tms.enterprise_documents' | 'tms.customs_authorities'
  | 'tms.quotes' | 'tms.payments' | 'tms.proposals' | 'tms.incidents' | 'tms.control_tower'
  | 'tms.etw' // e-Waybill (ETW) feature
  // ISO-IMS Features
  | 'iso-ims.audit_management' | 'iso-ims.capa_management' | 'iso-ims.training_management'
  | 'iso-ims.risk_management' | 'iso-ims.document_center' | 'iso-ims.qhse_dashboard'
  // MSDS Features
  | 'msds.msds' | 'msds.msds_intelligence' | 'msds.chemical_safety' | 'msds.compatibility'
  | 'msds.hazards' | 'msds.risk_assessment' | 'msds.sds_analysis'
  // AI Features
  | 'ai.intelligent_orchestration' | 'ai.process_mining' | 'ai.root_cause' | 'ai.predictive'
  | 'ai.insights' | 'ai.compliance' | 'ai.communication' | 'ai.agent_orchestration'
  | 'ai.ai_vision' | 'ai.data_mining'
  // Integration Features
  | 'integration.erp' | 'integration.edi' | 'integration.api' | 'integration.carriers'
  | 'integration.labels' | 'integration.benchmarks'
  // MaaS Features
  | 'maas.manufacturing' | 'maas.production_orders' | 'maas.work_orders' | 'maas.bom'
  | 'maas.routing' | 'maas.capacity_planning' | 'maas.shop_floor' | 'maas.quality_control'
  | 'maas.analytics'
  // Proposals & RFQ Features
  | 'proposals-rfq.proposals' | 'proposals-rfq.rfq' | 'proposals-rfq.services' | 'proposals-rfq.rate_cards'
  | 'proposals-rfq.journey' | 'proposals-rfq.train_schedules' | 'proposals-rfq.templates' | 'proposals-rfq.analytics'
  // Settings Features
  | 'settings.users' | 'settings.parameters' | 'settings.templates' | 'settings.notifications'
  | 'settings.warehouse' | 'settings.ai' | 'settings.currency' | 'settings.accessibility' | 'settings.workflow'
  // Reports & Analytics
  | 'reports.operational' | 'reports.inventory' | 'reports.orders' | 'reports.financial'
  | 'reports.performance' | 'reports.custom'
  | 'analytics.dashboard' | 'analytics.kpi_dashboard' | 'analytics.sla_kpi' | 'analytics.modern_sla'
  | 'business_intelligence.dashboard' | 'business_intelligence.customer_dashboard'

// Tab IDs - Third level (within features) - Dynamic, can be any string
export type TabId = string // e.g., 'wms.inbound.asn', 'wms.inbound.receiving', 'tms.customs.declarations.list'

// Legacy Resource type for backward compatibility
export type Resource =
  | 'dashboard'
  | 'customers'
  | 'warehouses'
  | 'inventory'
  | 'orders'
  | 'inbound'
  | 'outbound'
  | 'picking'
  | 'putaway'
  | 'cycle_counting'
  | 'reports'
  | 'analytics'
  | 'settings'
  | 'users'
  | 'billing'
  | 'sla'
  | 'quality'
  | 'space_utilization'
  | 'business_intelligence'

// Enhanced Action types with granular control
export type Action = 
  | 'read'           // View only
  | 'read_write'     // View and edit
  | 'read_only'      // Explicit read-only (cannot edit)
  | 'partial_edit'  // Can edit specific fields only
  | 'write'          // Create and edit
  | 'delete'         // Delete records
  | 'approve'        // Approve workflows
  | 'export'         // Export data
  | 'import'         // Import data
  | 'manage'         // Full management (includes all above)
  | 'configure'      // Configure settings
  | 'assign'         // Assign to others
  | 'execute'        // Execute actions

export type PermissionScope = 'ALL' | 'ASSIGNED_CUSTOMERS' | 'ASSIGNED_WAREHOUSES' | 'OWN' | 'TENANT'

// Hierarchical Permission Structure
export interface HierarchicalPermission {
  // Module level (top)
  moduleId?: ModuleId
  moduleAccess?: 'full' | 'partial' | 'none' | 'read_only'
  
  // Feature level (middle)
  featureId?: FeatureId
  featureAccess?: 'full' | 'partial' | 'none' | 'read_only'
  
  // Tab level (bottom)
  tabId?: TabId
  tabAccess?: 'full' | 'partial' | 'none' | 'read_only'
  
  // Granular actions
  actions: Action[]
  
  // Scope
  scope: PermissionScope
  
  // Conditions
  conditions?: PermissionCondition[]
  
  // Field-level restrictions (for partial_edit)
  allowedFields?: string[]
  restrictedFields?: string[]
  
  // Time-based restrictions
  timeRestrictions?: {
    daysOfWeek?: number[] // 0-6 (Sunday-Saturday)
    hours?: { start: number; end: number } // 0-23
    timezone?: string
  }
}

// Legacy Permission interface for backward compatibility
export interface Permission {
  resource: Resource
  actions: Action[]
  scope: PermissionScope
  conditions?: PermissionCondition[]
  
  // New hierarchical fields (optional for backward compatibility)
  moduleId?: ModuleId
  featureId?: FeatureId
  tabId?: TabId
  moduleAccess?: 'full' | 'partial' | 'none' | 'read_only'
  featureAccess?: 'full' | 'partial' | 'none' | 'read_only'
  tabAccess?: 'full' | 'partial' | 'none' | 'read_only'
  allowedFields?: string[]
  restrictedFields?: string[]
}

export interface PermissionCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than'
  value: any
}

// ============================================================================
// USER INTERFACE
// ============================================================================

export interface User {
  id: string
  tenantId: string
  email: string
  name: string
  role: UserRole
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING'
  
  // Enhanced profile fields for localization (Arabic culture support)
  fullName?: string           // Full formal name (e.g., "Basheer Albayaty")
  kunya?: string              // Arabic honorific nickname (e.g., "Abu Khalid", "Um Ahmed")
  displayName?: string        // Preferred display name
  firstName?: string          // First name
  lastName?: string           // Last name / Family name
  middleName?: string         // Middle name
  title?: string              // Mr., Mrs., Dr., Eng., etc.
  
  // Role-specific assignments
  assignedCustomers?: string[] // For Account Managers
  assignedWarehouses?: string[] // For Warehouse roles
  assignedRegions?: string[] // For regional managers
  
  // Permissions (legacy + hierarchical)
  permissions: Permission[]
  customPermissions?: Permission[] // Override default role permissions
  
  // Hierarchical permissions (new advanced system)
  hierarchicalPermissions?: HierarchicalPermission[]
  
  // Module-level access (quick reference)
  moduleAccess?: Record<ModuleId, 'full' | 'partial' | 'read_only' | 'none'>
  
  // Feature-level access (quick reference)
  featureAccess?: Record<FeatureId, 'full' | 'partial' | 'read_only' | 'none'>
  
  // Tab-level access (quick reference)
  tabAccess?: Record<TabId, 'full' | 'partial' | 'read_only' | 'none'>
  
  // Profile
  avatar?: string
  phone?: string
  department?: string
  jobTitle?: string
  managerId?: string
  
  // Preferences
  preferences: UserPreferences
  
  // Metadata
  lastLogin?: Date | string
  loginCount: number
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string
  updatedBy?: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  dateFormat: string
  timeFormat: string
  defaultView: 'table' | 'grid' | 'analytics'
  defaultCustomerFilter?: 'ALL' | string[]
  defaultWarehouseFilter?: 'ALL' | string[]
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    desktop: boolean
  }
  dashboard: {
    widgets: string[]
    layout: 'grid' | 'list'
  }
  accessibility?: {
    enabled: boolean
    profileId?: string
    customSettings?: any
  }
}

// ============================================================================
// USER DATA VISIBILITY (for hierarchical customer/sub-customer support)
// ============================================================================

/**
 * User-specific data visibility rules
 * Allows different users within the same customer to see different data
 */
export interface UserDataVisibility {
  // Show only data assigned to this specific user
  showOnlyAssignedData?: boolean
  
  // Custom fields visible to this user
  customFields?: string[]  // e.g., ['orders', 'inventory', 'shipments']
  
  // Fields hidden from this user
  hiddenFields?: string[]  // e.g., ['financial', 'pricing', 'costs']
  
  // Custom data filters
  dataFilters?: Record<string, any>  // e.g., { status: ['ACTIVE'], priority: ['HIGH', 'CRITICAL'] }
  
  // Customer/sub-customer context
  customerId?: string
  subCustomerId?: string
  
  // Additional restrictions
  dateRange?: {
    start?: Date | string
    end?: Date | string
  }
  
  // Metadata
  description?: string
  metadata?: Record<string, any>
}

// ============================================================================
// CUSTOMER ASSIGNMENT OPTIONS
// ============================================================================

export interface CustomerAssignmentOptions {
  role?: string                    // Role within this customer
  dataVisibility?: UserDataVisibility
  permissions?: any[]              // Customer-specific permissions
  expiresAt?: Date | string        // Temporary assignment
  metadata?: Record<string, any>
}

// ============================================================================
// ROLE ASSIGNMENT OPTIONS
// ============================================================================

export interface RoleAssignmentOptions {
  delegatedFrom?: string           // Who delegated this role
  reason?: string                  // Why this role was assigned
  expiresAt?: Date | string        // When role expires
  metadata?: Record<string, any>
}

// ============================================================================
// ROLE DEFINITIONS
// ============================================================================

export interface RoleDefinition {
  role: UserRole
  name: string
  description: string
  defaultPermissions: Permission[]
  allowedScopes: PermissionScope[]
  requiresCustomerAssignment: boolean
  requiresWarehouseAssignment: boolean
  dashboardRoute: string
  features: string[]
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  SYSTEM_ADMIN: {
    role: 'SYSTEM_ADMIN',
    name: 'System Administrator',
    description: 'Full system access, tenant management, all customers and warehouses',
    defaultPermissions: [
      { resource: 'dashboard', actions: ['read', 'write', 'delete', 'manage'], scope: 'ALL' },
      { resource: 'customers', actions: ['read', 'write', 'delete', 'manage'], scope: 'ALL' },
      { resource: 'warehouses', actions: ['read', 'write', 'delete', 'manage'], scope: 'ALL' },
      { resource: 'inventory', actions: ['read', 'write', 'delete', 'manage'], scope: 'ALL' },
      { resource: 'orders', actions: ['read', 'write', 'delete', 'approve', 'manage'], scope: 'ALL' },
      { resource: 'settings', actions: ['read', 'write', 'delete', 'manage'], scope: 'ALL' },
      { resource: 'users', actions: ['read', 'write', 'delete', 'manage'], scope: 'ALL' },
      { resource: 'billing', actions: ['read', 'write', 'delete', 'manage'], scope: 'ALL' },
      { resource: 'reports', actions: ['read', 'export', 'manage'], scope: 'ALL' },
      { resource: 'analytics', actions: ['read', 'export', 'manage'], scope: 'ALL' },
      { resource: 'business_intelligence', actions: ['read', 'export', 'manage'], scope: 'ALL' },
    ],
    allowedScopes: ['ALL', 'TENANT'],
    requiresCustomerAssignment: false,
    requiresWarehouseAssignment: false,
    dashboardRoute: '/dashboard/system-admin',
    features: [
      'tenant_management',
      'customer_management',
      'warehouse_management',
      'user_management',
      'system_settings',
      'billing_management',
      'all_analytics',
      'all_reports',
    ],
  },
  
  BUSINESS_DEVELOPMENT_MANAGER: {
    role: 'BUSINESS_DEVELOPMENT_MANAGER',
    name: 'Business Development Manager',
    description: 'Customer portfolio analytics, revenue tracking, SLA compliance, customer satisfaction',
    defaultPermissions: [
      { resource: 'dashboard', actions: ['read'], scope: 'ALL' },
      { resource: 'customers', actions: ['read', 'export'], scope: 'ALL' },
      { resource: 'analytics', actions: ['read', 'export'], scope: 'ALL' },
      { resource: 'business_intelligence', actions: ['read', 'export'], scope: 'ALL' },
      { resource: 'reports', actions: ['read', 'export'], scope: 'ALL' },
      { resource: 'sla', actions: ['read', 'export'], scope: 'ALL' },
      { resource: 'billing', actions: ['read', 'export'], scope: 'ALL' },
    ],
    allowedScopes: ['ALL', 'ASSIGNED_CUSTOMERS'],
    requiresCustomerAssignment: false,
    requiresWarehouseAssignment: false,
    dashboardRoute: '/dashboard/business-development',
    features: [
      'customer_portfolio',
      'revenue_analytics',
      'sla_compliance',
      'customer_satisfaction',
      'churn_risk_analysis',
      'profitability_analysis',
      'contract_management',
      'performance_benchmarking',
    ],
  },
  
  TRANSPORT_GENERAL_MANAGER: {
    role: 'TRANSPORT_GENERAL_MANAGER',
    name: 'Transport General Manager',
    description: 'Strategic transportation oversight, carrier management, cost optimization, performance monitoring across all transport modes',
    defaultPermissions: [
      { resource: 'dashboard', actions: ['read', 'write'], scope: 'ALL' },
      { resource: 'analytics', actions: ['read', 'export', 'manage'], scope: 'ALL' },
      { resource: 'business_intelligence', actions: ['read', 'export', 'manage'], scope: 'ALL' },
      { resource: 'reports', actions: ['read', 'export', 'manage'], scope: 'ALL' },
      { resource: 'billing', actions: ['read', 'export'], scope: 'ALL' },
    ],
    allowedScopes: ['ALL', 'TENANT'],
    requiresCustomerAssignment: false,
    requiresWarehouseAssignment: false,
    dashboardRoute: '/dashboard/transport-general-manager',
    features: [
      'transportation_overview',
      'carrier_performance_management',
      'cost_optimization',
      'route_optimization',
      'customs_compliance',
      'sustainability_tracking',
      'predictive_analytics',
      'financial_management',
      'real_time_monitoring',
      'strategic_planning',
    ],
  },
  
  WAREHOUSE_HEAD: {
    role: 'WAREHOUSE_HEAD',
    name: 'Warehouse Head/Manager',
    description: 'All warehouses or assigned warehouses, stock visibility, space utilization, resource allocation',
    defaultPermissions: [
      { resource: 'dashboard', actions: ['read'], scope: 'ALL' },
      { resource: 'warehouses', actions: ['read', 'write'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'inventory', actions: ['read', 'write', 'export'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'orders', actions: ['read', 'write', 'approve'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'inbound', actions: ['read', 'write', 'approve'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'outbound', actions: ['read', 'write', 'approve'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'picking', actions: ['read', 'write', 'manage'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'putaway', actions: ['read', 'write', 'manage'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'cycle_counting', actions: ['read', 'write', 'approve'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'space_utilization', actions: ['read', 'write', 'export'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'reports', actions: ['read', 'export'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'analytics', actions: ['read', 'export'], scope: 'ASSIGNED_WAREHOUSES' },
    ],
    allowedScopes: ['ALL', 'ASSIGNED_WAREHOUSES'],
    requiresCustomerAssignment: false,
    requiresWarehouseAssignment: true,
    dashboardRoute: '/dashboard/warehouse-head',
    features: [
      'multi_warehouse_overview',
      'stock_visibility',
      'transaction_monitoring',
      'space_utilization',
      'resource_allocation',
      'performance_metrics',
      'capacity_planning',
      'efficiency_analytics',
    ],
  },
  
  OPERATIONS_MANAGER: {
    role: 'OPERATIONS_MANAGER',
    name: 'Operations Manager',
    description: 'Daily operations, order fulfillment, resource management, quality control',
    defaultPermissions: [
      { resource: 'dashboard', actions: ['read'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'orders', actions: ['read', 'write', 'approve'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'inbound', actions: ['read', 'write'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'outbound', actions: ['read', 'write'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'picking', actions: ['read', 'write', 'manage'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'putaway', actions: ['read', 'write', 'manage'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'reports', actions: ['read', 'export'], scope: 'ASSIGNED_WAREHOUSES' },
    ],
    allowedScopes: ['ASSIGNED_WAREHOUSES'],
    requiresCustomerAssignment: false,
    requiresWarehouseAssignment: true,
    dashboardRoute: '/dashboard/operations',
    features: [
      'daily_operations',
      'order_fulfillment',
      'resource_management',
      'quality_control',
      'performance_tracking',
    ],
  },
  
  CUSTOMER_ACCOUNT_MANAGER: {
    role: 'CUSTOMER_ACCOUNT_MANAGER',
    name: 'Customer Account Manager',
    description: 'Assigned customers only, customer-specific dashboards, SLA monitoring, issue resolution',
    defaultPermissions: [
      { resource: 'dashboard', actions: ['read'], scope: 'ASSIGNED_CUSTOMERS' },
      { resource: 'customers', actions: ['read', 'write'], scope: 'ASSIGNED_CUSTOMERS' },
      { resource: 'inventory', actions: ['read', 'export'], scope: 'ASSIGNED_CUSTOMERS' },
      { resource: 'orders', actions: ['read', 'write'], scope: 'ASSIGNED_CUSTOMERS' },
      { resource: 'sla', actions: ['read', 'write'], scope: 'ASSIGNED_CUSTOMERS' },
      { resource: 'reports', actions: ['read', 'export'], scope: 'ASSIGNED_CUSTOMERS' },
      { resource: 'analytics', actions: ['read', 'export'], scope: 'ASSIGNED_CUSTOMERS' },
    ],
    allowedScopes: ['ASSIGNED_CUSTOMERS'],
    requiresCustomerAssignment: true,
    requiresWarehouseAssignment: false,
    dashboardRoute: '/dashboard/account-manager',
    features: [
      'customer_overview',
      'customer_stock',
      'order_tracking',
      'sla_monitoring',
      'issue_resolution',
      'customer_reports',
      'billing_overview',
    ],
  },
  
  WAREHOUSE_SUPERVISOR: {
    role: 'WAREHOUSE_SUPERVISOR',
    name: 'Warehouse Supervisor',
    description: 'Assigned warehouse, operations oversight, team management',
    defaultPermissions: [
      { resource: 'dashboard', actions: ['read'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'inventory', actions: ['read', 'write'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'orders', actions: ['read', 'write'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'picking', actions: ['read', 'write', 'manage'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'putaway', actions: ['read', 'write', 'manage'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'reports', actions: ['read'], scope: 'ASSIGNED_WAREHOUSES' },
    ],
    allowedScopes: ['ASSIGNED_WAREHOUSES'],
    requiresCustomerAssignment: false,
    requiresWarehouseAssignment: true,
    dashboardRoute: '/dashboard/supervisor',
    features: [
      'warehouse_overview',
      'operations_oversight',
      'team_management',
      'performance_tracking',
    ],
  },
  
  WAREHOUSE_OPERATOR: {
    role: 'WAREHOUSE_OPERATOR',
    name: 'Warehouse Operator',
    description: 'Basic warehouse operations, picking, putaway, cycle counting',
    defaultPermissions: [
      { resource: 'picking', actions: ['read', 'write'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'putaway', actions: ['read', 'write'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'cycle_counting', actions: ['read', 'write'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'inventory', actions: ['read'], scope: 'ASSIGNED_WAREHOUSES' },
    ],
    allowedScopes: ['ASSIGNED_WAREHOUSES'],
    requiresCustomerAssignment: false,
    requiresWarehouseAssignment: true,
    dashboardRoute: '/dashboard/operator',
    features: [
      'picking_tasks',
      'putaway_tasks',
      'cycle_counting',
      'inventory_lookup',
    ],
  },
  
  QUALITY_MANAGER: {
    role: 'QUALITY_MANAGER',
    name: 'Quality Manager',
    description: 'Quality control, inspections, non-conformance management',
    defaultPermissions: [
      { resource: 'quality', actions: ['read', 'write', 'approve'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'inventory', actions: ['read', 'write'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'reports', actions: ['read', 'export'], scope: 'ASSIGNED_WAREHOUSES' },
    ],
    allowedScopes: ['ASSIGNED_WAREHOUSES'],
    requiresCustomerAssignment: false,
    requiresWarehouseAssignment: true,
    dashboardRoute: '/dashboard/quality',
    features: [
      'quality_control',
      'inspections',
      'non_conformance',
      'certificates',
    ],
  },
  
  INVENTORY_SPECIALIST: {
    role: 'INVENTORY_SPECIALIST',
    name: 'Inventory Specialist',
    description: 'Inventory management, cycle counting, stock adjustments',
    defaultPermissions: [
      { resource: 'inventory', actions: ['read', 'write'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'cycle_counting', actions: ['read', 'write', 'approve'], scope: 'ASSIGNED_WAREHOUSES' },
      { resource: 'reports', actions: ['read', 'export'], scope: 'ASSIGNED_WAREHOUSES' },
    ],
    allowedScopes: ['ASSIGNED_WAREHOUSES'],
    requiresCustomerAssignment: false,
    requiresWarehouseAssignment: true,
    dashboardRoute: '/dashboard/inventory',
    features: [
      'inventory_management',
      'cycle_counting',
      'stock_adjustments',
      'inventory_reports',
    ],
  },
  
  CUSTOMER_USER: {
    role: 'CUSTOMER_USER',
    name: 'Customer User',
    description: 'Own data only, stock visibility, order tracking, reports',
    defaultPermissions: [
      { resource: 'dashboard', actions: ['read'], scope: 'OWN' },
      { resource: 'inventory', actions: ['read', 'export'], scope: 'OWN' },
      { resource: 'orders', actions: ['read'], scope: 'OWN' },
      { resource: 'reports', actions: ['read', 'export'], scope: 'OWN' },
    ],
    allowedScopes: ['OWN'],
    requiresCustomerAssignment: true,
    requiresWarehouseAssignment: false,
    dashboardRoute: '/dashboard/customer',
    features: [
      'stock_visibility',
      'order_tracking',
      'inventory_reports',
      'sla_status',
      'billing_info',
    ],
  },
  
  CUSTOMER_ADMIN: {
    role: 'CUSTOMER_ADMIN',
    name: 'Customer Administrator',
    description: 'Full access to own customer data, user management for customer',
    defaultPermissions: [
      { resource: 'dashboard', actions: ['read'], scope: 'OWN' },
      { resource: 'inventory', actions: ['read', 'export'], scope: 'OWN' },
      { resource: 'orders', actions: ['read', 'write'], scope: 'OWN' },
      { resource: 'reports', actions: ['read', 'export'], scope: 'OWN' },
      { resource: 'users', actions: ['read', 'write'], scope: 'OWN' },
      { resource: 'settings', actions: ['read', 'write'], scope: 'OWN' },
    ],
    allowedScopes: ['OWN'],
    requiresCustomerAssignment: true,
    requiresWarehouseAssignment: false,
    dashboardRoute: '/dashboard/customer-admin',
    features: [
      'full_customer_access',
      'user_management',
      'settings_management',
      'all_customer_features',
    ],
  },
}

// ============================================================================
// PERMISSION UTILITIES
// ============================================================================

export function hasPermission(
  user: User,
  resource: Resource,
  action: Action,
  context?: { customerId?: string; warehouseId?: string }
): boolean {
  const permission = user.permissions.find(p => p.resource === resource)
  if (!permission) return false
  
  if (!permission.actions.includes(action)) return false
  
  // Check scope
  switch (permission.scope) {
    case 'ALL':
      return true
    case 'OWN':
      // For customer users, check if resource belongs to their customer
      if (user.role === 'CUSTOMER_USER' || user.role === 'CUSTOMER_ADMIN') {
        return context?.customerId === user.assignedCustomers?.[0]
      }
      return false
    case 'ASSIGNED_CUSTOMERS':
      if (!context?.customerId) return false
      return user.assignedCustomers?.includes(context.customerId) ?? false
    case 'ASSIGNED_WAREHOUSES':
      if (!context?.warehouseId) return false
      return user.assignedWarehouses?.includes(context.warehouseId) ?? false
    case 'TENANT':
      return true // All users in tenant
    default:
      return false
  }
}

export function getRoleDefinition(role: UserRole): RoleDefinition {
  return ROLE_DEFINITIONS[role]
}

export function getDefaultPermissions(role: UserRole): Permission[] {
  return ROLE_DEFINITIONS[role].defaultPermissions
}

// ============================================================================
// EXPORTS
// ============================================================================
// All types are already exported above, no need to re-export

