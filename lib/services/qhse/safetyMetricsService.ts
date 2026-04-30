/**
 * QHSE Safety Metrics Service
 * TRIR, LTIFR calculations and safety performance tracking
 * Integrated with BlueDXP platform ecosystem
 */

import { eventBus } from "@/lib/services/event-store";
import { qhseIncidentService } from "./incidentService";
import type {
  SafetyMetric,
  QHSESafetyMetricsService,
  SafetyMetricFilters,
  SafetyTrend,
  BenchmarkComparison,
} from "@/types/qhse";

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

class SafetyMetricsStore {
  private metrics: Map<string, SafetyMetric> = new Map();

  getMetric(id: string): SafetyMetric | undefined {
    return this.metrics.get(id);
  }

  setMetric(metric: SafetyMetric): void {
    this.metrics.set(metric.id, metric);
  }

  getAllMetrics(): SafetyMetric[] {
    return Array.from(this.metrics.values());
  }
}

const store = new SafetyMetricsStore();

// Industry benchmarks (per 200,000 hours)
const INDUSTRY_BENCHMARKS = {
  TRIR: {
    excellent: 0.5,
    good: 1.0,
    average: 2.0,
    belowAverage: 3.5,
    poor: 5.0,
  },
  LTIFR: {
    excellent: 0.1,
    good: 0.5,
    average: 1.0,
    belowAverage: 2.0,
    poor: 3.0,
  },
};

// ============================================================================
// SAFETY METRICS SERVICE IMPLEMENTATION
// ============================================================================

class QHSESafetyMetricsServiceImpl implements QHSESafetyMetricsService {
  async calculateTRIR(filters: SafetyMetricFilters): Promise<number> {
    return await qhseIncidentService.calculateTRIR(filters);
  }

  async calculateLTIFR(filters: SafetyMetricFilters): Promise<number> {
    return await qhseIncidentService.calculateLTIFR(filters);
  }

