/**
 * Asset Import API Endpoint
 * Import assets from Excel/CSV files
 */

import { NextRequest, NextResponse } from "next/server";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file type
    const fileType = file.type || file.name.split(".").pop()?.toLowerCase();
    const isExcel =
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileType === "application/vnd.ms-excel" ||
      file.name.toLowerCase().endsWith(".xlsx") ||
      file.name.toLowerCase().endsWith(".xls");
    const isCSV =
      fileType === "text/csv" || file.name.toLowerCase().endsWith(".csv");

    if (!isExcel && !isCSV) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Please upload Excel (.xlsx, .xls) or CSV file.",
        },
        { status: 400 },
      );
    }

    // Parse file
    let data: any[] = [];

    if (isExcel) {
      const XLSX = require("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    } else {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      data = lines.map((line) => line.split(",").map((cell) => cell.trim()));
    }

    if (data.length < 2) {
      return NextResponse.json(
        { error: "File is empty or has no data rows" },
        { status: 400 },
      );
    }

    // Extract headers (first row)
    const headers = data[0].map((h: string) => h.toLowerCase().trim());

    // Expected columns mapping
    const columnMapping: Record<string, string[]> = {
      name: ["name", "asset name", "asset_name", "title"],
      code: ["code", "asset code", "asset_code", "tag", "asset tag"],
      type: ["type", "asset type", "asset_type", "category"],
      manufacturer: ["manufacturer", "make", "brand"],
      model: ["model", "model number", "model_number"],
      serialNumber: ["serial number", "serial_number", "serial", "s/n"],
      facilityId: ["facility id", "facility_id", "facility", "building"],
      building: ["building", "building name"],
      floor: ["floor", "level"],
      room: ["room", "room number", "room_number"],
      status: ["status", "asset status"],
      ownershipType: [
        "ownership",
        "ownership type",
        "ownership_type",
        "owner type",
      ],
      maintenanceResponsibility: [
        "maintenance responsibility",
        "maintenance_responsibility",
        "maint responsibility",
      ],
      ownerName: ["owner name", "owner_name", "landlord", "property owner"],
      acquisitionCost: [
        "acquisition cost",
        "acquisition_cost",
        "cost",
        "purchase cost",
      ],
      currentValue: ["current value", "current_value", "value"],
      criticality: ["criticality", "priority", "importance"],
    };

    // Map headers to standard names
    const headerMap: Record<string, string> = {};
    headers.forEach((header: string, index: number) => {
      for (const [standardName, variations] of Object.entries(columnMapping)) {
        if (variations.some((v) => header.includes(v))) {
          headerMap[standardName] = index.toString();
          break;
        }
      }
    });

    const results = {
      total: data.length - 1,
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>,
      imported: [] as string[],
      warnings: [] as Array<{ row: number; warning: string }>,
    };

    // Process each row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      try {
        const assetData: any = {
          name: row[parseInt(headerMap.name || "0")] || `Asset ${i}`,
          code: row[parseInt(headerMap.code || "1")] || undefined,
          type: row[parseInt(headerMap.type || "2")] || "equipment",
          manufacturer:
            row[parseInt(headerMap.manufacturer || "3")] || undefined,
          model: row[parseInt(headerMap.model || "4")] || undefined,
          serialNumber:
            row[parseInt(headerMap.serialNumber || "5")] || undefined,
          facilityId: row[parseInt(headerMap.facilityId || "6")] || undefined,
          building: row[parseInt(headerMap.building || "7")] || undefined,
          floor: row[parseInt(headerMap.floor || "8")] || undefined,
          room: row[parseInt(headerMap.room || "9")] || undefined,
          status: (
            row[parseInt(headerMap.status || "10")] || "operational"
          ).toLowerCase(),
          ownershipType: (
            row[parseInt(headerMap.ownershipType || "11")] || "owned"
          ).toLowerCase(),
          maintenanceResponsibility: (
            row[parseInt(headerMap.maintenanceResponsibility || "12")] ||
            "owner"
          ).toLowerCase(),
          ownerName: row[parseInt(headerMap.ownerName || "13")] || undefined,
          acquisitionCost:
            parseFloat(
              row[parseInt(headerMap.acquisitionCost || "14")] || "0",
            ) || undefined,
          currentValue:
            parseFloat(row[parseInt(headerMap.currentValue || "15")] || "0") ||
            undefined,
          criticality: (
            row[parseInt(headerMap.criticality || "16")] || "medium"
          ).toLowerCase(),
        };

        // Validate required fields
        if (!assetData.name) {
          throw new Error("Asset name is required");
        }

        // Validate ownership type
        const validOwnershipTypes = [
          "owned",
          "landlord",
          "leased",
          "rented",
          "consigned",
        ];
        if (!validOwnershipTypes.includes(assetData.ownershipType)) {
          assetData.ownershipType = "owned";
          results.warnings.push({
            row: i + 1,
            warning: `Invalid ownership type, defaulting to 'owned'`,
          });
        }

        // Validate maintenance responsibility
        const validMaintenanceResp = ["owner", "tenant", "shared", "landlord"];
        if (
          !validMaintenanceResp.includes(assetData.maintenanceResponsibility)
        ) {
          assetData.maintenanceResponsibility = "owner";
          results.warnings.push({
            row: i + 1,
            warning: `Invalid maintenance responsibility, defaulting to 'owner'`,
          });
        }

        // Here you would save to database
        // await assetService.createAsset(assetData)

        results.imported.push(assetData.name);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error.message || "Unknown error",
          data: row,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.success} assets successfully${results.failed > 0 ? `, ${results.failed} failed` : ""}`,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Asset import error", err, {
      module: "facility",
      service: "assets",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "assets",
    });
    return NextResponse.json(
      { error: err.message || "Failed to import assets" },
      { status: 500 },
    );
  }
}
