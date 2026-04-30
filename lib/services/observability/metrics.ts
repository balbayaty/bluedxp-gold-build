/**
 * Metrics Service
 * Prometheus-compatible metrics collection using prom-client
 * Server-side only - client-side uses in-memory fallback
 */

// Only import prom-client on server-side
let promClient: any = null;
if (typeof window === "undefined") {
  try {
    promClient = require("prom-client");
  } catch (e) {
    // prom-client not available, use in-memory fallback
  }
}

// Type definitions for prom-client (without importing)
type Registry = any;
type Counter = any;
type Gauge = any;
type Histogram = any;
type Summary = any;

export interface Metric {
  name: string;
  type: "counter" | "gauge" | "histogram" | "summary";
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

export interface MetricDefinition {
  name: string;
  type: "counter" | "gauge" | "histogram" | "summary";
  help: string;
  labels?: string[];
}

class MetricsService {
  private registry: Registry | null = null;
  private metrics: Map<string, Counter | Gauge | Histogram | Summary> =
    new Map();
  private definitions: Map<string, MetricDefinition> = new Map();
  private prometheusEnabled: boolean = false;
  private isServer: boolean = typeof window === "undefined";

  constructor() {
    // Only initialize prom-client on server-side
    if (this.isServer && promClient) {
      this.registry = new promClient.Registry();

      // Enable Prometheus if configured
      if (process.env.PROMETHEUS_ENABLED === "true") {
        this.prometheusEnabled = true;
        console.log("✅ Metrics: Prometheus enabled");
      }
    }
  }

  /**
   * Register metric definition
   */
  registerMetric(definition: MetricDefinition): void {
    this.definitions.set(definition.name, definition);

    if (this.prometheusEnabled && promClient && this.registry && !this.metrics.has(definition.name)) {
      let metric: Counter | Gauge | Histogram | Summary;

      switch (definition.type) {
        case "counter":
          metric = new promClient.Counter({
            name: definition.name,
            help: definition.help,
            labelNames: definition.labels || [],
            registers: [this.registry],
          });
          break;
        case "gauge":
          metric = new promClient.Gauge({
            name: definition.name,
            help: definition.help,
            labelNames: definition.labels || [],
            registers: [this.registry],
          });
          break;
        case "histogram":
          metric = new promClient.Histogram({
            name: definition.name,
            help: definition.help,
            labelNames: definition.labels || [],
            registers: [this.registry],
          });
          break;
        case "summary":
          metric = new promClient.Summary({
            name: definition.name,
            help: definition.help,
            labelNames: definition.labels || [],
            registers: [this.registry],
          });
          break;
        default:
          return;
      }

      this.metrics.set(definition.name, metric);
    }
  }

  /**
   * Increment counter
   */
  incrementCounter(
    name: string,
    labels: Record<string, string> = {},
    value: number = 1,
  ): void {
    if (this.prometheusEnabled) {
      const metric = this.metrics.get(name) as Counter | undefined;
      if (metric && metric instanceof Counter) {
        metric.inc(labels, value);
        return;
      }
    }

    // Fallback to in-memory
    this.recordMetric({
      name,
      type: "counter",
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Set gauge value
   */
  setGauge(
    name: string,
    value: number,
    labels: Record<string, string> = {},
  ): void {
    if (this.prometheusEnabled) {
      const metric = this.metrics.get(name) as Gauge | undefined;
      if (metric && metric instanceof Gauge) {
        metric.set(labels, value);
        return;
      }
    }

    // Fallback to in-memory
    this.recordMetric({
      name,
      type: "gauge",
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Record histogram value
   */
  recordHistogram(
    name: string,
    value: number,
    labels: Record<string, string> = {},
  ): void {
    if (this.prometheusEnabled) {
      const metric = this.metrics.get(name) as Histogram | undefined;
      if (metric && metric instanceof Histogram) {
        metric.observe(labels, value);
        return;
      }
    }

    // Fallback to in-memory
    this.recordMetric({
      name,
      type: "histogram",
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Record metric (fallback)
   */
  private recordMetric(metric: Metric): void {
    // In-memory fallback for when Prometheus is not enabled
    // This is kept for backward compatibility
  }

  /**
   * Get metrics
   */
  getMetrics(name?: string, labels?: Record<string, string>): Metric[] {
    if (name) {
      const metrics = this.metrics.get(name) || [];
      if (labels) {
        return metrics.filter((m) => {
          return Object.keys(labels).every(
            (key) => m.labels[key] === labels[key],
          );
        });
      }
      return metrics;
    }

    // Return all metrics
    return Array.from(this.metrics.values()).flat();
  }

  /**
   * Get metric summary
   */
  getMetricSummary(
    name: string,
    labels?: Record<string, string>,
  ): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  } {
    const metrics = this.getMetrics(name, labels);
    if (metrics.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    const values = metrics.map((m) => m.value);
    return {
      count: values.length,
      sum: values.reduce((sum, v) => sum + v, 0),
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  async exportPrometheusFormat(): Promise<string> {
    if (this.prometheusEnabled) {
      return this.registry.metrics();
    }

    // Fallback format (for when Prometheus is disabled)
    return "# Prometheus metrics disabled";
  }

  /**
   * Get Prometheus registry
   */
  getRegistry(): Registry {
    return this.registry;
  }
}

export const metricsService = new MetricsService();

// Register common metrics
metricsService.registerMetric({
  name: "http_requests_total",
  type: "counter",
  help: "Total number of HTTP requests",
  labels: ["method", "route", "status"],
});

metricsService.registerMetric({
  name: "http_request_duration_seconds",
  type: "histogram",
  help: "HTTP request duration in seconds",
  labels: ["method", "route", "status"],
});

metricsService.registerMetric({
  name: "event_bus_events_total",
  type: "counter",
  help: "Total number of events published",
  labels: ["event_type", "module"],
});

metricsService.registerMetric({
  name: "database_queries_total",
  type: "counter",
  help: "Total number of database queries",
  labels: ["operation", "table"],
});

metricsService.registerMetric({
  name: "cache_hits_total",
  type: "counter",
  help: "Total number of cache hits",
  labels: ["cache_key"],
});

metricsService.registerMetric({
  name: "cache_misses_total",
  type: "counter",
  help: "Total number of cache misses",
  labels: ["cache_key"],
});
