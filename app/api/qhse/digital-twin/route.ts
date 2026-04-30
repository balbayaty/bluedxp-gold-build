/**
 * Digital Twin API Route
 * 5IR/6IR Aligned Digital Twin Integration
 * Comprehensive validation and error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { digitalTwinService } from "@/lib/services/qhse/digitalTwinService";
import { QHSEErrorHandler } from "@/lib/services/qhse/utils/errorHandler";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    if (action === "twins") {
      const type = searchParams.get("type");
      const status = searchParams.get("status");
      const twins = await digitalTwinService.listTwins({
        type: type as any,
        status: status as any,
      });
      return NextResponse.json({ success: true, data: twins });
    }

    if (action === "twin") {
      const id = searchParams.get("id");
      if (!id) {
        return NextResponse.json(
          { success: false, error: "id required" },
          { status: 400 },
        );
      }
      const twin = await digitalTwinService.getTwin(id);
      return NextResponse.json({ success: true, data: twin });
    }

    if (action === "sync-history") {
      const twinId = searchParams.get("twinId");
      if (!twinId) {
        return NextResponse.json(
          { success: false, error: "twinId required" },
          { status: 400 },
        );
      }
      const limit = parseInt(searchParams.get("limit") || "100", 10);
      const history = await digitalTwinService.getSyncHistory(twinId, limit);
      return NextResponse.json({ success: true, data: history });
    }

    if (action === "simulations") {
      const twinId = searchParams.get("twinId");
      const simulations = await digitalTwinService.listSimulations(
        twinId || undefined,
      );
      return NextResponse.json({ success: true, data: simulations });
    }

    if (action === "simulation") {
      const id = searchParams.get("id");
      if (!id) {
        return NextResponse.json(
          { success: false, error: "id required" },
          { status: 400 },
        );
      }
      const simulation = await digitalTwinService.getSimulation(id);
      return NextResponse.json({ success: true, data: simulation });
    }

    if (action === "analyze") {
      const twinId = searchParams.get("twinId");
      if (!twinId) {
        return NextResponse.json(
          { success: false, error: "twinId required" },
          { status: 400 },
        );
      }
      const analysis = await digitalTwinService.analyzeTwin(twinId);
      return NextResponse.json({ success: true, data: analysis });
    }

    if (action === "virtual-inspection") {
      const twinId = searchParams.get("twinId");
      if (!twinId) {
        return NextResponse.json(
          { success: false, error: "twinId required" },
          { status: 400 },
        );
      }
      const inspection =
        await digitalTwinService.performVirtualInspection(twinId);
      return NextResponse.json({ success: true, data: inspection });
    }

    if (action === "predict-maintenance") {
      const twinId = searchParams.get("twinId");
      if (!twinId) {
        return NextResponse.json(
          { success: false, error: "twinId required" },
          { status: 400 },
        );
      }
      const prediction = await digitalTwinService.predictMaintenance(twinId);
      return NextResponse.json({ success: true, data: prediction });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    const qhseError = QHSEErrorHandler.handleError(error, "Digital Twin API");
    return NextResponse.json(QHSEErrorHandler.formatErrorResponse(qhseError), {
      status: qhseError.statusCode,
    });
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "create-twin") {
      const twin = await digitalTwinService.createTwin(body.twin);
      return NextResponse.json({ success: true, data: twin });
    }

    if (action === "sync") {
      const { twinId, data } = body;
      const sync = await digitalTwinService.syncTwin(twinId, data);
      return NextResponse.json({ success: true, data: sync });
    }

    if (action === "start-continuous-sync") {
      const { twinId, interval } = body;
      await digitalTwinService.startContinuousSync(twinId, interval);
      return NextResponse.json({ success: true });
    }

    if (action === "stop-continuous-sync") {
      const { twinId } = body;
      await digitalTwinService.stopContinuousSync(twinId);
      return NextResponse.json({ success: true });
    }

    if (action === "run-simulation") {
      const { twinId, scenario, parameters } = body;
      const simulation = await digitalTwinService.runSimulation(
        twinId,
        scenario,
        parameters,
      );
      return NextResponse.json({ success: true, data: simulation });
    }

    if (action === "connect-iot") {
      const { twinId, sensorId, property } = body;
      await digitalTwinService.connectIoT(twinId, sensorId, property);
      return NextResponse.json({ success: true });
    }

    if (action === "attach-ai-model") {
      const { twinId, modelId, purpose } = body;
      await digitalTwinService.attachAIModel(twinId, modelId, purpose);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    const qhseError = QHSEErrorHandler.handleError(error, "Digital Twin API");
    return NextResponse.json(QHSEErrorHandler.formatErrorResponse(qhseError), {
      status: qhseError.statusCode,
    });
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.digital-twin",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.digital-twin",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
