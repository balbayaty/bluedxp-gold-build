/**
 * Demo Notifications API Route
 * Generates intelligent demo notifications for testing
 */

import { NextRequest, NextResponse } from "next/server";
import { demoNotificationService } from "@/lib/services/notifications/demoNotificationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function POST(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { count = 10, module, clearFirst = false } = body;

    const userId = context.userId;
    const tenantId = context.tenantId || "tenant-1";

    // Clear existing notifications if requested
    if (clearFirst) {
      await demoNotificationService.clearDemoNotifications(userId, tenantId);
    }

    // Generate notifications
    let notifications;
    if (
      module &&
      ["wms", "tms", "qhse", "iso-ims", "msds", "system"].includes(module)
    ) {
      notifications = await demoNotificationService.generateModuleNotifications(
        module as any,
        userId,
        tenantId,
      );
    } else {
      notifications = await demoNotificationService.generateDemoNotifications({
        userId,
        tenantId,
        count,
        includeAllModules: true,
      });
    }

    return NextResponse.json({
      success: true,
      count: notifications.length,
      message: `Generated ${notifications.length} intelligent demo notifications`,
    });
  } catch (error) {
    console.error("[DemoNotifications API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate demo notifications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function DELETE(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = context.userId;
    const tenantId = context.tenantId || "tenant-1";

    await demoNotificationService.clearDemoNotifications(userId, tenantId);

    return NextResponse.json({
      success: true,
      message: "All demo notifications cleared",
    });
  } catch (error) {
    console.error("[DemoNotifications API] Error:", error);
    return NextResponse.json(
      { error: "Failed to clear notifications" },
      { status: 500 },
    );
  }
}

export const POSTHandler = withAPIGateway(POST, {
  moduleId: "SYSTEM",
  action: "read",
  requireAuth: true,
});

export const DELETEHandler = withAPIGateway(DELETE, {
  moduleId: "SYSTEM",
  action: "delete",
  requireAuth: true,
});

export { POSTHandler as POST, DELETEHandler as DELETE };
