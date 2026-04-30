/**
 * Egypt NAFEZA Adapter
 * Integration with NAFEZA (National Single Window for Foreign Trade Facilitation)
 * 
 * NAFEZA is Egypt's unified customs and trade platform
 * Handles all customs declarations, clearances, and regulatory processes
 */

import { BaseCustomsAdapter } from '../base/CustomsAdapter'
import type {
  CustomsAdapterConfig,
  CustomsDeclaration,
  CustomsDocument,
  CustomsStatus,
  CountryCode,
} from '@/types/customs'

export interface NAFEZAConfig extends CustomsAdapterConfig {
  username: string
  password: string
  clientId: string
  clientSecret: string
  environment: 'sandbox' | 'production'
}

export class NAFEZAAdapter extends BaseCustomsAdapter {
  readonly id = 'nafeza-egypt'
  readonly name = 'NAFEZA (Egypt National Single Window)'
  readonly country: CountryCode = 'EG'
  readonly type = 'CUSTOMS' as const

  private config: NAFEZAConfig
  private baseUrl: string
  private accessToken?: string
  private tokenExpiry?: Date

  constructor(config: NAFEZAConfig) {
    super(config)
    this.config = config
    this.baseUrl =
      config.environment === 'production'
        ? 'https://api.nafeza.gov.eg'
        : 'https://api-sandbox.nafeza.gov.eg'
  }

  /**
   * Connect to NAFEZA API
   */
  async connect(): Promise<void> {
    try {
      // Authenticate with NAFEZA OAuth2
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
        throw new Error(`NAFEZA authentication failed: ${response.statusText}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000))
      this.connected = true

      this.log('info', 'Connected to NAFEZA successfully')
    } catch (error: any) {
      this.connected = false
      this.log('error', 'Failed to connect to NAFEZA', error)
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
          ? 'Successfully connected to NAFEZA'
          : 'Failed to connect to NAFEZA',
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
   * Submit declaration to NAFEZA
   */
  async submitDeclaration(
    declaration: Partial<CustomsDeclaration>
  ): Promise<CustomsDeclaration> {
    await this.ensureAuthenticated()

    try {
      // Transform to NAFEZA format
      const nafezaData = this.transformToNAFEZAFormat(declaration)

      const response = await fetch(`${this.baseUrl}/api/v1/declarations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(nafezaData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`NAFEZA submission failed: ${error.message || response.statusText}`)
      }

      const result = await response.json()

      return this.transformFromNAFEZAFormat(result)
    } catch (error: any) {
      this.log('error', 'Failed to submit declaration to NAFEZA', error)
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
      return this.mapNAFEZAStatus(data.status)
    } catch (error: any) {
      this.log('error', 'Failed to get declaration status', error)
      throw error
    }
  }

  /**
   * Upload document to NAFEZA
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
   * Transform declaration to NAFEZA format
   */
  private transformToNAFEZAFormat(declaration: Partial<CustomsDeclaration>): any {
    return {
      declarationType: declaration.type,
      customsOffice: declaration.customsOffice,
      importer: {
        name: declaration.importer?.name,
        taxId: declaration.importer?.taxId,
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
        carrier: declaration.carrier?.name,
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
      containers: declaration.containers?.map((c) => ({
        number: c.number,
        type: c.type,
        sealNumber: c.sealNumber,
      })),
    }
  }

  /**
   * Transform NAFEZA response to our format
   */
  private transformFromNAFEZAFormat(data: any): CustomsDeclaration {
    return {
      id: data.declarationId,
      declarationNumber: data.declarationNumber,
      country: 'EG',
      type: data.declarationType,
      status: this.mapNAFEZAStatus(data.status),
      submittedAt: new Date(data.submittedAt),
      estimatedArrivalDate: data.estimatedArrivalDate
        ? new Date(data.estimatedArrivalDate)
        : undefined,
      importer: data.importer
        ? {
            name: data.importer.name,
            country: data.importer.country,
            address: data.importer.address,
            taxId: data.importer.taxId,
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
        nafezaDeclarationId: data.declarationId,
        nafezaReference: data.referenceNumber,
      },
    } as CustomsDeclaration
  }

  /**
   * Map NAFEZA status to our status enum
   */
  private mapNAFEZAStatus(status: string): CustomsStatus {
    const statusMap: Record<string, CustomsStatus> = {
      DRAFT: 'DRAFT',
      SUBMITTED: 'SUBMITTED',
      UNDER_REVIEW: 'UNDER_REVIEW',
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
      CLEARED: 'CLEARED',
      HELD: 'HELD',
      CANCELLED: 'CANCELLED',
    }

    return statusMap[status.toUpperCase()] || 'DRAFT'
  }
}













