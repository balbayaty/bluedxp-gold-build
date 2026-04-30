/**
 * Carrier Collaboration Portal API
 *
 * Self-service portal for carriers
 */

import { NextRequest, NextResponse } from "next/server";
import {
  carrierCollaborationService,
  handleTransportationError,
} from "@/lib/services/transportation";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

export const POST = withTransportationAPI(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { action } = body;

      if (action === "register") {
        const { carrier } = body;
        const carrierId =
          await carrierCollaborationService.registerCarrier(carrier);
        return NextResponse.json({ carrierId }, { status: 201 });
      }

      if (action === "authenticate") {
        const { carrierId, credentials } = body;
        const result = await carrierCollaborationService.authenticateCarrier(
          carrierId,
          credentials,
        );
        return NextResponse.json(result, { status: 200 });
      }

      if (action === "update-status") {
        const { carrierId, shipmentId, status, notes } = body;
        await carrierCollaborationService.updateShipmentStatus(
          carrierId,
          shipmentId,
          status,
          notes,
        );
        return NextResponse.json({ success: true }, { status: 200 });
      }

      if (action === "add-tracking-event") {
        const { carrierId, shipmentId, event } = body;
        await carrierCollaborationService.addTrackingEvent(
          carrierId,
          shipmentId,
          event,
        );
        return NextResponse.json({ success: true }, { status: 200 });
      }

      if (action === "upload-document") {
        const { carrierId, shipmentId, document } = body;
        const documentId = await carrierCollaborationService.uploadDocument(
          carrierId,
          shipmentId,
          document,
        );
        return NextResponse.json({ documentId }, { status: 201 });
      }

      if (action === "report-exception") {
        const { carrierId, shipmentId, exception } = body;
        await carrierCollaborationService.reportException(
          carrierId,
          shipmentId,
          exception,
        );
        return NextResponse.json({ success: true }, { status: 200 });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
      console.error("Error in carrier portal:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "carrier-portal",
    action: "create",
    requireAuth: true,
    rateLimit: true,
  },
);

export const GET = withTransportationAPI(
  async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const carrierId = searchParams.get("carrierId");
      const action = searchParams.get("action");

      if (!carrierId) {
        return NextResponse.json(
          { error: "carrierId is required" },
          { status: 400 },
        );
      }

      if (action === "dashboard") {
        const dashboard =
          await carrierCollaborationService.getCarrierDashboard(carrierId);
        return NextResponse.json({ dashboard });
      }

      if (action === "shipments") {
        const status = searchParams.get("status");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");

        const shipments = await carrierCollaborationService.getCarrierShipments(
          carrierId,
          {
            status: status ? (status.split(",") as any) : undefined,
            dateFrom: dateFrom ? new Date(dateFrom) : undefined,
            dateTo: dateTo ? new Date(dateTo) : undefined,
          },
        );

        return NextResponse.json({ shipments });
      }

      // Get carrier info
      const carrier = carrierCollaborationService.getCarrier(carrierId);
      if (!carrier) {
        return NextResponse.json(
          { error: "Carrier not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ carrier });
    } catch (error) {
      console.error("Error fetching carrier portal data:", error);
      const errorResponse = handleTransportationError(error);
      return NextResponse.json(
        { error: errorResponse.message, details: errorResponse.details },
        { status: errorResponse.statusCode },
      );
    }
  },
  {
    featureId: "carrier-portal",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);
