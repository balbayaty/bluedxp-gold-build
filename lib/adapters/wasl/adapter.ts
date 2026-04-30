/**
 * WASL EFF Adapter
 * 
 * Enterprise-grade adapter for WASL (Electronic Freight Forwarder) services
 * Implements EFF service interface for vehicle, driver, and trip management
 */

import { WaslAuth } from './auth'
import { WaslClient } from './client'
import type {
  WaslAdapterConfig,
  WaslEFFService,
  EffVehicleCreateDto,
  EffVehicleDeleteDto,
  EffDriverCreateDto,
  EffDriverDeleteDto,
  EffTripCreateDto,
  EffTripUpdateDto,
  WaslResponse,
  VehiclePlate,
} from '@/types/wasl'

export class WaslEFFAdapter implements WaslEFFService {
  private auth: WaslAuth
  private client: WaslClient
  private config: WaslAdapterConfig

  constructor(config: WaslAdapterConfig) {
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
   * Authenticate with WASL
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

  /**
   * Test connection to WASL API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    return this.client.testConnection()
  }

  // ============================================================================
  // VEHICLE MANAGEMENT
  // ============================================================================

  /**
   * Register a vehicle for Electronic Freight Forwarder
   * POST /eff/v1/vehicles
   */
  async registerVehicle(vehicle: EffVehicleCreateDto): Promise<WaslResponse<VehiclePlate>> {
    try {
      const response = await this.client.post<VehiclePlate>('/eff/v1/vehicles', vehicle)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to register vehicle',
        errors: [{
          code: 'VEHICLE_REGISTRATION_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }

  /**
   * Delete a vehicle for Electronic Freight Forwarder
   * DEL /eff/v1/vehicles
   */
  async deleteVehicle(vehicle: EffVehicleDeleteDto): Promise<WaslResponse<void>> {
    try {
      const response = await this.client.delete<void>('/eff/v1/vehicles', vehicle)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete vehicle',
        errors: [{
          code: 'VEHICLE_DELETION_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }

  // ============================================================================
  // DRIVER MANAGEMENT
  // ============================================================================

  /**
   * Register a driver for Electronic Freight Forwarder
   * POST /eff/v1/drivers
   */
  async registerDriver(driver: EffDriverCreateDto): Promise<WaslResponse<{ nationalId: string }>> {
    try {
      const response = await this.client.post<{ nationalId: string }>('/eff/v1/drivers', driver)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to register driver',
        errors: [{
          code: 'DRIVER_REGISTRATION_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }

  /**
   * Delete a driver for Electronic Freight Forwarder
   * DEL /eff/v1/drivers
   */
  async deleteDriver(driver: EffDriverDeleteDto): Promise<WaslResponse<void>> {
    try {
      const response = await this.client.delete<void>('/eff/v1/drivers', driver)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete driver',
        errors: [{
          code: 'DRIVER_DELETION_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }

  // ============================================================================
  // TRIP MANAGEMENT
  // ============================================================================

  /**
   * Register a trip for Electronic Freight Forwarder
   * POST /eff/v1/trips
   */
  async registerTrip(trip: EffTripCreateDto): Promise<WaslResponse<{ tripNumber: string }>> {
    try {
      const response = await this.client.post<{ tripNumber: string }>('/eff/v1/trips', trip)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to register trip',
        errors: [{
          code: 'TRIP_REGISTRATION_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }

  /**
   * Update a trip for Electronic Freight Forwarder
   * PATCH /eff/v1/trips/{tripNumber}
   */
  async updateTrip(tripNumber: string, updates: EffTripUpdateDto): Promise<WaslResponse<{ tripNumber: string }>> {
    try {
      const response = await this.client.patch<{ tripNumber: string }>(
        `/eff/v1/trips/${encodeURIComponent(tripNumber)}`,
        updates
      )
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update trip',
        errors: [{
          code: 'TRIP_UPDATE_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }

  /**
   * Get trip information
   * Note: This endpoint may not be in the provided API docs, but it's useful
   * If not available, we'll implement a workaround
   */
  async getTrip(tripNumber: string): Promise<WaslResponse<EffTripCreateDto & { status?: string }>> {
    try {
      // If GET endpoint exists, use it; otherwise return error
      const response = await this.client.get<EffTripCreateDto & { status?: string }>(
        `/eff/v1/trips/${encodeURIComponent(tripNumber)}`
      )
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to get trip',
        errors: [{
          code: 'TRIP_GET_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }
}



