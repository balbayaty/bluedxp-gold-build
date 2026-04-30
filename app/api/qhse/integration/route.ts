/**
 * QHSE Ecosystem Integration API Route
 * Provides cross-module integration endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseEcosystemIntegrationService } from "@/lib/services/qhse/integration/qhseEcosystemIntegrationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// GET - Get integration options and related items
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const incidentId = searchParams.get("incidentId");
    const inspectionId = searchParams.get("inspectionId");
    const employeeId = searchParams.get("employeeId");
    const facilityId = searchParams.get("facilityId");
    const warehouseId = searchParams.get("warehouseId");

    if (action === "get-related-ncrs" && incidentId) {
      const ncrs =
        await qhseEcosystemIntegrationService.getRelatedNCRs(incidentId);
      return NextResponse.json({ success: true, data: ncrs });
    }

    if (action === "get-related-capas" && incidentId) {
      const capas =
        await qhseEcosystemIntegrationService.getRelatedCAPAs(incidentId);
      return NextResponse.json({ success: true, data: capas });
    }

    if (action === "get-warehouse-operations" && incidentId) {
      const operations =
        await qhseEcosystemIntegrationService.getWarehouseOperations(
          incidentId,
        );
      return NextResponse.json({ success: true, data: operations });
    }

    if (action === "get-employee-training" && employeeId) {
      const training =
        await qhseEcosystemIntegrationService.getEmployeeTrainingRecords(
          employeeId,
        );
      return NextResponse.json({ success: true, data: training });
    }

    if (action === "get-employee-safety" && employeeId) {
      const safety =
        await qhseEcosystemIntegrationService.getEmployeeSafetyPerformance(
          employeeId,
        );
      return NextResponse.json({ success: true, data: safety });
    }

    if (action === "get-facility-metrics" && facilityId) {
      const metrics =
        await qhseEcosystemIntegrationService.getFacilitySafetyMetrics(
          facilityId,
        );
      return NextResponse.json({ success: true, data: metrics });
    }

    if (action === "get-inventory-at-location" && warehouseId) {
      const inventory =
        await qhseEcosystemIntegrationService.getInventoryAtLocation(
          warehouseId,
        );
      return NextResponse.json({ success: true, data: inventory });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action or missing parameters" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in QHSE integration API:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process integration request",
      },
      { status: 500 },
    );
  }
}

// POST - Create integrations (NCR, CAPA, links)
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "create-ncr-from-incident" && body.incidentId) {
      const result =
        await qhseEcosystemIntegrationService.createNCRFromIncident(
          body.incidentId,
        );
      return NextResponse.json(
        { success: true, data: result },
        { status: 201 },
      );
    }

    if (
      action === "create-capa-from-qhse" &&
      body.sourceType &&
      body.sourceId
    ) {
      const result = await qhseEcosystemIntegrationService.createCAPAFromQHSE(
        body.sourceType,
        body.sourceId,
      );
      return NextResponse.json(
        { success: true, data: result },
        { status: 201 },
      );
    }

    if (action === "link-incident-to-ncr" && body.incidentId && body.ncrId) {
      await qhseEcosystemIntegrationService.linkIncidentToNCR(
        body.incidentId,
        body.ncrId,
      );
      return NextResponse.json({ success: true });
    }

    if (
      action === "link-incident-to-warehouse" &&
      body.incidentId &&
      body.operationId
    ) {
      await qhseEcosystemIntegrationService.linkIncidentToWarehouseOperation(
        body.incidentId,
        body.operationId,
      );
      return NextResponse.json({ success: true });
    }

    if (
      action === "link-incident-to-shipment" &&
      body.incidentId &&
      body.shipmentId
    ) {
      await qhseEcosystemIntegrationService.linkIncidentToShipment(
        body.incidentId,
        body.shipmentId,
      );
      return NextResponse.json({ success: true });
    }

    if (
      action === "link-incident-to-chemical" &&
      body.incidentId &&
      body.chemicalId
    ) {
      await qhseEcosystemIntegrationService.linkIncidentToChemical(
        body.incidentId,
        body.chemicalId,
      );
      return NextResponse.json({ success: true });
    }

    if (
      action === "link-incident-to-asset" &&
      body.incidentId &&
      body.assetId
    ) {
      await qhseEcosystemIntegrationService.linkIncidentToAsset(
        body.incidentId,
        body.assetId,
      );
      return NextResponse.json({ success: true });
    }

    if (action === "sync-training-with-hr" && body.trainingRecordId) {
      await qhseEcosystemIntegrationService.syncTrainingWithHR(
        body.trainingRecordId,
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action or missing parameters" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in QHSE integration API:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process integration request",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.integration",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.integration",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