  async recordSafetyMetric(
    data: Omit<SafetyMetric, "id" | "createdAt" | "updatedAt">,
  ): Promise<SafetyMetric> {
    try {
      const metric: SafetyMetric = {
        ...data,
        id: `safety-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Calculate TRIR if not provided
      if (!metric.trir) {
        metric.trir = {
          recordableIncidents: metric.trir?.recordableIncidents || 0,
          totalHoursWorked: metric.totalHoursWorked || 200000,
          rate: await this.calculateTRIR({
            tenantId: metric.tenantId,
            customerId: metric.customerId,
            warehouseId: metric.warehouseId,
            facilityId: metric.facilityId,
            periodStart: metric.periodStart,
            periodEnd: metric.periodEnd,
          }),
        };
      }

      // Calculate LTIFR if not provided
      if (!metric.ltifr) {
        metric.ltifr = {
          lostTimeInjuries: metric.ltifr?.lostTimeInjuries || 0,
          totalHoursWorked: metric.totalHoursWorked || 200000,
          rate: await this.calculateLTIFR({
            tenantId: metric.tenantId,
            customerId: metric.customerId,
            warehouseId: metric.warehouseId,
            facilityId: metric.facilityId,
            periodStart: metric.periodStart,
            periodEnd: metric.periodEnd,
          }),
        };
      }

      store.setMetric(metric);

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.safety.metric.recorded",
        aggregateId: metric.id,
        aggregateType: "QHSE_SAFETY_METRIC",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: metric,
      });

      return metric;
    } catch (error) {
      console.error("Error recording safety metric:", error);
      throw new Error(
        `Failed to record safety metric: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getSafetyMetric(id: string): Promise<SafetyMetric | null> {
    return store.getMetric(id) || null;
  }

  async getSafetyMetrics(
    filters?: SafetyMetricFilters,
  ): Promise<SafetyMetric[]> {
    let metrics = store.getAllMetrics();

    if (filters) {
      if (filters.tenantId)
        metrics = metrics.filter((m) => m.tenantId === filters.tenantId);
      if (filters.customerId)
        metrics = metrics.filter((m) => m.customerId === filters.customerId);
      if (filters.warehouseId)
        metrics = metrics.filter((m) => m.warehouseId === filters.warehouseId);
      if (filters.facilityId)
        metrics = metrics.filter((m) => m.facilityId === filters.facilityId);
      if (filters.periodStart) {
        const dateFrom = new Date(filters.periodStart);
        metrics = metrics.filter((m) => new Date(m.periodStart) >= dateFrom);
      }
      if (filters.periodEnd) {
        const dateTo = new Date(filters.periodEnd);
        metrics = metrics.filter((m) => new Date(m.periodEnd) <= dateTo);
      }
    }

    return metrics.sort(
      (a, b) =>
        new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime(),
    );
  }

  async updateSafetyMetric(
    id: string,
    data: Partial<SafetyMetric>,
  ): Promise<SafetyMetric> {
    const existing = store.getMetric(id);
    if (!existing) throw new Error(`Safety metric not found: ${id}`);

    const updated: SafetyMetric = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    store.setMetric(updated);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "qhse.safety.metric.updated",
      aggregateId: updated.id,
      aggregateType: "QHSE_SAFETY_METRIC",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: updated,
    });

    return updated;
  }

  async getSafetyTrends(filters: SafetyMetricFilters): Promise<SafetyTrend[]> {
    const metrics = await this.getSafetyMetrics(filters);

    return metrics
      .map((m) => {
        const previousMetric = metrics.find(
          (pm) =>
            new Date(pm.periodStart) < new Date(m.periodStart) &&
            pm.tenantId === m.tenantId,
        );

        let trend: "IMPROVING" | "DETERIORATING" | "STABLE" = "STABLE";
        if (previousMetric) {
          const currentTRIR = m.trir?.rate || 0;
          const previousTRIR = previousMetric.trir?.rate || 0;
          trend =
            currentTRIR < previousTRIR
              ? "IMPROVING"
              : currentTRIR > previousTRIR
                ? "DETERIORATING"
                : "STABLE";
        }

        return {
          period: m.periodStart,
          trir: m.trir?.rate,
          ltifr: m.ltifr?.rate,
          nearMisses: m.nearMisses,
          safetyObservations: m.safetyObservations,
          trend,
        };
      })
      .sort(
        (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime(),
      );
  }

  async compareToIndustryBenchmark(
    metric: "TRIR" | "LTIFR",
  ): Promise<BenchmarkComparison> {
    const recentMetrics = await this.getSafetyMetrics();
    if (recentMetrics.length === 0) {
      throw new Error("No safety metrics found");
    }

    const latest = recentMetrics[0];
    const ourValue =
      metric === "TRIR" ? latest.trir?.rate || 0 : latest.ltifr?.rate || 0;
    const benchmarks = INDUSTRY_BENCHMARKS[metric];

    // Determine percentile (simplified - in production, use actual industry data)
    let industryPercentile = 50;
    let benchmark: BenchmarkComparison["benchmark"] = "AVERAGE";

    if (ourValue <= benchmarks.excellent) {
      industryPercentile = 90;
      benchmark = "EXCELLENT";
    } else if (ourValue <= benchmarks.good) {
      industryPercentile = 75;
      benchmark = "GOOD";
    } else if (ourValue <= benchmarks.average) {
      industryPercentile = 50;
      benchmark = "AVERAGE";
    } else if (ourValue <= benchmarks.belowAverage) {
      industryPercentile = 25;
      benchmark = "BELOW_AVERAGE";
    } else {
      industryPercentile = 10;
      benchmark = "POOR";
    }

    return {
      metric,
      ourValue: Math.round(ourValue * 100) / 100,
      industryAverage: benchmarks.average,
      industryPercentile,
      benchmark,
    };
  }
}

export const qhseSafetyMetricsService = new QHSESafetyMetricsServiceImpl();
export default qhseSafetyMetricsService;
