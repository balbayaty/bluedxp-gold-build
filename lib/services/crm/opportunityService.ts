/**
 * Opportunity Service
 * Sales pipeline management
 * LINKS to Proposals-RFQ, WMS Sales Orders, Marketplace (NO DUPLICATION)
 */

import { eventBus } from "@/lib/services/event-bus";
import type { Opportunity } from "@/types/crm";

// ============================================================================
// SERVICE
// ============================================================================

class OpportunityService {
  private opportunities: Map<string, Opportunity> = new Map();

  /**
   * Initialize event handlers to create opportunities from other modules
   */
  initializeEventHandlers(): void {
    // Subscribe to RFQ events (link RFQ to opportunity)
    eventBus.subscribe("proposals-rfq.rfq.created", async (event: any) => {
      await this.createFromRFQ(event.payload);
    });

    // Subscribe to WMS sales order events (link sales order to opportunity)
    eventBus.subscribe("wms.sales-order.created", async (event: any) => {
      await this.linkSalesOrder(event.payload);
    });

    // Subscribe to Marketplace booking events (link booking to opportunity)
    eventBus.subscribe("marketplace.booking.created", async (event: any) => {
      await this.createFromBooking(event.payload);
    });
  }

  /**
   * Create opportunity from RFQ
   * LINKS to RFQ (no duplication)
   */
  private async createFromRFQ(rfq: any): Promise<void> {
    try {
      // Check if opportunity already exists for this RFQ
      const existing = Array.from(this.opportunities.values()).find(
        (opp) => opp.source === "RFQ" && opp.sourceId === rfq.id,
      );

      if (existing) {
        return; // Already exists
      }

      const opportunity: Opportunity = {
        id: `opp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        tenantId: rfq.tenantId || "",
        name: `Opportunity from RFQ ${rfq.rfqNumber || rfq.id}`,
        description: rfq.description,
        accountId: rfq.customerId || "", // References CRM Account (which extends Customer)
        source: "RFQ",
        sourceId: rfq.id,
        stage: "DISCOVERY",
        probability: 30,
        value: rfq.estimatedValue || 0,
        currency: rfq.currency || "SAR",
        expectedCloseDate:
          rfq.requiredDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        ownerId: rfq.createdBy || "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.opportunities.set(opportunity.id, opportunity);

      // Publish event
      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "crm.opportunity.created",
        aggregateId: opportunity.id,
        aggregateType: "opportunity",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: opportunity,
      });
    } catch (error) {
      console.error("Error creating opportunity from RFQ:", error);
    }
  }

  /**
   * Link sales order to opportunity
   * LINKS to sales order (no duplication)
   */
  private async linkSalesOrder(salesOrder: any): Promise<void> {
    try {
      // Find opportunity that might be related
      const relatedOpportunity = Array.from(this.opportunities.values()).find(
        (opp) =>
          opp.accountId === salesOrder.customerId &&
          opp.stage !== "CLOSED_WON" &&
          opp.stage !== "CLOSED_LOST",
      );

      if (relatedOpportunity) {
        // Update opportunity stage and link to sales order
        relatedOpportunity.stage = "CLOSED_WON";
        relatedOpportunity.actualCloseDate = new Date().toISOString();
        relatedOpportunity.closedAt = new Date().toISOString();
        relatedOpportunity.sourceId = salesOrder.id;
        relatedOpportunity.updatedAt = new Date().toISOString();
        this.opportunities.set(relatedOpportunity.id, relatedOpportunity);

        // Publish event
        await eventBus.publish({
          id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          type: "crm.opportunity.won",
          aggregateId: relatedOpportunity.id,
          aggregateType: "opportunity",
          version: 1,
          timestamp: new Date().toISOString(),
          payload: relatedOpportunity,
        });
      }
    } catch (error) {
      console.error("Error linking sales order to opportunity:", error);
    }
  }

  /**
   * Create opportunity from marketplace booking
   * LINKS to booking (no duplication)
   */
  private async createFromBooking(booking: any): Promise<void> {
    try {
      const opportunity: Opportunity = {
        id: `opp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        tenantId: booking.tenantId || "",
        name: `Opportunity from Booking ${booking.id}`,
        accountId: booking.customerId || "",
        source: "MARKETPLACE",
        sourceId: booking.id,
        stage: "PROPOSAL",
        probability: 60,
        value: booking.totalAmount || 0,
        currency: booking.currency || "SAR",
        expectedCloseDate: booking.startDate || new Date().toISOString(),
        ownerId: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.opportunities.set(opportunity.id, opportunity);

      await eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "crm.opportunity.created",
        aggregateId: opportunity.id,
        aggregateType: "opportunity",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: opportunity,
      });
    } catch (error) {
      console.error("Error creating opportunity from booking:", error);
    }
  }

  /**
   * Create opportunity manually
   */
  async createOpportunity(input: {
    tenantId: string;
    name: string;
    description?: string;
    accountId: string;
    value: number;
    currency: string;
    expectedCloseDate: Date | string;
    ownerId: string;
    leadId?: string;
  }): Promise<Opportunity> {
    const opportunity: Opportunity = {
      id: `opp-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      accountId: input.accountId,
      leadId: input.leadId,
      stage: "DISCOVERY",
      probability: 20,
      value: input.value,
      currency: input.currency,
      expectedCloseDate: input.expectedCloseDate,
      source: "MANUAL",
      ownerId: input.ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.opportunities.set(opportunity.id, opportunity);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "crm.opportunity.created",
      aggregateId: opportunity.id,
      aggregateType: "opportunity",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: opportunity,
    });

    return opportunity;
  }

  /**
   * Get opportunities
   */
  async getOpportunities(filters: {
    tenantId: string;
    accountId?: string;
    stage?: Opportunity["stage"];
    ownerId?: string;
  }): Promise<Opportunity[]> {
    let opportunities = Array.from(this.opportunities.values()).filter(
      (opp) => opp.tenantId === filters.tenantId,
    );

    if (filters.accountId) {
      opportunities = opportunities.filter(
        (opp) => opp.accountId === filters.accountId,
      );
    }

    if (filters.stage) {
      opportunities = opportunities.filter(
        (opp) => opp.stage === filters.stage,
      );
    }

    if (filters.ownerId) {
      opportunities = opportunities.filter(
        (opp) => opp.ownerId === filters.ownerId,
      );
    }

    return opportunities.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Get opportunity by ID
   */
  async getOpportunity(opportunityId: string): Promise<Opportunity | null> {
    return this.opportunities.get(opportunityId) || null;
  }

  /**
   * Get opportunity by ID (alias for API compatibility)
   */
  async getOpportunityById(opportunityId: string): Promise<Opportunity | null> {
    return this.getOpportunity(opportunityId);
  }

  /**
   * Update opportunity
   */
  async updateOpportunity(
    opportunityId: string,
    updates: Partial<Opportunity>,
  ): Promise<Opportunity> {
    const opportunity = this.opportunities.get(opportunityId);
    if (!opportunity) {
      throw new Error(`Opportunity ${opportunityId} not found`);
    }

    const updated = {
      ...opportunity,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Handle stage changes
    if (updates.stage === "CLOSED_WON" || updates.stage === "CLOSED_LOST") {
      updated.closedAt = new Date().toISOString();
      updated.actualCloseDate = new Date().toISOString();
    }

    this.opportunities.set(opportunityId, updated);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "crm.opportunity.updated",
      aggregateId: opportunityId,
      aggregateType: "opportunity",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: updated,
    });

    return updated;
  }

  /**
   * Delete opportunity
   */
  async deleteOpportunity(opportunityId: string): Promise<void> {
    const opportunity = this.opportunities.get(opportunityId);
    if (!opportunity) {
      throw new Error(`Opportunity ${opportunityId} not found`);
    }

    this.opportunities.delete(opportunityId);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "crm.opportunity.deleted",
      aggregateId: opportunityId,
      aggregateType: "opportunity",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: { opportunityId },
    });
  }

  /**
   * Update opportunity stage
   */
  async updateStage(
    opportunityId: string,
    stage: Opportunity["stage"],
    probability: number,
  ): Promise<Opportunity> {
    const opportunity = this.opportunities.get(opportunityId);
    if (!opportunity) {
      throw new Error(`Opportunity ${opportunityId} not found`);
    }

    opportunity.stage = stage;
    opportunity.probability = probability;
    opportunity.updatedAt = new Date().toISOString();

    if (stage === "CLOSED_WON" || stage === "CLOSED_LOST") {
      opportunity.closedAt = new Date().toISOString();
      opportunity.actualCloseDate = new Date().toISOString();
    }

    this.opportunities.set(opportunityId, opportunity);

    await eventBus.publish({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "crm.opportunity.updated",
      aggregateId: opportunityId,
      aggregateType: "opportunity",
      version: 1,
      timestamp: new Date().toISOString(),
      payload: opportunity,
    });

    return opportunity;
  }
}

export const opportunityService = new OpportunityService();

// Initialize event handlers on service creation
if (typeof window === "undefined") {
  opportunityService.initializeEventHandlers();
}
