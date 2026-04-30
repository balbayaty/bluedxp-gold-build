/**
 * Security Alerts API
 * GET: Get security alerts for warehouse
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * Alert types for security monitoring
 */
const ALERT_TYPES = [
  {
    type: "UNAUTHORIZED_ACCESS",
    title: "Unauthorized Access Attempt",
    severity: "CRITICAL",
  },
  {
    type: "MOTION_DETECTED",
    title: "Motion Detected in Restricted Area",
    severity: "HIGH",
  },
  { type: "CAMERA_OFFLINE", title: "Camera Offline", severity: "MEDIUM" },
  { type: "DOOR_HELD_OPEN", title: "Door Held Open Too Long", severity: "LOW" },
  { type: "TAILGATING", title: "Tailgating Detected", severity: "HIGH" },
  {
    type: "PERIMETER_BREACH",
    title: "Perimeter Breach Detected",
    severity: "CRITICAL",
  },
];

/**
 * Generate realistic security alerts for demo mode
 */
function generateDemoAlerts(warehouseId: string, count: number = 3) {
  const alerts = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const alertType =
      ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)];
    const minutesAgo = Math.floor(Math.random() * 60) + 1;

    alerts.push({
      id: `alert-${warehouseId}-${i + 1}`,
      type: alertType.type,
      severity: alertType.severity,
      title: alertType.title,
      description: `${alertType.title} detected in ${warehouseId} - Zone ${String.fromCharCode(65 + i)}`,
      location: `Zone ${String.fromCharCode(65 + i)} - Entry Point ${i + 1}`,
      cameraId: `CAM-${String(100 + i).padStart(3, "0")}`,
      timestamp: new Date(now - minutesAgo * 60000).toISOString(),
      status:
        i === 0 ? "ACTIVE" : Math.random() > 0.5 ? "ACKNOWLEDGED" : "ACTIVE",
      aiConfidence: 85 + Math.floor(Math.random() * 15),
      recommendedAction: getRecommendedAction(alertType.type),
    });
  }

  return alerts.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

function getRecommendedAction(type: string): string {
  const actions: Record<string, string> = {
    UNAUTHORIZED_ACCESS:
      "Review camera footage and access logs. Consider temporary access restriction.",
    MOTION_DETECTED:
      "Dispatch security personnel to verify. Check camera feed for details.",
    CAMERA_OFFLINE:
      "Check network connectivity and camera power. Dispatch technician if needed.",
    DOOR_HELD_OPEN: "Verify door status. Check if maintenance is in progress.",
    TAILGATING:
      "Review access control logs. Consider additional verification measures.",
    PERIMETER_BREACH:
      "Immediate dispatch of security team. Lock down affected area.",
  };
  return actions[type] || "Review and assess the situation.";
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get("warehouseId") || "wh-001";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // In production: Connect to actual security service/VMS
    // const alerts = await securityService.getAlerts(tenantId, warehouseId);

    // Demo mode: Generate realistic alerts
    const alertCount = Math.min(limit, Math.floor(Math.random() * 5) + 1);
    const alerts = generateDemoAlerts(warehouseId, alertCount);

    return NextResponse.json({
      success: true,
      alerts,
      total: alerts.length,
      mode: "demo",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching security alerts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch security alerts" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.security.alerts",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
