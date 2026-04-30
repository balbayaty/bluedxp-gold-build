/**
 * Daleeli API Billing & Usage Tracking Service
 *
 * Tracks every API call to Daleeli (ELM Rabet) for:
 * - Monthly billing reconciliation
 * - Usage analytics per shipment
 * - Cost tracking and optimization
 *
 * @module gcc-compliance/daleeliBillingService
 */

import type {
  DaleeliApiCall,
  DaleeliMonthlyReconciliation,
} from '@/types/gcc-compliance';
import { v4 as uuidv4 } from 'uuid';
import { eventBus, createEvent } from '@/lib/services/event-store';

// ============================================================================
// IN-MEMORY STORAGE (Replace with Prisma in production)
// ============================================================================

// In production, this would be stored in the database
const apiCallsStore: Map<string, DaleeliApiCall[]> = new Map();

// ============================================================================
// DALEELI BILLING SERVICE
// ============================================================================

export class DaleeliBillingService {
  private creditCosts: Record<DaleeliApiCall['endpoint'], number> = {
    LOCATION_BY_SEQUENCE: 1,
    LOCATION_BY_PLATE: 1,
    VEHICLE_STATUS: 0.5,
    TRIP_HISTORY: 2,
  };

  /**
   * Log an API call for billing tracking
   */
  async logApiCall(
    call: Omit<DaleeliApiCall, 'id' | 'creditCost' | 'billable'>
  ): Promise<DaleeliApiCall> {
    const apiCall: DaleeliApiCall = {
      id: uuidv4(),
      ...call,
      billable: call.success, // Only bill successful calls
      creditCost: call.success ? this.creditCosts[call.endpoint] * call.dataPointsReturned : 0,
    };

    // Store the call
    const tenantCalls = apiCallsStore.get(call.tenantId) || [];
    tenantCalls.push(apiCall);
    apiCallsStore.set(call.tenantId, tenantCalls);

    // Emit event for real-time tracking (non-blocking)
    try {
      await eventBus.publish(
        createEvent('daleel.api.call.logged', {
          apiCall,
          tenantId: call.tenantId,
        })
      );
    } catch (error) {
      // Log but don't fail on event publishing errors
      console.warn('[DaleeliBilling] Event publish failed:', error);
    }

    return apiCall;
  }

