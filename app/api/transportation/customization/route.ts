/**
 * Customization API Route
 *
 * User preferences, dashboard customization, themes
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { customizationService } from "@/lib/services/transportation/customizationService";
import type {
  UserPreferences,
  DashboardWidget,
  CustomView,
  ThemeCustomization,
} from "@/lib/services/transportation/customizationService";

async function handler(
  req: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    const tenantId = context?.tenantId;

    if (!tenantId || String(tenantId).trim().length === 0) {
      return NextResponse.json(
        { error: "tenantId is required (multi-tenant day 1)" },
        { status: 400 },
      );
    }

    // Prevent userId spoofing if gateway user context exists
    if (
      context?.userId &&
      data.userId &&
      String(data.userId) !== String(context.userId)
    ) {
      return NextResponse.json({ error: "userId mismatch" }, { status: 403 });
    }

    switch (action) {
      case "get-preferences":
        return await handleGetPreferences({
          ...(data as any),
          tenantId: String(tenantId),
          userId: context?.userId,
        });

      case "update-preferences":
        return await handleUpdatePreferences({
          ...(data as any),
          tenantId: String(tenantId),
          userId: context?.userId,
        });

      case "update-dashboard":
        return await handleUpdateDashboard({
          ...(data as any),
          tenantId: String(tenantId),
          userId: context?.userId,
        });

      case "add-widget":
        return await handleAddWidget({
          ...(data as any),
          tenantId: String(tenantId),
          userId: data.userId || context?.userId,
        });

      case "remove-widget":
        return await handleRemoveWidget({
          ...(data as any),
          tenantId: String(tenantId),
          userId: data.userId || context?.userId,
        });

      case "update-notifications":
        return await handleUpdateNotifications({
          ...(data as any),
          tenantId: String(tenantId),
          userId: data.userId || context?.userId,
        });

      case "create-view":
        return await handleCreateView({
          ...(data as any),
          tenantId: String(tenantId),
          userId: data.userId || context?.userId,
        });

      case "update-theme":
        return await handleUpdateTheme({
          ...(data as any),
          tenantId: String(tenantId),
          userId: data.userId || context?.userId,
        });

      case "get-theme":
        return await handleGetTheme({
          ...(data as any),
          tenantId: String(tenantId),
          userId: data.userId || context?.userId,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Customization API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

async function handleGetPreferences(data: {
  userId: string;
  tenantId?: string;
}) {
  const preferences = await customizationService.getUserPreferences(
    data.userId,
    data.tenantId,
  );
  return NextResponse.json({ preferences });
}

async function handleUpdatePreferences(data: {
  userId: string;
  updates: Partial<UserPreferences>;
  tenantId?: string;
}) {
  const preferences = await customizationService.updateUserPreferences(
    data.userId,
    data.updates,
    data.tenantId,
  );
  return NextResponse.json({ preferences });
}

async function handleUpdateDashboard(data: {
  userId: string;
  updates: Partial<UserPreferences["dashboard"]>;
  tenantId?: string;
}) {
  const dashboard = await customizationService.updateDashboardPreferences(
    data.userId,
    data.updates,
    data.tenantId,
  );
  return NextResponse.json({ dashboard });
}

async function handleAddWidget(data: {
  userId: string;
  widget: Omit<DashboardWidget, "id">;
  tenantId?: string;
}) {
  const widget = await customizationService.addDashboardWidget(
    data.userId,
    data.widget,
    data.tenantId,
  );
  return NextResponse.json({ widget });
}

async function handleRemoveWidget(data: {
  userId: string;
  widgetId: string;
  tenantId?: string;
}) {
  await customizationService.removeDashboardWidget(
    data.userId,
    data.widgetId,
    data.tenantId,
  );
  return NextResponse.json({ success: true });
}

async function handleUpdateNotifications(data: {
  userId: string;
  updates: Partial<UserPreferences["notifications"]>;
  tenantId?: string;
}) {
  const notifications =
    await customizationService.updateNotificationPreferences(
      data.userId,
      data.updates,
      data.tenantId,
    );
  return NextResponse.json({ notifications });
}

async function handleCreateView(data: {
  userId: string;
  view: Omit<CustomView, "id" | "createdAt">;
  tenantId?: string;
}) {
  const view = await customizationService.createCustomView(
    data.userId,
    data.view,
    data.tenantId,
  );
  return NextResponse.json({ view });
}

async function handleUpdateTheme(data: {
  userId: string;
  theme: Partial<ThemeCustomization>;
  tenantId?: string;
}) {
  const theme = await customizationService.updateTheme(
    data.userId,
    data.theme,
    data.tenantId,
  );
  return NextResponse.json({ theme });
}

async function handleGetTheme(data: { userId: string; tenantId?: string }) {
  const theme = customizationService.getTheme(data.userId, data.tenantId);
  if (!theme) {
    return NextResponse.json({ error: "Theme not found" }, { status: 404 });
  }
  return NextResponse.json({ theme });
}

export const POST = withTransportationAPI(handler, { action: "execute" });
