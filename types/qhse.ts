/**
 * QHSE (Quality, Health, Safety, Environment) Module Type Definitions
 * Comprehensive type system for QHSE management
 * Integrated with BlueDXP platform ecosystem
 */

// ============================================================================
// CORE ENTITIES
// ============================================================================

export type QHSEEntityType = 
  | 'INCIDENT'
  | 'INSPECTION'
  | 'TRAINING'
  | 'ENVIRONMENTAL_METRIC'
  | 'SAFETY_METRIC'
  | 'REGULATORY_AUDIT'
  | 'ESG_REPORT'
  | 'CAPA'
  | 'NCR'

export type IncidentType = 
  | 'NEAR_MISS'
  | 'FIRST_AID'
  | 'MEDICAL_TREATMENT'
  | 'LOST_TIME'
  | 'FATALITY'
  | 'PROPERTY_DAMAGE'
  | 'ENVIRONMENTAL_RELEASE'
  | 'FIRE'
  | 'EXPLOSION'
  | 'CHEMICAL_SPILL'
  | 'PPE_NON_COMPLIANCE'
  | 'SAFETY_VIOLATION'
  | 'OTHER'

export type IncidentSeverity = 
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'

export type IncidentStatus = 
  | 'REPORTED'
  | 'UNDER_INVESTIGATION'
  | 'INVESTIGATION_COMPLETE'
  | 'CORRECTIVE_ACTION_REQUIRED'
  | 'CLOSED'
  | 'ARCHIVED'

export type InspectionType = 
  | 'SAFETY_INSPECTION'
  | 'ENVIRONMENTAL_INSPECTION'
  | 'QUALITY_INSPECTION'
  | 'FIRE_SAFETY_INSPECTION'
  | 'EQUIPMENT_INSPECTION'
  | 'FACILITY_INSPECTION'
  | 'REGULATORY_AUDIT'
  | 'INTERNAL_AUDIT'
  | 'SUPPLIER_AUDIT'
  | 'OTHER'

export type InspectionStatus = 
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OVERDUE'

export type FindingSeverity = 
  | 'CRITICAL'
  | 'MAJOR'
  | 'MINOR'
  | 'OBSERVATION'

export type TrainingStatus = 
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED'

export type CertificationStatus = 
  | 'VALID'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'REVOKED'

export type EnvironmentalMetricType = 
  | 'CARBON_FOOTPRINT'
  | 'WASTE_GENERATION'
  | 'WASTE_DIVERSION'
  | 'ENERGY_CONSUMPTION'
  | 'WATER_USAGE'
  | 'RECYCLING_RATE'
  | 'EMISSIONS'
  | 'HAZARDOUS_WASTE'
  | 'AIR_QUALITY'
  | 'WATER_QUALITY'

export type RegulatoryStandard = 
  | 'ISO_45001'
  | 'ISO_14001'
  | 'ISO_9001'
  | 'OSHA'
  | 'RIDDOR'
  | 'ANSI_Z10'
  | 'NEBOSH'
  | 'OTHER'

export type ESGReportingFramework = 
  | 'GRI'
  | 'SASB'
  | 'TCFD'
  | 'CDP'
  | 'UNGC'
  | 'OTHER'

// ============================================================================
// INCIDENT MANAGEMENT
// ============================================================================

export interface Incident {
  id: string
  tenantId: string
  customerId?: string
  warehouseId?: string
  facilityId?: string
  
  // Basic Information
  incidentNumber: string
  type: IncidentType
  severity: IncidentSeverity
  status: IncidentStatus
  title: string
  description: string
  
  // Location & Time
  location: string
  locationDetails?: string
  occurredAt: Date | string
  reportedAt: Date | string
  reportedBy: string // User ID
  
  // People Involved
  peopleInvolved?: Array<{
    personId: string
    personName: string
    role: string
    injuryType?: string
    severity?: string
  }>
  
  // Investigation
  investigation?: Investigation
  rootCauseAnalysis?: RootCauseAnalysis
  
  // Corrective Actions
  correctiveActions?: string[] // CAPA IDs
  preventiveActions?: string[] // CAPA IDs
  
  // Compliance
  oshaRecordable: boolean
  oshaClassification?: string
  riddorReportable: boolean
  riddorClassification?: string
  
  // Media & Documents
  photos?: string[] // File URLs
  documents?: string[] // File URLs
  witnessStatements?: WitnessStatement[]
  
