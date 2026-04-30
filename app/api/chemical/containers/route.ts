/**
 * Container Management API
 * CRUD operations for chemical containers
 */

import { NextRequest, NextResponse } from "next/server";
import { containerService } from "@/lib/services/chemical/containerService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      containerNumber: searchParams.get("containerNumber") || undefined,
      barcode: searchParams.get("barcode") || undefined,
      chemicalId: searchParams.get("chemicalId") || undefined,
      status: (searchParams.get("status") as any) || undefined,
    };

    const result = await containerService.getContainers(filters);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error getting containers:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get containers" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const container = await containerService.createContainer(body);

    return NextResponse.json({
      success: true,
      container,
    });
  } catch (error: any) {
    console.error("Error creating container:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create container" },
      { status: 500 },
    );
  }
}

async function putHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Container ID is required" },
        { status: 400 },
      );
    }

    const container = await containerService.updateContainer(id, updates);

    return NextResponse.json({
      success: true,
      container,
    });
  } catch (error: any) {
    console.error("Error updating container:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update container" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "chemical",
  featureId: "chemical.containers",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.containers",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "chemical",
  featureId: "chemical.containers",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
