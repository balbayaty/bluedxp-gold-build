/**
 * Digital Signature Module Types
 * Court-admissible digital signatures for BlueDXP Platform
 * Supports: Internal PKI, Saudi QES (Nafath/emdha), Multi-stakeholder workflows
 */

// ============================================================================
// USER TYPES
// ============================================================================

export type SignatureUserType = 'staff' | 'customer' | 'supplier' | 'driver' | 'admin' | 'system' | 'external' | 'witness'

export interface SignatureUser {
  id: string
  organizationId?: string
  email: string
  phone?: string
  nationalId?: string
  iqamaId?: string
  firstName: string
  firstNameAr?: string
  lastName: string
  lastNameAr?: string
  userType: SignatureUserType
  isActive: boolean
  nafathVerified?: boolean
  nafathVerificationDate?: Date
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// CERTIFICATE TYPES
// ============================================================================

export type CertificateType = 'signing' | 'encryption' | 'authentication' | 'all'
export type CertificateStatus = 'active' | 'revoked' | 'expired' | 'suspended' | 'pending'
export type CAType = 'root' | 'intermediate' | 'issuing'

export interface CertificateAuthority {
  id: string
  name: string
  caType: CAType
  parentCaId?: string
  subjectDN: string
  publicKeyPEM: string
  privateKeyEncrypted?: Buffer
  certificatePEM: string
  serialNumber: string
  validFrom: Date
  validTo: Date
  keyAlgorithm: string
  keySize: number
  isActive: boolean
  createdAt: Date
}

export interface UserCertificate {
  id: string
  userId: string
  issuingCaId?: string
  certificateType: CertificateType
  subjectDN: string
  publicKeyPEM: string
  privateKeyEncrypted?: Buffer
  certificatePEM: string
  serialNumber: string
  validFrom: Date
  validTo: Date
  status: CertificateStatus
  revocationDate?: Date
  revocationReason?: string
  createdAt: Date
}

// ============================================================================
// DOCUMENT TYPES
// ============================================================================

export type DocumentStatus = 'draft' | 'pending_signatures' | 'partially_signed' | 'completed' | 'rejected' | 'expired' | 'cancelled' | 'archived'

export interface Document {
  id: string
  organizationId: string
  createdByUserId: string
  documentType: string
  title: string
  titleAr?: string
  originalFilename: string
  storagePath: string
  storageBucket: string
  fileSizeBytes: number
  mimeType: string
  originalHashSHA256: string
  currentHashSHA256: string
  pageCount?: number
  status: DocumentStatus
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

export type WorkflowType = 'sequential' | 'parallel' | 'any_order' | 'custom'
export type WorkflowStatus = 'draft' | 'active' | 'completed' | 'rejected' | 'expired' | 'cancelled'

export interface SignatureWorkflow {
  id: string
  organizationId: string
  documentId: string
  workflowName: string
  workflowType: WorkflowType
  status: WorkflowStatus
  initiatedByUserId: string
  totalSigners: number
  completedSigners: number
  expiryDate?: Date
  reminderFrequencyHours: number
  messageToSigners?: string
  messageToSignersAr?: string
  createdAt: Date
  completedAt?: Date
}

// ============================================================================
// SIGNATURE REQUEST TYPES
// ============================================================================

export type SignatureTypeRequired = 'any' | 'simple' | 'advanced' | 'qualified' | 'nafath_qes'
export type AuthenticationMethod = 'email' | 'sms' | 'whatsapp' | 'nafath' | 'absher' | 'internal_auth' | 'biometric' | 'pin'
export type SignatureRequestStatus = 'pending' | 'sent' | 'viewed' | 'signed' | 'declined' | 'expired' | 'delegated'

export interface SignatureRequest {
  id: string
  workflowId: string
  signerUserId?: string
  signerEmail?: string
  signerPhone?: string
  signerName: string
  signerNameAr?: string
  signerNationalId?: string
  signerType: SignatureUserType
  signingOrder: number
  roleInDocument?: string
  signatureTypeRequired: SignatureTypeRequired
  authenticationMethod: AuthenticationMethod
  status: SignatureRequestStatus
  accessToken?: string
  accessTokenExpiresAt?: Date
  otpCode?: string
  otpExpiresAt?: Date
  signatureFields: SignatureField[]
  declineReason?: string
  ipAddressOnSign?: string
  userAgentOnSign?: string
  geolocationOnSign?: Record<string, any>
  signedAt?: Date
  createdAt: Date
}

export interface SignatureField {
  fieldId: string
  fieldType: 'signature' | 'initial' | 'date' | 'text' | 'checkbox'
  pageNumber: number
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  required: boolean
  label?: string
  labelAr?: string
}

// ============================================================================
// SIGNATURE TYPES
// ============================================================================

export type SignatureType = 'simple_electronic' | 'advanced_electronic' | 'qualified_electronic' | 'digital_seal' | 'timestamp_only'
export type SignatureLevel = 'SES' | 'AES' | 'QES'
export type SignatureStandard = 'PAdES' | 'XAdES' | 'CAdES' | 'JAdES' | 'custom'
export type ValidationStatus = 'valid' | 'invalid' | 'warning' | 'unknown'

export interface Signature {
  id: string
  signatureRequestId: string
  documentId: string
  signerUserId?: string
  certificateId?: string
  
