/**
 * QR Code Types - World's Most Intelligent QR Code System
 * Comprehensive type definitions for enterprise QR code management
 * 4IR & 5IR Aligned • Integration-First • Future-Proof
 */

export interface QRCodeData {
  type: 'document' | 'container' | 'chemical' | 'location' | 'custom' | 'work-order' | 'incident' | 'damage' | 'task' | 'shipment' | 'certificate' | 'permit' | 'asset' | 'equipment' | 'inventory' | 'sku' | 'ncr' | 'capa' | 'inspection' | 'trade-compliance' | 'customs' | 'proposal' | 'goods-receipt' | 'goods-issue' | 'sales-order' | 'purchase-order' | 'invoice'
  id: string
  documentId?: string
  containerId?: string
  chemicalId?: string
  documentType?: 'msds' | 'certificate' | 'permit' | 'label' | 'report' | 'other'
  url: string
  dynamic?: boolean
  expiresAt?: string
  accessLevel?: 'public' | 'internal' | 'restricted' | 'password-protected'
  timestamp: string
  metadata?: Record<string, any>
  // Enhanced features
  templateId?: string
  branding?: QRBranding
  password?: string // For password-protected QR codes
  ipWhitelist?: string[] // IP whitelisting
  deviceFingerprint?: string // Device fingerprinting
}

export interface QRCodeScanResult {
  qrData: QRCodeData
  document?: any
  container?: any
  chemical?: any
  redirectUrl: string
  requiresAuth: boolean
  requiresPassword?: boolean
  requiresIPCheck?: boolean
  requiresDeviceCheck?: boolean
}

/**
 * QR Code Template - Pre-configured QR code presets
 */
export interface QRTemplate {
  id: string
  name: string
  description?: string
  category: 'document' | 'inventory' | 'asset' | 'compliance' | 'logistics' | 'custom'
  industry?: string // Industry-specific templates
  config: {
    documentType?: string
    dynamic?: boolean
    analytics?: boolean
    branding?: QRBranding
    routing?: {
      geo?: boolean
      time?: boolean
      device?: boolean
    }
    security?: {
      passwordProtected?: boolean
      ipWhitelist?: boolean
      deviceFingerprint?: boolean
    }
  }
  metadata?: Record<string, any>
  createdBy: string
  createdAt: Date
  updatedAt: Date
  isPublic: boolean // Can be shared/used by others
  usageCount: number
}

/**
 * QR Code Branding - White-label customization
 */
export interface QRBranding {
  logo?: {
    url: string
    size?: number
    position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    opacity?: number
  }
  colors?: {
    foreground?: string // QR code color
    background?: string // Background color
    errorCorrection?: 'L' | 'M' | 'Q' | 'H' // Error correction level
  }
  frame?: {
    enabled: boolean
    color?: string
    width?: number
    style?: 'solid' | 'dashed' | 'dotted'
  }
  pattern?: {
    style?: 'square' | 'rounded' | 'dots' | 'custom'
    customPattern?: string
  }
  text?: {
    enabled: boolean
    content?: string
    position?: 'top' | 'bottom' | 'left' | 'right'
    fontSize?: number
    fontFamily?: string
    color?: string
  }
  customDomain?: string // White-label domain
}

/**
 * Bulk QR Code Operation
 */
export interface BulkQROperation {
  id: string
  type: 'generate' | 'update' | 'delete' | 'export'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  items: Array<{
    id: string
    data: any
    status?: 'success' | 'failed' | 'pending'
    error?: string
  }>
  totalItems: number
  processedItems: number
  failedItems: number
  startedAt?: Date
  completedAt?: Date
  createdBy: string
  metadata?: Record<string, any>
}

/**
 * QR Code Scanner Configuration
 */
export interface QRScannerConfig {
  continuous?: boolean // Continuous scanning
  formats?: string[] // Supported formats (qr_code, barcode, etc.)
  showTorch?: boolean // Show torch/flashlight option
  showZoom?: boolean // Show zoom controls
  showHistory?: boolean // Show scan history
  offlineMode?: boolean // Offline scanning capability
  batchMode?: boolean // Batch scanning
  soundEnabled?: boolean // Sound on successful scan
  vibrationEnabled?: boolean // Vibration on successful scan
}

/**
 * QR Code Webhook Event
 */
export interface QRWebhookEvent {
  event: 'scan' | 'generated' | 'updated' | 'deleted' | 'expired' | 'security_alert'
  qrId: string
  timestamp: Date
  data: Record<string, any>
  metadata?: Record<string, any>
}

/**
 * Multi-User Collaboration
 */
export interface QRWorkspace {
  id: string
  name: string
  description?: string
  members: Array<{
    userId: string
    role: 'viewer' | 'editor' | 'admin'
    joinedAt: Date
  }>
  qrCodes: string[] // QR code IDs
  sharedTemplates: string[] // Template IDs
  createdAt: Date
  createdBy: string
}

/**
 * API Rate Limit Configuration
 */
export interface QRRateLimit {
  apiKey: string
  limits: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
    requestsPerMonth: number
  }
  currentUsage: {
    requestsThisMinute: number
    requestsThisHour: number
    requestsThisDay: number
    requestsThisMonth: number
  }
  resetAt: {
    minute: Date
    hour: Date
    day: Date
    month: Date
  }
}











