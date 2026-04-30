// Multi-Tenant 3PL/4PL WMS Type Definitions
// Comprehensive type system for enterprise logistics providers

// ============================================================================
// TENANT TYPES
// ============================================================================

export type TenantType = '3PL' | '4PL'
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'TRIAL'
export type SubscriptionTier = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM'

export interface Tenant {
  id: string
  name: string // 3PL/4PL Provider Name
  type: TenantType
  status: TenantStatus
  subscriptionTier: SubscriptionTier
  subscriptionStartDate: Date | string
  subscriptionEndDate?: Date | string
  maxCustomers?: number
  maxWarehouses?: number
  maxUsers?: number
  features: TenantFeature[]
  settings: TenantSettings
  billing: {
    monthlyFee: number
    perCustomerFee?: number
    perWarehouseFee?: number
    currency: string
    paymentMethod?: string
  }
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string
  updatedBy?: string
}

export interface TenantFeature {
  id: string
  name: string
  enabled: boolean
  limits?: {
    maxValue?: number
    maxPerCustomer?: number
  }
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  minSpecialChars?: number
  preventPasswordReuse?: number // How many previous passwords to check
  maxAge?: number // Password expiration in days
  minAge?: number // Minimum days before password can be changed again
}

export interface TenantSettings {
  timezone: string
  currency: string
  dateFormat: string
  timeFormat: string
  language: string
  allowCustomerPortal: boolean
  allowApiAccess: boolean
  dataRetentionDays: number
  backupFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  passwordPolicy?: PasswordPolicy
}

// ============================================================================
// CUSTOMER TYPES
// ============================================================================

export type CustomerType = '3PL_CLIENT' | '4PL_CLIENT'
export type ServiceTier = 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'STANDARD'
export type CustomerStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ONBOARDING' | 'AT_RISK'

export interface Customer {
  id: string
  tenantId: string // Which 3PL/4PL provider
  customerNumber: string
  customerName: string
  type: CustomerType
  serviceTier: ServiceTier
  status: CustomerStatus
  
  // Branding & Logo
  logo?: {
    url: string // Path to logo file (e.g., '/customers/flex-logo.svg')
    alt: string // Alt text for logo
    width?: number // Preferred width
    height?: number // Preferred height
    variant?: 'light' | 'dark' | 'full' // Logo variant for different backgrounds
  }
  brandColor?: string // Primary brand color (hex)
  secondaryColor?: string // Secondary brand color (hex)
  
  // Contract Information
  contractStartDate: Date | string
  contractEndDate?: Date | string
  contractValue: number
  contractCurrency: string
  renewalDate?: Date | string
  autoRenew: boolean
  
  // Financial Information
  monthlyRevenue: number
  totalRevenue: number
  averageOrderValue: number
  paymentTerms: string // e.g., "NET_30", "NET_60"
  creditLimit?: number
  outstandingBalance?: number
  
  // Service Information
  allocatedWarehouses: string[] // Warehouse IDs
  dedicatedSpace: DedicatedSpace[]
  serviceLevel: ServiceLevel
  slaTargets: SLATarget[]
  
  // Contact Information
  primaryContact: Contact
  billingContact?: Contact
  operationalContacts: Contact[]
  
  // Business Intelligence
  metrics: CustomerMetrics
  healthScore: number // 0-100
  churnRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  satisfactionScore?: number // 0-100
  
  // Settings
  settings: CustomerSettings
  integrations?: CustomerIntegration[]
  
  // Nested Customers (Customer's Customer - for 3PL/4PL scenarios)
  // Example: Flex Logistics (customer) might have their own customers (sub-customers)
  subCustomers?: SubCustomer[]
  parentCustomerId?: string // If this customer belongs to another customer
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy?: string
  updatedBy?: string
}

export interface SubCustomer {
  id: string
  customerNumber: string
  customerName: string
  logo?: {
    url: string
    alt: string
    width?: number
    height?: number
    variant?: 'light' | 'dark' | 'full'
  }
  brandColor?: string
  secondaryColor?: string
  status: CustomerStatus
  serviceTier: ServiceTier
}

export interface DedicatedSpace {
  warehouseId: string
  warehouseName: string
  allocatedArea: number // sqm
  allocatedPalletPositions: number
  allocatedVolume: number // cubic meters
  utilization: number // percentage
  reservedSpace: number
  availableSpace: number
  allocationType: 'DEDICATED' | 'SHARED' | 'DYNAMIC'
  startDate: Date | string
  endDate?: Date | string
}

export interface ServiceLevel {
  tier: ServiceTier
  features: string[]
  slaComplianceTarget: number // percentage
  priorityLevel: number // 1-4 (1 = highest)
  pricingMultiplier: number
  dedicatedResources: boolean
  accountManager?: string
}

export interface SLATarget {
  id: string
  metric: string // 'order_fulfillment_time', 'receiving_time', etc.
  target: number // target value
  unit: string // 'hours', 'days', 'percentage'
  warningThreshold: number
  criticalThreshold: number
  isActive: boolean
}

export interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  isPrimary: boolean
}

