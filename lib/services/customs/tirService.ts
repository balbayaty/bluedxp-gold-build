/**
 * TIR/ETIR Service
 *
 * Manages TIR carnet lifecycle and border coordination:
 * - TIR carnet management (issue, validate, close)
 * - ETIR electronic declarations
 * - IRU guarantee verification
 * - Border crossing coordination
 * - Transit tracking
 */

import type {
  TIRCarnet,
  TIRStatus,
  TIRBorderCrossing,
  TIRGuarantee,
  CountryCode,
  Party,
  Vehicle,
  DeclarationProduct,
} from "@/types/customs";
import type { TIRAdapter } from "@/types/tir";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface TIRServiceConfig {
  enableETIR: boolean;
  enableIRU: boolean;
  autoVerifyGuarantee: boolean;
  maxBorderCrossings: number;
}

export interface IssueCarnetRequest {
  holder: Party;
  vehicle: Vehicle;
  originCountry: CountryCode;
  destinationCountry: CountryCode;
  products: DeclarationProduct[];
  route?: {
    transitCountries: CountryCode[];
    borders: string[];
  };
}

export interface BorderCrossingRequest {
  carnetNumber: string;
  borderId: string;
  borderName: string;
  country: CountryCode;
  type: "DEPARTURE" | "TRANSIT" | "ARRIVAL";
}

// ============================================================================
// TIR SERVICE
// ============================================================================

export class TIRService {
  private adapters: Map<string, TIRAdapter> = new Map();
  private config: TIRServiceConfig;
  private carnets: Map<string, TIRCarnet> = new Map();

  constructor(config?: Partial<TIRServiceConfig>) {
    this.config = {
      enableETIR: true,
      enableIRU: true,
      autoVerifyGuarantee: true,
      maxBorderCrossings: 10,
      ...config,
    };
  }

  // ========================================================================
  // ADAPTER MANAGEMENT
  // ========================================================================

  /**
   * Register TIR adapter
   */
  registerAdapter(adapter: TIRAdapter): void {
    this.adapters.set(adapter.id, adapter);
    this.log("info", `TIR adapter registered: ${adapter.id}`);
  }

  /**
   * Get adapter by type
   */
  getAdapter(type: "ETIR" | "IRU" | "TIR"): TIRAdapter | undefined {
    for (const adapter of this.adapters.values()) {
      if (adapter.type === type) {
        return adapter;
      }
    }
    return undefined;
  }

  // ========================================================================
  // CARNET MANAGEMENT
  // ========================================================================

  /**
   * Issue TIR carnet
   */
  async issueCarnet(request: IssueCarnetRequest): Promise<TIRCarnet> {
    try {
      this.log(
        "info",
        `Issuing TIR carnet for ${request.originCountry} → ${request.destinationCountry}`,
      );

      // Get appropriate adapter (ETIR or TIR)
      const adapter = this.config.enableETIR
        ? this.getAdapter("ETIR")
        : this.getAdapter("TIR");

      if (!adapter) {
        throw new Error("No TIR adapter available");
      }

      // Verify guarantee if enabled
      if (this.config.autoVerifyGuarantee && this.config.enableIRU) {
        const iruAdapter = this.getAdapter("IRU");
        if (iruAdapter) {
          // Get guarantee from holder (would need to be provided)
          // For now, we'll skip this step
        }
      }

      // Issue carnet
      const carnet = await adapter.issueCarnet({
        holder: request.holder,
        vehicle: request.vehicle,
        originCountry: request.originCountry,
        destinationCountry: request.destinationCountry,
        products: request.products,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      });

      // Store carnet
      this.carnets.set(carnet.carnetNumber, carnet);

      // Publish event
      await this.publishEvent("customs.tir.carnet.issued", {
        carnetNumber: carnet.carnetNumber,
        originCountry: request.originCountry,
        destinationCountry: request.destinationCountry,
      });

      this.log("info", `TIR carnet issued: ${carnet.carnetNumber}`);
      return carnet;
    } catch (error: any) {
      this.log("error", "Failed to issue TIR carnet", error);
      throw error;
    }
  }

