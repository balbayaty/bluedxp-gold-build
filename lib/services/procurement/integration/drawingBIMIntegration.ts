/**
 * Drawing & BIM Integration Service
 * Integration with Facility BIM services - drawing management, BIM integration, specification management
 * ZERO DUPLICATION - Reuses Facility BIM services
 */

import { eventBus } from "@/lib/services/event-store";
import { requisitionService } from "../requisitionService";
import { materialProcurementService } from "../materialProcurementService";
import type { DomainEvent } from "@/types/cqrs";

// TODO: Import Facility BIM services when available
// import { cadDocumentService } from '@/lib/services/facility/cad/cadDocumentService'
// import { bimMarketplaceService } from '@/lib/services/facility/bim/bimMarketplaceService'
// import { bimAIAnalysisService } from '@/lib/services/facility/bim/bimAIAnalysisService'

export interface Drawing {
  drawingId: string;
  drawingNumber: string;
  revision: string;
  title: string;
  projectId?: string;
  phaseId?: string;
  drawingType:
    | "ARCHITECTURAL"
    | "STRUCTURAL"
    | "MEP"
    | "CIVIL"
    | "SITE"
    | "DETAIL";
  fileUrl?: string;
  issuedDate: Date | string;
  status: "DRAFT" | "ISSUED" | "SUPERSEDED";
}

export interface DrawingLink {
  drawingId: string;
  drawingNumber: string;
  linkedToType: "REQUISITION" | "PURCHASE_ORDER" | "MATERIAL" | "WORK_PACKAGE";
  linkedToId: string;
  linkedAt: Date | string;
}

export interface BIMQuantity {
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  location?: string;
  phase?: string;
}

export class DrawingBIMIntegrationService {
  private drawings: Map<string, Drawing> = new Map();
  private drawingLinks: Map<string, DrawingLink[]> = new Map();

