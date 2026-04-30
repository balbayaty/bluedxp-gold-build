/**
 * 🚀 CUSTOMER HIERARCHY SERVICE
 *
 * Manages hierarchical customer relationships (parent → sub-customers)
 * Supports multi-level customer hierarchies for 3PL/4PL scenarios
 *
 * Features:
 * - Customer hierarchy management
 * - Sub-customer creation and management
 * - User visibility based on hierarchy
 * - Hierarchical data filtering
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus, createEvent } from "@/lib/services/event-bus";
import type { Customer } from "@/types/tenant";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateCustomerInput {
  tenantId: string;
  parentCustomerId?: string;
  customerNumber: string;
  customerName: string;
  type: "3PL_CLIENT" | "4PL_CLIENT";
  serviceTier?: "PLATINUM" | "GOLD" | "SILVER" | "BRONZE" | "STANDARD";
  status?: "ACTIVE" | "SUSPENDED" | "TERMINATED" | "ONBOARDING" | "AT_RISK";
  [key: string]: any; // Allow other customer fields
}

// ============================================================================
// CUSTOMER HIERARCHY SERVICE
// ============================================================================

class CustomerHierarchyService {
  /**
   * Get customer with full hierarchy (including all sub-customers)
   */
  async getCustomerHierarchy(
    tenantId: string,
    customerId: string,
  ): Promise<Customer | null> {
    try {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          tenantId,
        },
        include: {
          children: {
            include: {
              children: true, // Recursive: get sub-customers of sub-customers
            },
          },
        },
      });

      if (!customer) return null;

      return this.mapDatabaseCustomerToCustomer(customer);
    } catch (error) {
      console.error(
        "[CustomerHierarchyService] Error getting customer hierarchy:",
        error,
      );
      throw error;
    }
  }

  /**
   * Get all sub-customers for a customer
   */
  async getSubCustomers(customerId: string): Promise<Customer[]> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          children: {
            include: {
              children: true, // Recursive
            },
          },
        },
      });

      if (!customer) return [];

      // Flatten hierarchy
      const flattenSubCustomers = (parent: any): Customer[] => {
        const result: Customer[] = [];
        if (parent.children) {
          for (const child of parent.children) {
            result.push(this.mapDatabaseCustomerToCustomer(child));
            result.push(...flattenSubCustomers(child));
          }
        }
        return result;
      };

      return flattenSubCustomers(customer);
    } catch (error) {
      console.error(
        "[CustomerHierarchyService] Error getting sub-customers:",
        error,
      );
      throw error;
    }
  }

  /**
   * Create sub-customer
   */
  async createSubCustomer(
    parentCustomerId: string,
    input: CreateCustomerInput,
  ): Promise<Customer> {
    try {
      // Verify parent exists
      const parent = await prisma.customer.findUnique({
        where: { id: parentCustomerId },
      });

      if (!parent) {
        throw new Error(`Parent customer ${parentCustomerId} not found`);
      }

      // Create sub-customer using correct field names from Prisma schema
      const subCustomer = await prisma.customer.create({
        data: {
          tenantId: parent.tenantId,
          parentId: parentCustomerId,
          code: input.customerNumber || `SC-${Date.now()}`,
          name: input.customerName,
          type: input.type || "SUBSIDIARY",
          status: input.status || "ACTIVE",
        },
      });

      // Publish event using createEvent for proper structure
      await eventBus.publish(
        createEvent(
          "SubCustomerCreated",
          subCustomer.id,
          "Customer",
          {
            customerId: subCustomer.id,
            parentCustomerId,
            customerName: subCustomer.name,
          },
          1,
          {
            tenantId: subCustomer.tenantId,
            correlationId: `subcustomer-create-${subCustomer.id}-${Date.now()}`,
            schemaVersion: 1,
          },
        ),
      );

      return this.mapDatabaseCustomerToCustomer(subCustomer);
    } catch (error) {
      console.error(
        "[CustomerHierarchyService] Error creating sub-customer:",
        error,
      );
      throw error;
    }
  }

  /**
   * Move customer to different parent (or make it top-level)
   */
  async moveCustomer(
    customerId: string,
    newParentId: string | null,
  ): Promise<Customer> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error(`Customer ${customerId} not found`);
      }

      // Prevent circular reference
      if (newParentId) {
        const newParent = await this.getCustomerHierarchy(
          customer.tenantId,
          newParentId,
        );
        if (!newParent) {
          throw new Error(`New parent customer ${newParentId} not found`);
        }

        // Check if new parent is a descendant of this customer (would create cycle)
        const descendants = await this.getSubCustomers(customerId);
        if (descendants.some((d) => d.id === newParentId)) {
          throw new Error(
            "Cannot move customer: would create circular reference",
          );
        }
      }

      // Update parent
      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: {
          parentId: newParentId,
        },
      });

      // Publish event using createEvent
      await eventBus.publish(
        createEvent(
          "CustomerMoved",
          customerId,
          "Customer",
          {
            customerId,
            oldParentId: customer.parentId,
            newParentId,
          },
          1,
          {
            tenantId: customer.tenantId,
            correlationId: `customer-move-${customerId}-${Date.now()}`,
            schemaVersion: 1,
          },
        ),
      );

      return this.mapDatabaseCustomerToCustomer(updated);
    } catch (error) {
      console.error("[CustomerHierarchyService] Error moving customer:", error);
      throw error;
    }
  }

  /**
   * Get all customers visible to a user (based on assignments)
   */
  async getUserVisibleCustomers(userId: string): Promise<Customer[]> {
    try {
      // Get user's customer assignments using raw SQL
      const assignments = await prisma.$queryRaw<any[]>`
        SELECT cu.*, c.id as customer_id, c.name, c.code, c.type, c.status, c.tenant_id
        FROM customer_users cu
        LEFT JOIN customers c ON cu.customer_id = c.id
        WHERE cu.user_id = ${userId}
      `;

      // Collect unique customers
      const customerMap = new Map<string, Customer>();

      for (const assignment of assignments) {
        // Add main customer if exists
        if (assignment.customer_id) {
          const customer = await prisma.customer.findUnique({
            where: { id: assignment.customer_id },
            include: { children: true },
          });
          if (customer) {
            customerMap.set(
              customer.id,
              this.mapDatabaseCustomerToCustomer(customer),
            );
            // Add children
            for (const child of customer.children || []) {
              customerMap.set(
                child.id,
                this.mapDatabaseCustomerToCustomer(child),
              );
            }
          }
        }
      }

      return Array.from(customerMap.values());
    } catch (error) {
      console.error(
        "[CustomerHierarchyService] Error getting user visible customers:",
        error,
      );
      // Return empty array on error for graceful degradation
      return [];
    }
  }

  /**
   * Get sub-customers visible to user for a specific customer
   */
  async getUserVisibleSubCustomers(
    userId: string,
    customerId: string,
  ): Promise<Customer[]> {
    try {
      // Check if user has access to this customer using raw SQL
      const assignments = await prisma.$queryRaw<any[]>`
        SELECT * FROM customer_users 
        WHERE user_id = ${userId} AND customer_id = ${customerId}
        LIMIT 1
      `;

      if (assignments.length === 0) {
        return []; // User doesn't have access
      }

      // Get all sub-customers
      return await this.getSubCustomers(customerId);
    } catch (error) {
      console.error(
        "[CustomerHierarchyService] Error getting user visible sub-customers:",
        error,
      );
      return [];
    }
  }

  /**
   * Get customer tree (hierarchical structure)
   */
  async getCustomerTree(
    tenantId: string,
    rootCustomerId?: string,
  ): Promise<Customer[]> {
    try {
      if (rootCustomerId) {
        const root = await this.getCustomerHierarchy(tenantId, rootCustomerId);
        return root ? [root] : [];
      }

      // Get all top-level customers (no parent)
      const topLevelCustomers = await prisma.customer.findMany({
        where: {
          tenantId,
          parentId: null,
        },
        include: {
          children: {
            include: {
              children: true, // Recursive
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      return topLevelCustomers.map((c) =>
        this.mapDatabaseCustomerToCustomer(c),
      );
    } catch (error) {
      console.error(
        "[CustomerHierarchyService] Error getting customer tree:",
        error,
      );
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private mapDatabaseCustomerToCustomer(dbCustomer: any): Customer {
    return {
      id: dbCustomer.id,
      tenantId: dbCustomer.tenantId || dbCustomer.tenant_id,
      customerNumber: dbCustomer.code || dbCustomer.customerNumber,
      customerName: dbCustomer.name || dbCustomer.customerName,
      type: (dbCustomer.type || "3PL_CLIENT") as "3PL_CLIENT" | "4PL_CLIENT",
      serviceTier: (dbCustomer.serviceTier || "STANDARD") as any,
      status: (dbCustomer.status || "ACTIVE") as any,
      logo: dbCustomer.logo as any,
      brandColor: dbCustomer.brandColor,
      secondaryColor: dbCustomer.secondaryColor,
      contractStartDate: dbCustomer.contractStartDate,
      contractEndDate: dbCustomer.contractEndDate,
      contractValue: Number(dbCustomer.contractValue || 0),
      contractCurrency: dbCustomer.contractCurrency,
      renewalDate: dbCustomer.renewalDate,
      autoRenew: dbCustomer.autoRenew,
      monthlyRevenue: Number(dbCustomer.monthlyRevenue || 0),
      totalRevenue: Number(dbCustomer.totalRevenue || 0),
      averageOrderValue: Number(dbCustomer.averageOrderValue || 0),
      paymentTerms: dbCustomer.paymentTerms,
      creditLimit: dbCustomer.creditLimit
        ? Number(dbCustomer.creditLimit)
        : undefined,
      outstandingBalance: dbCustomer.outstandingBalance
        ? Number(dbCustomer.outstandingBalance)
        : undefined,
      allocatedWarehouses: dbCustomer.allocatedWarehouses || [],
      dedicatedSpace: dbCustomer.dedicatedSpace as any,
      serviceLevel: dbCustomer.serviceLevel as any,
      slaTargets: dbCustomer.slaTargets as any,
      primaryContact: dbCustomer.primaryContact as any,
      billingContact: dbCustomer.billingContact as any,
      operationalContacts: dbCustomer.operationalContacts as any,
      metrics: dbCustomer.metrics as any,
      healthScore: dbCustomer.healthScore,
      churnRisk: dbCustomer.churnRisk as any,
      satisfactionScore: dbCustomer.satisfactionScore,
      settings: dbCustomer.settings as any,
      integrations: dbCustomer.integrations as any,
      subCustomers:
        dbCustomer.children?.map((c: any) =>
          this.mapDatabaseCustomerToCustomer(c),
        ) || [],
      createdAt: dbCustomer.createdAt,
      updatedAt: dbCustomer.updatedAt,
      createdBy: dbCustomer.createdBy,
      updatedBy: dbCustomer.updatedBy,
    };
  }
}

// Export singleton instance
export const customerHierarchyService = new CustomerHierarchyService();
