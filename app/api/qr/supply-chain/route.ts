/**
 * QR Supply Chain Optimization API
 * Optimize supply chains using QR scan data
 */

import { NextRequest, NextResponse } from "next/server";
import { qrSupplyChainOptimizationService } from "@/lib/services/qr/qrSupplyChainOptimizationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === "analyze") {
      const path = await qrSupplyChainOptimizationService.analyzeSupplyChain({
        startQR: data.startQR,
        endQR: data.endQR,
        timeRange: data.timeRange,
      });
      return NextResponse.json({ success: true, path });
    }

    if (action === "optimize") {
      const optimization =
        await qrSupplyChainOptimizationService.optimizeSupplyChain(
          data.supplyChainId,
        );
      return NextResponse.json({ success: true, optimization });
    }

    if (action === "predict-disruptions") {
      const disruptions =
        await qrSupplyChainOptimizationService.predictDisruptions({
          supplyChainId: data.supplyChainId,
          horizon: data.horizon || 30,
        });
      return NextResponse.json({ success: true, disruptions });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR supply chain API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.supply-chain",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});
