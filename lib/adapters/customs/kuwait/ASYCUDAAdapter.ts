/**
 * Kuwait ASYCUDA Adapter
 * Integration with ASYCUDA World (UN-developed customs system)
 * 
 * ASYCUDA World is used by Kuwait and Jordan for customs clearance
 * Standard UN system with REST API
 */

import { BaseCustomsAdapter } from '../base/CustomsAdapter'
import type {
  CustomsAdapterConfig,
  CustomsDeclaration,
  CustomsDocument,
  CustomsStatus,
  CountryCode,
} from '@/types/customs'

export interface ASYCUDAConfig extends CustomsAdapterConfig {
  username: string
  password: string
  officeCode: string
  environment: 'sandbox' | 'production'
}

export class ASYCUDAAdapter extends BaseCustomsAdapter {
  readonly id = 'asycuda-kuwait'
  readonly name = 'ASYCUDA World (Kuwait Customs)'
  readonly country: CountryCode = 'KW'
  readonly type = 'CUSTOMS' as const

  private config: ASYCUDAConfig
  private baseUrl: string
  private sessionToken?: string

  constructor(config: ASYCUDAConfig) {
    super(config)
    this.config = config
    this.baseUrl =
      config.environment === 'production'
        ? 'https://asycuda.customs.gov.kw'
        : 'https://asycuda-sandbox.customs.gov.kw'
  }

  /**
   * Connect to ASYCUDA API
   */
  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
          officeCode: this.config.officeCode,
        }),
      })

      if (!response.ok) {
        throw new Error(`ASYCUDA authentication failed: ${response.statusText}`)
      }

      const data = await response.json()
      this.sessionToken = data.sessionToken
      this.connected = true

      this.log('info', 'Connected to ASYCUDA successfully')
    } catch (error: any) {
      this.connected = false
      this.log('error', 'Failed to connect to ASYCUDA', error)
      throw error
    }
  }

  /**
   * Check connection status
   */
  async isConnected(): Promise<boolean> {
    if (!this.connected || !this.sessionToken) return false

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/validate`, {
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
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
          ? 'Successfully connected to ASYCUDA'
          : 'Failed to connect to ASYCUDA',
        details: {
          environment: this.config.environment,
          baseUrl: this.baseUrl,
          officeCode: this.config.officeCode,
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
   * Submit declaration to ASYCUDA
   */
  async submitDeclaration(
    declaration: Partial<CustomsDeclaration>
  ): Promise<CustomsDeclaration> {
    if (!this.connected) {
      await this.connect()
    }

    try {
      const asycudaData = this.transformToASYCUDAFormat(declaration)

      const response = await fetch(`${this.baseUrl}/api/declarations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.sessionToken}`,
        },
        body: JSON.stringify(asycudaData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`ASYCUDA submission failed: ${error.message || response.statusText}`)
      }

      const result = await response.json()
      return this.transformFromASYCUDAFormat(result)
    } catch (error: any) {
      this.log('error', 'Failed to submit declaration to ASYCUDA', error)
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
      const response = await fetch(`${this.baseUrl}/api/declarations/${declarationId}`, {
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get declaration status: ${response.statusText}`)
      }

      const data = await response.json()
      return this.mapASYCUDAStatus(data.status)
    } catch (error: any) {
      this.log('error', 'Failed to get declaration status', error)
      throw error
    }
  }

  /**
   * Upload document to ASYCUDA
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

      const response = await fetch(`${this.baseUrl}/api/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.sessionToken}`,
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
   * Transform declaration to ASYCUDA format
   */
  private transformToASYCUDAFormat(declaration: Partial<CustomsDeclaration>): any {
    return {
      declarationType: declaration.type,
      customsOffice: declaration.customsOffice || this.config.officeCode,
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
   * Transform ASYCUDA response to our format
   */
  private transformFromASYCUDAFormat(data: any): CustomsDeclaration {
    return {
      id: data.declarationId,
      declarationNumber: data.declarationNumber,
      country: 'KW',
      type: data.declarationType,
      status: this.mapASYCUDAStatus(data.status),
      submittedAt: new Date(data.submittedAt),
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
        asycudaDeclarationId: data.declarationId,
        asycudaReference: data.referenceNumber,
      },
    } as CustomsDeclaration
  }

  /**
   * Map ASYCUDA status to our status enum
   */
  private mapASYCUDAStatus(status: string): CustomsStatus {
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













