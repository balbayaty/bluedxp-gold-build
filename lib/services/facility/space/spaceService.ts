/**
 * Space Management Service (CAFM)
 *
 * Single canonical implementation (deduplicated) providing:
 * - Space registry CRUD
 * - Allocation
 * - Utilization tracking + analytics
 * - Basic optimization recommendations
 */

import type {
  Space,
  SpaceAllocation,
  SpaceStatus,
  SpaceType,
  SpaceUtilization,
} from "@/types/facility";
import { eventBus } from "@/lib/services/event-store";

export interface SpaceServiceConfig {
  enableUtilizationTracking?: boolean;
  enableCostAllocation?: boolean;
  enableBIMIntegration?: boolean;
  utilizationUpdateFrequency?: number; // days
}

export class SpaceService {
  private config: Required<SpaceServiceConfig>;
  private spaces: Map<string, Space> = new Map();

  constructor(config: SpaceServiceConfig = {}) {
    this.config = {
      enableUtilizationTracking: config.enableUtilizationTracking ?? true,
      enableCostAllocation: config.enableCostAllocation ?? true,
      enableBIMIntegration: config.enableBIMIntegration ?? true,
      utilizationUpdateFrequency: config.utilizationUpdateFrequency ?? 7,
    };
  }

  async getSpaces(
    facilityId: string,
    filters?: {
      type?: SpaceType;
      status?: SpaceStatus;
      floor?: string;
      building?: string;
    },
  ): Promise<Space[]> {
    let list = Array.from(this.spaces.values()).filter(
      (s) => s.facilityId === facilityId,
    );
    if (filters?.type) list = list.filter((s) => s.type === filters.type);
    if (filters?.status) list = list.filter((s) => s.status === filters.status);
    if (filters?.floor)
      list = list.filter((s) => s.location.floor === filters.floor);
    if (filters?.building)
      list = list.filter((s) => s.location.building === filters.building);
    return list;
  }

  async getSpace(spaceId: string): Promise<Space | null> {
    return this.spaces.get(spaceId) || null;
  }

