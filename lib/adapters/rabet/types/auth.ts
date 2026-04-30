/**
 * Rabet.sa Authentication Types
 */

export type AuthMethod = 'oauth2' | 'saml' | 'certificate' | 'apikey'

export interface AuthConfig {
  method: AuthMethod
  clientId?: string
  clientSecret?: string
  certificatePath?: string
  certificateKeyPath?: string
  apiKey?: string
  redirectUri?: string
}

export interface TokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token?: string
  scope?: string
}

export interface AuthError {
  error: string
  error_description?: string
  error_uri?: string
}



