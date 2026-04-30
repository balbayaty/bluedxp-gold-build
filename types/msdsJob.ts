import type { ExtractedMSDSData } from './chemical'

export type MSDSJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
export type MSDSJobItemStatus = 'queued' | 'running' | 'completed' | 'failed'

export interface MSDSJobItemResult {
  extractedData?: ExtractedMSDSData
  confidence?: number
  issues?: Array<{ code: string; message: string; severity: 'info' | 'warning' | 'error'; field?: string }>
  msdsId?: string
}

export interface MSDSJobItem {
  id: string
  filename: string
  mimeType?: string
  size?: number
  status: MSDSJobItemStatus
  progress: number // 0-100
  error?: string
  result?: MSDSJobItemResult
}

export interface MSDSJob {
  id: string
  tenantId: string
  createdBy: string
  createdAt: string
  updatedAt: string
  status: MSDSJobStatus
  progress: number // 0-100
  items: MSDSJobItem[]
  summary?: {
    total: number
    completed: number
    failed: number
  }
  error?: string
}


