/**
 * Daleel API Authentication Module
 * 
 * Handles Basic Authentication (username/password) for Daleel API
 */

import type { DaleelAuthConfig } from '@/types/daleel'

export class DaleelAuth {
  private config: DaleelAuthConfig
  private isAuthenticatedFlag: boolean = false
  private authToken: string | null = null

  constructor(config: DaleelAuthConfig) {
    this.config = config
    this.validateConfig()
  }

  /**
   * Validate authentication configuration
   */
  private validateConfig(): void {
    if (!this.config.username || !this.config.password) {
      throw new Error('Daleel authentication requires both username and password')
    }
  }

  /**
   * Get Basic Auth token (Base64 encoded username:password)
   */
  private getBasicAuthToken(): string {
    const credentials = `${this.config.username}:${this.config.password}`
    return Buffer.from(credentials).toString('base64')
  }

  /**
   * Get authentication headers
   * Daleel uses Basic Authentication
   */
  getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Basic ${this.getBasicAuthToken()}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  /**
   * Check if authenticated
   * For Basic Auth, authentication is always valid if credentials are provided
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedFlag && !!this.config.username && !!this.config.password
  }

  /**
   * Authenticate (for Basic Auth, this just validates credentials)
   */
  async authenticate(): Promise<void> {
    this.validateConfig()
    this.authToken = this.getBasicAuthToken()
    this.isAuthenticatedFlag = true
  }

  /**
   * Get username (for debugging)
   */
  getUsername(): string {
    return this.config.username
  }

  /**
   * Update credentials
   */
  updateCredentials(username: string, password: string): void {
    this.config.username = username
    this.config.password = password
    this.validateConfig()
    this.authToken = this.getBasicAuthToken()
    this.isAuthenticatedFlag = true
  }

  /**
   * Clear authentication
   */
  logout(): void {
    this.isAuthenticatedFlag = false
    this.authToken = null
  }
}



