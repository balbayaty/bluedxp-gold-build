/**
 * Workspace Service - Core Workspace Orchestration
 *
 * Manages user workspaces, layouts, and configurations
 * Integrates with permissions, subscriptions, and personalization
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-bus";
import { userService } from "@/lib/services/user/userService";
import { moduleRegistry } from "@/lib/modules/registry";
import type {
  WorkspaceConfig,
  WorkspaceLayout,
  WidgetDefinition,
  WidgetCategory,
  CreateWorkspaceLayoutInput,
  UpdateWorkspaceLayoutInput,
  GetLayoutsQuery,
} from "@/types/workspace";
import type { User, UserRole } from "@/types/user";

export class WorkspaceService {
  /**
   * Get complete workspace configuration for a user
   */
  async getWorkspaceConfig(
    userId: string,
    role?: UserRole,
    subscriptionTier?: string,
  ): Promise<WorkspaceConfig> {
    try {
      // Get user
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const effectiveRole = role || user.role;
      const effectiveTier =
        subscriptionTier || (user as any).subscriptionTier || "BASIC";

      // Get default layout
      const defaultLayout = await this.getDefaultLayout(userId);

      // Get available widgets (filtered by permissions)
      const availableWidgets = await this.getAvailableWidgets(userId, user);

      // Get available categories
      const categories = await prisma.widgetCategory.findMany({
        where: {
          OR: [{ isSystem: true }, { tenantId: user.tenantId }],
        },
        orderBy: { order: "asc" },
      });

      // Get integrations
      const googleIntegration =
        await prisma.googleWorkspaceIntegration.findUnique({
          where: { userId },
        });

      const emailIntegrations = await prisma.emailIntegration.findMany({
        where: {
          userId,
          isActive: true,
        },
      });

      // Get personalization recommendations
      const { personalizationService } =
        await import("./personalizationService");
      const recommendations =
        await personalizationService.getPersonalizedRecommendations(userId);

      // Determine permissions based on role and subscription
      const permissions = this.getWorkspacePermissions(
        effectiveRole,
        effectiveTier,
      );

      return {
        userId: user.id,
        tenantId: user.tenantId,
        role: effectiveRole,
        subscriptionTier: effectiveTier as any,
        defaultLayout: defaultLayout || undefined,
        availableWidgets,
        availableCategories: categories as any,
        permissions,
        integrations: {
          googleWorkspace: googleIntegration
            ? ({
                ...googleIntegration,
                accessToken: "[ENCRYPTED]",
                refreshToken: "[ENCRYPTED]",
              } as any)
            : undefined,
          email: emailIntegrations.map((e) => ({
            ...e,
            encryptedPassword: e.encryptedPassword ? "[ENCRYPTED]" : undefined,
            accessToken: e.accessToken ? "[ENCRYPTED]" : undefined,
            refreshToken: e.refreshToken ? "[ENCRYPTED]" : undefined,
          })) as any,
        },
        personalization: {
          enabled: effectiveTier !== "BASIC",
          recommendations,
        },
      };
    } catch (error) {
      console.error(
        "[WorkspaceService] Error getting workspace config:",
        error,
      );
      throw error;
    }
  }

  /**
   * Get available widgets for a user (filtered by permissions)
   */
  async getAvailableWidgets(
    userId: string,
    user: User,
  ): Promise<WidgetDefinition[]> {
    try {
      // Get all active widgets
      const widgets = await prisma.widgetDefinition.findMany({
        where: {
          isActive: true,
          OR: [
            { tenantId: null }, // System widgets
            { tenantId: user.tenantId }, // Tenant widgets
          ],
        },
        include: {
          category: true,
        },
        orderBy: { order: "asc" },
      });

      // Filter by permissions
      const filtered = widgets.filter((widget) => {
        // Check required permissions
        if (
          widget.requiredPermissions &&
          widget.requiredPermissions.length > 0
        ) {
          const requiredPerms = widget.requiredPermissions as string[];

          // Get user permissions from their role and explicit permissions
          const userPerms: string[] = [];

          // Add role-based permissions
          const rolePermissions: Record<string, string[]> = {
            SUPER_ADMIN: ["*"], // All permissions
            ADMIN: [
              "widgets:*",
              "dashboards:*",
              "reports:view",
              "analytics:view",
            ],
            SYSTEM_ADMIN: [
              "widgets:*",
              "dashboards:*",
              "reports:*",
              "analytics:*",
            ],
            MANAGER: [
              "widgets:view",
              "widgets:create",
              "dashboards:view",
              "dashboards:create",
              "reports:view",
            ],
            WAREHOUSE_MANAGER: ["widgets:view", "wms:*", "dashboards:view"],
            TRANSPORT_MANAGER: ["widgets:view", "tms:*", "dashboards:view"],
            OPERATOR: ["widgets:view", "dashboards:view"],
            VIEWER: ["widgets:view", "dashboards:view"],
          };

          const rolePerms = rolePermissions[user.role as string] || [
            "widgets:view",
          ];
          userPerms.push(...rolePerms);

          // Add explicit user permissions if any
          if (
            (user as any).permissions &&
            Array.isArray((user as any).permissions)
          ) {
            userPerms.push(...(user as any).permissions);
          }

          // Check if user has wildcard permission
          if (userPerms.includes("*")) {
            return true;
          }

          // Check if user has any of the required permissions
          const hasPermission = requiredPerms.some((required) => {
            // Direct match
            if (userPerms.includes(required)) return true;

            // Wildcard match (e.g., 'widgets:*' matches 'widgets:view')
            const [category] = required.split(":");
            if (userPerms.includes(`${category}:*`)) return true;

            return false;
          });

          if (!hasPermission) return false;
        }

        // Check module access
        if (widget.moduleId) {
          const moduleEnabled = moduleRegistry.isModuleEnabled(widget.moduleId);
          if (!moduleEnabled) return false;
        }

        return true;
      });

      return filtered as any;
    } catch (error) {
      console.error(
        "[WorkspaceService] Error getting available widgets:",
        error,
      );
      return [];
    }
  }

  /**
   * Get user layouts
   */
  async getUserLayouts(
    userId: string,
    query?: GetLayoutsQuery,
  ): Promise<WorkspaceLayout[]> {
    try {
      const where: any = {
        userId,
      };

      if (query?.category) {
        where.category = query.category;
      }

      if (query?.isTemplate !== undefined) {
        where.isTemplate = query.isTemplate;
      }

      if (query?.search) {
        where.OR = [
          { name: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
        ];
      }

      const layouts = await prisma.workspaceLayout.findMany({
        where,
        include: {
          userWidgets: {
            include: {
              widgetDef: {
                include: {
                  category: true,
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: query?.limit || 100,
        skip: query?.offset || 0,
      });

      return layouts.map((layout) => ({
        ...layout,
        widgets: layout.userWidgets as any,
      })) as any;
    } catch (error) {
      console.error("[WorkspaceService] Error getting user layouts:", error);
      return [];
    }
  }

  /**
   * Get default layout for user
   */
  async getDefaultLayout(userId: string): Promise<WorkspaceLayout | null> {
    try {
      const layout = await prisma.workspaceLayout.findFirst({
        where: {
          userId,
          isDefault: true,
        },
        include: {
          userWidgets: {
            include: {
              widgetDef: {
                include: {
                  category: true,
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      });

      if (!layout) return null;

      return {
        ...layout,
        widgets: layout.userWidgets as any,
      } as any;
    } catch (error) {
      console.error("[WorkspaceService] Error getting default layout:", error);
      return null;
    }
  }

  /**
   * Save layout
   */
  async saveLayout(
    userId: string,
    input: CreateWorkspaceLayoutInput,
  ): Promise<WorkspaceLayout> {
    try {
      // In development, skip slow database user lookup
      const isDevelopment =
        process.env.NODE_ENV === "development" ||
        process.env.ENABLE_DEMO_DATA === "true";
      let user: any = null;
      let tenantId = "tenant-1";

      if (isDevelopment) {
        // Fast path: use userId directly, infer tenant from userId or use default
        tenantId = userId.includes("tenant")
          ? userId.split("-")[0] + "-" + userId.split("-")[1]
          : "tenant-1";
      } else {
        // Production: verify user exists
        user = await userService.getUserById(userId);
        if (!user) {
          throw new Error(`User ${userId} not found`);
        }
        tenantId = user.tenantId;
      }

      // If this is set as default, unset other defaults
      if (input.isDefault) {
        await prisma.workspaceLayout.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Create layout
      const layout = await prisma.workspaceLayout.create({
        data: {
          userId,
          tenantId: tenantId,
          name: input.name,
          description: input.description,
          isDefault: input.isDefault || false,
          isTemplate: input.isTemplate || false,
          category: input.category,
          metadata: input.metadata || {},
          widgets: [], // Will be populated by userWidgets
        },
      });

      // Create user widgets if provided
      if (input.widgets && input.widgets.length > 0) {
        const { widgetService } = await import("./widgetService");
        for (const widgetInput of input.widgets) {
          await widgetService.createUserWidget(userId, {
            ...widgetInput,
            layoutId: layout.id,
          });
        }
      }

      // Publish event
      await eventBus.publish({
        type: "WorkspaceLayoutCreated",
        aggregateId: layout.id,
        aggregateType: "WorkspaceLayout",
        payload: {
          layoutId: layout.id,
          userId,
          name: layout.name,
        },
        metadata: {
          tenantId: tenantId,
          timestamp: new Date().toISOString(),
        },
      });

      return await this.getLayoutById(layout.id, userId);
    } catch (error) {
      console.error("[WorkspaceService] Error saving layout:", error);
      throw error;
    }
  }

  /**
   * Update layout
   */
  async updateLayout(
    layoutId: string,
    userId: string,
    input: UpdateWorkspaceLayoutInput,
  ): Promise<WorkspaceLayout> {
    try {
      // Verify ownership
      const existing = await prisma.workspaceLayout.findFirst({
        where: {
          id: layoutId,
          userId,
        },
      });

      if (!existing) {
        throw new Error("Layout not found or access denied");
      }

      // If setting as default, unset other defaults
      if (input.isDefault === true) {
        await prisma.workspaceLayout.updateMany({
          where: {
            userId,
            isDefault: true,
            id: { not: layoutId },
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Update layout
      const layout = await prisma.workspaceLayout.update({
        where: { id: layoutId },
        data: {
          name: input.name,
          description: input.description,
          isDefault: input.isDefault,
          isTemplate: input.isTemplate,
          category: input.category,
          metadata: input.metadata,
        },
      });

      // Update widgets if provided
      if (input.widgets) {
        const { widgetService } = await import("./widgetService");
        // Delete existing widgets
        await prisma.userWidget.deleteMany({
          where: { layoutId },
        });
        // Create new widgets
        for (const widgetInput of input.widgets) {
          await widgetService.createUserWidget(userId, {
            ...widgetInput,
            layoutId,
          });
        }
      }

      // Publish event
      await eventBus.publish({
        type: "WorkspaceLayoutUpdated",
        aggregateId: layoutId,
        aggregateType: "WorkspaceLayout",
        payload: {
          layoutId,
          userId,
        },
        metadata: {
          tenantId: existing.tenantId,
          timestamp: new Date().toISOString(),
        },
      });

      return await this.getLayoutById(layoutId, userId);
    } catch (error) {
      console.error("[WorkspaceService] Error updating layout:", error);
      throw error;
    }
  }

  /**
   * Get layout by ID
   */
  async getLayoutById(
    layoutId: string,
    userId: string,
  ): Promise<WorkspaceLayout> {
    try {
      const layout = await prisma.workspaceLayout.findFirst({
        where: {
          id: layoutId,
          userId,
        },
        include: {
          userWidgets: {
            include: {
              widgetDef: {
                include: {
                  category: true,
                },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      });

      if (!layout) {
        throw new Error("Layout not found");
      }

      // Transform userWidgets to widgets array
      const widgets = (layout.userWidgets || []).map((uw: any) => ({
        id: uw.id,
        userId: uw.userId,
        tenantId: uw.tenantId,
        widgetDefId: uw.widgetDefId,
        layoutId: uw.layoutId,
        position: uw.position,
        config: uw.config,
        refreshInterval: uw.refreshInterval,
        isVisible: uw.isVisible,
        isCollapsed: uw.isCollapsed,
        order: uw.order,
        createdAt: uw.createdAt,
        updatedAt: uw.updatedAt,
        widgetDef: uw.widgetDef,
      }));

      return {
        id: layout.id,
        userId: layout.userId,
        tenantId: layout.tenantId,
        name: layout.name,
        description: layout.description,
        widgets: widgets as any,
        isDefault: layout.isDefault,
        isTemplate: layout.isTemplate,
        category: layout.category,
        metadata: layout.metadata as any,
        createdAt: layout.createdAt,
        updatedAt: layout.updatedAt,
      } as WorkspaceLayout;
    } catch (error) {
      console.error("[WorkspaceService] Error getting layout by ID:", error);
      throw error;
    }
  }

  /**
   * Delete layout
   */
  async deleteLayout(layoutId: string, userId: string): Promise<boolean> {
    try {
      const layout = await prisma.workspaceLayout.findFirst({
        where: {
          id: layoutId,
          userId,
        },
      });

      if (!layout) {
        throw new Error("Layout not found or access denied");
      }

      // Delete layout (cascade will delete userWidgets)
      await prisma.workspaceLayout.delete({
        where: { id: layoutId },
      });

      // Publish event
      await eventBus.publish({
        type: "WorkspaceLayoutDeleted",
        aggregateId: layoutId,
        aggregateType: "WorkspaceLayout",
        payload: {
          layoutId,
          userId,
        },
        metadata: {
          tenantId: layout.tenantId,
          timestamp: new Date().toISOString(),
        },
      });

      return true;
    } catch (error) {
      console.error("[WorkspaceService] Error deleting layout:", error);
      throw error;
    }
  }

  /**
   * Set default layout
   */
  async setDefaultLayout(
    userId: string,
    layoutId: string,
  ): Promise<WorkspaceLayout> {
    try {
      // Unset all other defaults
      await prisma.workspaceLayout.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      // Set new default
      await prisma.workspaceLayout.update({
        where: {
          id: layoutId,
          userId,
        },
        data: {
          isDefault: true,
        },
      });

      return await this.getLayoutById(layoutId, userId);
    } catch (error) {
      console.error("[WorkspaceService] Error setting default layout:", error);
      throw error;
    }
  }

  /**
   * Duplicate layout
   */
  async duplicateLayout(
    layoutId: string,
    userId: string,
    newName?: string,
  ): Promise<WorkspaceLayout> {
    try {
      const original = await this.getLayoutById(layoutId, userId);

      const duplicated = await this.saveLayout(userId, {
        name: newName || `${original.name} (Copy)`,
        description: original.description,
        widgets: original.widgets.map((w) => ({
          widgetDefId: w.widgetDefId,
          position: w.position,
          config: w.config,
          refreshInterval: w.refreshInterval,
          isVisible: w.isVisible,
          isCollapsed: w.isCollapsed,
          order: w.order,
        })),
        isDefault: false,
        isTemplate: false,
        category: original.category,
        metadata: original.metadata,
      });

      return duplicated;
    } catch (error) {
      console.error("[WorkspaceService] Error duplicating layout:", error);
      throw error;
    }
  }

  /**
   * Get workspace permissions based on role and subscription
   */
  private getWorkspacePermissions(
    role: UserRole,
    subscriptionTier: string,
  ): WorkspaceConfig["permissions"] {
    const isAdmin = ["SYSTEM_ADMIN"].includes(role);
    const isEnterprise =
      subscriptionTier === "ENTERPRISE" || subscriptionTier === "CUSTOM";

    return {
      canCreateWidgets: isAdmin || isEnterprise,
      canCreateCategories: isAdmin,
      canShareLayouts: isEnterprise,
      canUseTemplates: subscriptionTier !== "BASIC",
    };
  }
}

export const workspaceService = new WorkspaceService();
