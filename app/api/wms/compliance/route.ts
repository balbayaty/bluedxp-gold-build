/**
 * Regulatory Compliance API
 * Compliance checking and verification across multiple jurisdictions
 */

import { NextRequest, NextResponse } from "next/server";
import { regulatoryComplianceService } from "@/lib/services/wms/regulatoryComplianceService";
import { warehouseLocationService } from "@/lib/services/wms/locationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/compliance
 * Get compliance information
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    // Get all regulatory authorities
    if (action === "authorities") {
      const countryCode = searchParams.get("countryCode");
      const authorities = countryCode
        ? regulatoryComplianceService.getAuthoritiesByCountry(countryCode)
        : regulatoryComplianceService.getAllAuthorities();

      return NextResponse.json({
        success: true,
        data: authorities,
      });
    }

    // Get specific authority
    if (action === "authority") {
      const authorityId = searchParams.get("authorityId");
      if (!authorityId) {
        return NextResponse.json(
          { success: false, error: "authorityId parameter required" },
          { status: 400 },
        );
      }

      const authority = regulatoryComplianceService.getAuthority(authorityId);
      if (!authority) {
        return NextResponse.json(
          { success: false, error: "Authority not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: authority,
      });
    }

    // Check compliance for location
    if (action === "check") {
      const locationId = searchParams.get("locationId");
      const authorityId = searchParams.get("authorityId");

      if (!locationId) {
        return NextResponse.json(
          { success: false, error: "locationId parameter required" },
          { status: 400 },
        );
      }

      const location = await warehouseLocationService.getLocation(locationId);
      if (!location) {
        return NextResponse.json(
          { success: false, error: "Location not found" },
          { status: 404 },
        );
      }

      if (authorityId) {
        // Check specific authority
        const result = await regulatoryComplianceService.checkCompliance(
          location,
          authorityId,
        );
        return NextResponse.json({
          success: true,
          data: result,
        });
      } else {
        // Check all authorities
        const results =
          await regulatoryComplianceService.checkAllCompliance(location);
        return NextResponse.json({
          success: true,
          data: results,
        });
      }
    }

    // AI compliance verification
    if (action === "ai-verify") {
      const locationId = searchParams.get("locationId");
      if (!locationId) {
        return NextResponse.json(
          { success: false, error: "locationId parameter required" },
          { status: 400 },
        );
      }

      const location = await warehouseLocationService.getLocation(locationId);
      if (!location) {
        return NextResponse.json(
          { success: false, error: "Location not found" },
          { status: 404 },
        );
      }

      const verification =
        await regulatoryComplianceService.aiVerifyCompliance(location);
      return NextResponse.json({
        success: true,
        data: verification,
      });
    }

    // Get compliance recommendations
    if (action === "recommendations") {
      const locationId = searchParams.get("locationId");
      if (!locationId) {
        return NextResponse.json(
          { success: false, error: "locationId parameter required" },
          { status: 400 },
        );
      }

      const location = await warehouseLocationService.getLocation(locationId);
      if (!location) {
        return NextResponse.json(
          { success: false, error: "Location not found" },
          { status: 404 },
        );
      }

      const recommendations =
        await regulatoryComplianceService.getComplianceRecommendations(
          location,
        );
      return NextResponse.json({
        success: true,
        data: recommendations,
      });
    }

    // Calculate overall compliance score
    if (action === "score") {
      const locationId = searchParams.get("locationId");
      if (!locationId) {
        return NextResponse.json(
          { success: false, error: "locationId parameter required" },
          { status: 400 },
        );
      }

      const location = await warehouseLocationService.getLocation(locationId);
      if (!location) {
        return NextResponse.json(
          { success: false, error: "Location not found" },
          { status: 404 },
        );
      }

      const score =
        await regulatoryComplianceService.calculateOverallComplianceScore(
          location,
        );
      return NextResponse.json({
        success: true,
        data: { locationId, complianceScore: score },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action parameter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in compliance API:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.compliance",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});
