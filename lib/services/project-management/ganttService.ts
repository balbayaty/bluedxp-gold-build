/**
 * Gantt Service
 * Gantt chart data aggregation from tasks and work orders
 * AGGREGATES from WMS and Facility (read-only, no duplication)
 */

import type { GanttTask } from "@/types/project-management";

// ============================================================================
// SERVICE
// ============================================================================

class GanttService {
  /**
   * Generate Gantt data from project tasks and work orders
   * AGGREGATES from WMS and Facility (read-only, no duplication)
   */
  async generateGanttData(
    projectId: string,
    taskIds: string[],
    workOrderIds: string[],
  ): Promise<GanttTask[]> {
    // Would fetch tasks from WMS service (read-only)
    // Would fetch work orders from Facility service (read-only)
    // Aggregate into Gantt format

    const ganttTasks: GanttTask[] = [];

    // Add WMS tasks
    for (const taskId of taskIds) {
      // Would fetch task from WMS (read-only)
      ganttTasks.push({
        id: `task-${taskId}`,
        name: `Task ${taskId}`, // Would come from WMS
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 7,
        progress: 0,
        dependencies: [],
        resourceIds: [],
        type: "WMS_TASK",
        sourceId: taskId,
      });
    }

    // Add Facility work orders
    for (const workOrderId of workOrderIds) {
      // Would fetch work order from Facility (read-only)
      ganttTasks.push({
        id: `wo-${workOrderId}`,
        name: `Work Order ${workOrderId}`, // Would come from Facility
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 14,
        progress: 0,
        dependencies: [],
        resourceIds: [],
        type: "FACILITY_WORK_ORDER",
        sourceId: workOrderId,
      });
    }

    return ganttTasks;
  }

  /**
   * Calculate critical path
   */
  async calculateCriticalPath(ganttTasks: GanttTask[]): Promise<string[]> {
    // Simplified critical path calculation
    // Would use proper algorithm in production
    return ganttTasks.map((t) => t.id);
  }
}

export const ganttService = new GanttService();
