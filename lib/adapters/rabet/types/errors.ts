/**
 * Rabet.sa Error Types
 */

export class RabetError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'RabetError'
  }
}

export class RabetAuthenticationError extends RabetError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'AUTH_ERROR', 401, details)
    this.name = 'RabetAuthenticationError'
  }
}

export class RabetAuthorizationError extends RabetError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'AUTHORIZATION_ERROR', 403, details)
    this.name = 'RabetAuthorizationError'
  }
}

export class RabetRateLimitError extends RabetError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429)
    this.name = 'RabetRateLimitError'
  }
}

export class RabetServiceError extends RabetError {
  constructor(message: string, statusCode: number, details?: Record<string, any>) {
    super(message, 'SERVICE_ERROR', statusCode, details)
    this.name = 'RabetServiceError'
  }
}

export class RabetNetworkError extends RabetError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'NETWORK_ERROR')
    this.name = 'RabetNetworkError'
  }
}



