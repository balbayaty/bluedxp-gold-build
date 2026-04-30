/**
 * MaaS (Manufacturing as a Service) Service
 *
 * Main service for MaaS operations
 * Resource allocation, revenue tracking, multi-tenant management
 *
 * @module maas
 */

import { eventBus, createEvent } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { MAAS_PILLARS } from "./pillars";
import type { MaaSTenant, MaaSResourceAllocation, MAASPillar } from "./types";

// ============================================================================
// IN-MEMORY STORE (Will be replaced with database)
// ============================================================================

class MaaSStore {
  private tenants: Map<string, MaaSTenant> = new Map();
  private allocations: Map<string, MaaSResourceAllocation> = new Map();

  getTenant(id: string): MaaSTenant | undefined {
    return this.tenants.get(id);
  }

  setTenant(id: string, tenant: MaaSTenant): void {
    this.tenants.set(id, tenant);
  }

  getAllocations(pillar: MAASPillar): MaaSResourceAllocation[] {
    return Array.from(this.allocations.values()).filter(
      (a) => a.pillar === pillar,
    );
  }

  setAllocation(id: string, allocation: MaaSResourceAllocation): void {
    this.allocations.set(id, allocation);
  }
}

const store = new MaaSStore();

// ============================================================================
// MAAS SERVICE
// ============================================================================

export class MaaSService {
  /**
   * Register MaaS tenant
   */
  async registerTenant(
    tenantId: string,
    name: string,
    pillars: MAASPillar[],
  ): Promise<MaaSTenant> {
    const tenant: MaaSTenant = {
      id: `maas-tenant-${Date.now()}`,
      name,
      tenantId,
      pillars,
      utilization: {} as Record<MAASPillar, number>,
      revenue: 0,
      createdAt: new Date(),
    };

    // Initialize utilization
    for (const pillar of pillars) {
      tenant.utilization[pillar] = 0;
    }

    store.setTenant(tenant.id, tenant);

    // Publish event
    await eventBus.publish(
      createEvent(
        "MaaSTenantRegistered",
        tenant.id,
        "MaaSTenant",
        {
          tenantId: tenant.id,
          name,
          pillars,
        },
        1,
        {
          tenantId,
          correlationId: `maas-register-${Date.now()}`,
          userId: "maas-service",
        },
      ),
    );

    return tenant;
  }

  /**
   * Allocate resources
   */
  async allocateResources(
    pillar: MAASPillar,
    tenantId: string,
    resourceId: string,
    allocated: number,
    startDate: Date,
    endDate?: Date,
  ): Promise<MaaSResourceAllocation> {
    const allocation: MaaSResourceAllocation = {
      pillar,
      resourceId,
      tenantId,
      allocated,
      utilized: 0,
      startDate,
      endDate,
    };

    const allocationId = `allocation-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    store.setAllocation(allocationId, allocation);

    // Update tenant utilization
    const tenant = Array.from(store["tenants"].values()).find(
      (t) => t.tenantId === tenantId,
    );
    if (tenant) {
      const pillarAllocations = store.getAllocations(pillar);
      const totalAllocated = pillarAllocations.reduce(
        (sum, a) => sum + a.allocated,
        0,
      );
      const totalUtilized = pillarAllocations.reduce(
        (sum, a) => sum + a.utilized,
        0,
      );
      tenant.utilization[pillar] =
        totalAllocated > 0 ? totalUtilized / totalAllocated : 0;
      store.setTenant(tenant.id, tenant);
    }

    return allocation;
  }

  /**
   * Calculate revenue
   */
  async calculateRevenue(
    tenantId: string,
    period: { from: Date; to: Date },
  ): Promise<{
    totalRevenue: number;
    byPillar: Record<MAASPillar, number>;
    breakdown: Array<{
      pillar: MAASPillar;
      revenue: number;
      utilization: number;
    }>;
  }> {
    const tenant = Array.from(store["tenants"].values()).find(
      (t) => t.tenantId === tenantId,
    );
    if (!tenant) {
      return {
        totalRevenue: 0,
        byPillar: {} as Record<MAASPillar, number>,
        breakdown: [],
      };
    }

    const byPillar: Record<MAASPillar, number> = {} as any;
    const breakdown: Array<{
      pillar: MAASPillar;
      revenue: number;
      utilization: number;
    }> = [];

    for (const pillar of tenant.pillars) {
      const pillarDef = MAAS_PILLARS.find((p) => p.type === pillar);
      if (!pillarDef) continue;

      const allocations = store
        .getAllocations(pillar)
        .filter((a) => a.tenantId === tenantId);
      const utilization = tenant.utilization[pillar] || 0;

      // Calculate revenue based on pricing model
      let revenue = 0;
      switch (pillarDef.pricing.model) {
        case "per_sqm_monthly":
          revenue =
            (pillarDef.pricing.basePrice || 0) *
            allocations.reduce((sum, a) => sum + a.allocated, 0);
          break;
        case "hourly":
          revenue =
            (pillarDef.pricing.unitPrice || 0) *
            allocations.reduce((sum, a) => sum + a.utilized, 0);
          break;
        case "per_test":
          revenue = (pillarDef.pricing.unitPrice || 0) * allocations.length;
          break;
        case "subscription":
          revenue = pillarDef.pricing.basePrice || 0;
          break;
        default:
          revenue = 0;
      }

      byPillar[pillar] = revenue;
      breakdown.push({
        pillar,
        revenue,
        utilization,
      });
    }

    const totalRevenue = Object.values(byPillar).reduce((sum, r) => sum + r, 0);

    return {
      totalRevenue,
      byPillar,
      breakdown,
    };
  }

  /**
   * Get all pillars
   */
  getAllPillars() {
    return MAAS_PILLARS;
  }
}

// Export singleton
export const maasService = new MaaSService();
