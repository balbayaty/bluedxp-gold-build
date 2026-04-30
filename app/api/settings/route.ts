/**
 * ⚙️ SETTINGS API
 *
 * RESTful API for system settings with:
 * - GET: List settings with filtering
 * - POST: Create new setting
 * - Feature flag support
 * - Safe fallbacks
 */

import { NextRequest, NextResponse } from "next/server";
import { settingsService } from "@/lib/services/settings/settingsService";
import type {
  CreateSettingInput,
  SettingsQuery,
} from "@/lib/services/settings/settingsService";

const API_ENABLED = process.env.ENABLE_SETTINGS_API !== "false"; // Default: true

export async function GET(request: NextRequest) {
  if (!API_ENABLED) {
    return NextResponse.json(
      { success: false, error: "Settings API is disabled" },
      { status: 503 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    const query: SettingsQuery = {
      category: searchParams.get("category") as any,
      status: searchParams.get("status") as any,
      search: searchParams.get("search") || undefined,
      tenantId: searchParams.get("tenantId") || undefined,
      isRequired:
        searchParams.get("isRequired") === "true"
          ? true
          : searchParams.get("isRequired") === "false"
            ? false
            : undefined,
      isEditable:
        searchParams.get("isEditable") === "true"
          ? true
          : searchParams.get("isEditable") === "false"
            ? false
            : undefined,
    };

    const settings = await settingsService.getSettings(query);

    return NextResponse.json({
      success: true,
      data: settings,
      count: settings.length,
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

export async function POST(request: NextRequest) {
  if (!API_ENABLED) {
    return NextResponse.json(
      { success: false, error: "Settings API is disabled" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as CreateSettingInput;

    // Validation
    if (
      !body.parameterKey ||
      !body.parameterName ||
      !body.category ||
      !body.dataType
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: parameterKey, parameterName, category, dataType",
        },
        { status: 400 },
      );
    }

    // Validate value
    const tempSetting = {
      id: "temp",
      parameterKey: body.parameterKey,
      parameterName: body.parameterName,
      category: body.category,
      dataType: body.dataType,
      value: body.value,
      defaultValue: body.defaultValue || body.value,
      description: body.description,
      isRequired: body.isRequired ?? false,
      isEditable: body.isEditable ?? true,
      validationRule: body.validationRule,
      lastModified: new Date(),
      modifiedBy: "system",
      status: "ACTIVE" as const,
    };

    const validation = settingsService.validateSettingValue(
      tempSetting,
      body.value,
    );
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }

    const setting = await settingsService.createSetting(body);

    return NextResponse.json(
      {
        success: true,
        data: setting,
      },
      { status: 201 },
    );
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