  async createSpace(
    space: Omit<Space, "id" | "createdAt" | "updatedAt">,
  ): Promise<Space> {
    const newSpace: Space = {
      ...space,
      id: `space-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.config.enableUtilizationTracking && !newSpace.utilization) {
      newSpace.utilization = { utilizationRate: 0, lastMeasured: new Date() };
    }

    this.spaces.set(newSpace.id, newSpace);

    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.space.created",
      aggregateId: newSpace.id,
      aggregateType: "Space",
      version: 1,
      timestamp: new Date(),
      data: {
        spaceId: newSpace.id,
        facilityId: newSpace.facilityId,
        spaceType: newSpace.type,
        area: newSpace.specifications.area,
      },
      metadata: {},
    });

    return newSpace;
  }

  async updateSpace(spaceId: string, updates: Partial<Space>): Promise<Space> {
    const space = this.spaces.get(spaceId);
    if (!space) throw new Error(`Space ${spaceId} not found`);

    const updated: Space = { ...space, ...updates, updatedAt: new Date() };
    this.spaces.set(spaceId, updated);

    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.space.updated",
      aggregateId: spaceId,
      aggregateType: "Space",
      version: 1,
      timestamp: new Date(),
      data: {
        spaceId,
        facilityId: updated.facilityId,
        changes: Object.keys(updates),
      },
      metadata: {},
    });

    return updated;
  }

  async allocateSpace(
    spaceId: string,
    allocation: {
      allocatedTo: string;
      allocationType: SpaceAllocation["allocationType"];
      startDate: Date;
      endDate?: Date;
    },
  ): Promise<Space> {
    const space = this.spaces.get(spaceId);
    if (!space) throw new Error(`Space ${spaceId} not found`);

    if (
      space.status === "occupied" &&
      space.allocation?.allocatedTo !== allocation.allocatedTo
    ) {
      throw new Error(`Space ${spaceId} is already occupied`);
    }

    return this.updateSpace(spaceId, {
      status: "occupied",
      allocation: {
        allocatedTo: allocation.allocatedTo,
        allocationType: allocation.allocationType,
        allocationStartDate: allocation.startDate,
        allocationEndDate: allocation.endDate,
        occupancyRate: 100,
      },
    });
  }

  async releaseSpace(spaceId: string): Promise<Space> {
    const space = this.spaces.get(spaceId);
    if (!space) throw new Error(`Space ${spaceId} not found`);

    return this.updateSpace(spaceId, {
      status: "vacant",
      allocation: {
        ...space.allocation,
        allocatedTo: undefined,
        allocationType: undefined,
        allocationStartDate: undefined,
        allocationEndDate: undefined,
        occupancyRate: 0,
      },
    });
  }

  async updateUtilization(
    spaceId: string,
    utilization: {
      utilizationRate: number;
      peakUtilization?: number;
      averageUtilization?: number;
    },
  ): Promise<SpaceUtilization> {
    const space = this.spaces.get(spaceId);
    if (!space) throw new Error(`Space ${spaceId} not found`);

    const newUtilization: SpaceUtilization = {
      utilizationRate: utilization.utilizationRate,
      peakUtilization: utilization.peakUtilization,
      averageUtilization: utilization.averageUtilization,
      lastMeasured: new Date(),
    };

    await this.updateSpace(spaceId, { utilization: newUtilization });
    return newUtilization;
  }

  async getUtilizationAnalytics(facilityId: string): Promise<{
    overallUtilization: number;
    byType: Record<string, number>;
    byBuilding: Record<string, number>;
    byFloor: Record<string, number>;
    underutilizedSpaces: Space[];
    overutilizedSpaces: Space[];
    recommendations: string[];
  }> {
    const spaces = await this.getSpaces(facilityId);
    if (spaces.length === 0) {
      return {
        overallUtilization: 0,
        byType: {},
        byBuilding: {},
        byFloor: {},
        underutilizedSpaces: [],
        overutilizedSpaces: [],
        recommendations: ["No spaces found for this facility"],
      };
    }

    const utilizationOf = (s: Space) => s.utilization?.utilizationRate || 0;
    const overallUtilization =
      spaces.reduce((sum, s) => sum + utilizationOf(s), 0) / spaces.length;

    const groupAvg = (
      items: Space[],
      key: (s: Space) => string,
    ): Record<string, number> => {
      const groups = new Map<string, Space[]>();
      items.forEach((s) => {
        const k = key(s);
        const g = groups.get(k) || [];
        g.push(s);
        groups.set(k, g);
      });
      const out: Record<string, number> = {};
      for (const [k, g] of groups.entries()) {
        out[k] = g.reduce((sum, s) => sum + utilizationOf(s), 0) / g.length;
      }
      return out;
    };

    const underutilizedSpaces = spaces.filter((s) => utilizationOf(s) < 30);
    const overutilizedSpaces = spaces.filter((s) => utilizationOf(s) > 90);

    const recommendations: string[] = [];
    if (underutilizedSpaces.length)
      recommendations.push(
        `${underutilizedSpaces.length} spaces are underutilized - consider consolidation`,
      );
    if (overutilizedSpaces.length)
      recommendations.push(
        `${overutilizedSpaces.length} spaces are overutilized - consider expansion`,
      );
    if (overallUtilization < 50)
      recommendations.push(
        "Overall facility utilization is low - review space allocation strategy",
      );
    if (overallUtilization > 85)
      recommendations.push(
        "Facility is near capacity - plan for additional space requirements",
      );

    return {
      overallUtilization,
      byType: groupAvg(spaces, (s) => String(s.type)),
      byBuilding: groupAvg(spaces, (s) => String(s.location.building)),
      byFloor: groupAvg(spaces, (s) => String(s.location.floor)),
      underutilizedSpaces,
      overutilizedSpaces,
      recommendations,
    };
  }

  async optimizeSpaceAllocation(facilityId: string): Promise<{
    recommendations: Array<{
      spaceId: string;
      currentUtilization: number;
      recommendedAction: string;
      potentialSavings?: number;
    }>;
    totalPotentialSavings: number;
  }> {
    const spaces = await this.getSpaces(facilityId);
    const utilizationOf = (s: Space) => s.utilization?.utilizationRate || 0;

    const recommendations: Array<{
      spaceId: string;
      currentUtilization: number;
      recommendedAction: string;
      potentialSavings?: number;
    }> = [];
    let totalPotentialSavings = 0;

    for (const space of spaces) {
      const utilization = utilizationOf(space);
      const annualCost = space.costAllocation?.annualCost || 0;

      if (utilization < 30 && annualCost > 0) {
        const potentialSavings = annualCost * 0.5;
        recommendations.push({
          spaceId: space.id,
          currentUtilization: utilization,
          recommendedAction:
            "Consider consolidating with other spaces - low utilization",
          potentialSavings,
        });
        totalPotentialSavings += potentialSavings;
      }

      if (utilization > 90) {
        recommendations.push({
          spaceId: space.id,
          currentUtilization: utilization,
          recommendedAction:
            "Consider expansion - high utilization may impact productivity",
        });
      }

      if (space.status === "vacant" && annualCost > 0) {
        recommendations.push({
          spaceId: space.id,
          currentUtilization: 0,
          recommendedAction: "Vacant space - consider allocating or subleasing",
          potentialSavings: annualCost,
        });
        totalPotentialSavings += annualCost;
      }
    }

    return { recommendations, totalPotentialSavings };
  }
}

// Singleton instance
let spaceServiceInstance: SpaceService | null = null;

export function getSpaceService(config?: SpaceServiceConfig): SpaceService {
  if (!spaceServiceInstance) {
    spaceServiceInstance = new SpaceService(config);
  }
  return spaceServiceInstance;
}
