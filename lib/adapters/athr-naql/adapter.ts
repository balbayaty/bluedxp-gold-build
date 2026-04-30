/**
 * Athr Naql (Transportation Impact) Adapter
 * 
 * Enterprise-grade adapter for Athr Naql verification and inquiry services
 * Provides operation card, license, and driver card verification
 */

import { WaslAuth } from '../wasl/auth'
import { WaslClient } from '../wasl/client'
import type {
  AthrNaqlAdapterConfig,
  AthrNaqlOperationCardService,
  AthrNaqlLicenseService,
  AthrNaqlDriverCardService,
  OperationCardStatusRequest,
  OperationCardStatusResponseV1,
  OperationCardTypeResponse,
  LicenseStatusRequest,
  LicenseStatusResponse,
  LicenseStatusResponseV2,
  LicenseTypeResponse,
  DriverCardStatusRequest,
  DriverCardStatusBySponsorIdRequest,
  DriverCardStatusResponse,
  DriverCardCategoryTypeResponse,
} from '@/types/athr-naql'

export class AthrNaqlOperationCardAdapter implements AthrNaqlOperationCardService {
  private auth: WaslAuth
  private client: WaslClient
  private config: AthrNaqlAdapterConfig

  constructor(config: AthrNaqlAdapterConfig) {
    this.config = config
    this.auth = new WaslAuth({
      appId: config.appId,
      appKey: config.appKey,
      apiBaseUrl: config.apiBaseUrl,
      environment: config.environment,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
    })
    
    this.client = new WaslClient({
      apiBaseUrl: config.apiBaseUrl || 'https://www.rabet.sa',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      auth: this.auth,
      enableLogging: config.enableLogging,
    })
  }

  async authenticate(): Promise<void> {
    await this.auth.authenticate()
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated()
  }

  /**
   * Inquire operation card status
   * POST /naql/v1/operation-card/inquiry/status
   */
  async inquireOperationCardStatus(request: OperationCardStatusRequest): Promise<OperationCardStatusResponseV1> {
    try {
      const response = await this.client.post<OperationCardStatusResponseV1>(
        '/naql/v1/operation-card/inquiry/status',
        request
      )
      return response.success && response.data
        ? { success: true, data: response.data as OperationCardStatusResponseV1['data'] }
        : { success: false, message: response.message || 'Failed to inquire operation card status' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to inquire operation card status',
      }
    }
  }

  /**
   * Get all operation card types
   * GET /naql/v1/operation-card/inquiry/types
   */
  async getOperationCardTypes(): Promise<OperationCardTypeResponse['data']> {
    try {
      const response = await this.client.get<OperationCardTypeResponse>('/naql/v1/operation-card/inquiry/types')
      return response.success && response.data ? response.data : []
    } catch (error) {
      return []
    }
  }

  /**
   * Get operation card type by ID
   * GET /naql/v1/operation-card/inquiry/types/{id}
   */
  async getOperationCardType(id: string): Promise<OperationCardTypeResponse['data'][0] | null> {
    try {
      const response = await this.client.get<OperationCardTypeResponse>(`/naql/v1/operation-card/inquiry/types/${encodeURIComponent(id)}`)
      return response.success && response.data && response.data.length > 0 ? response.data[0] : null
    } catch (error) {
      return null
    }
  }
}

export class AthrNaqlLicenseAdapter implements AthrNaqlLicenseService {
  private auth: WaslAuth
  private client: WaslClient
  private config: AthrNaqlAdapterConfig

  constructor(config: AthrNaqlAdapterConfig) {
    this.config = config
    this.auth = new WaslAuth({
      appId: config.appId,
      appKey: config.appKey,
      apiBaseUrl: config.apiBaseUrl,
      environment: config.environment,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
    })
    
    this.client = new WaslClient({
      apiBaseUrl: config.apiBaseUrl || 'https://www.rabet.sa',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      auth: this.auth,
      enableLogging: config.enableLogging,
    })
  }

  async authenticate(): Promise<void> {
    await this.auth.authenticate()
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated()
  }

