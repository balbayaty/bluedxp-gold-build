/**
 * Project Procurement Service
 * Construction project-based procurement - phases, work packages, cost codes
 * Deep integration with Finance (project budgets, cost allocation)
 */

import { eventBus } from "@/lib/services/event-store";
import { requisitionService } from "./requisitionService";
import { purchaseOrderService } from "./purchaseOrderService";
import { financeIntegrationService } from "./integration/financeIntegration";
import type { DomainEvent } from "@/types/cqrs";

export interface Project {
  id: string;
  tenantId: string;
  projectNumber: string;
  projectName: string;
  description?: string;
  projectType:
    | "CONSTRUCTION"
    | "RENOVATION"
    | "MAINTENANCE"
    | "INFRASTRUCTURE"
    | "OTHER";
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  startDate: Date | string;
  endDate?: Date | string;
  phases: ProjectPhase[];
  budgetId?: string;
  totalBudget?: number;
  committedBudget?: number;
  spentBudget?: number;
  availableBudget?: number;
  createdAt: Date | string;
  createdBy: string;
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  phaseNumber: string;
  phaseName: string;
  description?: string;
  phaseType:
    | "DESIGN"
    | "PROCUREMENT"
    | "CONSTRUCTION"
    | "COMMISSIONING"
    | "HANDOVER";
  startDate: Date | string;
  endDate?: Date | string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
  workPackages: WorkPackage[];
  budgetId?: string;
  totalBudget?: number;
  committedBudget?: number;
  spentBudget?: number;
}

export interface WorkPackage {
  id: string;
  phaseId: string;
  projectId: string;
  workPackageNumber: string;
  workPackageName: string;
  description?: string;
  trade?: string; // e.g., 'CIVIL', 'MEP', 'FINISHES'
  startDate: Date | string;
  endDate?: Date | string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  costCodes: CostCode[];
  budgetId?: string;
  totalBudget?: number;
  committedBudget?: number;
  spentBudget?: number;
}

export interface CostCode {
  id: string;
  workPackageId: string;
  code: string; // CSI MasterFormat, Uniformat, or custom
  description: string;
  category?: string;
  budget?: number;
  committed?: number;
  spent?: number;
}

export interface ProjectProcurementSummary {
  projectId: string;
  projectName: string;
  totalRequisitions: number;
  totalPurchaseOrders: number;
  totalSpend: number;
  committedSpend: number;
  budgetVariance: number;
  byPhase: Array<{
    phaseId: string;
    phaseName: string;
    totalSpend: number;
    committedSpend: number;
  }>;
  byWorkPackage: Array<{
    workPackageId: string;
    workPackageName: string;
    totalSpend: number;
    committedSpend: number;
  }>;
  byCostCode: Array<{
    costCode: string;
    description: string;
    totalSpend: number;
    committedSpend: number;
  }>;
}

// In-memory storage
const projects = new Map<string, Project>();

// Project number generator
let projectCounter = 1;

function generateProjectNumber(): string {
  const year = new Date().getFullYear();
  const number = String(projectCounter++).padStart(4, "0");
  return `PROJ-${year}-${number}`;
}

