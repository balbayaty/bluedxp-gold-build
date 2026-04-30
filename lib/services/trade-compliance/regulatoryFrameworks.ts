/**
 * Regulatory Framework Definitions
 * Comprehensive frameworks for Saudi Arabia, Middle East, and Global trade compliance
 */

import {
  RegulatoryFramework,
  FrameworkRequirement,
  ProductCategory,
  CountryCode,
  RegionCode,
  LicenseType,
} from "@/types/trade-compliance";

// ============================================================================
// SAUDI ARABIA REGULATORY FRAMEWORK
// ============================================================================

export const saudiArabiaFramework: RegulatoryFramework = {
  id: "saudi-arabia-framework",
  name: "Saudi Arabia Trade Compliance Framework",
  region: "GCC",
  countries: ["SA"],
  authority: "ZATCA",
  category: [
    "CHEMICALS",
    "FOOD",
    "MEDICINE",
    "ELECTRONICS",
    "MACHINERY",
    "TEXTILES",
    "AUTOMOTIVE",
    "CONSTRUCTION",
    "AGRICULTURE",
    "COSMETICS",
    "TOYS",
    "OTHER",
  ],
  requirements: [
    {
      id: "sa-001",
      requirement: "SABER Conformity Certificate",
      description:
        "All products imported to Saudi Arabia must have SABER conformity certificate",
      mandatory: true,
      applicableTo: [
        "ELECTRONICS",
        "MACHINERY",
        "TEXTILES",
        "AUTOMOTIVE",
        "CONSTRUCTION",
        "TOYS",
        "OTHER",
      ],
      licenseType: "SABER_CERTIFICATE",
      documentsRequired: [
        "Test Report",
        "Certificate of Conformity",
        "Product Specification",
      ],
      conditions: ["Product must meet Saudi standards"],
      exemptions: ["Personal imports under certain value"],
    },
    {
      id: "sa-002",
      requirement: "Civil Defense License for Chemicals",
      description: "All chemical products require Civil Defense license",
      mandatory: true,
      applicableTo: ["CHEMICALS"],
      licenseType: "CIVIL_DEFENSE_CHEMICAL",
      documentsRequired: [
        "MSDS",
        "Storage Plan",
        "Safety Certificate",
        "Fire Safety Plan",
      ],
      conditions: [
        "Must have proper storage facilities",
        "Must have safety equipment",
      ],
      exemptions: [],
    },
    {
      id: "sa-003",
      requirement: "SFDA License for Food Products",
      description: "All food products require SFDA license",
      mandatory: true,
      applicableTo: ["FOOD"],
      licenseType: "SFDA_FOOD",
      documentsRequired: [
        "Product Specification",
        "Test Results",
        "Manufacturing Certificate",
        "Halal Certificate",
      ],
      conditions: [
        "Must meet food safety standards",
        "Must have proper labeling",
      ],
      exemptions: ["Personal imports under certain quantity"],
    },
    {
      id: "sa-004",
      requirement: "SFDA License for Medicines",
      description: "All medicines require SFDA license",
      mandatory: true,
      applicableTo: ["MEDICINE"],
      licenseType: "SFDA_MEDICINE",
      documentsRequired: [
        "Drug Registration",
        "Clinical Data",
        "Manufacturing License",
        "GMP Certificate",
      ],
      conditions: [
        "Must meet pharmaceutical standards",
        "Must have proper documentation",
      ],
      exemptions: [],
    },
    {
      id: "sa-005",
      requirement: "Customs Clearance",
      description: "All imports/exports require customs clearance",
      mandatory: true,
      applicableTo: [
        "CHEMICALS",
        "FOOD",
        "MEDICINE",
        "ELECTRONICS",
        "MACHINERY",
        "TEXTILES",
        "AUTOMOTIVE",
        "CONSTRUCTION",
        "AGRICULTURE",
        "COSMETICS",
        "TOYS",
        "OTHER",
      ],
      licenseType: "CUSTOMS_CLEARANCE",
      documentsRequired: [
        "Commercial Invoice",
        "Packing List",
        "Bill of Lading",
        "Certificate of Origin",
      ],
      conditions: ["Must pay customs duties", "Must pay VAT"],
      exemptions: ["GCC origin products"],
    },
    {
      id: "sa-006",
      requirement: "Import License",
      description: "Commercial imports require import license",
      mandatory: true,
      applicableTo: [
        "CHEMICALS",
        "FOOD",
        "MEDICINE",
        "ELECTRONICS",
        "MACHINERY",
        "TEXTILES",
        "AUTOMOTIVE",
        "CONSTRUCTION",
        "AGRICULTURE",
        "COSMETICS",
        "TOYS",
        "OTHER",
      ],
      licenseType: "IMPORT_LICENSE",
      documentsRequired: [
        "Commercial Registration",
        "Import Permit Application",
      ],
      conditions: ["Must be registered business"],
      exemptions: ["Personal imports"],
    },
  ],
  lastUpdated: new Date().toISOString(),
  version: "1.0.0",
};

