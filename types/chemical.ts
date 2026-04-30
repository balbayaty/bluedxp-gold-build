/**
 * Comprehensive Chemical Management Types
 * Deep, multi-layer type definitions for the entire chemical management system
 */

// ============================================================================
// CORE CHEMICAL TYPES
// ============================================================================

export interface Chemical {
  id: string
  name: string
  casNumber?: string
  formula?: string
  synonyms?: string[]
  manufacturer?: string
  supplier?: string
  productCode?: string
  
  // Physical Properties
  physicalProperties: PhysicalProperties
  
  // Chemical Properties
  chemicalProperties: ChemicalProperties
  
  // Hazards
  hazards: ChemicalHazards
  
  // Storage
  storage: StorageRequirements
  
  // Transport
  transport: TransportInformation
  
  // Compliance
  compliance: ComplianceInformation
  
  // Metadata
  metadata: ChemicalMetadata
}

export interface PhysicalProperties {
  physicalState: 'solid' | 'liquid' | 'gas' | 'aerosol'
  appearance?: string
  color?: string
  odor?: string
  ph?: number
  boilingPoint?: number
  meltingPoint?: number
  flashPoint?: number
  autoignitionTemperature?: number
  vaporPressure?: number
  vaporDensity?: number
  specificGravity?: number
  density?: number
  solubility?: string
  viscosity?: number
  molecularWeight?: number
  molecularFormula?: string
}

export interface ChemicalProperties {
  reactivity?: string
  stability?: string
  decompositionProducts?: string[]
  polymerization?: string
  conditionsToAvoid?: string[]
  incompatibleMaterials?: string[]
  corrosivity?: string
  oxidizingProperties?: string
  reducingProperties?: string
}

export interface ChemicalHazards {
  // GHS Classification
  ghs: GHSClassification
  
  // NFPA Diamond
  nfpa: NFPAClassification
  
  // DOT/UN Classification
  dot?: DOTClassification
  
  // Hazard Statements
  hazardStatements: string[]
  precautionaryStatements: string[]
  
  // Exposure Limits
  exposureLimits?: ExposureLimits
  
  // Toxicology
  toxicology?: ToxicologyData
}

export interface GHSClassification {
  symbols: GHSSymbol[]
  signalWord: 'Danger' | 'Warning' | 'None'
  hazardCategories: string[]
  hazardClasses: string[]
  pictograms?: string[]
}

export type GHSSymbol = 
  | 'Explosive'
  | 'Flammable'
  | 'Oxidizing'
  | 'Compressed Gas'
  | 'Corrosive'
  | 'Toxic'
  | 'Harmful'
  | 'Health Hazard'
  | 'Environmental'

export interface NFPAClassification {
  health: number // 0-4
  flammability: number // 0-4
  reactivity: number // 0-4
  special?: string // W, OX, SA, etc.
}

export interface DOTClassification {
  unNumber?: string
  properShippingName?: string
  hazardClass?: string
  packingGroup?: 'I' | 'II' | 'III'
  labels?: string[]
  placards?: string[]
}

export interface ExposureLimits {
  twa?: { value: number; units: 'ppm' | 'mg/m3'; source: string } // Time-weighted average (8-hour)
  stel?: { value: number; units: 'ppm' | 'mg/m3'; source: string } // Short-term exposure limit (15-min)
  ceiling?: { value: number; units: 'ppm' | 'mg/m3'; source: string } // Ceiling limit
  idlh?: { value: number; units: 'ppm' | 'mg/m3'; source: string } // Immediately Dangerous to Life or Health
}

export interface ToxicologyData {
  acuteToxicity?: string
  chronicToxicity?: string
  carcinogenicity?: string
  mutagenicityGenotoxicity?: string
  reproductiveToxicity?: string
  specificTargetOrganToxicity?: string
  aspirationHazard?: string
  skinCorrosionIrritation?: string
  seriousEyeDamageIrritation?: string
  respiratorySensitization?: string
  skinSensitization?: string
}

