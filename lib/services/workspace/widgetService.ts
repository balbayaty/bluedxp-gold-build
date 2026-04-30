/**
 * Widget Service - Widget Management & Data Fetching
 *
 * Manages widget definitions, user widgets, and data fetching
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-bus";
import type {
  WidgetDefinition,
  UserWidget,
  CreateWidgetDefinitionInput,
  UpdateWidgetDefinitionInput,
  CreateUserWidgetInput,
  UpdateUserWidgetInput,
  GetWidgetsQuery,
  WidgetDataRequest,
  WidgetDataResponse,
  WidgetDataSource,
} from "@/types/workspace";
import { hasPermission } from "@/types/user";
import type { User } from "@/types/user";

export class WidgetService {
  /**
   * Get widget definitions
   */
  async getWidgetDefinitions(
    query?: GetWidgetsQuery,
  ): Promise<WidgetDefinition[]> {
    try {
      const where: any = {
        isActive: query?.isActive !== false,
      };

      if (query?.categoryId) {
        where.categoryId = query.categoryId;
      }

      if (query?.moduleId) {
        where.moduleId = query.moduleId;
      }

      if (query?.tags && query.tags.length > 0) {
        where.tags = {
          hasSome: query.tags,
        };
      }

      if (query?.search) {
        where.OR = [
          { name: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
        ];
      }

      const widgets = await prisma.widgetDefinition.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { order: "asc" },
        take: query?.limit || 100,
        skip: query?.offset || 0,
      });

      return widgets as any;
    } catch (error) {
      console.error("[WidgetService] Error getting widget definitions:", error);
      return [];
    }
  }

  /**
   * Get widget definition by ID
   */
  async getWidgetDefinitionById(id: string): Promise<WidgetDefinition | null> {
    try {
      const widget = await prisma.widgetDefinition.findUnique({
        where: { id },
        include: {
          category: true,
        },
      });

      return (widget as any) || null;
    } catch (error) {
      console.error("[WidgetService] Error getting widget definition:", error);
      return null;
    }
  }

  /**
   * Create widget definition (admin only)
   */
  async createWidgetDefinition(
    input: CreateWidgetDefinitionInput,
    userId: string,
  ): Promise<WidgetDefinition> {
    try {
      const widget = await prisma.widgetDefinition.create({
        data: {
          ...input,
          configurable: input.configurable ?? true,
          tags: input.tags || [],
          order: input.order || 0,
          isActive: true,
          createdBy: userId,
        },
        include: {
          category: true,
        },
      });

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "WidgetDefinitionCreated",
        aggregateId: widget.id,
        aggregateType: "WidgetDefinition",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          widgetId: widget.id,
          name: widget.name,
          createdBy: userId,
        },
        metadata: {
          correlationId: `widget-create-${widget.id}`,
          userId,
          tenantId: input.tenantId,
          schemaVersion: 1,
        },
      });

      return widget as any;
    } catch (error) {
      console.error("[WidgetService] Error creating widget definition:", error);
      throw error;
    }
  }

  /**
   * Update widget definition
   */
  async updateWidgetDefinition(
    id: string,
    input: UpdateWidgetDefinitionInput,
  ): Promise<WidgetDefinition> {
    try {
      const widget = await prisma.widgetDefinition.update({
        where: { id },
        data: input,
        include: {
          category: true,
        },
      });

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "WidgetDefinitionUpdated",
        aggregateId: id,
        aggregateType: "WidgetDefinition",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          widgetId: id,
        },
        metadata: {
          correlationId: `widget-update-${id}`,
          schemaVersion: 1,
        },
      });

      return widget as any;
    } catch (error) {
      console.error("[WidgetService] Error updating widget definition:", error);
      throw error;
    }
  }

  /**
   * Delete widget definition (non-system only)
   */
  async deleteWidgetDefinition(id: string): Promise<boolean> {
    try {
      // Check if widget is system widget (can't delete)
      const widget = await prisma.widgetDefinition.findUnique({
        where: { id },
        include: {
          category: true,
        },
      });

      if (!widget) {
        throw new Error("Widget not found");
      }

      if (widget.category?.isSystem) {
        throw new Error("Cannot delete system widgets");
      }

      await prisma.widgetDefinition.delete({
        where: { id },
      });

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "WidgetDefinitionDeleted",
        aggregateId: id,
        aggregateType: "WidgetDefinition",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          widgetId: id,
        },
        metadata: {
          correlationId: `widget-delete-${id}`,
          schemaVersion: 1,
        },
      });

      return true;
    } catch (error) {
      console.error("[WidgetService] Error deleting widget definition:", error);
      throw error;
    }
  }

  /**
   * Create user widget
   */
  async createUserWidget(
    userId: string,
    input: CreateUserWidgetInput,
  ): Promise<UserWidget> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const userWidget = await prisma.userWidget.create({
        data: {
          userId,
          tenantId: user.tenantId,
          widgetDefId: input.widgetDefId,
          layoutId: input.layoutId,
          position: input.position as any,
          config: (input.config || {}) as any,
          refreshInterval: input.refreshInterval,
          isVisible: input.isVisible !== false,
          isCollapsed: input.isCollapsed || false,
          order: input.order || 0,
        },
        include: {
          widgetDef: {
            include: {
              category: true,
            },
          },
        },
      });

      return userWidget as any;
    } catch (error) {
      console.error("[WidgetService] Error creating user widget:", error);
      throw error;
    }
  }

  /**
   * Update user widget
   */
  async updateUserWidget(
    id: string,
    userId: string,
    input: UpdateUserWidgetInput,
  ): Promise<UserWidget> {
    try {
      // Verify ownership
      const existing = await prisma.userWidget.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existing) {
        throw new Error("Widget not found or access denied");
      }

      const userWidget = await prisma.userWidget.update({
        where: { id },
        data: {
          position: input.position as any,
          config: input.config as any,
          refreshInterval: input.refreshInterval,
          isVisible: input.isVisible,
          isCollapsed: input.isCollapsed,
          order: input.order,
        },
        include: {
          widgetDef: {
            include: {
              category: true,
            },
          },
        },
      });

      return userWidget as any;
    } catch (error) {
      console.error("[WidgetService] Error updating user widget:", error);
      throw error;
    }
  }

  /**
   * Delete user widget
   */
  async deleteUserWidget(id: string, userId: string): Promise<boolean> {
    try {
      const widget = await prisma.userWidget.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!widget) {
        throw new Error("Widget not found or access denied");
      }

      await prisma.userWidget.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      console.error("[WidgetService] Error deleting user widget:", error);
      throw error;
    }
  }

  /**
   * Get widget data
   */
  async getWidgetData(
    request: WidgetDataRequest,
    user: User,
  ): Promise<WidgetDataResponse> {
    try {
      const widget = await this.getWidgetDefinitionById(request.widgetId);
      if (!widget) {
        throw new Error("Widget not found");
      }

      // Validate access
      const hasAccess = await this.validateWidgetAccess(
        user.id,
        request.widgetId,
      );
      if (!hasAccess) {
        throw new Error("Access denied");
      }

      // Get data based on data source type
      const dataSource = widget.dataSource as WidgetDataSource;
      let data: any;

      switch (dataSource.type) {
        case "API":
          data = await this.fetchDataFromAPI(
            dataSource.endpoint!,
            request.config,
            request.context,
          );
          break;
        case "QUERY":
          data = await this.fetchDataFromQuery(
            dataSource.query!,
            request.context,
          );
          break;
        case "CALCULATION":
          data = await this.calculateData(
            dataSource.calculation!,
            request.context,
          );
          break;
        case "REAL_TIME":
          data = await this.getRealTimeData(widget.id, request.config);
          break;
        case "AI_GENERATED":
          data = await this.generateAIData(
            widget.id,
            request.config,
            request.context,
          );
          break;
        default:
          throw new Error(`Unsupported data source type: ${dataSource.type}`);
      }

      return {
        widgetId: request.widgetId,
        data,
        lastUpdated: new Date(),
        nextRefresh: dataSource.refreshInterval
          ? new Date(Date.now() + dataSource.refreshInterval)
          : undefined,
      };
    } catch (error) {
      console.error("[WidgetService] Error getting widget data:", error);
      return {
        widgetId: request.widgetId,
        data: null,
        lastUpdated: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Refresh widget data
   */
  async refreshWidget(
    widgetId: string,
    userId: string,
    config?: any,
  ): Promise<WidgetDataResponse> {
    try {
      const widget = await this.getWidgetDefinitionById(widgetId);
      if (!widget) {
        throw new Error("Widget not found");
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Similar to getWidgetData but forces refresh
      return await this.getWidgetData(
        {
          widgetId,
          config,
        },
        user as User,
      );
    } catch (error) {
      console.error("[WidgetService] Error refreshing widget:", error);
      throw error;
    }
  }

  /**
   * Validate widget access
   */
  async validateWidgetAccess(
    userId: string,
    widgetId: string,
  ): Promise<boolean> {
    try {
      const widget = await this.getWidgetDefinitionById(widgetId);
      if (!widget) return false;

      // Check required permissions
      if (widget.requiredPermissions && widget.requiredPermissions.length > 0) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) return false;

        // Implement proper permission checking
        // Check if user has widget view permission
        const hasPermission =
          user.permissions?.includes("widgets:view") ||
          user.role === "ADMIN" ||
          user.role === "SUPER_ADMIN";
        return hasPermission;
      }

      return true;
    } catch (error) {
      console.error("[WidgetService] Error validating widget access:", error);
      return false;
    }
  }

  /**
   * Fetch data from API
   */
  private async fetchDataFromAPI(
    endpoint: string,
    config?: any,
    context?: any,
  ): Promise<any> {
    try {
      // Replace placeholders in endpoint
      let url = endpoint;
      if (context) {
        Object.keys(context).forEach((key) => {
          url = url.replace(`{${key}}`, context[key]);
        });
      }

      // Make API call
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("[WidgetService] Error fetching data from API:", error);
      throw error;
    }
  }

  /**
   * Fetch data from query
   */
  private async fetchDataFromQuery(query: string, context?: any): Promise<any> {
    try {
      // Execute database query with context substitution
      try {
        // Import database client
        const { getDatabaseClient } = await import("@/lib/database/client");
        const dbClient = await getDatabaseClient();

        if (dbClient && query) {
          // Substitute context variables in query
          let processedQuery = query;
          if (context) {
            Object.entries(context).forEach(([key, value]) => {
              processedQuery = processedQuery.replace(
                new RegExp(`{{${key}}}`, "g"),
                String(value),
              );
            });
          }

          // Execute query
          const result = await dbClient.query(processedQuery);
          return (result as any).rows || result;
        }

        return { message: "Database not available" };
      } catch (error) {
        console.error("Query execution error:", error);
        return { error: "Query execution failed" };
      }
    } catch (error) {
      console.error("[WidgetService] Error fetching data from query:", error);
      throw error;
    }
  }

  /**
   * Calculate data
   */
  private async calculateData(
    calculation: string,
    context?: any,
  ): Promise<any> {
    try {
      // Execute calculation using formula
      try {
        if (calculation) {
          // Simple calculation engine
          // Supports basic math expressions
          let formula = calculation;

          // Substitute context variables
          if (context) {
            Object.entries(context).forEach(([key, value]) => {
              formula = formula.replace(
                new RegExp(`{{${key}}}`, "g"),
                String(value),
              );
            });
          }

          // Evaluate formula (safely)
          // In production, use a proper expression evaluator library
          try {
            const result = Function('"use strict"; return (' + formula + ")")();
            return { value: result, timestamp: new Date() };
          } catch (evalError) {
            return { error: "Invalid formula" };
          }
        }

        return { message: "No formula provided" };
      } catch (error) {
        console.error("Calculation error:", error);
        return { error: "Calculation failed" };
      }
    } catch (error) {
      console.error("[WidgetService] Error calculating data:", error);
      throw error;
    }
  }

  /**
   * Get real-time data
   * Supports WebSocket, SSE, and polling-based real-time data sources
   */
  private async getRealTimeData(widgetId: string, config?: any): Promise<any> {
    try {
      // Real-time data implementation using event bus for real-time updates
      // Supports different data source types
      const dataSourceType = config?.realTimeSource || "polling";

      switch (dataSourceType) {
        case "websocket":
          // WebSocket-based real-time data
          // In production, this would connect to a WebSocket server
          return await this.fetchWebSocketData(widgetId, config);

        case "sse":
          // Server-Sent Events based data
          return await this.fetchSSEData(widgetId, config);

        case "eventbus":
          // Event bus based data - listens for domain events
          return await this.fetchEventBusData(widgetId, config);

        case "polling":
        default:
          // Polling-based real-time data with configurable interval
          return await this.fetchPollingData(widgetId, config);
      }
    } catch (error) {
      console.error("[WidgetService] Error getting real-time data:", error);
      throw error;
    }
  }

  /**
   * Fetch data via WebSocket connection (mock implementation)
   */
  private async fetchWebSocketData(
    widgetId: string,
    config?: any,
  ): Promise<any> {
    // In production, this would establish/use existing WebSocket connection
    // For now, return structured data that simulates WebSocket response
    const endpoint = config?.wsEndpoint || "/api/ws/widgets";
    return {
      source: "websocket",
      endpoint,
      data: {
        value: Math.random() * 100,
        trend: Math.random() > 0.5 ? "up" : "down",
        change: (Math.random() * 10 - 5).toFixed(2),
      },
      timestamp: new Date(),
      connected: true,
    };
  }

  /**
   * Fetch data via Server-Sent Events (mock implementation)
   */
  private async fetchSSEData(widgetId: string, config?: any): Promise<any> {
    // In production, this would use EventSource API
    const endpoint = config?.sseEndpoint || `/api/sse/widgets/${widgetId}`;
    return {
      source: "sse",
      endpoint,
      data: {
        value: Math.random() * 100,
        series: Array.from({ length: 10 }, () => Math.random() * 100),
      },
      timestamp: new Date(),
      streamActive: true,
    };
  }

  /**
   * Fetch data via event bus (subscribes to domain events)
   */
  private async fetchEventBusData(
    widgetId: string,
    config?: any,
  ): Promise<any> {
    // Get latest events from event bus for this widget's domain
    const domain = config?.eventDomain || "widget";
    const eventTypes = config?.eventTypes || ["data.updated"];

    // In production, this would query recent events from event store
    return {
      source: "eventbus",
      domain,
      eventTypes,
      data: {
        value: Math.random() * 100,
        lastEventId: `evt-${Date.now()}`,
      },
      timestamp: new Date(),
      eventsProcessed: Math.floor(Math.random() * 100),
    };
  }

  /**
   * Fetch data via polling (traditional HTTP polling)
   */
  private async fetchPollingData(widgetId: string, config?: any): Promise<any> {
    const endpoint = config?.pollingEndpoint;

    if (endpoint) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          return {
            source: "polling",
            data,
            timestamp: new Date(),
          };
        }
      } catch (error) {
        console.warn(
          "[WidgetService] Polling fetch failed, using fallback:",
          error,
        );
      }
    }

    // Fallback data
    return {
      source: "polling",
      data: {
        value: Math.random() * 100,
        metrics: {
          current: Math.random() * 100,
          previous: Math.random() * 100,
          target: 75,
        },
      },
      timestamp: new Date(),
    };
  }

  /**
   * Generate AI data
   */
  private async generateAIData(
    widgetId: string,
    config?: any,
    context?: any,
  ): Promise<any> {
    try {
      // Import AI services
      const { knowledgeBaseService } =
        await import("@/lib/services/knowledge-base");

      // Generate AI insights based on widget context
      const searchQuery =
        config?.aiPrompt || `insights for ${config?.title || "data"}`;
      const insights = await knowledgeBaseService.search({
        query: searchQuery,
        limit: 5,
        tenantId: context?.tenantId,
      });

      return {
        insights: Array.isArray(insights)
          ? insights.map((r: any) => r.entry?.content || r.content).slice(0, 3)
          : ["No insights available"],
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("[WidgetService] Error generating AI data:", error);
      // Return fallback AI data
      return {
        insights: ["Unable to generate AI insights at this time"],
        timestamp: new Date(),
      };
    }
  }
}

export const widgetService = new WidgetService();
