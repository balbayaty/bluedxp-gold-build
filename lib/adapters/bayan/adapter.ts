/**
 * Bayan Electronic Freight Forwarder Adapter
 * 
 * Enterprise-grade adapter for Bayan EFF services
 * Extends WASL with waybill management and carrier operations
 */

import { WaslAuth } from '../wasl/auth'
import { WaslClient } from '../wasl/client'
import type {
  BayanAdapterConfig,
  BayanFreightForwarderService,
  BayanCarrierService,
  CreateTripRequest,
  CreateTripResponse,
  TripDetailsDTO,
  AddWaybillDTO,
  UpdateWaybillDTO,
  WaybillResponse,
  CloseWaybillRequest,
  CancelWaybillRequest,
  CreateCarrierTripRequest,
  UpdateVehicleOrDriverRequest,
  CreateExceptionalWaybillDTO,
} from '@/types/bayan'

export class BayanFreightForwarderAdapter implements BayanFreightForwarderService {
  private auth: WaslAuth
  private client: WaslClient
  private config: BayanAdapterConfig

  constructor(config: BayanAdapterConfig) {
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

  /**
   * Authenticate with Bayan
   */
  async authenticate(): Promise<void> {
    await this.auth.authenticate()
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated()
  }

  // ============================================================================
  // TRIP MANAGEMENT
  // ============================================================================

  /**
   * Create freight forwarder trip
   * POST /api/v1/freight-forwarder/trip
   */
  async createTrip(request: CreateTripRequest): Promise<CreateTripResponse> {
    try {
      const response = await this.client.post<CreateTripResponse>('/api/v1/freight-forwarder/trip', request)
      return response.success && response.data 
        ? response.data as CreateTripResponse
        : { success: false, message: response.message || 'Failed to create trip' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create trip',
      }
    }
  }

  /**
   * Update trip
   * PUT /api/v1/freight-forwarder/trip
   */
  async updateTrip(tripId: string, request: Partial<CreateTripRequest>): Promise<CreateTripResponse> {
    try {
      const response = await this.client.put<CreateTripResponse>('/api/v1/freight-forwarder/trip', {
        tripId,
        ...request,
      })
      return response.success && response.data 
        ? response.data as CreateTripResponse
        : { success: false, message: response.message || 'Failed to update trip' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update trip',
      }
    }
  }

  /**
   * Get freight forwarder trip
   * GET /api/v1/freight-forwarder/trip/{tripId}
   */
  async getTrip(tripId: string): Promise<TripDetailsDTO | null> {
    try {
      const response = await this.client.get<TripDetailsDTO>(`/api/v1/freight-forwarder/trip/${encodeURIComponent(tripId)}`)
      return response.success && response.data ? response.data : null
    } catch (error) {
      return null
    }
  }

  /**
   * Print freight forwarder trip
   * GET /api/v1/freight-forwarder/trip/{tripId}/print
   */
  async printTrip(tripId: string): Promise<Blob | null> {
    try {
      // Note: This endpoint returns a PDF/document, not JSON
      const response = await fetch(`${this.config.apiBaseUrl || 'https://www.rabet.sa'}/api/v1/freight-forwarder/trip/${encodeURIComponent(tripId)}/print`, {
        method: 'GET',
        headers: this.auth.getAuthHeaders(),
      })
      
      if (!response.ok) {
        return null
      }
      
      return await response.blob()
    } catch (error) {
      return null
    }
  }

  // ============================================================================
  // WAYBILL MANAGEMENT
  // ============================================================================

  /**
   * Add freight forwarder waybill
   * POST /api/v1/freight-forwarder/trip/waybill
   */
  async addWaybill(request: AddWaybillDTO): Promise<WaybillResponse> {
    try {
      const response = await this.client.post<WaybillResponse>('/api/v1/freight-forwarder/trip/waybill', request)
      return response.success && response.data 
        ? response.data as WaybillResponse
        : { success: false, message: response.message || 'Failed to add waybill' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to add waybill',
      }
    }
  }

  /**
   * Update freight forwarder waybill
   * PUT /api/v1/freight-forwarder/trip/waybill
   */
  async updateWaybill(request: UpdateWaybillDTO): Promise<WaybillResponse> {
    try {
      const response = await this.client.put<WaybillResponse>('/api/v1/freight-forwarder/trip/waybill', request)
      return response.success && response.data 
        ? response.data as WaybillResponse
        : { success: false, message: response.message || 'Failed to update waybill' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update waybill',
      }
    }
  }

  /**
   * Close freight forwarder waybill
   * PUT /api/v1/freight-forwarder/trip/waybill/close
   */
  async closeWaybill(request: CloseWaybillRequest): Promise<WaybillResponse> {
    try {
      const response = await this.client.put<WaybillResponse>('/api/v1/freight-forwarder/trip/waybill/close', request)
      return response.success && response.data 
        ? response.data as WaybillResponse
        : { success: false, message: response.message || 'Failed to close waybill' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to close waybill',
      }
    }
  }

  /**
   * Cancel freight forwarder waybill
   * PUT /api/v1/freight-forwarder/trip/waybill/cancel
   */
  async cancelWaybill(request: CancelWaybillRequest): Promise<WaybillResponse> {
    try {
      const response = await this.client.put<WaybillResponse>('/api/v1/freight-forwarder/trip/waybill/cancel', request)
      return response.success && response.data 
        ? response.data as WaybillResponse
        : { success: false, message: response.message || 'Failed to cancel waybill' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to cancel waybill',
      }
    }
  }
}

export class BayanCarrierAdapter implements BayanCarrierService {
  private auth: WaslAuth
  private client: WaslClient
  private config: BayanAdapterConfig

