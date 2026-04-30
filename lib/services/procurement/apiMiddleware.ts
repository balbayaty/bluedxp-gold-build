/**
 * Procurement API Middleware
 *
 * Wraps procurement API handlers with the platform API gateway:
 * - Auth (RBAC)
 * - Tenant isolation
 * - Rate limiting
 * - Consistent error shape
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { Action } from "@/types/user";

export function withProcurementAPI(
  handler: (
    req: NextRequest,
    context: { tenantId?: string; userId?: string },
    nextContext?: any,
  ) => Promise<NextResponse>,
  options: { action: Action; requireAuth?: boolean; rateLimit?: boolean },
) {
  return withAPIGateway(handler, {
    moduleId: "procurement",
    action: options.action,
    requireAuth: options.requireAuth !== false,
    rateLimit: options.rateLimit !== false,
  });
}