  // Metadata
  tags?: string[]
  assignedTo?: string // User ID
  approvedBy?: string // User ID
  approvedAt?: Date | string
  closedAt?: Date | string
  closedBy?: string // User ID
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string // User ID
  updatedBy: string // User ID
}

export interface Investigation {
  id: string
  incidentId: string
  investigatorId: string // User ID
  investigationStartDate: Date | string
  investigationEndDate?: Date | string
  investigationMethod: string
  findings: string
  contributingFactors: string[]
  immediateActions: string[]
  recommendations: string[]
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD'
  documents?: string[] // File URLs
  createdAt: Date | string
  updatedAt: Date | string
}

export interface RootCauseAnalysis {
  id: string
  incidentId: string
  method: '5_WHY' | 'FISHBONE' | 'FAULT_TREE' | 'OTHER'
  rootCauses: Array<{
    id: string
    cause: string
    category: 'HUMAN_FACTOR' | 'EQUIPMENT' | 'ENVIRONMENT' | 'PROCESS' | 'MANAGEMENT' | 'OTHER'
    evidence: string
    likelihood: number // 0-100
  }>
  contributingFactors: string[]
  analysisDate: Date | string
  analyzedBy: string // User ID
  createdAt: Date | string
  updatedAt: Date | string
}

export interface WitnessStatement {
  id: string
  incidentId: string
  witnessName: string
  witnessContact?: string
  statement: string
  recordedAt: Date | string
  recordedBy: string // User ID
  signature?: string // Digital signature
  createdAt: Date | string
}

// ============================================================================
// INSPECTION MANAGEMENT
// ============================================================================

export interface Inspection {
  id: string
  tenantId: string
  customerId?: string
  warehouseId?: string
  facilityId?: string
  
  // Basic Information
  inspectionNumber: string
  type: InspectionType
  status: InspectionStatus
  title: string
  description?: string
  
  // Scheduling
  scheduledDate: Date | string
  scheduledBy: string // User ID
  conductedDate?: Date | string
  conductedBy?: string // User ID
  duration?: number // Minutes
  
  // Location
  location: string
  locationDetails?: string
  
  // Checklist
  checklistId?: string
  checklistItems?: InspectionChecklistItem[]
  
  // Findings
  findings?: InspectionFinding[]
  totalFindings?: number
  criticalFindings?: number
  majorFindings?: number
  minorFindings?: number
  observations?: number
  
  // Compliance
  complianceScore?: number // 0-100
  regulatoryStandard?: RegulatoryStandard
  
  // Follow-up
  correctiveActionsRequired?: string[] // CAPA IDs
  followUpDate?: Date | string
  followUpRequired: boolean
  
  // Documents
  documents?: string[] // File URLs
  photos?: string[] // File URLs
  
  // Approval
  approvedBy?: string // User ID
  approvedAt?: Date | string
  
  // Metadata
  tags?: string[]
  notes?: string
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string // User ID
  updatedBy: string // User ID
}

export interface InspectionChecklistItem {
  id: string
  inspectionId: string
  itemNumber: string
  category: string
  question: string
  requirement?: string
  status: 'PASS' | 'FAIL' | 'N/A' | 'NOT_CHECKED'
  notes?: string
  evidence?: string[] // File URLs
  checkedBy?: string // User ID
  checkedAt?: Date | string
}

export interface InspectionFinding {
  id: string
  inspectionId: string
  findingNumber: string
  severity: FindingSeverity
  category: string
  description: string
  requirement?: string
  location?: string
  evidence?: string[] // File URLs
  correctiveActionId?: string // CAPA ID
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'VERIFIED'
  assignedTo?: string // User ID
  dueDate?: Date | string
  closedDate?: Date | string
  verifiedDate?: Date | string
  verifiedBy?: string // User ID
  createdAt: Date | string
  updatedAt: Date | string
}

// ============================================================================
// TRAINING MANAGEMENT
// ============================================================================

export interface TrainingProgram {
  id: string
  tenantId: string
  customerId?: string
  
  // Basic Information
  programNumber: string
  name: string
  description?: string
  category: string
  type: 'INITIAL' | 'REFRESHER' | 'SPECIALIZED' | 'CERTIFICATION' | 'OTHER'
  
  // Requirements
  requiredForRoles?: string[] // Role IDs
  requiredForDepartments?: string[]
  frequency?: 'ONE_TIME' | 'ANNUAL' | 'BIANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'CUSTOM'
  validityPeriod?: number // Days
  prerequisites?: string[] // Training Program IDs
  
