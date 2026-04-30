/**
 * Asset Import Service
 *
 * Handles Excel/CSV import with validation and error handling
 */

import type { FacilityAsset } from "@/types/facility";

export interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: any }>;
  warnings: Array<{ row: number; warning: string }>;
}

export interface ImportOptions {
  validateOwnership?: boolean;
  validateLocation?: boolean;
  autoGenerateCodes?: boolean;
  skipDuplicates?: boolean;
}

export class AssetImportService {
  /**
   * Validate asset data from import
   */
  validateAssetData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim() === "") {
      errors.push("Asset name is required");
    }

    if (
      data.ownershipType &&
      !["owned", "landlord", "leased", "rented", "consigned"].includes(
        data.ownershipType.toLowerCase(),
      )
    ) {
      errors.push(
        "Invalid ownership type. Must be: owned, landlord, leased, rented, or consigned",
      );
    }

    if (
      data.maintenanceResponsibility &&
      !["owner", "tenant", "shared", "landlord"].includes(
        data.maintenanceResponsibility.toLowerCase(),
      )
    ) {
      errors.push(
        "Invalid maintenance responsibility. Must be: owner, tenant, shared, or landlord",
      );
    }

    if (
      data.status &&
      ![
        "operational",
        "maintenance",
        "out-of-service",
        "retired",
        "disposed",
      ].includes(data.status.toLowerCase())
    ) {
      errors.push(
        "Invalid status. Must be: operational, maintenance, out-of-service, retired, or disposed",
      );
    }

    if (
      data.criticality &&
      !["critical", "high", "medium", "low"].includes(
        data.criticality.toLowerCase(),
      )
    ) {
      errors.push(
        "Invalid criticality. Must be: critical, high, medium, or low",
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Process imported data
   */
  async processImport(
    data: any[],
    options: ImportOptions = {},
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      total: data.length,
      imported: 0,
      failed: 0,
      errors: [],
      warnings: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because row 1 is header

      try {
        // Validate
        const validation = this.validateAssetData(row);
        if (!validation.valid) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: validation.errors.join("; "),
            data: row,
          });
          continue;
        }

        // Auto-generate code if needed
        if (options.autoGenerateCodes && !row.code) {
          row.code = this.generateAssetCode(row.name, row.type);
          result.warnings.push({
            row: rowNumber,
            warning: `Auto-generated asset code: ${row.code}`,
          });
        }

        // Process ownership
        if (row.ownershipType === "landlord" && !row.ownerName) {
          result.warnings.push({
            row: rowNumber,
            warning: "Landlord asset should have owner name",
          });
        }

        // Process location
        if (
          options.validateLocation &&
          row.warehouseId &&
          !row.warehouseLocationCode
        ) {
          result.warnings.push({
            row: rowNumber,
            warning: "Warehouse asset should have location code",
          });
        }

        // Here you would save to database
        // await assetService.createAsset(row)

        result.imported++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: error.message || "Unknown error",
          data: row,
        });
      }
    }

    result.success = result.failed === 0;
    return result;
  }

  /**
   * Generate asset code from name and type
   */
  private generateAssetCode(name: string, type?: string): string {
    const prefix = type ? type.substring(0, 3).toUpperCase() : "AST";
    const namePart = name.substring(0, 6).replace(/\s+/g, "-").toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${namePart}-${timestamp}`;
  }

  /**
   * Export assets to Excel format
   */
  exportToExcel(assets: FacilityAsset[]): string {
    const headers = [
      "Name",
      "Code",
      "Type",
      "Status",
      "Manufacturer",
      "Model",
      "Serial Number",
      "Building",
      "Floor",
      "Room",
      "Warehouse ID",
      "Location Code",
      "Zone ID",
      "Ownership Type",
      "Owner Name",
      "Maintenance Responsibility",
      "Maintenance Owner",
      "Acquisition Cost",
      "Current Value",
      "Criticality",
    ];

    const rows = assets.map((asset) => [
      asset.name,
      asset.code || "",
      asset.type,
      asset.status,
      asset.manufacturer || "",
      asset.model || "",
      asset.serialNumber || "",
      asset.location?.building || "",
      asset.location?.floor || "",
      asset.location?.room || "",
      asset.relationships?.warehouseId || "",
      asset.relationships?.warehouseLocationCode || "",
      asset.relationships?.warehouseZoneId || "",
      asset.ownership?.ownershipType || "",
      asset.ownership?.ownerName || "",
      asset.ownership?.maintenanceResponsibility || "",
      asset.ownership?.maintenanceOwner || "",
      asset.financial?.acquisitionCost || "",
      asset.financial?.currentValue || "",
      asset.maintenance?.criticality || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    return csv;
  }
}

export const assetImportService = new AssetImportService();
