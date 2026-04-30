/**
 * 🚀 TENANT SERVICE
 *
 * Comprehensive tenant management service for BlueDXP platform
 * Supports multi-tenant 3PL/4PL operations with full lifecycle management
 *
 * Features:
 * - Tenant CRUD operations
 * - Resource quota management
 * - Feature flag management
 * - Tenant-specific configurations
 * - Integration with Event Bus
 *
 * BlueDXP Platform - Vision 2040 Aligned
 */

import { prisma } from "@/lib/services/database/prismaClient";
import { eventBus, createEvent } from "@/lib/services/event-bus";
import type { Tenant, TenantFeature, TenantSettings } from "@/types/tenant";

// ============================================================================
// TYPES
// ============================================================================

export interface CreateTenantInput {
  name: string;
  type: "3PL" | "4PL";
  status?: "ACTIVE" | "SUSPENDED" | "INACTIVE" | "TRIAL";
  subscriptionTier?: "BASIC" | "PROFESSIONAL" | "ENTERPRISE" | "CUSTOM";
  subscriptionStartDate: Date | string;
  subscriptionEndDate?: Date | string;
  maxCustomers?: number;
  maxWarehouses?: number;
  maxUsers?: number;
  features?: TenantFeature[];
  settings?: Partial<TenantSettings>;
  billing?: {
    monthlyFee: number;
    perCustomerFee?: number;
    perWarehouseFee?: number;
    currency?: string;
    paymentMethod?: string;
  };
  resourceQuotas?: TenantQuotas;
  featureFlags?: FeatureFlags;
  createdBy?: string;
}

export interface UpdateTenantInput {
  name?: string;
  type?: "3PL" | "4PL";
  status?: "ACTIVE" | "SUSPENDED" | "INACTIVE" | "TRIAL";
  subscriptionTier?: "BASIC" | "PROFESSIONAL" | "ENTERPRISE" | "CUSTOM";
  subscriptionEndDate?: Date | string;
  maxCustomers?: number;
  maxWarehouses?: number;
  maxUsers?: number;
  features?: TenantFeature[];
  settings?: Partial<TenantSettings>;
  billing?: {
    monthlyFee?: number;
    perCustomerFee?: number;
    perWarehouseFee?: number;
    currency?: string;
    paymentMethod?: string;
  };
  resourceQuotas?: TenantQuotas;
  featureFlags?: FeatureFlags;
  updatedBy?: string;
}

export interface TenantQuotas {
  maxApiCallsPerDay?: number;
  maxApiCallsPerHour?: number;
  maxStorageGB?: number;
  maxComputeHours?: number;
  maxDataTransferGB?: number;
  maxAgentActionsPerDay?: number;
  maxUsers?: number;
  maxCustomers?: number;
  maxWarehouses?: number;
  [key: string]: number | undefined;
}

export interface FeatureFlags {
  [feature: string]:
    | boolean
    | {
        enabled: boolean;
        config?: Record<string, any>;
      };
}

// ============================================================================
// TENANT SERVICE
// ============================================================================

