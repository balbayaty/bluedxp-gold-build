/**
 * TIR/ETIR Adapter
 * Integration with Electronic TIR (ETIR) system
 * 
 * ETIR enables secure data exchange between national customs systems
 * for TIR (Transports Internationaux Routiers) operations
 */

import { BaseCustomsAdapter } from '../base/CustomsAdapter'
import type {
  CustomsAdapterConfig,
  CustomsDeclaration,
  CustomsStatus,
  CountryCode,
} from '@/types/customs'
import type { TIRCarnet, TIRBorderCrossing, ETIRDeclaration } from '@/types/tir'

export interface ETIRConfig extends CustomsAdapterConfig {
  operatorId: string
  apiKey: string
  apiSecret: string
  environment: 'sandbox' | 'production'
}

export class ETIRAdapter extends BaseCustomsAdapter {
  readonly id = 'etir-international'
  readonly name = 'ETIR (Electronic TIR)'
  readonly country: CountryCode = 'EG' // Can be used for multiple countries
  readonly type = 'TIR' as const

  private config: ETIRConfig
  private baseUrl: string
  private accessToken?: string

  constructor(config: ETIRConfig) {
    super(config)
    this.config = config
    this.baseUrl =
      config.environment === 'production'
        ? 'https://api.etir.org'
        : 'https://api-sandbox.etir.org'
  }

  /**
   * Connect to ETIR API
   */
  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: this.config.apiKey,
          client_secret: this.config.apiSecret,
          operator_id: this.config.operatorId,
        }),
      })

      if (!response.ok) {
        throw new Error(`ETIR authentication failed: ${response.statusText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.connected = true

      this.log('info', 'Connected to ETIR successfully')
    } catch (error: any) {
      this.connected = false
      this.log('error', 'Failed to connect to ETIR', error)
      throw error
    }
  }

  /**
   * Check connection status
   */
  async isConnected(): Promise<boolean> {
    if (!this.connected || !this.accessToken) return false

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      return response.ok
    } catch (error) {
      this.connected = false
      return false
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      await this.connect()
      const isConnected = await this.isConnected()

      return {
        success: isConnected,
        message: isConnected
          ? 'Successfully connected to ETIR'
          : 'Failed to connect to ETIR',
        details: {
          environment: this.config.environment,
          baseUrl: this.baseUrl,
          operatorId: this.config.operatorId,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        details: { error: error.message },
      }
    }
  }

  /**
   * Submit TIR declaration via ETIR
   */
  async submitDeclaration(
    declaration: Partial<CustomsDeclaration>
  ): Promise<CustomsDeclaration> {
    if (!this.connected) {
      await this.connect()
    }

    try {
      // Transform to ETIR format
      const etirData = this.transformToETIRFormat(declaration)

      const response = await fetch(`${this.baseUrl}/api/v1/tir/declarations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(etirData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`ETIR submission failed: ${error.message || response.statusText}`)
      }

      const result = await response.json()
      return this.transformFromETIRFormat(result)
    } catch (error: any) {
      this.log('error', 'Failed to submit TIR declaration to ETIR', error)
      throw error
    }
  }

  /**
   * Register border crossing
   */
  async registerBorderCrossing(
    carnetNumber: string,
    borderCrossing: Partial<TIRBorderCrossing>
  ): Promise<TIRBorderCrossing> {
    if (!this.connected) {
      await this.connect()
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/tir/carnets/${carnetNumber}/border-crossings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(borderCrossing),
        }
      )

      if (!response.ok) {
        throw new Error(`Border crossing registration failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error: any) {
      this.log('error', 'Failed to register border crossing', error)
      throw error
    }
  }

  /**
   * Get carnet status
   */
  async getCarnetStatus(carnetNumber: string): Promise<any> {
    if (!this.connected) {
      await this.connect()
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tir/carnets/${carnetNumber}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get carnet status: ${response.statusText}`)
      }

      return await response.json()
    } catch (error: any) {
      this.log('error', 'Failed to get carnet status', error)
      throw error
    }
  }

  /**
   * Transform declaration to ETIR format
   */
  private transformToETIRFormat(declaration: Partial<CustomsDeclaration>): any {
    return {
      carnetNumber: declaration.tirCarnetNumber,
      borderCrossing: declaration.borderCrossing,
      country: declaration.country,
      declarationType: declaration.type,
      vehicle: declaration.vehicle,
      driver: declaration.driver,
      products: declaration.products?.map((p) => ({
        hsCode: p.hsCode,
        description: p.description,
        quantity: p.quantity,
        unit: p.unit,
        weight: p.weight,
      })),
    }
  }

  /**
   * Transform ETIR response to our format
   */
  private transformFromETIRFormat(data: any): CustomsDeclaration {
    return {
      id: data.declarationId,
      declarationNumber: data.etirNumber,
      country: data.country,
      type: 'TIR',
      status: this.mapETIRStatus(data.status),
      submittedAt: new Date(data.submittedAt),
      tirCarnetNumber: data.carnetNumber,
      borderCrossing: data.borderCrossing,
      metadata: {
        etirNumber: data.etirNumber,
        etirTransactionId: data.transactionId,
      },
    } as CustomsDeclaration
  }

  /**
   * Map ETIR status to our status enum
   */
  private mapETIRStatus(status: string): CustomsStatus {
    const statusMap: Record<string, CustomsStatus> = {
      PENDING: 'SUBMITTED',
      SUBMITTED: 'SUBMITTED',
      IN_TRANSIT: 'UNDER_REVIEW',
      COMPLETED: 'CLEARED',
      CANCELLED: 'CANCELLED',
    }

    return statusMap[status.toUpperCase()] || 'DRAFT'
  }
}













