/**
 * Geofence API Middleware
 *
 * Wraps API handlers with authentication, authorization, rate limiting
 * Part of Transportation module
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway, APIGatewayOptions } from "@/middleware/apiGateway";
import { ModuleId, Action } from "@/types/user";

/**
 * Wrap geofence API handler with gateway middleware
 */
export function withGeofenceAPI(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options: {
    featureId?: string;
    action: Action;
    requireAuth?: boolean;
    rateLimit?: boolean;
  },
) {
  return withAPIGateway(handler, {
    moduleId: "tms" as ModuleId, // Geofence is part of Transportation module
    featureId: (options.featureId || "geofence") as any,
    action: options.action,
    requireAuth: options.requireAuth !== false,
    rateLimit: options.rateLimit !== false,
  });
}