  // Content
  content?: string
  materials?: string[] // File URLs
  duration?: number // Minutes
  deliveryMethod: 'CLASSROOM' | 'ONLINE' | 'ON_THE_JOB' | 'HYBRID' | 'SELF_STUDY'
  
  // Compliance
  regulatoryStandard?: RegulatoryStandard
  certificationRequired: boolean
  certificationBody?: string
  
  // Status
  isActive: boolean
  isMandatory: boolean
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string // User ID
  updatedBy: string // User ID
}

export interface TrainingRecord {
  id: string
  tenantId: string
  customerId?: string
  warehouseId?: string
  
  // Training Information
  trainingProgramId: string
  trainingProgram?: TrainingProgram
  employeeId: string // User ID
  employeeName?: string
  
  // Status
  status: TrainingStatus
  progress?: number // 0-100
  
  // Dates
  assignedDate: Date | string
  startedDate?: Date | string
  completedDate?: Date | string
  expiryDate?: Date | string
  dueDate?: Date | string
  
  // Completion
  completionPercentage?: number
  score?: number
  passed: boolean
  attempts?: number
  
  // Certification
  certificationId?: string
  certificationNumber?: string
  certificationStatus?: CertificationStatus
  certificationIssuedDate?: Date | string
  certificationExpiryDate?: Date | string
  certificationBody?: string
  
  // Instructor
  instructorId?: string // User ID
  instructorName?: string
  
  // Documents
  certificate?: string // File URL
  documents?: string[] // File URLs
  
  // Notes
  notes?: string
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string // User ID
  updatedBy: string // User ID
}

// ============================================================================
// ENVIRONMENTAL METRICS
// ============================================================================

export interface EnvironmentalMetric {
  id: string
  tenantId: string
  customerId?: string
  warehouseId?: string
  facilityId?: string
  
  // Basic Information
  metricType: EnvironmentalMetricType
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  periodStart: Date | string
  periodEnd: Date | string
  
  // Values
  value: number
  unit: string
  baseline?: number
  target?: number
  previousValue?: number
  
  // Trends
  trend?: 'INCREASING' | 'DECREASING' | 'STABLE'
  changePercentage?: number
  
  // Breakdown
  breakdown?: Record<string, number> // Category breakdown
  
  // Compliance
  regulatoryRequirement?: string
  complianceStatus?: 'COMPLIANT' | 'NON_COMPLIANT' | 'AT_RISK'
  
  // Notes
  notes?: string
  verifiedBy?: string // User ID
  verifiedAt?: Date | string
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string // User ID
  updatedBy: string // User ID
}

// ============================================================================
// SAFETY METRICS
// ============================================================================

export interface SafetyMetric {
  id: string
  tenantId: string
  customerId?: string
  warehouseId?: string
  facilityId?: string
  
  // Period
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  periodStart: Date | string
  periodEnd: Date | string
  
  // TRIR (Total Recordable Incident Rate)
  trir?: {
    recordableIncidents: number
    totalHoursWorked: number
    rate: number // Per 200,000 hours
    target?: number
    previousRate?: number
    trend?: 'IMPROVING' | 'DETERIORATING' | 'STABLE'
  }
  
  // LTIFR (Lost Time Injury Frequency Rate)
  ltifr?: {
    lostTimeInjuries: number
    totalHoursWorked: number
    rate: number // Per 1,000,000 hours
    target?: number
    previousRate?: number
    trend?: 'IMPROVING' | 'DETERIORATING' | 'STABLE'
  }
  
  // Other Metrics
  nearMisses?: number
  firstAidCases?: number
  medicalTreatmentCases?: number
  lostTimeCases?: number
  fatalities?: number
  safetyObservations?: number
  safetyObservationsClosed?: number
  
  // Employee Count
  averageEmployeeCount?: number
  totalHoursWorked?: number
  
  // Targets
  targets?: {
    trir?: number
    ltifr?: number
    nearMisses?: number
    safetyObservations?: number
  }
  
  // Compliance
  oshaCompliant: boolean
  oshaLogGenerated: boolean
  oshaLogSubmitted: boolean
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string // User ID
  updatedBy: string // User ID
}

// ============================================================================
// REGULATORY COMPLIANCE
// ============================================================================

export interface RegulatoryAudit {
  id: string
  tenantId: string
  customerId?: string
  warehouseId?: string
  facilityId?: string
  
  // Basic Information
  auditNumber: string
  auditType: 'EXTERNAL' | 'INTERNAL' | 'SUPPLIER' | 'REGULATORY'
  regulatoryStandard: RegulatoryStandard
  authority: string
  auditorName?: string
  auditorOrganization?: string
  
