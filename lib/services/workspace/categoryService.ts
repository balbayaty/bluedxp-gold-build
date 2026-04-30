/**
 * Category Service - Dynamic Widget Category Management
 *
 * Manages widget categories with system defaults and custom categories
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus } from "@/lib/services/event-bus";
import type {
  WidgetCategory,
  CreateWidgetCategoryInput,
  UpdateWidgetCategoryInput,
} from "@/types/workspace";

export class CategoryService {
  /**
   * Get all categories
   */
  async getCategories(
    includeSystem: boolean = true,
    tenantId?: string,
  ): Promise<WidgetCategory[]> {
    try {
      const where: any = {};

      if (!includeSystem) {
        where.isSystem = false;
      }

      if (tenantId) {
        where.OR = [{ isSystem: true }, { tenantId }];
      }

      const categories = await prisma.widgetCategory.findMany({
        where,
        orderBy: { order: "asc" },
      });

      return categories as any;
    } catch (error) {
      console.error("[CategoryService] Error getting categories:", error);
      return [];
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<WidgetCategory | null> {
    try {
      const category = await prisma.widgetCategory.findUnique({
        where: { id },
      });

      return (category as any) || null;
    } catch (error) {
      console.error("[CategoryService] Error getting category:", error);
      return null;
    }
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<WidgetCategory | null> {
    try {
      const category = await prisma.widgetCategory.findUnique({
        where: { slug },
      });

      return (category as any) || null;
    } catch (error) {
      console.error("[CategoryService] Error getting category by slug:", error);
      return null;
    }
  }

  /**
   * Create category
   */
  async createCategory(
    input: CreateWidgetCategoryInput,
    userId: string,
  ): Promise<WidgetCategory> {
    try {
      // Generate slug from name
      const slug = this.generateSlug(input.name);

      // Check if slug already exists
      const existing = await prisma.widgetCategory.findUnique({
        where: { slug },
      });

      if (existing) {
        throw new Error(`Category with slug "${slug}" already exists`);
      }

      // Get max order for tenant
      const maxOrder = await prisma.widgetCategory.findFirst({
        where: {
          OR: [{ isSystem: true }, { tenantId: input.tenantId }],
        },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const category = await prisma.widgetCategory.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          icon: input.icon,
          color: input.color,
          order: input.order ?? (maxOrder ? maxOrder.order + 1 : 0),
          isSystem: false,
          tenantId: input.tenantId,
          createdBy: userId,
        },
      });

      // Publish event
      await eventBus.publish({
        type: "WidgetCategoryCreated",
        aggregateId: category.id,
        aggregateType: "WidgetCategory",
        payload: {
          categoryId: category.id,
          name: category.name,
          createdBy: userId,
        },
        metadata: {
          tenantId: input.tenantId,
          timestamp: new Date().toISOString(),
        },
      });

      return category as any;
    } catch (error) {
      console.error("[CategoryService] Error creating category:", error);
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(
    id: string,
    input: UpdateWidgetCategoryInput,
  ): Promise<WidgetCategory> {
    try {
      const category = await prisma.widgetCategory.findUnique({
        where: { id },
      });

      if (!category) {
        throw new Error("Category not found");
      }

      // Prevent updating system categories (except order)
      if (category.isSystem && input.name) {
        throw new Error("Cannot update name of system category");
      }

      const updateData: any = { ...input };

      // If name changed, update slug
      if (input.name && input.name !== category.name) {
        updateData.slug = this.generateSlug(input.name);
      }

      const updated = await prisma.widgetCategory.update({
        where: { id },
        data: updateData,
      });

      // Publish event
      await eventBus.publish({
        type: "WidgetCategoryUpdated",
        aggregateId: id,
        aggregateType: "WidgetCategory",
        payload: {
          categoryId: id,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });

      return updated as any;
    } catch (error) {
      console.error("[CategoryService] Error updating category:", error);
      throw error;
    }
  }

  /**
   * Delete category (non-system only)
   */
  async deleteCategory(id: string): Promise<boolean> {
    try {
      const category = await prisma.widgetCategory.findUnique({
        where: { id },
      });

      if (!category) {
        throw new Error("Category not found");
      }

      if (category.isSystem) {
        throw new Error("Cannot delete system category");
      }

      // Check if category has widgets
      const widgetCount = await prisma.widgetDefinition.count({
        where: { categoryId: id },
      });

      if (widgetCount > 0) {
        throw new Error(
          `Cannot delete category with ${widgetCount} widgets. Please move or delete widgets first.`,
        );
      }

      await prisma.widgetCategory.delete({
        where: { id },
      });

      // Publish event
      await eventBus.publish({
        type: "WidgetCategoryDeleted",
        aggregateId: id,
        aggregateType: "WidgetCategory",
        payload: {
          categoryId: id,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });

      return true;
    } catch (error) {
      console.error("[CategoryService] Error deleting category:", error);
      throw error;
    }
  }

  /**
   * Reorder categories
   */
  async reorderCategories(orderMap: Record<string, number>): Promise<boolean> {
    try {
      // Update all categories in a transaction
      await prisma.$transaction(
        Object.entries(orderMap).map(([id, order]) =>
          prisma.widgetCategory.update({
            where: { id },
            data: { order },
          }),
        ),
      );

      return true;
    } catch (error) {
      console.error("[CategoryService] Error reordering categories:", error);
      throw error;
    }
  }

  /**
   * Generate slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }
}

export const categoryService = new CategoryService();
