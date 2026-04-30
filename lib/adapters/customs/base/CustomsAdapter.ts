/**
 * Customs Adapter Base Interface
 * 
 * Enterprise-grade base interface for all customs and regulatory integrations
 * Extends TransportationAdapter for seamless integration
 * 
 * Supports:
 * - Country customs portals (Egypt, Saudi, UAE, etc.)
 * - TIR/ETIR systems
 * - Regulatory bodies (Food & Drug, Standards, etc.)
 * - Touchpoint intelligence
 */

import type {
  CustomsDeclaration,
  CustomsStatus,
  CustomsDocument,
  Touchpoint,
  TouchpointStatus,
  DocumentRequirement,
  ComplianceIssue,
  Duty,
  Fee,
  CustomsAdapterConfig,
  TouchpointFilters,
  RequirementFilters,
  CountryCode,
} from '@/types/customs'

// ============================================================================
// BASE CUSTOMS ADAPTER INTERFACE
// ============================================================================

export interface CustomsAdapter {
  // Identification
  readonly id: string
  readonly name: string
  readonly country: CountryCode
  readonly type: 'CUSTOMS' | 'TIR' | 'REGULATORY'
  readonly version: string
  
  // Connection
  connect(): Promise<void>
  disconnect(): Promise<void>
  isConnected(): Promise<boolean>
  testConnection(): Promise<{ success: boolean; message: string; details?: any }>
  
  // Configuration
  getConfig(): CustomsAdapterConfig
  updateConfig(config: Partial<CustomsAdapterConfig>): Promise<void>
  
  // ========================================================================
  // DECLARATION MANAGEMENT
  // ========================================================================
  
  /**
   * Submit a customs declaration
   */
  submitDeclaration(declaration: Partial<CustomsDeclaration>): Promise<CustomsDeclaration>
  
  /**
   * Get declaration by ID
   */
  getDeclaration(id: string): Promise<CustomsDeclaration | null>
  
  /**
   * Get declaration by external ID (country-specific)
   */
  getDeclarationByExternalId(externalId: string): Promise<CustomsDeclaration | null>
  
  /**
   * Get declaration status
   */
  getDeclarationStatus(id: string): Promise<CustomsStatus>
  
  /**
   * Update declaration
   */
  updateDeclaration(id: string, updates: Partial<CustomsDeclaration>): Promise<CustomsDeclaration>
  
  /**
   * Cancel declaration
   */
  cancelDeclaration(id: string, reason?: string): Promise<void>
  
  /**
   * List declarations with filters
   */
  listDeclarations(filters?: DeclarationFilters): Promise<CustomsDeclaration[]>
  
  // ========================================================================
  // DOCUMENT MANAGEMENT
  // ========================================================================
  
  /**
   * Upload document for declaration
   */
  uploadDocument(
    declarationId: string,
    document: Partial<CustomsDocument>
  ): Promise<CustomsDocument>
  
  /**
   * Get document
   */
  getDocument(declarationId: string, documentId: string): Promise<CustomsDocument | null>
  
  /**
   * List documents for declaration
   */
  listDocuments(declarationId: string): Promise<CustomsDocument[]>
  
  /**
   * Delete document
   */
  deleteDocument(declarationId: string, documentId: string): Promise<void>
  
  /**
   * Verify document
   */
  verifyDocument(declarationId: string, documentId: string): Promise<{ valid: boolean; errors: string[] }>
  
  // ========================================================================
  // TOUCHPOINT INTELLIGENCE
  // ========================================================================
  
  /**
   * Get all touchpoints
   */
  getTouchpoints(filters?: TouchpointFilters): Promise<Touchpoint[]>
  
  /**
   * Get touchpoint by ID
   */
  getTouchpoint(id: string): Promise<Touchpoint | null>
  
  /**
   * Get touchpoint status (real-time)
   */
  getTouchpointStatus(id: string): Promise<TouchpointStatus>
  
  /**
   * Get touchpoint requirements
   */
  getTouchpointRequirements(id: string): Promise<DocumentRequirement[]>
  
  // ========================================================================
  // REQUIREMENTS & COMPLIANCE
  // ========================================================================
  
  /**
   * Get document requirements
   */
  getRequirements(filters: RequirementFilters): Promise<DocumentRequirement[]>
  