  // Scheduling
  scheduledDate: Date | string
  scheduledBy: string // User ID
  conductedDate?: Date | string
  duration?: number // Days
  
  // Status
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DEFERRED'
  
  // Scope
  scope: string
  scopeAreas?: string[]
  
  // Results
  findings?: number
  nonConformities?: number
  observations?: number
  score?: number // 0-100
  grade?: 'A' | 'B' | 'C' | 'D' | 'F'
  passed: boolean
  
  // Findings
  auditFindings?: Array<{
    id: string
    findingNumber: string
    severity: FindingSeverity
    clause?: string
    description: string
    correctiveActionId?: string // CAPA ID
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'VERIFIED'
  }>
  
  // Documents
  auditReport?: string // File URL
  documents?: string[] // File URLs
  
  // Follow-up
  followUpRequired: boolean
  followUpDate?: Date | string
  followUpCompleted?: boolean
  
  // Certification
  certificationIssued?: boolean
  certificationNumber?: string
  certificationExpiryDate?: Date | string
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string // User ID
  updatedBy: string // User ID
}

// ============================================================================
// ESG REPORTING
// ============================================================================

export interface ESGReport {
  id: string
  tenantId: string
  customerId?: string
  
  // Basic Information
  reportNumber: string
  reportingPeriod: string
  periodStart: Date | string
  periodEnd: Date | string
  framework: ESGReportingFramework
  
  // Environmental
  environmental?: {
    carbonFootprint?: {
      scope1?: number // Direct emissions
      scope2?: number // Indirect emissions (energy)
      scope3?: number // Other indirect emissions
      total?: number
      unit: string
    }
    wasteManagement?: {
      totalWaste?: number
      wasteDiverted?: number
      wasteRecycled?: number
      wasteToLandfill?: number
      diversionRate?: number // Percentage
    }
    energyConsumption?: {
      totalEnergy?: number
      renewableEnergy?: number
      renewablePercentage?: number
      unit: string
    }
    waterUsage?: {
      totalWater?: number
      waterRecycled?: number
      unit: string
    }
  }
  
  // Social
  social?: {
    employeeSafety?: {
      trir?: number
      ltifr?: number
      fatalities?: number
    }
    training?: {
      totalTrainingHours?: number
      employeesTrained?: number
      trainingCompletionRate?: number
    }
    diversity?: {
      genderDiversity?: number // Percentage
      ethnicDiversity?: number // Percentage
    }
  }
  
  // Governance
  governance?: {
    complianceScore?: number
    auditsCompleted?: number
    certifications?: number
    violations?: number
  }
  
  // Status
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED'
  approvedBy?: string // User ID
  approvedAt?: Date | string
  publishedAt?: Date | string
  
  // Documents
  reportDocument?: string // File URL
  supportingDocuments?: string[] // File URLs
  
