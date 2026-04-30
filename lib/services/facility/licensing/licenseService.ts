/**
 * Facility License Management Service
 *
 * Single canonical implementation (deduplicated).
 * Keeps in-memory stores (dev-safe) and integration hooks (Civil Defense / Abalady).
 */

import type {
  FacilityLicense,
  FacilityPermit,
  FacilityCertification,
  LicenseStatus,
  LicenseType,
} from "@/types/facility";
import { CivilDefenseAdapter } from "@/lib/adapters/facility/civilDefenseAdapter";
import { AbaladyAdapter } from "@/lib/adapters/facility/abaladyAdapter";
import { eventBus } from "@/lib/services/event-store";

export interface LicenseServiceConfig {
  civilDefense?: {
    enabled: boolean;
    apiEndpoint?: string;
    apiKey?: string;
    environment?: "production" | "sandbox";
  };
  abalady?: {
    enabled: boolean;
    apiEndpoint?: string;
    apiKey?: string;
    environment?: "production" | "sandbox";
  };
  renewalReminderDays?: number; // Days before expiry to send reminder
}

export class LicenseService {
  private civilDefenseAdapter?: CivilDefenseAdapter;
  private abaladyAdapter?: AbaladyAdapter;
  private config: LicenseServiceConfig;

  private licenses: Map<string, FacilityLicense> = new Map();
  private permits: Map<string, FacilityPermit> = new Map();
  private certifications: Map<string, FacilityCertification> = new Map();

  constructor(config: LicenseServiceConfig = {}) {
    this.config = { renewalReminderDays: 30, ...config };

    if (
      this.config.civilDefense?.enabled &&
      this.config.civilDefense.apiEndpoint &&
      this.config.civilDefense.apiKey
    ) {
      this.civilDefenseAdapter = new CivilDefenseAdapter({
        apiEndpoint: this.config.civilDefense.apiEndpoint,
        apiKey: this.config.civilDefense.apiKey,
        environment: this.config.civilDefense.environment || "sandbox",
      });
    }

    if (
      this.config.abalady?.enabled &&
      this.config.abalady.apiEndpoint &&
      this.config.abalady.apiKey
    ) {
      this.abaladyAdapter = new AbaladyAdapter({
        apiEndpoint: this.config.abalady.apiEndpoint,
        apiKey: this.config.abalady.apiKey,
        environment: this.config.abalady.environment || "sandbox",
      });
    }

    this.startRenewalMonitoring();
  }

  async getLicenses(facilityId: string): Promise<FacilityLicense[]> {
    return Array.from(this.licenses.values()).filter(
      (l) => l.facilityId === facilityId,
    );
  }

  async getLicense(licenseId: string): Promise<FacilityLicense | null> {
    return this.licenses.get(licenseId) || null;
  }

  async createLicense(
    license: Omit<FacilityLicense, "id" | "createdAt" | "updatedAt">,
  ): Promise<FacilityLicense> {
    const newLicense: FacilityLicense = {
      ...license,
      id: `license-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.licenses.set(newLicense.id, newLicense);

    await eventBus.publish("facility.license.created", {
      licenseId: newLicense.id,
      facilityId: newLicense.facilityId,
      licenseType: newLicense.licenseType,
    });

    return newLicense;
  }

  async updateLicense(
    licenseId: string,
    updates: Partial<FacilityLicense>,
  ): Promise<FacilityLicense> {
    const license = this.licenses.get(licenseId);
    if (!license) throw new Error(`License ${licenseId} not found`);

    const updated: FacilityLicense = {
      ...license,
      ...updates,
      updatedAt: new Date(),
    };
    this.licenses.set(licenseId, updated);

    await eventBus.publish("facility.license.updated", {
      licenseId,
      facilityId: updated.facilityId,
      status: updated.status,
    });

    return updated;
  }

  async getPermits(facilityId: string): Promise<FacilityPermit[]> {
    return Array.from(this.permits.values()).filter(
      (p) => p.facilityId === facilityId,
    );
  }

  async getCertifications(
    facilityId: string,
  ): Promise<FacilityCertification[]> {
    return Array.from(this.certifications.values()).filter(
      (c) => c.facilityId === facilityId,
    );
  }

  async checkCompliance(facilityId: string): Promise<{
    facilityId: string;
    complianceScore: number;
    violations: string[];
    expiringLicenses: FacilityLicense[];
  }> {
    const licenses = await this.getLicenses(facilityId);
    const now = new Date();
    const expiringLicenses = licenses.filter(
      (l) =>
        l.expiryDate &&
        new Date(l.expiryDate) <
          new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    );

    const violations: string[] = [];
    let score = 100;

    for (const l of licenses) {
      if (l.status === ("expired" as LicenseStatus)) {
        violations.push(`Expired license: ${l.licenseNumber}`);
        score -= 20;
      }
    }
    score = Math.max(0, Math.min(100, score - expiringLicenses.length * 5));

    return { facilityId, complianceScore: score, violations, expiringLicenses };
  }

  async syncWithAuthorities(
    facilityId: string,
    licenseType?: LicenseType,
  ): Promise<{ synced: boolean; sources: string[] }> {
    const sources: string[] = [];
    // Best-effort: only sync when adapters are configured
    if (this.civilDefenseAdapter) sources.push("civil-defense");
    if (this.abaladyAdapter) sources.push("abalady");

    // Integrations would be invoked here; keep it safe for now.
    await eventBus.publish("facility.license.sync.requested", {
      facilityId,
      licenseType,
      sources,
    });
    return { synced: sources.length > 0, sources };
  }

  private async checkExpiringLicenses(): Promise<void> {
    // In-memory service: no tenant store yet; this is a safe no-op for prod builds.
    // The UI/API should use a persistent backing store in production deployments.
  }

  private startRenewalMonitoring(): void {
    // Check for expiring licenses daily (best-effort, non-blocking)
    setInterval(
      async () => {
        try {
          await this.checkExpiringLicenses();
        } catch (error) {
          console.error("Error checking expiring licenses:", error);
        }
      },
      24 * 60 * 60 * 1000,
    );
  }
}

let licenseServiceInstance: LicenseService | null = null;

export function getLicenseService(
  config?: LicenseServiceConfig,
): LicenseService {
  if (!licenseServiceInstance) {
    licenseServiceInstance = new LicenseService(config);
  }
  return licenseServiceInstance;
}
