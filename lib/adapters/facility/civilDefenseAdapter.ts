/**
 * Civil Defense Integration Adapter
 * 
 * Integrates with Saudi Civil Defense systems for:
 * - Fire safety compliance
 * - Emergency response
 * - Inspection submissions
 * - License management
 * - Violation tracking
 */

import type {
  CivilDefenseIntegration,
  FireSafetySystem,
  EvacuationPlan,
  CivilDefenseInspection,
  CivilDefenseViolation,
} from '@/types/facility'

export interface CivilDefenseConfig {
  apiEndpoint: string
  apiKey: string
  environment: 'production' | 'sandbox'
  timeout?: number
  retryAttempts?: number
}

export interface CivilDefenseAPIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

export class CivilDefenseAdapter {
  private config: CivilDefenseConfig
  private baseUrl: string

  constructor(config: CivilDefenseConfig) {
    this.config = config
    this.baseUrl = config.apiEndpoint
  }

  /**
   * Test connection to Civil Defense API
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
   * Register facility with Civil Defense
   */
  async registerFacility(facilityData: {
    facilityId: string
    name: string
    address: string
    city: string
    coordinates?: { latitude: number; longitude: number }
    contact: {
      name: string
      phone: string
      email: string
    }
    fireSafetySystems: FireSafetySystem[]
    evacuationPlans: EvacuationPlan[]
  }): Promise<CivilDefenseAPIResponse<{ registrationNumber: string }>> {
    return this.request('POST', '/facilities/register', facilityData)
  }

  /**
   * Submit fire safety inspection report
   */
  async submitInspectionReport(
    facilityId: string,
    inspection: CivilDefenseInspection
  ): Promise<CivilDefenseAPIResponse<{ submissionId: string }>> {
    return this.request('POST', `/facilities/${facilityId}/inspections`, inspection)
  }

  /**
   * Get facility compliance status
   */
  async getComplianceStatus(
    facilityId: string
  ): Promise<CivilDefenseAPIResponse<{ status: string; score: number; violations: CivilDefenseViolation[] }>> {
    return this.request('GET', `/facilities/${facilityId}/compliance`)
  }

  /**
   * Submit evacuation plan
   */
  async submitEvacuationPlan(
    facilityId: string,
    plan: EvacuationPlan
  ): Promise<CivilDefenseAPIResponse<{ submissionId: string }>> {
    return this.request('POST', `/facilities/${facilityId}/evacuation-plans`, plan)
  }

  /**
   * Get fire safety requirements
   */
  async getFireSafetyRequirements(
    facilityType: string
  ): Promise<CivilDefenseAPIResponse<{ requirements: string[] }>> {
    return this.request('GET', `/requirements/${facilityType}`)
  }

  /**
   * Check license status
   */
  async checkLicenseStatus(
    licenseNumber: string
  ): Promise<CivilDefenseAPIResponse<{ status: string; expiryDate: Date; renewals: number }>> {
    return this.request('GET', `/licenses/${licenseNumber}`)
  }

  /**
   * Submit violation resolution
   */
  async submitViolationResolution(
    violationId: string,
    resolution: {
      description: string
      evidence: string[]
      resolvedDate: Date
    }
  ): Promise<CivilDefenseAPIResponse<{ status: string }>> {
    return this.request('POST', `/violations/${violationId}/resolve`, resolution)
  }

  /**
   * Get upcoming inspections
   */
  async getUpcomingInspections(
    facilityId: string
  ): Promise<CivilDefenseAPIResponse<{ inspections: CivilDefenseInspection[] }>> {
    return this.request('GET', `/facilities/${facilityId}/inspections/upcoming`)
  }

  /**
   * Sync facility data with Civil Defense
   */
  async syncFacilityData(
    facilityId: string,
    data: Partial<CivilDefenseIntegration>
  ): Promise<CivilDefenseAPIResponse<{ lastSync: Date }>> {
    return this.request('PUT', `/facilities/${facilityId}/sync`, data)
  }

  /**
   * Make HTTP request to Civil Defense API
   */
  private async request<T = any>(
    method: string,
    path: string,
    body?: any
  ): Promise<CivilDefenseAPIResponse<T>> {
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
