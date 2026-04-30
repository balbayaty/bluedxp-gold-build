/**
 * Rabet.sa Adapter - Main Entry Point
 * 
 * Enterprise-grade adapter for integrating with Rabet.sa
 * (Saudi Arabia Government Platform - ELM)
 * 
 * This adapter provides unified access to all Rabet.sa services
 * with proper authentication, error handling, and type safety.
 */

import { RabetAuth } from './auth'
import { RabetClient } from './client'
import {
  NuhaService,
  NafathService,
  MobileVerificationService,
  IBANVerificationService,
  ZawilService,
  DhamenService,
  AjerService,
  SmartGateService,
  OqoudService,
  WaelService,
  MobilityService,
  VehicleService,
  ImportInfoService,
  CustomsService,
  SafetySecurityService,
  FinancialService,
} from './types/services'

export interface RabetConfig {
  apiBaseUrl?: string
  clientId: string
  clientSecret: string
  environment?: 'sandbox' | 'production'
  timeout?: number
  retryAttempts?: number
  certificatePath?: string
  certificateKeyPath?: string
}

export class RabetAdapter {
  private auth: RabetAuth
  private client: RabetClient
  
  // Service instances
  public readonly digitalIdentity: {
    nuha: NuhaService
    nafath: NafathService
    mobileVerification: MobileVerificationService
    ibanVerification: IBANVerificationService
    zawil: ZawilService
  }
  
  public readonly business: {
    dhamen: DhamenService
    ajer: AjerService
    smartGate: SmartGateService
    oqoud: OqoudService
    wael: WaelService
  }
  
  public readonly mobility: MobilityService
  public readonly vehicle: VehicleService
  public readonly import: {
    importInfo: ImportInfoService
    customs: CustomsService
  }
  
  public readonly safety: SafetySecurityService
  public readonly financial: FinancialService

  constructor(config: RabetConfig) {
    // Initialize authentication
    this.auth = new RabetAuth({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      apiBaseUrl: config.apiBaseUrl || 'https://api.rabet.sa',
      environment: config.environment || 'sandbox',
      certificatePath: config.certificatePath,
      certificateKeyPath: config.certificateKeyPath,
    })

    // Initialize HTTP client
    this.client = new RabetClient({
      apiBaseUrl: config.apiBaseUrl || 'https://api.rabet.sa',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      auth: this.auth,
    })

    // Initialize service instances
    // TODO: Implement service classes
    this.digitalIdentity = {
      nuha: {} as NuhaService,
      nafath: {} as NafathService,
      mobileVerification: {} as MobileVerificationService,
      ibanVerification: {} as IBANVerificationService,
      zawil: {} as ZawilService,
    }

    this.business = {
      dhamen: {} as DhamenService,
      ajer: {} as AjerService,
      smartGate: {} as SmartGateService,
      oqoud: {} as OqoudService,
      wael: {} as WaelService,
    }

    this.mobility = {} as MobilityService
    this.vehicle = {} as VehicleService
    this.import = {
      importInfo: {} as ImportInfoService,
      customs: {} as CustomsService,
    }

    this.safety = {} as SafetySecurityService
    this.financial = {} as FinancialService
  }

  /**
   * Authenticate with Rabet.sa
   * Must be called before using any services
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
   * Get authentication token (for debugging)
   */
  getToken(): string | null {
    return this.auth.getToken()
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<void> {
    await this.auth.refreshToken()
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down'
    services: Record<string, string>
  }> {
    // TODO: Implement health check
    return {
      status: 'healthy',
      services: {},
    }
  }
}

// Export types
export * from './types/services'
export * from './types/auth'
export * from './types/responses'
export * from './types/errors'



