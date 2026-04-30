/**
 * Facility Licenses API Route
 * Handles license management
 */

import { NextRequest, NextResponse } from "next/server";
import { getLicenseService } from "@/lib/services/facility/licensing/licenseService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

const licenseService = getLicenseService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId") || "facility-1";
    const licenseId = searchParams.get("licenseId");
    const includeCompliance = searchParams.get("includeCompliance") === "true";

    if (licenseId) {
      const license = await licenseService.getLicense(licenseId);
      if (!license) {
        return NextResponse.json(
          { success: false, error: "License not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        data: license,
      });
    }

    const licenses = await licenseService.getLicenses(facilityId);
    const permits = await licenseService.getPermits(facilityId);
    const certifications = await licenseService.getCertifications(facilityId);

    let compliance = null;
    if (includeCompliance) {
      compliance = await licenseService.checkCompliance(facilityId);
    }

    return NextResponse.json({
      success: true,
      data: {
        licenses,
        permits,
        certifications,
        compliance,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching licenses", err, {
      module: "facility",
      service: "licensing",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "licensing",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch licenses" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { facilityId, ...licenseData } = body;

    if (!facilityId) {
      return NextResponse.json(
        { success: false, error: "facilityId is required" },
        { status: 400 },
      );
    }

    const license = await licenseService.createLicense({
      facilityId,
      ...licenseData,
    });

    return NextResponse.json({
      success: true,
      data: license,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error creating license", err, {
      module: "facility",
      service: "licensing",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "licensing",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create license" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseId, ...updates } = body;

    if (!licenseId) {
      return NextResponse.json(
        { success: false, error: "licenseId is required" },
        { status: 400 },
      );
    }

    const license = await licenseService.updateLicense(licenseId, updates);

    return NextResponse.json({
      success: true,
      data: license,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error updating license", err, {
      module: "facility",
      service: "licensing",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "licensing",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update license" },
      { status: 500 },
    );
  }
}
