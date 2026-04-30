/**
 * Rabet.sa Service Types
 * 
 * Comprehensive type definitions for all Rabet.sa services
 * Based on reverse engineering of https://www.rabet.sa/
 */

// ============================================================================
// DIGITAL IDENTITY SERVICES
// ============================================================================

export interface NuhaService {
  verifyIdentity(data: {
    nationalId: string
    mobileNumber?: string
  }): Promise<NuhaVerificationResult>
  
  getIdentityInfo(nationalId: string): Promise<IdentityInfo>
}

export interface NafathService {
  authenticate(credentials: {
    nationalId: string
    password: string
  }): Promise<NafathAuthResult>
  
  verifyToken(token: string): Promise<boolean>
}

export interface MobileVerificationService {
  verifyMobile(data: {
    mobileNumber: string
    nationalId: string
  }): Promise<MobileVerificationResult>
  
  sendOTP(mobileNumber: string): Promise<OTPResult>
}

export interface IBANVerificationService {
  verifyIBAN(iban: string): Promise<IBANVerificationResult>
  
  getBankInfo(iban: string): Promise<BankInfo>
}

export interface ZawilService {
  manageDigitalIdentity(data: DigitalIdentityData): Promise<ZawilResult>
  
  getDigitalIdentity(nationalId: string): Promise<DigitalIdentity>
}

// ============================================================================
// BUSINESS SOLUTIONS
// ============================================================================

export interface DhamenService {
  getGuaranteeInfo(businessNumber: string): Promise<GuaranteeInfo>
  
  submitGuaranteeRequest(data: GuaranteeRequest): Promise<GuaranteeResult>
}

export interface AjerService {
  getBusinessInfo(registrationNumber: string): Promise<BusinessInfo>
  
  registerBusiness(data: BusinessRegistrationData): Promise<RegistrationResult>
  
  renewLicense(businessNumber: string): Promise<LicenseResult>
}

export interface SmartGateService {
  processRequest(request: SmartGateRequest): Promise<SmartGateResponse>
  
  getRequestStatus(requestId: string): Promise<RequestStatus>
}

export interface OqoudService {
  createContract(data: ContractData): Promise<ContractResult>
  
  getContract(contractId: string): Promise<Contract>
  
  verifyContract(contractId: string): Promise<ContractVerification>
}

export interface WaelService {
  getBusinessInformation(businessNumber: string): Promise<BusinessInformation>
  
  searchBusinesses(query: BusinessSearchQuery): Promise<BusinessSearchResult>
}

// ============================================================================
// MOBILITY SERVICES
// ============================================================================

export interface MobilityService {
  getMobilityPermits(nationalId: string): Promise<MobilityPermit[]>
  
  applyForPermit(data: MobilityPermitApplication): Promise<PermitResult>
  
  trackPermitStatus(permitId: string): Promise<PermitStatus>
}

// ============================================================================
// VEHICLE SERVICES
// ============================================================================

export interface VehicleService {
  getVehicleInfo(plateNumber: string): Promise<VehicleInfo>
  
  registerVehicle(data: VehicleRegistrationData): Promise<VehicleRegistrationResult>
  
  renewRegistration(vehicleId: string): Promise<RenewalResult>
  
  getDriverLicense(nationalId: string): Promise<DriverLicense>
}

// ============================================================================
// IMPORT & TRADE SERVICES
// ============================================================================

export interface ImportInfoService {
  getImportInfo(importNumber: string): Promise<ImportInfo>
  
  trackImport(importNumber: string): Promise<ImportTracking>
  
  submitImportDeclaration(data: ImportDeclarationData): Promise<ImportDeclarationResult>
}

export interface CustomsService {
  getCustomsClearance(clearanceNumber: string): Promise<CustomsClearance>
  
  submitClearanceRequest(data: ClearanceRequest): Promise<ClearanceResult>
  
  calculateDuties(data: DutiesCalculationData): Promise<DutiesCalculation>
}

// ============================================================================
// SAFETY & SECURITY SERVICES
// ============================================================================

export interface SafetySecurityService {
  getSafetyCertificates(businessNumber: string): Promise<SafetyCertificate[]>
  
  applyForCertificate(data: CertificateApplication): Promise<CertificateResult>
  
  verifyCompliance(entityId: string): Promise<ComplianceStatus>
}

// ============================================================================
// FINANCIAL SECTOR SERVICES
// ============================================================================

export interface FinancialService {
  getFinancialInfo(businessNumber: string): Promise<FinancialInfo>
  
  submitFinancialReport(data: FinancialReportData): Promise<FinancialReportResult>
  
