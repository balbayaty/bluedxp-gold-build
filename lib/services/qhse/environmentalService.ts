/**
 * QHSE Environmental Metrics Service
 * Environmental monitoring, tracking, and ESG reporting
 * Integrated with BlueDXP platform ecosystem
 */

import { eventBus } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type {
  EnvironmentalMetric,
  QHSEEnvironmentalService,
  EnvironmentalMetricFilters,
  EnvironmentalTrend,
} from "@/types/qhse";

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

class EnvironmentalStore {
  private metrics: Map<string, EnvironmentalMetric> = new Map();

  getMetric(id: string): EnvironmentalMetric | undefined {
    return this.metrics.get(id);
  }

  setMetric(metric: EnvironmentalMetric): void {
    this.metrics.set(metric.id, metric);
  }

  getAllMetrics(): EnvironmentalMetric[] {
    return Array.from(this.metrics.values());
  }
}

const store = new EnvironmentalStore();

// ============================================================================
// ENVIRONMENTAL SERVICE IMPLEMENTATION
// ============================================================================

class QHSEEnvironmentalServiceImpl implements QHSEEnvironmentalService {
  async recordMetric(
    data: Omit<EnvironmentalMetric, "id" | "createdAt" | "updatedAt">,
  ): Promise<EnvironmentalMetric> {
    try {
      const metric: EnvironmentalMetric = {
        ...data,
        id: `env-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Calculate trend if previous value exists
      if (metric.previousValue !== undefined) {
        const change = metric.value - metric.previousValue;
        metric.changePercentage =
          metric.previousValue !== 0
            ? Math.round((change / metric.previousValue) * 100 * 100) / 100
            : 0;
        metric.trend =
          change > 0 ? "INCREASING" : change < 0 ? "DECREASING" : "STABLE";
      }

      store.setMetric(metric);

      await knowledgeBaseService.store({
        entity: "qhse-environmental-metric",
        id: metric.id,
        content: `Environmental Metric: ${metric.metricType}\n\nValue: ${metric.value} ${metric.unit}\nPeriod: ${metric.periodStart} to ${metric.periodEnd}`,
        metadata: {
          metricType: metric.metricType,
          period: metric.period,
          tenantId: metric.tenantId,
        },
      });

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "qhse.environmental.metric.recorded",
        aggregateId: metric.id,
        aggregateType: "QHSE_ENVIRONMENTAL_METRIC",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: metric,
      });

      return metric;
    } catch (error) {
      console.error("Error recording environmental metric:", error);
      throw new Error(
        `Failed to record metric: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async getMetric(id: string): Promise<EnvironmentalMetric | null> {
    return store.getMetric(id) || null;
  }

  async getMetrics(
    filters?: EnvironmentalMetricFilters,
  ): Promise<EnvironmentalMetric[]> {
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
      if (filters.metricType)
        metrics = metrics.filter((m) => m.metricType === filters.metricType);
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

  async updateMetric(
    id: string,
    data: Partial<EnvironmentalMetric>,
  ): Promise<EnvironmentalMetric> {
    const existing = store.getMetric(id);
    if (!existing) throw new Error(`Environmental metric not found: ${id}`);

    const updated: EnvironmentalMetric = {
      ...existing,
      ...data,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    store.setMetric(updated);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "qhse.environmental.metric.updated",
      aggregateId: updated.id,
      aggregateType: "QHSE_ENVIRONMENTAL_METRIC",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: updated,
    });

    return updated;
  }

  async deleteMetric(id: string): Promise<void> {
    const metric = store.getMetric(id);
    if (!metric) throw new Error(`Environmental metric not found: ${id}`);

    store.metrics.delete(id);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "qhse.environmental.metric.deleted",
      aggregateId: id,
      aggregateType: "QHSE_ENVIRONMENTAL_METRIC",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { id },
    });
  }

  async calculateCarbonFootprint(
    filters: EnvironmentalMetricFilters,
  ): Promise<number> {
    const metrics = await this.getMetrics({
      ...filters,
      metricType: "CARBON_FOOTPRINT",
    });

    return metrics.reduce((sum, m) => sum + m.value, 0);
  }

  async calculateWasteDiversionRate(
    filters: EnvironmentalMetricFilters,
  ): Promise<number> {
    const wasteMetrics = await this.getMetrics({
      ...filters,
      metricType: "WASTE_DIVERSION",
    });

    if (wasteMetrics.length === 0) return 0;

    const totalWaste = wasteMetrics.reduce(
      (sum, m) => sum + (m.breakdown?.total || m.value),
      0,
    );
    const divertedWaste = wasteMetrics.reduce((sum, m) => sum + m.value, 0);

    if (totalWaste === 0) return 0;

    return Math.round((divertedWaste / totalWaste) * 100 * 100) / 100;
  }

  async getEnvironmentalTrends(
    filters: EnvironmentalMetricFilters,
  ): Promise<EnvironmentalTrend[]> {
    const metrics = await this.getMetrics(filters);

    // Group by metric type and period
    const grouped = new Map<string, EnvironmentalMetric[]>();
    metrics.forEach((m) => {
      const key = `${m.metricType}-${m.periodStart}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(m);
    });

    const trends: EnvironmentalTrend[] = [];
    grouped.forEach((metricGroup, key) => {
      const [metricType, period] = key.split("-");
      const avgValue =
        metricGroup.reduce((sum, m) => sum + m.value, 0) / metricGroup.length;
      const previousGroup = Array.from(grouped.values()).find(
        (g) =>
          g[0]?.metricType === metricType &&
          new Date(g[0].periodStart) < new Date(period),
      );
      const previousValue = previousGroup
        ? previousGroup.reduce((sum, m) => sum + m.value, 0) /
          previousGroup.length
        : undefined;

      let trend: "INCREASING" | "DECREASING" | "STABLE" = "STABLE";
      let changePercentage = 0;

      if (previousValue !== undefined) {
        const change = avgValue - previousValue;
        changePercentage =
          previousValue !== 0
            ? Math.round((change / previousValue) * 100 * 100) / 100
            : 0;
        trend =
          change > 0 ? "INCREASING" : change < 0 ? "DECREASING" : "STABLE";
      }

      trends.push({
        metricType: metricType as EnvironmentalMetric["metricType"],
        period,
        value: Math.round(avgValue * 100) / 100,
        trend,
        changePercentage,
      });
    });

    return trends.sort(
      (a, b) => new Date(a.period).getTime() - new Date(b.period).getTime(),
    );
  }
}

export const qhseEnvironmentalService = new QHSEEnvironmentalServiceImpl();
export default qhseEnvironmentalService;