  createdAt: Date | string
  updatedAt: Date | string
  createdBy: string // User ID
  updatedBy: string // User ID
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface QHSEIncidentService {
  createIncident(data: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>): Promise<Incident>
  getIncident(id: string): Promise<Incident | null>
  getIncidents(filters?: IncidentFilters): Promise<Incident[]>
  updateIncident(id: string, data: Partial<Incident>): Promise<Incident>
  deleteIncident(id: string): Promise<void>
  startInvestigation(incidentId: string, investigatorId: string): Promise<Investigation>
  completeInvestigation(investigationId: string, findings: string): Promise<Investigation>
  performRootCauseAnalysis(incidentId: string, method: RootCauseAnalysis['method']): Promise<RootCauseAnalysis>
  calculateTRIR(filters: SafetyMetricFilters): Promise<number>
  calculateLTIFR(filters: SafetyMetricFilters): Promise<number>
}

export interface QHSEInspectionService {
  createInspection(data: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Inspection>
  getInspection(id: string): Promise<Inspection | null>
  getInspections(filters?: InspectionFilters): Promise<Inspection[]>
  updateInspection(id: string, data: Partial<Inspection>): Promise<Inspection>
  deleteInspection(id: string): Promise<void>
  conductInspection(inspectionId: string, checklistItems: InspectionChecklistItem[]): Promise<Inspection>
  addFinding(inspectionId: string, finding: Omit<InspectionFinding, 'id' | 'createdAt' | 'updatedAt'>): Promise<InspectionFinding>
  updateFinding(findingId: string, data: Partial<InspectionFinding>): Promise<InspectionFinding>
  calculateComplianceScore(inspectionId: string): Promise<number>
}

export interface QHSETrainingService {
  createTrainingProgram(data: Omit<TrainingProgram, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingProgram>
  getTrainingProgram(id: string): Promise<TrainingProgram | null>
  getTrainingPrograms(filters?: TrainingProgramFilters): Promise<TrainingProgram[]>
  updateTrainingProgram(id: string, data: Partial<TrainingProgram>): Promise<TrainingProgram>
  deleteTrainingProgram(id: string): Promise<void>
  assignTraining(employeeId: string, trainingProgramId: string, dueDate?: Date): Promise<TrainingRecord>
  getTrainingRecord(id: string): Promise<TrainingRecord | null>
  getTrainingRecords(filters?: TrainingRecordFilters): Promise<TrainingRecord[]>
  updateTrainingProgress(recordId: string, progress: number): Promise<TrainingRecord>
  completeTraining(recordId: string, score?: number): Promise<TrainingRecord>
  getTrainingCompliance(employeeId?: string, roleId?: string): Promise<TrainingComplianceReport>
  getExpiringCertifications(days?: number): Promise<TrainingRecord[]>
}

export interface QHSEEnvironmentalService {
  recordMetric(data: Omit<EnvironmentalMetric, 'id' | 'createdAt' | 'updatedAt'>): Promise<EnvironmentalMetric>
  getMetric(id: string): Promise<EnvironmentalMetric | null>
  getMetrics(filters?: EnvironmentalMetricFilters): Promise<EnvironmentalMetric[]>
  updateMetric(id: string, data: Partial<EnvironmentalMetric>): Promise<EnvironmentalMetric>
  deleteMetric(id: string): Promise<void>
  calculateCarbonFootprint(filters: EnvironmentalMetricFilters): Promise<number>
  calculateWasteDiversionRate(filters: EnvironmentalMetricFilters): Promise<number>
  getEnvironmentalTrends(filters: EnvironmentalMetricFilters): Promise<EnvironmentalTrend[]>
}

export interface QHSESafetyMetricsService {
  calculateTRIR(filters: SafetyMetricFilters): Promise<number>
  calculateLTIFR(filters: SafetyMetricFilters): Promise<number>
  recordSafetyMetric(data: Omit<SafetyMetric, 'id' | 'createdAt' | 'updatedAt'>): Promise<SafetyMetric>
  getSafetyMetric(id: string): Promise<SafetyMetric | null>
  getSafetyMetrics(filters?: SafetyMetricFilters): Promise<SafetyMetric[]>
  updateSafetyMetric(id: string, data: Partial<SafetyMetric>): Promise<SafetyMetric>
  getSafetyTrends(filters: SafetyMetricFilters): Promise<SafetyTrend[]>
  compareToIndustryBenchmark(metric: 'TRIR' | 'LTIFR'): Promise<BenchmarkComparison>
}

export interface QHSERegulatoryComplianceService {
  scheduleAudit(data: Omit<RegulatoryAudit, 'id' | 'createdAt' | 'updatedAt'>): Promise<RegulatoryAudit>
  getAudit(id: string): Promise<RegulatoryAudit | null>
  getAudits(filters?: RegulatoryAuditFilters): Promise<RegulatoryAudit[]>
  updateAudit(id: string, data: Partial<RegulatoryAudit>): Promise<RegulatoryAudit>
  deleteAudit(id: string): Promise<void>
  conductAudit(auditId: string, findings: RegulatoryAudit['auditFindings']): Promise<RegulatoryAudit>
  getUpcomingAudits(days?: number): Promise<RegulatoryAudit[]>
  getComplianceScore(filters?: ComplianceScoreFilters): Promise<number>
  generateOSHALog(filters: SafetyMetricFilters): Promise<OSHALog>
  submitOSHALog(logId: string): Promise<void>
}

// ============================================================================
// FILTERS & QUERIES
// ============================================================================

export interface IncidentFilters {
  tenantId?: string
  customerId?: string
  warehouseId?: string
  facilityId?: string
  type?: IncidentType
  severity?: IncidentSeverity
  status?: IncidentStatus
  dateFrom?: Date | string
  dateTo?: Date | string
  assignedTo?: string
  tags?: string[]
}

export interface InspectionFilters {
  tenantId?: string
  customerId?: string
  warehouseId?: string
  facilityId?: string
  type?: InspectionType
  status?: InspectionStatus
  dateFrom?: Date | string
  dateTo?: Date | string
  conductedBy?: string
}

export interface TrainingProgramFilters {
  tenantId?: string
  customerId?: string
  category?: string
  type?: TrainingProgram['type']
  isActive?: boolean
  isMandatory?: boolean
}

export interface TrainingRecordFilters {
  tenantId?: string
  customerId?: string
  warehouseId?: string
  employeeId?: string
  trainingProgramId?: string
  status?: TrainingStatus
  certificationStatus?: CertificationStatus
  expiryDateFrom?: Date | string
  expiryDateTo?: Date | string
}

export interface EnvironmentalMetricFilters {
  tenantId?: string
  customerId?: string
  warehouseId?: string
  facilityId?: string
  metricType?: EnvironmentalMetricType
  periodStart?: Date | string
  periodEnd?: Date | string
}

export interface SafetyMetricFilters {
  tenantId?: string
  customerId?: string
  warehouseId?: string
  facilityId?: string
  periodStart?: Date | string
  periodEnd?: Date | string
}

export interface RegulatoryAuditFilters {
  tenantId?: string
  customerId?: string
  warehouseId?: string
  facilityId?: string
  auditType?: RegulatoryAudit['auditType']
  regulatoryStandard?: RegulatoryStandard
  status?: RegulatoryAudit['status']
  dateFrom?: Date | string
  dateTo?: Date | string
}

export interface ComplianceScoreFilters {
  tenantId?: string
  customerId?: string
  warehouseId?: string
  facilityId?: string
  dateFrom?: Date | string
  dateTo?: Date | string
}

// ============================================================================
// REPORTS & ANALYTICS
// ============================================================================

export interface TrainingComplianceReport {
  employeeId?: string
  roleId?: string
  totalPrograms: number
  completedPrograms: number
  inProgressPrograms: number
  expiredPrograms: number
  complianceRate: number // Percentage
  programs: Array<{
    programId: string
    programName: string
    status: TrainingStatus
    completionDate?: Date | string
    expiryDate?: Date | string
    certificationStatus?: CertificationStatus
  }>
}

export interface EnvironmentalTrend {
  metricType: EnvironmentalMetricType
  period: Date | string
  value: number
  trend: 'INCREASING' | 'DECREASING' | 'STABLE'
  changePercentage: number
}

export interface SafetyTrend {
  period: Date | string
  trir?: number
  ltifr?: number
  nearMisses?: number
  safetyObservations?: number
  trend: 'IMPROVING' | 'DETERIORATING' | 'STABLE'
}

export interface BenchmarkComparison {
  metric: 'TRIR' | 'LTIFR'
  ourValue: number
  industryAverage: number
  industryPercentile: number // 0-100
  benchmark: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE' | 'POOR'
}

export interface OSHALog {
  id: string
  period: string
  year: number
  recordableIncidents: Array<{
    id: string
    incidentId: string
    employeeName: string
    dateOfInjury: Date | string
    description: string
    classification: string
    daysAway?: number
    jobTransfer?: boolean
    restrictedWork?: boolean
  }>
  totalRecordableCases: number
  totalDaysAway: number
  totalJobTransfer: number
  totalRestrictedWork: number
  totalHoursWorked: number
  trir: number
  submitted: boolean
  submittedAt?: Date | string
  submittedBy?: string
}

// ============================================================================
// DASHBOARD & ANALYTICS
// ============================================================================

export interface QHSEDashboard {
  tenantId: string
  customerId?: string
  warehouseId?: string
  facilityId?: string
  period: {
    start: Date | string
    end: Date | string
  }
  
  // Safety Metrics
  safety: {
    trir: number
    ltifr: number
    nearMisses: number
    incidents: number
    openIncidents: number
    safetyObservations: number
    trend: 'IMPROVING' | 'DETERIORATING' | 'STABLE'
  }
  
  // Quality Metrics
  quality: {
    defectRate: number
    customerComplaints: number
    onTimeDelivery: number
    auditsCompleted: number
    ncrCount: number
  }
  
  // Health Metrics
  health: {
    medicalCases: number
    firstAidCases: number
    lostTimeCases: number
    trainingCompletionRate: number
    certificationsExpiring: number
  }
  
  // Environmental Metrics
  environmental: {
    carbonFootprint: number
    wasteReduction: number
    energyConsumption: number
    waterUsage: number
    recyclingRate: number
  }
  
  // Compliance
  compliance: {
    overallScore: number
    regulatoryAudits: number
    upcomingAudits: number
    openFindings: number
    certifications: number
  }
}











