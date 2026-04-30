/**
 * SFDA License Service
 * Handles SFDA license applications and management for food, medicine, and related products
 */

import {
  SFDALicense,
  ProductCategory,
  CountryCode,
  TestResult,
} from "@/types/trade-compliance";

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

class SFDAStore {
  private licenses: Map<string, SFDALicense> = new Map();

  getLicense(id: string): SFDALicense | undefined {
    return this.licenses.get(id);
  }

  setLicense(license: SFDALicense): void {
    this.licenses.set(license.id, license);
  }

  getLicensesByProduct(productName: string): SFDALicense[] {
    return Array.from(this.licenses.values()).filter(
      (l) => l.productName === productName,
    );
  }

  getLicensesByType(licenseType: SFDALicense["licenseType"]): SFDALicense[] {
    return Array.from(this.licenses.values()).filter(
      (l) => l.licenseType === licenseType,
    );
  }
}

const store = new SFDAStore();

// ============================================================================
// LICENSE MANAGEMENT
// ============================================================================

/**
 * Apply for SFDA license
 */
export async function applyForSFDALicense(
  data: Omit<
    SFDALicense,
    | "id"
    | "licenseNumber"
    | "applicationDate"
    | "status"
    | "requiredDocuments"
    | "submittedDocuments"
    | "testResults"
  >,
): Promise<SFDALicense> {
  const id = `sfda-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const licenseNumber = `SFDA-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const now = new Date().toISOString();

  // Determine required documents based on license type
  const requiredDocuments = getRequiredDocumentsForLicenseType(
    data.licenseType,
    data.productCategory,
  );

  const license: SFDALicense = {
    ...data,
    id,
    licenseNumber,
    applicationDate: now,
    status: "APPLIED",
    requiredDocuments,
    submittedDocuments: [],
    testResults: [],
  };

  store.setLicense(license);

  // Simulate processing (in production, this would call SFDA API)
  setTimeout(() => {
    processSFDAApplication(license.id);
  }, 1000);

  return license;
}

/**
 * Process SFDA application (simulated)
 */
async function processSFDAApplication(licenseId: string): Promise<void> {
  const license = store.getLicense(licenseId);
  if (!license) return;

  // Simulate review process
  setTimeout(() => {
    const updated: SFDALicense = {
      ...license,
      status: "UNDER_REVIEW",
    };
    store.setLicense(updated);
  }, 2000);

  // Simulate testing phase
  setTimeout(() => {
    const testResults = generateTestResults(
      license.licenseType,
      license.productCategory,
    );
    const updated: SFDALicense = {
      ...license,
      testResults,
    };
    store.setLicense(updated);
  }, 5000);

  // Simulate approval after testing
  setTimeout(() => {
    const updated: SFDALicense = {
      ...license,
      status: "APPROVED",
      issueDate: new Date().toISOString(),
      expiryDate: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 1 year
    };
    store.setLicense(updated);
  }, 10000);
}

/**
 * Get required documents for license type
 */
function getRequiredDocumentsForLicenseType(
  licenseType: SFDALicense["licenseType"],
  productCategory: ProductCategory,
): string[] {
  const baseDocuments = [
    "Product Specification",
    "Manufacturing Certificate",
    "Certificate of Analysis",
  ];

  const typeSpecificDocuments: Record<SFDALicense["licenseType"], string[]> = {
    FOOD: [
      "Food Safety Certificate",
      "Nutritional Information",
      "Ingredient List",
      "Allergen Information",
      "Halal Certificate (if applicable)",
    ],
    MEDICINE: [
      "Drug Registration Certificate",
      "Clinical Trial Data",
      "Pharmacological Data",
      "Manufacturing License",
      "GMP Certificate",
      "Stability Data",
    ],
    COSMETICS: [
      "Cosmetic Safety Assessment",
      "Ingredient List",
      "Labeling Information",
      "Microbiological Test Results",
    ],
    MEDICAL_DEVICE: [
      "Medical Device Registration",
      "Technical Documentation",
      "Risk Assessment",
      "Clinical Evaluation",
      "Quality Management Certificate",
    ],
  };

  return [...baseDocuments, ...(typeSpecificDocuments[licenseType] || [])];
}

/**
 * Generate test results (simulated)
 */
function generateTestResults(
  licenseType: SFDALicense["licenseType"],
  productCategory: ProductCategory,
): TestResult[] {
  const testTypes: Record<SFDALicense["licenseType"], string[]> = {
    FOOD: [
      "Microbiological Analysis",
      "Chemical Composition",
      "Heavy Metals",
      "Pesticide Residues",
      "Additives Analysis",
    ],
    MEDICINE: [
      "Identity Test",
      "Assay",
      "Impurities",
      "Dissolution",
      "Microbiological Test",
      "Stability Test",
    ],
    COSMETICS: [
      "Microbiological Test",
      "Heavy Metals",
      "pH Test",
      "Preservative Efficacy",
    ],
    MEDICAL_DEVICE: [
      "Biocompatibility",
      "Sterility",
      "Performance Test",
      "Safety Test",
    ],
  };

  const tests = testTypes[licenseType] || [];

  return tests.map((testType) => ({
    testType,
    testDate: new Date().toISOString(),
    result: Math.random() > 0.1 ? "PASS" : "FAIL", // 90% pass rate
    certificateUrl: `https://sfda.gov.sa/certificates/${testType}-${Date.now()}.pdf`,
    notes:
      testType === "Microbiological Test"
        ? "All parameters within acceptable limits"
        : undefined,
  }));
}

/**
 * Update license status
 */
export async function updateSFDALicenseStatus(
  licenseId: string,
  status: SFDALicense["status"],
  rejectionReason?: string,
): Promise<SFDALicense> {
  const license = store.getLicense(licenseId);
  if (!license) {
    throw new Error(`SFDA license ${licenseId} not found`);
  }

  const updated: SFDALicense = {
    ...license,
    status,
    rejectionReason: rejectionReason || license.rejectionReason,
  };

  if (status === "APPROVED" && !updated.issueDate) {
    updated.issueDate = new Date().toISOString();
    updated.expiryDate = new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString();
  }

  store.setLicense(updated);
  return updated;
}

/**
 * Submit documents for license
 */
export async function submitSFDADocuments(
  licenseId: string,
  documentUrls: string[],
): Promise<SFDALicense> {
  const license = store.getLicense(licenseId);
  if (!license) {
    throw new Error(`SFDA license ${licenseId} not found`);
  }

  const updated: SFDALicense = {
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
 * Add test results
 */
export async function addTestResults(
  licenseId: string,
  testResults: TestResult[],
): Promise<SFDALicense> {
  const license = store.getLicense(licenseId);
  if (!license) {
    throw new Error(`SFDA license ${licenseId} not found`);
  }

  const updated: SFDALicense = {
    ...license,
    testResults: [...license.testResults, ...testResults],
  };

  // Check if all tests passed
  const allPassed = updated.testResults.every((tr) => tr.result === "PASS");
  if (allPassed && updated.status === "UNDER_REVIEW") {
    updated.status = "APPROVED";
    updated.issueDate = new Date().toISOString();
    updated.expiryDate = new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString();
  }

  store.setLicense(updated);
  return updated;
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const sfdaService = {
  applyForSFDALicense,
  updateSFDALicenseStatus,
  submitSFDADocuments,
  addTestResults,
  getLicense: (id: string) => store.getLicense(id),
  getLicensesByProduct: (productName: string) =>
    store.getLicensesByProduct(productName),
  getLicensesByType: (licenseType: SFDALicense["licenseType"]) =>
    store.getLicensesByType(licenseType),
};

export default sfdaService;
