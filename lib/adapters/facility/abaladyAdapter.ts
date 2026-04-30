/**
 * Abalady Integration Adapter
 * 
 * Integrates with Saudi Abalady (Municipality) systems for:
 * - Business license management
 * - Commercial registration
 * - Facility permits
 * - Regulatory compliance
 * - License renewals
 */

import type { AbaladyIntegration } from '@/types/facility'

export interface AbaladyConfig {
  apiEndpoint: string
  apiKey: string
  environment: 'production' | 'sandbox'
  timeout?: number
  retryAttempts?: number
}

export interface AbaladyAPIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

export class AbaladyAdapter {
  private config: AbaladyConfig
  private baseUrl: string

  constructor(config: AbaladyConfig) {
    this.config = config
    this.baseUrl = config.apiEndpoint
  }

  /**
   * Test connection to Abalady API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.request('GET', '/health')
      return {
        success: response.success,
        message: response.success ? 'Connection successful' : response.error?.message || 'Connection failed',
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      }
    }
  }

  /**
   * Register facility with Abalady
   */
  async registerFacility(facilityData: {
    facilityId: string
    name: string
    address: string
    city: string
    businessType: string
    ownerName: string
    ownerId: string
    contact: {
      phone: string
      email: string
    }
  }): Promise<AbaladyAPIResponse<{ registrationNumber: string }>> {
    return this.request('POST', '/facilities/register', facilityData)
  }

  /**
   * Get business license information
   */
  async getBusinessLicense(
    licenseNumber: string
  ): Promise<AbaladyAPIResponse<{
    number: string
    issueDate: Date
    expiryDate: Date
    status: string
    businessType: string
    owner: string
  }>> {
    return this.request('GET', `/licenses/${licenseNumber}`)
  }

  /**
   * Get commercial registration
   */
  async getCommercialRegistration(
    registrationNumber: string
  ): Promise<AbaladyAPIResponse<{
    number: string
    issueDate: Date
    expiryDate: Date
    status: string
    businessName: string
    activities: string[]
  }>> {
    return this.request('GET', `/commercial-registrations/${registrationNumber}`)
  }

  /**
   * Renew business license
   */
  async renewBusinessLicense(
    licenseNumber: string,
    renewalData: {
      renewalDate: Date
      documents: string[]
      fees: number
    }
  ): Promise<AbaladyAPIResponse<{ newExpiryDate: Date; receiptNumber: string }>> {
    return this.request('POST', `/licenses/${licenseNumber}/renew`, renewalData)
  }

  /**
   * Get facility permits
   */
  async getFacilityPermits(
    facilityId: string
  ): Promise<AbaladyAPIResponse<{ permits: Array<{ type: string; number: string; status: string; expiryDate?: Date }> }>> {
    return this.request('GET', `/facilities/${facilityId}/permits`)
  }

  /**
   * Apply for new permit
   */
  async applyForPermit(
    facilityId: string,
    permitData: {
      type: string
      description: string
      documents: string[]
      requestedDate: Date
    }
  ): Promise<AbaladyAPIResponse<{ applicationNumber: string; status: string }>> {
    return this.request('POST', `/facilities/${facilityId}/permits/apply`, permitData)
  }

  /**
   * Check compliance status
   */
  async checkComplianceStatus(
    facilityId: string
  ): Promise<AbaladyAPIResponse<{
    status: string
    score: number
    violations: Array<{ type: string; description: string; severity: string }>
    requirements: string[]
  }>> {
    return this.request('GET', `/facilities/${facilityId}/compliance`)
  }

  /**
   * Submit compliance documents
   */
  async submitComplianceDocuments(
    facilityId: string,
    documents: Array<{
      type: string
      fileUrl: string
      description: string
    }>
  ): Promise<AbaladyAPIResponse<{ submissionId: string; status: string }>> {
    return this.request('POST', `/facilities/${facilityId}/compliance/documents`, { documents })
  }

  /**
   * Get regulatory requirements
   */
  async getRegulatoryRequirements(
    facilityType: string,
    businessType: string
  ): Promise<AbaladyAPIResponse<{ requirements: Array<{ type: string; description: string; mandatory: boolean }> }>> {
    return this.request('GET', `/requirements/${facilityType}/${businessType}`)
  }

  /**
   * Sync facility data with Abalady
   */
  async syncFacilityData(
    facilityId: string,
    data: Partial<AbaladyIntegration>
  ): Promise<AbaladyAPIResponse<{ lastSync: Date }>> {
    return this.request('PUT', `/facilities/${facilityId}/sync`, data)
  }

  /**
   * Get license renewal reminders
   */
  async getRenewalReminders(
    facilityId: string
  ): Promise<AbaladyAPIResponse<{
    licenses: Array<{ number: string; type: string; expiryDate: Date; daysUntilExpiry: number }>
    permits: Array<{ number: string; type: string; expiryDate: Date; daysUntilExpiry: number }>
  }>> {
    return this.request('GET', `/facilities/${facilityId}/renewals`)
  }

  /**
   * Make HTTP request to Abalady API
   */
  private async request<T = any>(
    method: string,
    path: string,
    body?: any
  ): Promise<AbaladyAPIResponse<T>> {
    try {
      const url = `${this.baseUrl}${path}`
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Environment': this.config.environment,
      }

      const options: RequestInit = {
        method,
        headers,
      }

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(this.config.timeout || 30000),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'API_ERROR',
            message: data.error?.message || 'Request failed',
            details: data.error?.details,
          },
        }
      }

      return {
        success: true,
        data: data.data || data,
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      }
    }
  }
}
