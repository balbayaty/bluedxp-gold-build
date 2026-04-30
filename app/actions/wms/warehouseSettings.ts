"use server";

import { prisma } from "@/lib/services/database/prismaClient";
import type { Warehouse, WarehouseType, WarehouseStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Response type for robust error handling
type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * List all warehouses for a specific tenant or all if no tenant provided (dev mode)
 * Includes essential relations for the UI
 */
export async function listWarehouses(
  tenantId?: string,
): Promise<ActionResponse<Warehouse[]>> {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        facility: true,
        areas: true,
        docks: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, data: warehouses };
  } catch (error) {
    console.error("Failed to list warehouses:", error);
    return { success: false, error: "Failed to fetch warehouses" };
  }
}

/**
 * Create a new warehouse
 * Automatically handles Facility association (creates default if needed)
 */
export async function createWarehouse(data: {
  code: string;
  name: string;
  type: WarehouseType;
  status: WarehouseStatus;
  tenantId: string;
  // Location info to find/create facility
  city?: string;
  country?: string;
  address?: string;
}): Promise<ActionResponse<Warehouse>> {
  try {
    // 1. Validate Input
    if (!data.code || !data.name || !data.tenantId) {
      return {
        success: false,
        error: "Missing required fields: code, name, tenantId",
      };
    }

    // 2. Ensure Facility Exists
    // Strategy: Try to find a facility in this City, otherwise create one.
    // In a real app, user would select a Facility. Here we auto-resolve for UX simplicity.
    let facility = await prisma.facility.findFirst({
      where: {
        tenantId: data.tenantId,
        city: data.city || "Riyadh", // Default fallback
      },
    });

    if (!facility) {
      // Create a default facility for this location
      facility = await prisma.facility.create({
        data: {
          tenantId: data.tenantId,
          name: `${data.city || "Main"} Facility`,
          code: `FAC-${(data.city || "RYD").substring(0, 3).toUpperCase()}-001`,
          city: data.city || "Riyadh",
          country: data.country || "Saudi Arabia",
          address: data.address || "",
          location: {}, // Default JSON
          type: "GENERAL_STORAGE", // Default
          status: "OPERATIONAL",
        },
      });
    }

    // 3. Create Warehouse
    const newWarehouse = await prisma.warehouse.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        status: data.status,
        tenantId: data.tenantId,
        facilityId: facility.id,
        location: {
          address: data.address,
          city: data.city,
          country: data.country,
        },
        // Defaults for required fields
        capacity: 10000,
        utilization: 0,
      },
    });

    revalidatePath("/settings/warehouse");
    return { success: true, data: newWarehouse };
  } catch (error: any) {
    console.error("Failed to create warehouse:", error);
    // Handle unique constraint violation
    if (error.code === "P2002") {
      return {
        success: false,
        error: "A warehouse with this code already exists.",
      };
    }
    return {
      success: false,
      error:
        "Failed to create warehouse: " + (error.message || "Unknown error"),
    };
  }
}

/**
 * Update a warehouse
 */
export async function updateWarehouse(
  id: string,
  data: Partial<{
    name: string;
    status: WarehouseStatus;
    type: WarehouseType;
    capacity: number;
  }>,
): Promise<ActionResponse<Warehouse>> {
  try {
    const updated = await prisma.warehouse.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    revalidatePath("/settings/warehouse");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update warehouse:", error);
    return { success: false, error: "Failed to update warehouse" };
  }
}