export interface StorageRequirements {
  storageClass?: string
  temperatureRange?: { min: number; max: number; unit: 'C' | 'F' }
  humidityRange?: { min: number; max: number; unit: '%' }
  lightSensitivity?: boolean
  airSensitivity?: boolean
  moistureSensitivity?: boolean
  segregationRequirements?: string[]
  incompatibleMaterials?: string[]
  specialRequirements?: string[]
  ventilationRequirements?: string
  fireSuppression?: string[]
}

export interface TransportInformation {
  unNumber?: string
  properShippingName?: string
  hazardClass?: string
  packingGroup?: 'I' | 'II' | 'III'
  labels?: string[]
  placards?: string[]
  specialProvisions?: string[]
  limitedQuantities?: boolean
  exceptedQuantities?: boolean
  environmentalHazards?: string[]
}

export interface ComplianceInformation {
  ghsCompliant: boolean
  regulatoryStatus: RegulatoryStatus[]
  certifications?: Certification[]
  permits?: Permit[]
  restrictions?: Restriction[]
  regulatoryUpdates?: RegulatoryUpdate[]
}

export interface RegulatoryStatus {
  region: string // 'Saudi Arabia', 'UAE', 'EU', 'US', etc.
  status: 'Approved' | 'Restricted' | 'Banned' | 'Pending' | 'Unknown'
  authority?: string
  regulation?: string
  lastUpdated?: string
}

export interface Certification {
  type: string
  issuer: string
  number?: string
  issueDate?: string
  expiryDate?: string
  status: 'Active' | 'Expired' | 'Pending'
}

export interface Permit {
  type: string
  issuer: string
  number?: string
  issueDate?: string
  expiryDate?: string
  status: 'Active' | 'Expired' | 'Pending'
}

export interface Restriction {
  type: string
  description: string
  region?: string
  effectiveDate?: string
}

export interface RegulatoryUpdate {
  date: string
  description: string
  impact: 'High' | 'Medium' | 'Low'
  actionRequired?: string
}

export interface ChemicalMetadata {
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  version: number
  status: 'Active' | 'Inactive' | 'Deprecated' | 'Draft'
  tags?: string[]
  categories?: string[]
  notes?: string
  relatedChemicals?: string[] // IDs of related chemicals
  alternatives?: string[] // IDs of alternative chemicals
}

// ============================================================================
// MSDS TYPES
// ============================================================================

export interface MSDSDocument {
  id: string
  chemicalId?: string
  chemicalName: string
  manufacturer: string
  version: string
  revisionDate?: string
  effectiveDate?: string
  expiryDate?: string
  language: string
  fileUrl?: string
  fileType: 'pdf' | 'excel' | 'csv' | 'word'
  
  // Extracted Data
  extractedData?: ExtractedMSDSData
  
  // Status
  status: MSDSStatus
  workflowStatus: MSDSWorkflowStatus
  
  // Review & Approval
  review?: MSDSReview
  approval?: MSDSApproval
  
  // Customer Communication
  customerEmail?: string
  customerId?: string
  customerName?: string
  requestedInfo?: string[]
  
  // Parsing Issues
  parsingIssues?: ParsingIssues
  
  // Metadata
  metadata: MSDSMetadata
}

export interface ExtractedMSDSData {
  productName: string
  manufacturer: string
  casNumber?: string
  ecNumber?: string
  unNumber?: string
  molecularFormula?: string
  formula?: string
  hazardClass?: string
  hazardLevel?: 'High' | 'Medium' | 'Low'
  hazardStatements?: string[]
  precautionaryStatements?: string[]
  physicalState?: string
  flashPoint?: string
  boilingPoint?: string
  ph?: string
  storageConditions?: string[]
  incompatibleMaterials?: string[]
  ppeRequired?: string[]
  firstAid?: string
  firefighting?: string
  spillResponse?: string
  ghsCompliant?: boolean
  safetyScore?: number
  aiConfidence?: number
  packagingType?: string
  unNumber?: string
  transportClass?: string
  packingGroup?: string
  fireSuppressionRequired?: string
  specialHazards?: string
  remarks?: string
  healthRating?: string
  flammabilityRating?: string
  reactivityRating?: string
}

export type MSDSStatus = 'uploading' | 'analyzing' | 'review' | 'approved' | 'rejected' | 'expired' | 'superseded'

