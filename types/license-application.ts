/**
 * License Application System Type Definitions
 * Comprehensive types for government platform integration and license management
 */

export type LicenseType = 
  | 'CIVIL_DEFENSE_CHEMICAL'
  | 'SFDA_FOOD'
  | 'SFDA_MEDICINE'
  | 'SABER_CERTIFICATE'
  | 'CUSTOMS_CLEARANCE'
  | 'IMPORT_LICENSE'
  | 'EXPORT_LICENSE'

export interface LicenseApplication {
  id: string
  productId: string
  productName: string
  productCategory: string
  chemicalName?: string
  casNumber?: string
  unNumber?: string
  hazardClass?: string
  licenseTypes: LicenseType[]
  status: 'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  documents: ApplicationDocument[]
  consultantId?: string
  consultantName?: string
  applications: GovernmentApplication[]
  createdAt: string
  updatedAt: string
}

export interface ApplicationDocument {
  id: string
  type: string
  name: string
  source: 'AUTO_PULLED' | 'MANUAL_UPLOAD' | 'GENERATED'
  status: 'PENDING' | 'AVAILABLE' | 'MISSING' | 'VALIDATED'
  url?: string
  validatedAt?: string
}

export interface GovernmentApplication {
  id: string
  platform: 'CIVIL_DEFENSE' | 'SFDA' | 'SABER' | 'CUSTOMS'
  applicationId: string
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'INSPECTION_SCHEDULED' | 'APPROVED' | 'REJECTED'
  submittedAt: string
  estimatedCompletion?: string
  rejectionReason?: string
}

export interface Consultant {
  id: string
  name: string
  company: string
  type: 'SAFETY' | 'REGULATORY' | 'TECHNICAL' | 'LEGAL'
  specialties: string[]
  serviceAreas: string[]
  rating: number
  totalJobs: number
  successRate: number
  averageResponseTime: number // hours
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE'
  pricing: {
    consultation: number
    documentPreparation: number
    applicationSubmission: number
  }
  certifications: string[]
  languages: string[]
  avatar?: string
}

export interface LicenseJourney {
  applicationId: string
  currentStep: number
  totalSteps: number
  steps: JourneyStep[]
  timeline: TimelineEvent[]
  estimatedCompletion: string
  documentsStatus: {
    required: number
    available: number
    missing: number
    validated: number
  }
  consultantStatus?: {
    assigned: boolean
    consultantName?: string
    progress?: number
  }
  governmentStatus: {
    civilDefense?: ApplicationStatus
    sfda?: ApplicationStatus
    saber?: ApplicationStatus
  }
}

export interface JourneyStep {
  id: string
  name: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  completedAt?: string
  estimatedDuration?: number
}

export interface TimelineEvent {
  id: string
  timestamp: string
  type: 'DOCUMENT_ADDED' | 'DOCUMENT_VALIDATED' | 'CONSULTANT_ASSIGNED' | 'APPLICATION_SUBMITTED' | 'STATUS_UPDATE' | 'INSPECTION_SCHEDULED' | 'APPROVED' | 'REJECTED'
  title: string
  description: string
  icon: string
  color: string
}

export interface ApplicationStatus {
  status: string
  lastUpdated: string
  nextAction?: string
  estimatedDays?: number
}