  verifyPayment(paymentId: string): Promise<PaymentVerification>
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface NuhaVerificationResult {
  verified: boolean
  identity: IdentityInfo
  timestamp: Date
}

export interface IdentityInfo {
  nationalId: string
  fullName: string
  dateOfBirth: Date
  nationality: string
  address?: string
}

export interface NafathAuthResult {
  success: boolean
  token?: string
  expiresAt?: Date
}

export interface MobileVerificationResult {
  verified: boolean
  mobileNumber: string
  carrier?: string
}

export interface OTPResult {
  sent: boolean
  expiresIn: number
}

export interface IBANVerificationResult {
  valid: boolean
  bankName?: string
  accountNumber?: string
}

export interface BankInfo {
  bankName: string
  bankCode: string
  branch?: string
}

export interface DigitalIdentity {
  nationalId: string
  digitalId: string
  status: 'active' | 'suspended' | 'expired'
  issuedAt: Date
  expiresAt: Date
}

export interface DigitalIdentityData {
  nationalId: string
  email: string
  mobileNumber: string
}

export interface ZawilResult {
  success: boolean
  digitalId?: string
}

export interface GuaranteeInfo {
  businessNumber: string
  guaranteeAmount: number
  status: string
  expiryDate: Date
}

export interface GuaranteeRequest {
  businessNumber: string
  amount: number
  purpose: string
}

export interface GuaranteeResult {
  success: boolean
  guaranteeId?: string
}

export interface BusinessInfo {
  registrationNumber: string
  businessName: string
  legalForm: string
  status: string
  registrationDate: Date
  expiryDate?: Date
}

export interface BusinessRegistrationData {
  businessName: string
  legalForm: string
  ownerNationalId: string
  businessType: string
  address: string
}

export interface RegistrationResult {
  success: boolean
  registrationNumber?: string
}

export interface LicenseResult {
  success: boolean
  licenseNumber?: string
  expiryDate?: Date
}

export interface SmartGateRequest {
  serviceType: string
  data: Record<string, any>
}

export interface SmartGateResponse {
  requestId: string
  status: 'pending' | 'approved' | 'rejected'
  result?: any
}

export interface RequestStatus {
  requestId: string
  status: string
  progress: number
  estimatedCompletion?: Date
}

export interface ContractData {
  contractType: string
  parties: string[]
  terms: Record<string, any>
}

export interface Contract {
  contractId: string
  contractType: string
  parties: string[]
  status: string
  createdAt: Date
}

export interface ContractResult {
  success: boolean
  contractId?: string
}

export interface ContractVerification {
  valid: boolean
  verifiedAt: Date
}

export interface BusinessInformation {
  businessNumber: string
  businessName: string
  details: Record<string, any>
}

export interface BusinessSearchQuery {
  query: string
  filters?: Record<string, any>
}

export interface BusinessSearchResult {
  results: BusinessInfo[]
  total: number
}

export interface MobilityPermit {
  permitId: string
  type: string
  status: string
  issuedAt: Date
  expiresAt: Date
}

export interface MobilityPermitApplication {
  nationalId: string
  permitType: string
  purpose: string
}

export interface PermitResult {
  success: boolean
  permitId?: string
}

export interface PermitStatus {
  permitId: string
  status: string
  progress: number
}

export interface VehicleInfo {
  plateNumber: string
  vehicleType: string
  make: string
  model: string
  year: number
  owner: string
  registrationDate: Date
  expiryDate: Date
}

export interface VehicleRegistrationData {
  vehicleType: string
  make: string
  model: string
  year: number
  ownerNationalId: string
}

export interface VehicleRegistrationResult {
  success: boolean
  plateNumber?: string
}

export interface RenewalResult {
  success: boolean
  newExpiryDate?: Date
}

export interface DriverLicense {
  licenseNumber: string
  nationalId: string
  licenseType: string
  issuedAt: Date
  expiresAt: Date
  status: string
}

export interface ImportInfo {
  importNumber: string
  importer: string
  items: ImportItem[]
  status: string
  customsStatus: string
}

export interface ImportItem {
  description: string
  quantity: number
  value: number
  origin: string
}

export interface ImportTracking {
  importNumber: string
  currentStatus: string
  location?: string
  estimatedArrival?: Date
  history: TrackingEvent[]
}

export interface TrackingEvent {
  timestamp: Date
  status: string
  location?: string
  description?: string
}

export interface ImportDeclarationData {
  importerNationalId: string
  items: ImportItem[]
  originCountry: string
  destinationPort: string
}

export interface ImportDeclarationResult {
  success: boolean
  importNumber?: string
}

export interface CustomsClearance {
  clearanceNumber: string
  importNumber: string
  status: string
  duties: number
  clearedAt?: Date
}

export interface ClearanceRequest {
  importNumber: string
  documents: string[]
}

export interface ClearanceResult {
  success: boolean
  clearanceNumber?: string
}

export interface DutiesCalculationData {
  items: ImportItem[]
  originCountry: string
}

export interface DutiesCalculation {
  totalValue: number
  duties: number
  vat: number
  total: number
}

export interface SafetyCertificate {
  certificateId: string
  type: string
  issuedAt: Date
  expiresAt: Date
  status: string
}

export interface CertificateApplication {
  businessNumber: string
  certificateType: string
  documents: string[]
}

export interface CertificateResult {
  success: boolean
  certificateId?: string
}

export interface ComplianceStatus {
  compliant: boolean
  issues: ComplianceIssue[]
  lastChecked: Date
}

export interface ComplianceIssue {
  type: string
  severity: 'low' | 'medium' | 'high'
  description: string
  resolution?: string
}

export interface FinancialInfo {
  businessNumber: string
  taxNumber?: string
  financialStatus: string
  reports: FinancialReport[]
}

export interface FinancialReport {
  reportId: string
  period: string
  submittedAt: Date
  status: string
}

export interface FinancialReportData {
  businessNumber: string
  period: string
  data: Record<string, any>
}

export interface FinancialReportResult {
  success: boolean
  reportId?: string
}

export interface PaymentVerification {
  paymentId: string
  verified: boolean
  amount: number
  paidAt?: Date
}



