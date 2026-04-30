/**
 * QR Code Verification Utilities
 * Verify QR codes are working correctly and contain expected data
 */

import { QRCodeData } from '@/types/qr'

export interface QRVerificationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  data?: QRCodeData
  checks: {
    isJSON: boolean
    hasRequiredFields: boolean
    hasValidURL: boolean
    hasMSDSData?: boolean
    isDynamic?: boolean
  }
}

/**
 * Verify QR code data structure
 */
export function verifyQRCode(qrCodeString: string): QRVerificationResult {
  const result: QRVerificationResult = {
    valid: true,
    errors: [],
    warnings: [],
    checks: {
      isJSON: false,
      hasRequiredFields: false,
      hasValidURL: false
    }
  }

  try {
    // Check if it's valid JSON
    const data = JSON.parse(qrCodeString) as QRCodeData
    result.data = data
    result.checks.isJSON = true

    // Check required fields
    const requiredFields = ['type', 'id', 'url', 'timestamp']
    const missingFields = requiredFields.filter(field => !(field in data))
    
    if (missingFields.length === 0) {
      result.checks.hasRequiredFields = true
    } else {
      result.valid = false
      result.errors.push(`Missing required fields: ${missingFields.join(', ')}`)
    }

    // Check URL validity
    try {
      new URL(data.url)
      result.checks.hasValidURL = true
    } catch {
      // Check if it's a relative URL
      if (data.url.startsWith('/')) {
        result.checks.hasValidURL = true
      } else {
        result.valid = false
        result.errors.push('Invalid URL format')
      }
    }

    // Check for MSDS data if document type is MSDS
    if (data.documentType === 'msds') {
      if (data.metadata?.msdsData) {
        result.checks.hasMSDSData = true
      } else {
        result.warnings.push('MSDS QR code does not include MSDS data')
      }
    }

    // Check if dynamic
    if (data.dynamic !== undefined) {
      result.checks.isDynamic = data.dynamic
    }

    // Additional validations
    if (data.documentType && !['msds', 'certificate', 'permit', 'label', 'report', 'other'].includes(data.documentType)) {
      result.warnings.push(`Unknown document type: ${data.documentType}`)
    }

    if (data.expiresAt) {
      const expires = new Date(data.expiresAt)
      if (expires < new Date()) {
        result.warnings.push('QR code has expired')
      }
    }

  } catch (error) {
    result.valid = false
    result.errors.push('Invalid JSON format')
  }

  return result
}

/**
 * Verify QR code can be scanned and contains MSDS data
 */
export async function verifyMSDSQR(msdsId: string): Promise<QRVerificationResult & { qrId?: string }> {
  try {
    // Generate QR code
    const response = await fetch('/api/qr/msds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msdsId,
        options: {
          includeFullData: true,
          analytics: true
        }
      })
    })

    const result = await response.json()

    if (!result.success) {
      return {
        valid: false,
        errors: [result.error || 'Failed to generate QR code'],
        warnings: [],
        checks: {
          isJSON: false,
          hasRequiredFields: false,
          hasValidURL: false
        }
      }
    }

    // Verify QR code structure
    const verification = verifyQRCode(result.qrCode)

    return {
      ...verification,
      qrId: result.qrId
    }
  } catch (error: any) {
    return {
      valid: false,
      errors: [error.message || 'Error verifying QR code'],
      warnings: [],
      checks: {
        isJSON: false,
        hasRequiredFields: false,
        hasValidURL: false
      }
    }
  }
}

/**
 * Test QR code scan tracking
 */
export async function testQRScanTracking(qrId: string): Promise<{
  success: boolean
  tracked: boolean
  location?: any
  error?: string
}> {
  try {
    const response = await fetch('/api/qr/scan/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrId })
    })

    const result = await response.json()

    return {
      success: result.success,
      tracked: result.tracked,
      location: result.location,
      error: result.error
    }
  } catch (error: any) {
    return {
      success: false,
      tracked: false,
      error: error.message
    }
  }
}







