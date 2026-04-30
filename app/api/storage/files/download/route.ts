/**
 * File Download API
 *
 * Handles file downloads with access control
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedFileStorageService } from "@/lib/services/storage/unifiedFileStorageService";

// Get tenant and user from request headers
function getAuthContext(request: NextRequest): {
  tenantId: string;
  userId: string;
  userRoles: string[];
} {
  const tenantId =
    request.headers.get("x-tenant-id") ||
    process.env.BOOTSTRAP_TENANT_ID ||
    "default-tenant";
  const userId = request.headers.get("x-user-id") || "default-user";
  const userRoles = request.headers
    .get("x-user-roles")
    ?.split(",")
    .filter(Boolean) || ["SYSTEM_ADMIN"];
  return { tenantId, userId, userRoles };
}

export async function GET(request: NextRequest) {
  try {
    // Get authentication info
    const { tenantId, userId, userRoles } = getAuthContext(request);

    if (!tenantId || !userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get("fileId");
    const version = searchParams.get("version")
      ? parseInt(searchParams.get("version")!)
      : undefined;

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "File ID is required" },
        { status: 400 },
      );
    }

    // Download file
    const { buffer, metadata } = await unifiedFileStorageService.downloadFile({
      fileId,
      tenantId,
      userId,
      userRoles,
      version,
    });

    // Return file with proper headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": metadata.contentType,
        "Content-Disposition": `attachment; filename="${metadata.fileName}"`,
        "Content-Length": metadata.fileSize.toString(),
      },
    });
  } catch (error: any) {
    console.error("File download error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "File download failed",
      },
      { status: 500 },
    );
  }
}