  // Signature Classification
  signatureType: SignatureType
  signatureLevel: SignatureLevel
  signatureStandard: SignatureStandard
  
  // Signature Data
  signatureValue: Buffer
  signatureValueBase64: string
  signatureAlgorithm: string
  hashAlgorithm: string
  documentHash: string
  signedDataHash: string
  
  // Visual Signature
  visualSignatureImage?: Buffer
  visualSignatureBase64?: string
  signaturePosition?: Record<string, any>
  pageNumber?: number
  
  // Certificate & Chain
  signingCertificatePEM?: string
  certificateChainPEM?: string[]
  
  // Timestamp
  timestampToken?: Buffer
  timestampAuthority?: string
  timestampedAt?: Date
  
  // LTV Data
  ocspResponses?: Buffer[]
  ltvEnabled: boolean
  
  // Identity Verification
  identityVerificationMethod?: string
  nafathTransactionId?: string
  emdhaTransactionId?: string
  identityVerificationData?: Record<string, any>
  
  // Context
  signingReason?: string
  signingLocation?: string
  ipAddress: string
  userAgent?: string
  deviceInfo?: Record<string, any>
  geolocation?: Record<string, any>
  
  // Validation
  isValid: boolean
  validationStatus: ValidationStatus
  lastValidatedAt?: Date
  
  // Blockchain (for immutable records)
  blockchainTxHash?: string
  blockchainBlockNumber?: number
  blockchainNetwork?: string
  
  createdAt: Date
}

// ============================================================================
// NAFATH TYPES
// ============================================================================

export type NafathStatus = 'pending' | 'waiting' | 'completed' | 'rejected' | 'expired' | 'error'

export interface NafathSession {
  id: string
  userId?: string
  signatureRequestId?: string
  nationalId: string
  transactionId: string
  randomNumber?: string
  status: NafathStatus
  requestType: string
  responseData?: Record<string, any>
  errorMessage?: string
  expiresAt: Date
  completedAt?: Date
  createdAt: Date
}

// ============================================================================
// EMDHA TYPES
// ============================================================================

export interface EmdhaSigningSession {
  id: string
  userId?: string
  signatureRequestId?: string
  documentId?: string
  sessionId: string
  transactionId?: string
  signingUrl?: string
  status: string
  signerCertificatePEM?: string
  signatureValue?: string
  responseData?: Record<string, any>
  expiresAt: Date
  completedAt?: Date
  createdAt: Date
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export type AuditActionCategory = 'document' | 'signature' | 'certificate' | 'workflow' | 'user' | 'system' | 'security' | 'integration'
export type AuditSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical'

export interface AuditLog {
  id: string
  organizationId?: string
  userId?: string
  
  // Action Details
  actionType: string
  actionCategory: AuditActionCategory
  actionDescription: string
  actionDescriptionAr?: string
  
  // Target Entity
  entityType?: string
  entityId?: string
  
  // State Changes
  previousState?: Record<string, any>
  newState?: Record<string, any>
  
  // Request Context
  ipAddress?: string
  userAgent?: string
  geolocation?: Record<string, any>
  
  // Hash Chain for Tamper Evidence
  eventHash?: string
  previousEventHash?: string
  
  severity: AuditSeverity
  status: string
  
