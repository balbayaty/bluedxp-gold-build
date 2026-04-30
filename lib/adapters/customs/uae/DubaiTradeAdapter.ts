/**
 * UAE Dubai Trade Adapter
 * Integration with Dubai Trade (Dubai Customs Platform)
 * 
 * Dubai Trade is Dubai's unified customs and trade platform
 * Handles all customs declarations and clearances for Dubai
 */

import { BaseCustomsAdapter } from '../base/CustomsAdapter'
import type {
  CustomsAdapterConfig,
  CustomsDeclaration,
  CustomsDocument,
  CustomsStatus,
  CountryCode,
} from '@/types/customs'

export interface DubaiTradeConfig extends CustomsAdapterConfig {
  username: string
  password: string
  clientId: string
  clientSecret: string
  environment: 'sandbox' | 'production'
}

export class DubaiTradeAdapter extends BaseCustomsAdapter {
  readonly id = 'dubai-trade-uae'
  readonly name = 'Dubai Trade (Dubai Customs)'
  readonly country: CountryCode = 'AE'
  readonly type = 'CUSTOMS' as const

  private config: DubaiTradeConfig
  private baseUrl: string
  private accessToken?: string
  private tokenExpiry?: Date

  constructor(config: DubaiTradeConfig) {
    super(config)
    this.config = config
    this.baseUrl =
      config.environment === 'production'
        ? 'https://api.dubaitrade.ae'
        : 'https://api-sandbox.dubaitrade.ae'
  }

  /**
   * Connect to Dubai Trade API
   */
  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: this.config.username,
          password: this.config.password,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      })

      if (!response.ok) {
        throw new Error(`Dubai Trade authentication failed: ${response.statusText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000))
      this.connected = true

      this.log('info', 'Connected to Dubai Trade successfully')
    } catch (error: any) {
      this.connected = false
      this.log('error', 'Failed to connect to Dubai Trade', error)
      throw error
    }
  }

  /**
   * Ensure we have a valid token
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      await this.connect()
    }
  }

  /**
   * Check connection status
   */
  async isConnected(): Promise<boolean> {
    if (!this.connected || !this.accessToken) return false

    try {
      await this.ensureAuthenticated()
      return true
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
          ? 'Successfully connected to Dubai Trade'
          : 'Failed to connect to Dubai Trade',
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
   * Submit declaration to Dubai Trade
   */
  async submitDeclaration(
    declaration: Partial<CustomsDeclaration>
  ): Promise<CustomsDeclaration> {
    await this.ensureAuthenticated()

    try {
      const dubaiTradeData = this.transformToDubaiTradeFormat(declaration)

      const response = await fetch(`${this.baseUrl}/api/v1/declarations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(dubaiTradeData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Dubai Trade submission failed: ${error.message || response.statusText}`)
      }

      const result = await response.json()
      return this.transformFromDubaiTradeFormat(result)
    } catch (error: any) {
      this.log('error', 'Failed to submit declaration to Dubai Trade', error)
      throw error
    }
  }

  /**
   * Get declaration status
   */
  async getDeclarationStatus(declarationId: string): Promise<CustomsStatus> {
    await this.ensureAuthenticated()

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
      return this.mapDubaiTradeStatus(data.status)
    } catch (error: any) {
      this.log('error', 'Failed to get declaration status', error)
      throw error
    }
  }

  /**
   * Upload document to Dubai Trade
   */
  async uploadDocument(
    declarationId: string,
    document: Partial<CustomsDocument>
  ): Promise<CustomsDocument> {
    await this.ensureAuthenticated()

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
   * Transform declaration to Dubai Trade format
   */
  private transformToDubaiTradeFormat(declaration: Partial<CustomsDeclaration>): any {
    return {
      declarationType: declaration.type,
      customsOffice: declaration.customsOffice,
      importer: {
        name: declaration.importer?.name,
        tradeLicense: declaration.importer?.taxId, // UAE uses Trade License
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
   * Transform Dubai Trade response to our format
   */
  private transformFromDubaiTradeFormat(data: any): CustomsDeclaration {
    return {
      id: data.declarationId,
      declarationNumber: data.declarationNumber,
      country: 'AE',
      type: data.declarationType,
      status: this.mapDubaiTradeStatus(data.status),
      submittedAt: new Date(data.submittedAt),
      importer: data.importer
        ? {
            name: data.importer.name,
            country: data.importer.country,
            address: data.importer.address,
            taxId: data.importer.tradeLicense,
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
        dubaiTradeDeclarationId: data.declarationId,
        dubaiTradeReference: data.referenceNumber,
      },
    } as CustomsDeclaration
  }

  /**
   * Map Dubai Trade status to our status enum
   */
  private mapDubaiTradeStatus(status: string): CustomsStatus {
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













