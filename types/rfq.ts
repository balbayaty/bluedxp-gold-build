/**
 * RFQ (Request for Quotation) Types
 * Comprehensive RFQ management covering all services
 */

// Core Service Types
export type ServiceCategory =
  | 'WAREHOUSING'
  | 'TRANSPORTATION'
  | 'CUSTOMS_CLEARANCE'
  | 'FREIGHT_FORWARDING'
  | 'SUPPLY_CHAIN'
  | 'VALUE_ADDED'
  | 'MULTIMODAL'
  | 'CROSS_BORDER'
  | 'RAIL_FREIGHT'
  | 'SEA_FREIGHT'
  | 'AIR_FREIGHT'
  | 'COLD_CHAIN'
  | 'HAZMAT'
  | 'PROJECT_LOGISTICS'

export type ServiceSubCategory =
  | 'STORAGE' | 'HANDLING' | 'PICK_PACK' | 'INVENTORY_MANAGEMENT' | 'FULFILLMENT'
  | 'BONDED_WAREHOUSE' | 'COLD_STORAGE' | 'HAZMAT_STORAGE'
  | 'FTL' | 'LTL' | 'LAST_MILE' | 'CROSS_DOCK' | 'DEDICATED_FLEET' | 'EXPRESS'
  | 'IMPORT_CLEARANCE' | 'EXPORT_CLEARANCE' | 'TRANSIT' | 'TEMPORARY_IMPORT'
  | 'DUTY_OPTIMIZATION' | 'COMPLIANCE_REVIEW'
  | 'FCL' | 'LCL' | 'BREAKBULK' | 'RORO' | 'AIR_CARGO' | 'CHARTER'
  | 'LABELING' | 'KITTING' | 'ASSEMBLY' | 'PACKAGING' | 'QUALITY_INSPECTION'

export type TransportMode = 'ROAD' | 'RAIL' | 'SEA' | 'AIR' | 'MULTIMODAL' | 'INTERMODAL'

// RFQ Status and Priority
export type RFQStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'PRICING_IN_PROGRESS'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'

export type RFQPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'

export type RFQSource =
  | 'DIRECT' | 'WEBSITE' | 'REFERRAL' | 'TENDER'
  | 'REPEAT_BUSINESS' | 'PARTNERSHIP' | 'BROKER' | 'MARKETPLACE'

// Address and Location
export interface Address {
  street: string
  city: string
  state?: string
  country: string
  postalCode: string
  coordinates?: { lat: number; lng: number }
}

export interface Location {
  id?: string
  name: string
  type: 'PORT' | 'AIRPORT' | 'WAREHOUSE' | 'TERMINAL' | 'FACILITY' | 'ADDRESS' | 'BORDER' | 'RAIL_TERMINAL'
  address: Address
  code?: string
  capabilities?: string[]
}

// Operating Hours
export interface DayHours {
  open: boolean
  start?: string
  end?: string
}

export interface OperatingHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
  timezone: string
}

// Customer
export interface RFQCustomer {
  id: string
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: Address
  industry?: string
  existingCustomer: boolean
  creditRating?: string
}

// Requirements
export interface ServiceRequirement {
  id: string
  category: ServiceCategory
  subCategory: ServiceSubCategory
  description: string
  quantity?: number
  unit?: string
  priority: RFQPriority
}

export interface HazmatInfo {
  unNumber: string
  class: string
  packingGroup: string
  properShippingName: string
  msdsRequired: boolean
}

export interface TemperatureInfo {
  minTemp: number
  maxTemp: number
  unit: 'C' | 'F'
  monitoringRequired: boolean
}

export interface ShipmentRequirement {
  commodityType: string
  hsCode?: string
  weight: { value: number; unit: 'KG' | 'LBS' | 'MT' }
  dimensions?: { length: number; width: number; height: number; unit: 'CM' | 'M' }
  volume?: { value: number; unit: 'CBM' | 'CFT' }
  packageCount: number
  packageType: string
  hazmat?: HazmatInfo
  temperatureControlled?: TemperatureInfo
  specialHandling?: string[]
  insuranceRequired: boolean
  insuranceValue?: number
}

export interface RouteRequirement {
  id: string
  origin: Location
  destination: Location
  viaPoints?: Location[]
  preferredMode: TransportMode
  alternativeModes?: TransportMode[]
  estimatedDistance?: number
  estimatedTransitTime?: number
}

export interface VolumeRequirement {
  frequency: 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  estimatedVolume: number
  volumeUnit: string
  peakSeasons?: string[]
  contractDuration?: number
}

export interface RFQTimeline {
  requestDate: string
  responseDeadline: string
  expectedStartDate?: string
  projectDuration?: number
  urgency: RFQPriority
}

export interface RFQAttachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: string
}

export interface RFQNote {
  id: string
  content: string
  author: string
  createdAt: string
  internal: boolean
}

// Main RFQ Interface
export interface RFQ {
  id: string
  rfqNumber: string
  title: string
  description: string
  status: RFQStatus
  priority: RFQPriority
  source: RFQSource
  customer: RFQCustomer
  serviceRequirements: ServiceRequirement[]
  shipmentDetails?: ShipmentRequirement
  routes?: RouteRequirement[]
  volumeDetails: VolumeRequirement
  timeline: RFQTimeline
  attachments: RFQAttachment[]
  assignedTo?: string
  estimatedValue?: number
  currency: string
  notes: RFQNote[]
  createdBy: string
  createdAt: string
  updatedAt: string
  validUntil?: string
}

// Workflow
export interface RFQWorkflowStep {
  id: string
  name: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  assignee?: string
  completedAt?: string
}

export interface RFQWorkflow {
  rfqId: string
  currentStep: string
  steps: RFQWorkflowStep[]
}