  createdAt: Date
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app'

export interface SignatureNotification {
  id: string
  userId?: string
  notificationType: string
  channel: NotificationChannel
  recipientAddress: string
  subject?: string
  body: string
  relatedEntityType?: string
  relatedEntityId?: string
  status: 'pending' | 'sent' | 'failed'
  sentAt?: Date
  externalMessageId?: string
  createdAt: Date
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateDocumentRequest {
  file: File | Buffer
  documentType: string
  title: string
  titleAr?: string
  metadata?: Record<string, any>
}

export interface CreateWorkflowRequest {
  documentId: string
  workflowName: string
  workflowType: WorkflowType
  signers: SignerRequest[]
  expiryDate?: Date
  reminderFrequencyHours?: number
  messageToSigners?: string
  messageToSignersAr?: string
}

export interface SignerRequest {
  userId?: string
  email?: string
  phone?: string
  name: string
  nameAr?: string
  nationalId?: string
  signerType: SignatureUserType
  signingOrder: number
  roleInDocument?: string
  signatureTypeRequired?: SignatureTypeRequired
  authenticationMethod?: AuthenticationMethod
  signatureFields?: SignatureField[]
}

export interface SignDocumentRequest {
  signatureRequestId: string
  signatureType: SignatureType
  visualSignature?: string // Base64 image
  signingReason?: string
  otpCode?: string
  nafathTransactionId?: string
  emdhaSessionId?: string
}

export interface VerifySignatureRequest {
  signatureId: string
  documentId: string
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface IPKIService {
  initializeRootCA(config: RootCAConfig): Promise<CertificateAuthority>
  initializeIssuingCA(config: IssuingCAConfig): Promise<CertificateAuthority>
  issueUserCertificate(options: IssueCertificateOptions): Promise<UserCertificate>
  revokeCertificate(certId: string, reason: string): Promise<void>
  verifyCertificateChain(certPEM: string): Promise<boolean>
  generateCRL(): Promise<string>
}

export interface RootCAConfig {
  name: string
  subjectDN: string
  keySize?: number
  validityYears?: number
}

export interface IssuingCAConfig {
  name: string
  parentCaId: string
  subjectDN: string
  keySize?: number
  validityYears?: number
}

export interface IssueCertificateOptions {
  userId: string
  subjectDN: string
  certificateType: CertificateType
  validityYears?: number
  keySize?: number
}

export interface ISignatureService {
  signDocument(options: SignDocumentOptions): Promise<Signature>
  applyVisualSignature(pdfBuffer: Buffer, signatureImage: Buffer, position: SignatureField['position']): Promise<Buffer>
  verifySignature(signatureId: string): Promise<SignatureVerificationResult>
  bulkSign(documents: string[], certificateId: string): Promise<Signature[]>
}

export interface SignDocumentOptions {
  documentId: string
  signatureRequestId: string
  certificateId?: string
  signatureType: SignatureType
  visualSignature?: Buffer
  signingReason?: string
  ipAddress: string
  userAgent?: string
  geolocation?: Record<string, any>
}

export interface SignatureVerificationResult {
  isValid: boolean
  validationStatus: ValidationStatus
  errors?: string[]
  warnings?: string[]
  certificateValid?: boolean
  timestampValid?: boolean
  chainValid?: boolean
}

export interface INafathService {
  initiateVerification(nationalId: string, requestType: string): Promise<NafathSession>
  checkVerificationStatus(transactionId: string): Promise<NafathSession>
  handleCallback(callbackData: Record<string, any>): Promise<void>
}

export interface IEmdhaService {
  initiateQESSigning(request: EmdhaSigningRequest): Promise<EmdhaSigningSession>
  checkSigningStatus(sessionId: string): Promise<EmdhaSigningSession>
  handleCallback(callbackData: Record<string, any>): Promise<void>
}

export interface EmdhaSigningRequest {
  documentId: string
  userId: string
  nationalId: string
}

export interface IWorkflowService {
  createWorkflow(options: CreateWorkflowRequest, userId?: string): Promise<SignatureWorkflow>
  sendForSigning(workflowId: string): Promise<void>
  processSigningOrder(workflowId: string): Promise<void>
  sendReminders(workflowId: string): Promise<void>
}

export interface IAuditService {
  log(event: AuditLogInput): Promise<AuditLog>
  getAuditTrail(entityType: string, entityId: string): Promise<AuditLog[]>
  verifyAuditChain(): Promise<boolean>
  generateAuditReport(filters: AuditReportFilters): Promise<Buffer>
}

export interface AuditLogInput {
  organizationId?: string
  userId?: string
  actionType: string
  actionCategory: AuditActionCategory
  actionDescription: string
  actionDescriptionAr?: string
  entityType?: string
  entityId?: string
  previousState?: Record<string, any>
  newState?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  geolocation?: Record<string, any>
  severity?: AuditSeverity
}

export interface AuditReportFilters {
  organizationId?: string
  userId?: string
  entityType?: string
  entityId?: string
  actionCategory?: AuditActionCategory
  startDate?: Date
  endDate?: Date
  severity?: AuditSeverity
}

export interface IDocumentService {
  uploadDocument(file: File | Buffer, metadata: DocumentMetadata): Promise<Document>
  prepareForSigning(documentId: string, fields: SignatureField[]): Promise<Document>
  applySignedDocument(documentId: string, signedBuffer: Buffer): Promise<Document>
  generateDownloadUrl(documentId: string, signed?: boolean): Promise<string>
}

export interface DocumentMetadata {
  organizationId: string
  createdByUserId: string
  documentType: string
  title: string
  titleAr?: string
  metadata?: Record<string, any>
}





