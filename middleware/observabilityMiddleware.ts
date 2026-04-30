/**
 * Observability Middleware
 * 
 * Tracks performance metrics and sends to APM
 */

// Dynamic imports for types/interfaces if needed
import { NextRequest, NextResponse } from 'next/server'

export async function observabilityMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  // Dynamic imports to avoid circular dependencies
  const { apmService } = await import('@/lib/services/observability/apmService')
  const { alertingService } = await import('@/lib/services/observability/alertingService')

  const endpoint = new URL(request.url).pathname
  const requestId = request.headers.get('x-request-id') || `req-${Date.now()}`

  // Get response time from header if available, otherwise calculate
  const responseTimeHeader = response.headers.get('x-response-time')
  const responseTime = responseTimeHeader
    ? parseInt(responseTimeHeader.replace('ms', ''))
    : 0

  // Track request metrics
  if (apmService) {
    apmService.trackRequest(endpoint, responseTime, 0)

    // Check performance budget
    const budgetResult = await apmService.checkPerformanceBudget(endpoint)
    if (!budgetResult.withinBudget) {
      // Create alert for budget violation
      if (alertingService) {
        const alert = {
          id: `budget-${endpoint}-${Date.now()}`,
          severity: budgetResult.violations.some((v: any) => v.severity === 'high') ? 'high' : 'medium' as const,
          title: `Performance Budget Violation: ${endpoint}`,
          message: `Endpoint ${endpoint} exceeded performance budget`,
          source: 'apm',
          metric: endpoint,
          timestamp: new Date(),
          metadata: {
            violations: budgetResult.violations,
          },
        }
        await alertingService.sendAlert(alert)
      }
    }
  }

  // Detect anomalies in response time
  if (alertingService) {
    const anomalyResult = await alertingService.detectAnomalies(
      `response_time:${endpoint}`,
      responseTime
    )

    if (anomalyResult.detected && anomalyResult.severity !== 'low') {
      // Create alert for anomaly
      const alert = {
        id: `anomaly-${endpoint}-${Date.now()}`,
        severity: anomalyResult.severity,
        title: `Performance Anomaly Detected: ${endpoint}`,
        message: `Response time anomaly: ${anomalyResult.actualValue}ms (expected: ${anomalyResult.expectedValue}ms)`,
        source: 'apm',
        metric: `response_time:${endpoint}`,
        value: anomalyResult.actualValue,
        threshold: anomalyResult.expectedValue,
        timestamp: new Date(),
        metadata: {
          anomalyType: anomalyResult.anomalyType,
          deviation: anomalyResult.deviation,
          recommendations: anomalyResult.recommendations,
        },
      }
      await alertingService.sendAlert(alert)
    }
  }

  // Add performance headers
  response.headers.set('X-Response-Time', `${responseTime}ms`)
  response.headers.set('X-Request-ID', requestId)

  return response
}

