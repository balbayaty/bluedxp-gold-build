/**
 * Data Source Tracker
 *
 * Tracks whether data is coming from real sources or demo/placeholder data
 * Provides metadata about data freshness and source reliability
 *
 * 4IR & 5IR Aligned • Integration-First • Deep Architecture
 */

export type DataSource = "real" | "demo" | "fallback" | "partial";
export type DataFreshness = "live" | "recent" | "stale" | "unknown";

export interface DataSourceMetadata {
  source: DataSource;
  freshness: DataFreshness;
  lastUpdated?: Date;
  reliability: number; // 0-100
  notes?: string;
}

export interface MetricDataSource {
  metric: string;
  metadata: DataSourceMetadata;
  dependencies?: string[]; // What services this depends on
}

class DataSourceTracker {
  private dataSources: Map<string, DataSourceMetadata> = new Map();
  private serviceStatus: Map<string, boolean> = new Map();

  /**
   * Register a service status
   */
  registerService(serviceName: string, isConnected: boolean): void {
    this.serviceStatus.set(serviceName, isConnected);
  }

  /**
   * Track a metric's data source
   */
  trackMetric(metricKey: string, metadata: DataSourceMetadata): void {
    this.dataSources.set(metricKey, metadata);
  }

  /**
   * Get metadata for a metric
   */
  getMetadata(metricKey: string): DataSourceMetadata | null {
    return this.dataSources.get(metricKey) || null;
  }

  /**
   * Check if a service is available
   */
  isServiceAvailable(serviceName: string): boolean {
    return this.serviceStatus.get(serviceName) ?? false;
  }

  /**
   * Get overall system data quality score
   */
  getDataQualityScore(): number {
    if (this.dataSources.size === 0) return 0;

    let totalReliability = 0;
    let count = 0;

    for (const metadata of this.dataSources.values()) {
      totalReliability += metadata.reliability;
      count++;
    }

    return count > 0 ? Math.round(totalReliability / count) : 0;
  }

  /**
   * Get summary of data sources
   */
  getDataSourceSummary(): {
    real: number;
    demo: number;
    fallback: number;
    partial: number;
    total: number;
  } {
    const summary = {
      real: 0,
      demo: 0,
      fallback: 0,
      partial: 0,
      total: this.dataSources.size,
    };

    for (const metadata of this.dataSources.values()) {
      summary[metadata.source]++;
    }

    return summary;
  }

  /**
   * Clear all tracked data
   */
  clear(): void {
    this.dataSources.clear();
    this.serviceStatus.clear();
  }
}

export const dataSourceTracker = new DataSourceTracker();

/**
 * Helper to determine data source based on conditions
 */
export function determineDataSource(
  isDemoMode: boolean,
  serviceConnected: boolean,
  hasData: boolean,
): DataSource {
  if (isDemoMode && !serviceConnected) return "demo";
  if (isDemoMode && serviceConnected && hasData) return "partial"; // Mix of real and demo
  if (!serviceConnected) return "fallback";
  if (serviceConnected && hasData) return "real";
  return "fallback";
}

/**
 * Helper to determine data freshness
 */
export function determineFreshness(lastUpdated?: Date): DataFreshness {
  if (!lastUpdated) return "unknown";

  const age = Date.now() - lastUpdated.getTime();
  const oneMinute = 60 * 1000;
  const oneHour = 60 * 60 * 1000;

  if (age < oneMinute) return "live";
  if (age < oneHour) return "recent";
  return "stale";
}

/**
 * Calculate reliability score
 */
export function calculateReliability(
  source: DataSource,
  freshness: DataFreshness,
  serviceConnected: boolean,
): number {
  let score = 0;

  // Source weight (50%)
  switch (source) {
    case "real":
      score += 50;
      break;
    case "partial":
      score += 35;
      break;
    case "fallback":
      score += 20;
      break;
    case "demo":
      score += 10;
      break;
  }

  // Freshness weight (30%)
  switch (freshness) {
    case "live":
      score += 30;
      break;
    case "recent":
      score += 20;
      break;
    case "stale":
      score += 10;
      break;
    case "unknown":
      score += 5;
      break;
  }

  // Service connection weight (20%)
  if (serviceConnected) {
    score += 20;
  }

  return Math.min(100, score);
}