  /**
   * Register drawing
   * Link drawing to procurement
   */
  async registerDrawing(
    tenantId: string,
    drawing: Omit<Drawing, "drawingId">,
  ): Promise<Drawing> {
    // TODO: Integrate with Facility CAD service
    // const cadDocument = await cadDocumentService.createDocument({
    //   tenantId,
    //   documentNumber: drawing.drawingNumber,
    //   revision: drawing.revision,
    //   type: 'DRAWING',
    // })

    const drawingId = `drawing-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const drawingRecord: Drawing = {
      ...drawing,
      drawingId,
    };

    this.drawings.set(drawingId, drawingRecord);

    await eventBus.publish({
      type: "procurement.drawing.registered",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        drawingId,
        drawingNumber: drawing.drawingNumber,
        projectId: drawing.projectId,
      },
    } as DomainEvent);

    return drawingRecord;
  }

  /**
   * Link drawing to requisition/PO
   */
  async linkDrawing(
    tenantId: string,
    drawingId: string,
    linkedToType: DrawingLink["linkedToType"],
    linkedToId: string,
  ): Promise<DrawingLink> {
    const drawing = this.drawings.get(drawingId);
    if (!drawing) {
      throw new Error("Drawing not found");
    }

    const link: DrawingLink = {
      drawingId,
      drawingNumber: drawing.drawingNumber,
      linkedToType,
      linkedToId,
      linkedAt: new Date().toISOString(),
    };

    const existingLinks = this.drawingLinks.get(linkedToId) || [];
    existingLinks.push(link);
    this.drawingLinks.set(linkedToId, existingLinks);

    await eventBus.publish({
      type: "procurement.drawing.linked",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        drawingId,
        linkedToType,
        linkedToId,
      },
    } as DomainEvent);

    return link;
  }

  /**
   * Extract quantities from BIM model
   * Use Facility BIM service to extract material quantities
   */
  async extractQuantitiesFromBIM(
    tenantId: string,
    bimModelId: string,
    projectId?: string,
    phaseId?: string,
  ): Promise<BIMQuantity[]> {
    // TODO: Call Facility BIM AI analysis service
    // const analysis = await bimAIAnalysisService.extractQuantities({
    //   tenantId,
    //   bimModelId,
    //   projectId,
    //   phaseId,
    // })

    // Mock quantities
    return [
      {
        materialCode: "MAT-001",
        materialName: "Concrete Mix",
        quantity: 1000,
        unit: "M3",
        location: "Foundation",
        phase: "Foundation",
      },
      {
        materialCode: "MAT-002",
        materialName: "Steel Rebar",
        quantity: 50,
        unit: "TON",
        location: "Foundation",
        phase: "Foundation",
      },
    ];
  }

  /**
   * Create requisition from BIM quantities
   * Auto-generate requisition from BIM model
   */
  async createRequisitionFromBIM(
    tenantId: string,
    bimModelId: string,
    projectId?: string,
    phaseId?: string,
  ): Promise<{ requisitionId: string; requisitionNumber: string }> {
    const quantities = await this.extractQuantitiesFromBIM(
      tenantId,
      bimModelId,
      projectId,
      phaseId,
    );

    const requisition = await requisitionService.createRequisition(
      {
        tenantId,
        type: "MATERIAL",
        title: `BIM-Based Requisition: ${bimModelId}`,
        requestedBy: "system",
        items: quantities.map((qty) => ({
          itemName: qty.materialName,
          itemCode: qty.materialCode,
          quantity: qty.quantity,
          unit: qty.unit,
          currency: "SAR",
        })),
        projectId,
        phaseId,
        notes: `Auto-generated from BIM model ${bimModelId}`,
      },
      "system",
    );

    await eventBus.publish({
      type: "procurement.bim.requisition.created",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        requisitionId: requisition.id,
        bimModelId,
        projectId,
        phaseId,
      },
    } as DomainEvent);

    return {
      requisitionId: requisition.id,
      requisitionNumber: requisition.requisitionNumber,
    };
  }

  /**
   * Create material takeoff from drawing
   * Extract quantities from drawing
   */
  async createMaterialTakeoffFromDrawing(
    tenantId: string,
    drawingId: string,
    projectId?: string,
  ): Promise<
    Array<{
      materialCode: string;
      materialName: string;
      quantity: number;
      unit: string;
    }>
  > {
    const drawing = this.drawings.get(drawingId);
    if (!drawing) {
      throw new Error("Drawing not found");
    }

    // TODO: Use AI vision service to extract quantities from drawing
    // const takeoff = await visionService.extractQuantitiesFromDrawing(drawing.fileUrl)

    // Mock takeoff
    return [
      {
        materialCode: "MAT-001",
        materialName: "Concrete",
        quantity: 500,
        unit: "M3",
      },
    ];
  }

  /**
   * Get drawings linked to PO/Requisition
   */
  async getLinkedDrawings(
    tenantId: string,
    linkedToType: DrawingLink["linkedToType"],
    linkedToId: string,
  ): Promise<Drawing[]> {
    const links = this.drawingLinks.get(linkedToId) || [];
    const drawingIds = links
      .filter((l) => l.linkedToType === linkedToType)
      .map((l) => l.drawingId);

    return drawingIds
      .map((id) => this.drawings.get(id))
      .filter((d): d is Drawing => d !== undefined);
  }

  /**
   * Initialize Drawing & BIM event subscriptions
   */
  initializeDrawingEventSubscriptions(): void {
    // Subscribe to Facility BIM events
    eventBus.subscribe(
      "facility.bim.model.updated",
      async (event: DomainEvent) => {
        console.log("Facility BIM model updated:", event.data);
        // Check if procurement requisitions need updating
      },
    );

    // Subscribe to drawing revision events
    eventBus.subscribe(
      "facility.cad.drawing.revised",
      async (event: DomainEvent) => {
        console.log("Drawing revised:", event.data);
        // Analyze impact on procurement orders
      },
    );
  }
}

// Singleton instance
export const drawingBIMIntegrationService = new DrawingBIMIntegrationService();

// Initialize event subscriptions
drawingBIMIntegrationService.initializeDrawingEventSubscriptions();
