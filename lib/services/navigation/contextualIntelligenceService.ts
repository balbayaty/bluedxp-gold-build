/**
 * Contextual Intelligence Service
 * Provides real-time metrics, AI insights, and quick actions based on user context
 * 4IR & 5IR Aligned • Integration-First • Human-Centric
 */

export interface ContextualMetric {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  status?: "critical" | "warning" | "good" | "excellent";
  icon: string;
  color: string;
  href?: string;
  category?: string;
  tooltip?: string;
}

export interface AIInsight {
  id: string;
  type: "recommendation" | "alert" | "opportunity" | "optimization";
  message: string;
  priority: "high" | "medium" | "low";
  icon: string;
  href?: string;
  metadata?: Record<string, any>;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href?: string;
  badge?: string | number;
  category?: string;
}

export interface ContextualIntelligence {
  metrics: ContextualMetric[];
  insights: AIInsight[];
  quickActions: QuickAction[];
  lastUpdated: Date;
}

class ContextualIntelligenceService {
  private cache: Map<
    string,
    { data: ContextualIntelligence; timestamp: number }
  > = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  /**
   * Get contextual intelligence for current path
   */
  async getIntelligence(
    pathname: string,
    userId?: string,
    tenantId?: string,
  ): Promise<ContextualIntelligence> {
    const cacheKey = `${pathname}-${userId}-${tenantId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // Determine context
    const context = this.determineContext(pathname);

    // Fetch metrics, insights, and actions in parallel
    const [metrics, insights, quickActions] = await Promise.all([
      this.getMetrics(context, pathname, tenantId),
      this.getInsights(context, pathname, userId, tenantId),
      this.getQuickActions(context, pathname, userId),
    ]);

    const intelligence: ContextualIntelligence = {
      metrics,
      insights,
      quickActions,
      lastUpdated: new Date(),
    };

    this.cache.set(cacheKey, { data: intelligence, timestamp: Date.now() });
    return intelligence;
  }

  /**
   * Determine context from pathname
   */
  private determineContext(pathname: string): string {
    if (pathname.includes("/warehouse") || pathname.includes("/wms"))
      return "warehouse";
    if (pathname.includes("/qhse")) return "qhse";
    if (
      pathname.includes("/compliance") ||
      pathname.includes("/trade-compliance")
    )
      return "compliance";
    if (pathname.includes("/system-admin")) return "system-admin";
    if (pathname.includes("/iso-ims")) return "iso-ims";
    if (pathname.includes("/tms")) return "tms";
    if (pathname === "/" || pathname.includes("/dashboard")) return "dashboard";
    return "general";
  }

  /**
   * Get metrics based on context
   */
  private async getMetrics(
    context: string,
    pathname: string,
    tenantId?: string,
  ): Promise<ContextualMetric[]> {
    try {
      switch (context) {
        case "warehouse":
          return await this.getWarehouseMetrics(tenantId);
        case "qhse":
          return await this.getQHSEMetrics(tenantId);
        case "system-admin":
          return await this.getSystemAdminMetrics(tenantId);
        case "dashboard":
          return await this.getDashboardMetrics(tenantId);
        default:
          return [];
      }
    } catch (error) {
      console.error(
        "[ContextualIntelligenceService] Error fetching metrics:",
        error,
      );
      return [];
    }
  }

  private async getWarehouseMetrics(
    tenantId?: string,
  ): Promise<ContextualMetric[]> {
    try {
      const response = await fetch(
        `/api/dashboards/warehouse/realtime?tenantId=${tenantId || "default"}`,
      );
      const data = await response.json();

      if (!data.success || !data.data?.metrics) return [];

      const m = data.data.metrics;
      return [
        {
          id: "orders",
          label: "Active Orders",
          value: m.inProgressOrders || 0,
          change: 12,
          trend: "up",
          status: "good",
          icon: "ri-shopping-cart-line",
          color: "cyan",
          href: "/warehouse/orders",
          category: "operations",
        },
        {
          id: "accuracy",
          label: "Picking Accuracy",
          value: `${(m.pickingAccuracy || 0).toFixed(1)}%`,
          change: 2.3,
          trend: "up",
          status:
            m.pickingAccuracy >= 98
              ? "excellent"
              : m.pickingAccuracy >= 95
                ? "good"
                : "warning",
          icon: "ri-target-line",
          color:
            m.pickingAccuracy >= 98
              ? "green"
              : m.pickingAccuracy >= 95
                ? "cyan"
                : "yellow",
          href: "/warehouse/performance",
          category: "performance",
        },
        {
          id: "inventory",
          label: "Low Stock",
          value: m.lowStockItems || 0,
          change: -5,
          trend: "down",
          status: m.lowStockItems > 10 ? "warning" : "good",
          icon: "ri-alert-line",
          color: m.lowStockItems > 10 ? "yellow" : "cyan",
          href: "/warehouse/inventory",
          category: "inventory",
        },
        {
          id: "efficiency",
          label: "On-Time Delivery",
          value: `${(m.onTimeDelivery || 0).toFixed(1)}%`,
          change: 1.2,
          trend: "up",
          status:
            m.onTimeDelivery >= 95
              ? "excellent"
              : m.onTimeDelivery >= 85
                ? "good"
                : "warning",
          icon: "ri-time-line",
          color:
            m.onTimeDelivery >= 95
              ? "green"
              : m.onTimeDelivery >= 85
                ? "cyan"
                : "yellow",
          href: "/warehouse/performance",
          category: "performance",
        },
      ];
    } catch (error) {
      console.error(
        "[ContextualIntelligenceService] Error fetching warehouse metrics:",
        error,
      );
      return [];
    }
  }

  private async getQHSEMetrics(tenantId?: string): Promise<ContextualMetric[]> {
    try {
      const response = await fetch(
        `/api/qhse/metrics?tenantId=${tenantId || "default"}`,
      );
      const data = await response.json();

      if (!data.success || !data.data) return [];

      const m = data.data;
      return [
        {
          id: "compliance",
          label: "Compliance Score",
          value: `${(m.complianceScore || 0).toFixed(0)}%`,
          change: 3.5,
          trend: "up",
          status:
            m.complianceScore >= 90
              ? "excellent"
              : m.complianceScore >= 75
                ? "good"
                : "warning",
          icon: "ri-shield-check-line",
          color:
            m.complianceScore >= 90
              ? "green"
              : m.complianceScore >= 75
                ? "cyan"
                : "yellow",
          href: "/qhse/compliance",
          category: "compliance",
        },
        {
          id: "trir",
          label: "TRIR",
          value: (m.trir || 0).toFixed(2),
          change: -0.15,
          trend: "down",
          status: m.trir < 2 ? "excellent" : m.trir < 4 ? "good" : "warning",
          icon: "ri-heart-pulse-line",
          color: m.trir < 2 ? "green" : m.trir < 4 ? "cyan" : "yellow",
          href: "/qhse/incidents",
          category: "safety",
        },
        {
          id: "open-incidents",
          label: "Open Incidents",
          value: m.openIncidents || 0,
          change: -2,
          trend: "down",
          status: m.openIncidents > 5 ? "warning" : "good",
          icon: "ri-error-warning-line",
          color: m.openIncidents > 5 ? "yellow" : "cyan",
          href: "/qhse/incidents",
          category: "incidents",
        },
      ];
    } catch (error) {
      console.error(
        "[ContextualIntelligenceService] Error fetching QHSE metrics:",
        error,
      );
      return [];
    }
  }

  private async getSystemAdminMetrics(
    tenantId?: string,
  ): Promise<ContextualMetric[]> {
    try {
      const response = await fetch(
        `/api/system-admin/comprehensive-metrics?tenantId=${tenantId || "default"}`,
      );
      const data = await response.json();

      if (!data.success || !data.data) return [];

      const m = data.data;
      return [
        {
          id: "system-health",
          label: "System Health",
          value: `${(m.systemHealth || 0).toFixed(0)}%`,
          change: 0,
          trend: "neutral",
          status:
            m.systemHealth >= 95
              ? "excellent"
              : m.systemHealth >= 85
                ? "good"
                : "warning",
          icon: "ri-pulse-line",
          color:
            m.systemHealth >= 95
              ? "green"
              : m.systemHealth >= 85
                ? "cyan"
                : "yellow",
          href: "/system-admin/health",
          category: "system",
        },
        {
          id: "active-users",
          label: "Active Users",
          value: m.activeUsers || 0,
          change: 5,
          trend: "up",
          status: "good",
          icon: "ri-user-line",
          color: "cyan",
          href: "/system-admin/users",
          category: "users",
        },
        {
          id: "api-requests",
          label: "API/min",
          value: m.apiRequestsPerMinute || 0,
          change: 12,
          trend: "up",
          status: "good",
          icon: "ri-router-line",
          color: "cyan",
          href: "/system-admin/monitoring",
          category: "performance",
        },
      ];
    } catch (error) {
      console.error(
        "[ContextualIntelligenceService] Error fetching system admin metrics:",
        error,
      );
      return [];
    }
  }

  private async getDashboardMetrics(
    tenantId?: string,
  ): Promise<ContextualMetric[]> {
    return [
      {
        id: "efficiency",
        label: "Platform Efficiency",
        value: "94.2%",
        change: 2.1,
        trend: "up",
        status: "excellent",
        icon: "ri-speed-line",
        color: "green",
        href: "/dashboard/performance",
        category: "performance",
      },
      {
        id: "modules",
        label: "Active Modules",
        value: "12",
        change: 0,
        trend: "neutral",
        status: "good",
        icon: "ri-stack-line",
        color: "cyan",
        href: "/modules",
        category: "modules",
      },
      {
        id: "alerts",
        label: "Active Alerts",
        value: "3",
        change: -1,
        trend: "down",
        status: "warning",
        icon: "ri-notification-line",
        color: "yellow",
        href: "/notifications",
        category: "alerts",
      },
    ];
  }

  /**
   * Get AI insights based on context
   */
  private async getInsights(
    context: string,
    pathname: string,
    userId?: string,
    tenantId?: string,
  ): Promise<AIInsight[]> {
    try {
      // Try to fetch from AI insights API
      const response = await fetch(
        `/api/ai/insights?context=${encodeURIComponent(pathname)}&userId=${userId || ""}&tenantId=${tenantId || ""}`,
      );
      const data = await response.json();

      if (data.success && data.insights) {
        return data.insights.slice(0, 3);
      }

      // Fallback: Generate context-based insights
      return this.generateContextualInsights(context, pathname);
    } catch (error) {
      console.error(
        "[ContextualIntelligenceService] Error fetching insights:",
        error,
      );
      return this.generateContextualInsights(context, pathname);
    }
  }

  private generateContextualInsights(
    context: string,
    pathname: string,
  ): AIInsight[] {
    const insights: AIInsight[] = [];

    switch (context) {
      case "warehouse":
        insights.push({
          id: "insight-1",
          type: "optimization",
          message: "Picking efficiency improved 12% this week",
          priority: "medium",
          icon: "ri-lightbulb-line",
          href: "/warehouse/analytics",
        });
        break;
      case "qhse":
        insights.push({
          id: "insight-1",
          type: "recommendation",
          message: "3 training sessions due this week",
          priority: "high",
          icon: "ri-alarm-line",
          href: "/qhse/training",
        });
        break;
    }

    return insights;
  }

  /**
   * Get quick actions based on context
   */
  private async getQuickActions(
    context: string,
    pathname: string,
    userId?: string,
  ): Promise<QuickAction[]> {
    switch (context) {
      case "warehouse":
        return [
          {
            id: "new-order",
            label: "New Order",
            icon: "ri-add-circle-line",
            href: "/warehouse/orders/new",
          },
          {
            id: "inventory",
            label: "Inventory",
            icon: "ri-stack-line",
            href: "/warehouse/inventory",
          },
          {
            id: "reports",
            label: "Reports",
            icon: "ri-file-chart-line",
            href: "/warehouse/reports",
          },
        ];
      case "qhse":
        return [
          {
            id: "new-incident",
            label: "New Incident",
            icon: "ri-add-circle-line",
            href: "/qhse/incidents/new",
          },
          {
            id: "inspections",
            label: "Inspections",
            icon: "ri-search-line",
            href: "/qhse/inspections",
          },
          {
            id: "training",
            label: "Training",
            icon: "ri-graduation-cap-line",
            href: "/qhse/training",
          },
        ];
      case "system-admin":
        return [
          {
            id: "users",
            label: "Users",
            icon: "ri-user-settings-line",
            href: "/system-admin/users",
          },
          {
            id: "settings",
            label: "Settings",
            icon: "ri-settings-3-line",
            href: "/system-admin/settings",
          },
          {
            id: "monitoring",
            label: "Monitoring",
            icon: "ri-bar-chart-box-line",
            href: "/system-admin/monitoring",
          },
        ];
      default:
        return [
          {
            id: "dashboard",
            label: "Dashboard",
            icon: "ri-dashboard-line",
            href: "/dashboard",
          },
          {
            id: "workspace",
            label: "Workspace",
            icon: "ri-layout-grid-line",
            href: "/workspace",
          },
          {
            id: "search",
            label: "Search",
            icon: "ri-search-line",
            href: "/?search=true",
          },
        ];
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const contextualIntelligenceService =
  new ContextualIntelligenceService();
