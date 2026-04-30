/**
 * GET /api/v1/workspace/config
 * Get workspace configuration for current user
 */

import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/lib/services/workspace/workspaceService";
import { getAuthUser } from "@/lib/services/workspace/utils/auth";
import type { WorkspaceConfig } from "@/types/workspace";

/**
 * Get default workspace config as fallback
 */
function getDefaultWorkspaceConfig(
  userId: string,
  tenantId: string,
  role: string,
  subscriptionTier: string = "BASIC",
): WorkspaceConfig {
  return {
    userId,
    tenantId,
    role: role as any,
    subscriptionTier: subscriptionTier as any,
    defaultLayout: undefined,
    availableWidgets: [],
    availableCategories: [],
    permissions: {
      canCreateWidgets: subscriptionTier !== "BASIC",
      canCreateCategories:
        subscriptionTier === "ENTERPRISE" || subscriptionTier === "CUSTOM",
      canShareLayouts: subscriptionTier !== "BASIC",
      canUseTemplates: true,
    },
    integrations: {
      googleWorkspace: undefined,
      email: [],
    },
    personalization: {
      enabled: subscriptionTier !== "BASIC",
      recommendations: [],
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const config = await workspaceService.getWorkspaceConfig(
        user.id,
        user.role as any,
        (user as any).subscriptionTier,
      );

      return NextResponse.json(config);
    } catch (serviceError) {
      // If service fails (e.g., database not set up), return default config
      console.warn(
        "[API] Workspace service failed, using default config:",
        serviceError,
      );

      const defaultConfig = getDefaultWorkspaceConfig(
        user.id,
        user.tenantId || "default-tenant",
        user.role || "SYSTEM_ADMIN",
        (user as any).subscriptionTier || "BASIC",
      );

      return NextResponse.json(defaultConfig);
    }
  } catch (error) {
    console.error("[API] Error getting workspace config:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