export type MSDSWorkflowStatus = 
  | 'pending_upload'
  | 'pending_analysis'
  | 'pending_review'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'superseded'

export interface MSDSReview {
  reviewerId?: string
  reviewerName?: string
  reviewDate?: string
  notes?: string
  changes?: string[]
  checklist?: ReviewChecklistItem[]
}

export interface ReviewChecklistItem {
  item: string
  checked: boolean
  notes?: string
}

export interface MSDSApproval {
  approverId?: string
  approverName?: string
  approvalDate?: string
  approvalLevel?: number
  comments?: string
}

export interface ParsingIssues {
  isProtected: boolean
  isImageOnly: boolean
  lowConfidence: boolean
  message: string
  suggestions?: string[]
}

export interface MSDSMetadata {
  submittedDate: string
  submittedBy?: string
  source?: string
  filename?: string
  tags?: string[]
  relatedDocuments?: string[]
  versionHistory?: MSDSVersion[]
}

export interface MSDSVersion {
  version: string
  date: string
  changes?: string
  changedBy?: string
}

// ============================================================================
// COMPATIBILITY TYPES
// ============================================================================

export interface CompatibilityCheck {
  id: string
  chemical1Id: string
  chemical1Name: string
  chemical2Id: string
  chemical2Name: string
  result: CompatibilityResult
  checkedAt: string
  checkedBy?: string
}

export interface CompatibilityResult {
  level: CompatibilityLevel
  explanation: string
  recommendations: string[]
  confidence: number
  reactionDetails?: ReactionDetails
  caseStudies?: CaseStudy[]
  aiAnalysis?: AICompatibilityAnalysis
}

export type CompatibilityLevel = 'SAFE' | 'CAUTION' | 'DANGER' | 'EXTREME_DANGER' | 'UNKNOWN'

export interface ReactionDetails {
  reactionType?: string
  products?: string[]
  conditions?: string
  hazards?: string[]
  heatGeneration?: boolean
  gasGeneration?: boolean
  explosionRisk?: boolean
}

export interface CaseStudy {
  title: string
  description: string
  outcome: string
  lessons?: string[]
}

export interface AICompatibilityAnalysis {
  reasoning: string
  factors: string[]
  confidence: number
  model?: string
}

// ============================================================================
// RISK ASSESSMENT TYPES
// ============================================================================

export interface RiskAssessment {
  id: string
  chemicalId: string
  chemicalName: string
  scenarioId: string
  scenarioName: string
  workplaceId: string
  workplaceName: string
  
  // Risk Data
  riskLevel: RiskLevel
  riskScore: number // 0-100
  confidenceScore: number // 0-1
  
  // Exposure
  exposure: ExposureScenario
  
  // Assessment
  assessment: RiskAssessmentDetails
  
  // Controls
  controls: ControlMeasures
  
  // Emergency
  emergency: EmergencyProcedures
  
  // Review
  review: ReviewInformation
  
  // Metadata
  metadata: RiskAssessmentMetadata
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'EXTREME'

export interface ExposureScenario {
  route: 'inhalation' | 'dermal' | 'ingestion' | 'eye' | 'multiple'
  duration: 'acute' | 'intermediate' | 'chronic'
  frequency: 'rare' | 'occasional' | 'frequent' | 'continuous'
  magnitude: 'trace' | 'low' | 'moderate' | 'high'
  concentration?: number
  units?: string
}

export interface RiskAssessmentDetails {
  reasoningNotes: string[]
  riskFactors: RiskFactor[]
  calculationMethod?: string
  formula?: string
}

export interface RiskFactor {
  factor: string
  value: number
  weight: number
  impact: 'Low' | 'Medium' | 'High'
}

export interface ControlMeasures {
  existing: ControlMeasure[]
  recommended: ControlMeasure[]
  effectiveness: number // 0-100
}

export interface ControlMeasure {
  type: 'Engineering' | 'Administrative' | 'PPE'
  description: string
  priority: 'High' | 'Medium' | 'Low'
  cost?: number
  implementationDate?: string
  status?: 'Implemented' | 'Pending' | 'Not Implemented'
}

export interface EmergencyProcedures {
  spill: string[]
  fire: string[]
  exposure: string[]
  evacuation?: string[]
  firstAid: string[]
  medicalAttention?: string[]
}

export interface ReviewInformation {
  reviewDate: string
  nextReviewDate: string
  reviewedBy?: string
  reviewHistory?: ReviewHistoryItem[]
}

export interface ReviewHistoryItem {
  date: string
  reviewedBy?: string
  changes?: string
  notes?: string
}

export interface RiskAssessmentMetadata {
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  status: 'Draft' | 'In Review' | 'Approved' | 'Expired'
  version: number
}

// ============================================================================
// CHEMICAL INVENTORY TYPES
// ============================================================================

export interface ChemicalInventory {
  id: string
  chemicalId: string
  chemicalName: string
  casNumber?: string
  
