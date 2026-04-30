/**
 * ASN Utility Functions
 * Helper functions for ASN operations
 */

import type {
  ASN,
  ASNStatus,
  ASNPriority,
  ExceptionType,
  ExceptionSeverity,
} from '@/types/asn'

/**
 * Get status color for UI
 */
export function getStatusColor(status: ASNStatus): string {
  const colors: Record<ASNStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_transit: 'bg-blue-100 text-blue-800',
    arrived: 'bg-purple-100 text-purple-800',
    receiving: 'bg-indigo-100 text-indigo-800',
    received: 'bg-green-100 text-green-800',
    exception: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Get priority color for UI
 */
export function getPriorityColor(priority: ASNPriority): string {
  const colors: Record<ASNPriority, string> = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }
  return colors[priority] || 'bg-gray-100 text-gray-800'
}

/**
 * Get exception severity color
 */
export function getExceptionSeverityColor(severity: ExceptionSeverity): string {
  const colors: Record<ExceptionSeverity, string> = {
    low: 'bg-yellow-100 text-yellow-800',
    medium: 'bg-orange-100 text-orange-800',
    high: 'bg-red-100 text-red-800',
    critical: 'bg-red-200 text-red-900',
  }
  return colors[severity] || 'bg-gray-100 text-gray-800'
}

/**
 * Format ASN status for display
 */
export function formatStatus(status: ASNStatus): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format exception type for display
 */
export function formatExceptionType(type: ExceptionType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Calculate ASN progress percentage
 */
export function calculateProgress(asn: ASN): number {
  if (asn.status === 'completed') return 100
  if (asn.status === 'received') return 90
  if (asn.status === 'receiving') return 70
  if (asn.status === 'arrived') return 50
  if (asn.status === 'in_transit') return 30
  if (asn.status === 'pending') return 10
  return 0
}

/**
 * Check if ASN is overdue
 */
export function isOverdue(asn: ASN): boolean {
  if (!asn.expectedArrivalDate) return false
  if (asn.status === 'completed' || asn.status === 'received') return false
  
  const expected = new Date(asn.expectedArrivalDate)
  const now = new Date()
  return now > expected
}

/**
 * Get days until/since arrival
 */
export function getDaysUntilArrival(asn: ASN): number {
  if (!asn.expectedArrivalDate) return 0
  
  const expected = new Date(asn.expectedArrivalDate)
  const now = new Date()
  const diff = expected.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'SAR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get status icon name (for RemixIcon)
 */
export function getStatusIcon(status: ASNStatus): string {
  const icons: Record<ASNStatus, string> = {
    pending: 'ri-time-line',
    in_transit: 'ri-truck-line',
    arrived: 'ri-inbox-line',
    receiving: 'ri-download-line',
    received: 'ri-checkbox-circle-line',
    exception: 'ri-alert-line',
    cancelled: 'ri-close-circle-line',
    completed: 'ri-check-double-line',
  }
  return icons[status] || 'ri-file-list-3-line'
}

/**
 * Validate ASN data
 */
export function validateASN(asn: Partial<ASN>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!asn.supplierId) {
    errors.push('Supplier ID is required')
  }

  if (!asn.warehouseId) {
    errors.push('Warehouse ID is required')
  }

  if (!asn.expectedArrivalDate) {
    errors.push('Expected arrival date is required')
  }

  if (asn.items && asn.items.length === 0) {
    errors.push('At least one item is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Calculate total received quantity
 */
export function calculateTotalReceived(asn: ASN): number {
  return asn.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0)
}

/**
 * Check if ASN is fully received
 */
export function isFullyReceived(asn: ASN): boolean {
  return asn.items.every((item) => (item.receivedQuantity || 0) >= item.quantity)
}

/**
 * Get exception count by type
 */
export function getExceptionCountByType(asn: ASN): Record<ExceptionType, number> {
  const counts: Record<string, number> = {}
  
  for (const exception of asn.exceptions) {
    counts[exception.type] = (counts[exception.type] || 0) + 1
  }
  
  return counts as Record<ExceptionType, number>
}

/**
 * Get critical exceptions
 */
export function getCriticalExceptions(asn: ASN) {
  return asn.exceptions.filter(
    (exc) => exc.severity === 'critical' || exc.severity === 'high'
  )
}

/**
 * Generate ASN summary text
 */
export function generateASNSummary(asn: ASN): string {
  const parts: string[] = []
  
  parts.push(`ASN ${asn.asnNumber}`)
  parts.push(`from ${asn.supplierName}`)
  parts.push(`to ${asn.warehouseName || asn.warehouseId}`)
  
  if (asn.expectedArrivalDate) {
    const days = getDaysUntilArrival(asn)
    if (days > 0) {
      parts.push(`arriving in ${days} day${days > 1 ? 's' : ''}`)
    } else if (days < 0) {
      parts.push(`${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''} overdue`)
    } else {
      parts.push('arriving today')
    }
  }
  
  if (asn.exceptions.length > 0) {
    parts.push(`with ${asn.exceptions.length} exception${asn.exceptions.length > 1 ? 's' : ''}`)
  }
  
  return parts.join(', ')
}