// ============================================================================
// GCC REGULATORY FRAMEWORK
// ============================================================================

export const gccFramework: RegulatoryFramework = {
  id: "gcc-framework",
  name: "GCC Trade Compliance Framework",
  region: "GCC",
  countries: ["SA", "AE", "KW", "QA", "BH", "OM"],
  authority: "GCC" as any,
  category: [
    "CHEMICALS",
    "FOOD",
    "MEDICINE",
    "ELECTRONICS",
    "MACHINERY",
    "TEXTILES",
    "AUTOMOTIVE",
    "CONSTRUCTION",
    "AGRICULTURE",
    "COSMETICS",
    "TOYS",
    "OTHER",
  ],
  requirements: [
    {
      id: "gcc-001",
      requirement: "GCC Conformity Mark",
      description:
        "Products must have GCC conformity mark for certain categories",
      mandatory: true,
      applicableTo: ["ELECTRONICS", "MACHINERY", "AUTOMOTIVE"],
      licenseType: "SABER_CERTIFICATE",
      documentsRequired: ["GCC Conformity Certificate"],
      conditions: ["Must meet GCC standards"],
      exemptions: [],
    },
    {
      id: "gcc-002",
      requirement: "Zero Customs Duty for GCC Origin",
      description:
        "Products originating from GCC countries have zero customs duty",
      mandatory: false,
      applicableTo: [
        "CHEMICALS",
        "FOOD",
        "MEDICINE",
        "ELECTRONICS",
        "MACHINERY",
        "TEXTILES",
        "AUTOMOTIVE",
        "CONSTRUCTION",
        "AGRICULTURE",
        "COSMETICS",
        "TOYS",
        "OTHER",
      ],
      licenseType: "CERTIFICATE_OF_ORIGIN",
      documentsRequired: ["Certificate of Origin"],
      conditions: ["Must have GCC origin certificate"],
      exemptions: [],
    },
  ],
  lastUpdated: new Date().toISOString(),
  version: "1.0.0",
};

// ============================================================================
// MIDDLE EAST REGULATORY FRAMEWORK
// ============================================================================

export const middleEastFramework: RegulatoryFramework = {
  id: "middle-east-framework",
  name: "Middle East Trade Compliance Framework",
  region: "MENA",
  countries: ["SA", "AE", "KW", "QA", "BH", "OM", "EG", "JO", "LB"],
  authority: "VARIOUS" as any,
  category: [
    "CHEMICALS",
    "FOOD",
    "MEDICINE",
    "ELECTRONICS",
    "MACHINERY",
    "TEXTILES",
    "AUTOMOTIVE",
    "CONSTRUCTION",
    "AGRICULTURE",
    "COSMETICS",
    "TOYS",
    "OTHER",
  ],
  requirements: [
    {
      id: "me-001",
      requirement: "Halal Certification for Food Products",
      description: "Food products may require Halal certification",
      mandatory: false,
      applicableTo: ["FOOD"],
      licenseType: "OTHER",
      documentsRequired: ["Halal Certificate"],
      conditions: ["Required for Muslim-majority countries"],
      exemptions: ["Non-food products"],
    },
    {
      id: "me-002",
      requirement: "Arabic Labeling",
      description: "Products must have Arabic labeling",
      mandatory: true,
      applicableTo: ["FOOD", "MEDICINE", "COSMETICS", "TOYS"],
      licenseType: "OTHER",
      documentsRequired: ["Product Labels in Arabic"],
      conditions: ["Required for consumer products"],
      exemptions: ["Industrial products"],
    },
  ],
  lastUpdated: new Date().toISOString(),
  version: "1.0.0",
};

// ============================================================================
// GLOBAL REGULATORY FRAMEWORK
// ============================================================================

