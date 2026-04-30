/**
 * Daleel Location Tracking Adapter
 * 
 * Real-time location tracking adapter for Daleel API
 * Provides current location, historical tracking, and advanced location services
 */

import { DaleelAuth } from './auth'
import { DaleelClient } from './client'
import type {
  DaleelAdapterConfig,
  DaleelLocationService,
  VehiclePlate,
  VehicleLocationDTO,
  VehicleLocationDetailsDTO,
  Point,
  CurrentLocationRequestDTO,
  HistoryRequestDTO,
  PolygonRequestDTO,
  WeightDropRequestDTO,
  DaleelResponse,
} from '@/types/daleel'

export class DaleelLocationAdapter implements DaleelLocationService {
  private auth: DaleelAuth
  private client: DaleelClient
  private config: DaleelAdapterConfig

  constructor(config: DaleelAdapterConfig) {
    this.config = config
    this.auth = new DaleelAuth({
      username: config.username,
      password: config.password,
      apiBaseUrl: config.apiBaseUrl,
      environment: config.environment,
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
    })
    
    this.client = new DaleelClient({
      apiBaseUrl: config.apiBaseUrl || 'https://www.rabet.sa',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      auth: this.auth,
      enableLogging: config.enableLogging,
    })
  }

  /**
   * Authenticate with Daleel
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
   * Test connection to Daleel API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    return this.client.testConnection()
  }

  // ============================================================================
  // CURRENT LOCATION
  // ============================================================================

  /**
   * Get current location of a vehicle
   * POST /api/v1/location/current
   */
  async getCurrentLocation(vehiclePlate: VehiclePlate): Promise<DaleelResponse<VehicleLocationDTO>> {
    try {
      const request: CurrentLocationRequestDTO = { vehiclePlate }
      const response = await this.client.post<VehicleLocationDTO>('/api/v1/location/current', request)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to get current location',
        errors: [{
          code: 'LOCATION_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }

  /**
   * Get current location with details
   * POST /api/v1/location/current/details
   */
  async getCurrentLocationDetails(vehiclePlate: VehiclePlate): Promise<DaleelResponse<VehicleLocationDetailsDTO>> {
    try {
      const request: CurrentLocationRequestDTO = { vehiclePlate }
      const response = await this.client.post<VehicleLocationDetailsDTO>('/api/v1/location/current/details', request)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to get current location details',
        errors: [{
          code: 'LOCATION_DETAILS_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }

  /**
   * Get current location for multiple vehicles
   * POST /api/v1/location/current/details/list
   */
  async getCurrentLocationList(vehiclePlates: VehiclePlate[]): Promise<DaleelResponse<VehicleLocationDetailsDTO[]>> {
    try {
      const request = { vehiclePlates }
      const response = await this.client.post<VehicleLocationDetailsDTO[]>('/api/v1/location/current/details/list', request)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to get current location list',
        errors: [{
          code: 'LOCATION_LIST_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }

  // ============================================================================
  // HISTORICAL LOCATION
  // ============================================================================

  /**
   * Get historical location data for a vehicle
   * POST /api/v1/location/history
   */
  async getLocationHistory(
    vehiclePlate: VehiclePlate,
    startDate: string,
    endDate: string
  ): Promise<DaleelResponse<VehicleLocationDTO[]>> {
    try {
      const request: HistoryRequestDTO = {
        vehiclePlate,
        startDate,
        endDate,
      }
      const response = await this.client.post<VehicleLocationDTO[]>('/api/v1/location/history', request)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to get location history',
        errors: [{
          code: 'HISTORY_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }

  /**
   * Get current and historical location data
   * POST /api/v1/location/current-history
   */
  async getCurrentAndHistory(
    vehiclePlate: VehiclePlate,
    startDate: string,
    endDate: string
  ): Promise<DaleelResponse<{ current?: VehicleLocationDTO; history: VehicleLocationDTO[] }>> {
    try {
      const request = {
        vehiclePlate,
        startDate,
        endDate,
      }
      const response = await this.client.post<{ current?: VehicleLocationDTO; history: VehicleLocationDTO[] }>(
        '/api/v1/location/current-history',
        request
      )
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to get current and history',
        errors: [{
          code: 'CURRENT_HISTORY_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }

  // ============================================================================
  // ADVANCED LOCATION SERVICES
  // ============================================================================

  /**
   * Get vehicles inside a polygon
   * POST /api/v1/location/polygon
   */
  async getVehiclesInPolygon(polygon: Point[]): Promise<DaleelResponse<VehicleLocationDTO[]>> {
    try {
      const request: PolygonRequestDTO = { polygon }
      const response = await this.client.post<VehicleLocationDTO[]>('/api/v1/location/polygon', request)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to get vehicles in polygon',
        errors: [{
          code: 'POLYGON_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }

  /**
   * Get weight drop locations for a vehicle
   * POST /api/v1/location/weightdrop
   */
  async getWeightDropLocations(
    vehiclePlate: VehiclePlate,
    startDate?: string,
    endDate?: string
  ): Promise<DaleelResponse<Array<{ location: Point; timestamp: string; weight?: number; [key: string]: any }>>> {
    try {
      const request: WeightDropRequestDTO = {
        vehiclePlate,
        startDate,
        endDate,
      }
      const response = await this.client.post<Array<{ location: Point; timestamp: string; weight?: number; [key: string]: any }>>(
        '/api/v1/location/weightdrop',
        request
      )
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to get weight drop locations',
        errors: [{
          code: 'WEIGHT_DROP_ERROR',
          message: error.message || 'Unknown error',
        }],
      }
    }
  }
}



