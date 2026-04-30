/**
 * MSDS Data Storage Service
 * Provides persistent storage and cross-module access for MSDS data
 * Used by Warehouse, Transportation, Compliance, and other modules
 */

import { MSDSDocument, ExtractedMSDSData } from "@/types/chemical";
import { getMSDSDatabaseAdapter } from "./msdsDatabaseAdapter";

interface MSDSStorageEntry {
  id: string;
  msds: MSDSDocument;
  extractedData: ExtractedMSDSData;
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    tenantId: string;
    moduleAccess: string[]; // ['warehouse', 'transportation', 'compliance', 'civil-defense', 'ministry-interior']
  };
  // Cross-module data
  warehouseData?: {
    recommendedWarehouse?: string;
    storageRequirements?: string[];
    compatibilityChecks?: any[];
  };
  transportationData?: {
    unNumber?: string;
    transportClass?: string;
    packingGroup?: string;
    multimodalCompatible?: {
      sea: boolean;
      rail: boolean;
      road: boolean;
      air: boolean;
    };
    transportRestrictions?: string[];
  };
  complianceData?: {
    civilDefenseApproved?: boolean;
    civilDefenseLicense?: string;
    ministryInteriorApproved?: boolean;
    ministryInteriorLicense?: string;
    importApproval?: boolean;
    exportApproval?: boolean;
    regulatoryFrameworks?: string[];
  };
}

class MSDSStorageService {
  private storage: Map<string, MSDSStorageEntry> = new Map();
  private tenantStorage: Map<string, Map<string, MSDSStorageEntry>> = new Map();
  private dbAdapter = getMSDSDatabaseAdapter();

  /**
   * Store MSDS data for cross-module access
   */
  async storeMSDS(
    msds: MSDSDocument,
    extractedData: ExtractedMSDSData,
    options: {
      tenantId: string;
      createdBy: string;
      moduleAccess?: string[];
    },
  ): Promise<string> {
    if (!options?.tenantId || options.tenantId.trim().length === 0) {
      throw new Error(
        "tenantId is required for MSDS storage (multi-tenant day 1)",
      );
    }
    const entry: MSDSStorageEntry = {
      id: msds.id,
      msds,
      extractedData,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: options.createdBy,
        tenantId: options.tenantId,
        moduleAccess: options.moduleAccess || [
          "warehouse",
          "transportation",
          "compliance",
        ],
      },
      // Initialize cross-module data
      warehouseData: {
        storageRequirements: extractedData.storageRequirements || [],
      },
      transportationData: {
        unNumber: extractedData.unNumber,
        transportClass: extractedData.transportClass,
        packingGroup: extractedData.packingGroup,
        multimodalCompatible: {
          sea: this.checkTransportModeCompatibility(extractedData, "sea"),
          rail: this.checkTransportModeCompatibility(extractedData, "rail"),
          road: this.checkTransportModeCompatibility(extractedData, "road"),
          air: this.checkTransportModeCompatibility(extractedData, "air"),
        },
      },
      complianceData: {
        regulatoryFrameworks: this.determineRegulatoryFrameworks(extractedData),
      },
    };

    // Try to store in database first
    try {
      await this.dbAdapter.storeMSDS(entry);
    } catch (error) {
      console.warn(
        "⚠️ Database storage failed, using in-memory fallback:",
        error,
      );
    }

    // Also store in memory (for fast access and fallback)
    this.storage.set(msds.id, entry);

    // Store by tenant
    const tenantId = options.tenantId;
    if (!this.tenantStorage.has(tenantId)) {
      this.tenantStorage.set(tenantId, new Map());
    }
    this.tenantStorage.get(tenantId)!.set(msds.id, entry);

