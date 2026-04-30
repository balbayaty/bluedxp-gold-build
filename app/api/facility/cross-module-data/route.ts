/**
 * Cross-Module Data API Route
 * Fetches related data from other modules (CAPA, Work Orders, Warehouse)
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'capa', 'workorder', 'warehouse'
    const ids = searchParams.get("ids")?.split(",") || [];

    if (!type || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Type and IDs are required" },
        { status: 400 },
      );
    }

    let data: any[] = [];

    switch (type) {
      case "capa":
        // Fetch CAPA records
        try {
          const capaResponse = await fetch(
            `${request.nextUrl.origin}/api/erpnext/capas`,
          );
          if (capaResponse.ok) {
            const capaData = await capaResponse.json();
            const allCAPAs = capaData.capas || capaData.data || [];
            data = ids
              .map((id) =>
                allCAPAs.find((c: any) => c.name === id || c.id === id),
              )
              .filter(Boolean)
              .map((capa: any) => ({
                id: capa.name || capa.id,
                name: capa.name || capa.id,
                subject: capa.subject,
                status: capa.status,
                priority: capa.priority,
                type: capa.capa_type,
              }));
          }
        } catch (error) {
          logger.warn(
            "Failed to fetch CAPA data",
            error instanceof Error ? error : new Error(String(error)),
            {
              module: "facility",
              service: "cross-module-data",
              type: "capa",
            },
          );
        }
        break;

      case "workorder":
        // Fetch Work Orders from Facility Management
        try {
          const woResponse = await fetch(
            `${request.nextUrl.origin}/api/facility/work-orders`,
          );
          if (woResponse.ok) {
            const woData = await woResponse.json();
            const allWOs = woData.data || [];
            data = ids
              .map((id) => allWOs.find((wo: any) => wo.id === id))
              .filter(Boolean)
              .map((wo: any) => ({
                id: wo.id,
                title: wo.title,
                status: wo.status,
                priority: wo.priority,
                type: wo.type,
              }));
          }
        } catch (error) {
          logger.warn(
            "Failed to fetch Work Order data",
            error instanceof Error ? error : new Error(String(error)),
            {
              module: "facility",
              service: "cross-module-data",
              type: "workorder",
            },
          );
        }
        break;

      case "warehouse":
        // Fetch Warehouse data
        try {
          // This would integrate with Warehouse Management API
          // For now, return basic warehouse info
          data = ids.map((id) => ({
            id,
            name: `Warehouse ${id}`,
            code: id,
            type: "warehouse",
          }));
        } catch (error) {
          logger.warn(
            "Failed to fetch Warehouse data",
            error instanceof Error ? error : new Error(String(error)),
            {
              module: "facility",
              service: "cross-module-data",
              type: "warehouse",
            },
          );
        }
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid type. Use: capa, workorder, or warehouse",
          },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching cross-module data", err, {
      module: "facility",
      service: "cross-module-data",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "cross-module-data",
    });
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to fetch cross-module data",
      },
      { status: 500 },
    );
  }
}
