/**
 * API Key Management Utilities
 * Secure generation, validation, and management of API keys
 */

import { APIKey } from '@/types/userManagement'

// Browser-compatible crypto functions
function getRandomBytes(length: number): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto.getRandomValues(new Uint8Array(length))
  }
  // Fallback for Node.js
  if (typeof require !== 'undefined') {
    const crypto = require('crypto')
    return crypto.randomBytes(length)
  }
  throw new Error('Crypto not available')
}

function sha256(data: string): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // Browser implementation would need async, using simple hash for now
    // In production, use proper Web Crypto API
    return btoa(data).substring(0, 64) // Placeholder
  }
  // Node.js
  if (typeof require !== 'undefined') {
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(data).digest('hex')
  }
  throw new Error('Crypto not available')
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i]
  }
  return result === 0
}

/**
 * Generate a secure API key
 */
export function generateAPIKey(prefix: string = 'sk_live_'): { key: string; hash: string; last4: string } {
  // Generate 32 random bytes (256 bits)
  const randomBytes = getRandomBytes(32)
  const base64 = btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  const key = prefix + base64
  
  // Hash the key (SHA-256)
  const hash = sha256(key)
  
  // Get last 4 characters
  const last4 = key.slice(-4)
  
  return { key, hash, last4 }
}

/**
 * Hash an API key
 */
export function hashAPIKey(key: string): string {
  return sha256(key)
}

/**
 * Verify an API key
 */
export function verifyAPIKey(key: string, hash: string): boolean {
  const keyHash = hashAPIKey(key)
  const keyHashBytes = new TextEncoder().encode(keyHash)
  const hashBytes = new TextEncoder().encode(hash)
  return timingSafeEqual(keyHashBytes, hashBytes)
}

/**
 * Create a new API key object
 */
export function createAPIKey(
  userId: string,
  tenantId: string,
  name: string,
  description?: string,
  options?: {
    permissions?: any[]
    rateLimit?: { requestsPerMinute: number; requestsPerHour: number; requestsPerDay: number }
    quotas?: { apiCallsPerMonth?: number; dataTransferPerMonth?: number; storagePerMonth?: number }
    expiresAt?: Date
    allowedIPs?: string[]
    allowedOrigins?: string[]
  }
): { apiKey: APIKey; plainKey: string } {
  const { key, hash, last4 } = generateAPIKey()
  
  const randomId = Array.from(getRandomBytes(8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  const apiKey: APIKey = {
    id: `key_${Date.now()}_${randomId}`,
    userId,
    tenantId,
    name,
    description,
    keyPrefix: key.substring(0, 8),
    keyHash: hash,
    keyLast4: last4,
    permissions: options?.permissions || [],
    allowedIPs: options?.allowedIPs,
    allowedOrigins: options?.allowedOrigins,
    rateLimit: options?.rateLimit,
    quotas: options?.quotas,
    status: 'ACTIVE',
    expiresAt: options?.expiresAt,
    usageCount: 0,
    createdAt: new Date(),
    createdBy: userId,
  }
  
  return { apiKey, plainKey: key }
}

/**
 * Revoke an API key
 */
export function revokeAPIKey(
  apiKey: APIKey,
  revokedBy: string,
  reason?: string
): APIKey {
  return {
    ...apiKey,
    status: 'REVOKED',
    revokedAt: new Date(),
    revokedBy,
    revokedReason: reason,
  }
}

/**
 * Check if API key is valid
 */
export function isAPIKeyValid(apiKey: APIKey): boolean {
  if (apiKey.status !== 'ACTIVE') return false
  
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return false
  }
  
  return true
}

/**
 * Check rate limit
 */
export function checkRateLimit(
  apiKey: APIKey,
  requestsInMinute: number,
  requestsInHour: number,
  requestsInDay: number
): { allowed: boolean; reason?: string } {
  if (!apiKey.rateLimit) return { allowed: true }
  
  const { requestsPerMinute, requestsPerHour, requestsPerDay } = apiKey.rateLimit
  
  if (requestsPerMinute && requestsInMinute >= requestsPerMinute) {
    return { allowed: false, reason: 'Rate limit exceeded: requests per minute' }
  }
  
  if (requestsPerHour && requestsInHour >= requestsPerHour) {
    return { allowed: false, reason: 'Rate limit exceeded: requests per hour' }
  }
  
  if (requestsPerDay && requestsInDay >= requestsPerDay) {
    return { allowed: false, reason: 'Rate limit exceeded: requests per day' }
  }
  
  return { allowed: true }
}

/**
 * Check quota limits
 */
export function checkQuota(
  apiKey: APIKey,
  currentUsage: {
    apiCalls?: number
    dataTransfer?: number
    storage?: number
  }
): { allowed: boolean; reason?: string } {
  if (!apiKey.quotas) return { allowed: true }
  
  const { apiCallsPerMonth, dataTransferPerMonth, storagePerMonth } = apiKey.quotas
  
  if (apiCallsPerMonth && currentUsage.apiCalls && currentUsage.apiCalls >= apiCallsPerMonth) {
    return { allowed: false, reason: 'Quota exceeded: API calls per month' }
  }
  
  if (dataTransferPerMonth && currentUsage.dataTransfer && currentUsage.dataTransfer >= dataTransferPerMonth) {
    return { allowed: false, reason: 'Quota exceeded: data transfer per month' }
  }
  
  if (storagePerMonth && currentUsage.storage && currentUsage.storage >= storagePerMonth) {
    return { allowed: false, reason: 'Quota exceeded: storage per month' }
  }
  
  return { allowed: true }
}

