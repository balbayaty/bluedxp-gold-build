/**
 * Module Licensing API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { moduleLicenseService } from "@/lib/services/licensing";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const moduleId = searchParams.get("moduleId");

    if (!tenantId || !moduleId) {
      return NextResponse.json(
        {
          success: false,
          errors: [
            {
              code: "VALIDATION_ERROR",
              message: "tenantId and moduleId are required",
            },
          ],
        },
        { status: 400 },
      );
    }

    const validation = await moduleLicenseService.validateLicense(
      tenantId,
      moduleId,
    );

    return NextResponse.json({
      success: true,
      data: validation,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        errors: [{ code: "API_ERROR", message: error.message }],
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "validate":
        if (!data.tenantId || !data.moduleId) {
          return NextResponse.json(
            {
              success: false,
              errors: [
                {
                  code: "VALIDATION_ERROR",
                  message: "tenantId and moduleId are required",
                },
              ],
            },
            { status: 400 },
          );
        }
        const validation = await moduleLicenseService.validateLicense(
          data.tenantId,
          data.moduleId,
        );
        return NextResponse.json({
          success: true,
          data: validation,
        });

      case "checkFeature":
        if (!data.tenantId || !data.moduleId || !data.feature) {
          return NextResponse.json(
            {
              success: false,
              errors: [
                {
                  code: "VALIDATION_ERROR",
                  message: "tenantId, moduleId, and feature are required",
                },
              ],
            },
            { status: 400 },
          );
        }
        const enabled = await moduleLicenseService.isFeatureEnabled(
          data.tenantId,
          data.moduleId,
          data.feature,
        );
        return NextResponse.json({
          success: true,
          data: { enabled },
        });

      case "upsert":
        const license = await moduleLicenseService.upsertLicense(data);
        return NextResponse.json({
          success: true,
          data: license,
        });

      case "revoke":
        if (!data.licenseKey) {
          return NextResponse.json(
            {
              success: false,
              errors: [
                { code: "VALIDATION_ERROR", message: "licenseKey is required" },
              ],
            },
            { status: 400 },
          );
        }
        const revoked = await moduleLicenseService.revokeLicense(
          data.licenseKey,
        );
        return NextResponse.json({
          success: true,
          data: revoked,
        });

      case "list":
        if (!data.tenantId) {
          return NextResponse.json(
            {
              success: false,
              errors: [
                { code: "VALIDATION_ERROR", message: "tenantId is required" },
              ],
            },
            { status: 400 },
          );
        }
        const licenses = await moduleLicenseService.getTenantLicenses(
          data.tenantId,
        );
        return NextResponse.json({
          success: true,
          data: licenses,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            errors: [
              { code: "INVALID_ACTION", message: `Unknown action: ${action}` },
            ],
          },
          { status: 400 },
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        errors: [{ code: "API_ERROR", message: error.message }],
      },
      { status: 500 },
    );
  }
}
