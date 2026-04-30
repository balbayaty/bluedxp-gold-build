/**
 * Data Reuse Service
 * Intelligently propagates MSDS data to WMS, Inventory, Compliance, and Transportation modules
 * Reduces double work by reusing captured data
 */

import { MSDSDocument, ExtractedMSDSData } from "@/types/chemical";
import { SKU, PackagingHierarchy, PackagingLevel } from "@/types/sku";
import {
  MSDSSKULink,
  MSDSPackagingData,
  DataReuseTracking,
} from "@/types/msdsSkuLinking";
import { msdsStorageService } from "@/lib/services/chemical/msdsStorage";
import { skuService } from "@/lib/services/wms/skuService";
import { eventBus } from "@/lib/services/event-store";

export interface DataReuseOptions {
  reusePackaging?: boolean;
  reusePalletConfiguration?: boolean;
  reuseStorageRequirements?: boolean;
  reuseComplianceData?: boolean;
  reuseTransportationData?: boolean;
  targetModules?: ("WMS" | "INVENTORY" | "COMPLIANCE" | "TRANSPORTATION")[];
  overwriteExisting?: boolean;
  reuseBy?: string;
}

export class DataReuseService {
  /**
   * Reuse MSDS data for SKU
   * Automatically populates SKU fields from approved MSDS data
   */
  async reuseMSDSDataForSKU(
    link: MSDSSKULink,
    msds: MSDSDocument,
    sku: SKU,
    options: DataReuseOptions = {},
  ): Promise<{
    reused: boolean;
    tracking: DataReuseTracking;
    updatedFields: string[];
  }> {
    try {
      // Only reuse if link is approved
      if (link.status !== "APPROVED") {
        throw new Error("Can only reuse data from approved links");
      }

      const tracking: DataReuseTracking = {};
      const updatedFields: string[] = [];
      const updates: Partial<SKU> = {};

      // Get MSDS storage entry for cross-module data
      const msdsStorage = await msdsStorageService.getMSDS(msds.id);
      const extractedData = msds.extractedData || {};

      // 1. Reuse Packaging Data
      if (options.reusePackaging !== false) {
        const packagingResult = await this.reusePackagingData(
          msds,
          extractedData,
          sku,
          options,
        );
        if (packagingResult.reused) {
          tracking.packaging = {
            reused: true,
            reusedAt: new Date().toISOString(),
            reusedBy: options.reuseBy,
            targetModule: "WMS",
          };
          Object.assign(updates, packagingResult.updates);
          updatedFields.push(...packagingResult.fields);
        }
      }

      // 2. Reuse Pallet Configuration
      if (options.reusePalletConfiguration !== false) {
        const palletResult = await this.reusePalletConfiguration(
          msds,
          extractedData,
          sku,
          options,
        );
        if (palletResult.reused) {
          tracking.palletConfiguration = {
            reused: true,
            reusedAt: new Date().toISOString(),
            reusedBy: options.reuseBy,
            targetModule: "WMS",
          };
          Object.assign(updates, palletResult.updates);
          updatedFields.push(...palletResult.fields);
        }
      }

      // 3. Reuse Storage Requirements
      if (options.reuseStorageRequirements !== false) {
        const storageResult = await this.reuseStorageRequirements(
          msds,
          extractedData,
          sku,
          options,
        );
        if (storageResult.reused) {
          tracking.storageRequirements = {
            reused: true,
            reusedAt: new Date().toISOString(),
            reusedBy: options.reuseBy,
            targetModule: "WMS",
          };
          Object.assign(updates, storageResult.updates);
          updatedFields.push(...storageResult.fields);
        }
      }

      // 4. Reuse Compliance Data
      if (
        options.reuseComplianceData !== false &&
        msdsStorage?.complianceData
      ) {
        const complianceResult = await this.reuseComplianceData(
          msdsStorage.complianceData,
          sku,
          options,
        );
        if (complianceResult.reused) {
          tracking.complianceData = {
            reused: true,
            reusedAt: new Date().toISOString(),
            reusedBy: options.reuseBy,
            targetModule: "COMPLIANCE",
          };
          Object.assign(updates, complianceResult.updates);
          updatedFields.push(...complianceResult.fields);
        }
      }

      // 5. Reuse Transportation Data
      if (
        options.reuseTransportationData !== false &&
        msdsStorage?.transportationData
      ) {
        const transportResult = await this.reuseTransportationData(
          msdsStorage.transportationData,
          sku,
          options,
        );
        if (transportResult.reused) {
          tracking.transportationData = {
            reused: true,
            reusedAt: new Date().toISOString(),
            reusedBy: options.reuseBy,
            targetModule: "TRANSPORTATION",
          };
          Object.assign(updates, transportResult.updates);
          updatedFields.push(...transportResult.fields);
        }
      }

      // Update SKU if there are updates
      if (Object.keys(updates).length > 0) {
        await skuService.updateSKU(sku.id, {
          ...updates,
          updatedBy: options.reuseBy,
        });

        // Publish event
        eventBus.publish("msds-sku.data.reused", {
          linkId: link.id,
          msdsId: link.msdsId,
          skuId: link.skuId,
          reusedFields: updatedFields,
          tracking,
        });
      }

      return {
        reused: Object.keys(tracking).length > 0,
        tracking,
        updatedFields,
      };
    } catch (error) {
      console.error("Error reusing MSDS data:", error);
      throw error;
    }
  }