export class ProjectProcurementService {
  /**
   * Create project
   */
  async createProject(
    tenantId: string,
    projectName: string,
    projectType: Project["projectType"],
    startDate: Date | string,
    endDate?: Date | string,
    description?: string,
    budgetId?: string,
    totalBudget?: number,
    userId: string = "system",
  ): Promise<Project> {
    const projectNumber = generateProjectNumber();
    const projectId = `project-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const project: Project = {
      id: projectId,
      tenantId,
      projectNumber,
      projectName,
      description,
      projectType,
      status: "PLANNING",
      startDate,
      endDate,
      phases: [],
      budgetId,
      totalBudget,
      committedBudget: 0,
      spentBudget: 0,
      availableBudget: totalBudget,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    projects.set(projectId, project);

    // Publish event
    await eventBus.publish({
      type: "procurement.project.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        projectId,
        projectNumber,
        tenantId,
        projectName,
        projectType,
        budgetId,
        totalBudget,
      },
    } as DomainEvent);

    return project;
  }

  /**
   * Add phase to project
   */
  async addPhase(
    projectId: string,
    tenantId: string,
    phaseName: string,
    phaseType: ProjectPhase["phaseType"],
    startDate: Date | string,
    endDate?: Date | string,
    description?: string,
    budgetId?: string,
    totalBudget?: number,
  ): Promise<ProjectPhase> {
    const project = projects.get(projectId);
    if (!project || project.tenantId !== tenantId) {
      throw new Error("Project not found");
    }

    const phaseNumber = `P${project.phases.length + 1}`;
    const phaseId = `phase-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const phase: ProjectPhase = {
      id: phaseId,
      projectId,
      phaseNumber,
      phaseName,
      description,
      phaseType,
      startDate,
      endDate,
      status: "PLANNED",
      workPackages: [],
      budgetId,
      totalBudget,
      committedBudget: 0,
      spentBudget: 0,
    };

    project.phases.push(phase);
    projects.set(projectId, project);

    return phase;
  }

  /**
   * Add work package to phase
   */
  async addWorkPackage(
    phaseId: string,
    projectId: string,
    tenantId: string,
    workPackageName: string,
    trade?: string,
    startDate?: Date | string,
    endDate?: Date | string,
    description?: string,
    budgetId?: string,
    totalBudget?: number,
  ): Promise<WorkPackage> {
    const project = projects.get(projectId);
    if (!project || project.tenantId !== tenantId) {
      throw new Error("Project not found");
    }

    const phase = project.phases.find((p) => p.id === phaseId);
    if (!phase) {
      throw new Error("Phase not found");
    }

    const workPackageNumber = `WP${phase.workPackages.length + 1}`;
    const workPackageId = `wp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const workPackage: WorkPackage = {
      id: workPackageId,
      phaseId,
      projectId,
      workPackageNumber,
      workPackageName,
      description,
      trade,
      startDate: startDate || phase.startDate,
      endDate,
      status: "PLANNED",
      costCodes: [],
      budgetId,
      totalBudget,
      committedBudget: 0,
      spentBudget: 0,
    };

    phase.workPackages.push(workPackage);
    projects.set(projectId, project);

    return workPackage;
  }

  /**
   * Add cost code to work package
   */
  async addCostCode(
    workPackageId: string,
    projectId: string,
    tenantId: string,
    code: string,
    description: string,
    category?: string,
    budget?: number,
  ): Promise<CostCode> {
    const project = projects.get(projectId);
    if (!project || project.tenantId !== tenantId) {
      throw new Error("Project not found");
    }

    const phase = project.phases.find((p) =>
      p.workPackages.some((wp) => wp.id === workPackageId),
    );
    if (!phase) {
      throw new Error("Phase not found");
    }

    const workPackage = phase.workPackages.find(
      (wp) => wp.id === workPackageId,
    );
    if (!workPackage) {
      throw new Error("Work package not found");
    }

    const costCodeId = `cc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const costCode: CostCode = {
      id: costCodeId,
      workPackageId,
      code,
      description,
      category,
      budget,
      committed: 0,
      spent: 0,
    };

    workPackage.costCodes.push(costCode);
    projects.set(projectId, project);

    return costCode;
  }

