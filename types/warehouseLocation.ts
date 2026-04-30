/**
 * Comprehensive Warehouse Location Types
 * Migrated from chemcheck-ai with full feature preservation
 * BlueDXP Platform - 4IR & 5IR Aligned
 */

/**
 * Fire Suppression System Types
 * Comprehensive list of firefighting systems
 */
export type FireSuppressionSystemType =
  | 'Sprinkler System with FM-200'
  | 'CO2 System'
  | 'Foam System'
  | 'Dry Chemical System'
  | 'Water Sprinkler System'
  | 'Gas Suppression (FM-200)'
  | 'Gas Suppression (Novec 1230)'
  | 'Inert Gas System (IG-541)'
  | 'Pre-Action Sprinkler System'
  | 'Deluge System'
  | 'Foam-Water Sprinkler System'
  | 'Multiple Systems (Combined)'
  | 'None'

/**
 * Facility Type
 */
export type FacilityType =
  | 'Warehouse'
  | 'Lab'
  | 'Workshop'
  | 'Support Services'
  | 'Distribution Center'
  | 'Storage Facility'

/**
 * Compliance Status
 */
export type ComplianceStatus =
  | 'Compliant'
  | 'Compliant with exceptions'
  | 'Non-Compliant'
  | 'Pending Inspection'

/**
 * Hazard Class Definition
 */
export interface HazardClass {
  value: string
  label: string
  defaultLimit: number
}

/**
 * All 15 Hazard Classes with Default Limits
 */
export const ALL_HAZARD_CLASSES: HazardClass[] = [
  { value: 'Class 1', label: 'Class 1 - Explosives', defaultLimit: 100 },
  { value: 'Class 2.1', label: 'Class 2.1 - Flammable Gases', defaultLimit: 500 },
  { value: 'Class 2.2', label: 'Class 2.2 - Non-Flammable Gases', defaultLimit: 1000 },
  { value: 'Class 2.3', label: 'Class 2.3 - Toxic Gases', defaultLimit: 300 },
  { value: 'Class 3', label: 'Class 3 - Flammable Liquids', defaultLimit: 1500 },
  { value: 'Class 4.1', label: 'Class 4.1 - Flammable Solids', defaultLimit: 800 },
  { value: 'Class 4.2', label: 'Class 4.2 - Spontaneously Combustible', defaultLimit: 500 },
  { value: 'Class 4.3', label: 'Class 4.3 - Dangerous When Wet', defaultLimit: 300 },
  { value: 'Class 5.1', label: 'Class 5.1 - Oxidizing Substances', defaultLimit: 750 },
  { value: 'Class 5.2', label: 'Class 5.2 - Organic Peroxides', defaultLimit: 250 },
  { value: 'Class 6.1', label: 'Class 6.1 - Toxic Substances', defaultLimit: 500 },
  { value: 'Class 6.2', label: 'Class 6.2 - Infectious Substances', defaultLimit: 200 },
  { value: 'Class 7', label: 'Class 7 - Radioactive Materials', defaultLimit: 150 },
  { value: 'Class 8', label: 'Class 8 - Corrosives', defaultLimit: 1000 },
  { value: 'Class 9', label: 'Class 9 - Miscellaneous', defaultLimit: 2000 }
]

/**
 * GPS Coordinates
 */
export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Location Address
 */
export interface LocationAddress {
  country: string
  countryCode: string
  city: string
  cityCode: string
  address: string
  postalCode?: string
  coordinates: Coordinates
}

/**
 * Temperature Range
 */
export interface TemperatureRange {
  min: number
  max: number
  unit?: 'CELSIUS' | 'FAHRENHEIT'
}

/**
 * Storage Restrictions
 */
export interface StorageRestrictions {
  hazardClassesAllowed: string[]
  hazardClassLimits: Record<string, number>
  maximumQuantity: number
  temperatureControlled: boolean
  temperatureRange?: TemperatureRange
  specialRequirements: string[]
}

/**
 * Certification
 */
export interface LocationCertification {
  id: string
  regulator: string
  certificateType: string
  certificateNumber: string
  issueDate: string
  expiryDate?: string
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING'
}

/**
 * Document
 */
export interface LocationDocument {
  id: string
  name: string
  type: string
  fileUrl: string
  uploadedAt: string
  uploadedBy?: string
}

/**
 * Comprehensive Storage Location
 */
export interface StorageLocation {
  id: string
  name: string
  type: FacilityType
  code: string // Auto-generated: SAU-RYD-0001 format
  location: LocationAddress
  regulatoryAuthority: string
  fireSuppressionType: FireSuppressionSystemType
  
  // Capacity Management
  totalPalletCapacity?: number
  bulkAreaCapacity?: number
  currentPalletsUsed?: number
  utilizationRate?: number
  currentCapacity?: number
  maximumCapacity?: number
  
  // Storage Restrictions
  storageRestrictions: StorageRestrictions
  
  // Compliance
  complianceStatus: ComplianceStatus
  lastInspection: string
  regulatoryNotes?: string
  certifications?: LocationCertification[]
  documents?: LocationDocument[]
  
  // Status
  active: boolean
  
  // Metadata
  tenantId?: string
  customerId?: string
  warehouseId?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

/**
 * Storage Location Form Data
 */
export interface StorageLocationFormData {
  name: string
  type: FacilityType
  code: string
  location: LocationAddress
  regulatoryAuthority: string
  fireSuppressionType: FireSuppressionSystemType
  maximumQuantity: number
  temperatureControlled: boolean
  temperatureMin: number
  temperatureMax: number
  specialRequirements: string
  complianceStatus: ComplianceStatus
  lastInspection: string
  regulatoryNotes: string
  totalPalletCapacity?: number
  bulkAreaCapacity?: number
  currentPalletsUsed?: number
}

/**
 * Hazard Class Selection State
 */
export interface HazardClassSelection {
  enabled: boolean
  limit: number
  hasLimit: boolean
}

/**
 * Storage Location Filters
 */
export interface StorageLocationFilters {
  tenantId?: string
  customerId?: string
  warehouseId?: string
  countryCode?: string
  cityCode?: string
  facilityType?: FacilityType
  fireSuppressionType?: FireSuppressionSystemType
  complianceStatus?: ComplianceStatus
  active?: boolean
  searchQuery?: string
}

/**
 * Storage Location Create/Update Request
 */
export interface StorageLocationRequest {
  name: string
  type: FacilityType
  code?: string
  location: LocationAddress
  regulatoryAuthority: string
  fireSuppressionType: FireSuppressionSystemType
  totalPalletCapacity?: number
  bulkAreaCapacity?: number
  currentPalletsUsed?: number
  storageRestrictions: StorageRestrictions
  complianceStatus: ComplianceStatus
  lastInspection: string
  regulatoryNotes?: string
}