    return msds.id;
  }

  /**
   * Get MSDS data by ID (accessible to all modules)
   */
  async getMSDS(
    id: string,
    tenantId?: string,
  ): Promise<MSDSStorageEntry | null> {
    // Try database first
    if (this.dbAdapter.isDatabaseAvailable()) {
      const dbEntry = await this.dbAdapter.getMSDS(id, tenantId);
      if (dbEntry) {
        // Also cache in memory for fast access
        this.storage.set(id, dbEntry);
        if (tenantId) {
          if (!this.tenantStorage.has(tenantId)) {
            this.tenantStorage.set(tenantId, new Map());
          }
          this.tenantStorage.get(tenantId)!.set(id, dbEntry);
        }
        return dbEntry;
      }
    }

    // Fallback to in-memory
    if (tenantId) {
      return this.tenantStorage.get(tenantId)?.get(id) || null;
    }
    return this.storage.get(id) || null;
  }

  /**
   * Get MSDS by CAS number (for warehouse/compliance lookups)
   */
  async getMSDSByCAS(
    casNumber: string,
    tenantId?: string,
  ): Promise<MSDSStorageEntry | null> {
    const searchMap = tenantId
      ? this.tenantStorage.get(tenantId)
      : this.storage;
    if (!searchMap) return null;

    for (const entry of searchMap.values()) {
      if (entry.extractedData.casNumber === casNumber) {
        return entry;
      }
    }
    return null;
  }

  /**
   * Get MSDS by chemical name (for transportation lookups)
   */
  async getMSDSByName(
    chemicalName: string,
    tenantId?: string,
  ): Promise<MSDSStorageEntry | null> {
    const searchMap = tenantId
      ? this.tenantStorage.get(tenantId)
      : this.storage;
    if (!searchMap) return null;

    for (const entry of searchMap.values()) {
      if (
        entry.extractedData.productName
          ?.toLowerCase()
          .includes(chemicalName.toLowerCase())
      ) {
        return entry;
      }
    }
    return null;
  }

  /**
   * Update warehouse data for MSDS
   */
  async updateWarehouseData(
    msdsId: string,
    warehouseData: {
      recommendedWarehouse?: string;
      storageRequirements?: string[];
      compatibilityChecks?: any[];
    },
    tenantId?: string,
  ): Promise<boolean> {
    const entry = await this.getMSDS(msdsId, tenantId);
    if (!entry) return false;

    entry.warehouseData = { ...entry.warehouseData, ...warehouseData };
    entry.metadata.updatedAt = new Date().toISOString();

    // Update storage
    this.storage.set(msdsId, entry);
    if (tenantId && this.tenantStorage.has(tenantId)) {
      this.tenantStorage.get(tenantId)!.set(msdsId, entry);
    }

    return true;
  }

  /**
   * Update transportation data for MSDS
   */
  async updateTransportationData(
    msdsId: string,
    transportationData: {
      multimodalCompatible?: {
        sea?: boolean;
        rail?: boolean;
        road?: boolean;
        air?: boolean;
      };
      transportRestrictions?: string[];
    },
    tenantId?: string,
  ): Promise<boolean> {
    const entry = await this.getMSDS(msdsId, tenantId);
    if (!entry) return false;

    entry.transportationData = {
      ...entry.transportationData,
      ...transportationData,
      multimodalCompatible: {
        ...entry.transportationData?.multimodalCompatible,
        ...transportationData.multimodalCompatible,
      },
    };
    entry.metadata.updatedAt = new Date().toISOString();

    // Update storage
    this.storage.set(msdsId, entry);
    if (tenantId && this.tenantStorage.has(tenantId)) {
      this.tenantStorage.get(tenantId)!.set(msdsId, entry);
    }

    return true;
  }

  /**
   * Update compliance data for MSDS
   */
  async updateComplianceData(
    msdsId: string,
    complianceData: {
      civilDefenseApproved?: boolean;
      civilDefenseLicense?: string;
      ministryInteriorApproved?: boolean;
      ministryInteriorLicense?: string;
      importApproval?: boolean;
      exportApproval?: boolean;
    },
    tenantId?: string,
  ): Promise<boolean> {
    const entry = await this.getMSDS(msdsId, tenantId);
    if (!entry) return false;

    entry.complianceData = { ...entry.complianceData, ...complianceData };
    entry.metadata.updatedAt = new Date().toISOString();

    // Update storage
    this.storage.set(msdsId, entry);
    if (tenantId && this.tenantStorage.has(tenantId)) {
      this.tenantStorage.get(tenantId)!.set(msdsId, entry);
    }

    return true;
  }

  /**
   * Get all MSDS for a module (warehouse, transportation, compliance)
   */
  async getMSDSForModule(
    module: string,
    tenantId?: string,
  ): Promise<MSDSStorageEntry[]> {
    const searchMap = tenantId
      ? this.tenantStorage.get(tenantId)
      : this.storage;
    if (!searchMap) return [];

    const results: MSDSStorageEntry[] = [];
    for (const entry of searchMap.values()) {
      if (entry.metadata.moduleAccess.includes(module)) {
        results.push(entry);
      }
    }
    return results;
  }

  /**
   * Check transport mode compatibility
   */
  private checkTransportModeCompatibility(
    extractedData: ExtractedMSDSData,
    mode: "sea" | "rail" | "road" | "air",
  ): boolean {
    const hazardLevel = extractedData.hazardLevel || "Low";
    const unNumber = extractedData.unNumber;
    const transportClass = extractedData.transportClass;

    // Air transport has stricter restrictions
    if (mode === "air") {
      if (hazardLevel === "High") return false;
      // Check IATA restrictions
      if (
        transportClass?.includes("Class 1") ||
        transportClass?.includes("Class 7")
      ) {
        return false; // Explosives and radioactive materials
      }
    }

    // Sea transport - most permissive
    if (mode === "sea") {
      return true; // Most chemicals can be transported by sea
    }

    // Rail transport
    if (mode === "rail") {
      if (hazardLevel === "High" && !unNumber) return false;
      return true;
    }

    // Road transport
    if (mode === "road") {
      return true; // Most chemicals can be transported by road
    }

    return true;
  }

  /**
   * Determine regulatory frameworks based on extracted data
   */
  private determineRegulatoryFrameworks(
    extractedData: ExtractedMSDSData,
  ): string[] {
    const frameworks: string[] = [];

    // GHS compliance
    if (extractedData.ghsCompliant) {
      frameworks.push("GHS");
    }

    // UN transport classification
    if (extractedData.unNumber) {
      frameworks.push("UN Transport");
    }

    // Hazard level indicates regulatory oversight
    if (extractedData.hazardLevel === "High") {
      frameworks.push("High-Risk Chemical Regulation");
    }

    // Storage requirements indicate specific regulations
    if (
      extractedData.storageRequirements?.some((req) =>
        req.toLowerCase().includes("temperature"),
      )
    ) {
      frameworks.push("Temperature-Controlled Storage Regulation");
    }

    return frameworks;
  }

  /**
   * Get MSDS for transportation planning (multimodal)
   */
  async getMSDSForTransportation(
    chemicalName: string,
    transportMode: "sea" | "rail" | "road" | "air",
    tenantId?: string,
  ): Promise<MSDSStorageEntry | null> {
    const entry = await this.getMSDSByName(chemicalName, tenantId);
    if (!entry) return null;

    // Check if compatible with requested transport mode
    const compatible =
      entry.transportationData?.multimodalCompatible?.[transportMode];
    if (compatible === false) {
      return null; // Not compatible with this transport mode
    }

    return entry;
  }

  /**
   * Get MSDS for compliance checking (Civil Defense, Ministry of Interior)
   */
  async getMSDSForCompliance(
    casNumber: string,
    complianceType: "civil-defense" | "ministry-interior" | "import" | "export",
    tenantId?: string,
  ): Promise<MSDSStorageEntry | null> {
    const entry = await this.getMSDSByCAS(casNumber, tenantId);
    if (!entry) return null;

    // Check if compliance data exists
    if (complianceType === "civil-defense") {
      return entry.complianceData?.civilDefenseApproved ? entry : null;
    }
    if (complianceType === "ministry-interior") {
      return entry.complianceData?.ministryInteriorApproved ? entry : null;
    }
    if (complianceType === "import") {
      return entry.complianceData?.importApproval ? entry : null;
    }
    if (complianceType === "export") {
      return entry.complianceData?.exportApproval ? entry : null;
    }

    return entry;
  }
}

export const msdsStorageService = new MSDSStorageService();
