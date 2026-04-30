/**
 * 🚀 VIEW CONTEXT SERVICE
 *
 * Enhanced ViewContext management with hierarchical customer support
 * Integrates with user management system for dynamic context resolution
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { userService } from "./userService";
import type { ViewContext, CustomerFilter } from "@/types/viewContext";
import type { User } from "@/types/user";

// ============================================================================
// VIEW CONTEXT SERVICE
// ============================================================================

class ViewContextService {
  /**
   * Build ViewContext for user with hierarchical customer support
   */
  async buildViewContext(userId: string): Promise<ViewContext> {
    try {
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Get user's customer assignments (hierarchical)
      const customerAssignments =
        await userService.getUserCustomerAssignments(userId);
      const visibleCustomers =
        await userService.getUserVisibleCustomers(userId);

      // Build customer filter from assignments
      const customerFilter: CustomerFilter = {
        type: customerAssignments.length > 0 ? "ASSIGNED" : "ALL",
        customerIds: customerAssignments.map((a) => a.customerId),
        subCustomerIds: customerAssignments
          .filter((a) => a.subCustomerId)
          .map((a) => a.subCustomerId!),
        includeSubCustomers: true, // Include sub-customers by default
      };

      // Get user data visibility rules
      const userDataVisibility =
        customerAssignments.length > 0
          ? await this.getUserDataVisibilityForContext(
              userId,
              customerAssignments[0].customerId,
              customerAssignments[0].subCustomerId,
            )
          : undefined;

      // Build ViewContext
      const viewContext: ViewContext = {
        userId: user.id,
        userRole: user.role,
        tenantId: user.tenantId,
        customerFilter,
        warehouseFilter: {
          type:
            user.assignedWarehouses && user.assignedWarehouses.length > 0
              ? "ASSIGNED"
              : "ALL",
          warehouseIds: user.assignedWarehouses || [],
        },
        userDataVisibility,
        level: this.determineViewLevel(user),
        scope: this.determineViewScope(user),
        includeInactive: false,
        includeHistorical: false,
        lastUpdated: new Date(),
      };

      return viewContext;
    } catch (error) {
      console.error("[ViewContextService] Error building view context:", error);
      throw error;
    }
  }

  /**
   * Get user data visibility for specific customer/sub-customer
   */
  async getUserDataVisibilityForContext(
    userId: string,
    customerId: string,
    subCustomerId?: string,
  ): Promise<ViewContext["userDataVisibility"]> {
    try {
      const visibility = await userService.getUserDataVisibility(
        userId,
        customerId,
        subCustomerId,
      );
      if (!visibility) {
        return undefined;
      }

      return {
        showOnlyAssignedData: visibility.showOnlyAssignedData || false,
        customFields: visibility.customFields || [],
        hiddenFields: visibility.hiddenFields || [],
        dateRange: visibility.dateRange || undefined,
      };
    } catch (error) {
      console.error(
        "[ViewContextService] Error getting user data visibility:",
        error,
      );
      return undefined;
    }
  }

  /**
   * Apply ViewContext filters to query
   */
  applyViewContextToQuery<
    T extends {
      customerId?: string;
      subCustomerId?: string;
      warehouseId?: string;
      tenantId?: string;
    },
  >(query: any, context: ViewContext): any {
    // Apply tenant filter
    if (context.tenantId) {
      query.where = {
        ...query.where,
        tenantId: context.tenantId,
      };
    }

    // Apply customer filter
    if (
      context.customerFilter.type === "ASSIGNED" &&
      context.customerFilter.customerIds
    ) {
      query.where = {
        ...query.where,
        customerId: {
          in: context.customerFilter.customerIds,
        },
      };

      // Include sub-customers if specified
      if (context.customerFilter.includeSubCustomers) {
        // This would need to be handled with OR conditions or a subquery
        // For now, we'll include sub-customer IDs if provided
        if (
          context.customerFilter.subCustomerIds &&
          context.customerFilter.subCustomerIds.length > 0
        ) {
          query.where = {
            ...query.where,
            OR: [
              { customerId: { in: context.customerFilter.customerIds } },
              { subCustomerId: { in: context.customerFilter.subCustomerIds } },
            ],
          };
        }
      }
    } else if (
      context.customerFilter.type === "SINGLE" &&
      context.customerFilter.customerIds?.[0]
    ) {
      query.where = {
        ...query.where,
        customerId: context.customerFilter.customerIds[0],
      };
    } else if (
      context.customerFilter.type === "MULTIPLE" &&
      context.customerFilter.customerIds
    ) {
      query.where = {
        ...query.where,
        customerId: { in: context.customerFilter.customerIds },
      };
    }

    // Apply warehouse filter
    if (
      context.warehouseFilter.type === "ASSIGNED" &&
      context.warehouseFilter.warehouseIds
    ) {
      query.where = {
        ...query.where,
        warehouseId: { in: context.warehouseFilter.warehouseIds },
      };
    }

    // Apply user data visibility
    if (context.userDataVisibility) {
      if (context.userDataVisibility.showOnlyAssignedData) {
        // Add filter for assigned data only
        query.where = {
          ...query.where,
          assignedToUserId: context.userId,
        };
      }

      if (context.userDataVisibility.dateRange) {
        query.where = {
          ...query.where,
          createdAt: {
            gte: context.userDataVisibility.dateRange.start,
            lte: context.userDataVisibility.dateRange.end,
          },
        };
      }
    }

    return query;
  }

  /**
   * Determine view level based on user role and assignments
   */
  private determineViewLevel(user: User): ViewContext["level"] {
    if (user.role === "SYSTEM_ADMIN") {
      return "SYSTEM";
    }

    if (user.assignedCustomers && user.assignedCustomers.length > 0) {
      if (user.assignedWarehouses && user.assignedWarehouses.length > 0) {
        return "COMBINED";
      }
      return "CUSTOMER";
    }

    if (user.assignedWarehouses && user.assignedWarehouses.length > 0) {
      return "WAREHOUSE";
    }

    return "TENANT";
  }

  /**
   * Determine view scope based on user assignments
   */
  private determineViewScope(user: User): ViewContext["scope"] {
    const customerCount = user.assignedCustomers?.length || 0;
    const warehouseCount = user.assignedWarehouses?.length || 0;

    if (customerCount === 0 && warehouseCount === 0) {
      return "ALL";
    }

    if (customerCount === 1 && warehouseCount <= 1) {
      return "SINGLE";
    }

    if (customerCount > 1 || warehouseCount > 1) {
      return "MULTIPLE";
    }

    return "COMBINED";
  }

  /**
   * Update ViewContext with user's current assignments
   */
  async refreshViewContext(
    userId: string,
    currentContext?: ViewContext,
  ): Promise<ViewContext> {
    try {
      const newContext = await this.buildViewContext(userId);

      // Preserve user preferences from current context
      if (currentContext) {
        return {
          ...newContext,
          dateRange: currentContext.dateRange,
          includeInactive: currentContext.includeInactive,
          includeHistorical: currentContext.includeHistorical,
          groupBy: currentContext.groupBy,
          sortBy: currentContext.sortBy,
          saved: currentContext.saved,
          savedName: currentContext.savedName,
        };
      }

      return newContext;
    } catch (error) {
      console.error(
        "[ViewContextService] Error refreshing view context:",
        error,
      );
      throw error;
    }
  }
}

// Export singleton instance
export const viewContextService = new ViewContextService();
