/**
 * Project Service
 * Project management
 * LINKS to WMS tasks and Facility work orders (NO DUPLICATION)
 */

import { eventBus } from "@/lib/services/event-bus";
import type {
  Project,
  Milestone,
  ProjectDependency,
} from "@/types/project-management";
import type { WorkOrder } from "@/types/facility";

// ============================================================================
// SERVICE
// ============================================================================

class ProjectService {
  private projects: Map<string, Project> = new Map();
  private milestones: Map<string, Milestone> = new Map();

  /**
   * Initialize event handlers to link projects to tasks/work orders
   */
  initializeEventHandlers(): void {
    // Subscribe to WMS task events
    eventBus.subscribe("wms.task.created", async (event: any) => {
      // Could auto-link to projects if project ID in metadata
    });

    // Subscribe to Facility work order events
    eventBus.subscribe("facility.work-order.created", async (event: any) => {
      // Could auto-link to projects if project ID in metadata
    });
  }

  /**
   * Create project
   */
  async createProject(input: {
    tenantId: string;
    name: string;
    description?: string;
    projectType: Project["projectType"];
    startDate: Date | string;
    endDate?: Date | string;
    budgetedCost: number;
    currency: string;
    projectManagerId?: string;
    createdBy: string;
  }): Promise<Project> {
    const project: Project = {
      id: `project-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      projectType: input.projectType,
      status: "PLANNING",
      priority: "MEDIUM",
      taskIds: [], // Will be linked later
      workOrderIds: [], // Will be linked later
      startDate: input.startDate,
      endDate: input.endDate,
      budgetedCost: input.budgetedCost,
      actualCost: 0,
      currency: input.currency,
      resourceIds: {
        employees: [],
        wmsResources: [],
        facilityAssets: [],
      },
      milestones: [],
      dependencies: [],
      projectManagerId: input.projectManagerId,
      teamMembers: [],
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
      updatedAt: new Date().toISOString(),
    };

    this.projects.set(project.id, project);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "project.created",
      aggregateId: project.id,
      aggregateType: "project",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: project,
    });

    return project;
  }

  /**
   * Link WMS task to project
   * REFERENCES task (no duplication)
   */
  async linkTask(projectId: string, taskId: string): Promise<Project> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    if (!project.taskIds.includes(taskId)) {
      project.taskIds.push(taskId);
      project.updatedAt = new Date().toISOString();
      this.projects.set(projectId, project);
    }

    return project;
  }

  /**
   * Link Facility work order to project
   * REFERENCES work order (no duplication)
   */
  async linkWorkOrder(
    projectId: string,
    workOrderId: string,
  ): Promise<Project> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    if (!project.workOrderIds.includes(workOrderId)) {
      project.workOrderIds.push(workOrderId);
      project.updatedAt = new Date().toISOString();
      this.projects.set(projectId, project);
    }

    return project;
  }

  /**
   * Get project with tasks and work orders
   * AGGREGATES from WMS and Facility (read-only, no duplication)
   */
  async getProjectWithTasks(projectId: string): Promise<{
    project: Project;
    tasks: any[]; // Would fetch from WMS (read-only)
    workOrders: WorkOrder[]; // Would fetch from Facility (read-only)
  }> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Would fetch tasks from WMS service (read-only, no duplication)
    const tasks: any[] = [];
    // Would fetch work orders from Facility service (read-only, no duplication)
    const workOrders: WorkOrder[] = [];

    return {
      project,
      tasks,
      workOrders,
    };
  }

  /**
   * Get projects
   */
  async getProjects(filters: {
    tenantId: string;
    status?: Project["status"];
    projectType?: Project["projectType"];
  }): Promise<Project[]> {
    let projects = Array.from(this.projects.values()).filter(
      (p) => p.tenantId === filters.tenantId,
    );

    if (filters.status) {
      projects = projects.filter((p) => p.status === filters.status);
    }

    if (filters.projectType) {
      projects = projects.filter((p) => p.projectType === filters.projectType);
    }

    return projects.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<Project | null> {
    return this.projects.get(projectId) || null;
  }
}

export const projectService = new ProjectService();

// Initialize event handlers on service creation
if (typeof window === "undefined") {
  projectService.initializeEventHandlers();
}
