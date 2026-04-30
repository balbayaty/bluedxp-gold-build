/**
 * Unified Project Integration Service
 * CENTRAL HUB that reuses WMS tasks and Facility work orders (NO DUPLICATION)
 */

import { projectService } from "../projectService";
import { ganttService } from "../ganttService";
import { resourceAllocationService } from "../resourceAllocationService";
import { projectBudgetService } from "../projectBudgetService";
import type { UnifiedProjectData } from "@/types/project-management";

// ============================================================================
// SERVICE
// ============================================================================

class UnifiedProjectService {
  // Reuse existing services (NO DUPLICATION)
  private projectServiceInstance = projectService;
  private ganttServiceInstance = ganttService;
  private resourceAllocationServiceInstance = resourceAllocationService;
  private projectBudgetServiceInstance = projectBudgetService;

  /**
   * Get unified project data
   * AGGREGATES from WMS and Facility (read-only, no duplication)
   */
  async getUnifiedProjectData(projectId: string): Promise<UnifiedProjectData> {
    const project = await this.projectServiceInstance.getProject(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Get project with tasks and work orders (read-only, no duplication)
    const { tasks, workOrders } =
      await this.projectServiceInstance.getProjectWithTasks(projectId);

    // Get Gantt data (aggregates from tasks/work orders)
    const ganttData = await this.ganttServiceInstance.generateGanttData(
      projectId,
      project.taskIds,
      project.workOrderIds,
    );

    // Get resource allocations
    const allocations =
      await this.resourceAllocationServiceInstance.getResourceAllocations({
        projectId,
      });

    // Get project budget (links to Finance budget)
    const budget =
      await this.projectBudgetServiceInstance.getProjectBudget(projectId);

    return {
      project,
      tasks, // WMS tasks (read-only)
      workOrders, // Facility work orders (read-only)
      resources: {
        employees: [], // Would fetch from HR (read-only)
        wmsResources: [], // Would fetch from WMS (read-only)
        facilityAssets: [], // Would fetch from Facility (read-only)
      },
      budget,
      ganttData,
    };
  }
}

export const unifiedProjectService = new UnifiedProjectService();
