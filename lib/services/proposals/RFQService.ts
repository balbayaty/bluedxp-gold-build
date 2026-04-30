/**
 * RFQ Service
 * Comprehensive Request for Quotation management
 */

import {
  RFQ,
  RFQStatus,
  RFQPriority,
  RFQCustomer,
  ServiceRequirement,
  ShipmentRequirement,
  RouteRequirement,
  VolumeRequirement,
  RFQTimeline,
  RFQWorkflow,
  RFQWorkflowStep,
} from "@/types/rfq";

// Mock storage
let rfqStorage: RFQ[] = [];
let workflowStorage: RFQWorkflow[] = [];

export class RFQService {
  // RFQ Number Generation
  private generateRFQNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const sequence = String(rfqStorage.length + 1).padStart(4, "0");
    return `RFQ-${year}${month}-${sequence}`;
  }

  // Create new RFQ
  async createRFQ(data: Partial<RFQ>): Promise<RFQ> {
    const rfq: RFQ = {
      id: `rfq-${Date.now()}`,
      rfqNumber: this.generateRFQNumber(),
      title: data.title || "New RFQ",
      description: data.description || "",
      status: "DRAFT",
      priority: data.priority || "MEDIUM",
      source: data.source || "DIRECT",
      customer: data.customer!,
      serviceRequirements: data.serviceRequirements || [],
      shipmentDetails: data.shipmentDetails,
      routes: data.routes || [],
      volumeDetails: data.volumeDetails || {
        frequency: "ONE_TIME",
        estimatedVolume: 0,
        volumeUnit: "MT",
      },
      timeline: data.timeline || {
        requestDate: new Date().toISOString(),
        responseDeadline: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        urgency: "MEDIUM",
      },
      attachments: data.attachments || [],
      assignedTo: data.assignedTo,
      estimatedValue: data.estimatedValue,
      currency: data.currency || "SAR",
      notes: data.notes || [],
      createdBy: data.createdBy || "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      validUntil: data.validUntil,
    };

    rfqStorage.push(rfq);

    // Initialize workflow
    await this.initializeWorkflow(rfq.id);

    return rfq;
  }

  // Get RFQ by ID
  async getRFQ(id: string): Promise<RFQ | null> {
    return rfqStorage.find((r) => r.id === id) || null;
  }

  // List RFQs with filters
  async listRFQs(filters?: {
    status?: RFQStatus;
    priority?: RFQPriority;
    customerId?: string;
    assignedTo?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<RFQ[]> {
    let results = [...rfqStorage];

    if (filters) {
      if (filters.status) {
        results = results.filter((r) => r.status === filters.status);
      }
      if (filters.priority) {
        results = results.filter((r) => r.priority === filters.priority);
      }
      if (filters.customerId) {
        results = results.filter((r) => r.customer.id === filters.customerId);
      }
      if (filters.assignedTo) {
        results = results.filter((r) => r.assignedTo === filters.assignedTo);
      }
      if (filters.dateFrom) {
        results = results.filter(
          (r) => new Date(r.createdAt) >= new Date(filters.dateFrom!),
        );
      }
      if (filters.dateTo) {
        results = results.filter(
          (r) => new Date(r.createdAt) <= new Date(filters.dateTo!),
        );
      }
    }

    return results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // Update RFQ
  async updateRFQ(id: string, updates: Partial<RFQ>): Promise<RFQ | null> {
    const index = rfqStorage.findIndex((r) => r.id === id);
    if (index === -1) return null;

    rfqStorage[index] = {
      ...rfqStorage[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return rfqStorage[index];
  }

  // Update RFQ Status
  async updateStatus(id: string, status: RFQStatus): Promise<RFQ | null> {
    return this.updateRFQ(id, { status });
  }

  // Submit RFQ for processing
  async submitRFQ(id: string): Promise<RFQ | null> {
    const rfq = await this.getRFQ(id);
    if (!rfq) return null;

    // Validate RFQ before submission
    const validation = this.validateRFQ(rfq);
    if (!validation.valid) {
      throw new Error(`RFQ validation failed: ${validation.errors.join(", ")}`);
    }

    return this.updateRFQ(id, {
      status: "SUBMITTED",
      submittedAt: new Date().toISOString(),
    });
  }

  // Validate RFQ
  validateRFQ(rfq: RFQ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rfq.title?.trim()) errors.push("Title is required");
    if (!rfq.customer?.companyName) errors.push("Customer is required");
    if (!rfq.serviceRequirements?.length)
      errors.push("At least one service is required");
    if (!rfq.timeline?.responseDeadline)
      errors.push("Response deadline is required");

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Assign RFQ to user
  async assignRFQ(id: string, userId: string): Promise<RFQ | null> {
    return this.updateRFQ(id, {
      assignedTo: userId,
      status: "UNDER_REVIEW",
    });
  }

  // Initialize Workflow
  async initializeWorkflow(rfqId: string): Promise<RFQWorkflow> {
    const workflow: RFQWorkflow = {
      rfqId,
      currentStep: "receive",
      steps: [
        { id: "receive", name: "Receive RFQ", status: "COMPLETED" },
        { id: "review", name: "Initial Review", status: "PENDING" },
        { id: "pricing", name: "Pricing Analysis", status: "PENDING" },
        { id: "approve", name: "Management Approval", status: "PENDING" },
        { id: "proposal", name: "Generate Proposal", status: "PENDING" },
        { id: "send", name: "Send to Customer", status: "PENDING" },
      ],
    };

    workflowStorage.push(workflow);
    return workflow;
  }

  // Get Workflow
  async getWorkflow(rfqId: string): Promise<RFQWorkflow | null> {
    return workflowStorage.find((w) => w.rfqId === rfqId) || null;
  }

  // Advance Workflow
  async advanceWorkflow(rfqId: string): Promise<RFQWorkflow | null> {
    const index = workflowStorage.findIndex((w) => w.rfqId === rfqId);
    if (index === -1) return null;

    const workflow = workflowStorage[index];
    const currentStepIndex = workflow.steps.findIndex(
      (s) => s.id === workflow.currentStep,
    );

    if (currentStepIndex < workflow.steps.length - 1) {
      // Complete current step
      workflow.steps[currentStepIndex].status = "COMPLETED";
      workflow.steps[currentStepIndex].completedAt = new Date().toISOString();

      // Move to next step
      workflow.currentStep = workflow.steps[currentStepIndex + 1].id;
      workflow.steps[currentStepIndex + 1].status = "IN_PROGRESS";

      workflowStorage[index] = workflow;
    }

    return workflow;
  }

  // Calculate estimated value
  calculateEstimatedValue(rfq: RFQ): number {
    let total = 0;

    // Base calculation from service requirements
    rfq.serviceRequirements.forEach((req) => {
      const quantity = req.quantity || 1;
      // Use default rates per category
      const baseRate = this.getBaseRate(req.category);
      total += quantity * baseRate;
    });

    // Add volume factor
    const volumeFactor = this.getVolumeFactor(rfq.volumeDetails);
    total *= volumeFactor;

    // Add route complexity
    if (rfq.routes) {
      rfq.routes.forEach((route) => {
        if (route.estimatedDistance) {
          total += route.estimatedDistance * 2; // SAR 2 per km base
        }
      });
    }

    return Math.round(total * 100) / 100;
  }

  private getBaseRate(category: string): number {
    const rates: Record<string, number> = {
      WAREHOUSING: 50,
      TRANSPORTATION: 100,
      CUSTOMS_CLEARANCE: 500,
      FREIGHT_FORWARDING: 200,
      SUPPLY_CHAIN: 150,
      VALUE_ADDED: 75,
      MULTIMODAL: 300,
      CROSS_BORDER: 400,
      RAIL_FREIGHT: 250,
      SEA_FREIGHT: 180,
      AIR_FREIGHT: 500,
      COLD_CHAIN: 300,
      HAZMAT: 400,
      PROJECT_LOGISTICS: 1000,
    };
    return rates[category] || 100;
  }

  private getVolumeFactor(volume: VolumeRequirement): number {
    const factors: Record<string, number> = {
      ONE_TIME: 1.0,
      DAILY: 0.7,
      WEEKLY: 0.8,
      MONTHLY: 0.85,
      QUARTERLY: 0.9,
      ANNUAL: 0.75,
    };
    return factors[volume.frequency] || 1.0;
  }

  // Get RFQ Statistics
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<RFQStatus, number>;
    byPriority: Record<RFQPriority, number>;
    averageResponseTime: number;
    conversionRate: number;
  }> {
    const all = rfqStorage;

    const byStatus = all.reduce(
      (acc, rfq) => {
        acc[rfq.status] = (acc[rfq.status] || 0) + 1;
        return acc;
      },
      {} as Record<RFQStatus, number>,
    );

    const byPriority = all.reduce(
      (acc, rfq) => {
        acc[rfq.priority] = (acc[rfq.priority] || 0) + 1;
        return acc;
      },
      {} as Record<RFQPriority, number>,
    );

    const accepted = all.filter((r) => r.status === "ACCEPTED").length;
    const completed = all.filter((r) =>
      ["ACCEPTED", "REJECTED", "EXPIRED"].includes(r.status),
    ).length;

    return {
      total: all.length,
      byStatus,
      byPriority,
      averageResponseTime: 48, // hours (mock)
      conversionRate: completed > 0 ? (accepted / completed) * 100 : 0,
    };
  }

  // Search RFQs
  async searchRFQs(query: string): Promise<RFQ[]> {
    const lowerQuery = query.toLowerCase();
    return rfqStorage.filter(
      (rfq) =>
        rfq.title.toLowerCase().includes(lowerQuery) ||
        rfq.rfqNumber.toLowerCase().includes(lowerQuery) ||
        rfq.customer.companyName.toLowerCase().includes(lowerQuery) ||
        rfq.description.toLowerCase().includes(lowerQuery),
    );
  }

  // Delete RFQ (soft delete)
  async deleteRFQ(id: string): Promise<boolean> {
    const index = rfqStorage.findIndex((r) => r.id === id);
    if (index === -1) return false;

    // Only allow deletion of draft RFQs
    if (rfqStorage[index].status !== "DRAFT") {
      throw new Error("Only draft RFQs can be deleted");
    }

    rfqStorage.splice(index, 1);
    return true;
  }

  // Duplicate RFQ
  async duplicateRFQ(id: string): Promise<RFQ | null> {
    const original = await this.getRFQ(id);
    if (!original) return null;

    return this.createRFQ({
      ...original,
      title: `${original.title} (Copy)`,
      status: "DRAFT" as RFQStatus,
    });
  }
}

// Export singleton instance
export const rfqService = new RFQService();
