/**
 * ⚙️ SETTING BY KEY API
 *
 * GET: Get setting by key
 * PUT: Update setting
 * DELETE: Delete setting (soft delete)
 */

import { NextRequest, NextResponse } from "next/server";
import { settingsService } from "@/lib/services/settings/settingsService";
import type { UpdateSettingInput } from "@/lib/services/settings/settingsService";

const API_ENABLED = process.env.ENABLE_SETTINGS_API !== "false";

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } },
) {
  if (!API_ENABLED) {
    return NextResponse.json(
      { success: false, error: "Settings API is disabled" },
      { status: 503 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || undefined;

    const setting = await settingsService.getSetting(params.key, tenantId);

    if (!setting) {
      return NextResponse.json(
        { success: false, error: "Setting not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.error("[Settings API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } },
) {
  if (!API_ENABLED) {
    return NextResponse.json(
      { success: false, error: "Settings API is disabled" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as UpdateSettingInput;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || undefined;
    const modifiedBy = searchParams.get("modifiedBy") || "system";

    // Get existing setting to validate
    const existing = await settingsService.getSetting(params.key, tenantId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Setting not found" },
        { status: 404 },
      );
    }

    // Validate if value is being updated
    if (body.value !== undefined) {
      const validation = settingsService.validateSettingValue(
        existing,
        body.value,
      );
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 },
        );
      }
    }

    const setting = await settingsService.updateSetting(
      params.key,
      body,
      modifiedBy,
      tenantId,
    );

    return NextResponse.json({
      success: true,
      data: setting,
    });
  } catch (error) {
    console.error("[Settings API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } },
) {
  if (!API_ENABLED) {
    return NextResponse.json(
      { success: false, error: "Settings API is disabled" },
      { status: 503 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || undefined;

    const success = await settingsService.deleteSetting(params.key, tenantId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to delete setting" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Setting deleted successfully",
    });
  } catch (error) {
    console.error("[Settings API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