  /**
   * Get all API calls for a shipment
   */
  async getShipmentUsage(shipmentId: string): Promise<DaleeliApiCall[]> {
    const allCalls: DaleeliApiCall[] = [];

    for (const calls of apiCallsStore.values()) {
      allCalls.push(...calls.filter((c) => c.shipmentId === shipmentId));
    }

    return allCalls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get monthly reconciliation report
   */
  async getMonthlyReconciliation(
    tenantId: string,
    year: number,
    month: number
  ): Promise<DaleeliMonthlyReconciliation> {
    const calls = apiCallsStore.get(tenantId) || [];

    // Filter calls for the specified month
    const monthCalls = calls.filter((c) => {
      const date = new Date(c.timestamp);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });

    // Calculate totals
    const totalCalls = monthCalls.length;
    const successfulCalls = monthCalls.filter((c) => c.success).length;
    const failedCalls = monthCalls.filter((c) => !c.success).length;
    const totalDataPoints = monthCalls.reduce((sum, c) => sum + c.dataPointsReturned, 0);
    const totalCreditsUsed = monthCalls.reduce((sum, c) => sum + c.creditCost, 0);

    // Group by shipment
    const byShipmentMap = new Map<string, { calls: number; dataPoints: number; credits: number }>();
    for (const call of monthCalls) {
      if (call.shipmentId) {
        const existing = byShipmentMap.get(call.shipmentId) || { calls: 0, dataPoints: 0, credits: 0 };
        existing.calls++;
        existing.dataPoints += call.dataPointsReturned;
        existing.credits += call.creditCost;
        byShipmentMap.set(call.shipmentId, existing);
      }
    }

    const byShipment = Array.from(byShipmentMap.entries()).map(([shipmentId, data]) => ({
      shipmentId,
      bayanNumber: monthCalls.find((c) => c.shipmentId === shipmentId)?.bayanNumber || '',
      ...data,
    }));

    // Group by day
    const byDayMap = new Map<string, { calls: number; credits: number }>();
    for (const call of monthCalls) {
      const dateStr = new Date(call.timestamp).toISOString().split('T')[0];
      const existing = byDayMap.get(dateStr) || { calls: 0, credits: 0 };
      existing.calls++;
      existing.credits += call.creditCost;
      byDayMap.set(dateStr, existing);
    }

    const byDay = Array.from(byDayMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by endpoint
    const byEndpointMap = new Map<DaleeliApiCall['endpoint'], { calls: number; credits: number }>();
    for (const call of monthCalls) {
      const existing = byEndpointMap.get(call.endpoint) || { calls: 0, credits: 0 };
      existing.calls++;
      existing.credits += call.creditCost;
      byEndpointMap.set(call.endpoint, existing);
    }

    const byEndpoint = Array.from(byEndpointMap.entries()).map(([endpoint, data]) => ({
      endpoint,
      ...data,
    }));

    // Estimate cost (example: 0.10 SAR per credit)
    const estimatedCost = totalCreditsUsed * 0.1;

    return {
      tenantId,
      period: { year, month },
      totalCalls,
      successfulCalls,
      failedCalls,
      totalDataPoints,
      totalCreditsUsed,
      estimatedCost,
      currency: 'SAR',
      byShipment,
      byDay,
      byEndpoint,
    };
  }

  /**
   * Get usage summary for a date range
   */
  async getUsageSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCalls: number;
    totalCredits: number;
    totalDataPoints: number;
    averageCallsPerDay: number;
    topShipments: Array<{ shipmentId: string; calls: number; credits: number }>;
  }> {
    const calls = apiCallsStore.get(tenantId) || [];

    const rangeCalls = calls.filter((c) => {
      const date = new Date(c.timestamp);
      return date >= startDate && date <= endDate;
    });

    const totalCalls = rangeCalls.length;
    const totalCredits = rangeCalls.reduce((sum, c) => sum + c.creditCost, 0);
    const totalDataPoints = rangeCalls.reduce((sum, c) => sum + c.dataPointsReturned, 0);

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const averageCallsPerDay = days > 0 ? totalCalls / days : 0;

    // Top shipments by calls
    const shipmentMap = new Map<string, { calls: number; credits: number }>();
    for (const call of rangeCalls) {
      if (call.shipmentId) {
        const existing = shipmentMap.get(call.shipmentId) || { calls: 0, credits: 0 };
        existing.calls++;
        existing.credits += call.creditCost;
        shipmentMap.set(call.shipmentId, existing);
      }
    }

    const topShipments = Array.from(shipmentMap.entries())
      .map(([shipmentId, data]) => ({ shipmentId, ...data }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10);

    return {
      totalCalls,
      totalCredits,
      totalDataPoints,
      averageCallsPerDay: Math.round(averageCallsPerDay * 10) / 10,
      topShipments,
    };
  }

  /**
   * Get real-time usage for current billing period
   */
  async getCurrentPeriodUsage(tenantId: string): Promise<{
    currentMonth: DaleeliMonthlyReconciliation;
    previousMonth: DaleeliMonthlyReconciliation;
    trend: {
      callsChange: number;
      creditsChange: number;
      direction: 'UP' | 'DOWN' | 'STABLE';
    };
  }> {
    const now = new Date();
    const currentMonth = await this.getMonthlyReconciliation(
      tenantId,
      now.getFullYear(),
      now.getMonth() + 1
    );

    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = await this.getMonthlyReconciliation(
      tenantId,
      prevDate.getFullYear(),
      prevDate.getMonth() + 1
    );

    const callsChange =
      previousMonth.totalCalls > 0
        ? ((currentMonth.totalCalls - previousMonth.totalCalls) / previousMonth.totalCalls) * 100
        : 0;

    const creditsChange =
      previousMonth.totalCreditsUsed > 0
        ? ((currentMonth.totalCreditsUsed - previousMonth.totalCreditsUsed) /
            previousMonth.totalCreditsUsed) *
          100
        : 0;

    const direction =
      callsChange > 5 ? 'UP' : callsChange < -5 ? 'DOWN' : 'STABLE';

    return {
      currentMonth,
      previousMonth,
      trend: {
        callsChange: Math.round(callsChange * 10) / 10,
        creditsChange: Math.round(creditsChange * 10) / 10,
        direction,
      },
    };
  }

  /**
   * Export billing data for reconciliation
   */
  async exportBillingData(
    tenantId: string,
    year: number,
    month: number
  ): Promise<{
    csv: string;
    json: object;
    summary: DaleeliMonthlyReconciliation;
  }> {
    const summary = await this.getMonthlyReconciliation(tenantId, year, month);
    const calls = apiCallsStore.get(tenantId) || [];

    const monthCalls = calls.filter((c) => {
      const date = new Date(c.timestamp);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });

    // Generate CSV
    const csvHeaders = [
      'ID',
      'Timestamp',
      'Endpoint',
      'Shipment ID',
      'Bayan Number',
      'Success',
      'Response Time (ms)',
      'Data Points',
      'Credits',
    ];

    const csvRows = monthCalls.map((c) =>
      [
        c.id,
        new Date(c.timestamp).toISOString(),
        c.endpoint,
        c.shipmentId || '',
        c.bayanNumber || '',
        c.success ? 'Yes' : 'No',
        c.responseTime,
        c.dataPointsReturned,
        c.creditCost,
      ].join(',')
    );

    const csv = [csvHeaders.join(','), ...csvRows].join('\n');

    return {
      csv,
      json: { calls: monthCalls, summary },
      summary,
    };
  }

  /**
   * Set alert threshold for billing
   */
  async setAlertThreshold(
    tenantId: string,
    threshold: {
      maxCreditsPerMonth: number;
      maxCallsPerDay: number;
      alertEmail: string;
    }
  ): Promise<void> {
    // In production, store this in the database
    // For now, emit an event
    await eventBus.publish(
      createEvent('daleel.billing.threshold.set', {
        tenantId,
        threshold,
      })
    );
  }

  /**
   * Check if usage is approaching threshold
   */
  async checkThreshold(
    tenantId: string,
    threshold: { maxCreditsPerMonth: number; maxCallsPerDay: number }
  ): Promise<{
    withinLimits: boolean;
    currentCredits: number;
    currentDailyCalls: number;
    percentageUsed: number;
    warnings: string[];
  }> {
    const now = new Date();
    const currentMonth = await this.getMonthlyReconciliation(
      tenantId,
      now.getFullYear(),
      now.getMonth() + 1
    );

    const todayCalls = currentMonth.byDay.find(
      (d) => d.date === now.toISOString().split('T')[0]
    );

    const currentDailyCalls = todayCalls?.calls || 0;
    const percentageUsed = (currentMonth.totalCreditsUsed / threshold.maxCreditsPerMonth) * 100;

    const warnings: string[] = [];

    if (percentageUsed >= 90) {
      warnings.push('Monthly credit usage at 90% of limit');
    } else if (percentageUsed >= 75) {
      warnings.push('Monthly credit usage at 75% of limit');
    }

    if (currentDailyCalls >= threshold.maxCallsPerDay * 0.9) {
      warnings.push('Daily call limit approaching');
    }

    return {
      withinLimits: percentageUsed < 100 && currentDailyCalls < threshold.maxCallsPerDay,
      currentCredits: currentMonth.totalCreditsUsed,
      currentDailyCalls,
      percentageUsed: Math.round(percentageUsed * 10) / 10,
      warnings,
    };
  }
}

// Export singleton
export const daleeliBillingService = new DaleeliBillingService();
