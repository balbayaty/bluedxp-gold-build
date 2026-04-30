/**
 * Widget Service
 * Widget management and data generation
 */

import type { Widget, WidgetConfig } from "./dashboardManager";

export interface WidgetData {
  value: number | string;
  label: string;
  trend?: "up" | "down" | "neutral";
  change?: number;
  metadata?: Record<string, any>;
}

export class WidgetService {
  /**
   * Generate widget data based on type
   */
  async generateWidgetData(widget: Widget): Promise<WidgetData> {
    switch (widget.type) {
      case "metric":
        return this.generateMetricData(widget);
      case "chart":
        return this.generateChartData(widget);
      case "status":
        return this.generateStatusData(widget);
      default:
        return { value: 0, label: "No data" };
    }
  }

  /**
   * Generate metric widget data
   */
  private generateMetricData(widget: Widget): WidgetData {
    const value = Math.floor(Math.random() * 1000);
    const trend =
      Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "neutral";
    const change = (Math.random() - 0.5) * 20;

    return {
      value,
      label: widget.title,
      trend,
      change: Math.abs(change),
    };
  }

  /**
   * Generate chart widget data
   */
  private generateChartData(widget: Widget): WidgetData {
    return {
      value: "chart",
      label: widget.title,
      metadata: {
        type: "line",
        data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 100)),
      },
    };
  }

  /**
   * Generate status widget data
   */
  private generateStatusData(widget: Widget): WidgetData {
    const statuses = ["operational", "warning", "error"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      value: status,
      label: widget.title,
      metadata: { status },
    };
  }

  /**
   * Refresh widget data
   */
  async refreshWidget(widgetId: string): Promise<WidgetData> {
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { value: Math.floor(Math.random() * 1000), label: "Refreshed" };
  }

  /**
   * Get widget configuration
   */
  getDefaultConfig(widgetType: Widget["type"]): WidgetConfig {
    return {
      showHeader: true,
      showIcon: true,
      showActions: true,
      autoRefresh: true,
      refreshInterval: 30000,
      colorScheme: "default",
      animation: true,
      borderRadius: 12,
      padding: 16,
    };
  }
}

export const widgetService = new WidgetService();