  constructor(config: BayanAdapterConfig) {
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

  /**
   * Authenticate with Bayan
   */
  async authenticate(): Promise<void> {
    await this.auth.authenticate()
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.auth.isAuthenticated()
  }

  // ============================================================================
  // CARRIER TRIP MANAGEMENT
  // ============================================================================

  /**
   * Create carrier trip
   * POST /api/v1/carrier/trip
   */
  async createCarrierTrip(request: CreateCarrierTripRequest): Promise<CreateTripResponse> {
    try {
      const response = await this.client.post<CreateTripResponse>('/api/v1/carrier/trip', request)
      return response.success && response.data 
        ? response.data as CreateTripResponse
        : { success: false, message: response.message || 'Failed to create carrier trip' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create carrier trip',
      }
    }
  }

  /**
   * Update carrier vehicle or driver
   * PUT /api/v1/carrier/trip
   */
  async updateVehicleOrDriver(request: UpdateVehicleOrDriverRequest): Promise<CreateTripResponse> {
    try {
      const response = await this.client.put<CreateTripResponse>('/api/v1/carrier/trip', request)
      return response.success && response.data 
        ? response.data as CreateTripResponse
        : { success: false, message: response.message || 'Failed to update vehicle or driver' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update vehicle or driver',
      }
    }
  }

  /**
   * Get carrier trip details
   * GET /api/v1/carrier/trip/{tripId}
   */
  async getCarrierTrip(tripId: string): Promise<TripDetailsDTO | null> {
    try {
      const response = await this.client.get<TripDetailsDTO>(`/api/v1/carrier/trip/${encodeURIComponent(tripId)}`)
      return response.success && response.data ? response.data : null
    } catch (error) {
      return null
    }
  }

  /**
   * Print carrier trip details
   * GET /api/v1/carrier/trip/{tripId}/print
   */
  async printCarrierTrip(tripId: string): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl || 'https://www.rabet.sa'}/api/v1/carrier/trip/${encodeURIComponent(tripId)}/print`, {
        method: 'GET',
        headers: this.auth.getAuthHeaders(),
      })
      
      if (!response.ok) {
        return null
      }
      
      return await response.blob()
    } catch (error) {
      return null
    }
  }

  // ============================================================================
  // CARRIER WAYBILL MANAGEMENT
  // ============================================================================

  /**
   * Add carrier waybill
   * POST /api/v1/carrier/trip/waybill
   */
  async addCarrierWaybill(request: AddWaybillDTO): Promise<WaybillResponse> {
    try {
      const response = await this.client.post<WaybillResponse>('/api/v1/carrier/trip/waybill', request)
      return response.success && response.data 
        ? response.data as WaybillResponse
        : { success: false, message: response.message || 'Failed to add carrier waybill' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to add carrier waybill',
      }
    }
  }

  /**
   * Update carrier waybill
   * PUT /api/v1/carrier/trip/waybill
   */
  async updateCarrierWaybill(request: UpdateWaybillDTO): Promise<WaybillResponse> {
    try {
      const response = await this.client.put<WaybillResponse>('/api/v1/carrier/trip/waybill', request)
      return response.success && response.data 
        ? response.data as WaybillResponse
        : { success: false, message: response.message || 'Failed to update carrier waybill' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update carrier waybill',
      }
    }
  }

  /**
   * Close carrier waybill
   * PUT /api/v1/carrier/trip/waybill/close
   */
  async closeCarrierWaybill(request: CloseWaybillRequest): Promise<WaybillResponse> {
    try {
      const response = await this.client.put<WaybillResponse>('/api/v1/carrier/trip/waybill/close', request)
      return response.success && response.data 
        ? response.data as WaybillResponse
        : { success: false, message: response.message || 'Failed to close carrier waybill' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to close carrier waybill',
      }
    }
  }

  /**
   * Cancel carrier waybill
   * PUT /api/v1/carrier/trip/waybill/cancel
   */
  async cancelCarrierWaybill(request: CancelWaybillRequest): Promise<WaybillResponse> {
    try {
      const response = await this.client.put<WaybillResponse>('/api/v1/carrier/trip/waybill/cancel', request)
      return response.success && response.data 
        ? response.data as WaybillResponse
        : { success: false, message: response.message || 'Failed to cancel carrier waybill' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to cancel carrier waybill',
      }
    }
  }

  /**
   * Create carrier exceptional waybill
   * POST /api/v1/carrier/trip/carrier/exWaybill
   */
  async createExceptionalWaybill(request: CreateExceptionalWaybillDTO): Promise<WaybillResponse> {
    try {
      const response = await this.client.post<WaybillResponse>('/api/v1/carrier/trip/carrier/exWaybill', request)
      return response.success && response.data 
        ? response.data as WaybillResponse
        : { success: false, message: response.message || 'Failed to create exceptional waybill' }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create exceptional waybill',
      }
    }
  }
}



