/**
 * HR Module Integration Service
 * Integration with HR module - manpower procurement, contractor management, skills-based sourcing
 * ZERO DUPLICATION - Reuses HR services
 */

import { eventBus } from "@/lib/services/event-store";
import { requisitionService } from "../requisitionService";
import { purchaseOrderService } from "../purchaseOrderService";
import type { DomainEvent } from "@/types/cqrs";

// TODO: Import HR services when available
// import { employeeService } from '@/lib/services/hr/employee/employeeService'
// import { contractorService } from '@/lib/services/hr/contractor/contractorService'
// import { competencyMatrixService } from '@/lib/services/hr/competency/competencyMatrixService'

export interface ManpowerRequirement {
  requisitionId: string;
  skillRequirements: Array<{
    skill: string;
    level: "BASIC" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
    quantity: number;
    duration?: number; // Days
  }>;
  location?: string;
  startDate: Date | string;
  endDate?: Date | string;
  projectId?: string;
}

export interface ContractorMatch {
  contractorId: string;
  contractorName: string;
  matchScore: number;
  skills: Array<{
    skill: string;
    level: string;
    match: boolean;
  }>;
  availability: boolean;
  rate: number;
  currency: string;
}

export class HRIntegrationService {
  /**
   * Create manpower requisition
   * Auto-create requisition for temporary staffing or contractor services
   */
  async createManpowerRequisition(
    tenantId: string,
    requirement: ManpowerRequirement,
  ): Promise<{ requisitionId: string; requisitionNumber: string }> {
    // TODO: Call HR service to find available contractors/employees
    // const availableResources = await this.findAvailableResources(requirement)

    const requisition = await requisitionService.createRequisition(
      {
        tenantId,
        type: "SERVICE",
        title: `Manpower Requisition: ${requirement.skillRequirements.map((s) => s.skill).join(", ")}`,
        requestedBy: "system",
        items: requirement.skillRequirements.map((skill) => ({
          itemName: `Manpower: ${skill.skill} (${skill.level})`,
          quantity: skill.quantity,
          unit: "PERSON",
          currency: "SAR",
          specifications: `Skill Level: ${skill.level}, Duration: ${skill.duration || "TBD"} days`,
        })),
        projectId: requirement.projectId,
        notes: `Manpower requirement for ${requirement.location || "Multiple locations"}. Start: ${requirement.startDate}`,
      },
      "system",
    );

    await eventBus.publish({
      type: "procurement.hr.manpower-requisition.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        requisitionId: requisition.id,
        skillRequirements: requirement.skillRequirements,
      },
    } as DomainEvent);

    return {
      requisitionId: requisition.id,
      requisitionNumber: requisition.requisitionNumber,
    };
  }

  /**
   * Find contractors matching skill requirements
   * Skills-based sourcing using HR competency matrix
   */
  async findMatchingContractors(
    tenantId: string,
    skillRequirements: ManpowerRequirement["skillRequirements"],
  ): Promise<ContractorMatch[]> {
    // TODO: Call HR competency matrix service
    // const contractors = await competencyMatrixService.findMatchingContractors({
    //   tenantId,
    //   skills: skillRequirements.map(s => ({ skill: s.skill, level: s.level })),
    // })

    // Mock matches
    const matches: ContractorMatch[] = [
      {
        contractorId: "contractor-1",
        contractorName: "ABC Contracting",
        matchScore: 95,
        skills: skillRequirements.map((req) => ({
          skill: req.skill,
          level: req.level,
          match: true,
        })),
        availability: true,
        rate: 500,
        currency: "SAR",
      },
    ];

    return matches;
  }

  /**
   * Create contractor PO from manpower requisition
   * Auto-create service PO for contractor services
   */
  async createContractorPO(
    tenantId: string,
    requisitionId: string,
    contractorId: string,
    rate: number,
    currency: string = "SAR",
  ): Promise<{ poId: string; poNumber: string }> {
    const requisition = await requisitionService.getRequisition(
      requisitionId,
      tenantId,
    );
    if (!requisition) {
      throw new Error("Requisition not found");
    }

    // TODO: Get contractor details from HR service
    // const contractor = await contractorService.getContractor(contractorId, tenantId)

    const po = await purchaseOrderService.createPurchaseOrder(
      {
        tenantId,
        type: "SERVICE",
        vendorId: contractorId,
        requisitionId,
        items: requisition.items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: rate,
          currency,
        })),
        projectId: requisition.projectId,
        phaseId: requisition.phaseId,
        workPackageId: requisition.workPackageId,
      },
      "system",
    );

    await eventBus.publish({
      type: "procurement.hr.contractor-po.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        requisitionId,
        poId: po.id,
        contractorId,
      },
    } as DomainEvent);

    return {
      poId: po.id,
      poNumber: po.poNumber,
    };
  }

  /**
   * Track labor costs for project
   * Allocate contractor costs to projects/phases
   */
  async trackLaborCosts(
    tenantId: string,
    projectId: string,
    phaseId?: string,
    workPackageId?: string,
  ): Promise<{
    totalLaborCost: number;
    contractorCost: number;
    employeeCost: number;
    byContractor: Array<{
      contractorId: string;
      contractorName: string;
      hours: number;
      rate: number;
      totalCost: number;
    }>;
  }> {
    // TODO: Aggregate from POs and HR time tracking
    // const contractorPOs = await purchaseOrderService.listPurchaseOrders({
    //   tenantId,
    //   projectId,
    //   phaseId,
    //   workPackageId,
    //   type: 'SERVICE',
    // })
    // const timeRecords = await hrService.getTimeRecords({ projectId, phaseId })

    // Mock calculation
    return {
      totalLaborCost: 50000,
      contractorCost: 30000,
      employeeCost: 20000,
      byContractor: [
        {
          contractorId: "contractor-1",
          contractorName: "ABC Contracting",
          hours: 200,
          rate: 150,
          totalCost: 30000,
        },
      ],
    };
  }

  /**
   * Initialize HR event subscriptions
   */
  initializeHREventSubscriptions(): void {
    // Subscribe to contractor availability events
    eventBus.subscribe(
      "hr.contractor.available",
      async (event: DomainEvent) => {
        console.log("HR contractor available:", event.data);
        // Match with open manpower requisitions
      },
    );

    // Subscribe to contractor assignment events
    eventBus.subscribe("hr.contractor.assigned", async (event: DomainEvent) => {
      console.log("HR contractor assigned:", event.data);
      // Update contractor PO status
    });
  }
}

// Singleton instance
export const hrIntegrationService = new HRIntegrationService();

// Initialize event subscriptions
hrIntegrationService.initializeHREventSubscriptions();
