/**
 * Saudi Arabia FASAH Adapter
 * Integration with FASAH (Fasah - Saudi Customs Platform)
 * 
 * FASAH is Saudi Arabia's unified customs and trade platform
 * Handles all customs declarations and clearances
 */

import { BaseCustomsAdapter } from '../base/CustomsAdapter'
import type {
  CustomsAdapterConfig,
  CustomsDeclaration,
  CustomsDocument,
  CustomsStatus,
  CountryCode,
} from '@/types/customs'

export interface FASAHConfig extends CustomsAdapterConfig {
  apiKey: string
  apiSecret: string
  merchantId: string
  environment: 'sandbox' | 'production'
}

export class FASAHAdapter extends BaseCustomsAdapter {
  readonly id = 'fasah-saudi'
  readonly name = 'FASAH (Saudi Arabia Customs)'
  readonly country: CountryCode = 'SA'
  readonly type = 'CUSTOMS' as const

  private config: FASAHConfig
  private baseUrl: string
  private accessToken?: string

  constructor(config: FASAHConfig) {
    super(config)
    this.config = config
    this.baseUrl =
      config.environment === 'production'
        ? 'https://api.fasah.sa'
        : 'https://api-sandbox.fasah.sa'
  }

  /**
   * Connect to FASAH API
   */
  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.config.apiKey,
          api_secret: this.config.apiSecret,
          merchant_id: this.config.merchantId,
        }),
      })

      if (!response.ok) {
        throw new Error(`FASAH authentication failed: ${response.statusText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.connected = true

      this.log('info', 'Connected to FASAH successfully')
    } catch (error: any) {
      this.connected = false
      this.log('error', 'Failed to connect to FASAH', error)
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
          ? 'Successfully connected to FASAH'
          : 'Failed to connect to FASAH',
        details: {
          environment: this.config.environment,
          baseUrl: this.baseUrl,
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
   * Submit declaration to FASAH
   */
  async submitDeclaration(
    declaration: Partial<CustomsDeclaration>
  ): Promise<CustomsDeclaration> {
    if (!this.connected) {
      await this.connect()
    }

    try {
      const fasahData = this.transformToFASAHFormat(declaration)

      const response = await fetch(`${this.baseUrl}/api/v1/declarations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(fasahData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`FASAH submission failed: ${error.message || response.statusText}`)
      }

      const result = await response.json()
      return this.transformFromFASAHFormat(result)
    } catch (error: any) {
      this.log('error', 'Failed to submit declaration to FASAH', error)
      throw error
    }
  }

  /**
   * Get declaration status
   */
  async getDeclarationStatus(declarationId: string): Promise<CustomsStatus> {
    if (!this.connected) {
      await this.connect()
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/declarations/${declarationId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get declaration status: ${response.statusText}`)
      }

      const data = await response.json()
      return this.mapFASAHStatus(data.status)
    } catch (error: any) {
      this.log('error', 'Failed to get declaration status', error)
      throw error
    }
  }

  /**
   * Upload document to FASAH
   */
  async uploadDocument(
    declarationId: string,
    document: Partial<CustomsDocument>
  ): Promise<CustomsDocument> {
    if (!this.connected) {
      await this.connect()
    }

    try {
      const formData = new FormData()
      if (document.file) {
        formData.append('file', document.file as any)
      }
      formData.append('declarationId', declarationId)
      formData.append('documentType', document.type || 'OTHER')

      const response = await fetch(`${this.baseUrl}/api/v1/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Document upload failed: ${response.statusText}`)
      }

      const result = await response.json()

      return {
        id: result.documentId,
        declarationId,
        type: document.type || 'OTHER',
        name: result.fileName,
        fileUrl: result.url,
        uploadedAt: new Date(),
        isValid: result.verified,
      } as CustomsDocument
    } catch (error: any) {
      this.log('error', 'Failed to upload document', error)
      throw error
    }
  }

  /**
   * Transform declaration to FASAH format
   */
  private transformToFASAHFormat(declaration: Partial<CustomsDeclaration>): any {
    return {
      declarationType: declaration.type,
      customsOffice: declaration.customsOffice,
      importer: {
        name: declaration.importer?.name,
        crNumber: declaration.importer?.taxId, // Saudi uses CR (Commercial Registration)
        address: declaration.importer?.address,
        country: declaration.importer?.country,
      },
      exporter: {
        name: declaration.exporter?.name,
        address: declaration.exporter?.address,
        country: declaration.exporter?.country,
      },
      shipment: {
        originPort: declaration.originPort,
        destinationPort: declaration.destinationPort,
        transportMode: declaration.transportMode,
      },
      products: declaration.products?.map((p) => ({
        hsCode: p.hsCode,
        description: p.description,
        quantity: p.quantity,
        unit: p.unit,
        unitValue: p.unitValue,
        totalValue: p.totalValue,
        weight: p.weight,
        originCountry: p.originCountry,
      })),
    }
  }

  /**
   * Transform FASAH response to our format
   */
  private transformFromFASAHFormat(data: any): CustomsDeclaration {
    return {
      id: data.declarationId,
      declarationNumber: data.declarationNumber,
      country: 'SA',
      type: data.declarationType,
      status: this.mapFASAHStatus(data.status),
      submittedAt: new Date(data.submittedAt),
      importer: data.importer
        ? {
            name: data.importer.name,
            country: data.importer.country,
            address: data.importer.address,
            taxId: data.importer.crNumber,
          }
        : undefined,
      exporter: data.exporter
        ? {
            name: data.exporter.name,
            country: data.exporter.country,
            address: data.exporter.address,
          }
        : undefined,
      products: data.products?.map((p: any) => ({
        id: p.productId,
        hsCode: p.hsCode,
        description: p.description,
        quantity: p.quantity,
        unit: p.unit,
        unitValue: p.unitValue,
        totalValue: p.totalValue,
        weight: p.weight,
        originCountry: p.originCountry,
      })),
      metadata: {
        fasahDeclarationId: data.declarationId,
        fasahReference: data.referenceNumber,
      },
    } as CustomsDeclaration
  }

  /**
   * Map FASAH status to our status enum
   */
  private mapFASAHStatus(status: string): CustomsStatus {
    const statusMap: Record<string, CustomsStatus> = {
      DRAFT: 'DRAFT',
      SUBMITTED: 'SUBMITTED',
      UNDER_REVIEW: 'UNDER_REVIEW',
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
      CLEARED: 'CLEARED',
      HELD: 'HELD',
    }

    return statusMap[status.toUpperCase()] || 'DRAFT'
  }
}













