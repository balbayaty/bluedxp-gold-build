/**
 * Athr Naql Verification Service
 *
 * Business logic layer for Athr Naql verification and inquiry services
 * Provides pre-validation for vehicles, drivers, and licenses
 */

import {
  AthrNaqlOperationCardAdapter,
  AthrNaqlLicenseAdapter,
  AthrNaqlDriverCardAdapter,
} from "@/lib/adapters/athr-naql/adapter";
import { eventBus } from "@/lib/services/event-store";
import type {
  AthrNaqlAdapterConfig,
  VehicleVerification,
  DriverVerification,
  CompleteVerification,
  OperationCardStatusRequest,
  LicenseStatusRequest,
  DriverCardStatusRequest,
} from "@/types/athr-naql";

export class AthrNaqlService {
  private operationCardAdapter: AthrNaqlOperationCardAdapter;
  private licenseAdapter: AthrNaqlLicenseAdapter;
  private driverCardAdapter: AthrNaqlDriverCardAdapter;
  private config: AthrNaqlAdapterConfig;

  constructor(config: AthrNaqlAdapterConfig) {
    this.config = config;
    this.operationCardAdapter = new AthrNaqlOperationCardAdapter(config);
    this.licenseAdapter = new AthrNaqlLicenseAdapter(config);
    this.driverCardAdapter = new AthrNaqlDriverCardAdapter(config);
  }

  /**
   * Initialize Athr Naql service
   */
  async initialize(): Promise<void> {
    await this.operationCardAdapter.authenticate();
    await this.licenseAdapter.authenticate();
    await this.driverCardAdapter.authenticate();
  }

  // ============================================================================
  // OPERATION CARD VERIFICATION
  // ============================================================================

  /**
   * Verify vehicle operation card
   */
  async verifyOperationCard(
    request: OperationCardStatusRequest,
  ): Promise<VehicleVerification> {
    const response =
      await this.operationCardAdapter.inquireOperationCardStatus(request);

    const isValid =
      (response.success &&
        response.data &&
        response.data.status === "ACTIVE") ||
      response.data?.statusCode === "ACTIVE";

    return {
      plateNumber: request.plateNumber,
      operationCardValid: isValid,
      operationCardStatus: response.data,
    };
  }

  // ============================================================================
  // LICENSE VERIFICATION
  // ============================================================================

  /**
   * Verify license (V1)
   */
  async verifyLicense(request: LicenseStatusRequest): Promise<boolean> {
    const response = await this.licenseAdapter.inquireLicenseStatus(request);
    return (
      response.success &&
      response.data &&
      (response.data.status === "ACTIVE" ||
        response.data.statusCode === "ACTIVE")
    );
  }

  /**
   * Verify license (V2 - with additional info)
   */
  async verifyLicenseV2(
    request: LicenseStatusRequest,
  ): Promise<LicenseStatusRequest & { valid: boolean; additionalInfo?: any }> {
    const response = await this.licenseAdapter.inquireLicenseStatusV2(request);
    const valid =
      response.success &&
      response.data &&
      (response.data.status === "ACTIVE" ||
        response.data.statusCode === "ACTIVE");

    return {
      ...request,
      valid,
      additionalInfo: response.data?.additionalInfo,
    };
  }

  // ============================================================================
  // DRIVER CARD VERIFICATION
  // ============================================================================

  /**
   * Verify driver card
   */
  async verifyDriverCard(
    request: DriverCardStatusRequest,
  ): Promise<DriverVerification> {
    const response =
      await this.driverCardAdapter.inquireDriverCardStatus(request);

    const isValid =
      response.success &&
      response.data &&
      (response.data.status === "ACTIVE" ||
        response.data.statusCode === "ACTIVE");

    return {
      nationalId: request.nationalId,
      driverCardValid: isValid,
      driverCardStatus: response.data,
    };
  }

  // ============================================================================
  // COMPLETE VERIFICATION
  // ============================================================================

  /**
   * Verify vehicle and driver before trip
   */
  async verifyVehicleAndDriver(
    vehiclePlate: string,
    driverNationalId: string,
    licenseNumber?: string,
  ): Promise<CompleteVerification> {
    // Verify operation card
    const vehicleVerification = await this.verifyOperationCard({
      plateNumber: vehiclePlate,
    });

    // Verify license if provided
    if (licenseNumber) {
      const licenseValid = await this.verifyLicense({ licenseNumber });
      vehicleVerification.licenseValid = licenseValid;
    }

    // Verify driver card
    const driverVerification = await this.verifyDriverCard({
      nationalId: driverNationalId,
    });

    const allValid =
      vehicleVerification.operationCardValid &&
      vehicleVerification.licenseValid !== false &&
      driverVerification.driverCardValid;

    const verification: CompleteVerification = {
      vehicle: vehicleVerification,
      driver: driverVerification,
      allValid,
      verifiedAt: new Date().toISOString(),
    };

    // Emit verification event
    await eventBus.publish({
      type: "athr-naql.verification.completed",
      payload: {
        verification,
        vehiclePlate,
        driverNationalId,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: "athr-naql-service",
      },
    });

    return verification;
  }

  /**
   * Get operation card types
   */
  async getOperationCardTypes() {
    return this.operationCardAdapter.getOperationCardTypes();
  }

  /**
   * Get license types
   */
  async getLicenseTypes() {
    return this.licenseAdapter.getLicenseTypes();
  }

  /**
   * Get driver card category types
   */
  async getDriverCardCategoryTypes() {
    return this.driverCardAdapter.getDriverCardCategoryTypes();
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.operationCardAdapter.authenticate();
      return {
        success: true,
        message: "Athr Naql API connection successful",
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Athr Naql API connection failed: ${error.message}`,
      };
    }
  }
}
