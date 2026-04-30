/**
 * Get Presigned URL API
 *
 * Returns a temporary URL to access a file
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
    const fileId = searchParams.get("fileId");
    const expirySeconds = searchParams.get("expirySeconds")
      ? parseInt(searchParams.get("expirySeconds")!)
      : 3600;

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "File ID is required" },
        { status: 400 },
      );
    }

    const url = await unifiedFileStorageService.getFileUrl(
      fileId,
      tenantId,
      expirySeconds,
    );

    return NextResponse.json({
      success: true,
      url,
      expiresIn: expirySeconds,
    });
  } catch (error: any) {
    console.error("Get file URL error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get file URL",
      },
      { status: 500 },
    );
  }
}
