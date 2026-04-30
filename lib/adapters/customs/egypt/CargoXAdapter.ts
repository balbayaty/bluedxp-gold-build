/**
 * Egypt CargoX Adapter
 * Integration with CargoX blockchain platform for ACID (Advance Cargo Information Declaration)
 * 
 * CargoX is Egypt's blockchain-based document submission platform
 * Required for all imports to Egypt
 */

import { BaseCustomsAdapter } from '../base/CustomsAdapter'
import type {
  CustomsAdapterConfig,
  CustomsDeclaration,
  CustomsDocument,
  CustomsStatus,
  CountryCode,
} from '@/types/customs'

export interface CargoXConfig extends CustomsAdapterConfig {
  apiKey: string
  apiSecret: string
  blockchainAddress?: string
  environment: 'sandbox' | 'production'
}

export class CargoXAdapter extends BaseCustomsAdapter {
  readonly id = 'cargox-egypt'
  readonly name = 'CargoX (Egypt ACID)'
  readonly country: CountryCode = 'EG'
  readonly type = 'CUSTOMS' as const

  private config: CargoXConfig
  private baseUrl: string

  constructor(config: CargoXConfig) {
    super(config)
    this.config = config
    this.baseUrl =
      config.environment === 'production'
        ? 'https://api.cargox.io'
        : 'https://api-sandbox.cargox.io'
  }

  /**
   * Connect to CargoX API
   */
  async connect(): Promise<void> {
    try {
      // Authenticate with CargoX
      const response = await fetch(`${this.baseUrl}/v1/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
          'X-API-Secret': this.config.apiSecret,
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
        }),
      })

      if (!response.ok) {
        throw new Error(`CargoX authentication failed: ${response.statusText}`)
      }

      const data = await response.json()
      // Store token for subsequent requests
      this.connected = true

      this.log('info', 'Connected to CargoX successfully')
    } catch (error: any) {
      this.connected = false
      this.log('error', 'Failed to connect to CargoX', error)
      throw error
    }
  }

  /**
   * Check connection status
   */
  async isConnected(): Promise<boolean> {
    if (!this.connected) return false

    try {
      // Ping CargoX API
      const response = await fetch(`${this.baseUrl}/v1/health`, {
        headers: {
          'X-API-Key': this.config.apiKey,
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
          ? 'Successfully connected to CargoX'
          : 'Failed to connect to CargoX',
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
   * Submit ACID declaration to CargoX
   */
  async submitDeclaration(
    declaration: Partial<CustomsDeclaration>
  ): Promise<CustomsDeclaration> {
    if (!this.connected) {
      await this.connect()
    }

    try {
      // Transform declaration to CargoX ACID format
      const acidData = this.transformToACIDFormat(declaration)

      const response = await fetch(`${this.baseUrl}/v1/acid/declarations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify(acidData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`ACID submission failed: ${error.message || response.statusText}`)
      }

      const result = await response.json()

      // Transform CargoX response to our format
      return this.transformFromACIDFormat(result)
    } catch (error: any) {
      this.log('error', 'Failed to submit ACID declaration', error)
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
      const response = await fetch(`${this.baseUrl}/v1/acid/declarations/${declarationId}`, {
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get declaration status: ${response.statusText}`)
      }

      const data = await response.json()
      return this.mapCargoXStatus(data.status)
    } catch (error: any) {
      this.log('error', 'Failed to get declaration status', error)
      throw error
    }
  }

  /**
   * Upload document to CargoX blockchain
   */
  async uploadDocument(
    declarationId: string,
    document: Partial<CustomsDocument>
  ): Promise<CustomsDocument> {
    if (!this.connected) {
      await this.connect()
    }

    try {
      // CargoX uses blockchain for document storage
      const formData = new FormData()
      if (document.file) {
        formData.append('file', document.file as any)
      }
      formData.append('declarationId', declarationId)
      formData.append('documentType', document.type || 'OTHER')
      formData.append('description', document.description || '')

      const response = await fetch(`${this.baseUrl}/v1/documents/upload`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.config.apiKey,
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
        fileUrl: result.blockchainUrl,
        uploadedAt: new Date(),
        isValid: result.verified,
        metadata: {
          blockchainHash: result.hash,
          blockchainTransaction: result.transactionId,
        },
      } as CustomsDocument
    } catch (error: any) {
      this.log('error', 'Failed to upload document', error)
      throw error
    }
  }

  /**
   * Transform declaration to ACID format
   */
  private transformToACIDFormat(declaration: Partial<CustomsDeclaration>): any {
    return {
      // ACID required fields
      shipmentNumber: declaration.shipmentNumber,
      carrierCode: declaration.carrier?.code,
      vesselName: declaration.vessel?.name,
      voyageNumber: declaration.vessel?.voyageNumber,
      portOfLoading: declaration.originPort,
      portOfDischarge: declaration.destinationPort,
      estimatedArrivalDate: declaration.estimatedArrivalDate?.toISOString(),
      consignee: {
        name: declaration.importer?.name,
        address: declaration.importer?.address,
        country: declaration.importer?.country,
        taxId: declaration.importer?.taxId,
      },
      shipper: {
        name: declaration.exporter?.name,
        address: declaration.exporter?.address,
        country: declaration.exporter?.country,
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
      containerInfo: declaration.containers?.map((c) => ({
        containerNumber: c.number,
        containerType: c.type,
        sealNumber: c.sealNumber,
      })),
    }
  }

  /**
   * Transform ACID response to our format
   */
  private transformFromACIDFormat(data: any): CustomsDeclaration {
    return {
      id: data.declarationId,
      declarationNumber: data.acidNumber,
      country: 'EG',
      type: 'IMPORT',
      status: this.mapCargoXStatus(data.status),
      submittedAt: new Date(data.submittedAt),
      estimatedArrivalDate: data.estimatedArrivalDate
        ? new Date(data.estimatedArrivalDate)
        : undefined,
      importer: data.consignee
        ? {
            name: data.consignee.name,
            country: data.consignee.country,
            address: data.consignee.address,
            taxId: data.consignee.taxId,
          }
        : undefined,
      exporter: data.shipper
        ? {
            name: data.shipper.name,
            country: data.shipper.country,
            address: data.shipper.address,
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
        acidNumber: data.acidNumber,
        blockchainHash: data.blockchainHash,
        cargoxTransactionId: data.transactionId,
      },
    } as CustomsDeclaration
  }

  /**
   * Map CargoX status to our status enum
   */
  private mapCargoXStatus(status: string): CustomsStatus {
    const statusMap: Record<string, CustomsStatus> = {
      PENDING: 'SUBMITTED',
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













