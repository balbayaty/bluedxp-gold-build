/**
 * MSDS Types
 * Shared types for MSDS services and components
 */

export interface ExtractedMSDSData {
  productName: string
  manufacturer: string
  casNumber: string
  ecNumber?: string
  unNumber?: string
  molecularFormula?: string
  formula: string
  hazardClass: string
  hazardLevel: 'High' | 'Medium' | 'Low'
  hazardStatements: string[]
  precautionaryStatements: string[]
  physicalState: string
  flashPoint: string
  boilingPoint: string
  ph: string
  storageConditions: string[]
  incompatibleMaterials: string[]
  ppeRequired: string[]
  firstAid: string
  firefighting: string
  spillResponse: string
  ghsCompliant: boolean
  safetyScore: number
  aiConfidence: number
  packagingType: string
  transportClass: string
  packingGroup: string
  fireSuppressionRequired: string
  specialHazards: string
  remarks: string
  healthRating: string
  flammabilityRating: string
  reactivityRating: string
}

export interface MSDSParsingIssues {
  isProtected: boolean
  isImageOnly: boolean
  lowConfidence: boolean
  message: string
}

export interface MSDSDuplicateMatch {
  submissionId: string
  similarity: number
  matchType: 'exact' | 'cas' | 'name' | 'similar'
  matchedFields: string[]
  confidence: 'high' | 'medium' | 'low'
}

export interface MSDSSubmission {
  id: string
  file: File
  status: 'uploading' | 'analyzing' | 'review' | 'approved' | 'rejected'
  extractedData?: ExtractedMSDSData
  manualNotes?: string
  customerEmail?: string
  customerId?: string
  customerName?: string
  subCustomerId?: string
  subCustomerName?: string
  submittedDate: Date
  parsingIssues?: MSDSParsingIssues
  duplicateMatch?: MSDSDuplicateMatch
}