  // Location
  warehouseId?: string
  warehouseName?: string
  zoneId?: string
  zoneName?: string
  binId?: string
  binName?: string
  storageLocation?: string
  
  // Quantities
  currentQuantity: number
  reservedQuantity: number
  availableQuantity: number
  unit: string
  
  // Batch/Serial
  batchNumber?: string
  serialNumber?: string
  lotNumber?: string
  
  // Dates
  receivedDate?: string
  expiryDate?: string
  manufactureDate?: string
  
  // Status
  status: InventoryStatus
  alerts?: InventoryAlert[]
  
  // Segregation
  segregationGroup?: string
  incompatibleWith?: string[]
  
  // Metadata
  metadata: InventoryMetadata
}

export type InventoryStatus = 
  | 'Available'
  | 'Reserved'
  | 'Quarantine'
  | 'Expired'
  | 'Disposed'
  | 'In Transit'

export interface InventoryAlert {
  type: 'Low Stock' | 'Expiry' | 'Compliance' | 'Segregation' | 'Temperature'
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  message: string
  date: string
  acknowledged?: boolean
}

export interface InventoryMetadata {
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  tags?: string[]
}

// ============================================================================
// INCIDENT MANAGEMENT TYPES
// ============================================================================

export interface ChemicalIncident {
  id: string
  type: IncidentType
  severity: IncidentSeverity
  status: IncidentStatus
  
  // Chemical
  chemicalId?: string
  chemicalName: string
  casNumber?: string
  
  // Location
  location: string
  warehouseId?: string
  zoneId?: string
  
  // Details
  description: string
  date: string
  time: string
  reportedBy?: string
  reportedDate?: string
  
  // Impact
  impact: IncidentImpact
  
  // Response
  response: IncidentResponse
  
  // Investigation
  investigation?: IncidentInvestigation
  
  // Follow-up
  followUp?: IncidentFollowUp
  
  // Metadata
  metadata: IncidentMetadata
}

export type IncidentType = 
  | 'Spill'
  | 'Exposure'
  | 'Fire'
  | 'Explosion'
  | 'Environmental Release'
  | 'Near Miss'
  | 'Other'

export type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical'

export type IncidentStatus = 
  | 'Reported'
  | 'Under Investigation'
  | 'Resolved'
  | 'Closed'
  | 'Archived'

export interface IncidentImpact {
  personnelAffected?: number
  environmentalImpact?: string
  propertyDamage?: string
  businessImpact?: string
  cost?: number
}

export interface IncidentResponse {
  immediateActions: string[]
  responseTeam?: string[]
  equipmentUsed?: string[]
  containment?: string[]
  cleanup?: string[]
  communication?: string[]
}

export interface IncidentInvestigation {
  rootCause?: string
  contributingFactors?: string[]
  timeline?: IncidentTimelineItem[]
  findings?: string[]
  recommendations?: string[]
  investigator?: string
  investigationDate?: string
}

export interface IncidentTimelineItem {
  time: string
  event: string
  description?: string
}

export interface IncidentFollowUp {
  actionsTaken: string[]
  preventiveMeasures?: string[]
  trainingProvided?: string[]
  systemChanges?: string[]
  followUpDate?: string
  status?: 'Open' | 'In Progress' | 'Completed'
}

export interface IncidentMetadata {
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  tags?: string[]
  relatedIncidents?: string[]
}

// ============================================================================
// TRAINING & CERTIFICATION TYPES
// ============================================================================

export interface ChemicalTraining {
  id: string
  courseId: string
  courseName: string
  employeeId: string
  employeeName: string
  