  /**
   * Validate declaration
   */
  validateDeclaration(declaration: Partial<CustomsDeclaration>): Promise<ComplianceIssue[]>
  
  /**
   * Check compliance
   */
  checkCompliance(declaration: Partial<CustomsDeclaration>): Promise<{
    compliant: boolean
    score: number
    issues: ComplianceIssue[]
    missingDocuments: string[]
    recommendations: string[]
  }>
  
  // ========================================================================
  // FINANCIAL CALCULATIONS
  // ========================================================================
  
  /**
   * Calculate duties
   */
  calculateDuties(declaration: Partial<CustomsDeclaration>): Promise<Duty[]>
  
  /**
   * Calculate fees
   */
  calculateFees(declaration: Partial<CustomsDeclaration>): Promise<Fee[]>
  
  /**
   * Calculate total amount (duties + fees)
   */
  calculateTotal(declaration: Partial<CustomsDeclaration>): Promise<{
    duties: Duty[]
    fees: Fee[]
    totalDuties: number
    totalFees: number
    totalAmount: number
    currency: string
  }>
  
  // ========================================================================
  // STATUS & TRACKING
  // ========================================================================
  
  /**
   * Get real-time status
   */
  getRealTimeStatus(declarationId: string): Promise<{
    status: CustomsStatus
    currentStep: string
    estimatedCompletion: Date
    nextActions: string[]
  }>
  
  /**
   * Subscribe to status updates (webhook/SSE)
   */
  subscribeToUpdates(
    declarationId: string,
    callback: (update: StatusUpdate) => void
  ): Promise<{ subscriptionId: string; unsubscribe: () => Promise<void> }>
  
  // ========================================================================
  // HEALTH & MONITORING
  // ========================================================================
  
  /**
   * Get adapter health status
   */
  getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down'
    lastCheck: Date
    responseTime?: number
    errors?: string[]
  }>
  
  /**
   * Get adapter metrics
   */
  getMetrics(): Promise<{
    totalDeclarations: number
    successRate: number
    averageResponseTime: number
    errorRate: number
    period: { from: Date; to: Date }
  }>
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface DeclarationFilters {
  status?: CustomsStatus[]
  country?: CountryCode
  type?: CustomsDeclaration['type']
  dateFrom?: Date
  dateTo?: Date
  shipmentId?: string
  touchpointId?: string
  limit?: number
  offset?: number
}

export interface StatusUpdate {
  declarationId: string
  status: CustomsStatus
  previousStatus: CustomsStatus
  timestamp: Date
  message?: string
  details?: Record<string, any>
}

// ============================================================================
// BASE ADAPTER IMPLEMENTATION (Abstract Class)
// ============================================================================

export abstract class BaseCustomsAdapter implements CustomsAdapter {
  abstract readonly id: string
  abstract readonly name: string
  abstract readonly country: CountryCode
  abstract readonly type: 'CUSTOMS' | 'TIR' | 'REGULATORY'
  readonly version: string = '1.0.0'
  
  protected config: CustomsAdapterConfig
  protected connected: boolean = false
  
  constructor(config: CustomsAdapterConfig) {
    this.config = config
  }
  
  // Connection (to be implemented by subclasses)
  abstract connect(): Promise<void>
  abstract disconnect(): Promise<void>
  abstract isConnected(): Promise<boolean>
  abstract testConnection(): Promise<{ success: boolean; message: string; details?: any }>
  
  // Configuration
  getConfig(): CustomsAdapterConfig {
    return { ...this.config }
  }
  
  async updateConfig(config: Partial<CustomsAdapterConfig>): Promise<void> {
    this.config = { ...this.config, ...config }
  }
  
  // Declaration Management (to be implemented by subclasses)
  abstract submitDeclaration(declaration: Partial<CustomsDeclaration>): Promise<CustomsDeclaration>
  abstract getDeclaration(id: string): Promise<CustomsDeclaration | null>
  abstract getDeclarationByExternalId(externalId: string): Promise<CustomsDeclaration | null>
  abstract getDeclarationStatus(id: string): Promise<CustomsStatus>
  abstract updateDeclaration(id: string, updates: Partial<CustomsDeclaration>): Promise<CustomsDeclaration>
  abstract cancelDeclaration(id: string, reason?: string): Promise<void>
  abstract listDeclarations(filters?: DeclarationFilters): Promise<CustomsDeclaration[]>
  
