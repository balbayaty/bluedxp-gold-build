/**
 * Device Fingerprinting Utility
 * Creates unique device identifiers for session management
 * Privacy-conscious and secure
 */

import crypto from 'crypto'

/**
 * Generate device fingerprint from user agent and other factors
 * This creates a stable identifier for the device
 */
export function generateDeviceFingerprint(userAgent: string, screenResolution?: string, timezone?: string): string {
  const components = [
    userAgent,
    screenResolution || '',
    timezone || '',
    // Add more factors if needed (but be privacy-conscious)
  ].filter(Boolean)
  
  const combined = components.join('|')
  return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32)
}

/**
 * Parse user agent to extract device info
 */
export function parseUserAgent(userAgent: string): {
  deviceType: 'desktop' | 'mobile' | 'tablet'
  os?: string
  browser?: string
} {
  const ua = userAgent.toLowerCase()
  
  // Detect device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop'
  if (/mobile|android|iphone|ipod/.test(ua)) {
    deviceType = 'mobile'
  } else if (/tablet|ipad/.test(ua)) {
    deviceType = 'tablet'
  }
  
  // Detect OS
  let os: string | undefined
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('mac os')) os = 'macOS'
  else if (ua.includes('linux')) os = 'Linux'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'
  
  // Detect browser
  let browser: string | undefined
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari'
  else if (ua.includes('edg')) browser = 'Edge'
  else if (ua.includes('opera')) browser = 'Opera'
  
  return { deviceType, os, browser }
}

/**
 * Get device name from user agent
 */
export function getDeviceName(userAgent: string): string {
  const { deviceType, os, browser } = parseUserAgent(userAgent)
  
  const parts: string[] = []
  if (os) parts.push(os)
  if (browser) parts.push(browser)
  if (deviceType !== 'desktop') parts.push(deviceType)
  
  return parts.length > 0 ? parts.join(' - ') : 'Unknown Device'
}