  // Training Details
  type: TrainingType
  status: TrainingStatus
  completionDate?: string
  expiryDate?: string
  renewalDate?: string
  
  // Assessment
  score?: number
  passed?: boolean
  certificateNumber?: string
  
  // Metadata
  metadata: TrainingMetadata
}

export type TrainingType = 
  | 'Chemical Safety'
  | 'MSDS Reading'
  | 'Emergency Response'
  | 'Hazard Communication'
  | 'Storage & Handling'
  | 'Compliance'
  | 'Other'

export type TrainingStatus = 
  | 'Not Started'
  | 'In Progress'
  | 'Completed'
  | 'Expired'
  | 'Renewal Required'

export interface TrainingMetadata {
  createdAt: string
  updatedAt: string
  provider?: string
  duration?: number
  tags?: string[]
}

// ============================================================================
// ANALYTICS & REPORTING TYPES
// ============================================================================

export interface ChemicalAnalytics {
  overview: AnalyticsOverview
  trends: AnalyticsTrends
  risks: AnalyticsRisks
  compliance: AnalyticsCompliance
  inventory: AnalyticsInventory
  incidents: AnalyticsIncidents
}

export interface AnalyticsOverview {
  totalChemicals: number
  totalMSDS: number
  highRiskChemicals: number
  complianceRate: number
  inventoryValue: number
  activeIncidents: number
}

export interface AnalyticsTrends {
  chemicalAdditions: TimeSeriesData[]
  riskLevels: TimeSeriesData[]
  complianceScores: TimeSeriesData[]
  incidentFrequency: TimeSeriesData[]
}

export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}

export interface AnalyticsRisks {
  riskDistribution: RiskDistribution
  highRiskChemicals: HighRiskChemical[]
  riskTrends: RiskTrend[]
}

export interface RiskDistribution {
  low: number
  medium: number
  high: number
  veryHigh: number
  extreme: number
}

export interface HighRiskChemical {
  chemicalId: string
  chemicalName: string
  riskLevel: RiskLevel
  riskScore: number
  reasons: string[]
}

export interface RiskTrend {
  date: string
  averageRisk: number
  highRiskCount: number
}

export interface AnalyticsCompliance {
  complianceRate: number
  complianceByRegion: ComplianceByRegion[]
  expiringCertifications: Certification[]
  regulatoryUpdates: RegulatoryUpdate[]
}

export interface ComplianceByRegion {
  region: string
  complianceRate: number
  totalChemicals: number
  compliant: number
  nonCompliant: number
}

export interface AnalyticsInventory {
  totalInventory: number
  inventoryByLocation: InventoryByLocation[]
  expiringInventory: ChemicalInventory[]
  lowStockAlerts: ChemicalInventory[]
}

export interface InventoryByLocation {
  location: string
  count: number
  value: number
}

export interface AnalyticsIncidents {
  totalIncidents: number
  incidentsByType: IncidentByType[]
  incidentsBySeverity: IncidentBySeverity[]
  recentIncidents: ChemicalIncident[]
}

export interface IncidentByType {
  type: IncidentType
  count: number
}

export interface IncidentBySeverity {
  severity: IncidentSeverity
  count: number
}

// ============================================================================
// SEARCH & FILTER TYPES
// ============================================================================

export interface ChemicalSearchFilters {
  name?: string
  casNumber?: string
  formula?: string
  manufacturer?: string
  hazardClass?: string
  storageClass?: string
  complianceStatus?: string
  riskLevel?: RiskLevel
  tags?: string[]
  categories?: string[]
  dateRange?: {
    from: string
    to: string
  }
}

export interface ChemicalSearchResult {
  chemicals: Chemical[]
  total: number
  page: number
  pageSize: number
  filters: ChemicalSearchFilters
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ChemicalAPIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface BatchOperationResult {
  total: number
  successful: number
  failed: number
  errors?: string[]
}

