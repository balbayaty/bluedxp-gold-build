/**
 * Customization Service
 *
 * User preferences, dashboard customization, themes, layouts
 * Fully integrated with ecosystem - no duplication
 */

import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface UserPreferences {
  userId: string;
  tenantId?: string;
  theme: "LIGHT" | "DARK" | "AUTO";
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  currency: string;
  dashboard: DashboardPreferences;
  notifications: NotificationPreferences;
  views: ViewPreferences;
  shortcuts: ShortcutPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardPreferences {
  layout: "GRID" | "LIST" | "CUSTOM";
  widgets: DashboardWidget[];
  columns?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}

export interface DashboardWidget {
  id: string;
  type: "METRIC" | "CHART" | "TABLE" | "MAP" | "TIMELINE" | "CUSTOM";
  title: string;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, any>;
  visible: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  types: {
    SHIPMENT_STATUS: boolean;
    EXCEPTION: boolean;
    CUSTOMS: boolean;
    DELAY: boolean;
    DELIVERY: boolean;
    [key: string]: boolean;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
    timezone: string;
  };
}

export interface ViewPreferences {
  defaultView: string;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  filters?: Record<string, any>;
  columns?: string[];
  customViews: CustomView[];
}

export interface CustomView {
  id: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  columns: string[];
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  isDefault: boolean;
  createdAt: Date;
}

export interface ShortcutPreferences {
  keyboard: Record<string, string>; // key combination -> action
  quickActions: QuickAction[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  action: string;
  params?: Record<string, any>;
  position: number;
}

export interface ThemeCustomization {
  userId: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  borderRadius: number;
  spacing: number;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class CustomizationService {
  private preferences: Map<string, UserPreferences> = new Map();
  private themes: Map<string, ThemeCustomization> = new Map();

  /**
   * Get user preferences
   */
  async getUserPreferences(
    userId: string,
    tenantId?: string,
  ): Promise<UserPreferences> {
    const key = `${tenantId || "default"}:${userId}`;
    let preferences = this.preferences.get(key);

    if (!preferences) {
      // Create default preferences
      preferences = await this.createDefaultPreferences(userId, tenantId);
      this.preferences.set(key, preferences);
    }

    return preferences;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    updates: Partial<UserPreferences>,
    tenantId?: string,
  ): Promise<UserPreferences> {
    const key = `${tenantId || "default"}:${userId}`;
    const preferences = await this.getUserPreferences(userId, tenantId);

    const updated: UserPreferences = {
      ...preferences,
      ...updates,
      updatedAt: new Date(),
    };

    this.preferences.set(key, updated);

    await eventBus.publish("transportation.preferences.updated", {
      userId,
      tenantId,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Update dashboard preferences
   */
  async updateDashboardPreferences(
    userId: string,
    updates: Partial<DashboardPreferences>,
    tenantId?: string,
  ): Promise<DashboardPreferences> {
    const preferences = await this.getUserPreferences(userId, tenantId);
    const dashboard = {
      ...preferences.dashboard,
      ...updates,
    };

    await this.updateUserPreferences(userId, { dashboard }, tenantId);

    return dashboard;
  }

  /**
   * Add dashboard widget
   */
  async addDashboardWidget(
    userId: string,
    widget: Omit<DashboardWidget, "id">,
    tenantId?: string,
  ): Promise<DashboardWidget> {
    const preferences = await this.getUserPreferences(userId, tenantId);
    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    };

    const dashboard: DashboardPreferences = {
      ...preferences.dashboard,
      widgets: [...preferences.dashboard.widgets, newWidget],
    };

    await this.updateUserPreferences(userId, { dashboard }, tenantId);

    return newWidget;
  }

  /**
   * Remove dashboard widget
   */
  async removeDashboardWidget(
    userId: string,
    widgetId: string,
    tenantId?: string,
  ): Promise<void> {
    const preferences = await this.getUserPreferences(userId, tenantId);
    const dashboard: DashboardPreferences = {
      ...preferences.dashboard,
      widgets: preferences.dashboard.widgets.filter((w) => w.id !== widgetId),
    };

    await this.updateUserPreferences(userId, { dashboard }, tenantId);
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>,
    tenantId?: string,
  ): Promise<NotificationPreferences> {
    const preferences = await this.getUserPreferences(userId, tenantId);
    const notifications = {
      ...preferences.notifications,
      ...updates,
    };

    await this.updateUserPreferences(userId, { notifications }, tenantId);

    return notifications;
  }

  /**
   * Create custom view
   */
  async createCustomView(
    userId: string,
    view: Omit<CustomView, "id" | "createdAt">,
    tenantId?: string,
  ): Promise<CustomView> {
    const preferences = await this.getUserPreferences(userId, tenantId);
    const newView: CustomView = {
      ...view,
      id: `view-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
    };

    const views: ViewPreferences = {
      ...preferences.views,
      customViews: [...preferences.views.customViews, newView],
    };

    await this.updateUserPreferences(userId, { views }, tenantId);

    return newView;
  }

  /**
   * Update theme customization
   */
  async updateTheme(
    userId: string,
    theme: Partial<ThemeCustomization>,
    tenantId?: string,
  ): Promise<ThemeCustomization> {
    const key = `${tenantId || "default"}:${userId}`;
    const existing = this.themes.get(key) || {
      userId,
      colors: {
        primary: "#3b82f6",
        secondary: "#10b981",
        accent: "#8b5cf6",
        background: "#ffffff",
        surface: "#f9fafb",
        text: "#111827",
        textSecondary: "#6b7280",
      },
      fonts: {
        heading: "Inter",
        body: "Inter",
        mono: "Monaco",
      },
      borderRadius: 8,
      spacing: 4,
    };

    const updated: ThemeCustomization = {
      ...existing,
      ...theme,
      userId,
    };

    this.themes.set(key, updated);

    await eventBus.publish("transportation.theme.updated", {
      userId,
      tenantId,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Get theme customization
   */
  getTheme(userId: string, tenantId?: string): ThemeCustomization | undefined {
    const key = `${tenantId || "default"}:${userId}`;
    return this.themes.get(key);
  }

  /**
   * Create default preferences
   */
  private async createDefaultPreferences(
    userId: string,
    tenantId?: string,
  ): Promise<UserPreferences> {
    return {
      userId,
      tenantId,
      theme: "AUTO",
      language: "en",
      timezone: "UTC",
      dateFormat: "YYYY-MM-DD",
      numberFormat: "en-US",
      currency: "USD",
      dashboard: {
        layout: "GRID",
        widgets: [],
        columns: 3,
        autoRefresh: true,
        refreshInterval: 30,
      },
      notifications: {
        email: true,
        sms: false,
        push: true,
        inApp: true,
        types: {
          SHIPMENT_STATUS: true,
          EXCEPTION: true,
          CUSTOMS: true,
          DELAY: true,
          DELIVERY: true,
        },
      },
      views: {
        defaultView: "default",
        pageSize: 25,
        sortBy: "createdAt",
        sortOrder: "DESC",
        customViews: [],
      },
      shortcuts: {
        keyboard: {},
        quickActions: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export const customizationService = new CustomizationService();