export const globalFramework: RegulatoryFramework = {
  id: "global-framework",
  name: "Global Trade Compliance Framework",
  region: "GLOBAL",
  countries: ["US", "GB", "CN", "IN", "DE", "FR", "JP", "KR", "SG", "MY", "TH"],
  authority: "VARIOUS" as any,
  category: [
    "CHEMICALS",
    "FOOD",
    "MEDICINE",
    "ELECTRONICS",
    "MACHINERY",
    "TEXTILES",
    "AUTOMOTIVE",
    "CONSTRUCTION",
    "AGRICULTURE",
    "COSMETICS",
    "TOYS",
    "OTHER",
  ],
  requirements: [
    {
      id: "global-001",
      requirement: "Certificate of Origin",
      description:
        "Certificate of origin may be required for preferential treatment",
      mandatory: false,
      applicableTo: [
        "CHEMICALS",
        "FOOD",
        "MEDICINE",
        "ELECTRONICS",
        "MACHINERY",
        "TEXTILES",
        "AUTOMOTIVE",
        "CONSTRUCTION",
        "AGRICULTURE",
        "COSMETICS",
        "TOYS",
        "OTHER",
      ],
      licenseType: "CERTIFICATE_OF_ORIGIN",
      documentsRequired: ["Certificate of Origin"],
      conditions: ["Required for trade agreements"],
      exemptions: [],
    },
    {
      id: "global-002",
      requirement: "Phytosanitary Certificate",
      description: "Plant products require phytosanitary certificate",
      mandatory: true,
      applicableTo: ["AGRICULTURE"],
      licenseType: "PHYTOSANITARY",
      documentsRequired: ["Phytosanitary Certificate"],
      conditions: ["Required for plant products"],
      exemptions: ["Processed products"],
    },
    {
      id: "global-003",
      requirement: "Veterinary Certificate",
      description: "Animal products require veterinary certificate",
      mandatory: true,
      applicableTo: ["FOOD"],
      licenseType: "VETERINARY",
      documentsRequired: ["Veterinary Certificate", "Health Certificate"],
      conditions: ["Required for animal products"],
      exemptions: ["Processed products"],
    },
  ],
  lastUpdated: new Date().toISOString(),
  version: "1.0.0",
};

// ============================================================================
// FRAMEWORK REGISTRY
// ============================================================================

const frameworks: Map<string, RegulatoryFramework> = new Map();

frameworks.set(saudiArabiaFramework.id, saudiArabiaFramework);
frameworks.set(gccFramework.id, gccFramework);
frameworks.set(middleEastFramework.id, middleEastFramework);
frameworks.set(globalFramework.id, globalFramework);

/**
 * Get regulatory framework by ID
 */
export function getRegulatoryFramework(
  id: string,
): RegulatoryFramework | undefined {
  return frameworks.get(id);
}

/**
 * Get regulatory frameworks by country
 */
export function getFrameworksByCountry(
  country: CountryCode,
): RegulatoryFramework[] {
  return Array.from(frameworks.values()).filter((f) =>
    f.countries.includes(country),
  );
}

/**
 * Get regulatory frameworks by region
 */
export function getFrameworksByRegion(
  region: RegionCode,
): RegulatoryFramework[] {
  return Array.from(frameworks.values()).filter((f) => f.region === region);
}

/**
 * Get applicable requirements for trade
 */
export function getApplicableRequirements(
  originCountry: CountryCode,
  destinationCountry: CountryCode,
  productCategories: ProductCategory[],
): FrameworkRequirement[] {
  const requirements: FrameworkRequirement[] = [];

  // Get frameworks for both countries
  const originFrameworks = getFrameworksByCountry(originCountry);
  const destinationFrameworks = getFrameworksByCountry(destinationCountry);

  // Combine and filter by product categories
  const allFrameworks = [...originFrameworks, ...destinationFrameworks];

  for (const framework of allFrameworks) {
    for (const requirement of framework.requirements) {
      if (
        requirement.applicableTo.some((cat) => productCategories.includes(cat))
      ) {
        requirements.push(requirement);
      }
    }
  }

  return requirements;
}

// ============================================================================
// EXPORTS
// ============================================================================
// All frameworks are already exported individually above

export const regulatoryFrameworksService = {
  getRegulatoryFramework,
  getFrameworksByCountry,
  getFrameworksByRegion,
  getApplicableRequirements,
};

export default regulatoryFrameworksService;