export interface CustomerMetrics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  orderFulfillmentRate: number // percentage
  slaComplianceRate: number // percentage
  inventoryValue: number
  spaceUtilization: number // percentage
  orderVolumeTrend: 'INCREASING' | 'STABLE' | 'DECREASING'
  revenueTrend: 'INCREASING' | 'STABLE' | 'DECREASING'
  lastOrderDate?: Date | string
  daysSinceLastOrder?: number
}

export interface CustomerSettings {
  allowCustomerPortal: boolean
  allowApiAccess: boolean
  defaultWarehouse?: string
  defaultCarrier?: string
  notificationPreferences: {
    email: boolean
    sms: boolean
    push: boolean
  }
  reportFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  customFields?: Record<string, any>
}

export interface CustomerIntegration {
  id: string
  type: 'ERP' | 'EDI' | 'API' | 'WEBHOOK'
  system: string // 'SAP', 'ORACLE', etc.
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR'
  lastSync?: Date | string
  configuration?: Record<string, any>
}

// ============================================================================
// WAREHOUSE TYPES
// ============================================================================

export type WarehouseType = 'DEDICATED' | 'SHARED' | 'MULTI_TENANT' | 'HAZMAT'
export type WarehouseStatus = 'ACTIVE' | 'MAINTENANCE' | 'CLOSED' | 'PLANNED'

export interface Warehouse {
  id: string
  tenantId: string
  warehouseCode: string
  warehouseName: string
  type: WarehouseType
  status: WarehouseStatus
  
  // Location Information
  address: Address
  coordinates?: {
    latitude: number
    longitude: number
  }
  timezone: string
  
  // Capacity Information
  capacity: WarehouseCapacity
  currentUtilization: SpaceUtilization
  
  // Customers Served
  servingCustomers: string[] // Customer IDs
  primaryCustomer?: string // For dedicated warehouses
  
  // Operations
  operatingHours: OperatingHours
  capabilities: WarehouseCapability[]
  
  // Resources
  resources: WarehouseResource[]
  
  // Performance
  metrics: WarehouseMetrics
  
  // Saudi-Specific Regulatory Information
  regulatory?: {
    saberCertified?: boolean
    sfdaLicensed?: boolean
    modonLicense?: string
    zatcaBonded?: boolean
    complianceStandards?: string[]
    certifications?: RegulatoryCertification[]
  }
  
  createdAt: Date | string
  updatedAt: Date | string
}

export interface RegulatoryCertification {
  id: string
  regulator: 'SABER' | 'SFDA' | 'SASO' | 'MODON' | 'ZATCA' | 'MOC' | 'MOI' | 'MOMRA'
  certificateNumber: string
  certificateType: string
  issueDate: Date | string
  expiryDate?: Date | string
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'SUSPENDED'
  description?: string
}

export interface Address {
  street: string
  city: string
  state?: string
  postalCode: string
  country: string
}

export interface WarehouseCapacity {
  totalArea: number // sqm
  totalPalletPositions: number
  totalVolume: number // cubic meters
  maxWeight: number // kg
  dockDoors: number
  loadingBays: number
  temperatureZones: TemperatureZone[]
}

export interface TemperatureZone {
  id: string
  name: string
  temperatureRange: {
    min: number
    max: number
  }
  area: number // sqm
  palletPositions: number
}

export interface SpaceUtilization {
  totalArea: number
  usedArea: number
  availableArea: number
  utilizationPercentage: number
  totalPalletPositions: number
  usedPalletPositions: number
  availablePalletPositions: number
  palletUtilizationPercentage: number
  customerBreakdown: CustomerSpaceAllocation[]
  trends: UtilizationTrend[]
}

export interface CustomerSpaceAllocation {
  customerId: string
  customerName: string
  allocatedArea: number
  usedArea: number
  utilizationPercentage: number
  allocatedPalletPositions: number
  usedPalletPositions: number
}

export interface UtilizationTrend {
  date: Date | string
  utilization: number
  customerBreakdown: {
    customerId: string
    utilization: number
  }[]
}

export interface OperatingHours {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
  holidays?: Holiday[]
}

export interface DaySchedule {
  isOpen: boolean
  openTime?: string // HH:mm
  closeTime?: string // HH:mm
  breaks?: {
    start: string
    end: string
  }[]
}

export interface Holiday {
  date: Date | string
  name: string
  isOpen: boolean
}

export interface WarehouseCapability {
  id: string
  name: string
  enabled: boolean
  description?: string
}

export interface WarehouseResource {
  id: string
  type: 'FORKLIFT' | 'REACH_TRUCK' | 'PALLET_JACK' | 'CONVEYOR' | 'SORTATION' | 'OTHER'
  name: string
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE'
  assignedTo?: string
  utilization?: number
}

export interface WarehouseMetrics {
  totalOrders: number
  ordersToday: number
  ordersThisWeek: number
  ordersThisMonth: number
  averageOrderFulfillmentTime: number // hours
  onTimeDeliveryRate: number // percentage
  inventoryAccuracy: number // percentage
  spaceEfficiency: number // percentage
  throughput: number // orders per day
  costPerOrder: number
  revenue: number
}

// ============================================================================
// EXPORTS
// ============================================================================
// All types are already exported above, no need to re-export

