/**
 * Facility Assets API Route
 * Handles asset CRUD operations and integrates with services
 */

import { NextRequest, NextResponse } from "next/server";
import { getAssetService } from "@/lib/services/facility/asset/assetService";
import { getFacilityIntegrationService } from "@/lib/services/facility/integration/facilityIntegrationService";
import { warehouseIntegrationService } from "@/lib/services/facility/integration/warehouseIntegrationService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

const assetService = getAssetService();
const integrationService = getFacilityIntegrationService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId") || "facility-1";
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const assets = await assetService.getAssets(facilityId, {
      type: type as any,
      status: status as any,
      category: category || undefined,
    });

    // Enrich with warehouse integration data
    const enrichedAssets = await Promise.all(
      assets.map(async (asset) => {
        try {
          const locationMapping =
            await warehouseIntegrationService.getAssetLocation(asset.id);
          return {
            ...asset,
            location: {
              ...asset.location,
              // warehouseId: locationMapping?.warehouseId || asset.location.warehouseId,
              // warehouseLocationCode: locationMapping?.locationCode || asset.location.warehouseLocationCode,
              // warehouseZoneId: locationMapping?.zoneId || asset.location.warehouseZoneId,
            },
          };
        } catch (locationError) {
          // If location mapping fails, return asset without enrichment
          logger.warn(
            "Failed to enrich asset location",
            locationError instanceof Error
              ? locationError
              : new Error(String(locationError)),
            {
              module: "facility",
              service: "assets",
              assetId: asset.id,
            },
          );
          return asset;
        }
      }),
    );

    return NextResponse.json({
      success: true,
      data: enrichedAssets,
      total: enrichedAssets.length,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching assets", err, {
      module: "facility",
      service: "assets",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "assets",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch assets" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const asset = await assetService.createAsset(body);

    // Store in Knowledge Base if enabled
    try {
      await integrationService.storeFacilityDocumentation(asset.facilityId, {
        title: `Asset: ${asset.name}`,
        content: `New asset created: ${asset.name} (Type: ${asset.type})`,
        type: "specification",
        category: "assets",
        relatedAssetId: asset.id,
        tags: ["asset", asset.type],
      });
    } catch (kbError) {
      logger.warn(
        "Failed to store asset in knowledge base",
        kbError instanceof Error ? kbError : new Error(String(kbError)),
        {
          module: "facility",
          service: "assets",
          assetId: asset.id,
        },
      );
    }

    // Map to warehouse location if provided
    if (body.location?.warehouseId || body.location?.warehouseLocationCode) {
      try {
        await warehouseIntegrationService.mapAssetToLocation(asset.id, {
          facilityId: asset.facilityId,
          warehouseId: body.location.warehouseId,
          storageLocationId: body.location.storageLocationId,
          locationCode: body.location.warehouseLocationCode,
          zoneId: body.location.warehouseZoneId,
        });
      } catch (whError) {
        logger.warn(
          "Failed to map asset to warehouse location",
          whError instanceof Error ? whError : new Error(String(whError)),
          {
            module: "facility",
            service: "assets",
            assetId: asset.id,
          },
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: asset,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error creating asset", err, {
      module: "facility",
      service: "assets",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "assets",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create asset" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Asset ID is required" },
        { status: 400 },
      );
    }

    const asset = await assetService.updateAsset(id, updates);

    // Update warehouse mapping if location changed
    if (updates.location) {
      try {
        await warehouseIntegrationService.mapAssetToLocation(asset.id, {
          facilityId: asset.facilityId,
          warehouseId: updates.location.warehouseId,
          storageLocationId: updates.location.storageLocationId,
          locationCode: updates.location.warehouseLocationCode,
          zoneId: updates.location.warehouseZoneId,
        });
      } catch (whError) {
        logger.warn(
          "Failed to update warehouse mapping",
          whError instanceof Error ? whError : new Error(String(whError)),
          {
            module: "facility",
            service: "assets",
            assetId: asset.id,
          },
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: asset,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error updating asset", err, {
      module: "facility",
      service: "assets",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "assets",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update asset" },
      { status: 500 },
    );
  }
}