  /**
   * Get all carnets
   */
  getAllCarnets(): TIRCarnet[] {
    return Array.from(this.carnets.values());
  }

  /**
   * Get carnet by number
   */
  async getCarnet(carnetNumber: string): Promise<TIRCarnet | null> {
    // Check local cache first
    const cached = this.carnets.get(carnetNumber);
    if (cached) {
      return cached;
    }

    // Get from adapter
    const adapter = this.getAdapter("ETIR") || this.getAdapter("TIR");
    if (!adapter) {
      return null;
    }

    try {
      const carnet = await adapter.getCarnet(carnetNumber);
      if (carnet) {
        this.carnets.set(carnetNumber, carnet);
      }
      return carnet;
    } catch (error) {
      this.log("error", `Failed to get carnet: ${carnetNumber}`, error);
      return null;
    }
  }

  /**
   * Update carnet
   */
  async updateCarnet(
    carnetNumber: string,
    updates: Partial<TIRCarnet>,
  ): Promise<TIRCarnet> {
    const carnet = await this.getCarnet(carnetNumber);
    if (!carnet) {
      throw new Error(`Carnet not found: ${carnetNumber}`);
    }

    const adapter = this.getAdapter("ETIR") || this.getAdapter("TIR");
    if (!adapter) {
      throw new Error("No TIR adapter available");
    }

    const updated = await adapter.updateCarnet(carnetNumber, updates);
    this.carnets.set(carnetNumber, updated);

    return updated;
  }

  /**
   * Close carnet
   */
  async closeCarnet(carnetNumber: string, reason?: string): Promise<void> {
    const carnet = await this.getCarnet(carnetNumber);
    if (!carnet) {
      throw new Error(`Carnet not found: ${carnetNumber}`);
    }

    const adapter = this.getAdapter("ETIR") || this.getAdapter("TIR");
    if (!adapter) {
      throw new Error("No TIR adapter available");
    }

    await adapter.closeCarnet(carnetNumber);

    // Update local cache
    const updated = { ...carnet, status: "CLOSED" as TIRStatus };
    this.carnets.set(carnetNumber, updated);

    // Publish event
    await this.publishEvent("customs.tir.carnet.closed", {
      carnetNumber,
      reason,
    });

    this.log("info", `TIR carnet closed: ${carnetNumber}`);
  }

  // ========================================================================
  // BORDER CROSSING
  // ========================================================================

  /**
   * Register border crossing
   */
  async registerBorderCrossing(
    request: BorderCrossingRequest,
  ): Promise<TIRBorderCrossing> {
    const carnet = await this.getCarnet(request.carnetNumber);
    if (!carnet) {
      throw new Error(`Carnet not found: ${request.carnetNumber}`);
    }

    // Check if carnet is active
    if (carnet.status !== "ACTIVE" && carnet.status !== "IN_TRANSIT") {
      throw new Error(`Carnet is not active: ${carnet.status}`);
    }

    // Check border limit
    if (carnet.borders.length >= this.config.maxBorderCrossings) {
      throw new Error(
        `Maximum border crossings reached: ${this.config.maxBorderCrossings}`,
      );
    }

    const adapter = this.getAdapter("ETIR") || this.getAdapter("TIR");
    if (!adapter) {
      throw new Error("No TIR adapter available");
    }

    // Register border crossing
    const borderCrossing = await adapter.registerBorderCrossing(
      request.carnetNumber,
      {
        borderId: request.borderId,
        borderName: request.borderName,
        country: request.country,
        sequence: carnet.borders.length + 1,
        type: request.type,
        status: "PENDING",
      },
    );

    // Update carnet
    const updatedBorders = [...carnet.borders, borderCrossing];
    const updatedCarnet = await this.updateCarnet(request.carnetNumber, {
      borders: updatedBorders,
      status: "IN_TRANSIT" as TIRStatus,
      currentBorderIndex: updatedBorders.length - 1,
    });

    // Publish event
    await this.publishEvent("customs.tir.border.crossed", {
      carnetNumber: request.carnetNumber,
      borderId: request.borderId,
      borderName: request.borderName,
      country: request.country,
      type: request.type,
    });

    this.log(
      "info",
      `Border crossing registered: ${request.borderId} for carnet ${request.carnetNumber}`,
    );
    return borderCrossing;
  }

