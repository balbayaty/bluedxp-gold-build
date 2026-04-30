/**
 * Civil Defense License Service
 * Handles Civil Defense license applications and management for chemical products
 */

import {
  CivilDefenseLicense,
  ProductCategory,
  HazardClass,
  CountryCode,
} from "@/types/trade-compliance";

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

class CivilDefenseStore {
  private licenses: Map<string, CivilDefenseLicense> = new Map();

  getLicense(id: string): CivilDefenseLicense | undefined {
    return this.licenses.get(id);
  }

  setLicense(license: CivilDefenseLicense): void {
    this.licenses.set(license.id, license);
  }

  getLicensesByApplicant(applicantName: string): CivilDefenseLicense[] {
    return Array.from(this.licenses.values()).filter(
      (l) => l.applicantName === applicantName,
    );
  }
}

const store = new CivilDefenseStore();

// ============================================================================
// LICENSE MANAGEMENT
// ============================================================================

/**
 * Apply for Civil Defense license
 */
export async function applyForCivilDefenseLicense(
  data: Omit<
    CivilDefenseLicense,
    | "id"
    | "licenseNumber"
    | "applicationDate"
    | "status"
    | "requiredDocuments"
    | "submittedDocuments"
  >,
): Promise<CivilDefenseLicense> {
  const id = `cdl-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const licenseNumber = `CD-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const now = new Date().toISOString();

  // Determine required documents based on chemical type
  const requiredDocuments = getRequiredDocumentsForChemical(
    data.hazardClass,
    data.chemicalName,
  );

  const license: CivilDefenseLicense = {
    ...data,
    id,
    licenseNumber,
    applicationDate: now,
    status: "APPLIED",
    requiredDocuments,
    submittedDocuments: [],
  };

  store.setLicense(license);

  // Simulate processing (in production, this would call Civil Defense API)
  setTimeout(() => {
    processLicenseApplication(license.id);
  }, 1000);

  return license;
}

/**
 * Process license application (simulated)
 */
async function processLicenseApplication(licenseId: string): Promise<void> {
  const license = store.getLicense(licenseId);
  if (!license) return;

  // Simulate review process
  setTimeout(() => {
    const updated: CivilDefenseLicense = {
      ...license,
      status: "UNDER_REVIEW",
    };
    store.setLicense(updated);
  }, 2000);

  // Simulate approval after review period
  setTimeout(() => {
    const updated: CivilDefenseLicense = {
      ...license,
      status: "APPROVED",
      issueDate: new Date().toISOString(),
      expiryDate: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 1 year
      inspectionDate: new Date().toISOString(),
      inspectionResult: "PASSED",
    };
    store.setLicense(updated);
  }, 5000);
}

/**
 * Get required documents for chemical
 */
function getRequiredDocumentsForChemical(
  hazardClass: HazardClass,
  chemicalName: string,
): string[] {
  const baseDocuments = [
    "MSDS (Material Safety Data Sheet)",
    "Storage Plan",
    "Safety Certificate",
    "Fire Safety Plan",
    "Emergency Response Plan",
  ];

  const additionalDocuments: Record<HazardClass, string[]> = {
    EXPLOSIVE: ["Explosive Storage Certificate", "Security Plan"],
    FLAMMABLE: ["Fire Prevention Certificate", "Ventilation Plan"],
    TOXIC: ["Toxic Substance Handling Certificate", "Medical Emergency Plan"],
    CORROSIVE: [
      "Corrosion Prevention Plan",
      "Personal Protective Equipment Certificate",
    ],
    OXIDIZING: ["Oxidizing Agent Storage Certificate"],
    RADIOACTIVE: ["Radiation Safety Certificate", "Radiation Monitoring Plan"],
    NON_HAZARDOUS: [],
  };

  return [...baseDocuments, ...(additionalDocuments[hazardClass] || [])];
}

/**
 * Update license status
 */
export async function updateLicenseStatus(
  licenseId: string,
  status: CivilDefenseLicense["status"],
  notes?: string,
): Promise<CivilDefenseLicense> {
  const license = store.getLicense(licenseId);
  if (!license) {
    throw new Error(`Civil Defense license ${licenseId} not found`);
  }

  const updated: CivilDefenseLicense = {
    ...license,
    status,
    notes: notes || license.notes,
  };

  store.setLicense(updated);
  return updated;
}

/**
 * Submit documents for license
 */
export async function submitDocuments(
  licenseId: string,
  documentUrls: string[],
): Promise<CivilDefenseLicense> {
  const license = store.getLicense(licenseId);
  if (!license) {
    throw new Error(`Civil Defense license ${licenseId} not found`);
  }

  const updated: CivilDefenseLicense = {
    ...license,
    submittedDocuments: [...license.submittedDocuments, ...documentUrls],
  };

  // Check if all required documents are submitted
  const allSubmitted = updated.requiredDocuments.every((doc) =>
    updated.submittedDocuments.some((submitted) => submitted.includes(doc)),
  );

  if (allSubmitted && updated.status === "APPLIED") {
    updated.status = "UNDER_REVIEW";
  }

  store.setLicense(updated);
  return updated;
}

/**
 * Schedule inspection
 */
export async function scheduleInspection(
  licenseId: string,
  inspectionDate: string,
): Promise<CivilDefenseLicense> {
  const license = store.getLicense(licenseId);
  if (!license) {
    throw new Error(`Civil Defense license ${licenseId} not found`);
  }

  const updated: CivilDefenseLicense = {
    ...license,
    inspectionDate,
  };

  store.setLicense(updated);
  return updated;
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const civilDefenseService = {
  applyForCivilDefenseLicense,
  updateLicenseStatus,
  submitDocuments,
  scheduleInspection,
  getLicense: (id: string) => store.getLicense(id),
  getLicensesByApplicant: (applicantName: string) =>
    store.getLicensesByApplicant(applicantName),
};

export default civilDefenseService;
