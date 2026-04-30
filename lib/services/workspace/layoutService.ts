/**
 * Layout Service - Layout Template & Management
 *
 * Manages layout templates and layout operations
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { workspaceService } from "./workspaceService";
import type {
  LayoutTemplate,
  WorkspaceLayout,
  CreateWorkspaceLayoutInput,
} from "@/types/workspace";

export class LayoutService {
  private templates: Map<string, LayoutTemplate> = new Map();

  /**
   * Get layout template
   */
  async getTemplate(templateId: string): Promise<LayoutTemplate | null> {
    // Check in-memory templates first
    const template = this.templates.get(templateId);
    if (template) {
      return template;
    }

    // Check database for template layouts
    const layout = await prisma.workspaceLayout.findFirst({
      where: {
        id: templateId,
        isTemplate: true,
      },
      include: {
        userWidgets: {
          include: {
            widgetDef: true,
          },
        },
      },
    });

    if (!layout) {
      return null;
    }

    return {
      id: layout.id,
      name: layout.name,
      description: layout.description || "",
      category: layout.category || "general",
      widgets: layout.userWidgets.map((w) => ({
        widgetDefId: w.widgetDefId,
        position: w.position as any,
        config: w.config as any,
        refreshInterval: w.refreshInterval || undefined,
        isVisible: w.isVisible,
        isCollapsed: w.isCollapsed,
        order: w.order,
      })),
    };
  }

  /**
   * Create layout from template
   */
  async createLayoutFromTemplate(
    templateId: string,
    userId: string,
    customizations?: Partial<any>[],
  ): Promise<WorkspaceLayout> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Apply customizations if provided
    const widgets = template.widgets.map((widget, index) => ({
      ...widget,
      ...(customizations?.[index] || {}),
    }));

    return await workspaceService.saveLayout(userId, {
      name: template.name,
      description: template.description,
      widgets,
      isDefault: false,
      isTemplate: false,
      category: template.category,
    });
  }

  /**
   * Get layout templates
   */
  async getLayoutTemplates(
    role?: string,
    modules?: string[],
  ): Promise<LayoutTemplate[]> {
    // Get templates from database
    const layouts = await prisma.workspaceLayout.findMany({
      where: {
        isTemplate: true,
      },
      include: {
        userWidgets: {
          include: {
            widgetDef: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by role/modules if provided
    let filteredLayouts = layouts;

    if (role) {
      // Filter layouts that match the user's role or are universal
      filteredLayouts = filteredLayouts.filter((layout) => {
        const layoutMetadata = layout.metadata as any;
        const allowedRoles = layoutMetadata?.allowedRoles;
        if (!allowedRoles || allowedRoles.length === 0) {
          return true; // No role restriction, show to all
        }
        return allowedRoles.includes(role) || allowedRoles.includes("ALL");
      });
    }

    if (modules && modules.length > 0) {
      // Filter layouts that contain widgets from the specified modules
      filteredLayouts = filteredLayouts.filter((layout) => {
        const layoutModules = layout.userWidgets
          .map((w) => w.widgetDef?.moduleId)
          .filter(Boolean);

        // Include layout if it has no module-specific widgets or matches requested modules
        if (layoutModules.length === 0) {
          return true; // Universal layout
        }

        return layoutModules.some((moduleId) =>
          modules.includes(moduleId || ""),
        );
      });
    }

    return filteredLayouts.map((layout) => ({
      id: layout.id,
      name: layout.name,
      description: layout.description || "",
      category: layout.category || "general",
      widgets: layout.userWidgets.map((w) => ({
        widgetDefId: w.widgetDefId,
        position: w.position as any,
        config: w.config as any,
        refreshInterval: w.refreshInterval || undefined,
        isVisible: w.isVisible,
        isCollapsed: w.isCollapsed,
        order: w.order,
      })),
    }));
  }

  /**
   * Register template
   */
  registerTemplate(template: LayoutTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Validate layout structure
   */
  async validateLayout(
    layout: CreateWorkspaceLayoutInput,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required fields
    if (!layout.name || layout.name.trim().length === 0) {
      errors.push("Layout name is required");
    }

    // Validate widgets
    if (layout.widgets) {
      for (const widget of layout.widgets) {
        // Check widget definition exists
        const widgetDef = await prisma.widgetDefinition.findUnique({
          where: { id: widget.widgetDefId },
        });

        if (!widgetDef) {
          errors.push(`Widget definition ${widget.widgetDefId} not found`);
          continue;
        }

        // Validate position
        if (!widget.position) {
          errors.push(`Widget ${widget.widgetDefId} missing position`);
        } else {
          const pos = widget.position as any;
          if (pos.x < 0 || pos.y < 0 || pos.w < 1 || pos.h < 1) {
            errors.push(`Widget ${widget.widgetDefId} has invalid position`);
          }

          // Check size constraints
          const defaultSize = widgetDef.defaultSize as any;
          if (
            pos.w < (defaultSize.minWidth || 1) ||
            pos.w > (defaultSize.maxWidth || 12)
          ) {
            errors.push(`Widget ${widget.widgetDefId} width out of bounds`);
          }
          if (
            pos.h < (defaultSize.minHeight || 1) ||
            pos.h > (defaultSize.maxHeight || 20)
          ) {
            errors.push(`Widget ${widget.widgetDefId} height out of bounds`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const layoutService = new LayoutService();
