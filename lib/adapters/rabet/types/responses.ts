/**
 * Rabet.sa API Response Types
 */

export interface RabetResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: RabetError[]
  metadata?: ResponseMetadata
}

export interface ResponseMetadata {
  requestId: string
  timestamp: Date
  version?: string
  pagination?: PaginationInfo
}

export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface RabetError {
  code: string
  message: string
  field?: string
  details?: Record<string, any>
}