  /**
   * Get project procurement summary
   */
  async getProjectProcurementSummary(
    projectId: string,
    tenantId: string,
  ): Promise<ProjectProcurementSummary> {
    const project = projects.get(projectId);
    if (!project || project.tenantId !== tenantId) {
      throw new Error("Project not found");
    }

    // Get all requisitions for project
    const requisitions = await requisitionService.listRequisitions({
      tenantId,
      projectId,
    });

    // Get all POs for project
    const purchaseOrders = await purchaseOrderService.listPurchaseOrders({
      tenantId,
      projectId,
    });

    // Calculate totals
    const totalRequisitions = requisitions.length;
    const totalPurchaseOrders = purchaseOrders.length;
    const totalSpend = purchaseOrders
      .filter((po) => po.status === "RECEIVED" || po.status === "COMPLETED")
      .reduce((sum, po) => sum + po.totalAmount, 0);
    const committedSpend = purchaseOrders
      .filter((po) => po.status !== "CANCELLED")
      .reduce((sum, po) => sum + po.totalAmount, 0);

    const budgetVariance = project.totalBudget
      ? project.totalBudget - committedSpend
      : 0;

    // Summarize by phase
    const byPhase = project.phases.map((phase) => {
      const phasePOs = purchaseOrders.filter((po) => po.phaseId === phase.id);
      return {
        phaseId: phase.id,
        phaseName: phase.phaseName,
        totalSpend: phasePOs
          .filter((po) => po.status === "RECEIVED" || po.status === "COMPLETED")
          .reduce((sum, po) => sum + po.totalAmount, 0),
        committedSpend: phasePOs
          .filter((po) => po.status !== "CANCELLED")
          .reduce((sum, po) => sum + po.totalAmount, 0),
      };
    });

    // Summarize by work package
    const byWorkPackage = project.phases.flatMap((phase) =>
      phase.workPackages.map((wp) => {
        const wpPOs = purchaseOrders.filter((po) => po.workPackageId === wp.id);
        return {
          workPackageId: wp.id,
          workPackageName: wp.workPackageName,
          totalSpend: wpPOs
            .filter(
              (po) => po.status === "RECEIVED" || po.status === "COMPLETED",
            )
            .reduce((sum, po) => sum + po.totalAmount, 0),
          committedSpend: wpPOs
            .filter((po) => po.status !== "CANCELLED")
            .reduce((sum, po) => sum + po.totalAmount, 0),
        };
      }),
    );

    // Summarize by cost code
    const byCostCode = project.phases.flatMap((phase) =>
      phase.workPackages.flatMap((wp) =>
        wp.costCodes.map((cc) => {
          const ccPOs = purchaseOrders.filter((po) =>
            po.costAllocations?.some((alloc) => alloc.costCode === cc.code),
          );
          return {
            costCode: cc.code,
            description: cc.description,
            totalSpend: ccPOs
              .filter(
                (po) => po.status === "RECEIVED" || po.status === "COMPLETED",
              )
              .reduce((sum, po) => sum + po.totalAmount, 0),
            committedSpend: ccPOs
              .filter((po) => po.status !== "CANCELLED")
              .reduce((sum, po) => sum + po.totalAmount, 0),
          };
        }),
      ),
    );

    return {
      projectId,
      projectName: project.projectName,
      totalRequisitions,
      totalPurchaseOrders,
      totalSpend,
      committedSpend,
      budgetVariance,
      byPhase,
      byWorkPackage,
      byCostCode,
    };
  }

  /**
   * Get project by ID
   */
  async getProject(
    projectId: string,
    tenantId: string,
  ): Promise<Project | null> {
    const project = projects.get(projectId);
    if (!project || project.tenantId !== tenantId) {
      return null;
    }
    return project;
  }

  /**
   * List projects
   */
  async listProjects(
    tenantId: string,
    filters?: {
      status?: Project["status"][];
      projectType?: Project["projectType"][];
    },
  ): Promise<Project[]> {
    let results = Array.from(projects.values()).filter(
      (p) => p.tenantId === tenantId,
    );

    if (filters) {
      if (filters.status && filters.status.length > 0) {
        results = results.filter((p) => filters.status!.includes(p.status));
      }
      if (filters.projectType && filters.projectType.length > 0) {
        results = results.filter((p) =>
          filters.projectType!.includes(p.projectType),
        );
      }
    }

    return results;
  }
}

// Singleton instance
export const projectProcurementService = new ProjectProcurementService();
