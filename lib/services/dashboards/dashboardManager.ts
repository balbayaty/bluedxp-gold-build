/**
 * 🎯 DASHBOARD MANAGER SERVICE
 * Centralized management for all dashboard layouts and widgets
 * Deep layer architecture with full functionality
 * Source: Adapted from chemcheck-analysis/lib/dashboards/DashboardManager.ts
 */

import { EventEmitter } from "events";

export interface Widget {
  id: string;
  title: string;
  type:
    | "metric"
    | "chart"
    | "list"
    | "status"
    | "map"
    | "feed"
    | "ai-insight"
    | "table"
    | "progress"
    | "custom"
    | "tabs";
  size: "xs" | "sm" | "md" | "lg" | "xl" | "full";
  position: { x: number; y: number; w: number; h: number };
  data: any;
  config: WidgetConfig;
  refreshInterval?: number;
  accessLevel: "all" | "user" | "admin" | "enterprise" | "super_admin";
  category: string;
  module: string;
  isCustomizable: boolean;
  isRemovable: boolean;
  gradient?: string;
  icon?: React.ReactNode;
  lastUpdated?: Date;
  dataSource?: string;
  actions?: WidgetAction[];
}

export interface WidgetConfig {
  showHeader: boolean;
  showIcon: boolean;
  showActions: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  colorScheme: "default" | "primary" | "success" | "warning" | "error" | "info";
  animation: boolean;
  borderRadius: number;
  padding: number;
  backgroundColor?: string;
  textColor?: string;
}

export interface WidgetAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: (widget: Widget) => void;
  accessLevel?: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  category: string;
  userRole: string[];
  modules: string[];
  isDefault: boolean;
  isCustomizable: boolean;
  widgets: Widget[];
  metadata: {
    createdBy: string;
    createdAt: Date;
    version: string;
    tags: string[];
  };
}

export interface DashboardFilters {
  category: string | "all";
  module: string | "all";
  accessLevel: string | "all";
  searchQuery: string;
  showHidden: boolean;
  dateRange: { start: Date; end: Date } | null;
}