class TenantService {
  /**
   * Create new tenant
   */
  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    try {
      // Default settings
      const defaultSettings: TenantSettings = {
        timezone: "Asia/Riyadh",
        currency: "SAR",
        dateFormat: "MM/dd/yyyy",
        timeFormat: "HH:mm",
        language: "en",
        allowCustomerPortal: true,
        allowApiAccess: true,
        dataRetentionDays: 365,
        backupFrequency: "DAILY",
        ...input.settings,
      };

      // Default features
      const defaultFeatures: TenantFeature[] = input.features || [];

      // Create tenant using correct Prisma schema fields
      const tenant = await prisma.tenant.create({
        data: {
          name: input.name,
          slug:
            input.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
          type: input.type,
          status: input.status || "ACTIVE",
          settings: {
            ...defaultSettings,
            subscriptionTier: input.subscriptionTier || "BASIC",
            subscriptionStartDate: input.subscriptionStartDate,
            subscriptionEndDate: input.subscriptionEndDate,
            maxCustomers: input.maxCustomers,
            maxWarehouses: input.maxWarehouses,
            maxUsers: input.maxUsers,
          } as any,
          quotas: input.resourceQuotas || ({} as any),
          featureFlags: input.featureFlags || ({} as any),
          billingInfo: input.billing || ({} as any),
        },
      });

      // Publish event using createEvent
      await eventBus.publish(
        createEvent(
          "TenantCreated",
          tenant.id,
          "Tenant",
          {
            tenantId: tenant.id,
            name: tenant.name,
            type: tenant.type,
            status: tenant.status,
          },
          1,
          {
            tenantId: tenant.id,
            userId: input.createdBy,
            correlationId: `tenant-create-${tenant.id}-${Date.now()}`,
            schemaVersion: 1,
          },
        ),
      );

      return this.mapDatabaseTenantToTenant(tenant);
    } catch (error) {
      console.error("[TenantService] Error creating tenant:", error);
      throw error;
    }
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<Tenant | null> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) return null;

      return this.mapDatabaseTenantToTenant(tenant);
    } catch (error) {
      console.error("[TenantService] Error getting tenant:", error);
      throw error;
    }
  }

  /**
   * Update tenant
   */
  async updateTenant(
    tenantId: string,
    input: UpdateTenantInput,
  ): Promise<Tenant> {
    try {
      const existing = await this.getTenant(tenantId);
      if (!existing) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      // Merge settings if provided
      const settings = input.settings
        ? { ...existing.settings, ...input.settings }
        : undefined;

      // Merge features if provided
      const features = input.features || undefined;

      // Merge billing if provided
      const billing = input.billing
        ? { ...existing.billing, ...input.billing }
        : undefined;

      // Merge resource quotas if provided
      const resourceQuotas = input.resourceQuotas
        ? { ...(existing.resourceQuotas || {}), ...input.resourceQuotas }
        : undefined;

      // Merge feature flags if provided
      const featureFlags = input.featureFlags
        ? { ...(existing.featureFlags || {}), ...input.featureFlags }
        : undefined;

      const tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.type && { type: input.type }),
          ...(input.status && { status: input.status }),
          ...(input.subscriptionTier && {
            subscriptionTier: input.subscriptionTier,
          }),
          ...(input.subscriptionEndDate && {
            subscriptionEndDate: new Date(input.subscriptionEndDate),
          }),
          ...(input.maxCustomers !== undefined && {
            maxCustomers: input.maxCustomers,
          }),
          ...(input.maxWarehouses !== undefined && {
            maxWarehouses: input.maxWarehouses,
          }),
          ...(input.maxUsers !== undefined && { maxUsers: input.maxUsers }),
          ...(features && { features: features as any }),
          ...(settings && { settings: settings as any }),
          ...(billing && { billing: billing as any }),
          ...(resourceQuotas && { resourceQuotas: resourceQuotas as any }),
          ...(featureFlags && { featureFlags: featureFlags as any }),
          updatedBy: input.updatedBy,
        },
      });

      // Publish event
      await eventBus.publish({
        type: "TenantUpdated",
        aggregateId: tenant.id,
        aggregateType: "Tenant",
        payload: {
          tenantId: tenant.id,
          changes: input,
        },
        metadata: {
          tenantId: tenant.id,
          userId: input.updatedBy,
          timestamp: new Date().toISOString(),
        },
      });

      return this.mapDatabaseTenantToTenant(tenant);
    } catch (error) {
      console.error("[TenantService] Error updating tenant:", error);
      throw error;
    }
  }

  /**
   * Delete tenant (soft delete by setting status to INACTIVE)
   */
  async deleteTenant(tenantId: string): Promise<boolean> {
    try {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          status: "INACTIVE",
        },
      });

      // Publish event
      await eventBus.publish({
        type: "TenantDeleted",
        aggregateId: tenantId,
        aggregateType: "Tenant",
        payload: {
          tenantId,
        },
        metadata: {
          tenantId,
          timestamp: new Date().toISOString(),
        },
      });

      return true;
    } catch (error) {
      console.error("[TenantService] Error deleting tenant:", error);
      throw error;
    }
  }

  /**
   * Get tenant quotas
   */
  async getTenantQuotas(tenantId: string): Promise<TenantQuotas> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { resourceQuotas: true },
      });

      return (tenant?.resourceQuotas as TenantQuotas) || {};
    } catch (error) {
      console.error("[TenantService] Error getting tenant quotas:", error);
      throw error;
    }
  }

  /**
   * Update tenant quotas
   */
  async updateTenantQuotas(
    tenantId: string,
    quotas: TenantQuotas,
  ): Promise<void> {
    try {
      const existing = await this.getTenantQuotas(tenantId);
      const merged = { ...existing, ...quotas };

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          resourceQuotas: merged as any,
        },
      });

      // Publish event
      await eventBus.publish({
        type: "TenantQuotasUpdated",
        aggregateId: tenantId,
        aggregateType: "Tenant",
        payload: {
          tenantId,
          quotas: merged,
        },
        metadata: {
          tenantId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[TenantService] Error updating tenant quotas:", error);
      throw error;
    }
  }

  /**
   * Get tenant feature flags
   */
  async getTenantFeatureFlags(tenantId: string): Promise<FeatureFlags> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { featureFlags: true },
      });

      return (tenant?.featureFlags as FeatureFlags) || {};
    } catch (error) {
      console.error(
        "[TenantService] Error getting tenant feature flags:",
        error,
      );
      throw error;
    }
  }

  /**
   * Update tenant feature flags
   */
  async updateTenantFeatureFlags(
    tenantId: string,
    flags: FeatureFlags,
  ): Promise<void> {
    try {
      const existing = await this.getTenantFeatureFlags(tenantId);
      const merged = { ...existing, ...flags };

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          featureFlags: merged as any,
        },
      });

      // Publish event
      await eventBus.publish({
        type: "TenantFeatureFlagsUpdated",
        aggregateId: tenantId,
        aggregateType: "Tenant",
        payload: {
          tenantId,
          flags: merged,
        },
        metadata: {
          tenantId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(
        "[TenantService] Error updating tenant feature flags:",
        error,
      );
      throw error;
    }
  }

  /**
   * Check if tenant has feature enabled
   */
  async hasFeature(tenantId: string, feature: string): Promise<boolean> {
    try {
      const flags = await this.getTenantFeatureFlags(tenantId);
      const featureFlag = flags[feature];

      if (typeof featureFlag === "boolean") {
        return featureFlag;
      }

      if (
        featureFlag &&
        typeof featureFlag === "object" &&
        "enabled" in featureFlag
      ) {
        return featureFlag.enabled;
      }

      return false;
    } catch (error) {
      console.error("[TenantService] Error checking feature:", error);
      return false;
    }
  }

  /**
   * List all tenants
   */
  async listTenants(filters?: {
    status?: string;
    type?: string;
    subscriptionTier?: string;
  }): Promise<Tenant[]> {
    try {
      const tenants = await prisma.tenant.findMany({
        where: {
          ...(filters?.status && { status: filters.status }),
          ...(filters?.type && { type: filters.type }),
          ...(filters?.subscriptionTier && {
            subscriptionTier: filters.subscriptionTier,
          }),
        },
        orderBy: { createdAt: "desc" },
      });

      return tenants.map((t) => this.mapDatabaseTenantToTenant(t));
    } catch (error) {
      console.error("[TenantService] Error listing tenants:", error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private mapDatabaseTenantToTenant(dbTenant: any): Tenant {
    return {
      id: dbTenant.id,
      name: dbTenant.name,
      type: dbTenant.type as "3PL" | "4PL",
      status: dbTenant.status as "ACTIVE" | "SUSPENDED" | "INACTIVE" | "TRIAL",
      subscriptionTier: dbTenant.subscriptionTier as
        | "BASIC"
        | "PROFESSIONAL"
        | "ENTERPRISE"
        | "CUSTOM",
      subscriptionStartDate: dbTenant.subscriptionStartDate,
      subscriptionEndDate: dbTenant.subscriptionEndDate,
      maxCustomers: dbTenant.maxCustomers,
      maxWarehouses: dbTenant.maxWarehouses,
      maxUsers: dbTenant.maxUsers,
      features: (dbTenant.features || []) as TenantFeature[],
      settings: (dbTenant.settings || {}) as TenantSettings,
      billing: (dbTenant.billing || {}) as Tenant["billing"],
      createdAt: dbTenant.createdAt,
      updatedAt: dbTenant.updatedAt,
      createdBy: dbTenant.createdBy,
      updatedBy: dbTenant.updatedBy,
    };
  }
}

// Export singleton instance
export const tenantService = new TenantService();