  /**
   * Inquire license status (V1)
   * POST /naql/v1/license/inquiry/status
   */
  async inquireLicenseStatus(request: LicenseStatusRequest): Promise<LicenseStatusResponse> {
    try {
      const response = await this.client.post<LicenseStatusResponse>('/naql/v1/license/inquiry/status', request)
      return response.success && response.data
        ? { success: true, data: response.data as LicenseStatusResponse['data'] }
        : { success: false, message: response.message || 'Failed to inquire license status' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to inquire license status',
      }
    }
  }

  /**
   * Inquire license status (V2)
   * POST /naql/v2/license/inquiry/status
   */
  async inquireLicenseStatusV2(request: LicenseStatusRequest): Promise<LicenseStatusResponseV2> {
    try {
      const response = await this.client.post<LicenseStatusResponseV2>('/naql/v2/license/inquiry/status', request)
      return response.success && response.data
        ? { success: true, data: response.data as LicenseStatusResponseV2['data'] }
        : { success: false, message: response.message || 'Failed to inquire license status' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to inquire license status',
      }
    }
  }

  /**
   * Get all license types
   * GET /naql/v1/license/inquiry/types
   */
  async getLicenseTypes(): Promise<LicenseTypeResponse['data']> {
    try {
      const response = await this.client.get<LicenseTypeResponse>('/naql/v1/license/inquiry/types')
      return response.success && response.data ? response.data : []
    } catch (error) {
      return []
    }
  }

  /**
   * Get license type by ID
   * GET /naql/v1/license/inquiry/types/{id}
   */
  async getLicenseType(id: string): Promise<LicenseTypeResponse['data'][0] | null> {
    try {
      const response = await this.client.get<LicenseTypeResponse>(`/naql/v1/license/inquiry/types/${encodeURIComponent(id)}`)
      return response.success && response.data && response.data.length > 0 ? response.data[0] : null
    } catch (error) {
      return null
    }
  }
}

export class AthrNaqlDriverCardAdapter implements AthrNaqlDriverCardService {
  private auth: WaslAuth
  private client: WaslClient
  private config: AthrNaqlAdapterConfig

  constructor(config: AthrNaqlAdapterConfig) {
    this.config = config
    this.auth = new WaslAuth({
      appId: config.appId,
      appKey: config.appKey,
      apiBaseUrl: config.apiBaseUrl,
      environment: config.environment,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
    })
    
    this.client = new WaslClient({
      apiBaseUrl: config.apiBaseUrl || 'https://www.rabet.sa',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      auth: this.auth,
      enableLogging: config.enableLogging,
    })
  }

  async authenticate(): Promise<void> {
    await this.auth.authenticate()
  }

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated()
  }

  /**
   * Inquire driver card status
   * POST /naql/v1/driver-card/inquiry/status
   */
  async inquireDriverCardStatus(request: DriverCardStatusRequest): Promise<DriverCardStatusResponse> {
    try {
      const response = await this.client.post<DriverCardStatusResponse>('/naql/v1/driver-card/inquiry/status', request)
      return response.success && response.data
        ? { success: true, data: response.data as DriverCardStatusResponse['data'] }
        : { success: false, message: response.message || 'Failed to inquire driver card status' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to inquire driver card status',
      }
    }
  }

  /**
   * Inquire driver card status by sponsor ID
   * POST /naql/v1/driver-card/inquiry/status/by-sponsor-id
   */
  async inquireDriverCardStatusBySponsorId(request: DriverCardStatusBySponsorIdRequest): Promise<DriverCardStatusResponse[]> {
    try {
      const response = await this.client.post<DriverCardStatusResponse[]>('/naql/v1/driver-card/inquiry/status/by-sponsor-id', request)
      return response.success && response.data ? response.data as DriverCardStatusResponse[] : []
    } catch (error) {
      return []
    }
  }

  /**
   * Get driver card category types
   * GET /naql/v1/driver-card/inquiry/category-type
   */
  async getDriverCardCategoryTypes(): Promise<DriverCardCategoryTypeResponse['data']> {
    try {
      const response = await this.client.get<DriverCardCategoryTypeResponse>('/naql/v1/driver-card/inquiry/category-type')
      return response.success && response.data ? response.data : []
    } catch (error) {
      return []
    }
  }
}



