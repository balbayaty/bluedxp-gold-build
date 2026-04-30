/**
 * WASL Authentication Module
 * 
 * Handles app_id and app_key authentication for WASL/Rabet.sa EFF services
 * Uses header-based authentication (not OAuth/Bearer tokens)
 */

import type { WaslAuthConfig } from '@/types/wasl'

export class WaslAuth {
  private config: WaslAuthConfig
  private isAuthenticatedFlag: boolean = false

  constructor(config: WaslAuthConfig) {
    this.config = config
    this.validateConfig()
  }

  /**
   * Validate authentication configuration
   */
  private validateConfig(): void {
    if (!this.config.appId || !this.config.appKey) {
      throw new Error('WASL authentication requires both appId and appKey')
    }
  }

  /**
   * Get authentication headers
   * WASL uses app_id and app_key as headers (not Bearer tokens)
   */
  getAuthHeaders(): Record<string, string> {
    return {
      'app_id': this.config.appId,
      'app_key': this.config.appKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  /**
   * Check if authenticated
   * For WASL, authentication is always valid if credentials are provided
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedFlag && !!this.config.appId && !!this.config.appKey
  }

  /**
   * Authenticate (for WASL, this just validates credentials)
   */
  async authenticate(): Promise<void> {
    this.validateConfig()
    this.isAuthenticatedFlag = true
  }

  /**
   * Get app ID (for debugging)
   */
  getAppId(): string {
    return this.config.appId
  }

  /**
   * Update credentials
   */
  updateCredentials(appId: string, appKey: string): void {
    this.config.appId = appId
    this.config.appKey = appKey
    this.validateConfig()
    this.isAuthenticatedFlag = true
  }

  /**
   * Clear authentication
   */
  logout(): void {
    this.isAuthenticatedFlag = false
  }
}