export class DashboardManager extends EventEmitter {
  private static instance: DashboardManager;
  private layouts: Map<string, DashboardLayout> = new Map();
  private customWidgets: Map<string, Widget[]> = new Map();
  private userPreferences: Map<string, any> = new Map();
  private widgetSubscriptions: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): DashboardManager {
    if (!DashboardManager.instance) {
      DashboardManager.instance = new DashboardManager();
    }
    return DashboardManager.instance;
  }

  /**
   * Get dashboard layout with user permissions and module filtering
   */
  async getLayout(
    layoutId: string,
    userId: string,
    userRole: string,
    enabledModules: string[],
  ): Promise<DashboardLayout | null> {
    try {
      const layout = await this.getMockLayout(layoutId);

      if (!layout) return null;

      // Apply user permissions and module filtering
      const filteredWidgets = layout.widgets.filter((widget) =>
        this.hasWidgetAccess(widget, userRole, enabledModules),
      );

      return {
        ...layout,
        widgets: filteredWidgets,
      };
    } catch (error) {
      console.error("Failed to get layout:", error);
      return null;
    }
  }

  /**
   * Get available layouts for user
   */
  async getAvailableLayouts(
    userRole: string,
    enabledModules: string[],
  ): Promise<DashboardLayout[]> {
    try {
      const allLayouts = await this.getMockLayouts();

      return allLayouts
        .filter(
          (layout) =>
            layout.userRole.includes(userRole) ||
            layout.userRole.includes("all"),
        )
        .filter(
          (layout) =>
            layout.modules.some((module) => enabledModules.includes(module)) ||
            enabledModules.length === 0,
        );
    } catch (error) {
      console.error("Failed to get available layouts:", error);
      return [];
    }
  }

  /**
   * Save custom layout
   */
  async saveCustomLayout(
    layout: DashboardLayout,
    userId: string,
  ): Promise<boolean> {
    try {
      // In production, save to database
      this.layouts.set(`${userId}-${layout.id}`, layout);
      this.emit("layoutSaved", { layout, userId });
      return true;
    } catch (error) {
      console.error("Failed to save layout:", error);
      return false;
    }
  }

  /**
   * Get widget data (with mock data generation)
   */
  async getWidgetData(widgetId: string, parameters?: any): Promise<any> {
    try {
      return this.generateMockWidgetData(widgetId, parameters);
    } catch (error) {
      console.error(`Failed to get widget data for ${widgetId}:`, error);
      return null;
    }
  }

  /**
   * Refresh widget data
   */
  async refreshWidget(widgetId: string): Promise<any> {
    return this.getWidgetData(widgetId);
  }

  /**
   * Subscribe to widget updates (real-time simulation)
   */
  async subscribeToWidgetUpdates(
    widgetId: string,
    callback: (data: any) => void,
  ): Promise<() => void> {
    // Clear existing subscription
    const existing = this.widgetSubscriptions.get(widgetId);
    if (existing) {
      clearInterval(existing);
    }

    // Set up new subscription (simulated real-time updates)
    const interval = setInterval(async () => {
      const data = await this.getWidgetData(widgetId);
      callback(data);
    }, 30000); // Update every 30 seconds

    this.widgetSubscriptions.set(widgetId, interval);

    // Return unsubscribe function
    return () => {
      const sub = this.widgetSubscriptions.get(widgetId);
      if (sub) {
        clearInterval(sub);
        this.widgetSubscriptions.delete(widgetId);
      }
    };
  }

  /**
   * Track dashboard usage analytics
   */
  async trackDashboardUsage(
    userId: string,
    layoutId: string,
    action: string,
  ): Promise<void> {
    try {
      // In production, send to analytics service
      console.log(
        `Dashboard Analytics: User ${userId} performed ${action} on layout ${layoutId}`,
      );
      this.emit("dashboardUsage", {
        userId,
        layoutId,
        action,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Failed to track dashboard usage:", error);
    }
  }

  /**
   * Get dashboard analytics
   */
  async getDashboardAnalytics(
    userId: string,
    timeRange: { start: Date; end: Date },
  ): Promise<any> {
    try {
      // Mock analytics data
      return {
        totalViews: 156,
        avgSessionTime: 12.5,
        mostUsedWidgets: [
          { id: "total-revenue", views: 89 },
          { id: "system-health", views: 76 },
          { id: "active-users", views: 65 },
        ],
        layoutUsage: [
          { id: "executive-overview", usage: 45 },
          { id: "qhse-dashboard", usage: 23 },
          { id: "operations-dashboard", usage: 18 },
        ],
      };
    } catch (error) {
      console.error("Failed to get dashboard analytics:", error);
      return null;
    }
  }

  // Private helper methods

  private hasWidgetAccess(
    widget: Widget,
    userRole: string,
    enabledModules: string[],
  ): boolean {
    // Check access level
    if (widget.accessLevel === "all") return true;
    if (
      widget.accessLevel === "admin" &&
      ["admin", "super_admin"].includes(userRole)
    )
      return true;
    if (
      widget.accessLevel === "enterprise" &&
      ["enterprise", "admin", "super_admin"].includes(userRole)
    )
      return true;
    if (widget.accessLevel === "super_admin" && userRole === "super_admin")
      return true;

    // Check module access
    if (enabledModules.length > 0 && !enabledModules.includes(widget.module))
      return false;

    return false;
  }

  private async getMockLayout(
    layoutId: string,
  ): Promise<DashboardLayout | null> {
    const layouts = await this.getMockLayouts();
    return layouts.find((l) => l.id === layoutId) || null;
  }

  private async getMockLayouts(): Promise<DashboardLayout[]> {
    // This would normally come from a database
    return [
      {
        id: "executive-overview",
        name: "Executive Overview",
        description: "High-level business metrics and KPIs",
        category: "business",
        userRole: ["admin", "executive", "super_admin", "all"],
        modules: ["billing", "analytics", "compliance"],
        isDefault: true,
        isCustomizable: true,
        widgets: [],
        metadata: {
          createdBy: "system",
          createdAt: new Date(),
          version: "1.0.0",
          tags: ["executive", "overview", "business"],
        },
      },
      {
        id: "qhse-dashboard",
        name: "QHSE Control Center",
        description: "Safety and compliance monitoring",
        category: "qhse",
        userRole: ["qhse_manager", "admin", "safety_officer", "all"],
        modules: ["qhse", "compliance", "incidents"],
        isDefault: false,
        isCustomizable: true,
        widgets: [],
        metadata: {
          createdBy: "system",
          createdAt: new Date(),
          version: "1.0.0",
          tags: ["qhse", "safety", "compliance"],
        },
      },
      {
        id: "operations-dashboard",
        name: "Operations Control",
        description: "Warehouse and logistics management",
        category: "operations",
        userRole: ["operations_manager", "warehouse_manager", "admin", "all"],
        modules: ["warehouse", "logistics", "fleet"],
        isDefault: false,
        isCustomizable: true,
        widgets: [],
        metadata: {
          createdBy: "system",
          createdAt: new Date(),
          version: "1.0.0",
          tags: ["operations", "warehouse", "logistics"],
        },
      },
    ];
  }

  private generateMockWidgetData(widgetId: string, parameters?: any): any {
    // Generate realistic mock data based on widget ID
    const baseData: Record<string, any> = {
      "total-revenue": {
        value: 2450000 + Math.random() * 100000,
        trend: `+${(Math.random() * 20 + 5).toFixed(1)}%`,
        period: "This Month",
      },
      "active-users": {
        value: 1234 + Math.floor(Math.random() * 100),
        trend: `+${(Math.random() * 15 + 3).toFixed(1)}%`,
        period: "Last 7 days",
      },
      "system-health": {
        value: 99.2 + Math.random() * 0.5,
        trend: `+${(Math.random() * 0.5).toFixed(1)}%`,
        period: "Uptime %",
      },
      "chemical-analyses": {
        value: 156 + Math.floor(Math.random() * 50),
        trend: `+${(Math.random() * 30 + 10).toFixed(1)}%`,
        period: "vs yesterday",
      },
      "compliance-score": {
        value: 94.7 + Math.random() * 3,
        trend: `+${(Math.random() * 5 + 1).toFixed(1)}%`,
        period: "Last month",
      },
    };

    return (
      baseData[widgetId] || {
        value: Math.floor(Math.random() * 1000),
        trend: `+${Math.floor(Math.random() * 20)}%`,
        period: "Today",
      }
    );
  }
}

// Export singleton instance
export const dashboardManager = DashboardManager.getInstance();
export default DashboardManager;
