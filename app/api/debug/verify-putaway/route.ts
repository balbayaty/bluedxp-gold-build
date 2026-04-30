import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/database/prismaClient";
import {
  getPutawaySuggestion,
  confirmPutaway,
} from "@/app/actions/wms/putawayActions";
import { binService } from "@/lib/services/wms/binService";

export async function GET() {
  try {
    const tenantId = "demo-tenant";
    const userId = "system-test";

    // 1. Ensure Facility exists (Must be Hazmat capable for score)
    let facility = await prisma.facility.findFirst({
      where: { tenantId, name: "Debug Hazmat Facility" },
    });

    if (!facility) {
      facility = await prisma.facility.create({
        data: {
          tenantId,
          name: "Debug Hazmat Facility",
          code: "DEBUG-FAC-HAZ",
          type: "HAZMAT_STORAGE",
          status: "OPERATIONAL",
          complianceStatus: "COMPLIANT",
        },
      });
    }

    // 2. Ensure Warehouse exists
    const warehouse =
      (await prisma.warehouse.findFirst({
        where: { tenantId, facilityId: facility.id },
      })) ||
      (await prisma.warehouse.create({
        data: {
          tenantId,
          facilityId: facility.id,
          name: "Debug WH",
          code: "DEBUG-WH-HAZ",
          type: "DISTRIBUTION",
        },
      }));

    // 3. Setup: Ensure we have a Hazmat Area and a General Area
    let hazmatArea = await prisma.warehouseArea.findFirst({
      where: {
        allowedHazards: { has: "3" },
        warehouse: { tenantId },
      },
    });

    let generalArea = await prisma.warehouseArea.findFirst({
      where: {
        allowedHazards: { isEmpty: true },
        warehouse: { tenantId },
      },
    });

    if (!hazmatArea) {
      hazmatArea = await prisma.warehouseArea.create({
        data: {
          warehouseId: warehouse.id,
          name: "Debug Hazmat Zone",
          code: "DHZ",
          zone: "H",
          allowedHazards: ["3"],
          temperatureZone: "AMBIENT",
          type: "STORAGE",
        },
      });
      // Generate bins
      await binService.generateBinsForAisle(hazmatArea.id, {
        aisle: "H",
        bays: 1,
        levels: 1,
      });
    }

    if (!generalArea) {
      generalArea = await prisma.warehouseArea.create({
        data: {
          warehouseId: warehouse.id,
          name: "Debug General Zone",
          code: "DGZ",
          zone: "G",
          allowedHazards: [],
          temperatureZone: "AMBIENT",
          type: "STORAGE",
        },
      });
      await binService.generateBinsForAisle(generalArea.id, {
        aisle: "G",
        bays: 1,
        levels: 1,
      });
    }

    // 4. Create Materials
    const hazmatSku = "TEST-FLAM-001";
    const generalSku = "TEST-GEN-001";

    await prisma.materialMaster.upsert({
      where: {
        tenantId_materialNumber: { tenantId, materialNumber: hazmatSku },
      },
      create: {
        tenantId,
        materialNumber: hazmatSku,
        description: "Flammable Polish",
        isHazardous: true,
        hazmatClass: "3",
      },
      update: { isHazardous: true, hazmatClass: "3" },
    });

    await prisma.materialMaster.upsert({
      where: {
        tenantId_materialNumber: { tenantId, materialNumber: generalSku },
      },
      create: {
        tenantId,
        materialNumber: generalSku,
        description: "Standard Widget",
        isHazardous: false,
      },
      update: { isHazardous: false, hazmatClass: null },
    });

    // 5. Test Suggestion: Hazmat
    const hazmatRec = await getPutawaySuggestion(hazmatSku, 10, tenantId);

    // 6. Test Suggestion: General
    const generalRec = await getPutawaySuggestion(generalSku, 50, tenantId);

    // 7. Setup Inbound Delivery Item for Confirmation Test
    const delivery = await prisma.inboundDelivery.create({
      data: { tenantId, documentNumber: `ASN-${Date.now()}` },
    });
    const item = await prisma.inboundDeliveryItem.create({
      data: {
        inboundDeliveryId: delivery.id,
        sku: hazmatSku,
        expectedQty: 100,
      },
    });

    // 8. Confirm Putaway
    const confirmResult = await confirmPutaway(
      item.id,
      hazmatRec.data?.recommendedBinId!,
      10,
      userId,
      tenantId,
    );

    // 9. Verify Inventory
    const inv = await prisma.inventoryQuant.findFirst({
      where: { sku: hazmatSku, binId: hazmatRec.data?.recommendedBinId },
    });

    return NextResponse.json({
      success: true,
      results: {
        hazmatSuggestion: {
          sku: hazmatSku,
          area: hazmatRec.data?.areaName,
          bin: hazmatRec.data?.recommendedBinCode,
          reason: hazmatRec.data?.reason,
          expectedHazard: "3",
          pass:
            hazmatRec.data?.areaName?.includes("Hazmat") ||
            hazmatRec.data?.reason?.includes("Class 3"),
        },
        generalSuggestion: {
          sku: generalSku,
          area: generalRec.data?.areaName,
          bin: generalRec.data?.recommendedBinCode,
          pass: !generalRec.data?.areaName?.includes("Hazmat"),
        },
        inventoryCreation: {
          created: !!inv,
          qty: inv?.quantity,
          status: inv?.status,
        },
        confirmation: confirmResult,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, stack: e.stack },
      { status: 500 },
    );
  }
}
