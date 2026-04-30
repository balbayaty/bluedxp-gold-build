/**
 * Chemical Inventory API
 * Manage chemical inventory tracking, expiry, and segregation
 */

import { NextRequest, NextResponse } from "next/server";
import { ChemicalInventory, InventoryStatus } from "@/types/chemical";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { prisma } from "@/lib/services/database/prismaClient";

// In-memory store for demo mode (when database isn't available)
const inMemoryInventory = new Map<string, ChemicalInventory>();

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get("warehouseId");
    const chemicalId = searchParams.get("chemicalId");
    const status = searchParams.get("status") as InventoryStatus | null;
    const tenantId = context.tenantId || "default-tenant";

    let inventory: ChemicalInventory[] = [];

    // Try database first
    try {
      const dbInventory = await prisma.chemicalInventory.findMany({
        where: {
          tenantId,
          ...(warehouseId && { warehouseId }),
          ...(chemicalId && { chemicalId }),
          ...(status && { status }),
        },
        take: 100,
        orderBy: { createdAt: "desc" },
      });

      inventory = dbInventory.map((item: any) => ({
        id: item.id,
        chemicalId: item.chemicalId,
        chemicalName: item.chemicalName || "",
        warehouseId: item.warehouseId,
        locationId: item.locationId,
        currentQuantity:
          item.currentQuantity?.toNumber?.() || item.currentQuantity || 0,
        reservedQuantity:
          item.reservedQuantity?.toNumber?.() || item.reservedQuantity || 0,
        availableQuantity:
          (item.currentQuantity?.toNumber?.() || item.currentQuantity || 0) -
          (item.reservedQuantity?.toNumber?.() || item.reservedQuantity || 0),
        unit: item.unit || "kg",
        status: (item.status as InventoryStatus) || "Available",
        lotNumber: item.lotNumber,
        expiryDate: item.expiryDate?.toISOString(),
        metadata: {
          createdAt: item.createdAt?.toISOString(),
          updatedAt: item.updatedAt?.toISOString(),
        },
      }));
    } catch (dbError) {
      // Fallback to in-memory store if database is unavailable
      console.log(
        "[Chemical Inventory] Database unavailable, using in-memory store",
      );
      inventory = Array.from(inMemoryInventory.values()).filter((item) => {
        if (warehouseId && item.warehouseId !== warehouseId) return false;
        if (chemicalId && item.chemicalId !== chemicalId) return false;
        if (status && item.status !== status) return false;
        return true;
      });
    }

    return NextResponse.json({
      success: true,
      inventory,
      total: inventory.length,
    });
  } catch (error: any) {
    console.error("Error getting inventory:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get inventory" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const inventoryData: Partial<ChemicalInventory> = body;
    const tenantId = context.tenantId || "default-tenant";
    const userId = context.userId || "system";

    const newInventory: ChemicalInventory = {
      id: `inv-${Date.now()}`,
      chemicalId: inventoryData.chemicalId || "",
      chemicalName: inventoryData.chemicalName || "",
      warehouseId: inventoryData.warehouseId,
      locationId: inventoryData.locationId,
      currentQuantity: inventoryData.currentQuantity || 0,
      reservedQuantity: inventoryData.reservedQuantity || 0,
      availableQuantity:
        (inventoryData.currentQuantity || 0) -
        (inventoryData.reservedQuantity || 0),
      unit: inventoryData.unit || "kg",
      status: inventoryData.status || "Available",
      lotNumber: inventoryData.lotNumber,
      expiryDate: inventoryData.expiryDate,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId,
      },
    };

    // Try database first
    try {
      const dbInventory = await prisma.chemicalInventory.create({
        data: {
          id: newInventory.id,
          tenantId,
          chemicalId: newInventory.chemicalId,
          chemicalName: newInventory.chemicalName,
          warehouseId: newInventory.warehouseId,
          locationId: newInventory.locationId,
          currentQuantity: newInventory.currentQuantity,
          reservedQuantity: newInventory.reservedQuantity,
          unit: newInventory.unit,
          status: newInventory.status,
          lotNumber: newInventory.lotNumber,
          expiryDate: newInventory.expiryDate
            ? new Date(newInventory.expiryDate)
            : null,
        },
      });
      newInventory.id = dbInventory.id;
    } catch (dbError) {
      // Fallback to in-memory store
      console.log(
        "[Chemical Inventory] Database unavailable, using in-memory store",
      );
      inMemoryInventory.set(newInventory.id, newInventory);
    }

    return NextResponse.json({
      success: true,
      inventory: newInventory,
    });
  } catch (error: any) {
    console.error("Error creating inventory:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create inventory" },
      { status: 500 },
    );
  }
}

async function putHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { id, updates } = body;
    const tenantId = context.tenantId || "default-tenant";

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Inventory ID is required" },
        { status: 400 },
      );
    }

    // Try database first
    try {
      const updatedInventory = await prisma.chemicalInventory.update({
        where: { id, tenantId },
        data: {
          ...(updates.currentQuantity !== undefined && {
            currentQuantity: updates.currentQuantity,
          }),
          ...(updates.reservedQuantity !== undefined && {
            reservedQuantity: updates.reservedQuantity,
          }),
          ...(updates.status && { status: updates.status }),
          ...(updates.locationId && { locationId: updates.locationId }),
          ...(updates.lotNumber && { lotNumber: updates.lotNumber }),
          ...(updates.expiryDate && {
            expiryDate: new Date(updates.expiryDate),
          }),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Inventory updated",
        inventory: updatedInventory,
      });
    } catch (dbError) {
      // Fallback to in-memory store
      const existing = inMemoryInventory.get(id);
      if (existing) {
        const updated = {
          ...existing,
          ...updates,
          metadata: {
            ...existing.metadata,
            updatedAt: new Date().toISOString(),
          },
        };
        inMemoryInventory.set(id, updated);
        return NextResponse.json({
          success: true,
          message: "Inventory updated",
          inventory: updated,
        });
      }
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 },
      );
    }
  } catch (error: any) {
    console.error("Error updating inventory:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update inventory" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "chemical",
  featureId: "chemical.inventory",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "chemical",
  featureId: "chemical.inventory",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const PUT = withAPIGateway(putHandler, {
  moduleId: "chemical",
  featureId: "chemical.inventory",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});
