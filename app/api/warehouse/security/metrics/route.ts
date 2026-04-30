/**
 * Security Metrics API
 * GET: Get security metrics for warehouse
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * Generate realistic security metrics for demo mode
 * In production, connect to security service (Milestone, Genetec, etc.)
 */
function generateDemoMetrics(warehouseId: string) {
  // Use warehouseId hash for consistent but varied metrics
  const seed = warehouseId
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const baseOffset = seed % 20;

  const totalCameras = 120 + baseOffset * 3;
  const offlineCameras = Math.floor(Math.random() * 5) + 2;
  const activeAlerts = Math.floor(Math.random() * 5);

  return {
    warehouseId,
    totalCameras,
    activeCameras: totalCameras - offlineCameras,
    offlineCameras,
    activeAlerts,
    criticalAlerts: activeAlerts > 0 ? Math.floor(activeAlerts / 3) : 0,
    accessPoints: 18 + (baseOffset % 10),
    activeSessions: 30 + Math.floor(Math.random() * 30),
    lastIncident: new Date(
      Date.now() - (2 + Math.random() * 24) * 3600000,
    ).toISOString(),
    securityScore: 90 + Math.random() * 9,
    mode: "demo", // Indicates this is demo data
    integrationStatus: "pending", // For production: integrate with security VMS
  };
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get("warehouseId") || "wh-001";
    const tenantId = context.tenantId || "default-tenant";

    // In production: Connect to actual security service
    // Example integrations: Milestone XProtect, Genetec Security Center, Avigilon
    // const metrics = await securityService.getMetrics(tenantId, warehouseId);

    // Demo mode: Generate realistic metrics
    const metrics = generateDemoMetrics(warehouseId);

    return NextResponse.json({
      success: true,
      ...metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching security metrics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch security metrics" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.security.metrics",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
