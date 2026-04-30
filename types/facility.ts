/**
 * Facility Management Type Definitions
 * 
 * Comprehensive type definitions for the world's most advanced Facility Management System
 * Includes: Assets, Maintenance, Space, Energy, IoT, BIM, Digital Twin, Licensing, CAD, etc.
 */

// ============================================================================
// CORE FACILITY TYPES
// ============================================================================

export interface Facility {
  id: string
  name: string
  code?: string
  type: FacilityType
  status: FacilityStatus
  location: FacilityLocation
  contact: FacilityContact
  specifications: FacilitySpecifications
  ownership: FacilityOwnership
  operational: FacilityOperational
  financial: FacilityFinancial
  compliance: FacilityCompliance
  metadata: FacilityMetadata
  tenantId?: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export type FacilityType =
  | 'warehouse'
  | 'office'
  | 'manufacturing'
  | 'retail'
  | 'hospital'
  | 'school'
  | 'residential'
  | 'mixed-use'
  | 'data-center'
  | 'laboratory'
  | 'other'

export type FacilityStatus =
  | 'active'
  | 'inactive'
  | 'under-construction'
  | 'renovation'
  | 'closed'
  | 'demolished'

export interface FacilityLocation {
  address: string
  city: string
  state?: string
  country: string
  postalCode?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  timeZone?: string
  region?: string
}

export interface FacilityContact {
  primaryContact?: {
    name: string
    email: string
    phone: string
    role: string
  }
  emergencyContact?: {
    name: string
    email: string
    phone: string
  }
  facilityManager?: {
    name: string
    email: string
    phone: string
  }
}

export interface FacilitySpecifications {
  totalArea?: number // square meters
  builtArea?: number // square meters
  numberOfFloors?: number
  yearBuilt?: number
  yearRenovated?: number
  buildingType?: string
  constructionType?: string
  occupancyCapacity?: number
  parkingSpaces?: number
  elevators?: number
  fireSafetySystems?: string[]
  securitySystems?: string[]
  hvacSystems?: string[]
  electricalCapacity?: number // kW
  waterCapacity?: number // liters
}

export interface FacilityOwnership {
  ownerType: 'owned' | 'leased' | 'rented'
  ownerName?: string
  ownershipPercentage?: number
  acquisitionDate?: Date
  acquisitionCost?: number
}

export interface FacilityOperational {
  operatingHours?: {
    start: string
    end: string
    days: string[]
  }
  occupancyRate?: number // percentage
  utilizationRate?: number // percentage
  maintenanceStatus?: 'excellent' | 'good' | 'fair' | 'poor'
  energyRating?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
}

export interface FacilityFinancial {
  currentValue?: number
  annualOperatingCost?: number
  annualMaintenanceCost?: number
  annualEnergyCost?: number
  annualLeaseCost?: number
  depreciationRate?: number
}

export interface FacilityCompliance {
  licenses: FacilityLicense[]
  permits: FacilityPermit[]
  certifications: FacilityCertification[]
  inspections: FacilityInspection[]
  violations: FacilityViolation[]
  complianceScore?: number // 0-100
  lastAuditDate?: Date
  nextAuditDate?: Date
}

export interface FacilityMetadata {
  tags: string[]
  notes?: string
  attachments?: string[]
  customFields?: Record<string, any>
}

// ============================================================================
// ASSET MANAGEMENT (EAM)
// ============================================================================

export interface FacilityAsset {
  id: string
  facilityId: string
  name: string
  code?: string
  type: AssetType
  category: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  location: AssetLocation
  status: AssetStatus
  lifecycle: AssetLifecycle
  specifications: AssetSpecifications
  financial: AssetFinancial
  maintenance: AssetMaintenance
  warranty: AssetWarranty
  documentation: AssetDocumentation
  ownership: AssetOwnership
  relationships: AssetRelationships
  metadata: Record<string, any>
  tenantId?: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export interface AssetOwnership {
  ownershipType: 'owned' | 'landlord' | 'leased' | 'rented' | 'consigned'
  ownerName?: string
  ownerContact?: {
    name: string
    email: string
    phone: string
    address?: string
  }
  leaseStartDate?: Date
  leaseEndDate?: Date
  leaseTerms?: string
  maintenanceResponsibility: 'owner' | 'tenant' | 'shared' | 'landlord'
  maintenanceOwner?: string // Who is responsible for maintenance
  maintenanceNotes?: string
  propertyDocument?: string // Link to lease/property document
}

export interface AssetRelationships {
  warehouseId?: string
  warehouseName?: string
  warehouseLocationId?: string
  warehouseLocationCode?: string
  warehouseZoneId?: string
  warehouseZoneName?: string
  capaIds?: string[] // Linked CAPA records
  workOrderIds?: string[] // Linked work orders
  maintenanceTaskIds?: string[] // Linked maintenance tasks
  parentAssetId?: string // For asset hierarchy
  childAssetIds?: string[] // Child assets
  relatedAssetIds?: string[] // Related assets
  linkedDocuments?: string[] // Linked documents
  linkedInspections?: string[] // Linked inspections
}

export type AssetType =
  | 'building-system'
  | 'equipment'
  | 'furniture'
  | 'vehicle'
  | 'it-equipment'
  | 'machinery'
  | 'infrastructure'
  | 'other'

export type AssetStatus =
  | 'operational'
  | 'maintenance'
  | 'out-of-service'
  | 'retired'
  | 'disposed'

export interface AssetLocation {
  facilityId: string
  building?: string
  floor?: string
  room?: string
  area?: string
  coordinates?: {
    x: number
    y: number
    z?: number
  }
  bimElementId?: string // Link to BIM model
}

export interface AssetLifecycle {
  stage: 'planning' | 'procurement' | 'installation' | 'operation' | 'maintenance' | 'retirement' | 'disposal'
  acquisitionDate?: Date
  installationDate?: Date
  commissioningDate?: Date
  retirementDate?: Date
  disposalDate?: Date
  expectedLifespan?: number // years
  currentAge?: number // years
  remainingLifespan?: number // years
}

export interface AssetSpecifications {
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit: 'meters' | 'feet' | 'inches'
  }
  weight?: number
  powerConsumption?: number // kW
  capacity?: number
  capacityUnit?: string
  operatingTemperature?: {
    min: number
    max: number
    unit: 'celsius' | 'fahrenheit'
  }
  operatingPressure?: {
    min: number
    max: number
    unit: 'psi' | 'bar' | 'pa'
  }
  technicalSpecs?: Record<string, any>
}

export interface AssetFinancial {
  acquisitionCost?: number
  currentValue?: number
  depreciationMethod?: 'straight-line' | 'declining-balance' | 'units-of-production'
  depreciationRate?: number // percentage
  annualDepreciation?: number
  accumulatedDepreciation?: number
  bookValue?: number
  replacementCost?: number
  insuranceValue?: number
}

export interface AssetMaintenance {
  lastMaintenanceDate?: Date
  nextMaintenanceDate?: Date
  maintenanceFrequency?: number // days
  totalMaintenanceCost?: number
  maintenanceHistory?: MaintenanceRecord[]
  criticality?: 'critical' | 'high' | 'medium' | 'low'
  maintenanceStrategy?: 'reactive' | 'preventive' | 'predictive' | 'reliability-centered'
}

export interface AssetWarranty {
  hasWarranty: boolean
  warrantyType?: 'manufacturer' | 'extended' | 'service'
  warrantyStartDate?: Date
  warrantyEndDate?: Date
  warrantyProvider?: string
  warrantyTerms?: string
  warrantyCoverage?: string[]
}

export interface AssetDocumentation {
  manuals?: string[]
  drawings?: string[]
  specifications?: string[]
  certificates?: string[]
  photos?: string[]
  videos?: string[]
}

// ============================================================================
// MAINTENANCE MANAGEMENT (CMMS)
// ============================================================================

export interface MaintenanceRecord {
  id: string
  assetId: string
  facilityId: string
  type: MaintenanceType
  status: MaintenanceStatus
  priority: MaintenancePriority
  scheduledDate?: Date
  completedDate?: Date
  duration?: number // minutes
  technician?: string
  vendor?: string
  description: string
  workPerformed?: string
  partsUsed?: MaintenancePart[]
  cost: number
  notes?: string
  attachments?: string[]
  tenantId?: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export type MaintenanceType =
  | 'preventive'
  | 'corrective'
  | 'emergency'
  | 'predictive'
  | 'inspection'
  | 'calibration'
  | 'upgrade'

export type MaintenanceStatus =
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'on-hold'
  | 'overdue'

export type MaintenancePriority = 'critical' | 'high' | 'medium' | 'low'

export interface MaintenancePart {
  partId: string
  partName: string
  quantity: number
  unitCost: number
  totalCost: number
}

export interface WorkOrder {
  id: string
  facilityId: string
  assetId?: string
  type: WorkOrderType
  status: WorkOrderStatus
  priority: WorkOrderPriority
  title: string
  description: string
  requestedBy: string
  assignedTo?: string
  scheduledDate?: Date
  dueDate?: Date
  completedDate?: Date
  estimatedDuration?: number // minutes
  actualDuration?: number // minutes
  estimatedCost?: number
  actualCost?: number
  location: string
  category?: string
  tags?: string[]
  attachments?: string[]
  notes?: string
  approvalWorkflow?: WorkOrderApproval[]
  tenantId?: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export type WorkOrderType =
  | 'maintenance'
  | 'repair'
  | 'inspection'
  | 'installation'
  | 'cleaning'
  | 'move'
  | 'other'

export type WorkOrderStatus =
  | 'requested'
  | 'approved'
  | 'assigned'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'on-hold'

export type WorkOrderPriority = 'critical' | 'high' | 'medium' | 'low'

export interface WorkOrderApproval {
  approver: string
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  approvedAt?: Date
}

// ============================================================================
// SPACE MANAGEMENT (CAFM)
// ============================================================================

export interface Space {
  id: string
  facilityId: string
  name: string
  code?: string
  type: SpaceType
  status: SpaceStatus
  location: SpaceLocation
  specifications: SpaceSpecifications
  allocation: SpaceAllocation
  utilization: SpaceUtilization
  cost: SpaceCost
  metadata: Record<string, any>
  tenantId?: string
  createdAt: Date
  updatedAt: Date
}

export type SpaceType =
  | 'office'
  | 'meeting-room'
  | 'conference-room'
  | 'workspace'
  | 'storage'
  | 'parking'
  | 'common-area'
  | 'restroom'
  | 'kitchen'
  | 'lobby'
  | 'other'

export type SpaceStatus =
  | 'occupied'
  | 'vacant'
  | 'reserved'
  | 'under-renovation'
  | 'unavailable'

export interface SpaceLocation {
  building?: string
  floor?: string
  wing?: string
  room?: string
  coordinates?: {
    x: number
    y: number
    z?: number
  }
  floorPlanId?: string
  bimElementId?: string
}

export interface SpaceSpecifications {
  area: number // square meters
  capacity?: number // people
  dimensions?: {
    length: number
    width: number
    height?: number
  }
  amenities?: string[]
  accessibility?: boolean
  windows?: number
  doors?: number
}

export interface SpaceAllocation {
  allocatedTo?: string // user/team/department
  allocationType?: 'permanent' | 'temporary' | 'hoteling' | 'shared'
  allocationStartDate?: Date
  allocationEndDate?: Date
  occupancyRate?: number // percentage
}

export interface SpaceUtilization {
  utilizationRate?: number // percentage
  peakUtilization?: number // percentage
  averageUtilization?: number // percentage
  utilizationTrend?: 'increasing' | 'stable' | 'decreasing'
  lastMeasured?: Date
}

export interface SpaceCost {
  costPerSquareMeter?: number
  monthlyCost?: number
  annualCost?: number
  costAllocation?: Record<string, number>
}

// ============================================================================
// ENERGY & SUSTAINABILITY
// ============================================================================

export interface EnergyConsumption {
  id: string
  facilityId: string
  period: {
    start: Date
    end: Date
  }
  electricity: {
    consumption: number // kWh
    cost: number
    peakDemand?: number // kW
  }
  water: {
    consumption: number // liters
    cost: number
  }
  gas?: {
    consumption: number // cubic meters
    cost: number
  }
  renewableEnergy?: {
    generation: number // kWh
    percentage: number
  }
  carbonFootprint: {
    emissions: number // CO2 equivalent in kg
    scope1?: number // Direct emissions
    scope2?: number // Indirect emissions (electricity)
    scope3?: number // Other indirect emissions
  }
  tenantId?: string
  createdAt: Date
}

export interface SustainabilityMetrics {
  facilityId: string
  period: {
    start: Date
    end: Date
  }
  energy: {
    totalConsumption: number // kWh
    renewablePercentage: number
    efficiency: number // kWh per square meter
    reduction: number // percentage reduction vs baseline
  }
  water: {
    totalConsumption: number // liters
    efficiency: number // liters per person
    reduction: number // percentage reduction vs baseline
  }
  waste: {
    totalGenerated: number // kg
    recycled: number // kg
    recyclingRate: number // percentage
    reduction: number // percentage reduction vs baseline
  }
  carbon: {
    totalEmissions: number // CO2 equivalent in kg
    perSquareMeter: number
    perPerson: number
    reduction: number // percentage reduction vs baseline
  }
  certifications: {
    leed?: {
      level: 'certified' | 'silver' | 'gold' | 'platinum'
      score: number
    }
    breeam?: {
      rating: 'pass' | 'good' | 'very-good' | 'excellent' | 'outstanding'
      score: number
    }
  }
  esgScore?: number // 0-100
  tenantId?: string
  updatedAt: Date
}

// ============================================================================
// BIM & CAD MANAGEMENT
// ============================================================================

export interface BIMModel {
  id: string
  facilityId: string
  name: string
  version: string
  fileFormat: 'ifc' | 'dwg' | 'rvt' | 'nwd' | 'other'
  fileUrl: string
  fileSize: number // bytes
  status: 'uploading' | 'processing' | 'ready' | 'error'
  metadata: BIMMetadata
  elements: BIMElement[]
  linkedAssets?: string[] // Asset IDs linked to BIM elements
  linkedSpaces?: string[] // Space IDs linked to BIM elements
  tenantId?: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export interface BIMMetadata {
  author?: string
  software?: string
  softwareVersion?: string
  creationDate?: Date
  projectName?: string
  buildingName?: string
  buildingType?: string
  totalArea?: number
  totalVolume?: number
  numberOfFloors?: number
  coordinateSystem?: string
}

export interface BIMElement {
  id: string
  name: string
  type: string
  category: string
  properties: Record<string, any>
  geometry?: {
    position: { x: number; y: number; z: number }
    rotation?: { x: number; y: number; z: number }
    scale?: { x: number; y: number; z: number }
  }
  linkedAssetId?: string
  linkedSpaceId?: string
}

export interface CADDrawing {
  id: string
  facilityId: string
  name: string
  type: CADDrawingType
  fileFormat: 'dwg' | 'dxf' | 'pdf' | 'png' | 'jpg' | 'other'
  fileUrl: string
  fileSize: number // bytes
  version?: string
  revision?: string
  status: 'draft' | 'review' | 'approved' | 'superseded'
  metadata: CADMetadata
  linkedAssets?: string[]
  linkedSpaces?: string[]
  tenantId?: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export type CADDrawingType =
  | 'architectural'
  | 'structural'
  | 'mechanical'
  | 'electrical'
  | 'plumbing'
  | 'fire-safety'
  | 'site-plan'
  | 'as-built'
  | 'other'

export interface CADMetadata {
  drawingNumber?: string
  sheetNumber?: string
  scale?: string
  author?: string
  software?: string
  creationDate?: Date
  lastModified?: Date
  projectName?: string
  discipline?: string
  description?: string
}

export interface Specification {
  id: string
  facilityId: string
  assetId?: string
  name: string
  type: SpecificationType
  category: string
  content: string
  version: string
  status: 'draft' | 'review' | 'approved' | 'superseded'
  attachments?: string[]
  metadata: Record<string, any>
  tenantId?: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export type SpecificationType =
  | 'technical'
  | 'performance'
  | 'material'
  | 'installation'
  | 'maintenance'
  | 'safety'
  | 'other'

// ============================================================================
// LICENSING & REGULATORY COMPLIANCE
// ============================================================================

export interface FacilityLicense {
  id: string
  facilityId: string
  licenseNumber: string
  licenseType: LicenseType
  issuingAuthority: string
  issueDate: Date
  expiryDate: Date
  renewalDate?: Date
  status: LicenseStatus
  requirements: LicenseRequirement[]
  documents: string[]
  fees: LicenseFee[]
  compliance: LicenseCompliance
  metadata: Record<string, any>
  tenantId?: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export type LicenseType =
  | 'business'
  | 'operational'
  | 'safety'
  | 'environmental'
  | 'health'
  | 'fire-safety'
  | 'building'
  | 'zoning'
  | 'other'

export type LicenseStatus =
  | 'active'
  | 'expired'
  | 'pending-renewal'
  | 'suspended'
  | 'revoked'
  | 'under-review'

export interface LicenseRequirement {
  id: string
  description: string
  type: 'document' | 'inspection' | 'fee' | 'training' | 'other'
  status: 'pending' | 'completed' | 'overdue'
  dueDate?: Date
  completedDate?: Date
  evidence?: string[]
}

export interface LicenseFee {
  type: 'application' | 'renewal' | 'penalty' | 'other'
  amount: number
  currency: string
  dueDate?: Date
  paidDate?: Date
  status: 'pending' | 'paid' | 'overdue'
}

export interface LicenseCompliance {
  isCompliant: boolean
  complianceScore?: number // 0-100
  violations?: string[]
  lastInspectionDate?: Date
  nextInspectionDate?: Date
  notes?: string
}

export interface FacilityPermit {
  id: string
  facilityId: string
  permitNumber: string
  permitType: string
  issuingAuthority: string
  issueDate: Date
  expiryDate?: Date
  status: 'active' | 'expired' | 'revoked'
  conditions: string[]
  documents: string[]
  tenantId?: string
  createdAt: Date
  updatedAt: Date
}

export interface FacilityCertification {
  id: string
  facilityId: string
  certificationType: string
  certifyingBody: string
  certificationNumber?: string
  issueDate: Date
  expiryDate?: Date
  status: 'active' | 'expired' | 'suspended'
  documents: string[]
  tenantId?: string
  createdAt: Date
  updatedAt: Date
}

export interface FacilityInspection {
  id: string
  facilityId: string
  inspectionType: InspectionType
  inspector: string
  inspectionDate: Date
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  findings: InspectionFinding[]
  result: 'passed' | 'failed' | 'conditional'
  recommendations?: string[]
  nextInspectionDate?: Date
  documents: string[]
  tenantId?: string
  createdAt: Date
  updatedAt: Date
}

export type InspectionType =
  | 'safety'
  | 'fire-safety'
  | 'environmental'
  | 'health'
  | 'building'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'compliance'
  | 'other'

export interface InspectionFinding {
  id: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  location?: string
  recommendation?: string
  status: 'open' | 'in-progress' | 'resolved'
  resolvedDate?: Date
}

export interface FacilityViolation {
  id: string
  facilityId: string
  violationType: string
  authority: string
  violationDate: Date
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'under-appeal' | 'resolved'
  penalty?: number
  resolutionDate?: Date
  resolutionNotes?: string
  documents: string[]
  tenantId?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// CIVIL DEFENSE & REGULATORY INTEGRATIONS
// ============================================================================

export interface CivilDefenseIntegration {
  facilityId: string
  registrationNumber?: string
  registrationStatus: 'registered' | 'pending' | 'expired' | 'not-registered'
  lastSubmissionDate?: Date
  nextSubmissionDate?: Date
  complianceStatus: 'compliant' | 'non-compliant' | 'under-review'
  fireSafetySystems: FireSafetySystem[]
  evacuationPlans: EvacuationPlan[]
  emergencyContacts: EmergencyContact[]
  inspections: CivilDefenseInspection[]
  violations: CivilDefenseViolation[]
  apiConfig?: {
    endpoint?: string
    apiKey?: string
    lastSync?: Date
  }
  tenantId?: string
  updatedAt: Date
}

export interface FireSafetySystem {
  id: string
  type: 'sprinkler' | 'fire-alarm' | 'fire-extinguisher' | 'smoke-detector' | 'emergency-lighting' | 'other'
  location: string
  status: 'operational' | 'maintenance' | 'out-of-service'
  lastInspectionDate?: Date
  nextInspectionDate?: Date
  certificationNumber?: string
  expiryDate?: Date
}

export interface EvacuationPlan {
  id: string
  name: string
  version: string
  fileUrl: string
  lastUpdated: Date
  approvedBy?: string
  approvalDate?: Date
  status: 'draft' | 'approved' | 'superseded'
}

export interface EmergencyContact {
  name: string
  role: string
  phone: string
  email?: string
  isPrimary: boolean
}

export interface CivilDefenseInspection {
  id: string
  inspectionDate: Date
  inspector: string
  result: 'passed' | 'failed' | 'conditional'
  findings: string[]
  recommendations?: string[]
  nextInspectionDate?: Date
  documents: string[]
}

export interface CivilDefenseViolation {
  id: string
  violationDate: Date
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'resolved'
  resolutionDate?: Date
  penalty?: number
}

export interface AbaladyIntegration {
  facilityId: string
  registrationNumber?: string
  registrationStatus: 'registered' | 'pending' | 'expired' | 'not-registered'
  lastSubmissionDate?: Date
  nextSubmissionDate?: Date
  complianceStatus: 'compliant' | 'non-compliant' | 'under-review'
  businessLicense?: {
    number: string
    issueDate: Date
    expiryDate: Date
    status: 'active' | 'expired' | 'suspended'
  }
  commercialRegistration?: {
    number: string
    issueDate: Date
    expiryDate: Date
    status: 'active' | 'expired'
  }
  apiConfig?: {
    endpoint?: string
    apiKey?: string
    lastSync?: Date
  }
  tenantId?: string
  updatedAt: Date
}

// ============================================================================
// DIGITAL TWIN
// ============================================================================

export interface DigitalTwin {
  id: string
  facilityId: string
  name: string
  status: 'active' | 'inactive' | 'syncing'
  version: string
  syncFrequency: number // seconds
  lastSyncDate?: Date
  nextSyncDate?: Date
  dataSources: DigitalTwinDataSource[]
  simulations: DigitalTwinSimulation[]
  optimizations: DigitalTwinOptimization[]
  metadata: Record<string, any>
  tenantId?: string
  createdAt: Date
  updatedAt: Date
}

export interface DigitalTwinDataSource {
  id: string
  type: 'iot-sensor' | 'bim-model' | 'energy-meter' | 'maintenance-system' | 'other'
  sourceId: string
  syncEnabled: boolean
  lastSyncDate?: Date
  syncStatus: 'success' | 'error' | 'pending'
}

export interface DigitalTwinSimulation {
  id: string
  name: string
  type: 'energy-optimization' | 'space-optimization' | 'maintenance-scheduling' | 'what-if' | 'other'
  status: 'running' | 'completed' | 'failed'
  parameters: Record<string, any>
  results?: Record<string, any>
  startedAt?: Date
  completedAt?: Date
}

export interface DigitalTwinOptimization {
  id: string
  name: string
  type: 'energy' | 'space' | 'maintenance' | 'cost' | 'other'
  status: 'pending' | 'running' | 'completed' | 'failed'
  recommendations: OptimizationRecommendation[]
  startedAt?: Date
  completedAt?: Date
}

export interface OptimizationRecommendation {
  id: string
  category: string
  description: string
  impact: 'high' | 'medium' | 'low'
  estimatedSavings?: number
  implementationCost?: number
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'approved' | 'rejected' | 'implemented'
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

export interface FacilityAnalytics {
  facilityId: string
  period: {
    start: Date
    end: Date
  }
  assets: {
    total: number
    operational: number
    maintenance: number
    outOfService: number
    averageAge: number
    totalValue: number
  }
  maintenance: {
    totalWorkOrders: number
    completed: number
    overdue: number
    averageResponseTime: number // minutes
    totalCost: number
    preventiveMaintenanceRate: number // percentage
  }
  space: {
    totalArea: number
    occupiedArea: number
    utilizationRate: number // percentage
    costPerSquareMeter: number
  }
  energy: {
    totalConsumption: number // kWh
    cost: number
    efficiency: number // kWh per square meter
    carbonEmissions: number // kg CO2
  }
  compliance: {
    licensesActive: number
    licensesExpiring: number
    complianceScore: number // 0-100
    violations: number
  }
  tenantId?: string
  generatedAt: Date
}

// ============================================================================
// VENDOR & CONTRACT MANAGEMENT
// ============================================================================

export interface FacilityVendor {
  id: string
  name: string
  type: 'contractor' | 'service-provider' | 'supplier' | 'consultant' | 'other'
  contact: {
    email: string
    phone: string
    address?: string
  }
  services: string[]
  performance: VendorPerformance
  contracts: string[] // Contract IDs
  certifications?: string[]
  insurance?: {
    type: string
    provider: string
    expiryDate: Date
  }
  tenantId?: string
  createdAt: Date
  updatedAt: Date
}

export interface VendorPerformance {
  rating: number // 1-5
  totalWorkOrders: number
  completedWorkOrders: number
  onTimeCompletionRate: number // percentage
  averageResponseTime: number // hours
  customerSatisfaction: number // 1-5
  lastUpdated: Date
}

export interface FacilityContract {
  id: string
  facilityId: string
  vendorId: string
  type: 'maintenance' | 'cleaning' | 'security' | 'catering' | 'other'
  title: string
  startDate: Date
  endDate: Date
  status: 'active' | 'expired' | 'terminated' | 'pending'
  value: number
  currency: string
  terms: string
  documents: string[]
  renewals: ContractRenewal[]
  tenantId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ContractRenewal {
  id: string
  renewalDate: Date
  newEndDate: Date
  value: number
  terms?: string
  status: 'pending' | 'approved' | 'rejected'
}

