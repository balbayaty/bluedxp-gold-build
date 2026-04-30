/**
 * File Search API
 *
 * Search for files across modules
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedFileStorageService } from "@/lib/services/storage/unifiedFileStorageService";

export async function GET(request: NextRequest) {
  try {
    const tenantId =
      request.headers.get("x-tenant-id") ||
      process.env.BOOTSTRAP_TENANT_ID ||
      "default-tenant";
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = {
      tenantId,
      module: searchParams.get("module") || undefined,
      entityType: searchParams.get("entityType") || undefined,
      entityId: searchParams.get("entityId") || undefined,
      tags: searchParams.get("tags")?.split(",") || undefined,
      mimeType: searchParams.get("mimeType") || undefined,
      fileName: searchParams.get("fileName") || undefined,
      createdBy: searchParams.get("createdBy") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      status: (searchParams.get("status") as any) || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined,
    };

    const result = await unifiedFileStorageService.searchFiles(query);

    return NextResponse.json({
      success: true,
      files: result.files,
      total: result.total,
    });
  } catch (error: any) {
    console.error("File search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "File search failed",
      },
      { status: 500 },
    );
  }
}