  // Document Management (to be implemented by subclasses)
  abstract uploadDocument(declarationId: string, document: Partial<CustomsDocument>): Promise<CustomsDocument>
  abstract getDocument(declarationId: string, documentId: string): Promise<CustomsDocument | null>
  abstract listDocuments(declarationId: string): Promise<CustomsDocument[]>
  abstract deleteDocument(declarationId: string, documentId: string): Promise<void>
  abstract verifyDocument(declarationId: string, documentId: string): Promise<{ valid: boolean; errors: string[] }>
  
  // Touchpoint Intelligence (to be implemented by subclasses)
  abstract getTouchpoints(filters?: TouchpointFilters): Promise<Touchpoint[]>
  abstract getTouchpoint(id: string): Promise<Touchpoint | null>
  abstract getTouchpointStatus(id: string): Promise<TouchpointStatus>
  abstract getTouchpointRequirements(id: string): Promise<DocumentRequirement[]>
  
  // Requirements & Compliance (to be implemented by subclasses)
  abstract getRequirements(filters: RequirementFilters): Promise<DocumentRequirement[]>
  abstract validateDeclaration(declaration: Partial<CustomsDeclaration>): Promise<ComplianceIssue[]>
  abstract checkCompliance(declaration: Partial<CustomsDeclaration>): Promise<{
    compliant: boolean
    score: number
    issues: ComplianceIssue[]
    missingDocuments: string[]
    recommendations: string[]
  }>
  
  // Financial Calculations (to be implemented by subclasses)
  abstract calculateDuties(declaration: Partial<CustomsDeclaration>): Promise<Duty[]>
  abstract calculateFees(declaration: Partial<CustomsDeclaration>): Promise<Fee[]>
  abstract calculateTotal(declaration: Partial<CustomsDeclaration>): Promise<{
    duties: Duty[]
    fees: Fee[]
    totalDuties: number
    totalFees: number
    totalAmount: number
    currency: string
  }>
  
  // Status & Tracking (to be implemented by subclasses)
  abstract getRealTimeStatus(declarationId: string): Promise<{
    status: CustomsStatus
    currentStep: string
    estimatedCompletion: Date
    nextActions: string[]
  }>
  
  abstract subscribeToUpdates(
    declarationId: string,
    callback: (update: StatusUpdate) => void
  ): Promise<{ subscriptionId: string; unsubscribe: () => Promise<void> }>
  
  // Health & Monitoring (default implementation, can be overridden)
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down'
    lastCheck: Date
    responseTime?: number
    errors?: string[]
  }> {
    const start = Date.now()
    const isConnected = await this.isConnected()
    const responseTime = Date.now() - start
    
    return {
      status: isConnected ? 'healthy' : 'down',
      lastCheck: new Date(),
      responseTime,
      errors: isConnected ? undefined : ['Not connected']
    }
  }
  
  async getMetrics(): Promise<{
    totalDeclarations: number
    successRate: number
    averageResponseTime: number
    errorRate: number
    period: { from: Date; to: Date }
  }> {
    // Default implementation - should be overridden by subclasses
    return {
      totalDeclarations: 0,
      successRate: 0,
      averageResponseTime: 0,
      errorRate: 0,
      period: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date()
      }
    }
  }
  
  // ========================================================================
  // HELPER METHODS (Protected, for use by subclasses)
  // ========================================================================
  
  protected validateConfig(): void {
    if (!this.config.country) {
      throw new Error('Country is required in adapter config')
    }
    if (!this.config.apiUrl) {
      throw new Error('API URL is required in adapter config')
    }
  }
  
  protected async handleError(error: any, context: string): Promise<never> {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[${this.id}] Error in ${context}:`, errorMessage)
    throw new Error(`${context} failed: ${errorMessage}`)
  }
  
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const prefix = `[${this.id}]`
    switch (level) {
      case 'info':
        console.log(prefix, message, data || '')
        break
      case 'warn':
        console.warn(prefix, message, data || '')
        break
      case 'error':
        console.error(prefix, message, data || '')
        break
    }
  }
}