  /**
   * Get border crossings for carnet
   */
  async getBorderCrossings(carnetNumber: string): Promise<TIRBorderCrossing[]> {
    const carnet = await this.getCarnet(carnetNumber);
    if (!carnet) {
      return [];
    }

    const adapter = this.getAdapter("ETIR") || this.getAdapter("TIR");
    if (!adapter) {
      return carnet.borders;
    }

    try {
      return await adapter.getBorderCrossings(carnetNumber);
    } catch (error) {
      this.log(
        "warn",
        `Failed to get border crossings from adapter, using cached`,
        error,
      );
      return carnet.borders;
    }
  }

  // ========================================================================
  // GUARANTEE VERIFICATION
  // ========================================================================

  /**
   * Verify TIR guarantee
   */
  async verifyGuarantee(guaranteeNumber: string): Promise<{
    valid: boolean;
    guarantee: TIRGuarantee | null;
    status: string;
  }> {
    if (!this.config.enableIRU) {
      return {
        valid: false,
        guarantee: null,
        status: "IRU not enabled",
      };
    }

    const iruAdapter = this.getAdapter("IRU");
    if (!iruAdapter) {
      return {
        valid: false,
        guarantee: null,
        status: "IRU adapter not available",
      };
    }

    try {
      const verification = await iruAdapter.verifyGuarantee(guaranteeNumber);
      return {
        valid: verification.status === "VALID",
        guarantee: verification.guarantee,
        status: verification.status,
      };
    } catch (error) {
      this.log(
        "error",
        `Failed to verify guarantee: ${guaranteeNumber}`,
        error,
      );
      return {
        valid: false,
        guarantee: null,
        status: "VERIFICATION_FAILED",
      };
    }
  }

  // ========================================================================
  // ETIR SUPPORT
  // ========================================================================

  /**
   * Submit ETIR declaration
   */
  async submitETIRDeclaration(carnetNumber: string): Promise<void> {
    if (!this.config.enableETIR) {
      throw new Error("ETIR is not enabled");
    }

    const adapter = this.getAdapter("ETIR");
    if (!adapter) {
      throw new Error("ETIR adapter not available");
    }

    const carnet = await this.getCarnet(carnetNumber);
    if (!carnet) {
      throw new Error(`Carnet not found: ${carnetNumber}`);
    }

    // Build ETIR declaration data
    const etirData = {
      tirCarnetId: carnet.id,
      carnetNumber: carnet.carnetNumber,
      countries: [
        carnet.originCountry,
        carnet.destinationCountry,
      ] as CountryCode[],
    };

    await adapter.submitETIRDeclaration(etirData);

    this.log("info", `ETIR declaration submitted for carnet: ${carnetNumber}`);
  }

  // ========================================================================
  // EVENT PUBLISHING
  // ========================================================================

  private async publishEvent(
    eventType: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      await eventBus.publish({
        id: `evt-${Date.now()}`,
        type: eventType,
        aggregateId: data.carnetNumber || "tir",
        aggregateType: "tir-carnet",
        data,
        metadata: {
          timestamp: new Date(),
          source: "tir-service",
        },
      });
    } catch (error) {
      this.log("error", `Failed to publish event: ${eventType}`, error);
    }
  }

  // ========================================================================
  // LOGGING
  // ========================================================================

  private log(
    level: "info" | "warn" | "error",
    message: string,
    data?: any,
  ): void {
    const prefix = "[TIRService]";
    switch (level) {
      case "info":
        console.log(prefix, message, data || "");
        break;
      case "warn":
        console.warn(prefix, message, data || "");
        break;
      case "error":
        console.error(prefix, message, data || "");
        break;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const tirService = new TIRService();