  /**
   * Reuse packaging data
   */
  private async reusePackagingData(
    msds: MSDSDocument,
    extractedData: ExtractedMSDSData,
    sku: SKU,
    options: DataReuseOptions,
  ): Promise<{
    reused: boolean;
    updates: Partial<SKU>;
    fields: string[];
  }> {
    const updates: Partial<SKU> = {};
    const fields: string[] = [];

    // Extract packaging type from MSDS
    const packagingType = extractedData.packagingType;
    if (packagingType && (!sku.defaultPackaging || options.overwriteExisting)) {
      // Map MSDS packaging to SKU packaging
      // This is simplified - in production would have more sophisticated mapping
      updates.defaultPackaging = packagingType;
      fields.push("defaultPackaging");
    }

    return {
      reused: fields.length > 0,
      updates,
      fields,
    };
  }

  /**
   * Reuse pallet configuration
   */
  private async reusePalletConfiguration(
    msds: MSDSDocument,
    extractedData: ExtractedMSDSData,
    sku: SKU,
    options: DataReuseOptions,
  ): Promise<{
    reused: boolean;
    updates: Partial<SKU>;
    fields: string[];
  }> {
    const updates: Partial<SKU> = {};
    const fields: string[] = [];

    // Check if SKU already has packaging hierarchy
    const existingHierarchy = await skuService.getPackagingHierarchy(sku.id);

    if (!existingHierarchy || options.overwriteExisting) {
      // Extract pallet info from MSDS (would need to parse from extractedData)
      // For now, create a basic pallet level if not exists
      if (!existingHierarchy) {
        // Create packaging hierarchy with pallet level
        await skuService.createPackagingHierarchy(sku.id, {
          levels: [
            {
              id: `level-${Date.now()}`,
              level: 1,
              name: "Each",
              code: "EA",
              unitOfMeasure: sku.baseUnit || "EA",
              active: true,
              default: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: `pallet-${Date.now()}`,
              level: 2,
              name: "Pallet",
              code: "PLT",
              unitOfMeasure: "PLT",
              isPallet: true,
              palletType: "STANDARD_EURO",
              active: true,
              default: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          defaultLevel: `level-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        fields.push("packagingHierarchy");
      }
    }

    return {
      reused: fields.length > 0,
      updates,
      fields,
    };
  }

  /**
   * Reuse storage requirements
   */
  private async reuseStorageRequirements(
    msds: MSDSDocument,
    extractedData: ExtractedMSDSData,
    sku: SKU,
    options: DataReuseOptions,
  ): Promise<{
    reused: boolean;
    updates: Partial<SKU>;
    fields: string[];
  }> {
    const updates: Partial<SKU> = {};
    const fields: string[] = [];

    // Extract storage conditions from MSDS
    const storageConditions = extractedData.storageConditions || [];

    if (storageConditions.length > 0) {
      // Parse temperature requirements
      const tempMatch = storageConditions
        .join(" ")
        .match(/(\d+)[°-]?(\d+)?\s*[CF]?/i);
      if (tempMatch && (!sku.minTemperature || options.overwriteExisting)) {
        const minTemp = parseInt(tempMatch[1]);
        const maxTemp = tempMatch[2] ? parseInt(tempMatch[2]) : undefined;

        updates.minTemperature = minTemp;
        updates.temperatureUnit = "C";
        if (maxTemp) {
          updates.maxTemperature = maxTemp;
        }
        updates.temperatureControlled = true;
        fields.push(
          "minTemperature",
          "maxTemperature",
          "temperatureControlled",
        );
      }

      // Parse humidity requirements
      const humidityMatch = storageConditions.join(" ").match(/(\d+)%?\s*RH/i);
      if (humidityMatch && (!sku.minHumidity || options.overwriteExisting)) {
        const humidity = parseInt(humidityMatch[1]);
        updates.minHumidity = Math.max(0, humidity - 5);
        updates.maxHumidity = Math.min(100, humidity + 5);
        updates.humidityControlled = true;
        fields.push("minHumidity", "maxHumidity", "humidityControlled");
      }

      // Check for light sensitivity
      if (
        storageConditions.some((s) => /dark|light/i.test(s)) &&
        (!sku.lightSensitive || options.overwriteExisting)
      ) {
        updates.lightSensitive = true;
        fields.push("lightSensitive");
      }
    }

    return {
      reused: fields.length > 0,
      updates,
      fields,
    };
  }

  /**
   * Reuse compliance data
   */
  private async reuseComplianceData(
    complianceData: any,
    sku: SKU,
    options: DataReuseOptions,
  ): Promise<{
    reused: boolean;
    updates: Partial<SKU>;
    fields: string[];
  }> {
    const updates: Partial<SKU> = {};
    const fields: string[] = [];

    // Reuse Civil Defense approval
    if (
      complianceData.civilDefenseApproved &&
      (!sku.regulatoryStatus || options.overwriteExisting)
    ) {
      if (!updates.regulatoryStatus) {
        updates.regulatoryStatus = [];
      }
      updates.regulatoryStatus.push({
        authority: "Civil Defense",
        region: "Saudi Arabia",
        status: complianceData.civilDefenseApproved ? "APPROVED" : "PENDING",
        registrationNumber: complianceData.civilDefenseLicense,
        expiryDate: undefined, // Would extract from complianceData
        notes: "Imported from MSDS",
      });
      fields.push("regulatoryStatus");
    }

    return {
      reused: fields.length > 0,
      updates,
      fields,
    };
  }

  /**
   * Reuse transportation data
   */
  private async reuseTransportationData(
    transportationData: any,
    sku: SKU,
    options: DataReuseOptions,
  ): Promise<{
    reused: boolean;
    updates: Partial<SKU>;
    fields: string[];
  }> {
    const updates: Partial<SKU> = {};
    const fields: string[] = [];

    // Reuse UN number
    if (
      transportationData.unNumber &&
      (!sku.unNumber || options.overwriteExisting)
    ) {
      updates.unNumber = transportationData.unNumber;
      fields.push("unNumber");
    }

    // Reuse hazard class
    if (
      transportationData.transportClass &&
      (!sku.hazardClass || options.overwriteExisting)
    ) {
      updates.hazardClass = transportationData.transportClass;
      fields.push("hazardClass");
    }

    // Reuse packing group
    if (
      transportationData.packingGroup &&
      (!sku.packingGroup || options.overwriteExisting)
    ) {
      updates.packingGroup = transportationData.packingGroup;
      fields.push("packingGroup");
    }

    // Reuse proper shipping name
    if (
      transportationData.properShippingName &&
      (!sku.properShippingName || options.overwriteExisting)
    ) {
      updates.properShippingName = transportationData.properShippingName;
      fields.push("properShippingName");
    }

    return {
      reused: fields.length > 0,
      updates,
      fields,
    };
  }
}

export const dataReuseService = new DataReuseService();
