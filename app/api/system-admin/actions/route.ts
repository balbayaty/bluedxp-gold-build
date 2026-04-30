/**
 * System Admin Actions API
 * Allows administrators to perform actions on the system
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { moduleManager } from "@/lib/modules/manager";
import { moduleRegistry } from "@/lib/modules/registry";
import { redisService } from "@/lib/services/cache/redisService";
import { jobQueue } from "@/lib/services/job-queue";
import { eventBus } from "@/lib/services/event-bus";
import { backupService } from "@/lib/services/backup/backupService";

async function POSTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case "restart_module":
        if (!params?.moduleId) {
          return NextResponse.json(
            { success: false, error: "Module ID required" },
            { status: 400 },
          );
        }
        // Restart module logic (stop then start)
        await moduleManager.stopModule(params.moduleId);
        await moduleManager.startModule(params.moduleId);
        return NextResponse.json({
          success: true,
          message: `Module ${params.moduleId} restarted`,
        });

      case "clear_cache":
        try {
          // Try to clear Redis cache
          const cleared = await redisService.clear();
          if (cleared) {
            return NextResponse.json({
              success: true,
              message: "Cache cleared successfully",
            });
          } else {
            return NextResponse.json({
              success: true,
              message: "Cache cleared (fallback mode)",
            });
          }
        } catch (e) {
          console.error("[SystemAdmin] Error clearing cache:", e);
          return NextResponse.json(
            {
              success: false,
              error:
                "Failed to clear cache: " +
                (e instanceof Error ? e.message : "Unknown error"),
            },
            { status: 500 },
          );
        }

      case "trigger_backup":
        try {
          const backupResult = await backupService.createBackup();
          if (backupResult.success) {
            // Cleanup old backups (keep last 10)
            await backupService.cleanupOldBackups(10).catch((err) => {
              console.warn("[SystemAdmin] Error cleaning up old backups:", err);
            });

            const sizeMB = backupResult.backupSize
              ? (backupResult.backupSize / (1024 * 1024)).toFixed(2)
              : "unknown";
            return NextResponse.json({
              success: true,
              message: `Backup created successfully (${sizeMB} MB)`,
              backupPath: backupResult.backupPath,
            });
          } else {
            return NextResponse.json(
              {
                success: false,
                error: backupResult.error || "Backup failed",
              },
              { status: 500 },
            );
          }
        } catch (error) {
          console.error("[SystemAdmin] Error triggering backup:", error);
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to trigger backup",
            },
            { status: 500 },
          );
        }

      case "enable_module":
        if (!params?.moduleId) {
          return NextResponse.json(
            { success: false, error: "Module ID required" },
            { status: 400 },
          );
        }
        moduleRegistry.enableModule(params.moduleId);
        return NextResponse.json({
          success: true,
          message: `Module ${params.moduleId} enabled`,
        });

      case "disable_module":
        if (!params?.moduleId) {
          return NextResponse.json(
            { success: false, error: "Module ID required" },
            { status: 400 },
          );
        }
        moduleRegistry.disableModule(params.moduleId);
        return NextResponse.json({
          success: true,
          message: `Module ${params.moduleId} disabled`,
        });

      case "restart_job_queue":
        try {
          await jobQueue.restart();
          return NextResponse.json({
            success: true,
            message: "Job queue restarted successfully",
          });
        } catch (error) {
          console.error("[SystemAdmin] Error restarting job queue:", error);
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to restart job queue",
            },
            { status: 500 },
          );
        }

      case "clear_event_bus":
        try {
          // Cast to access clear method (added to EventBusService but not in interface)
          const eventBusService = eventBus as any;
          const subscriptionCount =
            eventBusService.getSubscriptionCount?.() || 0;
          await eventBusService.clear();
          return NextResponse.json({
            success: true,
            message: `Event bus cleared (removed ${subscriptionCount} subscriptions)`,
          });
        } catch (error) {
          console.error("[SystemAdmin] Error clearing event bus:", error);
          return NextResponse.json(
            {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to clear event bus",
            },
            { status: 500 },
          );
        }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error executing admin action:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to execute action",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(POSTHandler, {
  moduleId: "wms", // Using WMS as proxy for system admin
  action: "admin",
  requireAuth: true,
  rateLimit: true,
});
