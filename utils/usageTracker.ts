/**
 * Usage Tracking Utilities
 * Track API calls, agent actions, storage, and compute usage for billing
 */

import { UsageMetric, UsageQuota } from '@/types/userManagement'

/**
 * Create a usage metric
 */
export function createUsageMetric(
  userId: string,
  tenantId: string,
  metricType: UsageMetric['metricType'],
  resource: string,
  quantity: number,
  unit: string,
  unitCost: number,
  currency: string = 'USD',
  metadata?: Record<string, any>
): UsageMetric {
  return {
    id: `metric_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    userId,
    tenantId,
    metricType,
    resource,
    quantity,
    unit,
    unitCost,
    totalCost: quantity * unitCost,
    currency,
    timestamp: new Date(),
    metadata,
  }
}

/**
 * Track API call usage
 */
export function trackAPICall(
  userId: string,
  tenantId: string,
  endpoint: string,
  unitCost: number = 0.001,
  currency: string = 'USD'
): UsageMetric {
  return createUsageMetric(
    userId,
    tenantId,
    'API_CALL',
    endpoint,
    1,
    'calls',
    unitCost,
    currency
  )
}

/**
 * Track agent action usage
 */
export function trackAgentAction(
  userId: string,
  tenantId: string,
  agentId: string,
  actionType: string,
  tokensUsed?: number,
  unitCost: number = 0.01,
  currency: string = 'USD'
): UsageMetric {
  return createUsageMetric(
    userId,
    tenantId,
    'AGENT_ACTION',
    `agent.${agentId}.${actionType}`,
    1,
    'actions',
    unitCost,
    currency,
    { tokensUsed }
  )
}

/**
 * Track token usage
 */
export function trackTokenUsage(
  userId: string,
  tenantId: string,
  resource: string,
  tokens: number,
  unitCost: number = 0.000001, // Cost per token
  currency: string = 'USD'
): UsageMetric {
  return createUsageMetric(
    userId,
    tenantId,
    'TOKEN_USAGE',
    resource,
    tokens,
    'tokens',
    unitCost,
    currency
  )
}

/**
 * Track storage usage
 */
export function trackStorage(
  userId: string,
  tenantId: string,
  resource: string,
  megabytes: number,
  unitCost: number = 0.01, // Cost per MB per month
  currency: string = 'USD'
): UsageMetric {
  return createUsageMetric(
    userId,
    tenantId,
    'STORAGE',
    resource,
    megabytes,
    'MB',
    unitCost,
    currency
  )
}

/**
 * Track data transfer usage
 */
export function trackDataTransfer(
  userId: string,
  tenantId: string,
  resource: string,
  megabytes: number,
  unitCost: number = 0.005, // Cost per MB transferred
  currency: string = 'USD'
): UsageMetric {
  return createUsageMetric(
    userId,
    tenantId,
    'DATA_TRANSFER',
    resource,
    megabytes,
    'MB',
    unitCost,
    currency
  )
}

/**
 * Create or update usage quota
 */
export function createUsageQuota(
  userId: string,
  tenantId: string,
  quotaType: UsageQuota['quotaType'],
  limit: number,
  unit: string,
  period: UsageQuota['period'] = 'MONTHLY',
  allowOverage: boolean = false,
  overageRate?: number
): UsageQuota {
  const now = new Date()
  let periodStart: Date
  let periodEnd: Date

  switch (period) {
    case 'HOURLY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
      periodEnd = new Date(periodStart.getTime() + 60 * 60 * 1000)
      break
    case 'DAILY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000)
      break
    case 'MONTHLY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      break
    case 'YEARLY':
      periodStart = new Date(now.getFullYear(), 0, 1)
      periodEnd = new Date(now.getFullYear() + 1, 0, 1)
      break
  }

  return {
    id: `quota_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    userId,
    tenantId,
    quotaType,
    limit,
    used: 0,
    unit,
    period,
    periodStart,
    periodEnd,
    allowOverage,
    overageRate,
    status: 'ACTIVE',
    updatedAt: new Date(),
  }
}

/**
 * Check if quota is exceeded
 */
export function isQuotaExceeded(quota: UsageQuota): boolean {
  return quota.used >= quota.limit && !quota.allowOverage
}

/**
 * Update quota usage
 */
export function updateQuotaUsage(quota: UsageQuota, amount: number): UsageQuota {
  const newUsed = quota.used + amount
  const exceeded = newUsed >= quota.limit

  return {
    ...quota,
    used: newUsed,
    status: exceeded && !quota.allowOverage ? 'EXCEEDED' : 'ACTIVE',
    updatedAt: new Date(),
  }
}

/**
 * Calculate total cost from metrics
 */
export function calculateTotalCost(metrics: UsageMetric[]): number {
  return metrics.reduce((total, metric) => total + metric.totalCost, 0)
}

/**
 * Calculate cost for current period
 */
export function calculateCurrentPeriodCost(
  metrics: UsageMetric[],
  periodStart: Date,
  periodEnd: Date
): number {
  const periodMetrics = metrics.filter(
    metric => {
      const timestamp = new Date(metric.timestamp)
      return timestamp >= periodStart && timestamp <= periodEnd
    }
  )
  return calculateTotalCost(periodMetrics)
}

