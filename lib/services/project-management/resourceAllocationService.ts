/**
 * Resource Allocation Service
 * Resource planning linked to HR employees, WMS resources, Facility assets
 * REFERENCES existing resources (no duplication)
 */

import { eventBus } from "@/lib/services/event-bus";
import type {
  ResourceAllocation,
  ResourceConflict,
} from "@/types/project-management";

// ============================================================================
// SERVICE
// ============================================================================

class ResourceAllocationService {
  private allocations: Map<string, ResourceAllocation> = new Map();

  /**
   * Allocate resource to project
   * REFERENCES HR employee, WMS resource, or Facility asset (no duplication)
   */
  async allocateResource(input: {
    projectId: string;
    resourceType: ResourceAllocation["resourceType"];
    resourceId: string;
    allocation: number;
    startDate: Date | string;
    endDate: Date | string;
  }): Promise<ResourceAllocation> {
    // Check for conflicts
    const conflicts = await this.checkConflicts(input);

    const allocation: ResourceAllocation = {
      id: `alloc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      projectId: input.projectId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      allocation: input.allocation,
      startDate: input.startDate,
      endDate: input.endDate,
      conflicts,
    };

    this.allocations.set(allocation.id, allocation);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "project.resource.allocated",
      aggregateId: allocation.id,
      aggregateType: "resource_allocation",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: allocation,
    });

    return allocation;
  }

  /**
   * Check for resource conflicts
   */
  private async checkConflicts(input: {
    resourceType: ResourceAllocation["resourceType"];
    resourceId: string;
    startDate: Date | string;
    endDate: Date | string;
  }): Promise<ResourceConflict[]> {
    // Check existing allocations for same resource
    const existing = Array.from(this.allocations.values()).filter(
      (a) =>
        a.resourceType === input.resourceType &&
        a.resourceId === input.resourceId,
    );

    const conflicts: ResourceConflict[] = [];

    for (const existingAlloc of existing) {
      const overlap = this.checkDateOverlap(
        input.startDate,
        input.endDate,
        existingAlloc.startDate,
        existingAlloc.endDate,
      );

      if (overlap) {
        const totalAllocation = existingAlloc.allocation + input.allocation;
        if (totalAllocation > 100) {
          conflicts.push({
            id: `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            conflictingProjectId: existingAlloc.projectId,
            conflictType: "OVERALLOCATION",
            severity:
              totalAllocation > 150
                ? "HIGH"
                : totalAllocation > 120
                  ? "MEDIUM"
                  : "LOW",
          });
        } else {
          conflicts.push({
            id: `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            conflictingProjectId: existingAlloc.projectId,
            conflictType: "SCHEDULE_OVERLAP",
            severity: "LOW",
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check date overlap
   */
  private checkDateOverlap(
    start1: Date | string,
    end1: Date | string,
    start2: Date | string,
    end2: Date | string,
  ): boolean {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();

    return s1 < e2 && s2 < e1;
  }

  /**
   * Get resource allocations
   */
  async getResourceAllocations(filters: {
    projectId?: string;
    resourceType?: ResourceAllocation["resourceType"];
    resourceId?: string;
  }): Promise<ResourceAllocation[]> {
    let allocations = Array.from(this.allocations.values());

    if (filters.projectId) {
      allocations = allocations.filter(
        (a) => a.projectId === filters.projectId,
      );
    }

    if (filters.resourceType) {
      allocations = allocations.filter(
        (a) => a.resourceType === filters.resourceType,
      );
    }

    if (filters.resourceId) {
      allocations = allocations.filter(
        (a) => a.resourceId === filters.resourceId,
      );
    }

    return allocations;
  }
}

export const resourceAllocationService = new ResourceAllocationService();
