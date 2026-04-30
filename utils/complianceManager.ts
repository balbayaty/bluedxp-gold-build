/**
 * Compliance Management Utilities
 * GDPR, CCPA, and global compliance features
 */

import { DataPrivacySettings, ConsentRecord, TermsAcceptance } from '@/types/userManagement'

/**
 * Check if user has GDPR consent
 */
export function hasGDPRConsent(privacy: DataPrivacySettings | undefined): boolean {
  if (!privacy) return false
  return privacy.gdpr?.consentGiven === true
}

/**
 * Check if user has opted out of sale (CCPA)
 */
export function hasCCPAOptOut(privacy: DataPrivacySettings | undefined): boolean {
  if (!privacy) return false
  return privacy.ccpa?.optOutOfSale === true || privacy.ccpa?.doNotSell === true
}

/**
 * Check if data retention period has expired
 */
export function isDataRetentionExpired(privacy: DataPrivacySettings | undefined): boolean {
  if (!privacy?.dataRetention?.deleteAfter) return false
  return new Date(privacy.dataRetention.deleteAfter) < new Date()
}

/**
 * Create GDPR consent record
 */
export function createGDPRConsent(
  userId: string,
  tenantId: string,
  policyId: string,
  policyVersion: string,
  options?: {
    marketingConsent?: boolean
    analyticsConsent?: boolean
    thirdPartyConsent?: boolean
    ipAddress?: string
    userAgent?: string
  }
): ConsentRecord {
  return {
    id: `consent_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    userId,
    tenantId,
    policyId,
    policyVersion,
    consentType: 'EXPLICIT',
    granted: true,
    grantedAt: new Date(),
    method: 'WEB',
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Revoke GDPR consent
 */
export function revokeGDPRConsent(consent: ConsentRecord): ConsentRecord {
  return {
    ...consent,
    granted: false,
    revokedAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Create data privacy settings
 */
export function createDataPrivacySettings(
  userId: string,
  tenantId: string,
  region: string = 'US'
): DataPrivacySettings {
  return {
    userId,
    tenantId,
    gdpr: {
      consentGiven: false,
      consentVersion: '1.0',
      marketingConsent: false,
      analyticsConsent: false,
      thirdPartyConsent: false,
    },
    ccpa: {
      optOutOfSale: false,
      doNotSell: false,
    },
    dataRetention: {
      retentionPeriod: 365, // days
      autoDelete: false,
    },
    dataExport: {
      format: 'JSON',
      includePersonalData: true,
      includeUsageData: true,
      includeAuditLogs: false,
    },
    rightToBeForgotten: {
      requested: false,
      processed: false,
      anonymized: false,
    },
    dataLocalization: {
      region,
      storageRegion: region,
      processingRegion: region,
    },
    updatedAt: new Date(),
  }
}

/**
 * Check if user can export data
 */
export function canExportData(privacy: DataPrivacySettings | undefined): boolean {
  if (!privacy) return false
  // GDPR right to data portability
  return hasGDPRConsent(privacy)
}

/**
 * Check if user can request deletion
 */
export function canRequestDeletion(privacy: DataPrivacySettings | undefined): boolean {
  if (!privacy) return true // Right to be forgotten is always available
  return !privacy.rightToBeForgotten?.processed
}

/**
 * Anonymize user data (for right to be forgotten)
 */
export function anonymizeUserData(user: any): any {
  return {
    ...user,
    email: `deleted_${Date.now()}@anonymized.local`,
    name: 'Deleted User',
    phone: undefined,
    avatar: undefined,
    // Keep ID and timestamps for audit purposes
    anonymized: true,
    anonymizedAt: new Date(),
  }
}

/**
 * Get required disclaimers based on region
 */
export function getRequiredDisclaimers(region: string): string[] {
  const disclaimers: string[] = []
  
  if (region === 'EU' || region.includes('EU')) {
    disclaimers.push('GDPR_DATA_PROCESSING')
    disclaimers.push('GDPR_COOKIE_CONSENT')
  }
  
  if (region === 'US' || region === 'CA') {
    disclaimers.push('CCPA_PRIVACY_RIGHTS')
  }
  
  if (region === 'CA') {
    disclaimers.push('PIPEDA_CONSENT')
  }
  
  if (region === 'BR') {
    disclaimers.push('LGPD_CONSENT')
  }
  
  // Always include general disclaimers
  disclaimers.push('TERMS_OF_SERVICE')
  disclaimers.push('PRIVACY_POLICY')
  
  return disclaimers
}

/**
 * Check if all required disclaimers are accepted
 */
export function areDisclaimersAccepted(
  termsAcceptances: TermsAcceptance[],
  region: string
): boolean {
  const required = getRequiredDisclaimers(region)
  const accepted = termsAcceptances
    .filter(t => t.accepted)
    .map(t => t.termsType)
  
  return required.every(req => accepted.includes(req as any))
}

